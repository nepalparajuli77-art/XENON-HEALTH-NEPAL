import React, { useState, useMemo, useEffect } from 'react';
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
  X,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  ShieldCheck,
  Scale,
  Edit2,
  Check,
  ArrowUpRight
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
import { Language, User, UserVitals } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  evaluateBloodPressure,
  evaluateHeartRate,
  evaluateSpO2,
  evaluateGlucose,
  evaluateTemperature
} from '../utils/vitalsEvaluator';

export interface VitalChecklistItem {
  id: string;
  title: string;
  titleNp: string;
  category: 'vitals' | 'medication' | 'lifestyle' | 'altitude';
  icon: string;
  completed: boolean;
  timeLabel?: string;
  isCustom?: boolean;
}

export interface VitalLogPoint {
  id: string;
  timestamp: string; // ISO string
  dateLabel: string; // MM/DD or DD Mon
  timeLabel: string; // HH:mm AM/PM
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
  onUpdateUserVitals?: (vitals: UserVitals) => void;
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

// Generate consistent initial 14-day baseline for clean visualization
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
      notes: isTrekDay ? 'Namche Bazaar high-altitude trek log' : 'Routine home reading'
    });
  }
  return points;
};

export const VitalsTelemetryTracker: React.FC<VitalsTrackerProps> = ({
  currentUser,
  language,
  onOpenConsultation,
  onUpdateUserVitals
}) => {
  const userId = currentUser?.id || 'guest_user';

  // Checklist state
  const [checklist, setChecklist] = useState<VitalChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(`telemed_vitals_checklist_${userId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return INITIAL_CHECKLIST;
  });

  // Vitals logs state
  const [logs, setLogs] = useState<VitalLogPoint[]>(() => {
    try {
      const saved = localStorage.getItem(`telemed_vitals_logs_${userId}`);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return generateInitialLogs(userId);
  });

  // Sync state if currentUser/userId changes
  useEffect(() => {
    try {
      const savedChecklist = localStorage.getItem(`telemed_vitals_checklist_${userId}`);
      if (savedChecklist) {
        setChecklist(JSON.parse(savedChecklist));
      } else {
        setChecklist(INITIAL_CHECKLIST);
      }
    } catch {
      setChecklist(INITIAL_CHECKLIST);
    }

    try {
      const savedLogs = localStorage.getItem(`telemed_vitals_logs_${userId}`);
      if (savedLogs !== null) {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed)) {
          setLogs(parsed);
          return;
        }
      }
      setLogs(generateInitialLogs(userId));
    } catch {
      setLogs(generateInitialLogs(userId));
    }
  }, [userId]);

  // Modal for new manual vitals entry / editing
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'bp' | 'heartRate' | 'spO2' | 'bloodGlucose' | 'temperature' | 'weight' | 'altitude'>('bp');

  // Form inputs
  const [inputSystolic, setInputSystolic] = useState('120');
  const [inputDiastolic, setInputDiastolic] = useState('80');
  const [inputHR, setInputHR] = useState('74');
  const [inputSpO2, setInputSpO2] = useState('98');
  const [inputGlucose, setInputGlucose] = useState('95');
  const [inputTemp, setInputTemp] = useState('98.4');
  const [inputWeight, setInputWeight] = useState('68');
  const [inputAltitude, setInputAltitude] = useState('1400');
  const [inputNotes, setInputNotes] = useState('');

  // Form Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // New Custom Goal Inputs
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<'vitals' | 'medication' | 'lifestyle' | 'altitude'>('lifestyle');
  const [newGoalTime, setNewGoalTime] = useState('Daily Target');

  // Toggle checklist item
  const handleToggleItem = (id: string) => {
    triggerHaptic('light');
    setChecklist((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      try {
        localStorage.setItem(`telemed_vitals_checklist_${userId}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save checklist:', e);
      }
      return updated;
    });
  };

  // Delete custom checklist item
  const handleDeleteCustomGoal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('warning');
    setChecklist((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(`telemed_vitals_checklist_${userId}`, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to delete checklist item:', err);
      }
      return updated;
    });
  };

  // Reset checklist for a fresh morning routine
  const handleResetChecklist = () => {
    triggerHaptic('medium');
    const resetList = checklist.map((item) => ({ ...item, completed: false }));
    setChecklist(resetList);
    try {
      localStorage.setItem(`telemed_vitals_checklist_${userId}`, JSON.stringify(resetList));
    } catch (e) {
      console.warn('Failed to reset checklist:', e);
    }
    showToast(language === 'np' ? 'आजको चेकलिस्ट रिसेट गरियो।' : 'Checklist reset for today.');
  };

  // Add custom checklist item
  const handleAddCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    triggerHaptic('success');

    const iconMap: Record<string, string> = {
      vitals: 'activity',
      medication: 'pill',
      lifestyle: 'walk',
      altitude: 'mountain'
    };

    const newItem: VitalChecklistItem = {
      id: `custom_chk_${Date.now()}`,
      title: newGoalTitle.trim(),
      titleNp: newGoalTitle.trim(),
      category: newGoalCategory,
      icon: iconMap[newGoalCategory] || 'activity',
      completed: false,
      timeLabel: newGoalTime.trim() || 'Custom Goal',
      isCustom: true
    };

    const updated = [...checklist, newItem];
    setChecklist(updated);
    try {
      localStorage.setItem(`telemed_vitals_checklist_${userId}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save custom goal:', err);
    }
    setNewGoalTitle('');
    setIsGoalModalOpen(false);
    showToast(language === 'np' ? 'नयाँ स्वास्थ्य लक्ष्य थपियो!' : 'New health goal added!');
  };

  // Open modal for new log or editing existing log
  const handleOpenLogModal = (logToEdit?: VitalLogPoint) => {
    setFormErrors({});
    if (logToEdit) {
      setEditingLogId(logToEdit.id);
      setInputSystolic(logToEdit.systolicBP.toString());
      setInputDiastolic(logToEdit.diastolicBP.toString());
      setInputHR(logToEdit.heartRate.toString());
      setInputSpO2(logToEdit.spO2.toString());
      setInputGlucose(logToEdit.bloodGlucose.toString());
      setInputTemp(logToEdit.temperature.toString());
      setInputWeight(logToEdit.weightKg ? logToEdit.weightKg.toString() : '68');
      setInputAltitude(logToEdit.altitudeMeters ? logToEdit.altitudeMeters.toString() : '1400');
      setInputNotes(logToEdit.notes || '');
    } else {
      setEditingLogId(null);
      // Pre-fill with the latest log values if available
      const latest = logs.length > 0 ? logs[logs.length - 1] : null;
      if (latest) {
        setInputSystolic(latest.systolicBP.toString());
        setInputDiastolic(latest.diastolicBP.toString());
        setInputHR(latest.heartRate.toString());
        setInputSpO2(latest.spO2.toString());
        setInputGlucose(latest.bloodGlucose.toString());
        setInputTemp(latest.temperature.toString());
        setInputWeight(latest.weightKg ? latest.weightKg.toString() : '68');
        setInputAltitude(latest.altitudeMeters ? latest.altitudeMeters.toString() : '1400');
      } else {
        setInputSystolic('120');
        setInputDiastolic('80');
        setInputHR('74');
        setInputSpO2('98');
        setInputGlucose('95');
        setInputTemp('98.4');
        setInputWeight('68');
        setInputAltitude('1400');
      }
      setInputNotes('');
    }
    setIsLogModalOpen(true);
  };

  // Validate Vitals Form Inputs before saving
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const rawS = inputSystolic.trim();
    const rawD = inputDiastolic.trim();
    const rawHR = inputHR.trim();
    const rawSpO2 = inputSpO2.trim();
    const rawGlu = inputGlucose.trim();
    const rawTemp = inputTemp.trim();
    const rawW = inputWeight.trim();
    const rawAlt = inputAltitude.trim();

    if (!rawS) {
      errors.systolic = language === 'np' ? 'सिस्टोलिक रक्तचाप आवश्यक छ।' : 'Systolic blood pressure is required.';
    } else {
      const s = Number(rawS);
      if (isNaN(s) || s < 60 || s > 260) {
        errors.systolic = language === 'np' ? 'सिस्टोलिक रक्तचाप ६०-२६० mmHg बीच हुनुपर्छ।' : 'Systolic must be between 60 and 260 mmHg.';
      }
    }

    if (!rawD) {
      errors.diastolic = language === 'np' ? 'डायस्टोलिक रक्तचाप आवश्यक छ।' : 'Diastolic blood pressure is required.';
    } else {
      const d = Number(rawD);
      if (isNaN(d) || d < 30 || d > 160) {
        errors.diastolic = language === 'np' ? 'डायस्टोलिक रक्तचाप ३०-१६० mmHg बीच हुनुपर्छ।' : 'Diastolic must be between 30 and 160 mmHg.';
      }
    }

    // Relative check: diastolic must be strictly less than systolic
    const sVal = Number(rawS);
    const dVal = Number(rawD);
    if (!isNaN(sVal) && !isNaN(dVal) && sVal > 0 && dVal > 0) {
      if (dVal >= sVal) {
        errors.diastolic = language === 'np' ? 'डायस्टोलिक मान सिस्टोलिकभन्दा कम हुनुपर्छ।' : 'Diastolic must be strictly less than systolic.';
      }
    }

    if (!rawHR) {
      errors.heartRate = language === 'np' ? 'मुटुको चाल (HR) आवश्यक छ।' : 'Heart rate is required.';
    } else {
      const hr = Number(rawHR);
      if (isNaN(hr) || hr < 30 || hr > 220) {
        errors.heartRate = language === 'np' ? 'पल्स दर ३०-२२० bpm बीच हुनुपर्छ।' : 'Heart rate must be between 30 and 220 bpm.';
      }
    }

    if (!rawSpO2) {
      errors.spO2 = language === 'np' ? 'SpO2 अक्सिजन आवश्यक छ।' : 'SpO2 is required.';
    } else {
      const spo2 = Number(rawSpO2);
      if (isNaN(spo2) || spo2 < 50 || spo2 > 100) {
        errors.spO2 = language === 'np' ? 'SpO2 अक्सिजन ५०-१००% बीच हुनुपर्छ।' : 'SpO2 must be between 50% and 100%.';
      }
    }

    if (!rawGlu) {
      errors.glucose = language === 'np' ? 'ग्लुकोज स्तर आवश्यक छ।' : 'Blood glucose is required.';
    } else {
      const glu = Number(rawGlu);
      if (isNaN(glu) || glu < 20 || glu > 600) {
        errors.glucose = language === 'np' ? 'ग्लुकोज २०-६०० mg/dL बीच हुनुपर्छ।' : 'Blood glucose must be between 20 and 600 mg/dL.';
      }
    }

    if (!rawTemp) {
      errors.temperature = language === 'np' ? 'तापक्रम आवश्यक छ।' : 'Temperature is required.';
    } else {
      const temp = Number(rawTemp);
      if (isNaN(temp) || temp < 90.0 || temp > 108.0) {
        errors.temperature = language === 'np' ? 'तापक्रम ९०.०-१०८.० °F बीच हुनुपर्छ।' : 'Temperature must be between 90.0°F and 108.0°F.';
      }
    }

    if (rawW) {
      const w = Number(rawW);
      if (isNaN(w) || w < 2 || w > 350) {
        errors.weight = language === 'np' ? 'तौल २-३५० kg बीच हुनुपर्छ।' : 'Weight must be between 2 and 350 kg.';
      }
    }

    if (rawAlt) {
      const alt = Number(rawAlt);
      if (isNaN(alt) || alt < 0 || alt > 8848) {
        errors.altitude = language === 'np' ? 'उचाइ ०-८८४८ मिटर बीच हुनुपर्छ।' : 'Altitude must be between 0 and 8,848 meters.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add or update vitals log
  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      triggerHaptic('warning');
      return;
    }

    triggerHaptic('success');

    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const day = now.getDate();
    const hours = now.getHours();
    const mins = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    const s = Number(inputSystolic);
    const d = Number(inputDiastolic);
    const hr = Number(inputHR);
    const spo2 = Number(inputSpO2);
    const glu = Number(inputGlucose);
    const temp = Number(inputTemp);
    const w = inputWeight.trim() ? Number(inputWeight) : undefined;
    const alt = inputAltitude.trim() ? Number(inputAltitude) : undefined;

    let updatedLogs: VitalLogPoint[];

    if (editingLogId) {
      // Update existing record
      updatedLogs = logs.map((l) => {
        if (l.id === editingLogId) {
          return {
            ...l,
            heartRate: hr,
            systolicBP: s,
            diastolicBP: d,
            spO2: spo2,
            bloodGlucose: glu,
            temperature: temp,
            weightKg: w,
            altitudeMeters: alt,
            notes: inputNotes.trim() || l.notes
          };
        }
        return l;
      });
      showToast(language === 'np' ? 'भाइटल रेकर्ड अद्यावधिक गरियो!' : 'Vitals checkpoint updated successfully!');
    } else {
      // New record
      const newPoint: VitalLogPoint = {
        id: `vital_${Date.now()}`,
        timestamp: now.toISOString(),
        dateLabel: `${month} ${day}`,
        timeLabel: `${hour12}:${mins} ${ampm}`,
        heartRate: hr,
        systolicBP: s,
        diastolicBP: d,
        spO2: spo2,
        bloodGlucose: glu,
        temperature: temp,
        weightKg: w || 68,
        altitudeMeters: alt || 1400,
        notes: inputNotes.trim() || 'Manual self-reported check'
      };

      updatedLogs = [...logs, newPoint];
      showToast(language === 'np' ? 'नयाँ भाइटल सुरक्षित गरियो!' : 'New vitals checkpoint logged successfully!');
    }

    // Sort by timestamp
    updatedLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    setLogs(updatedLogs);
    try {
      localStorage.setItem(`telemed_vitals_logs_${userId}`, JSON.stringify(updatedLogs));
    } catch (err) {
      console.warn('Failed to persist vitals logs:', err);
    }

    // Synchronize to user profile vitals
    const updatedUserVitals: UserVitals = {
      bp: `${s}/${d}`,
      sp_o2: `${spo2}%`,
      heart_rate: `${hr} bpm`,
      blood_sugar: `${glu} mg/dL`,
      weight_kg: w ? `${w}` : '68',
      temperature: `${temp} °F`,
      last_updated: now.toISOString()
    };

    if (onUpdateUserVitals) {
      onUpdateUserVitals(updatedUserVitals);
    }

    // Save in user profile in localStorage
    if (currentUser) {
      try {
        const updatedUser = { ...currentUser, vitals: updatedUserVitals };
        localStorage.setItem('telemed_current_user', JSON.stringify(updatedUser));
      } catch (err) {
        console.warn('Failed to sync profile vitals:', err);
      }
    }

    // Notify other components via custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('xenon-vitals-updated', {
          detail: {
            vitals: updatedUserVitals,
            logPoint: updatedLogs[updatedLogs.length - 1]
          }
        })
      );
    }

    setIsLogModalOpen(false);
    setEditingLogId(null);
    setInputNotes('');
    setFormErrors({});
  };

  // Delete a log entry
  const handleDeleteLog = (id: string) => {
    triggerHaptic('warning');
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    try {
      localStorage.setItem(`telemed_vitals_logs_${userId}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to delete log:', err);
    }
    showToast(language === 'np' ? 'रेकर्ड हटाइयो।' : 'Checkpoint record removed.');
  };

  // Export CSV
  const handleExportCsv = () => {
    triggerHaptic('medium');
    const headers = 'Date,Time,Systolic_BP,Diastolic_BP,Heart_Rate_BPM,SpO2_Percent,Blood_Glucose_mgdL,Temperature_F,Weight_kg,Altitude_m,Notes\n';
    const rows = logs
      .map(
        (l) =>
          `"${l.dateLabel}","${l.timeLabel}",${l.systolicBP},${l.diastolicBP},${l.heartRate},${l.spO2},${l.bloodGlucose},${l.temperature},${l.weightKg || ''},${l.altitudeMeters || ''},"${(l.notes || '').replace(/"/g, '""')}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `xenon_vitals_telemetry_${userId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Latest entry with safe fallbacks
  const latestLog: VitalLogPoint = useMemo(() => {
    if (logs.length > 0) {
      return logs[logs.length - 1];
    }
    return {
      id: 'default',
      timestamp: new Date().toISOString(),
      dateLabel: 'Today',
      timeLabel: '08:00 AM',
      systolicBP: 120,
      diastolicBP: 80,
      heartRate: 74,
      spO2: 98,
      bloodGlucose: 95,
      temperature: 98.4,
      weightKg: 68,
      altitudeMeters: 1400
    };
  }, [logs]);

  // Live modal evaluation for current input numbers
  const liveModalEval = useMemo(() => {
    const s = Number(inputSystolic);
    const d = Number(inputDiastolic);
    const hr = Number(inputHR);
    const spo2 = Number(inputSpO2);
    const glu = Number(inputGlucose);
    const temp = Number(inputTemp);

    return {
      bp: !isNaN(s) && !isNaN(d) && s > 0 && d > 0 ? evaluateBloodPressure(s, d) : null,
      hr: !isNaN(hr) && hr > 0 ? evaluateHeartRate(hr) : null,
      spO2: !isNaN(spo2) && spo2 > 0 ? evaluateSpO2(spo2, Number(inputAltitude) || 1400) : null,
      glu: !isNaN(glu) && glu > 0 ? evaluateGlucose(glu) : null,
      temp: !isNaN(temp) && temp > 0 ? evaluateTemperature(temp) : null
    };
  }, [inputSystolic, inputDiastolic, inputHR, inputSpO2, inputGlucose, inputTemp, inputAltitude]);

  // Clinical Evaluations for Latest Metrics
  const bpEval = evaluateBloodPressure(latestLog.systolicBP, latestLog.diastolicBP);
  const hrEval = evaluateHeartRate(latestLog.heartRate);
  const spO2Eval = evaluateSpO2(latestLog.spO2, latestLog.altitudeMeters || 1400);
  const gluEval = evaluateGlucose(latestLog.bloodGlucose);
  const tempEval = evaluateTemperature(latestLog.temperature);

  // Checklist completed percentage
  const completedCount = checklist.filter((c) => c.completed).length;
  const checklistProgress = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

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

  // Prepare chart dataset with unique formatted date labels
  const chartData = useMemo(() => {
    return logs.map((l, idx) => ({
      ...l,
      chartIndex: idx,
      displayLabel: `${l.dateLabel} ${l.timeLabel}`
    }));
  }, [logs]);

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full min-w-0">
      {/* Dynamic Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs shadow-xl border border-white/20 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

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
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {language === 'np'
                ? 'नियमित रक्तचाप, औषधि सेवन तथा स्वास्थ्य सूचकहरूको दैनिक ट्र्याकिङ'
                : 'Self-reported daily wellness routine, medication adherence, and vitals check'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleResetChecklist}
              title={language === 'np' ? 'आजको चेकलिस्ट रिसेट गर्नुहोस्' : 'Reset Checklist for Today'}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'np' ? 'रिसेट' : 'Reset Today'}</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setIsGoalModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-500" />
              <span>{language === 'np' ? '+ नयाँ लक्ष्य' : '+ Add Goal'}</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                handleOpenLogModal();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4 text-white" />
              <span>{language === 'np' ? 'भाइटल प्रविष्ट गर्नुहोस्' : 'Log New Vitals'}</span>
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

              <div className="flex items-center gap-1 shrink-0">
                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-2xs">
                  {getCategoryIcon(item.icon)}
                </div>
                {item.isCustom && (
                  <button
                    onClick={(e) => handleDeleteCustomGoal(item.id, e)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Vitals Metric Cards with Dynamic Clinical Evaluation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Blood Pressure */}
        <div className="p-4 rounded-2xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{language === 'np' ? 'रक्तचाप (BP)' : 'Blood Pressure'}</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {latestLog.systolicBP}/{latestLog.diastolicBP} <span className="text-xs font-normal text-slate-400">mmHg</span>
          </p>
          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${bpEval.badgeBg} ${bpEval.badgeText}`}>
            {language === 'np' ? bpEval.labelNp : bpEval.label}
          </span>
        </div>

        {/* Pulse / Heart Rate */}
        <div className="p-4 rounded-2xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{language === 'np' ? 'पल्स (Pulse)' : 'Pulse Rate'}</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {latestLog.heartRate} <span className="text-xs font-normal text-slate-400">bpm</span>
          </p>
          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${hrEval.badgeBg} ${hrEval.badgeText}`}>
            {language === 'np' ? hrEval.labelNp : hrEval.label}
          </span>
        </div>

        {/* Blood Oxygen SpO2 */}
        <div className="p-4 rounded-2xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{language === 'np' ? 'अक्सिजन (SpO2)' : 'Oxygen (SpO2)'}</span>
            <Droplets className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {latestLog.spO2}% <span className="text-xs font-normal text-slate-400"></span>
          </p>
          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${spO2Eval.badgeBg} ${spO2Eval.badgeText}`}>
            {language === 'np' ? spO2Eval.labelNp : spO2Eval.label}
          </span>
        </div>

        {/* Blood Glucose */}
        <div className="p-4 rounded-2xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{language === 'np' ? 'ग्लुकोज (Sugar)' : 'Blood Glucose'}</span>
            <Droplets className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {latestLog.bloodGlucose} <span className="text-xs font-normal text-slate-400">mg/dL</span>
          </p>
          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${gluEval.badgeBg} ${gluEval.badgeText}`}>
            {language === 'np' ? gluEval.labelNp : gluEval.label}
          </span>
        </div>

        {/* Body Temperature */}
        <div className="p-4 rounded-2xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{language === 'np' ? 'तापक्रम (Temp)' : 'Temperature'}</span>
            <Thermometer className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {latestLog.temperature}°F <span className="text-xs font-normal text-slate-400"></span>
          </p>
          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${tempEval.badgeBg} ${tempEval.badgeText}`}>
            {language === 'np' ? tempEval.labelNp : tempEval.label}
          </span>
        </div>
      </div>

      {/* Vitals Trend Visualization */}
      <div className="p-5 sm:p-6 rounded-3xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'np' ? 'भाइटल इतिहास तथा ट्रेन्ड चार्ट' : 'Longitudinal Vitals Trend Chart'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{logs.length} Recorded Checkpoints (Chronological)</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Download CSV of all logged vitals"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveMetric('bp');
                }}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
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
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
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
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
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
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeMetric === 'bloodGlucose' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Glucose
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveMetric('temperature');
                }}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeMetric === 'temperature' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Temp
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveMetric('weight');
                }}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeMetric === 'weight' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Weight
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveMetric('altitude');
                }}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeMetric === 'altitude' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Altitude
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Chart Container */}
        <div className="h-64 sm:h-72 w-full pt-2 min-h-[250px] min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            {activeMetric === 'bp' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[50, 180]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: any) => [`${value} mmHg`, name]}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload?.displayLabel || _label}
                />
                <ReferenceLine y={120} stroke="#3b82f6" strokeDasharray="3 3" label="Normal Systolic (120)" />
                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label="Normal Diastolic (80)" />
                <Line type="monotone" dataKey="systolicBP" name="Systolic BP" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="diastolicBP" name="Diastolic BP" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  domain={
                    activeMetric === 'spO2'
                      ? [75, 100]
                      : activeMetric === 'temperature'
                      ? [95, 105]
                      : ['auto', 'auto']
                  }
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => {
                    if (activeMetric === 'heartRate') return [`${value} bpm`, 'Pulse Rate'];
                    if (activeMetric === 'spO2') return [`${value}%`, 'Blood Oxygen'];
                    if (activeMetric === 'bloodGlucose') return [`${value} mg/dL`, 'Blood Glucose'];
                    if (activeMetric === 'temperature') return [`${value} °F`, 'Temperature'];
                    if (activeMetric === 'weight') return [`${value} kg`, 'Body Weight'];
                    if (activeMetric === 'altitude') return [`${value} m`, 'Altitude (Meters)'];
                    return [value, activeMetric];
                  }}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload?.displayLabel || _label}
                />
                {activeMetric === 'spO2' && (
                  <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" label="Target SpO2 (95%)" />
                )}
                {activeMetric === 'heartRate' && (
                  <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="3 3" label="Upper Normal (100 bpm)" />
                )}
                <Area
                  type="monotone"
                  dataKey={
                    activeMetric === 'weight'
                      ? 'weightKg'
                      : activeMetric === 'altitude'
                      ? 'altitudeMeters'
                      : activeMetric
                  }
                  name={
                    activeMetric === 'heartRate'
                      ? 'Pulse Rate (bpm)'
                      : activeMetric === 'spO2'
                      ? 'Blood Oxygen SpO2 (%)'
                      : activeMetric === 'bloodGlucose'
                      ? 'Blood Glucose (mg/dL)'
                      : activeMetric === 'temperature'
                      ? 'Temperature (°F)'
                      : activeMetric === 'weight'
                      ? 'Body Weight (kg)'
                      : 'Altitude (m)'
                  }
                  stroke={
                    activeMetric === 'spO2'
                      ? '#06b6d4'
                      : activeMetric === 'temperature'
                      ? '#f59e0b'
                      : activeMetric === 'bloodGlucose'
                      ? '#a855f7'
                      : activeMetric === 'weight'
                      ? '#10b981'
                      : activeMetric === 'altitude'
                      ? '#d97706'
                      : '#3b82f6'
                  }
                  fill={
                    activeMetric === 'spO2'
                      ? '#06b6d4'
                      : activeMetric === 'temperature'
                      ? '#f59e0b'
                      : activeMetric === 'bloodGlucose'
                      ? '#a855f7'
                      : activeMetric === 'weight'
                      ? '#10b981'
                      : activeMetric === 'altitude'
                      ? '#d97706'
                      : '#3b82f6'
                  }
                  fillOpacity={0.18}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Logged Records Table */}
      <div className="p-5 sm:p-6 rounded-3xl liquid-glass-card border border-white/60 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{language === 'np' ? 'हालैका भाइटल प्रविष्टिहरू' : 'Recent Vitals Checkpoint History'}</span>
          </h3>
          <span className="text-[10px] font-bold text-slate-500">{logs.length} Entries</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[300px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
              <tr>
                <th className="p-3 text-slate-500 font-bold">Date & Time</th>
                <th className="p-3 text-slate-500 font-bold">BP (mmHg)</th>
                <th className="p-3 text-slate-500 font-bold">Pulse (BPM)</th>
                <th className="p-3 text-slate-500 font-bold">SpO2 (%)</th>
                <th className="p-3 text-slate-500 font-bold">Glucose</th>
                <th className="p-3 text-slate-500 font-bold">Temp</th>
                <th className="p-3 text-slate-500 font-bold">Weight / Alt</th>
                <th className="p-3 text-slate-500 font-bold">Notes</th>
                <th className="p-3 text-slate-500 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {logs.slice().reverse().map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                  <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {l.dateLabel} <span className="text-slate-400 font-normal">({l.timeLabel})</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {l.systolicBP}/{l.diastolicBP}
                  </td>
                  <td className="p-3 font-mono text-blue-600 dark:text-blue-400 font-bold">{l.heartRate}</td>
                  <td className="p-3 font-mono text-cyan-600 dark:text-cyan-400 font-bold">{l.spO2}%</td>
                  <td className="p-3 font-mono text-purple-600 dark:text-purple-400 font-bold">{l.bloodGlucose}</td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">{l.temperature}°F</td>
                  <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                    {l.weightKg ? `${l.weightKg}kg` : '—'} {l.altitudeMeters ? `• ${l.altitudeMeters}m` : ''}
                  </td>
                  <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate">{l.notes || '—'}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenLogModal(l)}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="Edit checkpoint"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLog(l.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete checkpoint"
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
      </div>

      {/* Manual Entry Modal with Strict Validation & Live Biomarker Evaluation */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingLogId
                      ? language === 'np'
                        ? 'भाइटल सम्पादन गर्नुहोस्'
                        : 'Edit Vitals Checkpoint'
                      : language === 'np'
                      ? 'भाइटल प्रविष्ट गर्नुहोस्'
                      : 'Log Self-Measured Vitals'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {language === 'np'
                      ? 'क्लिनिकल दिशानिर्देश अनुसार मानहरू जाँच्नुहोस्'
                      : 'Validates according to AHA / NHRC clinical safety thresholds'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              {/* BP inputs */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Blood Pressure (mmHg)</span>
                  </span>
                  {liveModalEval.bp && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${liveModalEval.bp.badgeBg} ${liveModalEval.bp.badgeText}`}>
                      {language === 'np' ? liveModalEval.bp.labelNp : liveModalEval.bp.label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 font-semibold block mb-1">
                      Systolic (Upper) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={inputSystolic}
                      onChange={(e) => {
                        setInputSystolic(e.target.value);
                        if (formErrors.systolic) setFormErrors((prev) => ({ ...prev, systolic: '' }));
                      }}
                      placeholder="120"
                      className={`w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border ${
                        formErrors.systolic ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                      } text-sm font-bold text-slate-900 dark:text-white`}
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-semibold block mb-1">
                      Diastolic (Lower) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={inputDiastolic}
                      onChange={(e) => {
                        setInputDiastolic(e.target.value);
                        if (formErrors.diastolic) setFormErrors((prev) => ({ ...prev, diastolic: '' }));
                      }}
                      placeholder="80"
                      className={`w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border ${
                        formErrors.diastolic ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                      } text-sm font-bold text-slate-900 dark:text-white`}
                    />
                  </div>
                </div>
                {(formErrors.systolic || formErrors.diastolic) && (
                  <p className="text-[11px] text-red-500 font-medium">
                    {formErrors.systolic || formErrors.diastolic}
                  </p>
                )}
              </div>

              {/* Pulse & SpO2 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      <span>Pulse (BPM)</span>
                    </label>
                    {liveModalEval.hr && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${liveModalEval.hr.badgeBg} ${liveModalEval.hr.badgeText}`}>
                        {liveModalEval.hr.label}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={inputHR}
                    onChange={(e) => {
                      setInputHR(e.target.value);
                      if (formErrors.heartRate) setFormErrors((prev) => ({ ...prev, heartRate: '' }));
                    }}
                    placeholder="72"
                    className={`w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border ${
                      formErrors.heartRate ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    } text-sm font-bold text-slate-900 dark:text-white`}
                  />
                  {formErrors.heartRate && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{formErrors.heartRate}</p>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                      <span>SpO2 Oxygen (%)</span>
                    </label>
                    {liveModalEval.spO2 && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${liveModalEval.spO2.badgeBg} ${liveModalEval.spO2.badgeText}`}>
                        {liveModalEval.spO2.label}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={inputSpO2}
                    onChange={(e) => {
                      setInputSpO2(e.target.value);
                      if (formErrors.spO2) setFormErrors((prev) => ({ ...prev, spO2: '' }));
                    }}
                    placeholder="98"
                    className={`w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border ${
                      formErrors.spO2 ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    } text-sm font-bold text-slate-900 dark:text-white`}
                  />
                  {formErrors.spO2 && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{formErrors.spO2}</p>
                  )}
                </div>
              </div>

              {/* Glucose & Temp */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-purple-500" />
                      <span>Glucose (mg/dL)</span>
                    </label>
                    {liveModalEval.glu && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${liveModalEval.glu.badgeBg} ${liveModalEval.glu.badgeText}`}>
                        {liveModalEval.glu.label}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={inputGlucose}
                    onChange={(e) => {
                      setInputGlucose(e.target.value);
                      if (formErrors.glucose) setFormErrors((prev) => ({ ...prev, glucose: '' }));
                    }}
                    placeholder="95"
                    className={`w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border ${
                      formErrors.glucose ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    } text-sm font-bold text-slate-900 dark:text-white`}
                  />
                  {formErrors.glucose && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{formErrors.glucose}</p>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                      <span>Temp (°F)</span>
                    </label>
                    {liveModalEval.temp && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${liveModalEval.temp.badgeBg} ${liveModalEval.temp.badgeText}`}>
                        {liveModalEval.temp.label}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={inputTemp}
                    onChange={(e) => {
                      setInputTemp(e.target.value);
                      if (formErrors.temperature) setFormErrors((prev) => ({ ...prev, temperature: '' }));
                    }}
                    placeholder="98.4"
                    className={`w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border ${
                      formErrors.temperature ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    } text-sm font-bold text-slate-900 dark:text-white`}
                  />
                  {formErrors.temperature && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{formErrors.temperature}</p>
                  )}
                </div>
              </div>

              {/* Weight & Altitude */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={inputWeight}
                    onChange={(e) => {
                      setInputWeight(e.target.value);
                      if (formErrors.weight) setFormErrors((prev) => ({ ...prev, weight: '' }));
                    }}
                    placeholder="68"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  {formErrors.weight && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{formErrors.weight}</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Altitude (Meters)</label>
                  <input
                    type="number"
                    value={inputAltitude}
                    onChange={(e) => {
                      setInputAltitude(e.target.value);
                      if (formErrors.altitude) setFormErrors((prev) => ({ ...prev, altitude: '' }));
                    }}
                    placeholder="1400"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  {formErrors.altitude && (
                    <p className="text-[10px] text-red-500 font-medium mt-0.5">{formErrors.altitude}</p>
                  )}
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

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingLogId ? 'Update Checkpoint' : 'Save to Vitals Log'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'np' ? 'नयाँ स्वास्थ्य लक्ष्य थप्नुहोस्' : 'Add Custom Health / Rx Goal'}
                </h3>
              </div>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-500 font-semibold block mb-1">
                  Goal Title / Task <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Take Metformin 500mg after dinner"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Category</label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="medication">Medication / Rx</option>
                    <option value="vitals">Vitals Measurement</option>
                    <option value="lifestyle">Lifestyle & Hydration</option>
                    <option value="altitude">Altitude & Acclimatization</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Target Time / Frequency</label>
                  <input
                    type="text"
                    value={newGoalTime}
                    onChange={(e) => setNewGoalTime(e.target.value)}
                    placeholder="e.g. 08:00 PM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Daily Checklist</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
