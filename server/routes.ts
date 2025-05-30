import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { taskScheduler } from "./taskScheduler";
import {
  insertClientSchema,
  insertAppointmentSchema,
  insertReminderTemplateSchema,
  insertCenterSettingsSchema,
  publicBookingSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/upcoming-appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointments = await storage.getUpcomingAppointments(userId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
      res.status(500).json({ message: "Failed to fetch upcoming appointments" });
    }
  });

  // Client routes
  app.get('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { search, status } = req.query;
      const clients = await storage.getClients(userId, search, status);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId, userId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientData = insertClientSchema.parse({ ...req.body, userId });
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientId = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(clientId, clientData, userId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientId = parseInt(req.params.id);
      const success = await storage.deleteClient(clientId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Appointment routes
  app.get('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      
      const appointments = await storage.getAppointments(userId, start, end);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentId = parseInt(req.params.id);
      const appointment = await storage.getAppointment(appointmentId, userId);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentData = insertAppointmentSchema.parse({ ...req.body, userId });
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.put('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentId = parseInt(req.params.id);
      const appointmentData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(appointmentId, appointmentData, userId);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentId = parseInt(req.params.id);
      const success = await storage.deleteAppointment(appointmentId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Reminder template routes
  app.get('/api/reminder-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getReminderTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching reminder templates:", error);
      res.status(500).json({ message: "Failed to fetch reminder templates" });
    }
  });

  app.post('/api/reminder-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateData = insertReminderTemplateSchema.parse({ ...req.body, userId });
      const template = await storage.createReminderTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating reminder template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reminder template" });
    }
  });

  app.put('/api/reminder-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateId = parseInt(req.params.id);
      const templateData = insertReminderTemplateSchema.partial().parse(req.body);
      const template = await storage.updateReminderTemplate(templateId, templateData, userId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error updating reminder template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update reminder template" });
    }
  });

  app.delete('/api/reminder-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateId = parseInt(req.params.id);
      const success = await storage.deleteReminderTemplate(templateId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reminder template:", error);
      res.status(500).json({ message: "Failed to delete reminder template" });
    }
  });

  // Reminder logs routes
  app.get('/api/reminder-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientId } = req.query;
      const logs = await storage.getReminderLogs(userId, clientId ? parseInt(clientId) : undefined);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching reminder logs:", error);
      res.status(500).json({ message: "Failed to fetch reminder logs" });
    }
  });

  // Reminder routes
  app.get('/api/reminders/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { findClientsNeedingReminders } = await import('./reminderService');
      
      const remindersNeeded = await findClientsNeedingReminders(userId, 30);
      res.json(remindersNeeded);
    } catch (error) {
      console.error("Error checking reminders:", error);
      res.status(500).json({ message: "Failed to check reminders" });
    }
  });

  app.post('/api/reminders/send-manual', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientId } = req.body;
      
      if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
      }

      const { sendReminderEmail } = await import('./reminderService');
      const client = await storage.getClient(clientId, userId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      if (!client.nextInspectionDate) {
        return res.status(400).json({ message: "Client has no next inspection date" });
      }

      const user = await storage.getUser(userId);
      const centerName = user?.centerName || 'Centre de contrôle technique';
      
      const reminderCheck = {
        client,
        daysTillExpiration: Math.ceil((new Date(client.nextInspectionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        expirationDate: new Date(client.nextInspectionDate)
      };

      const success = await sendReminderEmail(userId, reminderCheck, centerName);
      
      if (success) {
        res.json({ message: "Reminder sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send reminder" });
      }
    } catch (error) {
      console.error("Error sending manual reminder:", error);
      res.status(500).json({ message: "Failed to send reminder" });
    }
  });

  app.post('/api/reminders/send-automatic', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { processAutomaticReminders } = await import('./reminderService');
      
      const result = await processAutomaticReminders(userId);
      res.json(result);
    } catch (error) {
      console.error("Error processing automatic reminders:", error);
      res.status(500).json({ message: "Failed to process automatic reminders" });
    }
  });

  // Send manual SMS reminder
  app.post('/api/reminders/send-sms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientId } = req.body;
      
      if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
      }

      const { sendReminderSMS } = await import('./reminderService');
      const client = await storage.getClient(clientId, userId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      if (!client.phone) {
        return res.status(400).json({ message: "Client has no phone number" });
      }

      if (!client.nextInspectionDate) {
        return res.status(400).json({ message: "Client has no next inspection date" });
      }

      const user = await storage.getUser(userId);
      const centerName = user?.centerName || 'Centre de contrôle technique';
      
      const reminderCheck = {
        client,
        daysTillExpiration: Math.ceil((new Date(client.nextInspectionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        expirationDate: new Date(client.nextInspectionDate)
      };

      const success = await sendReminderSMS(userId, reminderCheck, centerName);
      
      if (success) {
        res.json({ message: "SMS reminder sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send SMS reminder" });
      }
    } catch (error) {
      console.error("Error sending SMS reminder:", error);
      res.status(500).json({ message: "Failed to send SMS reminder" });
    }
  });

  // Test SMS endpoint
  app.post('/api/test-sms', isAuthenticated, async (req: any, res) => {
    try {
      const { phone, message } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({ message: "Phone number and message are required" });
      }

      const { sendSMS } = await import('./smsService');
      const result = await sendSMS({
        to: phone,
        message: message
      });

      if (result.success) {
        res.json({ 
          success: true, 
          message: "SMS sent successfully",
          messageId: result.messageId 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: result.error || "Failed to send SMS" 
        });
      }
    } catch (error: any) {
      console.error("Error sending test SMS:", error);
      res.status(500).json({ message: error.message || "Failed to send test SMS" });
    }
  });

  // Center settings routes
  app.get('/api/center-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getCenterSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching center settings:", error);
      res.status(500).json({ message: "Failed to fetch center settings" });
    }
  });

  app.put('/api/center-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settingsData = insertCenterSettingsSchema.parse({ ...req.body, userId });
      const settings = await storage.upsertCenterSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating center settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update center settings" });
    }
  });

  // Export routes
  app.get('/api/export/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const format = req.query.format as 'xlsx' | 'csv' | 'pdf' || 'xlsx';
      
      const { exportService } = await import('./exportService');
      const buffer = await exportService.exportClients(userId, { format });
      
      const contentType = format === 'pdf' ? 'application/pdf' : 
                         format === 'csv' ? 'text/csv' : 
                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      const filename = `clients_${new Date().toISOString().split('T')[0]}.${format}`;
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting clients:", error);
      res.status(500).json({ message: "Failed to export clients" });
    }
  });

  app.get('/api/export/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const format = req.query.format as 'xlsx' | 'csv' | 'pdf' || 'xlsx';
      const startDate = req.query.start ? new Date(req.query.start as string) : undefined;
      const endDate = req.query.end ? new Date(req.query.end as string) : undefined;
      
      const { exportService } = await import('./exportService');
      const buffer = await exportService.exportAppointments(userId, { 
        format,
        dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined
      });
      
      const contentType = format === 'pdf' ? 'application/pdf' : 
                         format === 'csv' ? 'text/csv' : 
                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      const filename = `appointments_${new Date().toISOString().split('T')[0]}.${format}`;
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting appointments:", error);
      res.status(500).json({ message: "Failed to export appointments" });
    }
  });

  app.get('/api/export/reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const format = req.query.format as 'xlsx' | 'csv' | 'pdf' || 'xlsx';
      
      const { exportService } = await import('./exportService');
      const buffer = await exportService.exportReminderLogs(userId, { format });
      
      const contentType = format === 'pdf' ? 'application/pdf' : 
                         format === 'csv' ? 'text/csv' : 
                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      const filename = `reminders_${new Date().toISOString().split('T')[0]}.${format}`;
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting reminders:", error);
      res.status(500).json({ message: "Failed to export reminders" });
    }
  });

  app.get('/api/export/monthly-report', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const month = parseInt(req.query.month as string);
      const year = parseInt(req.query.year as string);
      
      if (!month || !year || month < 1 || month > 12) {
        return res.status(400).json({ message: "Invalid month or year" });
      }
      
      const { exportService } = await import('./exportService');
      const buffer = await exportService.generateMonthlyReport(userId, month, year);
      
      const filename = `rapport_mensuel_${year}_${month.toString().padStart(2, '0')}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating monthly report:", error);
      res.status(500).json({ message: "Failed to generate monthly report" });
    }
  });

  // Schedule management routes
  app.get('/api/schedule/available-slots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = new Date(req.query.date as string);
      const duration = parseInt(req.query.duration as string) || 30;
      const excludeId = req.query.excludeId ? parseInt(req.query.excludeId as string) : undefined;

      const { scheduleService } = await import('./scheduleService');
      const slots = await scheduleService.getAvailableSlots(userId, {
        date,
        duration,
        excludeAppointmentId: excludeId
      });

      res.json(slots);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      res.status(500).json({ message: "Failed to fetch available slots" });
    }
  });

  app.post('/api/schedule/check-conflict', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { appointmentDate, duration, excludeAppointmentId } = req.body;

      const { scheduleService } = await import('./scheduleService');
      const conflict = await scheduleService.checkConflict(
        userId,
        new Date(appointmentDate),
        duration || 30,
        excludeAppointmentId
      );

      res.json(conflict);
    } catch (error) {
      console.error("Error checking conflict:", error);
      res.status(500).json({ message: "Failed to check conflict" });
    }
  });

  app.get('/api/schedule/next-available', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferredDate = new Date(req.query.date as string);
      const duration = parseInt(req.query.duration as string) || 30;

      const { scheduleService } = await import('./scheduleService');
      const nextSlot = await scheduleService.findNextAvailableSlot(userId, preferredDate, duration);

      res.json(nextSlot);
    } catch (error) {
      console.error("Error finding next available slot:", error);
      res.status(500).json({ message: "Failed to find next available slot" });
    }
  });

  app.get('/api/schedule/day-capacity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = new Date(req.query.date as string);

      const { scheduleService } = await import('./scheduleService');
      const capacity = await scheduleService.getDayCapacity(userId, date);

      res.json(capacity);
    } catch (error) {
      console.error("Error fetching day capacity:", error);
      res.status(500).json({ message: "Failed to fetch day capacity" });
    }
  });

  // Public booking route (no authentication required)
  app.post('/api/public/booking/:centerSlug', async (req, res) => {
    try {
      const { centerSlug } = req.params;
      
      // Find the center by slug
      const user = await storage.getUser(centerSlug);
      if (!user) {
        return res.status(404).json({ message: "Centre non trouvé" });
      }

      const bookingData = publicBookingSchema.parse(req.body);
      const result = await storage.createPublicBooking(user.id, bookingData);
      
      res.status(201).json({
        message: "Demande de rendez-vous envoyée avec succès",
        appointment: result.appointment,
      });
    } catch (error) {
      console.error("Error creating public booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création de la demande" });
    }
  });

  // Get public center info
  app.get('/api/public/center/:centerSlug', async (req, res) => {
    try {
      const { centerSlug } = req.params;
      
      // Find the center by slug
      const user = await storage.getUser(centerSlug);
      if (!user) {
        return res.status(404).json({ message: "Centre non trouvé" });
      }

      const centerInfo = {
        name: user.centerName || "Centre de Contrôle Technique",
        address: user.centerAddress || "",
        phone: user.centerPhone || "",
      };
      
      res.json(centerInfo);
    } catch (error) {
      console.error("Error fetching center info:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des informations" });
    }
  });

  // Public booking routes (no authentication required)
  app.get('/api/public/center/:centerSlug', async (req, res) => {
    try {
      const { centerSlug } = req.params;
      
      // Pour le moment, retourner des informations par défaut
      // La méthode getUserByCenterSlug sera implémentée plus tard
      res.json({
        centerName: "Centre de Contrôle Technique Demo",
        centerAddress: "123 Rue de la Paix, 75001 Paris",
        centerPhone: "01 23 45 67 89",
        centerSlug: centerSlug,
        workingHours: {
          monday: { enabled: true, start: "08:00", end: "18:00" },
          tuesday: { enabled: true, start: "08:00", end: "18:00" },
          wednesday: { enabled: true, start: "08:00", end: "18:00" },
          thursday: { enabled: true, start: "08:00", end: "18:00" },
          friday: { enabled: true, start: "08:00", end: "18:00" },
          saturday: { enabled: true, start: "08:00", end: "16:00" },
          sunday: { enabled: false, start: "08:00", end: "16:00" }
        },
        appointmentDuration: 30,
        minBookingNotice: 24
      });
    } catch (error) {
      console.error("Error fetching center info:", error);
      res.status(500).json({ message: "Failed to fetch center info" });
    }
  });

  app.post('/api/public/booking/:centerSlug', async (req, res) => {
    try {
      const { centerSlug } = req.params;
      const bookingData = req.body;

      // Pour le moment, utiliser un userId par défaut pour la demo
      // Dans une vraie implementation, récupérer l'utilisateur par centerSlug
      const userId = "42042509"; // ID utilisateur de demo

      // Valider les données de réservation
      const validatedData = publicBookingSchema.parse(bookingData);

      // Créer le client et le rendez-vous
      const result = await storage.createPublicBooking(userId, validatedData);

      // Envoyer une confirmation par email si disponible
      if (validatedData.email) {
        try {
          const { sendEmail } = await import('./emailService');
          await sendEmail({
            to: validatedData.email,
            subject: `Demande de rendez-vous - Centre de Contrôle Technique Demo`,
            html: `
              <h2>Demande de rendez-vous reçue</h2>
              <p>Bonjour ${validatedData.firstName} ${validatedData.lastName},</p>
              <p>Nous avons bien reçu votre demande de rendez-vous pour le contrôle technique de votre véhicule.</p>
              <p><strong>Détails de votre demande :</strong></p>
              <ul>
                <li>Date souhaitée : ${validatedData.preferredDate}</li>
                <li>Véhicule : ${validatedData.vehicleBrand || ''} ${validatedData.vehicleModel || ''}</li>
                <li>Immatriculation : ${validatedData.licensePlate || 'Non renseignée'}</li>
              </ul>
              <p>Nous vous contacterons rapidement au ${validatedData.phone} pour confirmer votre rendez-vous.</p>
              <p>Cordialement,<br>Centre de Contrôle Technique Demo</p>
            `
          });
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
        }
      }

      res.status(201).json({
        message: "Booking request received successfully",
        appointmentId: result.appointment.id,
        clientId: result.client.id
      });
    } catch (error) {
      console.error("Error processing public booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid booking data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to process booking" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
