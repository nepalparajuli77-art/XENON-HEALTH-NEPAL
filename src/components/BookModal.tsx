import React, { useState } from 'react';
import { X, Calendar, Clock, Video, Building2, CheckCircle2, AlertTriangle, Wallet, CreditCard, ShieldAlert, WifiOff } from 'lucide-react';
import { Doctor, Appointment, Language, User } from '../types';
import { t } from '../data/mockData';
import { isAppOnline, queueAppointmentForSync } from '../services/syncService';
import { triggerHaptic } from '../utils/haptics';

interface BookModalProps {
  doctor: Doctor | null;
  doctors: Doctor[];
  currentUser: User;
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (apt: Appointment) => void;
}

export const BookModal: React.FC<BookModalProps> = ({
  doctor,
  doctors,
  currentUser,
  language,
  isOpen,
  onClose,
  onConfirmBooking
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctor?.id || doctors[0]?.id);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTime, setSelectedTime] = useState('10:30 AM');
  const [consultationMode, setConsultationMode] = useState<'Video Teleconsultation' | 'In-Person OPD Clinic'>('Video Teleconsultation');
  const [paymentMethod, setPaymentMethod] = useState<'esewa' | 'khalti' | 'counter'>('esewa');
  const [showSystemNotice, setShowSystemNotice] = useState(false);
  const [symptoms, setSymptoms] = useState('');

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctor || doctors[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'esewa' || paymentMethod === 'khalti' || consultationMode === 'Video Teleconsultation') {
      setShowSystemNotice(true);
      return;
    }

    proceedWithBooking();
  };

  const proceedWithBooking = () => {
    triggerHaptic('success');
    const isOnline = isAppOnline();
    const newApt: Appointment = {
      id: `apt_${Math.random().toString(36).substring(2, 9)}`,
      patient_username: currentUser.username,
      patient_name: currentUser.full_name,
      doctor_id: currentDoctor.id,
      doctor_name: currentDoctor.name,
      specialty: currentDoctor.specialty,
      hospital: currentDoctor.hospital,
      date: selectedDate,
      time: selectedTime,
      type: consultationMode,
      status: 'Confirmed',
      symptoms: symptoms.trim() || 'General consultation follow-up',
      fee_npr: currentDoctor.fee_npr,
      meeting_link: `https://xenonhealth.org.np/room/nep-${Math.random().toString(36).substring(2, 7)}`,
      synced: isOnline,
      queuedAt: !isOnline ? new Date().toISOString() : undefined
    };

    if (!isOnline) {
      queueAppointmentForSync(newApt);
    } else {
      // Send to server database, or queue if fetch fails
      fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApt)
      }).catch((err) => {
        console.warn('Network issue during appointment booking, adding to offline queue:', err);
        queueAppointmentForSync(newApt);
      });
    }

    onConfirmBooking(newApt);
    onClose();
  };

  const isOnline = isAppOnline();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 dark:bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-t-[32px] sm:rounded-[28px] bg-white dark:bg-[#0F172A] p-5 sm:p-6 border-t sm:border border-black/[0.08] dark:border-white/[0.08] shadow-2xl space-y-4 sm:space-y-5 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto pb-8 sm:pb-6">
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2 sm:hidden shrink-0" />

        {/* Offline notice banner if offline */}
        {!isOnline && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              <b>Offline Mode Active:</b> Your booking will be safely stored locally and automatically pushed to the hospital database upon reconnecting.
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 text-white shadow-md shadow-red-600/20 border border-white/20">
              <Calendar className="w-5 h-5 stroke-[2.2] text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                {t('bookConsultation', language)}
              </h3>
              <p className="text-xs text-black dark:text-white font-medium opacity-80">
                Direct Telemedicine Scheduling with NMC Specialists
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        {/* System Error / Sandbox Notice Modal Intercept */}
        {showSystemNotice && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs space-y-3 animate-scale-in">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-amber-900 dark:text-amber-200">
                  System Notice: Payment Gateway & Video Line (Sandbox Mode)
                </h4>
                <p className="text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  Notice: Automated <b>{paymentMethod === 'esewa' ? 'eSewa' : paymentMethod === 'khalti' ? 'Khalti' : 'Digital'}</b> payment settlements and live encrypted video conference channels are currently operating in <b>Demonstration Sandbox Mode</b>. Official merchant settlements will be launched in the upcoming production release.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200 dark:border-amber-900/60">
              <button
                type="button"
                onClick={() => setShowSystemNotice(false)}
                className="px-3 py-1.5 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Modify Payment
              </button>
              <button
                type="button"
                onClick={proceedWithBooking}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-blue-700 text-white font-black shadow-sm hover:brightness-110"
              >
                Confirm Appointment in Demo Mode
              </button>
            </div>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Doctor Selector */}
          <div>
            <label className="block font-bold text-black dark:text-white mb-1.5">
              Select Specialist:
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-[#1E293B] text-black dark:text-white">
                  {d.name} — {d.specialty} (Rs. {d.fee_npr})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-black dark:text-white mb-1.5">
                Consultation Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={todayStr}
                className="w-full p-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-black dark:text-white mb-1.5">
                Time Slot:
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="09:30 AM" className="bg-white dark:bg-[#1E293B] text-black dark:text-white">09:30 AM</option>
                <option value="10:00 AM" className="bg-white dark:bg-[#1E293B] text-black dark:text-white">10:00 AM</option>
                <option value="10:30 AM" className="bg-white dark:bg-[#1E293B] text-black dark:text-white">10:30 AM</option>
                <option value="11:30 AM" className="bg-white dark:bg-[#1E293B] text-black dark:text-white">11:30 AM</option>
                <option value="01:30 PM" className="bg-white dark:bg-[#1E293B] text-black dark:text-white">01:30 PM</option>
                <option value="02:30 PM" className="bg-white dark:bg-[#1E293B] text-black dark:text-white">02:30 PM</option>
                <option value="04:00 PM" className="bg-white dark:bg-[#1E293B] text-black dark:text-white">04:00 PM</option>
              </select>
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="block font-bold text-black dark:text-white mb-1.5">
              Consultation Format:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConsultationMode('Video Teleconsultation')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                  consultationMode === 'Video Teleconsultation'
                    ? 'border-red-600 dark:border-blue-500 bg-red-50 dark:bg-blue-950/40 text-red-700 dark:text-blue-300 font-bold shadow-xs'
                    : 'border-black/10 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#1E293B] text-black dark:text-white opacity-80'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Video Teleconsult</span>
              </button>

              <button
                type="button"
                onClick={() => setConsultationMode('In-Person OPD Clinic')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                  consultationMode === 'In-Person OPD Clinic'
                    ? 'border-red-600 dark:border-blue-500 bg-red-50 dark:bg-blue-950/40 text-red-700 dark:text-blue-300 font-bold shadow-xs'
                    : 'border-black/10 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#1E293B] text-black dark:text-white opacity-80'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>In-Person OPD</span>
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block font-bold text-black dark:text-white mb-1.5">
              Payment Gateway / Settlement:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('esewa')}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  paymentMethod === 'esewa'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-black shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-black/10 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#1E293B] text-black dark:text-white opacity-80'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                  e
                </div>
                <span className="text-[11px] font-bold">eSewa</span>
                <span className="text-[9px] text-slate-500">Wallet / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('khalti')}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  paymentMethod === 'khalti'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 font-black shadow-xs ring-2 ring-purple-500/20'
                    : 'border-black/10 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#1E293B] text-black dark:text-white opacity-80'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                  K
                </div>
                <span className="text-[11px] font-bold">Khalti</span>
                <span className="text-[9px] text-slate-500">Digital Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('counter')}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  paymentMethod === 'counter'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-black shadow-xs ring-2 ring-blue-500/20'
                    : 'border-black/10 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#1E293B] text-black dark:text-white opacity-80'
                }`}
              >
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="text-[11px] font-bold">OPD Counter</span>
                <span className="text-[9px] text-slate-500">Pay at Hospital</span>
              </button>
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block font-bold text-black dark:text-white mb-1.5">
              Symptoms / Chief Complaints:
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe your current medical concerns, duration, and any existing medication..."
              rows={2}
              className="w-full p-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* Fee Breakdown Capsule */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 flex items-center justify-between">
            <span className="text-black dark:text-white font-medium opacity-85">Consultation Fee (NPR):</span>
            <span className="text-sm font-black text-black dark:text-white">Rs. {currentDoctor.fee_npr}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 text-white font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

