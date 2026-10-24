import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Users,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Phone,
  UserCheck,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Lock
} from 'lucide-react';
import { workspaceService, GoogleContact } from '../services/workspace.ts';
import { User, Language } from '../types.ts';
import { api } from '../services/api.ts';

interface WorkspaceIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentUser: User | null;
  onUpdateCurrentUser?: (user: User) => void;
  initialTab?: 'recovery' | 'notify' | 'contacts';
}

export const WorkspaceIntegrationsModal: React.FC<WorkspaceIntegrationsModalProps> = ({
  isOpen,
  onClose,
  language,
  currentUser,
  onUpdateCurrentUser,
  initialTab = 'notify'
}) => {
  const [activeTab, setActiveTab] = useState<'recovery' | 'notify' | 'contacts'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Recovery State
  const [recoveryEmail, setRecoveryEmail] = useState(currentUser?.email || '');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Notification State
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubject, setNotifySubject] = useState('Xenon Aid Nepal: Appointment Confirmation');
  const [notifyTitle, setNotifyTitle] = useState('Telemedicine Appointment Scheduled');
  const [notifyDetails, setNotifyDetails] = useState(
    'Your teleconsultation has been confirmed. Please connect to the video portal at your scheduled time.'
  );
  const [isSendingNotify, setIsSendingNotify] = useState(false);
  const [notifySuccessMsg, setNotifySuccessMsg] = useState<string | null>(null);
  const [notifyErrorMsg, setNotifyErrorMsg] = useState<string | null>(null);

  // Contacts State
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<GoogleContact | null>(null);
  const [savedContactMsg, setSavedContactMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'contacts' && contacts.length === 0) {
      loadContacts();
    }
  }, [activeTab]);

  const loadContacts = async () => {
    setIsLoadingContacts(true);
    setContactsError(null);
    try {
      const res = await workspaceService.getGoogleContacts();
      if (res.success) {
        setContacts(res.contacts);
      } else {
        setContactsError(res.error || 'Failed to fetch Google Contacts');
      }
    } catch (err: any) {
      setContactsError(err?.message || 'Error connecting to Google Contacts');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleSendRecoveryCode = async () => {
    if (!recoveryEmail.trim() || !recoveryEmail.includes('@')) {
      setRecoveryError('Please enter a valid email address.');
      return;
    }

    setIsSendingOtp(true);
    setRecoveryError(null);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const res = await workspaceService.sendAccountRecoveryEmail(
        recoveryEmail.trim(),
        code,
        currentUser?.full_name || 'Patient'
      );

      if (res.success) {
        setGeneratedOtp(code);
      } else {
        setRecoveryError(res.error || 'Failed to send recovery email via Gmail API.');
      }
    } catch (err: any) {
      setRecoveryError(err?.message || 'Gmail dispatch failed');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtpAndReset = async () => {
    if (enteredOtp !== generatedOtp) {
      setRecoveryError('Invalid verification code. Please check your Gmail inbox.');
      return;
    }
    if (newPassword.length < 6) {
      setRecoveryError('Password must be at least 6 characters.');
      return;
    }

    // Save password update
    if (currentUser) {
      const updated = { ...currentUser, password: newPassword };
      await api.updateUser(currentUser.id, { password: newPassword });
      if (onUpdateCurrentUser) onUpdateCurrentUser(updated);
    }

    setRecoverySuccess(true);
    setRecoveryError(null);
  };

  const handleSendPatientNotification = async () => {
    if (!notifyEmail.trim()) {
      setNotifyErrorMsg('Recipient email is required.');
      return;
    }

    setIsSendingNotify(true);
    setNotifyErrorMsg(null);
    setNotifySuccessMsg(null);

    try {
      const res = await workspaceService.notifyPatient(
        notifyEmail.trim(),
        notifySubject,
        notifyTitle,
        notifyDetails,
        'Patient'
      );

      if (res.success) {
        setNotifySuccessMsg(`Notification successfully sent to ${notifyEmail} via Gmail!`);
        setTimeout(() => setNotifySuccessMsg(null), 4000);
      } else {
        setNotifyErrorMsg(res.error || 'Failed to dispatch email');
      }
    } catch (err: any) {
      setNotifyErrorMsg(err?.message || 'Error dispatching Gmail notification');
    } finally {
      setIsSendingNotify(false);
    }
  };

  const handleSelectAsEmergencyContact = async (contact: GoogleContact) => {
    setSelectedContact(contact);
    if (currentUser && contact.phoneNumber) {
      const updated = {
        ...currentUser,
        emergency_contact: `${contact.name} (${contact.phoneNumber})`
      };
      await api.updateUser(currentUser.id, { emergency_contact: updated.emergency_contact });
      if (onUpdateCurrentUser) onUpdateCurrentUser(updated);
      setSavedContactMsg(`Saved ${contact.name} as your primary Emergency Contact!`);
      setTimeout(() => setSavedContactMsg(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-red-600 to-blue-600 text-white shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Google Workspace Integration</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Gmail & Contacts
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official API services for patient notifications, account recovery & phonebook
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('notify')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'notify'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Telemedicine Alerts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'contacts'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Emergency Contacts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recovery')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'recovery'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Password Reset</span>
          </button>
        </div>

        {/* TAB 1: ACCOUNT RECOVERY VIA GMAIL */}
        {activeTab === 'recovery' && (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
              <p className="font-semibold">
                Recover account access using your registered Gmail address. We will send a secure 6-digit OTP code directly to your inbox via the Gmail API.
              </p>
            </div>

            {recoveryError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-black text-emerald-900 dark:text-emerald-200">
                  Account Recovered Successfully!
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Your new password is now active in the authoritative database. You can sign in right away.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-md hover:bg-emerald-700"
                >
                  Done
                </button>
              </div>
            ) : !generatedOtp ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gmail Address
                  </label>
                  <input
                    type="email"
                    placeholder="your-email@gmail.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendRecoveryCode}
                  disabled={isSendingOtp}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingOtp ? (
                    <span>Dispatching via Gmail API...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Recovery Code via Gmail</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  ✓ Verification code sent to {recoveryEmail}! Please enter it below.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-lg font-mono tracking-widest text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Secure Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtpAndReset}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Code & Reset Password</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NOTIFY PATIENT VIA GMAIL */}
        {activeTab === 'notify' && (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200">
              <p className="font-semibold">
                Dispatch official healthcare notifications, appointment confirmations, and clinical alerts to patients using the Gmail API.
              </p>
            </div>

            {notifySuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{notifySuccessMsg}</span>
              </div>
            )}

            {notifyErrorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{notifyErrorMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Patient Email Address
                </label>
                <input
                  type="email"
                  placeholder="patient@example.com"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={notifySubject}
                  onChange={(e) => setNotifySubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={notifyTitle}
                  onChange={(e) => setNotifyTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Message Details
                </label>
                <textarea
                  rows={3}
                  value={notifyDetails}
                  onChange={(e) => setNotifyDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleSendPatientNotification}
                disabled={isSendingNotify}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSendingNotify ? (
                  <span>Sending via Gmail API...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Patient Email Notification</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: GOOGLE CONTACTS */}
        {activeTab === 'contacts' && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Sync emergency contacts & next of kin directly from your Google Contacts phonebook.
              </p>
              <button
                type="button"
                onClick={loadContacts}
                disabled={isLoadingContacts}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingContacts ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {savedContactMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{savedContactMsg}</span>
              </div>
            )}

            {contactsError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{contactsError}</span>
              </div>
            )}

            {isLoadingContacts ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                <span>Loading Google Contacts from People API...</span>
              </div>
            ) : contacts.length === 0 ? (
              <div className="py-8 text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No contacts found or authorization pending.
                </p>
                <button
                  type="button"
                  onClick={loadContacts}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-sm hover:bg-blue-700"
                >
                  Connect & Fetch Google Contacts
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {contacts.map((c) => (
                  <div
                    key={c.resourceName}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        {c.phoneNumber && <span>📞 {c.phoneNumber}</span>}
                        {c.email && <span>✉️ {c.email}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.phoneNumber && (
                        <a
                          href={`tel:${c.phoneNumber}`}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                          title="Call Contact"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSelectAsEmergencyContact(c)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                      >
                        Set as Emergency Contact
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
