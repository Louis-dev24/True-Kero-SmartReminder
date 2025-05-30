import { storage } from './storage';
import { sendEmail, generateReminderEmailHtml } from './emailService';
import type { Client, ReminderLog } from '@shared/schema';

export interface ReminderCheck {
  client: Client;
  daysTillExpiration: number;
  expirationDate: Date;
}

export async function findClientsNeedingReminders(userId: string, daysBefore: number = 30): Promise<ReminderCheck[]> {
  const clients = await storage.getClients(userId);
  const today = new Date();
  const checkDate = new Date();
  checkDate.setDate(today.getDate() + daysBefore);
  
  const needingReminders: ReminderCheck[] = [];
  
  for (const client of clients) {
    if (client.nextInspectionDate) {
      const expirationDate = new Date(client.nextInspectionDate);
      const daysTillExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Si le contrôle expire dans les prochains jours
      if (daysTillExpiration > 0 && daysTillExpiration <= daysBefore) {
        // Vérifier si un rappel n'a pas déjà été envoyé récemment
        const recentReminders = await storage.getReminderLogs(userId, client.id);
        const lastReminder = recentReminders
          .filter(log => log.type === 'email' && log.status === 'sent')
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
        
        const shouldSendReminder = !lastReminder || 
          (new Date().getTime() - new Date(lastReminder.createdAt || 0).getTime()) > (7 * 24 * 60 * 60 * 1000); // 7 jours
        
        if (shouldSendReminder) {
          needingReminders.push({
            client,
            daysTillExpiration,
            expirationDate
          });
        }
      }
    }
  }
  
  return needingReminders;
}

export async function sendReminderEmail(userId: string, reminderCheck: ReminderCheck, centerName: string): Promise<boolean> {
  const { client, expirationDate } = reminderCheck;
  
  if (!client.email) {
    console.log(`Client ${client.firstName} ${client.lastName} has no email address`);
    return false;
  }
  
  const subject = `Rappel : Contrôle technique à renouveler - ${client.firstName} ${client.lastName}`;
  const html = generateReminderEmailHtml(
    `${client.firstName} ${client.lastName}`,
    centerName,
    expirationDate.toLocaleDateString('fr-FR')
  );
  
  const result = await sendEmail({
    to: client.email,
    subject,
    html
  });
  
  // Enregistrer le log du rappel
  await storage.createReminderLog({
    userId,
    clientId: client.id,
    type: 'email',
    status: result.success ? 'sent' : 'failed',
    content: subject,
    errorMessage: result.error || undefined
  });
  
  return result.success;
}

export async function processAutomaticReminders(userId: string): Promise<{ sent: number; failed: number; total: number }> {
  try {
    // Récupérer les paramètres du centre (pour le nom)
    const user = await storage.getUser(userId);
    const centerName = user?.centerName || 'Centre de contrôle technique';
    
    // Trouver les clients nécessitant des rappels
    const remindersNeeded = await findClientsNeedingReminders(userId, 30);
    
    let sent = 0;
    let failed = 0;
    
    for (const reminder of remindersNeeded) {
      const success = await sendReminderEmail(userId, reminder, centerName);
      if (success) {
        sent++;
      } else {
        failed++;
      }
      
      // Petite pause entre les envois pour éviter les limites de taux
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return {
      sent,
      failed,
      total: remindersNeeded.length
    };
  } catch (error) {
    console.error('Error processing automatic reminders:', error);
    return { sent: 0, failed: 0, total: 0 };
  }
}