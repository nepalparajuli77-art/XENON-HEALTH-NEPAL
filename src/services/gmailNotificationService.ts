/**
 * Gmail Notification Service
 * Sends automated appointment confirmation emails from the user's connected Google account
 * using the official Google Workspace Gmail API (users.messages.send).
 */

import { Appointment, Doctor, User } from '../types';
import { getCachedAccessToken, googleSignIn } from '../lib/firebase';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentTo?: string;
  senderEmail?: string;
}

/**
 * Creates a base64url encoded RFC 2822 email string
 */
function createRawEmail(to: string, from: string, subject: string, htmlBody: string): string {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  
  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    htmlBody
  ];

  const email = emailLines.join('\r\n');
  
  // Base64url encoding (replace + with -, / with _, remove padding =)
  return btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates responsive clinical appointment confirmation email HTML
 */
export function generateAppointmentEmailHtml(appointment: Appointment, patientEmail: string): string {
  const isVideo = appointment.type?.includes('Video') || appointment.meeting_link;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmation - Xenon Health</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 35px 30px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px;">
                      ✓ Booking Confirmed
                    </span>
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; line-height: 1.3;">
                      Telemedicine Consultation Confirmed
                    </h1>
                    <p style="margin: 6px 0 0; color: #93c5fd; font-size: 13px;">
                      Xenon Health Nepal • Digital Clinical Care
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Patient Greeting & Details -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.6; color: #334155;">
                Namaste <strong>${appointment.patient_name || 'Valued Patient'}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
                Your appointment with <strong>Dr. ${appointment.doctor_name}</strong> has been successfully scheduled and verified in the clinical system. Below is your full consultation summary:
              </p>

              <!-- Appointment Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="8">
                      <tr>
                        <td width="35%" style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Doctor</td>
                        <td style="font-size: 14px; font-weight: 800; color: #0f172a;">Dr. ${appointment.doctor_name}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Specialty</td>
                        <td style="font-size: 13px; font-weight: 600; color: #2563eb;">${appointment.specialty || 'General Practitioner'}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Hospital / Clinic</td>
                        <td style="font-size: 13px; font-weight: 600; color: #334155;">${appointment.hospital || 'Accredited Medical Center'}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Date &amp; Time</td>
                        <td style="font-size: 14px; font-weight: 800; color: #0f172a;">📅 ${appointment.date} at ${appointment.time}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Consultation Mode</td>
                        <td style="font-size: 13px; font-weight: 600; color: #0f172a;">${appointment.type || 'Video Teleconsultation'}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Appointment ID</td>
                        <td style="font-size: 12px; font-family: monospace; color: #64748b;">${appointment.id}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${isVideo && appointment.meeting_link ? `
              <!-- Teleconsultation Link Button -->
              <div style="text-align: center; margin: 28px 0 24px;">
                <a href="${appointment.meeting_link}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
                  🎥 Join Secure Video Room
                </a>
                <p style="margin: 10px 0 0; font-size: 11px; color: #64748b;">
                  Direct link: <a href="${appointment.meeting_link}" style="color: #2563eb; word-break: break-all;">${appointment.meeting_link}</a>
                </p>
              </div>
              ` : ''}

              <!-- Preparation Instructions -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 10px 10px 0; margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px; font-size: 13px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">
                  📋 Consultation Checklist &amp; Instructions
                </h3>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #1e3a8a;">
                  <li>Please join or check-in <strong>5 minutes prior</strong> to your scheduled time.</li>
                  <li>Ensure your device camera, microphone, and a stable internet connection are active.</li>
                  <li>Have any recent lab records, previous prescriptions, or allergy details ready for the doctor.</li>
                  <li>Following the call, your verified e-prescription with digital seal will appear in your records.</li>
                </ul>
              </div>

              <!-- Emergency Notice -->
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                🚨 <strong>Medical Notice:</strong> If this is a life-threatening medical emergency or severe acute chest pain, please immediately call <strong>102</strong> for Nepal Emergency Ambulance Dispatch or proceed to the nearest trauma center.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #64748b;">
                XENON HEALTH NEPAL — SMART TELEMEDICINE &amp; NMC CLINICAL CARE
              </p>
              <p style="margin: 0; font-size: 10px; color: #94a3b8;">
                Sent automatically on behalf of your healthcare booking • Kathmandu, Nepal
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends automated appointment confirmation email via Gmail API
 * Uses the currently signed-in Google account token.
 */
export async function sendAppointmentConfirmationEmail(
  appointment: Appointment,
  recipientEmail: string,
  userOverrideToken?: string
): Promise<EmailSendResult> {
  const token = userOverrideToken || getCachedAccessToken();

  if (!token) {
    console.warn('Gmail API access token not available. Attempting token prompt or logging for dispatch...');
    return {
      success: false,
      error: 'Google Account not yet authorized with Gmail send permission. Please connect your Google account in the app.',
      sentTo: recipientEmail
    };
  }

  const subject = `🏥 Appointment Confirmed: Dr. ${appointment.doctor_name} (${appointment.date} at ${appointment.time}) — Xenon Health`;
  const htmlBody = generateAppointmentEmailHtml(appointment, recipientEmail);
  const rawBase64Email = createRawEmail(recipientEmail, 'me', subject, htmlBody);

  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: rawBase64Email
      })
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const errorMsg = errorJson?.error?.message || `HTTP ${response.status} failed to send via Gmail API`;
      console.error('Gmail API send error:', errorMsg);
      return {
        success: false,
        error: errorMsg,
        sentTo: recipientEmail
      };
    }

    const data = await response.json();
    console.log('✅ Automated appointment confirmation email successfully sent via Gmail API:', data.id);

    return {
      success: true,
      messageId: data.id,
      sentTo: recipientEmail
    };
  } catch (err: any) {
    console.error('Exception during Gmail API send:', err);
    return {
      success: false,
      error: err?.message || 'Network error communicating with Gmail API',
      sentTo: recipientEmail
    };
  }
}
