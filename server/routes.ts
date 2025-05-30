import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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

  const httpServer = createServer(app);
  return httpServer;
}
