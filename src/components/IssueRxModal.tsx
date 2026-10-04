import React, { useState } from 'react';
import { X, Plus, Trash2, Pill, CheckCircle2 } from 'lucide-react';
import { Prescription, Medicine, User } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface IssueRxModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSavePrescription: (rx: Prescription) => void;
}

export const IssueRxModal: React.FC<IssueRxModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSavePrescription
}) => {
  if (!isOpen) return null;

  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('2026-09-10');
  const [bp, setBp] = useState('120/80 mmHg');
  const [pulse, setPulse] = useState('74 bpm');
  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      name: 'Pantoprazole 40mg',
      dosage: '1 Tablet',
      frequency: 'Once daily before breakfast',
      duration: '7 days',
      instructions: 'Take with warm water on empty stomach.'
    }
  ]);

  const addMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        name: '',
        dosage: '1 Tab',
        frequency: 'Twice daily',
        duration: '5 days',
        instructions: 'After meals'
      }
    ]);
  };

  const removeMedicine = (idx: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMed = (idx: number, field: keyof Medicine, val: string) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: val } : m))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    const newRx: Prescription = {
      id: `rx_${Math.random().toString(36).substring(2, 8)}`,
      patient_username: currentUser.username,
      patient_name: currentUser.full_name,
      doctor_name: currentUser.role === 'doctor' ? currentUser.full_name : 'Dr. Om Murti Anil',
      specialty: currentUser.role === 'doctor' ? 'Clinical Medical Specialist' : 'Senior Cardiology Consultant',
      date: new Date().toISOString().split('T')[0],
      diagnosis: diagnosis.trim() || 'Acute Health Consultation',
      vitals: {
        bp,
        pulse,
        weight_kg: 68,
        sp_o2: '99%'
      },
      medicines: medicines.filter((m) => m.name.trim() !== ''),
      lifestyle_advice: advice.trim() || 'Adequate hydration, warm fluid intake, and rest.',
      follow_up_date: followUp
    };

    onSavePrescription(newRx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-[28px] bg-white dark:bg-[#0F172A] border-t sm:border border-black/[0.08] dark:border-white/[0.08] p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 pb-8 sm:pb-6">
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2 sm:hidden shrink-0" />

        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-md border border-white/10">
              <Pill className="w-5 h-5 stroke-[2.2] text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                Issue Digital Prescription
              </h3>
              <p className="text-xs text-black dark:text-white font-medium opacity-80">
                Official Telemedicine Pharmacological Order
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-black dark:text-white mb-1.5">
              Clinical Diagnosis / Assessment:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Essential Hypertension, Seasonal Bronchitis, Lumbar Strain"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-black dark:text-white mb-1.5">
                Blood Pressure (BP):
              </label>
              <input
                type="text"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div>
              <label className="block font-bold text-black dark:text-white mb-1.5">
                Pulse Rate:
              </label>
              <input
                type="text"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          {/* Medicines Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-black dark:text-white">
                Prescribed Medicines (Rx):
              </label>
              <button
                type="button"
                onClick={addMedicine}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {medicines.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Drug name (e.g. Amoxicillin 500mg)"
                      value={m.name}
                      onChange={(e) => updateMed(idx, 'name', e.target.value)}
                      required
                      className="flex-1 p-2.5 rounded-xl bg-white dark:bg-[#0F172A] border border-black/10 dark:border-white/10 text-black dark:text-white font-bold placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(idx)}
                        className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Dosage (1 Tab)"
                      value={m.dosage}
                      onChange={(e) => updateMed(idx, 'dosage', e.target.value)}
                      className="p-2 rounded-xl bg-white dark:bg-[#0F172A] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                    <input
                      type="text"
                      placeholder="Frequency (1-0-1)"
                      value={m.frequency}
                      onChange={(e) => updateMed(idx, 'frequency', e.target.value)}
                      className="p-2 rounded-xl bg-white dark:bg-[#0F172A] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                    <input
                      type="text"
                      placeholder="Duration (5 days)"
                      value={m.duration}
                      onChange={(e) => updateMed(idx, 'duration', e.target.value)}
                      className="p-2 rounded-xl bg-white dark:bg-[#0F172A] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Instructions (e.g. After food with plenty of water)"
                    value={m.instructions}
                    onChange={(e) => updateMed(idx, 'instructions', e.target.value)}
                    className="w-full p-2 rounded-xl bg-white dark:bg-[#0F172A] border border-black/10 dark:border-white/10 text-black dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-black dark:text-white mb-1.5">
              Lifestyle & Dietary Advice:
            </label>
            <textarea
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="e.g. Low sodium diet, 30 min daily brisk walk, avoid caffeine..."
              rows={2}
              className="w-full p-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block font-bold text-black dark:text-white mb-1.5">
              Follow-up Review Date:
            </label>
            <input
              type="date"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold shadow-md cursor-pointer transition-all"
            >
              Sign & Save Prescription
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
