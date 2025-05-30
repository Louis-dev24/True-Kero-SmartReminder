import type { Client, User } from "@shared/schema";

export interface TemplateVariables {
  CLIENT_NAME: string;
  FIRST_NAME: string;
  LAST_NAME: string;
  CENTER_NAME: string;
  EXPIRATION_DATE: string;
  DAYS_LEFT: string;
  VEHICLE_INFO: string;
  CENTER_PHONE: string;
  CENTER_ADDRESS: string;
}

export function createTemplateVariables(
  client: Client,
  user: User,
  daysLeft: number,
  expirationDate: Date
): TemplateVariables {
  const vehicleInfo = [
    client.vehicleBrand,
    client.vehicleModel,
    client.licensePlate
  ].filter(Boolean).join(' ');

  return {
    CLIENT_NAME: `${client.firstName} ${client.lastName}`.trim(),
    FIRST_NAME: client.firstName,
    LAST_NAME: client.lastName,
    CENTER_NAME: user.centerName || 'Centre de Contrôle Technique',
    EXPIRATION_DATE: expirationDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    DAYS_LEFT: daysLeft.toString(),
    VEHICLE_INFO: vehicleInfo || 'véhicule',
    CENTER_PHONE: user.centerPhone || '',
    CENTER_ADDRESS: user.centerAddress || '',
  };
}

export function replaceTemplateVariables(
  template: string,
  variables: TemplateVariables
): string {
  let result = template;
  
  // Remplacer toutes les variables dans le template
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

export function previewTemplate(
  template: string,
  templateType: 'email' | 'sms' = 'email'
): string {
  // Variables d'exemple pour la prévisualisation
  const sampleVariables: TemplateVariables = {
    CLIENT_NAME: 'Jean Dupont',
    FIRST_NAME: 'Jean',
    LAST_NAME: 'Dupont',
    CENTER_NAME: 'Centre Auto Contrôle',
    EXPIRATION_DATE: '15/06/2024',
    DAYS_LEFT: '30',
    VEHICLE_INFO: 'Peugeot 208 AB-123-CD',
    CENTER_PHONE: '01 23 45 67 89',
    CENTER_ADDRESS: '123 Rue de la République, 75001 Paris',
  };

  return replaceTemplateVariables(template, sampleVariables);
}

// Modèles par défaut pour différents scénarios
export const defaultTemplates = {
  email: {
    expiring30: {
      name: "Rappel 30 jours avant expiration",
      subject: "Rappel : Contrôle technique à renouveler - {CLIENT_NAME}",
      content: `Bonjour {CLIENT_NAME},

Nous vous rappelons que le contrôle technique de votre véhicule {VEHICLE_INFO} expire le {EXPIRATION_DATE}.

Il vous reste {DAYS_LEFT} jours pour effectuer votre contrôle technique.

Pour prendre rendez-vous, contactez-nous :
📞 {CENTER_PHONE}
📍 {CENTER_ADDRESS}

Cordialement,
L'équipe de {CENTER_NAME}`,
      daysBefore: 30
    },
    expiring7: {
      name: "Rappel urgent 7 jours avant expiration",
      subject: "URGENT : Contrôle technique à renouveler dans {DAYS_LEFT} jours - {CLIENT_NAME}",
      content: `Bonjour {CLIENT_NAME},

⚠️ ATTENTION : Le contrôle technique de votre véhicule {VEHICLE_INFO} expire dans seulement {DAYS_LEFT} jours, le {EXPIRATION_DATE}.

Ne tardez plus ! Prenez rendez-vous dès maintenant :
📞 {CENTER_PHONE}
📍 {CENTER_ADDRESS}

Évitez l'amende et l'immobilisation de votre véhicule.

Cordialement,
L'équipe de {CENTER_NAME}`,
      daysBefore: 7
    },
    expired: {
      name: "Alerte contrôle technique expiré",
      subject: "URGENT : Contrôle technique expiré - Véhicule non conforme - {CLIENT_NAME}",
      content: `Bonjour {CLIENT_NAME},

🚨 ALERTE : Le contrôle technique de votre véhicule {VEHICLE_INFO} a expiré le {EXPIRATION_DATE}.

Votre véhicule n'est plus autorisé à circuler. Vous risquez :
• Une amende de 135€
• L'immobilisation du véhicule
• Des complications avec votre assurance

Prenez rendez-vous immédiatement :
📞 {CENTER_PHONE}
📍 {CENTER_ADDRESS}

Cordialement,
L'équipe de {CENTER_NAME}`,
      daysBefore: 0
    }
  },
  sms: {
    expiring30: {
      name: "SMS rappel 30 jours",
      content: "Bonjour {FIRST_NAME}, votre contrôle technique expire le {EXPIRATION_DATE} (dans {DAYS_LEFT} jours). Prenez RDV chez {CENTER_NAME} au {CENTER_PHONE}. STOP=désabonnement",
      daysBefore: 30
    },
    expiring7: {
      name: "SMS rappel urgent 7 jours",
      content: "URGENT {FIRST_NAME} : votre contrôle technique expire dans {DAYS_LEFT} jours le {EXPIRATION_DATE}. RDV immédiat : {CENTER_PHONE}. STOP=désabonnement",
      daysBefore: 7
    },
    expired: {
      name: "SMS alerte expiré",
      content: "ALERTE {FIRST_NAME} : contrôle technique expiré le {EXPIRATION_DATE}. Circulation interdite, amende 135€. RDV urgent : {CENTER_PHONE}. STOP=désabonnement",
      daysBefore: 0
    }
  }
};