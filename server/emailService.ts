import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: emailData.from || 'TechControl Pro <noreply@techcontrol.pro>',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function generateReminderEmailHtml(clientName: string, centerName: string, expirationDate: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rappel de contrôle technique</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h1 style="color: #2272FF; margin-bottom: 20px;">Rappel de contrôle technique</h1>
        
        <p>Bonjour ${clientName},</p>
        
        <p>Nous espérons que vous allez bien. Ceci est un rappel amical concernant le contrôle technique de votre véhicule.</p>
        
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700;">
          <h3 style="margin-top: 0; color: #333;">⚠️ Contrôle technique à renouveler</h3>
          <p><strong>Date d'expiration :</strong> ${expirationDate}</p>
        </div>
        
        <p>Pour éviter tout désagrément et rester en conformité avec la réglementation, nous vous recommandons de prendre rendez-vous dès maintenant.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="#" style="background-color: #2272FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Prendre rendez-vous</a>
        </div>
        
        <p>Si vous avez des questions ou souhaitez prendre rendez-vous, n'hésitez pas à nous contacter.</p>
        
        <p>Cordialement,<br>
        L'équipe ${centerName}</p>
        
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          Ce message a été envoyé automatiquement par TechControl Pro.<br>
          Pour ne plus recevoir ces rappels, contactez votre centre de contrôle.
        </p>
      </div>
    </body>
    </html>
  `;
}