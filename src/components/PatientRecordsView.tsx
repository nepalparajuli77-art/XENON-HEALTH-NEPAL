import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Pill,
  Video,
  Printer,
  PlusCircle,
  Activity,
  ShieldCheck,
  Heart,
  User,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Settings as SettingsIcon,
  TrendingUp
} from 'lucide-react';
import { Appointment, Prescription, Language, User as UserType } from '../types';
import { t } from '../data/mockData';
import { RecordsPrivacyLock } from './RecordsPrivacyLock';
import { VitalsTelemetryTracker } from './VitalsTelemetryTracker';

interface PatientRecordsViewProps {
  appointments: Appointment[];
  prescriptions: Prescription[];
  currentUser: UserType;
  language: Language;
  onOpenVideoRoom: (apt: Appointment) => void;
  onIssueRxClick: () => void;
  onOpenPatientRegister?: () => void;
  onCancelAppointment?: (aptId: string) => void;
  onOpenConsultation?: () => void;
}

export const PatientRecordsView: React.FC<PatientRecordsViewProps> = ({
  appointments,
  prescriptions,
  currentUser,
  language,
  onOpenVideoRoom,
  onIssueRxClick,
  onOpenPatientRegister,
  onCancelAppointment,
  onOpenConsultation
}) => {
  const [activeTab, setActiveTab] = useState<'vitals' | 'appointments' | 'prescriptions'>('vitals');
  const [selectedAptId, setSelectedAptId] = useState<string>(appointments[0]?.id || '');
  const [selectedRxId, setSelectedRxId] = useState<string>(prescriptions[0]?.id || '');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Privacy Lock State (optional biometric / PIN requirement)
  const [isPrivacyEnabled, setIsPrivacyEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('telemed_privacy_lock_enabled');
    return saved === null ? true : saved === 'true';
  });

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    const lockEnabled = localStorage.getItem('telemed_privacy_lock_enabled');
    if (lockEnabled === 'false') return true;
    const sessionUnlocked = sessionStorage.getItem('telemed_records_unlocked');
    return sessionUnlocked === 'true';
  });

  const [showPrivacySettings, setShowPrivacySettings] = useState<boolean>(false);

  const handleUnlock = () => {
    setIsUnlocked(true);
    sessionStorage.setItem('telemed_records_unlocked', 'true');
  };

  const handleLockNow = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('telemed_records_unlocked');
  };

  const handlePrivacyToggle = (enabled: boolean) => {
    setIsPrivacyEnabled(enabled);
    if (!enabled) {
      setIsUnlocked(true);
      sessionStorage.setItem('telemed_records_unlocked', 'true');
    } else {
      setIsUnlocked(false);
      sessionStorage.removeItem('telemed_records_unlocked');
    }
  };

  const selectedApt = appointments.find((a) => a.id === selectedAptId) || appointments[0];
  const selectedRx = prescriptions.find((r) => r.id === selectedRxId) || prescriptions[0];

  // If locked, render security lock screen protecting confidential medical records
  if (isPrivacyEnabled && !isUnlocked) {
    return (
      <div className="space-y-6">
        <RecordsPrivacyLock
          language={language}
          onUnlock={handleUnlock}
          isLocked={true}
          onLockToggle={handlePrivacyToggle}
        />
      </div>
    );
  }

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {language === 'np' ? 'निश्चित (Confirmed)' : 'Confirmed'}
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            {language === 'np' ? 'सम्पन्न (Completed)' : 'Completed'}
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
            <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
            {language === 'np' ? 'रद्द गरिएको (Cancelled)' : 'Cancelled'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            {status}
          </span>
        );
    }
  };

  const handleConfirmCancel = () => {
    if (selectedApt && onCancelAppointment) {
      onCancelAppointment(selectedApt.id);
      setShowCancelModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Patient Profile Dossier Banner */}
      <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-5 border border-black/[0.08] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 text-white border border-white/20 flex items-center justify-center text-2xl font-bold shadow-md shadow-red-600/20">
              👤
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-black dark:text-white">
                  {currentUser.full_name}
                </h2>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  PID: {currentUser.id}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-black dark:text-white font-medium">
                <span>🩸 Blood Group: <b className="text-red-600 dark:text-red-400 font-bold">{currentUser.blood_group || 'O+'}</b></span>
                <span>🎂 Age: <b className="text-black dark:text-white font-bold">{currentUser.age || 29} yrs ({currentUser.gender || 'Male'})</b></span>
                <span>⚠️ Allergies: <b className="text-black dark:text-white font-bold">{currentUser.allergies?.join(', ') || 'None'}</b></span>
                <span>📞 Contact: <b className="text-black dark:text-white font-bold">{currentUser.phone}</b></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Privacy Lock Status Indicator & Controls */}
            {isPrivacyEnabled ? (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-full border border-slate-200 dark:border-slate-700">
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 px-2.5 py-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('privacyLock', language)}</span>
                </span>
                <button
                  onClick={handleLockNow}
                  title={language === 'np' ? 'अहिले लक गर्नुहोस्' : 'Lock Records Now'}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>{t('lockNow', language)}</span>
                </button>
                <button
                  onClick={() => setShowPrivacySettings(true)}
                  title={t('privacySettings', language)}
                  className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handlePrivacyToggle(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'np' ? 'गोपनीयता लक सक्षम गर्नुहोस्' : 'Enable Privacy Lock'}</span>
              </button>
            )}

            {onOpenPatientRegister && (
              <button
                onClick={onOpenPatientRegister}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer whitespace-nowrap"
              >
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'np' ? '+ नयाँ बिरामी दर्ता' : '+ Register Patient'}</span>
              </button>
            )}

            <button
              onClick={onIssueRxClick}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>{t('issuePrescription', language)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Section Switcher Tabs */}
      <div className="flex items-center p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('vitals')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'vitals'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-red-600" />
          <span>{language === 'np' ? 'भाइटल टेलिमेट्री (Vitals Telemetry)' : 'Vitals Telemetry Tracker'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-mono">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{t('appointmentsTab', language)}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 tabular-nums">
            {appointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'prescriptions'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Pill className="w-4 h-4 text-teal-600" />
          <span>{t('prescriptionsTab', language)}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 tabular-nums">
            {prescriptions.length}
          </span>
        </button>
      </div>

      {/* RENDER ACTIVE SUBVIEW */}
      {activeTab === 'vitals' && (
        <VitalsTelemetryTracker
          currentUser={currentUser}
          language={language}
          onOpenConsultation={onOpenConsultation}
        />
      )}

      {(activeTab === 'appointments' || activeTab === 'prescriptions') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Col (5 cols): List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {activeTab === 'appointments' ? (
                appointments.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'np' ? 'कुनै अपोइन्टमेन्ट छैन' : 'No consultations scheduled'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {language === 'np' ? 'डाक्टरसँग नयाँ परामर्श बुक गर्नुहोस्।' : 'Book a consultation with verified NMC specialists.'}
                    </p>
                  </div>
                ) : (
                  appointments.map((apt) => {
                    const isSelected = selectedApt?.id === apt.id;
                    return (
                      <div
                        key={apt.id}
                        onClick={() => setSelectedAptId(apt.id)}
                        className={`p-4 rounded-xl transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-xs'
                            : 'bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{apt.date} at {apt.time}</span>
                          </span>
                          {getStatusBadge(apt.status)}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 truncate">
                          {apt.doctor_name}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {apt.hospital_name}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{apt.type}</span>
                          <span className="font-bold text-slate-900 dark:text-white">NPR {apt.fee_npr}</span>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                prescriptions.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Pill className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'np' ? 'कुनै प्रिस्क्रिप्शन जारी भएको छैन' : 'No prescriptions issued'}
                    </p>
                  </div>
                ) : (
                  prescriptions.map((rx) => {
                    const isSelected = selectedRx?.id === rx.id;
                    return (
                      <div
                        key={rx.id}
                        onClick={() => setSelectedRxId(rx.id)}
                        className={`p-4 rounded-xl transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-400 dark:border-teal-700 shadow-xs'
                            : 'bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">
                            #{rx.id.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-slate-500">{rx.date}</span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {rx.doctor_name}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {rx.diagnosis}
                        </p>
                        <div className="mt-2 text-[11px] text-slate-500 truncate">
                          Rx: {rx.medicines.map((m) => m.name).join(', ')}
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* Right Col (7 cols): Full Interactive Document View */}
          <div className="lg:col-span-7">
            {activeTab === 'appointments' && selectedApt ? (
            <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-black/10 dark:border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800">
                    Teleconsultation Dossier
                  </span>
                  <h3 className="text-lg font-black text-black dark:text-white mt-2">
                    Consultation with {selectedApt.doctor_name}
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-bold">
                    {selectedApt.specialty} • {selectedApt.hospital}
                  </p>
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedApt.status)}
                </div>
              </div>

              {/* Status Alert Banner */}
              {selectedApt.status === 'Cancelled' ? (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-900 dark:text-red-200">
                      {language === 'np' ? 'यो अपोइन्टमेन्ट रद्द गरिएको छ।' : 'This appointment has been cancelled.'}
                    </p>
                    <p className="text-[11px] text-red-700 dark:text-red-300">
                      {language === 'np' ? 'आवश्यक परेमा नयाँ परामर्श बुक गर्न सक्नुहुन्छ।' : 'You can schedule a new consultation whenever needed.'}
                    </p>
                  </div>
                </div>
              ) : selectedApt.status === 'Completed' ? (
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      {language === 'np' ? 'यो परामर्श सम्पन्न भएको छ।' : 'This consultation has been completed.'}
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300">
                      {language === 'np' ? `निर्धारित मिति (${selectedApt.date}) पार भइसकेकोले सम्पन्न भएको चिन्ह लगाइएको छ।` : `Marked completed as the appointment date (${selectedApt.date}) has concluded.`}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Consultation Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10">
                  <span className="text-black dark:text-white opacity-70 block mb-0.5">Date & Time</span>
                  <span className="font-bold text-black dark:text-white">{selectedApt.date} ({selectedApt.time})</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10">
                  <span className="text-black dark:text-white opacity-70 block mb-0.5">Consultation Mode</span>
                  <span className="font-bold text-black dark:text-white">{selectedApt.type}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10">
                  <span className="text-black dark:text-white opacity-70 block mb-0.5">Fee Paid</span>
                  <span className="font-black text-black dark:text-white">NPR {selectedApt.fee_npr}</span>
                </div>
              </div>

              {/* Symptoms */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 space-y-1">
                <h5 className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>Reported Chief Complaints:</span>
                </h5>
                <p className="text-xs text-black dark:text-white leading-relaxed font-medium">
                  {selectedApt.symptoms}
                </p>
              </div>

              {/* Video Joiner Box & Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                {selectedApt.type.includes('Video') && selectedApt.status === 'Confirmed' ? (
                  <div className="flex-1 p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Encrypted Video Room</span>
                      </h5>
                      <p className="text-[11px] text-black dark:text-white opacity-85 mt-0.5 font-medium">
                        Doctor is online and awaiting connection.
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenVideoRoom(selectedApt)}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
                    >
                      <Video className="w-3.5 h-3.5 text-white" />
                      <span>{t('joinVideo', language)}</span>
                    </button>
                  </div>
                ) : <div />}

                {/* Cancel Button (Visible when appointment is Confirmed or Pending) */}
                {selectedApt.status === 'Confirmed' || selectedApt.status === 'Pending' ? (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 font-bold text-xs border border-red-200 dark:border-red-800 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      <span>{t('cancelAppointment', language)}</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : activeTab === 'prescriptions' && selectedRx ? (
            /* Official Digital Rx Viewer */
            <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none space-y-5">
              {/* Prescription Header */}
              <div className="text-center border-b border-black/10 dark:border-white/10 pb-4">
                <div className="flex items-center justify-center gap-2 text-black dark:text-white font-black text-sm tracking-wider">
                  <span>🇳🇵</span>
                  <span>XENON HEALTH DIGITAL PRESCRIPTION</span>
                </div>
                <p className="text-[11px] text-black dark:text-white opacity-80 font-medium mt-0.5">
                  Verified by Nepal Medical Council (NMC) Digital Health Protocol
                </p>
              </div>

              {/* Meta Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#F8FAFC] dark:bg-[#1E293B] p-3.5 rounded-2xl border border-black/10 dark:border-white/10">
                <div>
                  <span className="text-black dark:text-white opacity-70 block text-[10px]">Prescription ID:</span>
                  <span className="font-bold text-black dark:text-white">#{selectedRx.id.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-black dark:text-white opacity-70 block text-[10px]">Date Issued:</span>
                  <span className="font-bold text-black dark:text-white">{selectedRx.date}</span>
                </div>
                <div>
                  <span className="text-black dark:text-white opacity-70 block text-[10px]">Prescribing Specialist:</span>
                  <span className="font-bold text-black dark:text-white">{selectedRx.doctor_name}</span>
                </div>
              </div>

              {/* Vitals & Diagnosis */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block">
                    Clinical Diagnosis:
                  </span>
                  <span className="text-xs font-black text-black dark:text-white mt-0.5 block">
                    {selectedRx.diagnosis}
                  </span>
                </div>

                {selectedRx.vitals && (
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-[11px] space-y-0.5">
                    <span className="text-blue-700 dark:text-blue-400 font-bold block text-[10px]">Patient Vitals:</span>
                    <div className="flex items-center gap-3 text-black dark:text-white font-medium">
                      <span>BP: <b>{selectedRx.vitals.bp || '120/80'}</b></span>
                      <span>Pulse: <b>{selectedRx.vitals.pulse || '72 bpm'}</b></span>
                      <span>SpO2: <b>{selectedRx.vitals.sp_o2 || '99%'}</b></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Prescribed Medicines Table */}
              <div>
                <h4 className="text-xs font-black text-black dark:text-white mb-2 flex items-center gap-1.5">
                  <span className="text-red-600 dark:text-red-400 text-sm font-black">℞</span>
                  <span>{t('medicines', language)}</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] dark:bg-[#1E293B] text-black dark:text-white font-bold border-b border-black/10 dark:border-white/10">
                        <th className="py-2.5 px-3">Medicine Name & Instructions</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {selectedRx.medicines.map((m, i) => (
                        <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-[#1E293B]/50">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-black dark:text-white">{i + 1}. {m.name}</div>
                            <div className="text-[11px] text-black dark:text-white opacity-80 font-medium">{m.instructions}</div>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-black dark:text-white">{m.dosage}</td>
                          <td className="py-2.5 px-3 text-black dark:text-white font-medium">{m.frequency}</td>
                          <td className="py-2.5 px-3 font-medium text-black dark:text-white">{m.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advice & Follow-Up */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-xs space-y-1.5">
                <div>
                  <span className="font-bold text-black dark:text-white">Advice & Lifestyle: </span>
                  <span className="text-black dark:text-white font-medium">{selectedRx.lifestyle_advice}</span>
                </div>
                {selectedRx.follow_up_date && (
                  <div>
                    <span className="font-bold text-black dark:text-white">Follow-Up Date: </span>
                    <span className="text-black dark:text-white font-semibold">{selectedRx.follow_up_date}</span>
                  </div>
                )}
              </div>

              {/* Print Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => alert(`Prescription #${selectedRx.id} sent to print / PDF export.`)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 text-white font-bold text-xs shadow-md shadow-red-600/20 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>{t('printRx', language)}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-black dark:text-white opacity-60 rounded-[22px] bg-white/50 dark:bg-[#0F172A]/50 border border-slate-200 dark:border-slate-800">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="font-bold text-sm">
                {language === 'np' ? 'विवरण हेर्न बायाँ सूचीबाट चयन गर्नुहोस्।' : 'Select an appointment or prescription from the list on the left to view details.'}
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[24px] bg-white dark:bg-[#0F172A] p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">
                  {t('confirmCancelTitle', language)}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                  {t('confirmCancelMsg', language)}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E293B] text-xs space-y-1 border border-slate-200 dark:border-slate-800">
              <div><b>Doctor:</b> {selectedApt.doctor_name} ({selectedApt.specialty})</div>
              <div><b>Date &amp; Time:</b> {selectedApt.date} at {selectedApt.time}</div>
              <div><b>Hospital:</b> {selectedApt.hospital}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                {language === 'np' ? 'रद्द नगर्नुहोस्' : 'Keep Appointment'}
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
              >
                {language === 'np' ? 'हो, रद्द गर्नुहोस्' : 'Yes, Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Privacy Settings Modal */}
      {showPrivacySettings && (
        <RecordsPrivacyLock
          language={language}
          onUnlock={handleUnlock}
          isLocked={false}
          onLockToggle={handlePrivacyToggle}
          showSettingsOnly={true}
          onCloseSettingsOnly={() => setShowPrivacySettings(false)}
        />
      )}
    </div>
  );
};

