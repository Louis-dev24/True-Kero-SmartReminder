import {
  users,
  clients,
  appointments,
  reminderTemplates,
  reminderLogs,
  centerSettings,
  type User,
  type UpsertUser,
  type InsertClient,
  type Client,
  type InsertAppointment,
  type Appointment,
  type InsertReminderTemplate,
  type ReminderTemplate,
  type InsertReminderLog,
  type ReminderLog,
  type InsertCenterSettings,
  type CenterSettings,
  type ClientWithStats,
  type AppointmentWithClient,
  type DashboardStats,
  type PublicBooking,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql, gte, lte, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByCenterSlug(centerSlug: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Client operations
  getClients(userId: string, search?: string, statusFilter?: string): Promise<ClientWithStats[]>;
  getClient(id: number, userId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>, userId: string): Promise<Client | undefined>;
  deleteClient(id: number, userId: string): Promise<boolean>;

  // Appointment operations
  getAppointments(userId: string, startDate?: Date, endDate?: Date): Promise<AppointmentWithClient[]>;
  getAppointment(id: number, userId: string): Promise<AppointmentWithClient | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>, userId: string): Promise<Appointment | undefined>;
  deleteAppointment(id: number, userId: string): Promise<boolean>;

  // Public booking
  createPublicBooking(userId: string, booking: PublicBooking): Promise<{ client: Client; appointment: Appointment }>;

  // Reminder templates
  getReminderTemplates(userId: string): Promise<ReminderTemplate[]>;
  createReminderTemplate(template: InsertReminderTemplate): Promise<ReminderTemplate>;
  updateReminderTemplate(id: number, template: Partial<InsertReminderTemplate>, userId: string): Promise<ReminderTemplate | undefined>;
  deleteReminderTemplate(id: number, userId: string): Promise<boolean>;

  // Reminder logs
  getReminderLogs(userId: string, clientId?: number): Promise<ReminderLog[]>;
  createReminderLog(log: InsertReminderLog): Promise<ReminderLog>;

  // Center settings
  getCenterSettings(userId: string): Promise<CenterSettings | undefined>;
  upsertCenterSettings(settings: InsertCenterSettings): Promise<CenterSettings>;

  // Dashboard
  getDashboardStats(userId: string): Promise<DashboardStats>;
  getUpcomingAppointments(userId: string, limit?: number): Promise<AppointmentWithClient[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByCenterSlug(centerSlug: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.centerSlug, centerSlug));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Client operations
  async getClients(userId: string, search?: string, statusFilter?: string): Promise<ClientWithStats[]> {
    let query = db
      .select({
        id: clients.id,
        userId: clients.userId,
        firstName: clients.firstName,
        lastName: clients.lastName,
        phone: clients.phone,
        email: clients.email,
        vehicleBrand: clients.vehicleBrand,
        vehicleModel: clients.vehicleModel,
        licensePlate: clients.licensePlate,
        lastInspectionDate: clients.lastInspectionDate,
        nextInspectionDate: clients.nextInspectionDate,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        appointmentCount: count(appointments.id),
      })
      .from(clients)
      .leftJoin(appointments, eq(clients.id, appointments.clientId))
      .where(eq(clients.userId, userId))
      .groupBy(clients.id);

    if (search) {
      query = query.where(
        and(
          eq(clients.userId, userId),
          or(
            like(clients.firstName, `%${search}%`),
            like(clients.lastName, `%${search}%`),
            like(clients.phone, `%${search}%`),
            like(clients.email, `%${search}%`)
          )
        )
      );
    }

    const results = await query.orderBy(asc(clients.lastName), asc(clients.firstName));

    return results.map(client => {
      let status: "up_to_date" | "expired" | "expires_soon" = "up_to_date";
      
      if (client.nextInspectionDate) {
        const today = new Date();
        const nextInspection = new Date(client.nextInspectionDate);
        const daysDiff = Math.ceil((nextInspection.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 0) {
          status = "expired";
        } else if (daysDiff <= 30) {
          status = "expires_soon";
        }
      }

      return {
        ...client,
        status,
      };
    });
  }

  async getClient(id: number, userId: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>, userId: string): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Appointment operations
  async getAppointments(userId: string, startDate?: Date, endDate?: Date): Promise<AppointmentWithClient[]> {
    let query = db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        clientId: appointments.clientId,
        appointmentDate: appointments.appointmentDate,
        status: appointments.status,
        notes: appointments.notes,
        isOnlineBooking: appointments.isOnlineBooking,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        client: {
          id: clients.id,
          userId: clients.userId,
          firstName: clients.firstName,
          lastName: clients.lastName,
          phone: clients.phone,
          email: clients.email,
          vehicleBrand: clients.vehicleBrand,
          vehicleModel: clients.vehicleModel,
          licensePlate: clients.licensePlate,
          lastInspectionDate: clients.lastInspectionDate,
          nextInspectionDate: clients.nextInspectionDate,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
        },
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id))
      .where(eq(appointments.userId, userId));

    if (startDate && endDate) {
      query = query.where(
        and(
          eq(appointments.userId, userId),
          gte(appointments.appointmentDate, startDate),
          lte(appointments.appointmentDate, endDate)
        )
      );
    }

    return await query.orderBy(asc(appointments.appointmentDate));
  }

  async getAppointment(id: number, userId: string): Promise<AppointmentWithClient | undefined> {
    const [appointment] = await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        clientId: appointments.clientId,
        appointmentDate: appointments.appointmentDate,
        status: appointments.status,
        notes: appointments.notes,
        isOnlineBooking: appointments.isOnlineBooking,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        client: {
          id: clients.id,
          userId: clients.userId,
          firstName: clients.firstName,
          lastName: clients.lastName,
          phone: clients.phone,
          email: clients.email,
          vehicleBrand: clients.vehicleBrand,
          vehicleModel: clients.vehicleModel,
          licensePlate: clients.licensePlate,
          lastInspectionDate: clients.lastInspectionDate,
          nextInspectionDate: clients.nextInspectionDate,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
        },
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id))
      .where(and(eq(appointments.id, id), eq(appointments.userId, userId)));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>, userId: string): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(and(eq(appointments.id, id), eq(appointments.userId, userId)))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Public booking
  async createPublicBooking(userId: string, booking: PublicBooking): Promise<{ client: Client; appointment: Appointment }> {
    // First create or find the client
    let client: Client;
    
    // Check if client exists by phone
    const [existingClient] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.userId, userId), eq(clients.phone, booking.phone)));
    
    if (existingClient) {
      client = existingClient;
    } else {
      // Create new client
      const [newClient] = await db.insert(clients).values({
        userId,
        firstName: booking.firstName,
        lastName: booking.lastName,
        phone: booking.phone,
        email: booking.email || null,
        vehicleBrand: booking.vehicleBrand || null,
        vehicleModel: booking.vehicleModel || null,
        licensePlate: booking.licensePlate || null,
      }).returning();
      client = newClient;
    }

    // Create appointment
    const appointmentDate = new Date(booking.preferredDate);
    const [appointment] = await db.insert(appointments).values({
      userId,
      clientId: client.id,
      appointmentDate,
      status: "scheduled",
      isOnlineBooking: true,
      notes: "Rendez-vous pris en ligne",
    }).returning();

    return { client, appointment };
  }

  // Reminder templates
  async getReminderTemplates(userId: string): Promise<ReminderTemplate[]> {
    return await db
      .select()
      .from(reminderTemplates)
      .where(eq(reminderTemplates.userId, userId))
      .orderBy(asc(reminderTemplates.daysBefore), asc(reminderTemplates.type));
  }

  async createReminderTemplate(template: InsertReminderTemplate): Promise<ReminderTemplate> {
    const [newTemplate] = await db.insert(reminderTemplates).values(template).returning();
    return newTemplate;
  }

  async updateReminderTemplate(id: number, template: Partial<InsertReminderTemplate>, userId: string): Promise<ReminderTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(reminderTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(and(eq(reminderTemplates.id, id), eq(reminderTemplates.userId, userId)))
      .returning();
    return updatedTemplate;
  }

  async deleteReminderTemplate(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(reminderTemplates)
      .where(and(eq(reminderTemplates.id, id), eq(reminderTemplates.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Reminder logs
  async getReminderLogs(userId: string, clientId?: number): Promise<ReminderLog[]> {
    let query = db
      .select()
      .from(reminderLogs)
      .where(eq(reminderLogs.userId, userId));

    if (clientId) {
      query = query.where(and(eq(reminderLogs.userId, userId), eq(reminderLogs.clientId, clientId)));
    }

    return await query.orderBy(desc(reminderLogs.createdAt));
  }

  async createReminderLog(log: InsertReminderLog): Promise<ReminderLog> {
    const [newLog] = await db.insert(reminderLogs).values(log).returning();
    return newLog;
  }

  // Center settings
  async getCenterSettings(userId: string): Promise<CenterSettings | undefined> {
    const [settings] = await db
      .select()
      .from(centerSettings)
      .where(eq(centerSettings.userId, userId));
    return settings;
  }

  async upsertCenterSettings(settings: InsertCenterSettings): Promise<CenterSettings> {
    const [upsertedSettings] = await db
      .insert(centerSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: centerSettings.userId,
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedSettings;
  }

  // Dashboard
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Total clients
    const [totalClientsResult] = await db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.userId, userId));

    // Monthly appointments (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const [monthlyAppointmentsResult] = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          gte(appointments.appointmentDate, startOfMonth),
          lte(appointments.appointmentDate, endOfMonth)
        )
      );

    // Reminders sent (this month)
    const [remindersSentResult] = await db
      .select({ count: count() })
      .from(reminderLogs)
      .where(
        and(
          eq(reminderLogs.userId, userId),
          eq(reminderLogs.status, "sent"),
          gte(reminderLogs.createdAt, startOfMonth),
          lte(reminderLogs.createdAt, endOfMonth)
        )
      );

    // Expired inspections
    const today = new Date();
    const [expiredInspectionsResult] = await db
      .select({ count: count() })
      .from(clients)
      .where(
        and(
          eq(clients.userId, userId),
          lte(clients.nextInspectionDate, today)
        )
      );

    return {
      totalClients: totalClientsResult.count,
      monthlyAppointments: monthlyAppointmentsResult.count,
      remindersSent: remindersSentResult.count,
      expiredInspections: expiredInspectionsResult.count,
    };
  }

  async getUpcomingAppointments(userId: string, limit = 10): Promise<AppointmentWithClient[]> {
    const today = new Date();
    
    return await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        clientId: appointments.clientId,
        appointmentDate: appointments.appointmentDate,
        status: appointments.status,
        notes: appointments.notes,
        isOnlineBooking: appointments.isOnlineBooking,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        client: {
          id: clients.id,
          userId: clients.userId,
          firstName: clients.firstName,
          lastName: clients.lastName,
          phone: clients.phone,
          email: clients.email,
          vehicleBrand: clients.vehicleBrand,
          vehicleModel: clients.vehicleModel,
          licensePlate: clients.licensePlate,
          lastInspectionDate: clients.lastInspectionDate,
          nextInspectionDate: clients.nextInspectionDate,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
        },
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id))
      .where(
        and(
          eq(appointments.userId, userId),
          gte(appointments.appointmentDate, today)
        )
      )
      .orderBy(asc(appointments.appointmentDate))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
