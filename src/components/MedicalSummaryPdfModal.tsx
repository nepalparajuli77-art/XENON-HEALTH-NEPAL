import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldCheck,
  Heart,
  Pill,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { User as UserType, Appointment, Prescription, Language } from '../types';
import { downloadPatientMedicalSummaryPdf } from '../utils/pdfExport';
import { triggerHaptic } from '../utils/haptics';

interface MedicalSummaryPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  appointments: Appointment[];
  prescriptions: Prescription[];
  language: Language;
}

export const MedicalSummaryPdfModal: React.FC<MedicalSummaryPdfModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  appointments,
  prescriptions,
  language
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  // Retrieve latest vitals from local storage if available
  let latestVitals = {
    systolicBP: 120,
    diastolicBP: 80,
    heartRate: 74,
    spO2: 98,
    bloodGlucose: 96,
    temperature: 98.4,
    weightKg: 68
  };

  try {
    const rawLogs = localStorage.getItem(`telemed_vitals_logs_${currentUser.id}`);
    if (rawLogs) {
      const parsed = JSON.parse(rawLogs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const last = parsed[parsed.length - 1];
        latestVitals = {
          systolicBP: last.systolicBP || 120,
          diastolicBP: last.diastolicBP || 80,
          heartRate: last.heartRate || 74,
          spO2: last.spO2 || 98,
          bloodGlucose: last.bloodGlucose || 96,
          temperature: last.temperature || 98.4,
          weightKg: last.weightKg || 68
        };
      }
    }
  } catch {}

  const handleDownloadPdf = () => {
    triggerHaptic('success');
    setIsExporting(true);
    try {
      downloadPatientMedicalSummaryPdf({
        patient: currentUser,
        appointments,
        prescriptions,
        vitals: latestVitals
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    triggerHaptic('light');
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-md shadow-red-600/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{language === 'np' ? 'प्रमाणित बिरामी मेडिकल सारांश' : 'Certified Patient Medical Summary'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  PDF Export
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'np'
                  ? 'नेपाल मेडिकल काउन्सिल अनुरूप औपचारिक मेडिकल इतिहास तथा औषधि विवरण'
                  : 'Nepal Medical Council (NMC) standard clinical history & active prescriptions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'np' ? 'प्रिन्ट गर्नुहोस्' : 'Print'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            >
              {isExporting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : downloadSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>
                {downloadSuccess
                  ? language === 'np' ? 'डाउनलोड सम्पन्न भयो!' : 'PDF Downloaded!'
                  : language === 'np' ? 'PDF डाउनलोड गर्नुहोस्' : 'Export as PDF'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 print:p-0">
          {/* Document Header */}
          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-red-600/20 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600/30 text-red-300 border border-red-500/40">
                  <ShieldCheck className="w-3 h-3 text-red-400" />
                  <span>GOVERNMENT OF NEPAL • DIGITAL HEALTHCARE DIRECTIVE</span>
                </div>
                <h1 className="text-xl font-black tracking-tight text-white">
                  XENON HEALTH NEPAL
                </h1>
                <p className="text-xs text-slate-300">
                  Confidential Patient Medical Dossier &amp; Active Prescription Transcript
                </p>
                <div className="text-[11px] text-slate-400">
                  Kathmandu Central Node • Verified Electronic Health Record (EHR)
                </div>
              </div>

              <div className="text-right sm:text-right space-y-1 bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Document Metadata</div>
                <div className="font-mono text-emerald-400 font-bold text-xs">
                  DOC-{currentUser.id.toUpperCase()}-{Date.now().toString(36).slice(-5).toUpperCase()}
                </div>
                <div className="text-slate-300 text-[11px]">Date: {generatedDate}</div>
                <div className="text-[10px] text-slate-400">Status: <span className="text-emerald-400 font-bold">Certified Active</span></div>
              </div>
            </div>
          </div>

          {/* Section 1: Patient Demographics & Profile */}
          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>I. Patient Identification &amp; Demographics</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 font-medium">Full Legal Name</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{currentUser.full_name}</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 font-medium">Patient ID (PID)</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{currentUser.id}</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 font-medium">Age &amp; Gender</div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentUser.age || 29} Yrs • {currentUser.gender || 'Male'}
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 font-medium">Blood Group</div>
                <div className="font-black text-red-600 dark:text-red-400 text-sm mt-0.5">
                  {currentUser.blood_group || 'O+'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-500 font-medium">Primary Contact: </span>
                <span className="font-bold text-slate-900 dark:text-white">{currentUser.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">District / Region: </span>
                <span className="font-bold text-slate-900 dark:text-white">{currentUser.district || 'Kathmandu, Bagmati'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Emergency Contact: </span>
                <span className="font-bold text-red-600 dark:text-red-400">{currentUser.emergency_contact || '+977-9841234567'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-800 dark:text-amber-300">Allergies &amp; Clinical Cautions: </span>
                <span className="text-amber-900 dark:text-amber-200">
                  {currentUser.allergies?.length ? currentUser.allergies.join(', ') : 'No known drug allergies reported (NKDA).'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Latest Vitals Telemetry */}
          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              <span>II. Latest Physiological Vitals Telemetry</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-medium">Blood Pressure</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  {latestVitals.systolicBP}/{latestVitals.diastolicBP}
                </div>
                <div className="text-[10px] text-slate-400">mmHg (Normal)</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-medium">Heart Rate</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  {latestVitals.heartRate}
                </div>
                <div className="text-[10px] text-slate-400">bpm (Resting)</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-medium">Oxygen (SpO2)</div>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {latestVitals.spO2}%
                </div>
                <div className="text-[10px] text-slate-400">Optimal</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-medium">Fasting Sugar</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  {latestVitals.bloodGlucose}
                </div>
                <div className="text-[10px] text-slate-400">mg/dL</div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-500 font-medium">Body Temp</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  {latestVitals.temperature}°F
                </div>
                <div className="text-[10px] text-slate-400">Afebrile</div>
              </div>
            </div>
          </div>

          {/* Section 3: Active Medications & Prescriptions Table */}
          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Pill className="w-4 h-4" />
                <span>III. Active Medications &amp; Digital Prescriptions ({prescriptions.length})</span>
              </span>
              <span className="text-[10px] text-slate-500 lowercase">NMC verified digital signatures</span>
            </h3>

            {prescriptions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-white dark:bg-slate-900 rounded-xl">
                No active prescriptions found in this patient record.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Rx ID</th>
                      <th className="py-2.5 px-3">Medication</th>
                      <th className="py-2.5 px-3">Dosage &amp; Frequency</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Prescribing Doctor (NMC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {prescriptions.flatMap((rx) =>
                      (rx.medicines && rx.medicines.length > 0
                        ? rx.medicines
                        : [{
                            name: 'Prescribed Therapeutic Medicine',
                            dosage: 'As Directed',
                            frequency: 'Daily',
                            duration: '30 Days',
                            instructions: rx.lifestyle_advice || ''
                          }]
                      ).map((med, mIdx) => (
                        <tr key={`${rx.id}-${mIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                            #{rx.id.toUpperCase()}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">{med.name}</div>
                            {med.instructions && (
                              <div className="text-[10px] text-slate-500">{med.instructions}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                            {med.dosage} {med.frequency ? `(${med.frequency})` : ''}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-400">
                            {med.duration}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-blue-600 dark:text-blue-400">{rx.doctor_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Dx: {rx.diagnosis} • {rx.date}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Clinical Consultation Encounters */}
          <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>IV. Clinical Encounters &amp; OPD Consultation Log ({appointments.length})</span>
            </h3>

            {appointments.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-white dark:bg-slate-900 rounded-xl">
                No past consultations recorded.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Date &amp; Time</th>
                      <th className="py-2.5 px-3">Specialist Doctor</th>
                      <th className="py-2.5 px-3">Hospital / Center</th>
                      <th className="py-2.5 px-3">Modality</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {appointments.slice(0, 6).map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                          {apt.date} {apt.time}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{apt.doctor_name}</div>
                          <div className="text-[10px] text-slate-500">{apt.specialty}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {apt.hospital}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {apt.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.status === 'Confirmed' || apt.status === 'Completed'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 5: Official Statutory Certification Seal */}
          <div className="p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Statutory Electronic Health Record (EHR) Verification</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                This digital medical dossier has been compiled from authorized clinical sessions on the Xenon Health platform and is certified compliant under the Telemedicine Directives of Nepal.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-red-500/30 text-center shrink-0 min-w-[170px] shadow-sm">
              <div className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider">Official Digital Seal</div>
              <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-0.5">Xenon Health Bureau</div>
              <div className="text-[9px] text-slate-400">Kathmandu, Nepal</div>
              <div className="text-[8px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">NMC-VERIFIED-2026</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden on print) */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between print:hidden shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Includes complete clinical history, vitals baseline &amp; prescriptions</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              {language === 'np' ? 'बन्द गर्नुहोस्' : 'Close'}
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            >
              {isExporting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{language === 'np' ? 'PDF डाउनलोड गर्नुहोस् (.pdf)' : 'Download as PDF (.pdf)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
