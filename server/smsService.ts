export interface SMSData {
  to: string;
  message: string;
  from?: string;
}

export async function sendSMS(smsData: SMSData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Vérifier la présence des variables d'environnement Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER || smsData.from;

    if (!accountSid || !authToken || !fromPhone) {
      return {
        success: false,
        error: "Configuration Twilio manquante. Vérifiez TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER"
      };
    }

    // Formater le numéro de téléphone français
    const formattedPhone = formatFrenchPhoneNumber(smsData.to);
    
    // Créer le client Twilio
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    // Envoyer le SMS
    const message = await client.messages.create({
      body: smsData.message,
      from: fromPhone,
      to: formattedPhone
    });

    console.log(`SMS envoyé avec succès: ${message.sid}`);
    
    return {
      success: true,
      messageId: message.sid
    };

  } catch (error: any) {
    console.error("Erreur lors de l'envoi du SMS:", error);
    
    return {
      success: false,
      error: error.message || "Erreur inconnue lors de l'envoi du SMS"
    };
  }
}

function formatFrenchPhoneNumber(phone: string): string {
  // Nettoyer le numéro
  let cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
  
  // Si le numéro commence par 0, le remplacer par +33
  if (cleaned.startsWith('0')) {
    cleaned = '+33' + cleaned.substring(1);
  }
  
  // Si le numéro ne commence pas par +, ajouter +33
  if (!cleaned.startsWith('+')) {
    cleaned = '+33' + cleaned;
  }
  
  return cleaned;
}

export function generateReminderSMSContent(clientName: string, centerName: string, expirationDate: string, daysLeft: number): string {
  if (daysLeft <= 0) {
    return `Bonjour ${clientName}, votre contrôle technique a expiré le ${expirationDate}. Prenez RDV chez ${centerName} rapidement. Répondez STOP pour vous désabonner.`;
  } else if (daysLeft <= 7) {
    return `Bonjour ${clientName}, votre contrôle technique expire dans ${daysLeft} jour(s) (${expirationDate}). Prenez RDV chez ${centerName}. Répondez STOP pour vous désabonner.`;
  } else {
    return `Bonjour ${clientName}, votre contrôle technique expire le ${expirationDate} (dans ${daysLeft} jours). Pensez à prendre RDV chez ${centerName}. Répondez STOP pour vous désabonner.`;
  }
}

export function generateAppointmentConfirmationSMS(clientName: string, centerName: string, appointmentDate: string, centerAddress?: string): string {
  let message = `Bonjour ${clientName}, votre RDV de contrôle technique est confirmé pour le ${appointmentDate} chez ${centerName}.`;
  
  if (centerAddress) {
    message += ` Adresse: ${centerAddress}.`;
  }
  
  message += ` Répondez STOP pour vous désabonner.`;
  
  return message;
}

export function generateAppointmentReminderSMS(clientName: string, centerName: string, appointmentDate: string, hoursLeft: number): string {
  if (hoursLeft <= 2) {
    return `Rappel: RDV contrôle technique dans ${hoursLeft}h (${appointmentDate}) chez ${centerName}. Répondez STOP pour vous désabonner.`;
  } else if (hoursLeft <= 24) {
    return `Rappel: RDV contrôle technique demain (${appointmentDate}) chez ${centerName}. Répondez STOP pour vous désabonner.`;
  } else {
    const daysLeft = Math.ceil(hoursLeft / 24);
    return `Rappel: RDV contrôle technique dans ${daysLeft} jour(s) (${appointmentDate}) chez ${centerName}. Répondez STOP pour vous désabonner.`;
  }
}