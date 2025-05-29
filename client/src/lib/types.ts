export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  centerName?: string;
  centerAddress?: string;
  centerPhone?: string;
  centerSlug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Client {
  id: number;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  licensePlate?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClientWithStats extends Client {
  appointmentCount: number;
  lastAppointment?: string;
  status: "up_to_date" | "expired" | "expires_soon";
}

export interface Appointment {
  id: number;
  userId: string;
  clientId: number;
  appointmentDate: Date;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  isOnlineBooking?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppointmentWithClient extends Appointment {
  client: Client;
}

export interface DashboardStats {
  totalClients: number;
  monthlyAppointments: number;
  remindersSent: number;
  expiredInspections: number;
}

export interface ReminderTemplate {
  id: number;
  userId: string;
  name: string;
  type: "sms" | "email";
  daysBefore: number;
  subject?: string;
  content: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReminderLog {
  id: number;
  userId: string;
  clientId: number;
  templateId?: number;
  type: "sms" | "email";
  status: "sent" | "failed" | "pending";
  sentAt?: Date;
  content?: string;
  errorMessage?: string;
  createdAt?: Date;
}

export interface CenterSettings {
  id: number;
  userId: string;
  appointmentDuration: number;
  minBookingNotice: number;
  workingHours?: any;
  reminderSettings?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PublicBooking {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  preferredDate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  licensePlate?: string;
}
