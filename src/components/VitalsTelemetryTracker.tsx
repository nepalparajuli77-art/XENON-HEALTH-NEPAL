import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  Heart,
  Activity,
  Droplets,
  Thermometer,
  Calendar,
  Download,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Info,
  Clock,
  Pill,
  GlassWater,
  Footprints,
  Mountain,
  Save,
  Trash2,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { Language, User } from '../types';
import { triggerHaptic } from '../utils/haptics';

export interface VitalChecklistItem {
  id: string;
  title: string;
  titleNp: string;
  category: 'vitals' | 'medication' | 'lifestyle' | 'altitude';
  icon: string;
  completed: boolean;
  timeLabel?: string;
}

export interface VitalLogPoint {
  id: string;
  timestamp: string; // ISO string
  dateLabel: string; // MM/DD or DD Mon
  timeLabel: string; // HH:mm
  heartRate: number; // bpm
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  spO2: number; // %
  bloodGlucose: number; // mg/dL
  temperature: number; // °F
  weightKg?: number;
  altitudeMeters?: number;
  notes?: string;
}

interface VitalsTrackerProps {
  currentUser: User | null;
  language: Language;
  onOpenConsultation?: () => void;
}

const INITIAL_CHECKLIST: VitalChecklistItem[] = [
  {
    id: 'chk_bp',
    title: 'Record Morning Blood Pressure',
    titleNp: 'बिहानी रक्तचाप (BP) नाप्ने',
    category: 'vitals',
    icon: 'heart',
    completed: true,
    timeLabel: '08:00 AM'
  },
  {
    id: 'chk_rx_am',
    title: 'Take Morning Prescribed Medication',
    titleNp: 'बिहानको औषधि (Medication) सेवन',
    category: 'medication',
    icon: 'pill',
    completed: true,
    timeLabel: '08:30 AM'
  },
  {
    id: 'chk_water',
    title: 'Hydration Goal (Drink at least 2.5 Liters)',
    titleNp: 'प्रशस्त पानी पिउने लक्ष्य (२.५ लिटर)',
    category: 'lifestyle',
    icon: 'water',
    completed: false,
    timeLabel: 'Daily Target'
  },
  {
    id: 'chk_spo2',
    title: 'Pulse Oximeter & Heart Rate Check',
    titleNp: 'पल्स र SpO2 अक्सिजन स्तर जाँच्ने',
    category: 'vitals',
    icon: 'activity',
    completed: true,
    timeLabel: '12:00 PM'
  },
  {
    id: 'chk_walk',
    title: '30-Minute Light Physical Walk / Exercise',
    titleNp: '३० मिनेटको हिँडडुल वा हल्का व्यायाम',
    category: 'lifestyle',
    icon: 'walk',
    completed: false,
    timeLabel: 'Evening'
  },
  {
    id: 'chk_altitude',
    title: 'Altitude Acclimatization & Headache Check',
    titleNp: 'हिमाली उचाइ अनुकूलन तथा टाउको दुखाइ जाँच',
    category: 'altitude',
    icon: 'mountain',
    completed: true,
    timeLabel: 'Daily Check'
  }
];

// Initial 14-day history for sample reference
const generateInitialLogs = (userId: string): VitalLogPoint[] => {
  const points: VitalLogPoint[] = [];
  const now = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const dateLabel = `${month} ${day}`;

    const isTrekDay = i === 4 || i === 5;
    points.push({
      id: `vital_${userId}_${14 - i}`,
      timestamp: d.toISOString(),
      dateLabel,
      timeLabel: '08:30 AM',
      heartRate: 72 + Math.round(Math.sin(i * 0.7) * 5),
      systolicBP: 118 + Math.round(Math.cos(i * 0.4) * 6),
      diastolicBP: 78 + Math.round(Math.cos(i * 0.4) * 4),
      spO2: isTrekDay ? 92 : 97 + (i % 2 === 0 ? 1 : 0),
      bloodGlucose: 95 + (i % 3) * 4,
      temperature: 98.4,
      weightKg: 68,
      altitudeMeters: isTrekDay ? 3440 : 1400,
      notes: isTrekDay ? 'Namche Bazaar altitude log' : 'Routine home reading'
    });
  }
  return points;
};

export const VitalsTelemetryTracker: React.FC<VitalsTrackerProps> = ({
  currentUser,
  language,
  onOpenConsultation
}) => {
  const userId = currentUser?.id || 'guest_user';

  // Checklist state
  const [checklist, setChecklist] = useState<VitalChecklistItem[]>(() => {
    const saved = localStorage.getItem(`telemed_vitals_checklist_${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_CHECKLIST;
  });

  // Vitals logs state
  const [logs, setLogs] = useState<VitalLogPoint[]>(() => {
    const saved = localStorage.getItem(`telemed_vitals_logs_${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return generateInitialLogs(userId);
  });

  // Modal for new manual vitals entry
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'bp' | 'heartRate' | 'spO2' | 'bloodGlucose' | 'temperature'>('bp');

  // Form inputs
  const [inputSystolic, setInputSystolic] = useState('120');
  const [inputDiastolic, setInputDiastolic] = useState('80');
  const [inputHR, setInputHR] = useState('74');
  const [inputSpO2, setInputSpO2] = useState('98');
  const [inputGlucose, setInputGlucose] = useState('95');
  const [inputTemp, setInputTemp] = useState('98.4');
  const [inputWeight, setInputWeight] = useState('68');
  const [inputNotes, setInputNotes] = useState('');

  // Toggle checklist item
  const handleToggleItem = (id: string) => {
    triggerHaptic('light');
    setChecklist((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      localStorage.setItem(`telemed_vitals_checklist_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Add new vitals log
  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');

    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const day = now.getDate();
    const hours = now.getHours();
    const mins = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    const newPoint: VitalLogPoint = {
      id: `vital_${Date.now()}`,
      timestamp: now.toISOString(),
      dateLabel: `${month} ${day}`,
      timeLabel: `${hour12}:${mins} ${ampm}`,
      heartRate: Number(inputHR) || 72,
      systolicBP: Number(inputSystolic) || 120,
      diastolicBP: Number(inputDiastolic) || 80,
      spO2: Number(inputSpO2) || 98,
      bloodGlucose: Number(inputGlucose) || 95,
      temperature: Number(inputTemp) || 98.4,
      weightKg: Number(inputWeight) || 68,
      notes: inputNotes.trim() || 'Manual self-reported check'
    };

    const updatedLogs = [...logs, newPoint];
    setLogs(updatedLogs);
    localStorage.setItem(`telemed_vitals_logs_${userId}`, JSON.stringify(updatedLogs));
    setIsLogModalOpen(false);
    setInputNotes('');
  };

  // Delete a log entry
  const handleDeleteLog = (id: string) => {
    triggerHaptic('warning');
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    localStorage.setItem(`telemed_vitals_logs_${userId}`, JSON.stringify(updated));
  };

  // Latest entry
  const latestLog = logs[logs.length - 1] || {
    systolicBP: 120,
    diastolicBP: 80,
    heartRate: 72,
    spO2: 98,
    bloodGlucose: 95,
    temperature: 98.4
  };

  // Checklist completed percentage
  const completedCount = checklist.filter((c) => c.completed).length;
  const checklistProgress = Math.round((completedCount / checklist.length) * 100);

  // Helper render for checklist icons
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'pill':
        return <Pill className="w-4 h-4 text-blue-500" />;
      case 'water':
        return <GlassWater className="w-4 h-4 text-cyan-500" />;
      case 'walk':
        return <Footprints className="w-4 h-4 text-emerald-500" />;
      case 'mountain':
        return <Mountain className="w-4 h-4 text-amber-500" />;
      default:
        return <Activity className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Daily Health & Vitals Checklist Summary */}
      <div className="p-5 sm:p-6 rounded-3xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-sm space-y-5 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'np' ? 'दैनिक स्वास्थ्य तथा भाइटल चेकलिस्ट' : 'Daily Health & Vitals Checklist'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'np'
                ? 'नियमित रक्तचाप, औषधि सेवन तथा स्वास्थ्य सूचकहरूको दैनिक ट्र्याकिङ'
                : 'Self-reported daily wellness routine, medication adherence, and vitals check'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsLogModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'np' ? 'नयाँ भाइटल प्रविष्ट गर्नुहोस्' : 'Log New Vitals'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-300">
              {completedCount} of {checklist.length} Completed Today
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">{checklistProgress}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
              style={{ width: `${checklistProgress}%` }}
            />
          </div>
        </div>

        {/* Interactive Checklist Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleItem(item.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                item.completed
                  ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 text-slate-800 dark:text-slate-200'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                    {language === 'np' ? item.titleNp : item.title}
                  </p>
                  {item.timeLabel && (
                    <span className="text-[10px] text-slate-400 font-medium">{item.timeLabel}</span>
                  )}
                </div>
              </div>

              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-2xs shrink-0">
                {getCategoryIcon(item.icon)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Vitals Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Blood Pressure */}
        <div className="p-4 rounded-2xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Blood Pressure</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {latestLog.systolicBP}/{latestLog.diastolicBP} <span className="text-xs font-normal text-slate-400">mmHg</span>
          </p>
          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Normal (Optimal)
          </span>
        </div>

        {/* Pulse / Heart Rate */}
        <div className="p-4 rounded-2xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Pulse Rate</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {latestLog.heartRate} <span className="text-xs font-normal text-slate-400">bpm</span>
          </p>
          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
            Resting Normal
          </span>
        </div>

        {/* Blood Oxygen SpO2 */}
        <div className="p-4 rounded-2xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Blood Oxygen (SpO2)</span>
            <Droplets className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {latestLog.spO2}% <span className="text-xs font-normal text-slate-400"></span>
          </p>
          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            {latestLog.spO2 >= 95 ? 'Healthy Range' : 'Acclimatizing'}
          </span>
        </div>

        {/* Body Temperature */}
        <div className="p-4 rounded-2xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {latestLog.temperature}°F <span className="text-xs font-normal text-slate-400"></span>
          </p>
          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
            Afebrile
          </span>
        </div>
      </div>

      {/* Vitals Trend Visualization */}
      <div className="p-5 sm:p-6 rounded-3xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'np' ? 'भाइटल इतिहास तथा ट्रेन्ड' : 'Longitudinal Vitals Trends'}
            </h3>
            <p className="text-xs text-slate-500">14-Day Self-Reported Check Log</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveMetric('bp');
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeMetric === 'bp' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              BP
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveMetric('heartRate');
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeMetric === 'heartRate' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Pulse
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveMetric('spO2');
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeMetric === 'spO2' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              SpO2
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveMetric('bloodGlucose');
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeMetric === 'bloodGlucose' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Glucose
            </button>
          </div>
        </div>

        {/* Recharts chart */}
        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {activeMetric === 'bp' ? (
              <LineChart data={logs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[60, 160]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <ReferenceLine y={120} stroke="#3b82f6" strokeDasharray="3 3" label="Normal Systolic" />
                <Line type="monotone" dataKey="systolicBP" name="Systolic" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="diastolicBP" name="Diastolic" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            ) : (
              <AreaChart data={logs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  name={activeMetric.toUpperCase()}
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.15}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'np' ? 'भाइटल प्रविष्ट गर्नुहोस्' : 'Log Self-Measured Vitals'}
                </h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={inputSystolic}
                    onChange={(e) => setInputSystolic(e.target.value)}
                    placeholder="120"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={inputDiastolic}
                    onChange={(e) => setInputDiastolic(e.target.value)}
                    placeholder="80"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Pulse / Heart Rate (BPM)</label>
                  <input
                    type="number"
                    value={inputHR}
                    onChange={(e) => setInputHR(e.target.value)}
                    placeholder="72"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="number"
                    value={inputSpO2}
                    onChange={(e) => setInputSpO2(e.target.value)}
                    placeholder="98"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Blood Glucose (mg/dL)</label>
                  <input
                    type="number"
                    value={inputGlucose}
                    onChange={(e) => setInputGlucose(e.target.value)}
                    placeholder="95"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputTemp}
                    onChange={(e) => setInputTemp(e.target.value)}
                    placeholder="98.4"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-semibold block mb-1">Notes / Symptoms</label>
                <input
                  type="text"
                  value={inputNotes}
                  onChange={(e) => setInputNotes(e.target.value)}
                  placeholder="e.g. Normal morning check after light breakfast"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save to Vitals Log</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
