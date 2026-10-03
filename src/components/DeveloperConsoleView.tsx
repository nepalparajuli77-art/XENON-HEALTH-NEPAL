import React, { useState, useEffect } from 'react';
import {
  Users,
  Stethoscope,
  Edit3,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Lock,
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  X,
  Save,
  UserCheck,
  AlertCircle,
  Eye,
  Activity,
  ArrowRight,
  Radio,
  Send,
  RefreshCw,
  KeyRound,
  Check,
  Zap,
  Filter,
  FileText
} from 'lucide-react';
import { Doctor, User, Appointment, Prescription, Language, ActivityLog } from '../types';
import { getActivityLogs, saveActivityLogs, addActivityLog } from '../data/activityService';
import { Logo } from './Logo';

interface DeveloperConsoleViewProps {
  doctors: Doctor[];
  users: User[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  language: Language;
  onAddDoctor: (doctor: Doctor) => void;
  onUpdateDoctor: (doctor: Doctor) => void;
  onDeleteDoctor: (doctorId: string) => void;
  onUpdatePatient: (user: User) => void;
  onUpdateAppointment?: (apt: Appointment) => void;
  onSwitchUserSession: (user: User) => void;
  onNavigate: (tab: string) => void;
}

export const DeveloperConsoleView: React.FC<DeveloperConsoleViewProps> = ({
  doctors,
  users,
  appointments,
  prescriptions,
  language,
  onAddDoctor,
  onUpdateDoctor,
  onDeleteDoctor,
  onUpdatePatient,
  onUpdateAppointment,
  onSwitchUserSession,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'doctors' | 'patients' | 'appointments'>('activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Live Dynamic Activity Stream State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => getActivityLogs());
  const [activityFilter, setActivityFilter] = useState<'all' | 'patient' | 'doctor' | 'security'>('all');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Modals for Editing Info
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editingPatient, setEditingPatient] = useState<User | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showCredentialDocModal, setShowCredentialDocModal] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);

  // New Doctor Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocNmc, setNewDocNmc] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('Cardiothoracic Surgery & Cardiology');
  const [newDocHospital, setNewDocHospital] = useState('Shahid Gangalal National Heart Centre');
  const [newDocDegrees, setNewDocDegrees] = useState('MBBS, MD');
  const [newDocFee, setNewDocFee] = useState(1000);
  const [newDocSchedule, setNewDocSchedule] = useState('Sun - Fri (09:00 AM - 03:00 PM)');
  const [newDocPin, setNewDocPin] = useState('1234');

  // Sync logs periodically or upon change
  useEffect(() => {
    setActivityLogs(getActivityLogs());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Doctor Edit Handlers
  const handleSaveDoctorChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    onUpdateDoctor(editingDoctor);

    addActivityLog({
      actorType: 'admin',
      actorName: 'System Admin',
      action: 'Doctor Info Updated',
      category: 'status',
      details: `Modified clinical parameters, schedule or fee for ${editingDoctor.name}.`,
      status: 'completed'
    });
    setActivityLogs(getActivityLogs());

    showToast(`Updated doctor info for ${editingDoctor.name}`);
    setEditingDoctor(null);
  };

  // Patient Edit Handlers
  const handleSavePatientChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    onUpdatePatient(editingPatient);

    addActivityLog({
      actorType: 'admin',
      actorName: 'System Admin',
      action: 'Patient Dossier Updated',
      category: 'status',
      details: `Admin modified profile, contact or emergency SOS for ${editingPatient.full_name}.`,
      status: 'completed'
    });
    setActivityLogs(getActivityLogs());

    showToast(`Updated patient profile for ${editingPatient.full_name}`);
    setEditingPatient(null);
  };

  // Appointment Edit Handlers
  const handleSaveAppointmentChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;
    if (onUpdateAppointment) {
      onUpdateAppointment(editingAppointment);
    }

    addActivityLog({
      actorType: 'admin',
      actorName: 'System Admin',
      action: 'Appointment Rescheduled',
      category: 'appointment',
      details: `Admin rescheduled appointment #${editingAppointment.id} to ${editingAppointment.date} (${editingAppointment.time}).`,
      status: 'completed'
    });
    setActivityLogs(getActivityLogs());

    showToast(`Updated appointment for ${editingAppointment.patient_name}`);
    setEditingAppointment(null);
  };

  // Dispatch Email Reset to nepal.parajuli.77@gmail.com
  const handleDispatchDoctorReset = (doc: Doctor) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    addActivityLog({
      actorType: 'admin',
      actorName: 'System Admin',
      action: 'Doctor Access Token Dispatched',
      category: 'security',
      details: `One-time reset token (${code}) sent to nepal.parajuli.77@gmail.com for ${doc.name} (${doc.nmc_number}).`,
      status: 'completed',
      targetEmail: 'nepal.parajuli.77@gmail.com'
    });
    setActivityLogs(getActivityLogs());
    showToast(`Security reset token sent to nepal.parajuli.77@gmail.com for ${doc.name}!`);
  };

  // Dynamic Live Action Triggers
  const handleTriggerLiveBooking = () => {
    const randomDoctor = doctors[0] || { name: 'Dr. Bhagwan Koirala', id: 'doc_001', fee_npr: 1500, specialty: 'Cardiothoracic Surgery' };
    const simulatedApt: Appointment = {
      id: `apt_${Date.now()}`,
      patient_username: 'nepal',
      patient_name: 'Nepal Parajuli',
      doctor_id: randomDoctor.id,
      doctor_name: randomDoctor.name,
      specialty: randomDoctor.specialty,
      hospital: randomDoctor.hospital || 'Shahid Gangalal Hospital',
      date: new Date().toISOString().split('T')[0],
      time: '03:30 PM',
      type: 'Video Consultation',
      status: 'Confirmed',
      symptoms: 'Dynamic teleconsultation initiated by admin control simulator.',
      fee_npr: randomDoctor.fee_npr
    };

    if (onUpdateAppointment) {
      onUpdateAppointment(simulatedApt);
    }

    addActivityLog({
      actorType: 'patient',
      actorName: 'Nepal Parajuli',
      action: 'Dynamic Consultation Scheduled',
      category: 'appointment',
      details: `Real-time booking created with ${randomDoctor.name} for 03:30 PM.`,
      status: 'completed'
    });
    setActivityLogs(getActivityLogs());
    showToast(`Dynamic booking simulated for Nepal Parajuli with ${randomDoctor.name}!`);
  };

  const handleTriggerLiveVitalsLog = () => {
    addActivityLog({
      actorType: 'patient',
      actorName: 'Nepal Parajuli',
      action: 'Dynamic Vitals Telemetry Synced',
      category: 'vitals',
      details: 'SpO2 sensor synced: 99%, Resting BP: 122/82 mmHg, Pulse: 72 bpm in Kathmandu.',
      status: 'completed'
    });
    setActivityLogs(getActivityLogs());
    showToast('Dynamic vitals logged to Nepal Parajuli Personal Health Vault!');
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    addActivityLog({
      actorType: 'admin',
      actorName: 'System Admin',
      action: 'System-wide Urgent Bulletin Broadcast',
      category: 'broadcast',
      details: broadcastMessage.trim(),
      status: 'completed'
    });
    setActivityLogs(getActivityLogs());
    showToast('Urgent medical broadcast published across all portals!');
    setBroadcastMessage('');
    setShowBroadcastModal(false);
  };

  // Add New Doctor Submit
  const handleCreateDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocNmc.trim()) return;

    const newDoc: Doctor = {
      id: `doc_${Date.now()}`,
      name: newDocName.trim().startsWith('Dr.') ? newDocName.trim() : `Dr. ${newDocName.trim()}`,
      nmc_number: newDocNmc.trim().toUpperCase(),
      specialty: newDocSpecialty.trim(),
      specialty_np: newDocSpecialty.trim(),
      hospital_id: 'hosp_001',
      hospital: newDocHospital.trim(),
      degrees: newDocDegrees.trim(),
      experience_years: 10,
      fee_npr: Number(newDocFee) || 1000,
      available: true,
      rating: 5.0,
      reviews_count: 1,
      languages: ['Nepali', 'English'],
      schedule: newDocSchedule.trim(),
      pin: newDocPin.trim() || '1234'
    };

    onAddDoctor(newDoc);

    addActivityLog({
      actorType: 'admin',
      actorName: 'System Admin',
      action: 'New Doctor Onboarded',
      category: 'status',
      details: `Added certified specialist ${newDoc.name} (${newDoc.nmc_number}) to directory.`,
      status: 'completed'
    });
    setActivityLogs(getActivityLogs());

    showToast(`Added ${newDoc.name} (${newDoc.nmc_number})`);
    setShowAddDoctorModal(false);
    setNewDocName('');
    setNewDocNmc('');
  };

  const patientUsers = users.filter((u) => u.role === 'patient');

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.nmc_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.hospital.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPatients = patientUsers.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.district && p.district.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredAppointments = appointments.filter(
    (a) =>
      a.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.symptoms && a.symptoms.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredActivityLogs = activityLogs.filter((log) => {
    if (activityFilter === 'patient' && log.actorType !== 'patient') return false;
    if (activityFilter === 'doctor' && log.actorType !== 'doctor') return false;
    if (activityFilter === 'security' && log.category !== 'security') return false;
    if (searchQuery) {
      return (
        log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto px-2 sm:px-4">
      {/* Modern High-Tech Brand Header & Overview */}
      <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Logo size={48} showBadge={false} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                System Administrator Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-400/30">
                Live Dynamic Control
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Real-time monitoring and active operational control over patient bookings, doctor certifications, activity telemetry, and access recovery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setShowCredentialDocModal(true)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-md shadow-slate-900/40 flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Accounts &amp; Credentials Doc</span>
          </button>

          <button
            onClick={() => setShowBroadcastModal(true)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Radio className="w-4 h-4 text-white" />
            <span>Broadcast Bulletin</span>
          </button>

          <button
            onClick={() => setShowAddDoctorModal(true)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Doctor</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none shadow-xs">
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
              activeTab === 'activity'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Activity Control ({activityLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
              activeTab === 'doctors'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctors ({doctors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
              activeTab === 'patients'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Patients ({patientUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
              activeTab === 'appointments'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments ({appointments.length})</span>
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records, logs or doctors..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-xs"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: LIVE ACTIVITY STREAM & DYNAMIC CONTROL */}
      {/* ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          {/* Quick Simulation & Control Panel */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Dynamic Activity Controller &amp; Event Injector
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate and inject dynamic events to control user sessions and verify real-time platform reactivity.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleTriggerLiveBooking}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Simulate Live Booking</span>
              </button>

              <button
                onClick={handleTriggerLiveVitalsLog}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Log Vitals (Nepal Parajuli)</span>
              </button>

              <button
                onClick={() => handleDispatchDoctorReset(doctors[0])}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                <span>Send Security Reset</span>
              </button>
            </div>
          </div>

          {/* Activity Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(['all', 'patient', 'doctor', 'security'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActivityFilter(filter)}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border ${
                  activityFilter === filter
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                {filter === 'all' ? 'All Activities' : `${filter} events`}
              </button>
            ))}
          </div>

          {/* Activity Stream Feed */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Showing {filteredActivityLogs.length} dynamic system events:
              </span>
              <button
                onClick={() => {
                  setActivityLogs(getActivityLogs());
                  showToast('Activity stream refreshed.');
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Stream</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredActivityLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        log.actorType === 'doctor'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : log.actorType === 'patient'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      }`}
                    >
                      {log.actorType === 'doctor' ? '👨‍⚕️' : log.actorType === 'patient' ? '🧑‍💼' : '🛡️'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {log.actorName}
                        </span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {log.action}
                        </span>
                        {log.targetEmail && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                            ✉️ {log.targetEmail}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {log.details}
                      </p>

                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    Live Synced
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DOCTORS MONITORING & ACTIVE CONTROL */}
      {/* ========================================================================= */}
      {activeTab === 'doctors' && (
        <div className="space-y-3">
          {/* Header Action Banner */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>NMC Certified Doctors Directory ({filteredDoctors.length} Specialists)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Onboard new licensed practitioners, configure distinct security PINs, toggle live OPD availability, or adjust consultation fees.
              </p>
            </div>
            <button
              onClick={() => setShowAddDoctorModal(true)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Doctor</span>
            </button>
          </div>

          {/* Desktop & Tablet Table View */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Doctor &amp; License</th>
                  <th className="py-3 px-4">Specialty &amp; Hospital</th>
                  <th className="py-3 px-4">Fee (NPR)</th>
                  <th className="py-3 px-4">Security Access</th>
                  <th className="py-3 px-4">OPD Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{doc.name}</div>
                      <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                        {doc.nmc_number}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div className="font-medium text-slate-900 dark:text-white">{doc.specialty}</div>
                      <div className="text-[11px] text-slate-500">{doc.hospital}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      NPR {doc.fee_npr}
                    </td>
                    <td className="py-3 px-4">
                      {/* NO PLAINTEXT PASSWORD! Secure Reset button */}
                      <button
                        onClick={() => handleDispatchDoctorReset(doc)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer"
                        title="Send reset link to nepal.parajuli.77@gmail.com"
                      >
                        <Lock className="w-3 h-3 text-blue-600" />
                        <span>Reset via Email</span>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          const updated = { ...doc, available: !doc.available };
                          onUpdateDoctor(updated);
                          addActivityLog({
                            actorType: 'admin',
                            actorName: 'System Admin',
                            action: 'Doctor OPD Availability Changed',
                            category: 'status',
                            details: `${doc.name} status toggled to ${updated.available ? 'Available' : 'Busy'}.`,
                            status: 'completed'
                          });
                          setActivityLogs(getActivityLogs());
                          showToast(`${doc.name} set to ${updated.available ? 'Available' : 'Busy'}`);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          doc.available
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                        title="Click to toggle availability"
                      >
                        {doc.available ? '● Available' : '○ Busy'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingDoctor(doc)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Change Info</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${doc.name}?`)) {
                              onDeleteDoctor(doc.id);
                              showToast(`Removed ${doc.name}`);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Delete Doctor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Screen Card View */}
          <div className="md:hidden space-y-3">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{doc.name}</h3>
                    <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                      {doc.nmc_number}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.available
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {doc.available ? 'Available' : 'Busy'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-medium text-slate-900 dark:text-white">{doc.specialty}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{doc.hospital}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500">Fee: </span>
                    <span className="font-bold text-slate-900 dark:text-white">NPR {doc.fee_npr}</span>
                  </div>
                  <button
                    onClick={() => handleDispatchDoctorReset(doc)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Reset Access</span>
                  </button>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setEditingDoctor(doc)}
                    className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Change Info</span>
                  </button>
                  <button
                    onClick={() => {
                      const updated = { ...doc, available: !doc.available };
                      onUpdateDoctor(updated);
                      showToast(`${doc.name} set to ${updated.available ? 'Available' : 'Busy'}`);
                    }}
                    className="px-3 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Toggle Status
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove ${doc.name}?`)) {
                        onDeleteDoctor(doc.id);
                        showToast(`Removed ${doc.name}`);
                      }
                    }}
                    className="p-2 min-h-[40px] rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PATIENTS MONITORING & DYNAMIC CONTROL */}
      {/* ========================================================================= */}
      {activeTab === 'patients' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredPatients.map((pat) => (
              <div
                key={pat.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                        {pat.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {pat.full_name}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ID: {pat.id}
                          </span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                            🩸 {pat.blood_group || 'O+'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingPatient(pat)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Change Info</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-900 dark:text-white">{pat.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{pat.email || 'None'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{pat.district || 'Kathmandu'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
                      <span className="text-[10px] px-1 rounded bg-red-100 dark:bg-red-950/70">SOS</span>
                      <span className="truncate">{pat.emergency_contact || '+977-9841234567'}</span>
                    </div>
                  </div>

                  {pat.allergies && pat.allergies.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1 flex-wrap text-[11px]">
                      <span className="text-slate-400 font-medium">Allergies:</span>
                      {pat.allergies.map((all, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium text-[10px] border border-amber-200 dark:border-amber-900"
                        >
                          {all}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Age: {pat.age || 28} • {pat.gender || 'Male'}
                  </span>
                  <button
                    onClick={() => {
                      onSwitchUserSession(pat);
                      onNavigate('dashboard');
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View Health Vault</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: APPOINTMENTS MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'appointments' && (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No appointments scheduled yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Doctor</th>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Change Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {apt.patient_name}
                      </td>
                      <td className="py-3 px-4 text-purple-600 dark:text-purple-400 font-bold">
                        {apt.doctor_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {apt.date} ({apt.time})
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {apt.type}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={apt.status}
                          onChange={(e) => {
                            if (onUpdateAppointment) {
                              const updated: Appointment = {
                                ...apt,
                                status: e.target.value as Appointment['status']
                              };
                              onUpdateAppointment(updated);
                              showToast(`Status updated to ${updated.status} for ${apt.patient_name}`);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border focus:outline-none cursor-pointer ${
                            apt.status === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                              : apt.status === 'Completed'
                              ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800'
                              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800'
                          }`}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setEditingAppointment(apt)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Reschedule / Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BROADCAST EMERGENCY BULLETIN */}
      {/* ========================================================================= */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Broadcast Urgent Bulletin
                </h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Urgent Notice Message
                </label>
                <textarea
                  required
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Kathmandu Valley High-Altitude Dengue Advisory & 24/7 Red Cross dispatch active..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CHANGE DOCTOR INFO */}
      {/* ========================================================================= */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Change Doctor Information
                </h3>
              </div>
              <button
                onClick={() => setEditingDoctor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctorChanges} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Doctor Full Name</label>
                <input
                  type="text"
                  required
                  value={editingDoctor.name}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">NMC License</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.nmc_number}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, nmc_number: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Security PIN Reset</label>
                  <button
                    type="button"
                    onClick={() => handleDispatchDoctorReset(editingDoctor)}
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Send Reset Email</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Specialty</label>
                <input
                  type="text"
                  required
                  value={editingDoctor.specialty}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Hospital</label>
                <input
                  type="text"
                  required
                  value={editingDoctor.hospital}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, hospital: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Consultation Fee (NPR)</label>
                  <input
                    type="number"
                    value={editingDoctor.fee_npr}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, fee_npr: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">OPD Status</label>
                  <select
                    value={editingDoctor.available ? 'true' : 'false'}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, available: e.target.value === 'true' })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="true">Available for OPD</option>
                    <option value="false">Busy / In Surgery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">OPD Schedule</label>
                <input
                  type="text"
                  value={editingDoctor.schedule}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, schedule: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Doctor Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHANGE PATIENT INFO */}
      {/* ========================================================================= */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Change Patient Information
                </h3>
              </div>
              <button
                onClick={() => setEditingPatient(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePatientChanges} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingPatient.full_name}
                  onChange={(e) => setEditingPatient({ ...editingPatient, full_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.phone}
                    onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Blood Group</label>
                  <select
                    value={editingPatient.blood_group || 'O+'}
                    onChange={(e) => setEditingPatient({ ...editingPatient, blood_group: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingPatient.email}
                    onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">District / City</label>
                  <input
                    type="text"
                    value={editingPatient.district || 'Kathmandu'}
                    onChange={(e) => setEditingPatient({ ...editingPatient, district: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Age</label>
                  <input
                    type="number"
                    value={editingPatient.age || 28}
                    onChange={(e) => setEditingPatient({ ...editingPatient, age: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Emergency SOS Phone</label>
                  <input
                    type="text"
                    value={editingPatient.emergency_contact || '+977-9841234567'}
                    onChange={(e) => setEditingPatient({ ...editingPatient, emergency_contact: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Allergies (comma-separated)</label>
                <input
                  type="text"
                  value={editingPatient.allergies?.join(', ') || ''}
                  onChange={(e) => setEditingPatient({
                    ...editingPatient,
                    allergies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  })}
                  placeholder="e.g. Dust, Penicillin, Peanuts"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Patient Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CHANGE APPOINTMENT INFO */}
      {/* ========================================================================= */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Reschedule / Edit Appointment
                </h3>
              </div>
              <button
                onClick={() => setEditingAppointment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointmentChanges} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={editingAppointment.patient_name}
                    onChange={(e) => setEditingAppointment({ ...editingAppointment, patient_name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={editingAppointment.doctor_name}
                    onChange={(e) => setEditingAppointment({ ...editingAppointment, doctor_name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editingAppointment.date}
                    onChange={(e) => setEditingAppointment({ ...editingAppointment, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={editingAppointment.time}
                    onChange={(e) => setEditingAppointment({ ...editingAppointment, time: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Consultation Type</label>
                  <select
                    value={editingAppointment.type}
                    onChange={(e) => setEditingAppointment({ ...editingAppointment, type: e.target.value as Appointment['type'] })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Video Consultation">Video Consultation</option>
                    <option value="In-Person Hospital Visit">In-Person Hospital Visit</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Status</label>
                  <select
                    value={editingAppointment.status}
                    onChange={(e) => setEditingAppointment({ ...editingAppointment, status: e.target.value as Appointment['status'] })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Symptoms / Notes</label>
                <textarea
                  rows={2}
                  value={editingAppointment.symptoms || ''}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, symptoms: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Appointment Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD NEW DOCTOR */}
      {/* ========================================================================= */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Add New NMC Certified Doctor
                </h3>
              </div>
              <button
                onClick={() => setShowAddDoctorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctorSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Roshan Thapa"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">NMC License Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NMC-8890"
                    value={newDocNmc}
                    onChange={(e) => setNewDocNmc(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Initial Security PIN *</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="••••"
                    value={newDocPin}
                    onChange={(e) => setNewDocPin(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Specialty *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Consultant Neurologist"
                  value={newDocSpecialty}
                  onChange={(e) => setNewDocSpecialty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Hospital *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bir Hospital, Kathmandu"
                  value={newDocHospital}
                  onChange={(e) => setNewDocHospital(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Consultation Fee (NPR)</label>
                  <input
                    type="number"
                    value={newDocFee}
                    onChange={(e) => setNewDocFee(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Schedule</label>
                  <input
                    type="text"
                    value={newDocSchedule}
                    onChange={(e) => setNewDocSchedule(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Confirm &amp; Add Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Docs Styled Accounts & Credentials Dossier Modal */}
      {showCredentialDocModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Google Docs: Xenon Health Accounts &amp; Credentials Dossier</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Confidential
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Master reference of all usernames, passwords, doctor PINs, and recovery channels.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCredentialDocModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Google Docs Document Preview Box */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2 text-slate-600 dark:text-slate-400">
                <span>DOC TITLE: XENON_HEALTH_CREDENTIALS_MASTER.gdoc</span>
                <span>ADMIN RECOVERY: nepal.parajuli.77@gmail.com</span>
              </div>

              {/* 1. Core Users */}
              <div className="space-y-2">
                <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <span>1. Core Administrative &amp; Patient Accounts</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Username</th>
                        <th className="p-2.5">Password</th>
                        <th className="p-2.5">Recovery Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="p-2.5 font-bold text-purple-600">developer (admin)</td>
                        <td className="p-2.5">Developer Operations</td>
                        <td className="p-2.5 font-bold">developer</td>
                        <td className="p-2.5 font-bold text-blue-600">12admin34</td>
                        <td className="p-2.5 text-slate-500">developer@xenonhealth.org.np</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-emerald-600">patient</td>
                        <td className="p-2.5">Nepal Parajuli</td>
                        <td className="p-2.5 font-bold">nepal</td>
                        <td className="p-2.5 font-bold text-blue-600">aarav*3812</td>
                        <td className="p-2.5 text-blue-600 font-bold">nepal.parajuli.77@gmail.com</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Doctors & Distinct PINs */}
              <div className="space-y-2 pt-2">
                <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>2. Registered Doctors &amp; Individual PIN Registry ({doctors.length} Doctors)</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] max-h-72 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase sticky top-0">
                        <th className="p-2.5">Doctor Name</th>
                        <th className="p-2.5">NMC License</th>
                        <th className="p-2.5">Specialty</th>
                        <th className="p-2.5">Hospital</th>
                        <th className="p-2.5">Individual PIN</th>
                        <th className="p-2.5">Fee (NPR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {doctors.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{doc.name}</td>
                          <td className="p-2.5 text-blue-600 font-bold">{doc.nmc_number}</td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300">{doc.specialty}</td>
                          <td className="p-2.5 text-slate-500">{doc.hospital}</td>
                          <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30">
                            {doc.pin || '1234'}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{doc.fee_npr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Custom Registered Patients */}
              {patientUsers.filter((p) => p.username !== 'nepal').length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>3. Newly Registered Patient Accounts</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Username</th>
                          <th className="p-2.5">Phone</th>
                          <th className="p-2.5">Password</th>
                          <th className="p-2.5">District</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {patientUsers
                          .filter((p) => p.username !== 'nepal')
                          .map((pat) => (
                            <tr key={pat.id}>
                              <td className="p-2.5 font-bold text-slate-900 dark:text-white">{pat.full_name}</td>
                              <td className="p-2.5">{pat.username}</td>
                              <td className="p-2.5">{pat.phone}</td>
                              <td className="p-2.5 font-bold text-blue-600">{pat.password || '••••••••'}</td>
                              <td className="p-2.5 text-slate-500">{pat.district || 'Kathmandu'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const docText = `
# XENON HEALTH — OFFICIAL SYSTEM CREDENTIALS & ACCOUNTS DOSSIER
Generated for: nepal.parajuli.77@gmail.com
Classification: Administrative Master File

## 1. Core Accounts
- Developer Admin: Username: developer | Password: 12admin34 | Role: developer | Email: developer@xenonhealth.org.np
- Patient Account: Username: nepal | Password: aarav*3812 | Role: patient | Email: nepal.parajuli.77@gmail.com | Phone: +977-9841234567

## 2. Doctors Directory & Individual PINs
${doctors.map((d) => `- ${d.name} (${d.nmc_number}) | Specialty: ${d.specialty} | Hospital: ${d.hospital} | PIN: ${d.pin || '1234'} | Fee: NPR ${d.fee_npr}`).join('\n')}

## 3. Account Recovery Channel
All PIN and password reset tokens are sent to: nepal.parajuli.77@gmail.com
                  `.trim();
                  navigator.clipboard.writeText(docText);
                  setCopiedDoc(true);
                  setTimeout(() => setCopiedDoc(false), 3000);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{copiedDoc ? 'Copied to Clipboard!' : 'Copy Document to Clipboard'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCredentialDocModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
