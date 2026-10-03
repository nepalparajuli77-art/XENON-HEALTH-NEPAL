import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  Video,
  FileText,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Activity,
  Search,
  Filter,
  ArrowRight,
  FlaskConical,
  DollarSign,
  Building2,
  Sparkles,
  Plus
} from 'lucide-react';
import { Doctor, Appointment, Prescription, LabReport, Language } from '../types';

interface DoctorDashboardViewProps {
  currentDoctor: Doctor;
  appointments: Appointment[];
  prescriptions: Prescription[];
  labReports: LabReport[];
  language: Language;
  onOpenVideoRoom: (apt: Appointment) => void;
  onIssueRxClick: () => void;
  onNavigateToXenon: () => void;
  onUpdateDoctorProfile?: (updatedDoc: Doctor) => void;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  currentDoctor,
  appointments,
  prescriptions,
  labReports,
  language,
  onOpenVideoRoom,
  onIssueRxClick,
  onNavigateToXenon,
  onUpdateDoctorProfile
}) => {
  // Filter appointments STRICTLY to this doctor
  const doctorAppointments = useMemo(() => {
    return appointments.filter(
      (a) =>
        a.doctor_id === currentDoctor.id ||
        a.doctor_name.toLowerCase().includes(currentDoctor.name.toLowerCase()) ||
        currentDoctor.name.toLowerCase().includes(a.doctor_name.toLowerCase())
    );
  }, [appointments, currentDoctor]);

  // Doctor's issued prescriptions
  const doctorPrescriptions = useMemo(() => {
    return prescriptions.filter(
      (p) =>
        p.doctor_id === currentDoctor.id ||
        p.doctor_name.toLowerCase().includes(currentDoctor.name.toLowerCase())
    );
  }, [prescriptions, currentDoctor]);

  // Active filter tab
  const [activeQueueFilter, setActiveQueueFilter] = useState<'all' | 'Scheduled' | 'In-Progress' | 'Completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(doctorAppointments[0] || null);

  // Pure Clinical Navigation Tabs: Clinical Queue, Prescriptions, Diagnostics
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'queue' | 'prescriptions' | 'diagnostics'>('queue');

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return doctorAppointments.filter((apt) => {
      const matchFilter = activeQueueFilter === 'all' || apt.status === activeQueueFilter;
      const matchSearch =
        apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [doctorAppointments, activeQueueFilter, searchTerm]);

  // Doctor's assigned patient lab reports
  const relevantLabReports = useMemo(() => {
    const patientNames = Array.from(new Set(doctorAppointments.map((a) => a.patient_name.toLowerCase())));
    return labReports.filter((r) => patientNames.includes(r.patient_name.toLowerCase()));
  }, [doctorAppointments, labReports]);

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* SECTION 1: DOCTOR HERO & NMC CLINICAL CREDENTIALS */}
      <section className="p-4 sm:p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xl font-bold shadow-md shrink-0 border border-white/10">
              <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                <span className="font-mono text-blue-400 font-bold">{currentDoctor.nmc_number}</span>
                <span aria-hidden="true">·</span>
                <span>{currentDoctor.specialty}</span>
                <span aria-hidden="true">·</span>
                <span>{currentDoctor.hospital}</span>
              </div>

              <h1 className="text-lg sm:text-2xl font-bold text-white mt-0.5">
                {currentDoctor.name}
              </h1>

              <div className="mt-1.5 flex items-center gap-2.5 sm:gap-3 text-xs text-slate-300 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{currentDoctor.schedule}</span>
                </span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>NPR {currentDoctor.fee_npr} / Consultation</span>
                </span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>NMC Licensed Practitioner</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-start lg:self-auto flex-wrap shrink-0 pt-2 lg:pt-0">
            <button
              onClick={onIssueRxClick}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer min-h-[44px]"
            >
              <FileText className="w-4 h-4" />
              <span>{language === 'np' ? 'प्रिस्क्रिप्सन जारी गर्नुहोस्' : 'Issue Prescription'}</span>
            </button>

            <button
              onClick={onNavigateToXenon}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{language === 'np' ? 'क्लिनिकल AI सपोर्ट' : 'Clinical AI Assistant'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* PURE CLINICAL WORKSPACE NAVIGATION TABS (Strictly Queue, Prescriptions, Diagnostics) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveWorkspaceTab('queue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[42px] ${
            activeWorkspaceTab === 'queue'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{language === 'np' ? 'बिरामी परामर्श लाम' : 'Clinical Queue & Active Consultations'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] tabular-nums font-bold">
            {doctorAppointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveWorkspaceTab('prescriptions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[42px] ${
            activeWorkspaceTab === 'prescriptions'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>{language === 'np' ? 'डिजिटल प्रिस्क्रिप्शन टूल्स' : 'Prescription Tools & History'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] tabular-nums font-bold">
            {doctorPrescriptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveWorkspaceTab('diagnostics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[42px] ${
            activeWorkspaceTab === 'diagnostics'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-teal-600" />
          <span>{language === 'np' ? 'बिरामी डायग्नोस्टिक ल्याब' : 'Patient Diagnostic Records'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] tabular-nums font-bold">
            {relevantLabReports.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CLINICAL QUEUE & TELECONSULTATIONS */}
      {activeWorkspaceTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Queue List (Left Column) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={language === 'np' ? 'बिरामीको नाम वा लक्षण खोज्नुहोस्...' : 'Search patient name or symptom...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                {(['all', 'Scheduled', 'In-Progress', 'Completed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setActiveQueueFilter(st)}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                      activeQueueFilter === st
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {st === 'all' ? 'All' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Queue Cards */}
            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredQueue.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  {language === 'np' ? 'कुनै बिरामी परामर्श भेटिएन।' : 'No consultations found in queue.'}
                </div>
              ) : (
                filteredQueue.map((apt) => {
                  const isSelected = selectedAppointment?.id === apt.id;
                  return (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {apt.patient_name}
                          </h4>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{apt.date}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{apt.time}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            apt.status === 'In-Progress'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 animate-pulse'
                              : apt.status === 'Completed'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Symptoms:</span> {apt.symptoms}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Patient Details & Telemedicine Suite (Right Column) */}
          <div className="lg:col-span-2">
            {selectedAppointment ? (
              <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Appointment ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedAppointment.id}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedAppointment.patient_name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenVideoRoom(selectedAppointment)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer min-h-[44px]"
                    >
                      <Video className="w-4 h-4" />
                      <span>{language === 'np' ? 'भिडियो परामर्श सुरु' : 'Start Video Consultation'}</span>
                    </button>

                    <button
                      onClick={onIssueRxClick}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{language === 'np' ? 'प्रिस्क्राइब' : 'Prescribe'}</span>
                    </button>
                  </div>
                </div>

                {/* Patient Clinical Profile & Vitals */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Consultation Date</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{selectedAppointment.date}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Scheduled Time</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{selectedAppointment.time}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Type / Mode</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{selectedAppointment.type}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Fee Status</div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Paid (NPR {selectedAppointment.fee_npr})</div>
                  </div>
                </div>

                {/* Chief Complaint & Clinical Notes */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Chief Complaint &amp; Reported Symptoms
                  </h4>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {selectedAppointment.symptoms}
                  </p>
                </div>

                {/* Quick Clinical Decision Support CTA */}
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold text-purple-900 dark:text-purple-200">
                        {language === 'np' ? 'जेमिनी क्लिनिकल ड्रग इन्टर्याक्सन' : 'Xenon AI Drug Interaction & Protocol Assistant'}
                      </div>
                      <div className="text-purple-700 dark:text-purple-300 text-[11px]">
                        Verify contraindications and Nepal standard treatment protocols.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onNavigateToXenon}
                    className="px-3.5 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    Open AI Decision Support
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-500">
                Select an appointment from the queue to review patient details and start consultation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL PRESCRIPTION TOOLS & HISTORY */}
      {activeWorkspaceTab === 'prescriptions' && (
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'np' ? 'जारी गरिएका डिजिटल प्रिस्क्रिप्शनहरू' : 'Doctor Prescription Tools & Signing Archive'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Archive of official e-prescriptions digitally signed under your NMC credential.
              </p>
            </div>

            <button
              onClick={onIssueRxClick}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Issue New Prescription</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {doctorPrescriptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No prescriptions issued yet. Click 'Issue New Prescription' to author one.
              </div>
            ) : (
              doctorPrescriptions.map((rx) => (
                <div key={rx.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">#{rx.id}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{rx.patient_name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-xs text-slate-500">{rx.date}</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <b>Diagnosis:</b> {rx.diagnosis}
                    </div>
                    <div className="text-xs text-slate-500">
                      <b>Medicines:</b> {rx.medicines.map((m) => `${m.name} (${m.dosage})`).join(', ')}
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900/40 shrink-0 self-start sm:self-auto">
                    NMC Signed
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PATIENT DIAGNOSTIC LAB & TEST RECORDS */}
      {activeWorkspaceTab === 'diagnostics' && (
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'np' ? 'बिरामी ल्याब तथा रेडियोलोजी रिपोर्टहरू' : 'Patient Diagnostic & Laboratory Archive'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review blood biochemistry, pathology, and imaging reports of your assigned patient cohort.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relevantLabReports.length === 0 ? (
              <div className="col-span-full p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                No diagnostic reports currently filed for your assigned patient cohort.
              </div>
            ) : (
              relevantLabReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {report.test_name}
                      </h4>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <span>Patient: <b>{report.patient_name}</b></span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        report.status === 'Abnormal'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <div><b>Lab:</b> {report.lab_name}</div>
                    <div><b>Date:</b> {report.date}</div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 text-[11px] border border-slate-200/60 dark:border-slate-700 italic">
                      "{report.summary}"
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
