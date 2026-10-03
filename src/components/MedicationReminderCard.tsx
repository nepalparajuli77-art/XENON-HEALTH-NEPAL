import React, { useState, useEffect, useMemo } from 'react';
import {
  Pill,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Volume2,
  Sparkles,
  RefreshCw,
  Info,
  Calendar,
  ChevronRight,
  ShieldAlert,
  Plus
} from 'lucide-react';
import { Prescription, Language } from '../types';
import { t } from '../data/mockData';

interface MedicationReminderCardProps {
  prescriptions: Prescription[];
  language: Language;
  onNavigateToRecords?: () => void;
}

export interface DoseScheduleItem {
  id: string;
  medicineName: string;
  dosage: string;
  timeSlot: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'SOS';
  timeLabel: string; // e.g., "08:00 AM"
  approxHour: number; // 8, 13, 19, 21, etc.
  mealTiming: 'Before Food' | 'After Food' | 'With Food' | 'As Needed';
  mealTimingNp: string;
  instructions: string;
  doctorName: string;
  specialty: string;
  rxId: string;
}

export const MedicationReminderCard: React.FC<MedicationReminderCardProps> = ({
  prescriptions,
  language,
  onNavigateToRecords
}) => {
  // Simulated clock or selected time of day (defaults to real current hour)
  const [simulatedHour, setSimulatedHour] = useState<number>(() => {
    const currentHour = new Date().getHours();
    return currentHour;
  });

  // Track taken status by dose id: { [doseId]: boolean }
  const [takenStatus, setTakenStatus] = useState<Record<string, boolean>>(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const saved = localStorage.getItem(`telemed_doses_${today}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return {};
  });

  // Active push notification banner state
  const [activeAlertBanner, setActiveAlertBanner] = useState<{
    item: DoseScheduleItem;
    message: string;
  } | null>(null);

  // Parse all medicines from active prescriptions into time-slotted dose items
  const doseSchedule = useMemo<DoseScheduleItem[]>(() => {
    const items: DoseScheduleItem[] = [];

    // Filter prescriptions
    prescriptions.forEach((rx) => {
      rx.medicines.forEach((med, medIdx) => {
        const freq = (med.frequency || '').toLowerCase();
        const inst = (med.instructions || '').toLowerCase();
        
        let mealTiming: DoseScheduleItem['mealTiming'] = 'After Food';
        let mealTimingNp = 'खानापछि';

        if (freq.includes('before') || inst.includes('before') || inst.includes('खाली पेट') || inst.includes('empty')) {
          mealTiming = 'Before Food';
          mealTimingNp = 'खानाअघि (खाली पेट)';
        } else if (freq.includes('sos') || freq.includes('as needed') || inst.includes('sos')) {
          mealTiming = 'As Needed';
          mealTimingNp = 'आवश्यक परेमा मात्र (SOS)';
        }

        // Parse Frequency patterns
        // Pattern 1: 1-0-1 or 1-0-0 or 0-0-1 or 1-1-1
        const patternMatch = freq.match(/([0-9])-([0-9])-([0-9])/);
        if (patternMatch) {
          const morning = parseInt(patternMatch[1], 10);
          const afternoon = parseInt(patternMatch[2], 10);
          const night = parseInt(patternMatch[3], 10);

          if (morning > 0) {
            items.push({
              id: `${rx.id}_m_${medIdx}`,
              medicineName: med.name,
              dosage: med.dosage,
              timeSlot: 'Morning',
              timeLabel: '08:00 AM',
              approxHour: 8,
              mealTiming: mealTiming === 'Before Food' ? 'Before Food' : 'After Food',
              mealTimingNp: mealTiming === 'Before Food' ? 'खानाअघि (खाली पेट)' : 'बिहानको खानापछि',
              instructions: med.instructions || 'Take with fresh water.',
              doctorName: rx.doctor_name,
              specialty: rx.specialty,
              rxId: rx.id
            });
          }

          if (afternoon > 0) {
            items.push({
              id: `${rx.id}_a_${medIdx}`,
              medicineName: med.name,
              dosage: med.dosage,
              timeSlot: 'Afternoon',
              timeLabel: '01:30 PM',
              approxHour: 13,
              mealTiming: 'After Food',
              mealTimingNp: 'दिउँसोको खानापछि',
              instructions: med.instructions || 'Take with water after lunch.',
              doctorName: rx.doctor_name,
              specialty: rx.specialty,
              rxId: rx.id
            });
          }

          if (night > 0) {
            items.push({
              id: `${rx.id}_n_${medIdx}`,
              medicineName: med.name,
              dosage: med.dosage,
              timeSlot: 'Night',
              timeLabel: '09:00 PM',
              approxHour: 21,
              mealTiming: 'After Food',
              mealTimingNp: 'रातिको खानापछि / सुत्नुअघि',
              instructions: med.instructions || 'Take at night before sleep.',
              doctorName: rx.doctor_name,
              specialty: rx.specialty,
              rxId: rx.id
            });
          }
        } else if (freq.includes('sos') || inst.includes('sos')) {
          items.push({
            id: `${rx.id}_sos_${medIdx}`,
            medicineName: med.name,
            dosage: med.dosage,
            timeSlot: 'SOS',
            timeLabel: 'As Needed (SOS)',
            approxHour: simulatedHour,
            mealTiming: 'As Needed',
            mealTimingNp: 'ज्वरो वा दुखाइ हुँदा मात्र',
            instructions: med.instructions || 'Take only when symptomatic.',
            doctorName: rx.doctor_name,
            specialty: rx.specialty,
            rxId: rx.id
          });
        } else {
          // Default once daily morning
          items.push({
            id: `${rx.id}_def_${medIdx}`,
            medicineName: med.name,
            dosage: med.dosage,
            timeSlot: 'Morning',
            timeLabel: '08:30 AM',
            approxHour: 8,
            mealTiming,
            mealTimingNp,
            instructions: med.instructions || 'Daily dose.',
            doctorName: rx.doctor_name,
            specialty: rx.specialty,
            rxId: rx.id
          });
        }
      });
    });

    // Sort by approx hour
    return items.sort((a, b) => a.approxHour - b.approxHour);
  }, [prescriptions, simulatedHour]);

  // Persist taken status
  const handleToggleTaken = (id: string) => {
    setTakenStatus((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem(`telemed_doses_${today}`, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  // Play gentle web audio chime
  const playChimeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch {
      // Audio not supported in sandbox or blocked
    }
  };

  // Trigger manual simulation push alert
  const handleSimulateAlert = (item: DoseScheduleItem) => {
    playChimeSound();
    setActiveAlertBanner({
      item,
      message:
        language === 'np'
          ? `समय भयो! ${item.medicineName} (${item.dosage}) सेवन गर्ने बेला भयो - ${item.mealTimingNp}।`
          : `Medication Reminder: Time to take ${item.medicineName} (${item.dosage}) — ${item.mealTiming}.`
    });

    // Auto dismiss banner after 8 seconds
    setTimeout(() => {
      setActiveAlertBanner(null);
    }, 8000);
  };

  // Calculate adherence
  const scheduledCount = doseSchedule.filter((d) => d.timeSlot !== 'SOS').length;
  const takenCount = doseSchedule.filter((d) => d.timeSlot !== 'SOS' && takenStatus[d.id]).length;
  const adherencePercent = scheduledCount > 0 ? Math.round((takenCount / scheduledCount) * 100) : 100;

  // Determine timing state for each item relative to simulated hour
  const getItemStatus = (item: DoseScheduleItem): 'due_now' | 'upcoming' | 'passed' | 'sos' => {
    if (item.timeSlot === 'SOS') return 'sos';
    const isTaken = !!takenStatus[item.id];
    if (isTaken) return 'passed';

    const diff = item.approxHour - simulatedHour;
    if (diff >= 0 && diff <= 2) {
      return 'due_now';
    } else if (diff > 2) {
      return 'upcoming';
    } else {
      return 'due_now'; // Overdue / due
    }
  };

  return (
    <div className="rounded-[24px] bg-white dark:bg-[#0F172A] p-5 md:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
      {/* Push Notification Simulator Banner Alert */}
      {activeAlertBanner && (
        <div className="rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-blue-700 p-0.5 shadow-lg animate-in slide-in-from-top-3 fade-in duration-300">
          <div className="rounded-[14px] bg-white dark:bg-[#0B1120] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 animate-bounce">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                    🔔 LIVE PUSH NOTIFICATION
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                    {activeAlertBanner.item.timeLabel}
                  </span>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white mt-1">
                  {activeAlertBanner.message}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  Prescribed by {activeAlertBanner.item.doctorName} • {activeAlertBanner.item.instructions}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  handleToggleTaken(activeAlertBanner.item.id);
                  setActiveAlertBanner(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === 'np' ? 'खाइसक्यो' : 'Mark Taken'}</span>
              </button>
              <button
                onClick={() => setActiveAlertBanner(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                {language === 'np' ? 'बन्द' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-red-600/20 shrink-0">
            <Pill className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                {t('medicationReminders', language)}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-black uppercase tracking-wider">
                Nepal Clinical Rx
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {language === 'np'
                ? 'डाक्टरले सिफारिस गरेका औषधिहरूको दैनिक समय तालिका तथा स्वचालित सूचना'
                : 'Daily dose schedules synced with active NMC doctor prescriptions'}
            </p>
          </div>
        </div>

        {/* Adherence Badge & Quick Link */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400">
              {t('dailyAdherence', language)}
            </span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {takenCount}/{scheduledCount} {language === 'np' ? 'मात्रा खाइयो' : 'Doses'} ({adherencePercent}%)
            </span>
          </div>
          {onNavigateToRecords && (
            <button
              onClick={onNavigateToRecords}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>{language === 'np' ? 'सबै प्रेस्क्रिप्सन' : 'View Rx'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Adherence Progress Line */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              adherencePercent === 100
                ? 'bg-emerald-500'
                : adherencePercent >= 50
                ? 'bg-gradient-to-r from-blue-600 to-emerald-500'
                : 'bg-gradient-to-r from-red-600 to-amber-500'
            }`}
            style={{ width: `${adherencePercent}%` }}
          />
        </div>
      </div>

      {/* Time of Day Simulation Bar */}
      <div className="rounded-2xl bg-slate-50 dark:bg-[#151F32] p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold shrink-0">
          <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span>{language === 'np' ? 'समय सिम्युलेटर:' : 'Notification Time Simulator:'}</span>
        </div>

        {/* Quick Time Jump Pills */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {[
            { label: '🌅 08:00 AM (Morning)', hour: 8 },
            { label: '☀️ 01:30 PM (Lunch)', hour: 13 },
            { label: '🌙 09:00 PM (Dinner)', hour: 21 },
            { label: '⏰ Real Local Time', hour: new Date().getHours() }
          ].map((slot) => (
            <button
              key={slot.label}
              onClick={() => setSimulatedHour(slot.hour)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                simulatedHour === slot.hour
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#0F172A] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>

      {/* Medication Doses Grid */}
      {doseSchedule.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Pill className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {language === 'np' ? 'हाल कुनै सक्रिय औषधि सिफारिस भेटिएन।' : 'No active prescriptions or scheduled medicines.'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {language === 'np'
              ? 'डाक्टरसँग परामर्श गरेपछि वा प्रेस्क्रिप्सन जारी भएपछि तालिका यहाँ देखिनेछ।'
              : 'Consult a specialist doctor to generate digital verified prescriptions with automatic reminders.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {doseSchedule.map((item) => {
            const isTaken = !!takenStatus[item.id];
            const status = getItemStatus(item);

            return (
              <div
                key={item.id}
                className={`rounded-2xl p-4 border transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                  isTaken
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-800/50 opacity-80'
                    : status === 'due_now'
                    ? 'bg-white dark:bg-[#151F32] border-red-500/50 dark:border-red-500/50 shadow-md shadow-red-500/5'
                    : 'bg-white dark:bg-[#151F32] border-slate-200/90 dark:border-slate-800'
                }`}
              >
                {/* Top Item Info */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isTaken
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300'
                            : status === 'due_now'
                            ? 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 animate-pulse'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <h4
                          className={`text-xs font-black ${
                            isTaken
                              ? 'line-through text-slate-500 dark:text-slate-400'
                              : 'text-slate-950 dark:text-white'
                          }`}
                        >
                          {item.medicineName}
                        </h4>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {item.dosage}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill Badge */}
                    <div>
                      {isTaken ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{language === 'np' ? 'खाइसकियो' : 'Taken'}</span>
                        </span>
                      ) : status === 'due_now' ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          <span>{language === 'np' ? 'अहिले खाने समय' : 'DUE NOW'}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black">
                          {item.timeLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meal Timing & Instruction */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                        🍽️ {language === 'np' ? item.mealTimingNp : item.mealTiming}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Dr. {item.doctorName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      {item.instructions}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                  <button
                    onClick={() => handleToggleTaken(item.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isTaken
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isTaken
                        ? language === 'np'
                          ? 'पुनः सक्रिय गर्नुहोस्'
                          : 'Undo Taken'
                        : language === 'np'
                        ? 'खाइसक्यो (Mark Taken)'
                        : 'Mark as Taken'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleSimulateAlert(item)}
                    title={language === 'np' ? 'यस औषधिको सूचना परीक्षण गर्नुहोस्' : 'Test push alert chime'}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footnote & Guidance */}
      <div className="rounded-xl bg-slate-50 dark:bg-[#151F32] p-3 text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2.5">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>
          {language === 'np'
            ? 'सूचनाहरू तपाईंको डिजिटल प्रेस्क्रिप्सनसँग सिङ्क गरिएका छन्। यदि तपाईंले कुनै औषधि बिर्सनुभयो भने आफ्नो डाक्टरसँग सम्पर्क गर्नुहोस्।'
            : 'Push notifications are synchronized with verified doctor instructions. Always adhere to prescribed intervals.'}
        </span>
      </div>
    </div>
  );
};
