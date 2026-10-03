import React, { useState, useMemo } from 'react';
import {
  Heart,
  Activity,
  Wind,
  Droplets,
  Thermometer,
  Calendar,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Info,
  Clock,
  ChevronRight,
  ShieldCheck,
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

export interface VitalTelemetryPoint {
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
  altitudeMeters?: number; // Nepal elevation context
  notes?: string;
}

interface VitalsTelemetryTrackerProps {
  currentUser: User | null;
  language: Language;
  onOpenConsultation?: () => void;
}

// Generate realistic longitudinal vitals data tailored for Nepal elevation profile
const generateInitialTelemetry = (userId: string): VitalTelemetryPoint[] => {
  const points: VitalTelemetryPoint[] = [];
  const now = new Date();
  
  // 30 days of data points
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const dateLabel = `${month} ${day}`;
    
    // Natural physiological fluctuations
    const baseHR = 72;
    const hrVariation = Math.round(Math.sin(i * 0.5) * 6 + (i % 3 === 0 ? 4 : -2));
    const heartRate = Math.min(108, Math.max(58, baseHR + hrVariation));

    const systolicBP = Math.round(118 + Math.cos(i * 0.4) * 8 + (i === 12 ? 14 : 0));
    const diastolicBP = Math.round(78 + Math.cos(i * 0.4) * 5 + (i === 12 ? 8 : 0));

    // Kathmandu / Alpine SpO2 (altitude effect: typically 96-98% in Kathmandu 1400m, dips to 91% on trek days)
    const isTrekDay = i === 18 || i === 19;
    const spO2 = isTrekDay ? 91 : Math.round(97 + (Math.sin(i) * 1.5));

    const bloodGlucose = Math.round(94 + Math.sin(i * 0.8) * 12 + (i % 4 === 0 ? 8 : 0));
    const temperature = Number((98.4 + Math.sin(i * 0.3) * 0.5).toFixed(1));

    points.push({
      id: `vital_${userId}_${30 - i}`,
      timestamp: d.toISOString(),
      dateLabel,
      timeLabel: '08:30 AM',
      heartRate,
      systolicBP,
      diastolicBP,
      spO2: Math.min(100, Math.max(86, spO2)),
      bloodGlucose,
      temperature,
      altitudeMeters: isTrekDay ? 3440 : 1400,
      notes: isTrekDay ? 'Namche Bazaar acclimatization check' : 'Morning resting routine'
    });
  }

  return points;
};

export const VitalsTelemetryTracker: React.FC<VitalsTelemetryTrackerProps> = ({
  currentUser,
  language,
  onOpenConsultation
}) => {
  const userId = currentUser?.id || 'guest_patient';
  const storageKey = `xenon_vitals_telemetry_${userId}`;

  const [telemetryData, setTelemetryData] = useState<VitalTelemetryPoint[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load vitals telemetry', e);
    }
    const initial = generateInitialTelemetry(userId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(initial));
    } catch (e) {
      console.warn(e);
    }
    return initial;
  });

  const [activeMetric, setActiveMetric] = useState<'heartRate' | 'bloodPressure' | 'spO2' | 'bloodGlucose' | 'temperature'>('heartRate');
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | 'all'>('14d');
  const [showLogModal, setShowLogModal] = useState(false);

  // New reading form state
  const [formHR, setFormHR] = useState('74');
  const [formSysBP, setFormSysBP] = useState('120');
  const [formDiaBP, setFormDiaBP] = useState('80');
  const [formSpO2, setFormSpO2] = useState('98');
  const [formGlucose, setFormGlucose] = useState('95');
  const [formTemp, setFormTemp] = useState('98.6');
  const [formAltitude, setFormAltitude] = useState('1400');
  const [formNotes, setFormNotes] = useState('');
  const [logSuccessMsg, setLogSuccessMsg] = useState('');

  // Filter data by time range
  const filteredData = useMemo(() => {
    if (timeRange === '7d') return telemetryData.slice(-7);
    if (timeRange === '14d') return telemetryData.slice(-14);
    if (timeRange === '30d') return telemetryData.slice(-30);
    return telemetryData;
  }, [telemetryData, timeRange]);

  // Metric metadata configuration
  const metricConfig = {
    heartRate: {
      label: language === 'np' ? 'मुटुको धड्कन (Heart Rate)' : 'Heart Rate',
      unit: 'BPM',
      icon: Heart,
      color: '#E11D48', // Rose/Crimson
      gradientId: 'hrGradient',
      normalRange: '60 - 100 BPM',
      normalMin: 60,
      normalMax: 100,
      description: language === 'np'
        ? 'आराम अवस्थाको सामान्य धड्कन प्रति मिनेट ६०-१०० हुन्छ।'
        : 'Normal adult resting heart rate ranges from 60 to 100 beats per minute.'
    },
    bloodPressure: {
      label: language === 'np' ? 'रक्तचाप (Blood Pressure)' : 'Blood Pressure (Systolic / Diastolic)',
      unit: 'mmHg',
      icon: Activity,
      color: '#2563EB', // Blue
      gradientId: 'bpGradient',
      normalRange: '< 120/80 mmHg',
      normalMin: 90,
      normalMax: 120,
      description: language === 'np'
        ? 'सामान्य रक्तचाप १२०/८० mmHg भन्दा कम मानिन्छ।'
        : 'Optimal blood pressure baseline is under 120 systolic and 80 diastolic mmHg.'
    },
    spO2: {
      label: language === 'np' ? 'अक्सिजन स्तर (Blood Oxygen SpO2)' : 'Blood Oxygen (SpO2)',
      unit: '%',
      icon: Wind,
      color: '#0D9488', // Teal
      gradientId: 'spo2Gradient',
      normalRange: '95 - 100% (High Altitude > 88%)',
      normalMin: 95,
      normalMax: 100,
      description: language === 'np'
        ? 'काठमाडौं उपत्यका र हिमाली भेगमा ९०% भन्दा माथिको अक्सिजन सुरक्षित मानिन्छ।'
        : 'In high-altitude Nepal (1,400m - 4,000m), SpO2 > 90% is clinically required to rule out HAPE/hypoxia.'
    },
    bloodGlucose: {
      label: language === 'np' ? 'रगतमा ग्लुकोज (Blood Glucose)' : 'Blood Glucose (Fasting / Post)',
      unit: 'mg/dL',
      icon: Droplets,
      color: '#D97706', // Amber
      gradientId: 'glucoseGradient',
      normalRange: '70 - 99 mg/dL (Fasting)',
      normalMin: 70,
      normalMax: 99,
      description: language === 'np'
        ? 'खाली पेटको सामान्य सुगर ७०-९९ mg/dL हुन्छ।'
        : 'Normal fasting plasma glucose should be between 70 and 99 mg/dL.'
    },
    temperature: {
      label: language === 'np' ? 'शरीरको तापक्रम (Body Temperature)' : 'Body Temperature',
      unit: '°F',
      icon: Thermometer,
      color: '#7C3AED', // Purple
      gradientId: 'tempGradient',
      normalRange: '97.8 - 99.1 °F',
      normalMin: 97.8,
      normalMax: 99.1,
      description: language === 'np'
        ? 'सामान्य तापक्रम ९८.६°F हुन्छ। १००.४°F भन्दा माथि ज्वरो मानिन्छ।'
        : 'Normal body temperature is ~98.6°F. Values above 100.4°F indicate fever.'
    }
  };

  // Compute statistical summaries with tabular values
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { avg: 0, min: 0, max: 0, latest: 0, status: 'NO_DATA', statusColor: 'text-slate-500' };
    }

    if (activeMetric === 'bloodPressure') {
      const sysValues = filteredData.map((d) => d.systolicBP);
      const diaValues = filteredData.map((d) => d.diastolicBP);
      const avgSys = Math.round(sysValues.reduce((a, b) => a + b, 0) / sysValues.length);
      const avgDia = Math.round(diaValues.reduce((a, b) => a + b, 0) / diaValues.length);
      const latestSys = filteredData[filteredData.length - 1].systolicBP;
      const latestDia = filteredData[filteredData.length - 1].diastolicBP;

      let status = 'OPTIMAL';
      let statusColor = 'text-emerald-600 dark:text-emerald-400';
      if (latestSys >= 140 || latestDia >= 90) {
        status = 'STAGE 2 HYPERTENSION';
        statusColor = 'text-red-600 dark:text-red-400';
      } else if (latestSys >= 130 || latestDia >= 80) {
        status = 'STAGE 1 ELEVATED';
        statusColor = 'text-amber-600 dark:text-amber-400';
      }

      return {
        avg: `${avgSys}/${avgDia}`,
        min: `${Math.min(...sysValues)}/${Math.min(...diaValues)}`,
        max: `${Math.max(...sysValues)}/${Math.max(...diaValues)}`,
        latest: `${latestSys}/${latestDia}`,
        status,
        statusColor
      };
    }

    const values = filteredData.map((d) => d[activeMetric] as number);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = Number((sum / values.length).toFixed(1));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[values.length - 1];

    let status = 'STABLE';
    let statusColor = 'text-emerald-600 dark:text-emerald-400';

    if (activeMetric === 'heartRate') {
      if (latest > 100) {
        status = 'TACHYCARDIA ALERT';
        statusColor = 'text-red-600 dark:text-red-400';
      } else if (latest < 60) {
        status = 'BRADYCARDIA';
        statusColor = 'text-amber-600 dark:text-amber-400';
      } else {
        status = 'NORMAL SINUS';
      }
    } else if (activeMetric === 'spO2') {
      if (latest < 88) {
        status = 'SEVERE HYPOXIA ALERT';
        statusColor = 'text-red-600 dark:text-red-400';
      } else if (latest < 92) {
        status = 'ALTITUDE CAUTION';
        statusColor = 'text-amber-600 dark:text-amber-400';
      } else {
        status = 'OPTIMAL OXYGENATION';
      }
    } else if (activeMetric === 'bloodGlucose') {
      if (latest > 125) {
        status = 'ELEVATED (HYPERGLYCEMIA)';
        statusColor = 'text-red-600 dark:text-red-400';
      } else if (latest < 70) {
        status = 'LOW (HYPOGLYCEMIA)';
        statusColor = 'text-amber-600 dark:text-amber-400';
      } else {
        status = 'NORMAL FASTING';
      }
    } else if (activeMetric === 'temperature') {
      if (latest >= 100.4) {
        status = 'PYREXIA / FEVER';
        statusColor = 'text-red-600 dark:text-red-400';
      } else {
        status = 'AFEBRILE (NORMAL)';
      }
    }

    return { avg, min, max, latest, status, statusColor };
  }, [filteredData, activeMetric]);

  // Handle logging new vital reading
  const handleSaveVitalLog = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const day = now.getDate();
    const hours = now.getHours();
    const mins = now.getMinutes();
    const timeFormatted = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    const newPoint: VitalTelemetryPoint = {
      id: `vital_${userId}_${Date.now()}`,
      timestamp: now.toISOString(),
      dateLabel: `${month} ${day}`,
      timeLabel: timeFormatted,
      heartRate: Number(formHR) || 72,
      systolicBP: Number(formSysBP) || 120,
      diastolicBP: Number(formDiaBP) || 80,
      spO2: Number(formSpO2) || 98,
      bloodGlucose: Number(formGlucose) || 95,
      temperature: Number(formTemp) || 98.6,
      altitudeMeters: Number(formAltitude) || 1400,
      notes: formNotes.trim() || 'Manual clinical reading'
    };

    const updated = [...telemetryData, newPoint];
    setTelemetryData(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }

    setLogSuccessMsg(language === 'np' ? 'भाइटल रिडिङ सुरक्षित भयो!' : 'Vital telemetry point logged successfully!');
    setTimeout(() => {
      setLogSuccessMsg('');
      setShowLogModal(false);
    }, 1200);
  };

  // Direct CSV Export
  const handleExportCSV = () => {
    const headers = 'Timestamp,Date,Time,HeartRate_BPM,SystolicBP_mmHg,DiastolicBP_mmHg,SpO2_Percent,BloodGlucose_mgdL,Temperature_F,Altitude_Meters,Notes\n';
    const rows = telemetryData.map((d) =>
      `"${d.timestamp}","${d.dateLabel}","${d.timeLabel}",${d.heartRate},${d.systolicBP},${d.diastolicBP},${d.spO2},${d.bloodGlucose},${d.temperature},${d.altitudeMeters || 1400},"${(d.notes || '').replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `xenon_vitals_telemetry_${userId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentConfig = metricConfig[activeMetric];

  return (
    <div className="space-y-6 w-full">
      {/* SECTION HEADER: Clean Unboxed Medical Metadata & Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{language === 'np' ? 'क्लिनिकल टेलिमेट्री' : 'Clinical Telemetry'}</span>
            <span aria-hidden="true">·</span>
            <span>{language === 'np' ? 'निरन्तर भाइटल निगरानी' : 'Continuous Vitals Monitor'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Live Real-Time</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            {language === 'np' ? 'भाइटल टेलिमेट्री तथा मुटुको धड्कन विश्लेषण' : 'Vitals Telemetry & Cardiovascular Tracker'}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'np' ? 'नयाँ रिडिङ थप्नुहोस्' : 'Log Vital Reading'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Export telemetry data as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* METRIC SELECTOR TABS: Crisp Segmented Clinical Controls */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 sm:grid sm:grid-cols-5">
        {(Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map((key) => {
          const cfg = metricConfig[key];
          const Icon = cfg.icon;
          const isActive = activeMetric === key;
          return (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer text-left shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? cfg.color : undefined }} />
              <span className="truncate">{cfg.label.split('(')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* STATISTICAL SUMMARY CARDS: High-contrast Tabular Numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {language === 'np' ? 'पछिल्लो रिडिङ' : 'Latest Reading'}
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.latest} <span className="text-xs font-normal text-slate-500">{currentConfig.unit}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold">
            <span className={stats.statusColor}>{stats.status}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {language === 'np' ? 'औसत मान' : 'Telemetry Average'} ({timeRange})
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.avg} <span className="text-xs font-normal text-slate-500">{currentConfig.unit}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {filteredData.length} records analyzed
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {language === 'np' ? 'न्यूनतम / अधिकतम' : 'Range (Min - Max)'}
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.min} – {stats.max} <span className="text-xs font-normal text-slate-500">{currentConfig.unit}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Target: {currentConfig.normalRange}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {language === 'np' ? 'भौगोलिक उचाइ प्रभाव' : 'Nepal Altitude Context'}
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 tabular-nums">
            1,400m <span className="text-xs font-normal text-slate-500">Kathmandu Val.</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>🏔️</span>
            <span>SpO2 &gt; 90% target baseline</span>
          </div>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION CONTAINER */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <currentConfig.icon className="w-5 h-5" style={{ color: currentConfig.color }} />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {currentConfig.label} — Longitudinal Chart
            </h3>
          </div>

          {/* Time range switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto">
            {(['7d', '14d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  timeRange === r
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Render */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {activeMetric === 'bloodPressure' ? (
              <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey="dateLabel"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  domain={[50, 180]}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as VitalTelemetryPoint;
                      return (
                        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <p className="font-bold text-slate-300">{data.dateLabel} ({data.timeLabel})</p>
                          <p className="text-blue-400 font-bold tabular-nums">Systolic: {data.systolicBP} mmHg</p>
                          <p className="text-indigo-300 font-bold tabular-nums">Diastolic: {data.diastolicBP} mmHg</p>
                          {data.notes && <p className="text-slate-400 text-[11px] italic">{data.notes}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={120} stroke="#2563eb" strokeDasharray="4 4" label={{ value: 'Systolic Target (120)', position: 'insideTopRight', fill: '#2563eb', fontSize: 10 }} />
                <ReferenceLine y={80} stroke="#4f46e5" strokeDasharray="4 4" label={{ value: 'Diastolic Target (80)', position: 'insideBottomRight', fill: '#4f46e5', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="systolicBP"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="diastolicBP"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#6366f1' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={currentConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey="dateLabel"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  domain={
                    activeMetric === 'spO2'
                      ? [80, 100]
                      : activeMetric === 'temperature'
                      ? [96, 104]
                      : activeMetric === 'bloodGlucose'
                      ? [60, 200]
                      : [40, 140]
                  }
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as VitalTelemetryPoint;
                      const val = data[activeMetric] as number;
                      return (
                        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <p className="font-bold text-slate-300">{data.dateLabel} · {data.timeLabel}</p>
                          <p className="font-bold text-white tabular-nums" style={{ color: currentConfig.color }}>
                            {currentConfig.label.split('(')[0]}: {val} {currentConfig.unit}
                          </p>
                          {data.altitudeMeters && (
                            <p className="text-slate-400 text-[11px]">Elevation: {data.altitudeMeters}m</p>
                          )}
                          {data.notes && <p className="text-slate-400 text-[11px] italic">{data.notes}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {activeMetric === 'heartRate' && (
                  <>
                    <ReferenceLine y={100} stroke="#e11d48" strokeDasharray="3 3" label={{ value: 'Tachycardia (>100)', position: 'insideTopRight', fill: '#e11d48', fontSize: 10 }} />
                    <ReferenceLine y={60} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'Bradycardia (<60)', position: 'insideBottomRight', fill: '#d97706', fontSize: 10 }} />
                  </>
                )}
                {activeMetric === 'spO2' && (
                  <>
                    <ReferenceLine y={95} stroke="#0d9488" strokeDasharray="3 3" label={{ value: 'Optimal (95%)', position: 'insideTopRight', fill: '#0d9488', fontSize: 10 }} />
                    <ReferenceLine y={90} stroke="#e11d48" strokeDasharray="3 3" label={{ value: 'Hypoxia Threshold (90%)', position: 'insideBottomRight', fill: '#e11d48', fontSize: 10 }} />
                  </>
                )}
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  stroke={currentConfig.color}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#${currentConfig.gradientId})`}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Clinical Note Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{currentConfig.description}</span>
          </div>
          {onOpenConsultation && (
            <button
              onClick={onOpenConsultation}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0 ml-2"
            >
              {language === 'np' ? 'डाक्टरसँग समीक्षा गर्नुहोस् →' : 'Review with Specialist →'}
            </button>
          )}
        </div>
      </div>

      {/* LOG VITAL READING MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {language === 'np' ? 'नयाँ भाइटल रिडिङ दर्ता गर्नुहोस्' : 'Log Clinical Vital Reading'}
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVitalLog} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    value={formHR}
                    onChange={(e) => setFormHR(e.target.value)}
                    required
                    min="30"
                    max="220"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    SpO2 Blood Oxygen (%)
                  </label>
                  <input
                    type="number"
                    value={formSpO2}
                    onChange={(e) => setFormSpO2(e.target.value)}
                    required
                    min="50"
                    max="100"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Systolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    value={formSysBP}
                    onChange={(e) => setFormSysBP(e.target.value)}
                    required
                    min="60"
                    max="240"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Diastolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    value={formDiaBP}
                    onChange={(e) => setFormDiaBP(e.target.value)}
                    required
                    min="40"
                    max="140"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Blood Glucose (mg/dL)
                  </label>
                  <input
                    type="number"
                    value={formGlucose}
                    onChange={(e) => setFormGlucose(e.target.value)}
                    required
                    min="40"
                    max="500"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Body Temp (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formTemp}
                    onChange={(e) => setFormTemp(e.target.value)}
                    required
                    min="94"
                    max="108"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Elevation / Altitude (Meters)
                </label>
                <input
                  type="number"
                  value={formAltitude}
                  onChange={(e) => setFormAltitude(e.target.value)}
                  placeholder="1400 (Kathmandu)"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Notes / Context
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Resting morning reading after 5 min sit down"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {logSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{logSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
