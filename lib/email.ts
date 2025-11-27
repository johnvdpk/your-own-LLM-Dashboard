import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Get the base URL for reset links
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return { success: false, error: 'Email service not configured' };
    }

    const resetUrl = `${getBaseUrl()}/reset-password?token=${resetToken}`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'john@aiadapt.nl';

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Wachtwoord resetten',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Wachtwoord resetten</h2>
          <p>Je hebt een verzoek gedaan om je wachtwoord te resetten.</p>
          <p>Klik op de onderstaande link om een nieuw wachtwoord in te stellen:</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
              Wachtwoord resetten
            </a>
          </p>
          <p>Of kopieer en plak deze link in je browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Deze link is 1 uur geldig. Als je dit verzoek niet hebt gedaan, negeer deze email dan.
          </p>
        </div>
      `,
    });

    if (result.error) {
      console.error('Resend API error:', JSON.stringify(result.error, null, 2));
      console.error('From email:', fromEmail);
      console.error('To email:', email);
      
      // Provide more specific error messages
      if (result.error.message?.includes('domain') || result.error.message?.includes('verify')) {
        return { 
          success: false, 
          error: `Email domain niet geverifieerd. Controleer je RESEND_FROM_EMAIL configuratie. Huidige waarde: ${fromEmail}` 
        };
      }
      
      return { 
        success: false, 
        error: `Email versturen mislukt: ${result.error.message || 'Onbekende fout'}` 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

