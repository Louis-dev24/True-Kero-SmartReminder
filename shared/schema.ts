import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  centerName: varchar("center_name"),
  centerAddress: text("center_address"),
  centerPhone: varchar("center_phone"),
  centerSlug: varchar("center_slug").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  vehicleBrand: varchar("vehicle_brand"),
  vehicleModel: varchar("vehicle_model"),
  licensePlate: varchar("license_plate"),
  lastInspectionDate: date("last_inspection_date"),
  nextInspectionDate: date("next_inspection_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  appointmentDate: timestamp("appointment_date").notNull(),
  status: varchar("status").notNull().default("scheduled"), // scheduled, confirmed, completed, cancelled
  notes: text("notes"),
  isOnlineBooking: boolean("is_online_booking").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reminder templates table
export const reminderTemplates = pgTable("reminder_templates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // sms, email
  daysBefore: integer("days_before").notNull(), // 30, 15, 7, 1
  subject: varchar("subject"), // for emails
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reminder logs table
export const reminderLogs = pgTable("reminder_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  templateId: integer("template_id").references(() => reminderTemplates.id),
  type: varchar("type").notNull(), // sms, email
  status: varchar("status").notNull(), // sent, failed, pending
  sentAt: timestamp("sent_at"),
  content: text("content"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Center settings table
export const centerSettings = pgTable("center_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  appointmentDuration: integer("appointment_duration").default(30), // minutes
  minBookingNotice: integer("min_booking_notice").default(24), // hours
  workingHours: jsonb("working_hours"), // {"monday": {"start": "08:00", "end": "18:00"}, ...}
  reminderSettings: jsonb("reminder_settings"), // reminder frequencies and channels
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  appointments: many(appointments),
  reminderTemplates: many(reminderTemplates),
  reminderLogs: many(reminderLogs),
  centerSettings: many(centerSettings),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
  reminderLogs: many(reminderLogs),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),
}));

export const reminderTemplatesRelations = relations(reminderTemplates, ({ one, many }) => ({
  user: one(users, {
    fields: [reminderTemplates.userId],
    references: [users.id],
  }),
  reminderLogs: many(reminderLogs),
}));

export const reminderLogsRelations = relations(reminderLogs, ({ one }) => ({
  user: one(users, {
    fields: [reminderLogs.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [reminderLogs.clientId],
    references: [clients.id],
  }),
  template: one(reminderTemplates, {
    fields: [reminderLogs.templateId],
    references: [reminderTemplates.id],
  }),
}));

export const centerSettingsRelations = relations(centerSettings, ({ one }) => ({
  user: one(users, {
    fields: [centerSettings.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReminderTemplateSchema = createInsertSchema(reminderTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReminderLogSchema = createInsertSchema(reminderLogs).omit({
  id: true,
  createdAt: true,
});

export const insertCenterSettingsSchema = createInsertSchema(centerSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const publicBookingSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().min(10, "Le téléphone est requis"),
  email: z.string().email().optional().or(z.literal("")),
  preferredDate: z.string().min(1, "La date est requise"),
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  licensePlate: z.string().optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertReminderTemplate = z.infer<typeof insertReminderTemplateSchema>;
export type ReminderTemplate = typeof reminderTemplates.$inferSelect;
export type InsertReminderLog = z.infer<typeof insertReminderLogSchema>;
export type ReminderLog = typeof reminderLogs.$inferSelect;
export type InsertCenterSettings = z.infer<typeof insertCenterSettingsSchema>;
export type CenterSettings = typeof centerSettings.$inferSelect;
export type PublicBooking = z.infer<typeof publicBookingSchema>;

// Extended types for API responses
export type ClientWithStats = Client & {
  appointmentCount: number;
  lastAppointment?: string;
  status: "up_to_date" | "expired" | "expires_soon";
};

export type AppointmentWithClient = Appointment & {
  client: Client;
};

export type DashboardStats = {
  totalClients: number;
  monthlyAppointments: number;
  remindersSent: number;
  expiredInspections: number;
};
