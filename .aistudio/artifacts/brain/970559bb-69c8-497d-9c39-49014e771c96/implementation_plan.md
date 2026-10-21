# Implementation Plan: Automated Appointment Email Confirmations

Set up automated email notifications sent from your Google account via Gmail API whenever an appointment is booked, delivering a full consultation summary and video link to the patient.

## Proposed User Flow & Functionality
1. **Google Account Authorization:**
   - When signed in with Google, the app connects to the Gmail API (`https://www.googleapis.com/auth/gmail.send`).
   - If not yet connected or permission is needed, the user is prompted to connect their Google Workspace / Gmail account with a 1-click authorization card.

2. **Automated Trigger on Booking:**
   - In `BookModal.tsx` and appointment booking handlers, immediately upon confirmation:
     - Formats a clinical email with:
       - Doctor name, medical specialty, and hospital/clinic name
       - Scheduled date, time slot, and patient name
       - Direct video consultation meeting link
       - Pre-consultation instructions (vitals checklist, network requirements, medical reports preparation)
       - Emergency 102 helpline & cancel/reschedule info
     - Encodes the RFC 2822 email payload and sends it automatically through the Gmail API (`users.messages.send`).

3. **In-App Delivery Feedback:**
   - The booking confirmation modal displays a visual badge: `"Email confirmation sent to [patient email] from your Google account"`.
   - Records the dispatch event into the audit log in Firestore.

## Technical Tasks
- **OAuth & Gmail API Integration:** Ensure Google OAuth scope `https://www.googleapis.com/auth/gmail.send` is enabled.
- **Gmail Service Engine:** Implement `src/services/gmailNotificationService.ts` to construct RFC 2822 multipart emails and call Google REST API `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`.
- **Integration with BookModal:** Wire `BookModal.tsx` and `handleConfirmBooking` in `src/App.tsx` to automatically trigger the email upon booking completion.
- **Verification:** Test compilation, linting, and end-to-end appointment booking flow.
