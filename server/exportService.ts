import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storage } from './storage';
import type { Client, Appointment, ReminderLog, DashboardStats } from '@shared/schema';

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'pdf';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeStats?: boolean;
}

export class ExportService {
  async exportClients(userId: string, options: ExportOptions): Promise<Buffer> {
    const clients = await storage.getClients(userId);
    
    if (options.format === 'pdf') {
      return this.generateClientsPDF(clients, userId);
    } else {
      return this.generateClientsSpreadsheet(clients, options.format);
    }
  }

  async exportAppointments(userId: string, options: ExportOptions): Promise<Buffer> {
    const { start, end } = options.dateRange || {};
    const appointments = await storage.getAppointments(userId, start, end);
    
    if (options.format === 'pdf') {
      return this.generateAppointmentsPDF(appointments, userId, options.dateRange);
    } else {
      return this.generateAppointmentsSpreadsheet(appointments, options.format);
    }
  }

  async exportReminderLogs(userId: string, options: ExportOptions): Promise<Buffer> {
    const reminderLogs = await storage.getReminderLogs(userId);
    
    if (options.format === 'pdf') {
      return this.generateReminderLogsPDF(reminderLogs, userId);
    } else {
      return this.generateReminderLogsSpreadsheet(reminderLogs, options.format);
    }
  }

  async generateMonthlyReport(userId: string, month: number, year: number): Promise<Buffer> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const [appointments, reminderLogs, stats, clients] = await Promise.all([
      storage.getAppointments(userId, startDate, endDate),
      storage.getReminderLogs(userId),
      storage.getDashboardStats(userId),
      storage.getClients(userId)
    ]);

    const user = await storage.getUser(userId);
    
    return this.generateMonthlyReportPDF(
      { appointments, reminderLogs, stats, clients },
      user,
      month,
      year
    );
  }

  private generateClientsSpreadsheet(clients: any[], format: 'xlsx' | 'csv'): Buffer {
    const data = clients.map(client => ({
      'Prénom': client.firstName,
      'Nom': client.lastName,
      'Téléphone': client.phone,
      'Email': client.email || '',
      'Marque véhicule': client.vehicleBrand || '',
      'Modèle véhicule': client.vehicleModel || '',
      'Immatriculation': client.licensePlate || '',
      'Dernier contrôle': client.lastInspectionDate || '',
      'Prochain contrôle': client.nextInspectionDate || '',
      'Statut': client.status || '',
      'Nombre RDV': client.appointmentCount || 0,
      'Date création': client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');

    if (format === 'csv') {
      return Buffer.from(XLSX.utils.sheet_to_csv(ws), 'utf8');
    } else {
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }
  }

  private generateAppointmentsSpreadsheet(appointments: any[], format: 'xlsx' | 'csv'): Buffer {
    const data = appointments.map(appointment => ({
      'Date RDV': new Date(appointment.appointmentDate).toLocaleDateString('fr-FR'),
      'Heure': new Date(appointment.appointmentDate).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      'Client': `${appointment.client.firstName} ${appointment.client.lastName}`,
      'Téléphone': appointment.client.phone,
      'Véhicule': `${appointment.client.vehicleBrand || ''} ${appointment.client.vehicleModel || ''}`.trim(),
      'Immatriculation': appointment.client.licensePlate || '',
      'Statut': appointment.status,
      'Notes': appointment.notes || '',
      'Réservation en ligne': appointment.isOnlineBooking ? 'Oui' : 'Non',
      'Date création': new Date(appointment.createdAt).toLocaleDateString('fr-FR')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rendez-vous');

    if (format === 'csv') {
      return Buffer.from(XLSX.utils.sheet_to_csv(ws), 'utf8');
    } else {
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }
  }

  private generateReminderLogsSpreadsheet(reminderLogs: ReminderLog[], format: 'xlsx' | 'csv'): Buffer {
    const data = reminderLogs.map(log => ({
      'Date envoi': log.sentAt ? new Date(log.sentAt).toLocaleDateString('fr-FR') : '',
      'Type': log.type,
      'Statut': log.status,
      'Client ID': log.clientId,
      'Template ID': log.templateId || '',
      'Message d\'erreur': log.errorMessage || '',
      'Date création': new Date(log.createdAt!).toLocaleDateString('fr-FR')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rappels');

    if (format === 'csv') {
      return Buffer.from(XLSX.utils.sheet_to_csv(ws), 'utf8');
    } else {
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }
  }

  private generateClientsPDF(clients: any[], userId: string): Buffer {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.text('Liste des clients', 14, 20);
    doc.setFontSize(12);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

    // Tableau
    const tableData = clients.map(client => [
      `${client.firstName} ${client.lastName}`,
      client.phone,
      client.email || '',
      `${client.vehicleBrand || ''} ${client.vehicleModel || ''}`.trim(),
      client.licensePlate || '',
      client.nextInspectionDate || '',
      client.status || ''
    ]);

    autoTable(doc, {
      head: [['Client', 'Téléphone', 'Email', 'Véhicule', 'Immatriculation', 'Prochain contrôle', 'Statut']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    return Buffer.from(doc.output('arraybuffer'));
  }

  private generateAppointmentsPDF(appointments: any[], userId: string, dateRange?: { start: Date; end: Date }): Buffer {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.text('Rapport des rendez-vous', 14, 20);
    doc.setFontSize(12);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
    
    if (dateRange) {
      doc.text(`Période: ${dateRange.start.toLocaleDateString('fr-FR')} - ${dateRange.end.toLocaleDateString('fr-FR')}`, 14, 40);
    }

    // Tableau
    const tableData = appointments.map(appointment => [
      new Date(appointment.appointmentDate).toLocaleDateString('fr-FR'),
      new Date(appointment.appointmentDate).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      `${appointment.client.firstName} ${appointment.client.lastName}`,
      appointment.client.phone,
      `${appointment.client.vehicleBrand || ''} ${appointment.client.vehicleModel || ''}`.trim(),
      appointment.status
    ]);

    autoTable(doc, {
      head: [['Date', 'Heure', 'Client', 'Téléphone', 'Véhicule', 'Statut']],
      body: tableData,
      startY: dateRange ? 50 : 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    return Buffer.from(doc.output('arraybuffer'));
  }

  private generateReminderLogsPDF(reminderLogs: ReminderLog[], userId: string): Buffer {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.text('Rapport des rappels', 14, 20);
    doc.setFontSize(12);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

    // Statistiques
    const totalSent = reminderLogs.filter(log => log.status === 'sent').length;
    const totalFailed = reminderLogs.filter(log => log.status === 'failed').length;
    const totalEmail = reminderLogs.filter(log => log.type === 'email').length;
    const totalSMS = reminderLogs.filter(log => log.type === 'sms').length;

    doc.text(`Total rappels: ${reminderLogs.length}`, 14, 45);
    doc.text(`Envoyés: ${totalSent} | Échecs: ${totalFailed}`, 14, 55);
    doc.text(`Emails: ${totalEmail} | SMS: ${totalSMS}`, 14, 65);

    // Tableau
    const tableData = reminderLogs.slice(0, 50).map(log => [
      log.sentAt ? new Date(log.sentAt).toLocaleDateString('fr-FR') : '',
      log.type,
      log.status,
      log.clientId.toString(),
      log.errorMessage || ''
    ]);

    autoTable(doc, {
      head: [['Date', 'Type', 'Statut', 'Client ID', 'Erreur']],
      body: tableData,
      startY: 75,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    return Buffer.from(doc.output('arraybuffer'));
  }

  private generateMonthlyReportPDF(
    data: { appointments: any[]; reminderLogs: ReminderLog[]; stats: DashboardStats; clients: any[] },
    user: any,
    month: number,
    year: number
  ): Buffer {
    const doc = new jsPDF();
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // En-tête
    doc.setFontSize(24);
    doc.text('Rapport mensuel d\'activité', 14, 20);
    doc.setFontSize(16);
    doc.text(`${monthNames[month - 1]} ${year}`, 14, 35);
    doc.setFontSize(12);
    doc.text(`${user?.centerName || 'Centre de Contrôle Technique'}`, 14, 45);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 55);

    // Statistiques principales
    doc.setFontSize(14);
    doc.text('Statistiques du mois', 14, 75);
    doc.setFontSize(10);
    doc.text(`• Total clients: ${data.stats.totalClients}`, 20, 85);
    doc.text(`• Rendez-vous du mois: ${data.stats.monthlyAppointments}`, 20, 95);
    doc.text(`• Rappels envoyés: ${data.stats.remindersSent}`, 20, 105);
    doc.text(`• Contrôles expirés: ${data.stats.expiredInspections}`, 20, 115);

    // Répartition des rendez-vous par statut
    const appointmentsByStatus = data.appointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    doc.setFontSize(14);
    doc.text('Répartition des rendez-vous', 14, 135);
    doc.setFontSize(10);
    let y = 145;
    Object.entries(appointmentsByStatus).forEach(([status, count]) => {
      doc.text(`• ${status}: ${count}`, 20, y);
      y += 10;
    });

    // Nouvelle page pour le détail des rendez-vous
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Détail des rendez-vous', 14, 20);

    const appointmentData = data.appointments.slice(0, 20).map(appointment => [
      new Date(appointment.appointmentDate).toLocaleDateString('fr-FR'),
      `${appointment.client.firstName} ${appointment.client.lastName}`,
      appointment.client.phone,
      appointment.status
    ]);

    autoTable(doc, {
      head: [['Date', 'Client', 'Téléphone', 'Statut']],
      body: appointmentData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    return Buffer.from(doc.output('arraybuffer'));
  }
}

export const exportService = new ExportService();