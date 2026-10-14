import { getCachedAccessToken, googleSignIn } from '../lib/firebase.ts';

export interface GoogleContact {
  resourceName: string;
  name: string;
  email: string;
  phoneNumber: string;
}

// Converts a plaintext or HTML email to RFC 2822 base64url format for Gmail API
function makeBase64Email(to: string, from: string, subject: string, message: string): string {
  const str = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    message,
  ].join('\r\n');

  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export class WorkspaceService {
  private async getValidToken(): Promise<string> {
    let token = getCachedAccessToken();
    if (!token) {
      // Prompt sign in to get Workspace scopes
      const result = await googleSignIn();
      token = result?.accessToken || '';
    }
    if (!token) {
      throw new Error('Google authentication required to access Gmail & Contacts.');
    }
    return token;
  }

  // 1. Send Account Recovery Email via Gmail API
  async sendAccountRecoveryEmail(
    toEmail: string,
    verificationCode: string,
    patientName: string = 'Valued Patient'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const token = await this.getValidToken();
      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 18px;">
            <h2 style="color: #0f766e; margin: 0; font-size: 22px;">Xenon Aid Nepal — Account Recovery</h2>
            <p style="color: #64748b; margin: 4px 0 0; font-size: 13px;">Secure Telemedicine & Emergency Medevac Portal</p>
          </div>
          <p style="font-size: 15px; color: #334155;">Namaste ${patientName},</p>
          <p style="font-size: 14px; color: #475569;">A request was made to recover access to your Xenon Health portal account. Please use the secure one-time verification code below:</p>
          <div style="background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f766e; font-family: monospace;">${verificationCode}</span>
          </div>
          <p style="font-size: 13px; color: #64748b;">This code expires in 10 minutes. If you did not request this recovery, please notify hospital security immediately.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 12px;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">National Emergency Medevac Service &bull; Kathmandu, Nepal &bull; Call 102</p>
        </div>
      `;

      const raw = makeBase64Email(toEmail, 'me', 'Xenon Aid Nepal: Your Secure Account Recovery Code', htmlBody);

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gmail API error (${res.status})`);
      }

      const data = await res.json();
      return { success: true, messageId: data.id };
    } catch (err: any) {
      console.error('Failed to send recovery email via Gmail API:', err);
      return { success: false, error: err?.message || 'Failed to send recovery email' };
    }
  }

  // 2. Notify Patient via Gmail API (Appointment, Medevac Dispatch, Prescription)
  async notifyPatient(
    toEmail: string,
    subject: string,
    notificationTitle: string,
    messageDetails: string,
    patientName: string = 'Patient'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const token = await this.getValidToken();
      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px;">
            <h2 style="color: #1d4ed8; margin: 0; font-size: 22px;">Xenon Clinical Update</h2>
            <p style="color: #64748b; margin: 4px 0 0; font-size: 13px;">Official Notification from Xenon Aid Nepal</p>
          </div>
          <p style="font-size: 15px; color: #334155;">Namaste ${patientName},</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 18px 0; border-radius: 4px;">
            <h4 style="margin: 0 0 6px; color: #1e293b; font-size: 16px;">${notificationTitle}</h4>
            <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">${messageDetails}</p>
          </div>
          <p style="font-size: 13px; color: #64748b;">You can view and manage your telemedicine records directly in the Xenon portal.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 12px;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">Xenon Telemedicine &bull; Emergency Coordination Desk: +977-1-4000000</p>
        </div>
      `;

      const raw = makeBase64Email(toEmail, 'me', subject, htmlBody);

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gmail API error (${res.status})`);
      }

      const data = await res.json();
      return { success: true, messageId: data.id };
    } catch (err: any) {
      console.error('Failed to send notification via Gmail API:', err);
      return { success: false, error: err?.message || 'Failed to dispatch email' };
    }
  }

  // 3. Fetch Google Contacts (Phonebook for emergency contacts & next of kin)
  async getGoogleContacts(): Promise<{ success: boolean; contacts: GoogleContact[]; error?: string }> {
    try {
      const token = await this.getValidToken();
      const res = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=50',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Google People API error (${res.status})`);
      }

      const data = await res.json();
      const connections = data.connections || [];
      const contacts: GoogleContact[] = connections.map((c: any) => {
        const name = c.names?.[0]?.displayName || 'Unnamed Contact';
        const email = c.emailAddresses?.[0]?.value || '';
        const phoneNumber = c.phoneNumbers?.[0]?.value || '';
        return {
          resourceName: c.resourceName,
          name,
          email,
          phoneNumber,
        };
      });

      return { success: true, contacts };
    } catch (err: any) {
      console.error('Failed to fetch Google Contacts:', err);
      return { success: false, contacts: [], error: err?.message || 'Failed to fetch contacts' };
    }
  }
}

export const workspaceService = new WorkspaceService();
