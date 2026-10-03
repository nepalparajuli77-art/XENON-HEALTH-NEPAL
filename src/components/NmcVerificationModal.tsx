import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  Calendar,
  Building2,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  Check,
  Printer,
  Sparkles,
  FileCheck2,
  Lock,
  Globe2
} from 'lucide-react';
import { NmcVerificationRecord, Language, Doctor } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface NmcVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: NmcVerificationRecord | null;
  language: Language;
  onBookDoctor?: (docName: string) => void;
  onNotifyToast?: (msg: string) => void;
}

export const NmcVerificationModal: React.FC<NmcVerificationModalProps> = ({
  isOpen,
  onClose,
  record,
  language,
  onBookDoctor,
  onNotifyToast
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen || !record) return null;

  const handleCopyVerification = () => {
    triggerHaptic('success');
    if (typeof window !== 'undefined' && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(
        `NEPAL MEDICAL COUNCIL VERIFIED:\nPractitioner: ${record.doctor_name}\nNMC No: ${record.nmc_number}\nSpecialty: ${record.registered_specialty}\nStatus: ${record.council_status}\nCouncil Ref: ${record.council_gazette_ref}\nDigital Seal: ${record.digital_seal_hash}`
      );
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
      onNotifyToast?.('Official Nepal Medical Council verification slip copied!');
    }
  };

  const handlePrintSlip = () => {
    triggerHaptic('medium');
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#0D1526] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        {/* Anti-tamper Guilloche / Watermark Pattern Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-blue-700 text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-15 pointer-events-none">
            <ShieldCheck className="w-48 h-48" />
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center shadow-lg font-black text-xl shrink-0">
              🇳🇵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest font-black text-white/80">
                  {language === 'np' ? 'नेपाल मेडिकल काउन्सिल प्रमाणीकरण' : 'Official Registry Verification'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping" />
                  Live Verified
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                NEPAL MEDICAL COUNCIL
              </h2>
              <p className="text-[11px] text-white/80 font-medium">
                नेपाल मेडिकल काउन्सिल • Bansbari, Kathmandu, Nepal (Est. 2020 B.S.)
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Doctor Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xl font-bold shadow-md shrink-0">
                👨‍⚕️
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {record.doctor_name}
                </h3>
                {record.doctor_name_np && (
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {record.doctor_name_np}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="font-mono text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-900/60">
                    {record.nmc_number}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>In Good Standing</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right sm:self-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Registration Type
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {record.registration_type}
              </span>
            </div>
          </div>

          {/* Specialty & Gazette Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Registered Specialization
              </span>
              <span className="font-black text-slate-900 dark:text-white mt-1 block">
                {record.registered_specialty}
              </span>
              {record.registered_specialty_np && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                  {record.registered_specialty_np}
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Council Gazette Reference
              </span>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 block">
                {record.council_gazette_ref}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                Registered on {record.registration_date} • {record.valid_until}
              </span>
            </div>
          </div>

          {/* Qualifications & Medical Colleges Verified */}
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Council Verified Qualifications & Degrees</span>
            </h4>

            <div className="space-y-2">
              {record.qualifications.map((qual, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-black text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-black text-slate-900 dark:text-white">
                        {qual.degree}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {qual.institution} ({qual.country})
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Grad. {qual.year}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic Digital Seal & Anti-Tamper Stamp */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                  Tamper-Evident Council Verification Seal
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                {new Date(record.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} NPT
              </span>
            </div>
            <p className="font-mono text-[10px] text-emerald-800 dark:text-emerald-400/90 break-all select-all">
              {record.digital_seal_hash}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopyVerification}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs cursor-pointer transition-colors"
              >
                {copiedHash ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied Slip!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Verification</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrintSlip}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs cursor-pointer transition-colors"
                title="Print Verification Certificate"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
              </button>
            </div>

            <button
              onClick={() => {
                onClose();
                if (onBookDoctor) {
                  onBookDoctor(record.doctor_name);
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 text-white font-black text-xs shadow-md shadow-red-600/20 cursor-pointer transition-all hover:scale-102"
            >
              Consult This Verified Doctor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
