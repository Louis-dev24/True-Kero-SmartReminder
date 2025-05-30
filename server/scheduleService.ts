import { storage } from "./storage";
import type { Appointment, CenterSettings } from "@shared/schema";

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflictingAppointmentId?: number;
}

export interface WorkingHours {
  start: string; // "09:00"
  end: string;   // "18:00"
  breakStart?: string; // "12:00"
  breakEnd?: string;   // "14:00"
}

export interface ScheduleOptions {
  date: Date;
  duration: number; // minutes
  excludeAppointmentId?: number; // pour modification d'un RDV existant
}

export class ScheduleService {
  private defaultWorkingHours: WorkingHours = {
    start: "09:00",
    end: "18:00",
    breakStart: "12:00",
    breakEnd: "14:00"
  };

  private defaultAppointmentDuration = 30; // minutes

  async getAvailableSlots(userId: string, options: ScheduleOptions): Promise<TimeSlot[]> {
    const { date, duration, excludeAppointmentId } = options;
    
    // Récupérer les paramètres du centre
    const settings = await storage.getCenterSettings(userId);
    const workingHours = this.parseWorkingHours(settings);
    const appointmentDuration = settings?.appointmentDuration || this.defaultAppointmentDuration;

    // Récupérer les rendez-vous existants pour cette date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await storage.getAppointments(userId, startOfDay, endOfDay);
    
    // Filtrer le rendez-vous en cours de modification si applicable
    const filteredAppointments = excludeAppointmentId 
      ? existingAppointments.filter(apt => apt.id !== excludeAppointmentId)
      : existingAppointments;

    // Générer tous les créneaux possibles
    const allSlots = this.generateTimeSlots(date, workingHours, appointmentDuration);
    
    // Marquer les créneaux disponibles/occupés
    return this.markSlotAvailability(allSlots, filteredAppointments, duration);
  }

  async checkConflict(userId: string, appointmentDate: Date, duration: number, excludeAppointmentId?: number): Promise<{
    hasConflict: boolean;
    conflictingAppointment?: Appointment;
    suggestedSlots?: TimeSlot[];
  }> {
    const slots = await this.getAvailableSlots(userId, {
      date: appointmentDate,
      duration,
      excludeAppointmentId
    });

    // Trouver le créneau correspondant à l'horaire demandé
    const requestedSlot = slots.find(slot => 
      slot.start.getTime() === appointmentDate.getTime()
    );

    if (!requestedSlot || requestedSlot.available) {
      return { hasConflict: false };
    }

    // Récupérer les détails du conflit
    let conflictingAppointment;
    if (requestedSlot.conflictingAppointmentId) {
      conflictingAppointment = await storage.getAppointment(requestedSlot.conflictingAppointmentId, userId);
    }

    // Suggérer des créneaux alternatifs
    const availableSlots = slots.filter(slot => slot.available).slice(0, 5);

    return {
      hasConflict: true,
      conflictingAppointment,
      suggestedSlots: availableSlots
    };
  }

  async findNextAvailableSlot(userId: string, preferredDate: Date, duration: number): Promise<TimeSlot | null> {
    const maxDaysToCheck = 30;
    
    for (let dayOffset = 0; dayOffset < maxDaysToCheck; dayOffset++) {
      const checkDate = new Date(preferredDate);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      
      // Ignorer les weekends (optionnel)
      if (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
        continue;
      }

      const slots = await this.getAvailableSlots(userId, {
        date: checkDate,
        duration
      });

      const availableSlot = slots.find(slot => slot.available);
      if (availableSlot) {
        return availableSlot;
      }
    }

    return null;
  }

  private parseWorkingHours(settings?: CenterSettings | null): WorkingHours {
    if (!settings?.workingHours) {
      return this.defaultWorkingHours;
    }

    try {
      return typeof settings.workingHours === 'string' 
        ? JSON.parse(settings.workingHours)
        : settings.workingHours;
    } catch {
      return this.defaultWorkingHours;
    }
  }

  private generateTimeSlots(date: Date, workingHours: WorkingHours, slotDuration: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);

    let current = new Date(date);
    current.setHours(startHour, startMinute, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    // Gérer la pause déjeuner
    let breakStart: Date | null = null;
    let breakEnd: Date | null = null;
    
    if (workingHours.breakStart && workingHours.breakEnd) {
      const [breakStartHour, breakStartMinute] = workingHours.breakStart.split(':').map(Number);
      const [breakEndHour, breakEndMinute] = workingHours.breakEnd.split(':').map(Number);
      
      breakStart = new Date(date);
      breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);
      
      breakEnd = new Date(date);
      breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);
    }

    while (current < dayEnd) {
      const slotEnd = new Date(current.getTime() + slotDuration * 60000);
      
      // Vérifier si le créneau tombe pendant la pause
      const isDuringBreak = breakStart && breakEnd && 
        current >= breakStart && current < breakEnd;

      if (!isDuringBreak && slotEnd <= dayEnd) {
        slots.push({
          start: new Date(current),
          end: slotEnd,
          available: true
        });
      }

      current = new Date(current.getTime() + slotDuration * 60000);
    }

    return slots;
  }

  private markSlotAvailability(
    slots: TimeSlot[], 
    existingAppointments: any[], 
    requestedDuration: number
  ): TimeSlot[] {
    return slots.map(slot => {
      // Vérifier si ce créneau ou les créneaux suivants (selon la durée) sont occupés
      const slotsNeeded = Math.ceil(requestedDuration / ((slot.end.getTime() - slot.start.getTime()) / 60000));
      
      for (let i = 0; i < slotsNeeded; i++) {
        const checkTime = new Date(slot.start.getTime() + i * (slot.end.getTime() - slot.start.getTime()));
        
        const conflict = existingAppointments.find(apt => {
          const aptStart = new Date(apt.appointmentDate);
          const aptEnd = new Date(aptStart.getTime() + (this.defaultAppointmentDuration * 60000));
          
          return checkTime >= aptStart && checkTime < aptEnd;
        });

        if (conflict) {
          return {
            ...slot,
            available: false,
            conflictingAppointmentId: conflict.id
          };
        }
      }

      return slot;
    });
  }

  // Utilitaires pour l'interface
  formatTimeSlot(slot: TimeSlot): string {
    const start = slot.start.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const end = slot.end.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${start} - ${end}`;
  }

  isSlotInPast(slot: TimeSlot): boolean {
    return slot.start < new Date();
  }

  getDayCapacity(userId: string, date: Date): Promise<{
    totalSlots: number;
    availableSlots: number;
    occupiedSlots: number;
    utilizationRate: number;
  }> {
    return this.getAvailableSlots(userId, { date, duration: 30 }).then(slots => {
      const totalSlots = slots.length;
      const availableSlots = slots.filter(s => s.available).length;
      const occupiedSlots = totalSlots - availableSlots;
      const utilizationRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

      return {
        totalSlots,
        availableSlots,
        occupiedSlots,
        utilizationRate
      };
    });
  }
}

export const scheduleService = new ScheduleService();