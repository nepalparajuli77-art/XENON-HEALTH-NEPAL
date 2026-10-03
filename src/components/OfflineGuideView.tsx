import React, { useState, useEffect } from 'react';
import {
  Mountain,
  AlertTriangle,
  HeartPulse,
  Pill,
  ShieldCheck,
  CheckCircle2,
  Download,
  Phone,
  Flame,
  Activity,
  Compass,
  FileCheck,
  HelpCircle
} from 'lucide-react';
import { Language } from '../types';
import { t } from '../data/mockData';

interface OfflineGuideViewProps {
  language: Language;
}

export const OfflineGuideView: React.FC<OfflineGuideViewProps> = ({ language }) => {
  const [activeSection, setActiveSection] = useState<'ams' | 'snakebite' | 'meds' | 'rescue'>('ams');
  const [isCachedOffline, setIsCachedOffline] = useState(false);
  const [lakeLouiseScore, setLakeLouiseScore] = useState({
    headache: 0,
    gi: 0,
    fatigue: 0,
    dizziness: 0
  });

  useEffect(() => {
    try {
      const cached = localStorage.getItem('telemed_offline_guide_cached');
      if (cached === 'true') {
        setIsCachedOffline(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const totalAmsScore =
    lakeLouiseScore.headache +
    lakeLouiseScore.gi +
    lakeLouiseScore.fatigue +
    lakeLouiseScore.dizziness;

  const getAmsDiagnosis = () => {
    if (lakeLouiseScore.headache === 0 && totalAmsScore < 3) {
      return {
        severity: 'No AMS / Normal',
        color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
        advice: 'Normal altitude adaptation. Continue gradual ascent (max 300-500m elevation gain per day above 3,000m) and maintain hydration (3-4L water).'
      };
    }
    if (totalAmsScore >= 3 && totalAmsScore <= 5) {
      return {
        severity: 'Mild to Moderate AMS (Acute Mountain Sickness)',
        color: 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
        advice: 'STOP ASCENT IMMEDIATELY. Rest at current altitude. Take Acetazolamide (Diamox) 125-250mg BID and Paracetamol for headache. Do NOT ascend until symptoms fully resolve.'
      };
    }
    return {
      severity: 'Severe AMS / High Risk of HAPE or HACE',
      color: 'text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800',
      advice: 'CRITICAL EMERGENCY: Immediate descent of at least 500-1000m is mandatory! Administer high-flow supplemental oxygen or use Gamow hyperbaric bag. Call Nepal Army Air Rescue (01-4246950) immediately.'
    };
  };

  const handleCacheOffline = () => {
    try {
      localStorage.setItem('telemed_offline_guide_cached', 'true');
      setIsCachedOffline(true);
    } catch {
      // ignore
    }
  };

  const amsDiagnosis = getAmsDiagnosis();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-[24px] bg-gradient-to-r from-red-600 via-slate-900 to-blue-800 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider">
                🏔️ Remote Nepal Medical Protocol
              </span>
              {isCachedOffline && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Cached for 100% Offline Access
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              {language === 'np' ? 'अफलाइन आपतकालीन तथा हिमाली प्राथमिक उपचार गाइड' : 'Offline Mountain First-Aid & Emergency Pocket Guide'}
            </h1>
            <p className="text-xs text-white/80 max-w-2xl mt-1 leading-relaxed">
              Standard clinical first-aid protocols for remote trekking corridors (Everest, Annapurna, Manaslu), snakebite management in the Terai, and offline vital medicine dosages.
            </p>
          </div>

          <button
            onClick={handleCacheOffline}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer shrink-0 ${
              isCachedOffline
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{isCachedOffline ? 'Offline Cache Active' : 'Save Offline Cache'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#E2E8F0] dark:bg-[#1E293B] border border-black/[0.06] dark:border-white/[0.06]">
        <button
          onClick={() => setActiveSection('ams')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'ams'
              ? 'bg-gradient-to-r from-red-600 to-blue-700 text-white shadow-sm'
              : 'text-black dark:text-white opacity-75 hover:opacity-100'
          }`}
        >
          <Mountain className="w-4 h-4" />
          <span>Altitude Sickness (AMS/HAPE)</span>
        </button>

        <button
          onClick={() => setActiveSection('snakebite')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'snakebite'
              ? 'bg-gradient-to-r from-red-600 to-blue-700 text-white shadow-sm'
              : 'text-black dark:text-white opacity-75 hover:opacity-100'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Snakebite First-Aid (Terai)</span>
        </button>

        <button
          onClick={() => setActiveSection('meds')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'meds'
              ? 'bg-gradient-to-r from-red-600 to-blue-700 text-white shadow-sm'
              : 'text-black dark:text-white opacity-75 hover:opacity-100'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Essential Medicine Dosages</span>
        </button>

        <button
          onClick={() => setActiveSection('rescue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'rescue'
              ? 'bg-gradient-to-r from-red-600 to-blue-700 text-white shadow-sm'
              : 'text-black dark:text-white opacity-75 hover:opacity-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Helicopter Medevac Checklist</span>
        </button>
      </div>

      {/* Content Section 1: Altitude Sickness (AMS / HAPE / HACE) */}
      {activeSection === 'ams' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Lake Louise Scoring Tool */}
          <div className="lg:col-span-6 rounded-[22px] bg-white dark:bg-[#0F172A] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="text-sm font-black text-black dark:text-white">
                  Lake Louise AMS Assessment Score
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-black dark:text-white text-xs font-black">
                Score: {totalAmsScore} / 12
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Question 1: Headache */}
              <div>
                <label className="block font-bold text-black dark:text-white mb-1">
                  1. Headache Severity (आवश्यक लक्षण):
                </label>
                <select
                  value={lakeLouiseScore.headache}
                  onChange={(e) => setLakeLouiseScore({ ...lakeLouiseScore, headache: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium"
                >
                  <option value={0}>0 - None (टाउको दुखेको छैन)</option>
                  <option value={1}>1 - Mild (हल्का टाउको दुखाइ)</option>
                  <option value={2}>2 - Moderate (मध्यम टाउको दुखाइ)</option>
                  <option value={3}>3 - Severe / Incapacitating (अत्यधिक असह्य दुखाइ)</option>
                </select>
              </div>

              {/* Question 2: GI */}
              <div>
                <label className="block font-bold text-black dark:text-white mb-1">
                  2. Gastrointestinal (वाकवाकी / बान्ता):
                </label>
                <select
                  value={lakeLouiseScore.gi}
                  onChange={(e) => setLakeLouiseScore({ ...lakeLouiseScore, gi: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium"
                >
                  <option value={0}>0 - Good appetite (सामान्य भोक लागेको)</option>
                  <option value={1}>1 - Poor appetite or nausea (भोक नलाग्ने वा वाकवाकी)</option>
                  <option value={2}>2 - Moderate nausea or vomiting (वाकवाकी वा एक पटक बान्ता)</option>
                  <option value={3}>3 - Severe / Persistent vomiting (लगातार बान्ता)</option>
                </select>
              </div>

              {/* Question 3: Fatigue / Weakness */}
              <div>
                <label className="block font-bold text-black dark:text-white mb-1">
                  3. Fatigue / Weakness (अत्यधिक थकान):
                </label>
                <select
                  value={lakeLouiseScore.fatigue}
                  onChange={(e) => setLakeLouiseScore({ ...lakeLouiseScore, fatigue: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium"
                >
                  <option value={0}>0 - Not tired (सामान्य ऊर्जा)</option>
                  <option value={1}>1 - Mild fatigue (हल्का थकान)</option>
                  <option value={2}>2 - Moderate weakness (मध्यम कमजोरी, हिँड्न गाह्रो)</option>
                  <option value={3}>3 - Severe exhaustion (ओछ्यानबाट उठ्न नसक्ने)</option>
                </select>
              </div>

              {/* Question 4: Dizziness */}
              <div>
                <label className="block font-bold text-black dark:text-white mb-1">
                  4. Dizziness / Lightheadedness (रिंगटा):
                </label>
                <select
                  value={lakeLouiseScore.dizziness}
                  onChange={(e) => setLakeLouiseScore({ ...lakeLouiseScore, dizziness: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium"
                >
                  <option value={0}>0 - None (रिंगटा लागेको छैन)</option>
                  <option value={1}>1 - Mild dizziness (हल्का रिंगटा)</option>
                  <option value={2}>2 - Moderate (मध्यम चक्कर)</option>
                  <option value={3}>3 - Severe / Loss of balance (सन्तुलन गुम्नु)</option>
                </select>
              </div>
            </div>

            {/* Score Output Diagnostic Card */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${amsDiagnosis.color}`}>
              <div className="flex items-center gap-2 font-black text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{amsDiagnosis.severity}</span>
              </div>
              <p className="font-medium leading-relaxed">{amsDiagnosis.advice}</p>
            </div>
          </div>

          {/* Clinical Protocols & Golden Rules */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-5 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3">
              <h3 className="text-sm font-black text-black dark:text-white flex items-center gap-2">
                <span>🏔️</span> The 3 Golden Rules of High Altitude in Nepal
              </h3>
              <ul className="space-y-2 text-xs text-black dark:text-white font-medium">
                <li className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200">
                  <b>Rule 1:</b> Any sickness at altitude is altitude sickness until proven otherwise.
                </li>
                <li className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
                  <b>Rule 2:</b> Never ascend with active symptoms of AMS. Wait at least 24 hours at the same elevation.
                </li>
                <li className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200">
                  <b>Rule 3:</b> If symptoms worsen or if ataxia (loss of coordination) develops, <b>DESCEND IMMEDIATELY</b>.
                </li>
              </ul>
            </div>

            <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-5 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-3 text-xs">
              <h4 className="font-black text-black dark:text-white">Diamox (Acetazolamide) Clinical Dosing:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-black/5 dark:border-white/5">
                  <p className="font-bold text-black dark:text-white">Prophylaxis (Prevention)</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">125 mg orally twice daily (BID), start 24h prior to ascent above 3,000m.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-black/5 dark:border-white/5">
                  <p className="font-bold text-black dark:text-white">Treatment (Active AMS)</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">250 mg orally twice daily (BID) alongside immediate rest / descent.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Section 2: Snakebite First-Aid */}
      {activeSection === 'snakebite' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-4">
            <h3 className="text-sm font-black text-black dark:text-white flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">✓</span> DOs (गर्नुपर्ने कुराहरू)
            </h3>
            <ul className="space-y-2.5 text-xs text-black dark:text-white font-medium">
              <li className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b>Immobilize the Bitten Limb:</b> Apply a loose splint and keep the affected limb strictly still, below heart level, exactly like managing a bone fracture.</span>
              </li>
              <li className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b>Reassure the Victim:</b> Keep the patient calm. Panic and physical exertion accelerate venom dispersion through the lymphatic system.</span>
              </li>
              <li className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b>Rapid Transport:</b> Rush immediately to the nearest health facility equipped with Anti-Snake Venom (ASV) via motorcycle or ambulance.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-4">
            <h3 className="text-sm font-black text-red-600 dark:text-red-400 flex items-center gap-2">
              <span>✕</span> DON'Ts (गर्न नहुने कुराहरू - Strict Warnings)
            </h3>
            <ul className="space-y-2.5 text-xs text-black dark:text-white font-medium">
              <li className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span><b>DO NOT Apply Tight Tourniquets:</b> Tight ropes/strings cause ischemia, gangrene, and limb amputation.</span>
              </li>
              <li className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span><b>DO NOT Cut or Suck the Wound:</b> Cutting introduces severe infection and does not extract venom.</span>
              </li>
              <li className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span><b>DO NOT Waste Time with Traditional Healers (धामी/झाँक्री):</b> Anti-Snake Venom (ASV) is the only proven antidote. Call 1115 for ASV center locations.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Content Section 3: Essential Medicine Dosages */}
      {activeSection === 'meds' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'Jeevan Jal (ORS - Oral Rehydration Salts)',
              use: 'Dehydration, Diarrhea & Heat Exhaustion',
              dose: '1 packet dissolved in exactly 1 Liter of clean boiled/filtered water. Sip frequently.',
              caution: 'Do not mix with milk or juice. Use within 24 hours of mixing.'
            },
            {
              name: 'Paracetamol (500mg / 650mg)',
              use: 'Fever, High-Altitude Headache & Body Ache',
              dose: 'Adults: 500mg - 1000mg every 6 hours as needed. Max 4,000mg / 24 hours.',
              caution: 'Avoid alcohol. Do not exceed max dose to protect liver.'
            },
            {
              name: 'Acetazolamide (Diamox 250mg)',
              use: 'Acute Mountain Sickness (AMS) Prevention & Treatment',
              dose: 'Prevention: 125mg BD. Treatment: 250mg BD.',
              caution: 'Sulfa allergy contraindication. Causes harmless tingling in fingers/toes.'
            },
            {
              name: 'Cetirizine (10mg)',
              use: 'Allergic Reactions, Pollen Rhinitis, Dust Exposure',
              dose: 'Adults: 10mg once daily at bedtime.',
              caution: 'May cause mild drowsiness.'
            },
            {
              name: 'Azithromycin (500mg)',
              use: "Traveler's Bacterial Diarrhea & Upper Respiratory Infection",
              dose: '500mg once daily for 3 consecutive days.',
              caution: 'Complete full 3-day course. Take 1 hour before or 2 hours after meals.'
            },
            {
              name: 'Ibuprofen (400mg)',
              use: 'Tendonitis, Knee Pain & Acute Musculoskeletal Sprain',
              dose: '400mg every 8 hours after food.',
              caution: 'Always take with meals to prevent stomach acidity.'
            }
          ].map((med, idx) => (
            <div
              key={idx}
              className="p-5 rounded-[22px] bg-white dark:bg-[#0F172A] border border-black/[0.08] dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                    💊
                  </div>
                  <h4 className="font-extrabold text-sm text-black dark:text-white leading-tight">
                    {med.name}
                  </h4>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-2">
                  Indication: {med.use}
                </p>
                <p className="text-xs text-black dark:text-white font-medium mt-1.5 leading-relaxed">
                  <b>Dosage:</b> {med.dose}
                </p>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900 font-medium">
                ⚠️ <b>Caution:</b> {med.caution}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Content Section 4: Helicopter Medevac Checklist */}
      {activeSection === 'rescue' && (
        <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚁</span>
              <h3 className="text-sm font-black text-black dark:text-white">
                Nepal High-Altitude Emergency Helicopter Medevac Checklist
              </h3>
            </div>
            <a
              href="tel:+977014246950"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600 text-white font-bold text-xs shadow-sm hover:bg-red-700 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Call Army Air Rescue
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-black/5 dark:border-white/5 space-y-2">
              <h4 className="font-extrabold text-black dark:text-white">1. Crucial Dispatch Information to Relay:</h4>
              <ul className="list-disc list-inside space-y-1 text-black dark:text-white font-medium opacity-90">
                <li>Exact GPS Coordinates (Latitude / Longitude from smartphone).</li>
                <li>Current Village / Pass / Trekking Camp name & elevation (meters).</li>
                <li>Patient condition: conscious/unconscious, SpO2 reading, heart rate.</li>
                <li>Current weather on site: visibility, wind speed, cloud ceiling.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-black/5 dark:border-white/5 space-y-2">
              <h4 className="font-extrabold text-black dark:text-white">2. Landing Zone (LZ) Preparation:</h4>
              <ul className="list-disc list-inside space-y-1 text-black dark:text-white font-medium opacity-90">
                <li>Identify 30m x 30m flat, clear area free of powerlines and trees.</li>
                <li>Secure all loose clothing, tarps, trekking poles, and sleeping bags.</li>
                <li>Mark landing spot with bright jacket or smoke signal on the upwind side.</li>
                <li>Stay low and crouch when the helicopter approaches; do NOT walk behind tail rotor.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
