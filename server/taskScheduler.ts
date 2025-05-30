import { storage } from "./storage";
import { sendEmail } from "./emailService";
import { sendSMS } from "./smsService";
import { createTemplateVariables, replaceTemplateVariables } from "./templateService";

export interface ScheduledTask {
  id: string;
  userId: string;
  type: 'reminder_check' | 'reminder_send' | 'report_generation';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // "09:00"
  enabled: boolean;
  lastRun?: Date;
  nextRun: Date;
  config?: any;
}

export interface ReminderTaskResult {
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

export class TaskScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.loadDefaultTasks();
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("TaskScheduler started");
    
    // Vérifier les tâches toutes les minutes
    this.intervalId = setInterval(() => {
      this.checkAndExecuteTasks();
    }, 60000);
    
    // Exécution immédiate pour vérifier les tâches en retard
    this.checkAndExecuteTasks();
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log("TaskScheduler stopped");
  }

  private loadDefaultTasks() {
    // Tâche quotidienne de vérification des rappels à 9h
    this.addTask({
      id: 'daily_reminder_check',
      userId: 'system',
      type: 'reminder_check',
      frequency: 'daily',
      time: '09:00',
      enabled: true,
      nextRun: this.calculateNextRun('daily', '09:00'),
      config: {
        daysBefore: [30, 7, 1], // Vérifier les rappels à 30, 7 et 1 jour
        types: ['email', 'sms']
      }
    });

    // Tâche quotidienne d'envoi des rappels à 10h
    this.addTask({
      id: 'daily_reminder_send',
      userId: 'system',
      type: 'reminder_send',
      frequency: 'daily',
      time: '10:00',
      enabled: true,
      nextRun: this.calculateNextRun('daily', '10:00'),
      config: {
        maxPerUser: 50, // Limite d'envois par utilisateur
        retryFailed: true
      }
    });
  }

  addTask(task: ScheduledTask) {
    this.tasks.set(task.id, task);
    console.log(`Task added: ${task.id} - Next run: ${task.nextRun}`);
  }

  removeTask(taskId: string) {
    this.tasks.delete(taskId);
    console.log(`Task removed: ${taskId}`);
  }

  getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  enableTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
      console.log(`Task enabled: ${taskId}`);
    }
  }

  disableTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
      console.log(`Task disabled: ${taskId}`);
    }
  }

  private async checkAndExecuteTasks() {
    const now = new Date();
    
    const taskEntries = Array.from(this.tasks.entries());
    for (const [taskId, task] of taskEntries) {
      if (!task.enabled) continue;
      
      if (now >= task.nextRun) {
        try {
          console.log(`Executing task: ${taskId}`);
          await this.executeTask(task);
          
          // Programmer la prochaine exécution
          task.lastRun = now;
          task.nextRun = this.calculateNextRun(task.frequency, task.time, now);
          
          console.log(`Task completed: ${taskId} - Next run: ${task.nextRun}`);
        } catch (error) {
          console.error(`Task execution failed: ${taskId}`, error);
          
          // Reprogrammer avec un délai en cas d'erreur
          task.nextRun = new Date(now.getTime() + 30 * 60000); // 30 minutes
        }
      }
    }
  }

  private async executeTask(task: ScheduledTask): Promise<any> {
    switch (task.type) {
      case 'reminder_check':
        return this.executeReminderCheck(task);
      case 'reminder_send':
        return this.executeReminderSend(task);
      case 'report_generation':
        return this.executeReportGeneration(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async executeReminderCheck(task: ScheduledTask): Promise<ReminderTaskResult> {
    const result: ReminderTaskResult = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: []
    };

    try {
      // Récupérer tous les utilisateurs actifs
      const users = await this.getAllActiveUsers();
      
      for (const user of users) {
        try {
          // Récupérer les modèles de rappels actifs
          const templates = await storage.getReminderTemplates(user.id);
          const activeTemplates = templates.filter(t => t.isActive);

          for (const template of activeTemplates) {
            const clientsNeedingReminders = await this.findClientsNeedingReminders(
              user.id, 
              template.daysBefore
            );

            for (const client of clientsNeedingReminders) {
              result.processed++;
              
              // Vérifier si un rappel a déjà été envoyé récemment
              const recentReminder = await this.checkRecentReminder(
                user.id, 
                client.id, 
                template.id, 
                template.daysBefore
              );

              if (!recentReminder) {
                // Créer une entrée dans la queue d'envoi
                await this.queueReminder(user, client, template);
                console.log(`Queued reminder: User ${user.id}, Client ${client.id}, Template ${template.id}`);
              }
            }
          }
        } catch (userError) {
          console.error(`Error processing user ${user.id}:`, userError);
          result.errors.push(`User ${user.id}: ${userError}`);
        }
      }

      console.log(`Reminder check completed: ${result.processed} clients processed`);
      return result;
    } catch (error) {
      console.error("Reminder check failed:", error);
      result.errors.push(`Global error: ${error}`);
      return result;
    }
  }

  private async executeReminderSend(task: ScheduledTask): Promise<ReminderTaskResult> {
    const result: ReminderTaskResult = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: []
    };

    try {
      // Récupérer les rappels en attente d'envoi
      const pendingReminders = await this.getPendingReminders(task.config?.maxPerUser || 50);
      
      for (const reminder of pendingReminders) {
        result.processed++;
        
        try {
          const success = await this.sendQueuedReminder(reminder);
          
          if (success) {
            result.sent++;
            await this.markReminderAsSent(reminder.id);
          } else {
            result.failed++;
            await this.markReminderAsFailed(reminder.id, "Send failed");
          }
        } catch (sendError) {
          result.failed++;
          const errorMsg = sendError instanceof Error ? sendError.message : String(sendError);
          result.errors.push(`Reminder ${reminder.id}: ${errorMsg}`);
          await this.markReminderAsFailed(reminder.id, errorMsg);
        }
      }

      console.log(`Reminder send completed: ${result.sent} sent, ${result.failed} failed`);
      return result;
    } catch (error) {
      console.error("Reminder send failed:", error);
      result.errors.push(`Global error: ${error}`);
      return result;
    }
  }

  private async executeReportGeneration(task: ScheduledTask): Promise<any> {
    // Implémentation future pour la génération automatique de rapports
    console.log("Report generation task executed");
    return { generated: 0 };
  }

  private calculateNextRun(frequency: string, time: string, from?: Date): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const baseDate = from || new Date();
    
    const nextRun = new Date(baseDate);
    nextRun.setHours(hours, minutes, 0, 0);
    
    // Si l'heure est déjà passée aujourd'hui, programmer pour le prochain cycle
    if (nextRun <= baseDate) {
      switch (frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
    }
    
    return nextRun;
  }

  private async getAllActiveUsers(): Promise<any[]> {
    // Simuler la récupération des utilisateurs actifs
    // Dans une vraie implémentation, récupérer depuis la base de données
    return [{ id: "42042509" }]; // Utilisateur de test
  }

  private async findClientsNeedingReminders(userId: string, daysBefore: number): Promise<any[]> {
    const clients = await storage.getClients(userId);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBefore);
    
    return clients.filter(client => {
      if (!client.nextInspectionDate) return false;
      
      const expirationDate = new Date(client.nextInspectionDate);
      const diffTime = expirationDate.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays === daysBefore;
    });
  }

  private async checkRecentReminder(userId: string, clientId: number, templateId: number, daysBefore: number): Promise<boolean> {
    const logs = await storage.getReminderLogs(userId, clientId);
    const recentThreshold = new Date();
    recentThreshold.setHours(recentThreshold.getHours() - 24); // 24h de grâce
    
    return logs.some(log => 
      log.templateId === templateId && 
      log.sentAt && 
      new Date(log.sentAt) > recentThreshold
    );
  }

  private async queueReminder(user: any, client: any, template: any): Promise<void> {
    // Créer l'entrée de rappel dans les logs avec statut "pending"
    await storage.createReminderLog({
      userId: user.id,
      clientId: client.id,
      templateId: template.id,
      type: template.type,
      status: 'pending',
      content: template.content
    });
  }

  private async getPendingReminders(limit: number): Promise<any[]> {
    // Récupérer les rappels avec statut "pending"
    const allLogs = await storage.getReminderLogs("42042509"); // Utilisateur de test
    return allLogs
      .filter(log => log.status === 'pending')
      .slice(0, limit);
  }

  private async sendQueuedReminder(reminder: any): Promise<boolean> {
    try {
      // Récupérer les détails du client et de l'utilisateur
      const client = await storage.getClient(reminder.clientId, reminder.userId);
      const user = await storage.getUser(reminder.userId);
      
      if (!client || !user) return false;

      // Calculer les variables du template
      const expirationDate = new Date(client.nextInspectionDate || Date.now());
      const daysLeft = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      const variables = createTemplateVariables(client, user, daysLeft, expirationDate);
      const content = replaceTemplateVariables(reminder.content, variables);

      if (reminder.type === 'email') {
        const subject = replaceTemplateVariables(
          "Rappel : Contrôle technique - {CLIENT_NAME}", 
          variables
        );
        
        const result = await sendEmail({
          to: client.email || '',
          subject,
          html: content.replace(/\n/g, '<br>')
        });
        
        return result.success;
      } else if (reminder.type === 'sms') {
        const result = await sendSMS({
          to: client.phone,
          message: content
        });
        
        return result.success;
      }
      
      return false;
    } catch (error) {
      console.error("Error sending queued reminder:", error);
      return false;
    }
  }

  private async markReminderAsSent(reminderId: number): Promise<void> {
    // Mettre à jour le statut en base de données
    // Implémentation simplifiée
    console.log(`Reminder ${reminderId} marked as sent`);
  }

  private async markReminderAsFailed(reminderId: number, error: string): Promise<void> {
    // Mettre à jour le statut en base de données
    // Implémentation simplifiée
    console.log(`Reminder ${reminderId} marked as failed: ${error}`);
  }

  // Méthodes publiques pour l'API
  getTaskStatus(): any {
    return {
      isRunning: this.isRunning,
      taskCount: this.tasks.size,
      tasks: this.getAllTasks().map(task => ({
        id: task.id,
        type: task.type,
        frequency: task.frequency,
        time: task.time,
        enabled: task.enabled,
        lastRun: task.lastRun,
        nextRun: task.nextRun
      }))
    };
  }

  async executeTaskManually(taskId: string): Promise<any> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    console.log(`Manually executing task: ${taskId}`);
    return this.executeTask(task);
  }
}

// Instance globale du planificateur
export const taskScheduler = new TaskScheduler();