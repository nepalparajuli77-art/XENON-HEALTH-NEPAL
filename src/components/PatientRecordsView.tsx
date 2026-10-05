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
  TrendingUp,
  Download,
  CheckSquare
} from 'lucide-react';
import { Appointment, Prescription, Language, User as UserType } from '../types';
import { t } from '../data/mockData';
import { RecordsPrivacyLock } from './RecordsPrivacyLock';
import { VitalsTelemetryTracker } from './VitalsTelemetryTracker';
import { MedicalSummaryPdfModal } from './MedicalSummaryPdfModal';
import { triggerHaptic } from '../utils/haptics';

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
  const [activeTab, setActiveTab] = useState<'vitals' | 'appointments' | 'prescriptions' | 'timeline'>('vitals');
  const [selectedAptId, setSelectedAptId] = useState<string>(appointments[0]?.id || '');
  const [selectedRxId, setSelectedRxId] = useState<string>(prescriptions[0]?.id || '');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Privacy Lock State (optional biometric / PIN requirement)
  const [isPrivacyEnabled, setIsPrivacyEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('telemed_privacy_lock_enabled');
    return saved === 'true';
  });

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    const lockEnabled = localStorage.getItem('telemed_privacy_lock_enabled');
    if (lockEnabled !== 'true') return true;
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

  const [timelineFilter, setTimelineFilter] = useState<'all' | 'consultation' | 'prescription' | 'milestone'>('all');
  const [timelineSearch, setTimelineSearch] = useState('');

  const timelineEvents = React.useMemo(() => {
    const events: Array<{
      id: string;
      date: string;
      type: 'consultation' | 'prescription' | 'milestone';
      title: string;
      titleNp: string;
      subtitle: string;
      subtitleNp: string;
      status?: string;
      badgeColor: string;
      icon: React.ReactNode;
      notes?: string;
      notesNp?: string;
      meta?: any;
    }> = [];

    // 1. Add Appointments (Consultations)
    appointments.forEach((apt) => {
      events.push({
        id: `apt-${apt.id}`,
        date: apt.date,
        type: 'consultation',
        title: `Consultation with ${apt.doctor_name}`,
        titleNp: `${apt.doctor_name} सँगको परामर्श`,
        subtitle: `${apt.specialty} • ${apt.hospital}`,
        subtitleNp: `${apt.specialty} • ${apt.hospital}`,
        status: apt.status,
        badgeColor: apt.status === 'Completed' ? 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : apt.status === 'Cancelled' ? 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        icon: <Calendar className="w-4 h-4" />,
        notes: apt.symptoms || 'General OPD checkup and diagnosis.',
        notesNp: apt.symptoms || 'साधारण ओपीडी जाँच र निदान।',
        meta: apt
      });
    });

    // 2. Add Prescriptions
    prescriptions.forEach((rx) => {
      const medCount = Array.isArray(rx.medicines) ? rx.medicines.length : 0;
      events.push({
        id: `rx-${rx.id}`,
        date: rx.date,
        type: 'prescription',
        title: `Rx Issued by ${rx.doctor_name}`,
        titleNp: `${rx.doctor_name} द्वारा औषधि सिफारिस (Rx)`,
        subtitle: `${medCount} Medications prescribed`,
        subtitleNp: `${medCount} औषधिहरू सिफारिस गरिएको`,
        badgeColor: 'bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
        icon: <Pill className="w-4 h-4" />,
        notes: rx.lifestyle_advice || 'Follow medicine dosage timelines strictly.',
        notesNp: rx.lifestyle_advice || 'औषधिको मात्रा र तालिका कडाईका साथ पालना गर्नुहोस्।',
        meta: rx
      });
    });

    // 3. Add Milestones
    events.push({
      id: 'milestone-init',
      date: '2026-09-01',
      type: 'milestone',
      title: 'Digital Health Profile Created',
      titleNp: 'डिजिटल स्वास्थ्य प्रोफाइल सिर्जना गरियो',
      subtitle: 'Biometric profile & clinical allergies registered',
      subtitleNp: 'शारीरिक प्रोफाइल र क्लिनिकल एलर्जीहरू दर्ता गरियो',
      badgeColor: 'bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
      icon: <CheckSquare className="w-4 h-4" />,
      notes: `Registered under ID ${currentUser.id} with Blood Group ${currentUser.blood_group || 'O+'}`,
      notesNp: `ब्लड ग्रुप ${currentUser.blood_group || 'O+'} सहित आईडी ${currentUser.id} अन्तर्गत सफलतापूर्वक दर्ता गरियो`
    });

    // Sort chronologically (latest first)
    return events.sort((a, b) => b.date.localeCompare(a.date));
  }, [appointments, prescriptions, currentUser]);

  const filteredTimelineEvents = React.useMemo(() => {
    return timelineEvents.filter((ev) => {
      // 1. Tab filter
      if (timelineFilter !== 'all' && ev.type !== timelineFilter) return false;

      // 2. Search query filter
      if (timelineSearch.trim() !== '') {
        const query = timelineSearch.toLowerCase();
        const matchesText =
          ev.title.toLowerCase().includes(query) ||
          ev.titleNp.toLowerCase().includes(query) ||
          ev.subtitle.toLowerCase().includes(query) ||
          ev.subtitleNp.toLowerCase().includes(query) ||
          (ev.notes && ev.notes.toLowerCase().includes(query)) ||
          (ev.notesNp && ev.notesNp.toLowerCase().includes(query));
        return matchesText;
      }

      return true;
    });
  }, [timelineEvents, timelineFilter, timelineSearch]);

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
      <div className="rounded-[24px] liquid-glass-card p-5 border border-white/60 dark:border-white/10 shadow-sm transition-all">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white border border-white/10 flex items-center justify-center text-2xl font-bold shadow-md">
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

            {/* Official Export as PDF Action */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                setShowPdfModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md shadow-slate-900/10 transition-all cursor-pointer whitespace-nowrap hover:scale-[1.02]"
              title={language === 'np' ? 'मेडिकल इतिहास तथा औषधि विवरण PDF मा डाउनलोड गर्नुहोस्' : 'Export Medical History & Current Prescriptions as PDF'}
            >
              <FileText className="w-4 h-4 text-red-500" />
              <span>{language === 'np' ? 'PDF डाउनलोड (Export PDF)' : 'Export as PDF'}</span>
            </button>

            <button
              onClick={onIssueRxClick}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
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
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('vitals');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'vitals'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-blue-600" />
          <span>{language === 'np' ? 'भाइटल चेकलिस्ट (Vitals Checklist)' : 'Vitals Checklist & Log'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
            Daily
          </span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('appointments');
          }}
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
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('prescriptions');
          }}
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

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('timeline');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'timeline'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-purple-600" />
          <span>{language === 'np' ? 'मेडिकल टाइमलाइन (Timeline)' : 'Medical Timeline'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
            Interactive
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
                      className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
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

              {/* Export PDF & Print Button */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setShowPdfModal(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>{language === 'np' ? 'प्रमाणित मेडिकल रिपोर्ट PDF निर्यात' : 'Export Medical Dossier as PDF'}</span>
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

      {/* RENDER CHRONOLOGICAL TIMELINE VIEW WITH VERTICAL STEP INDICATORS */}
      {activeTab === 'timeline' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Controls & Timeline Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600 animate-pulse" />
              <div>
                <h3 className="text-sm font-black text-black dark:text-white">
                  {language === 'np' ? 'कालक्रम स्वास्थ्य इतिहास' : 'Chronological Health History'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {language === 'np' ? 'सबै चिकित्सकीय रेकर्ड र गतिविधिहरूको संक्षेप सूची' : 'Unified ledger of all consultation logs, Rx prescriptions & system milestones'}
                </p>
              </div>
            </div>

            {/* Live Search and Dynamic Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  placeholder={language === 'np' ? 'डाक्टर वा रेकर्ड खोज्नुहोस्...' : 'Search doctor, notes...'}
                  className="w-full sm:w-60 pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white font-medium"
                />
                <span className="absolute left-2.5 top-2.5 text-slate-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Tab Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            {(['all', 'consultation', 'prescription', 'milestone'] as const).map((filter) => {
              const isActive = timelineFilter === filter;
              const label = {
                all: language === 'np' ? 'सबै रेकर्डहरू' : 'All Events',
                consultation: language === 'np' ? 'परामर्शहरू' : 'Consultations',
                prescription: language === 'np' ? 'औषधि विवरण' : 'Prescriptions (Rx)',
                milestone: language === 'np' ? 'स्वास्थ्य माइलस्टोन' : 'Milestones'
              }[filter];

              return (
                <button
                  key={filter}
                  onClick={() => {
                    triggerHaptic('light');
                    setTimelineFilter(filter);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Real Timeline step vertical indicator list */}
          <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 md:ml-32 pl-6 md:pl-8 space-y-8 py-3">
            {filteredTimelineEvents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'np' ? 'कुनै नतिजा फेला परेन' : 'No records match search'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {language === 'np' ? 'सर्त परिमार्जन गरी पुन: प्रयास गर्नुहोस्।' : 'Try tweaking your filters or search terms.'}
                </p>
              </div>
            ) : (
              filteredTimelineEvents.map((ev) => {
                return (
                  <div key={ev.id} className="relative group">
                    {/* Timestamp Tag (Positioned absolutely on desktop, stacked on mobile) */}
                    <div className="absolute -left-28 md:flex flex-col items-end justify-center w-24 text-right hidden">
                      <span className="text-xs font-black text-black dark:text-white">{ev.date}</span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-purple-600 dark:text-purple-400">
                        {ev.type}
                      </span>
                    </div>

                    {/* Step Node Dot on the Vertical Line */}
                    <div className="absolute -left-[35px] md:-left-[41px] top-1.5 w-[18px] h-[18px] rounded-full border-[3.5px] border-white dark:border-[#0F172A] bg-purple-600 shadow-md ring-4 ring-purple-100 dark:ring-purple-950/40 z-10 flex items-center justify-center transition-transform group-hover:scale-110">
                      <div className="w-1 h-1 rounded-full bg-white" />
                    </div>

                    {/* Timeline Event Card container */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-300 relative group-hover:border-purple-500/40">
                      {/* Mobile Timestamp stack */}
                      <div className="flex md:hidden items-center justify-between mb-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <span>{ev.date}</span>
                        <span className="text-purple-600 dark:text-purple-400">{ev.type}</span>
                      </div>

                      {/* Card Content Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-3 mb-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${ev.badgeColor}`}>
                            {ev.icon}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {language === 'np' ? ev.titleNp : ev.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {language === 'np' ? ev.subtitleNp : ev.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Status tag */}
                        {ev.status && (
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            ev.status === 'Completed' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                            ev.status === 'Cancelled' ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' :
                            'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {ev.status}
                          </span>
                        )}
                      </div>

                      {/* Card Content Body */}
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3">
                        <p className="font-medium italic leading-relaxed">
                          "{language === 'np' ? ev.notesNp : ev.notes}"
                        </p>

                        {/* Detailed information based on event type */}
                        {ev.type === 'prescription' && ev.meta && (
                          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-1.5 mt-2">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                                  <th className="py-2 px-3">Medicine</th>
                                  <th className="py-2 px-3">Dosage</th>
                                  <th className="py-2 px-3">Duration</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                                {ev.meta.medicines.map((m: any, i: number) => (
                                  <tr key={i} className="hover:bg-slate-105 dark:hover:bg-slate-850">
                                    <td className="py-2 px-3">
                                      <div className="font-bold text-slate-900 dark:text-slate-200">{m.name}</div>
                                      <div className="text-[10px] text-slate-500 font-medium">{m.instructions}</div>
                                    </td>
                                    <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 font-semibold">{m.dosage} ({m.frequency})</td>
                                    <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 font-semibold">{m.duration}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {ev.type === 'consultation' && ev.meta && ev.meta.status === 'Confirmed' && (
                          <div className="flex items-center gap-2.5 pt-1.5">
                            <button
                              onClick={() => {
                                triggerHaptic('success');
                                onOpenVideoRoom(ev.meta);
                              }}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>{language === 'np' ? 'भिडियो परामर्श कक्षमा सामेल हुनुहोस्' : 'Join Telemedicine Video Room'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
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

      {/* Printable Formatted Medical Summary & PDF Export Modal */}
      <MedicalSummaryPdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        currentUser={currentUser}
        appointments={appointments}
        prescriptions={prescriptions}
        language={language}
      />
    </div>
  );
};

