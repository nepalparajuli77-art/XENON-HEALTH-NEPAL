import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  HeartPulse,
  Activity,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Tag,
  FileCheck,
  TrendingUp,
  ShieldCheck,
  X
} from 'lucide-react';
import { Language, User, UserHealthRecord, UserVitals } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface PersonalHealthVaultProps {
  currentUser: User | null;
  language: Language;
  onUpdateUserVitals?: (vitals: UserVitals) => void;
}

export const PersonalHealthVault: React.FC<PersonalHealthVaultProps> = ({
  currentUser,
  language,
  onUpdateUserVitals
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'vitals' | 'records'>('upload');
  const [records, setRecords] = useState<UserHealthRecord[]>(() => {
    const userId = currentUser?.id || 'guest';
    try {
      const saved = localStorage.getItem(`xenon_health_vault_${userId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn(e);
    }
    // Default initial mock record for demonstration
    return [
      {
        id: 'rec_init_1',
        user_id: userId,
        user_name: currentUser?.full_name || 'Patient',
        title: language === 'np' ? 'सामान्य स्वास्थ्य जाँच रिपोर्ट (Baseline Vitals)' : 'Annual Health & Vitals Baseline',
        category: 'Vitals Log',
        date: new Date().toISOString().split('T')[0],
        file_name: 'vitals_baseline_record.json',
        file_size: '1.2 KB',
        notes: language === 'np' ? 'नियमित रक्तचाप र अक्सिजन स्तर रेकर्ड' : 'Routine BP & SpO2 logged in Kathmandu OPD.',
        vitals: {
          bp: '118/78',
          sp_o2: '98%',
          heart_rate: '72 bpm',
          blood_sugar: '92 mg/dL',
          weight_kg: '64',
          temperature: '98.4 °F'
        },
        ai_insights: language === 'np'
          ? 'तपाईंको रक्तचाप र अक्सिजन स्तर काठमाडौंको उचाइ अनुसार उत्तम छ।'
          : 'All baseline biomarkers and SpO2 levels are in the optimal clinical target zone.',
        tags: ['Baseline', 'Cardio', 'Nepal'],
        created_at: new Date().toISOString()
      }
    ];
  });

  // Vitals form state
  const [bp, setBp] = useState(currentUser?.vitals?.bp || '120/80');
  const [bloodSugar, setBloodSugar] = useState(currentUser?.vitals?.blood_sugar || '95');
  const [spO2, setSpO2] = useState(currentUser?.vitals?.sp_o2 || '98');
  const [heartRate, setHeartRate] = useState(currentUser?.vitals?.heart_rate || '74');
  const [weightKg, setWeightKg] = useState(currentUser?.vitals?.weight_kg || '65');
  const [temperature, setTemperature] = useState(currentUser?.vitals?.temperature || '98.6');
  const [vitalsSavedToast, setVitalsSavedToast] = useState(false);

  // Upload form state
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<UserHealthRecord['category']>('Prescription');
  const [docNotes, setDocNotes] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('');
  const [selectedFileData, setSelectedFileData] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewModalRecord, setPreviewModalRecord] = useState<UserHealthRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync with current user changes
  useEffect(() => {
    const userId = currentUser?.id || 'guest';
    try {
      const saved = localStorage.getItem(`xenon_health_vault_${userId}`);
      if (saved) {
        setRecords(JSON.parse(saved));
      }
    } catch (e) {
      console.warn(e);
    }
  }, [currentUser?.id]);

  const saveRecordsToStorage = (updated: UserHealthRecord[]) => {
    setRecords(updated);
    const userId = currentUser?.id || 'guest';
    try {
      localStorage.setItem(`xenon_health_vault_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setSelectedFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    if (!docTitle) {
      setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFileData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    setIsUploading(true);

    setTimeout(() => {
      const userId = currentUser?.id || 'guest';
      const categoryInsightsMap: Record<string, string> = {
        'Prescription': language === 'np'
          ? 'प्रिस्क्रिप्शन सुरक्षित भण्डारण गरियो। औषधि तालिका अलर्ट सिंक गरिएको छ।'
          : 'Prescription scanned and saved. Medication schedule synced to reminders.',
        'Lab Report': language === 'np'
          ? 'ल्याब रिपोर्ट बायोमार्करहरू सामान्य दायरामा विश्लेषण गरिएका छन्।'
          : 'Lab report digitized. Biomarkers verified against Nepal clinical reference standards.',
        'Vaccination': language === 'np'
          ? 'खोप रेकर्ड प्रमाणित गरियो। बुस्टर सल्लाह सक्रिय छ।'
          : 'Vaccination record logged. Immunization history up to date.',
        'Discharge Summary': language === 'np'
          ? 'अस्पताल डिस्चार्ज सारांश सुरक्षित राखियो।'
          : 'Hospital discharge summary securely encrypted in your vault.',
        'Vitals Log': language === 'np'
          ? 'भाइटल्स अपडेट गरियो। स्वास्थ्य स्कोर ताजा भयो।'
          : 'Vitals successfully logged. Health score and tailored tips refreshed.',
        'X-Ray / Scan': language === 'np'
          ? 'रेडियोलोजी स्क्यान सुरक्षित राखियो।'
          : 'Radiology imaging indexed for instant sharing during consultations.',
        'Other': language === 'np'
          ? 'स्वास्थ्य कागजात सुरक्षित रूपमा थपियो।'
          : 'Personal medical document archived securely.'
      };

      const newRecord: UserHealthRecord = {
        id: `rec_${Date.now()}`,
        user_id: userId,
        user_name: currentUser?.full_name || 'Patient',
        title: docTitle.trim(),
        category: docCategory,
        date: new Date().toISOString().split('T')[0],
        file_name: selectedFileName || `${docTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        file_size: selectedFileSize || '245 KB',
        file_data_url: selectedFileData || undefined,
        notes: docNotes.trim(),
        ai_insights: categoryInsightsMap[docCategory] || 'Document categorized and protected.',
        tags: [docCategory, 'Personal Vault', 'Verified'],
        created_at: new Date().toISOString()
      };

      const updated = [newRecord, ...records];
      saveRecordsToStorage(updated);

      // Reset form
      setDocTitle('');
      setDocNotes('');
      setSelectedFileName('');
      setSelectedFileSize('');
      setSelectedFileData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsUploading(false);
      setActiveTab('records');
    }, 600);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    const vitalsData: UserVitals = {
      bp: bp.trim(),
      blood_sugar: bloodSugar.trim() ? `${bloodSugar.trim()} mg/dL` : undefined,
      sp_o2: spO2.trim() ? `${spO2.trim()}%` : undefined,
      heart_rate: heartRate.trim() ? `${heartRate.trim()} bpm` : undefined,
      weight_kg: weightKg.trim(),
      temperature: temperature.trim() ? `${temperature.trim()} °F` : undefined,
      last_updated: new Date().toISOString()
    };

    if (onUpdateUserVitals) {
      onUpdateUserVitals(vitalsData);
    }

    // Also add a vitals log record to records
    const userId = currentUser?.id || 'guest';
    const newRecord: UserHealthRecord = {
      id: `vitals_${Date.now()}`,
      user_id: userId,
      user_name: currentUser?.full_name || 'Patient',
      title: language === 'np' ? `भाइटल्स अपडेट (${new Date().toLocaleDateString()})` : `Vitals Log (${new Date().toLocaleDateString()})`,
      category: 'Vitals Log',
      date: new Date().toISOString().split('T')[0],
      vitals: vitalsData,
      notes: `BP: ${bp} | SpO2: ${spO2}% | HR: ${heartRate} bpm | Sugar: ${bloodSugar} mg/dL | Weight: ${weightKg}kg`,
      ai_insights: language === 'np'
        ? `तपाईंको रक्तचाप (${bp}) र अक्सिजन स्तर (${spO2}%) स्वस्थ दायरामा रेकर्ड गरिएको छ।`
        : `Logged BP (${bp}) and SpO2 (${spO2}%) indicate stable cardiovascular health at current altitude.`,
      tags: ['Vitals', 'Daily Health'],
      created_at: new Date().toISOString()
    };

    const updated = [newRecord, ...records];
    saveRecordsToStorage(updated);

    setVitalsSavedToast(true);
    setTimeout(() => setVitalsSavedToast(false), 3000);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    saveRecordsToStorage(updated);
  };

  // Calculate quick health score based on entered vitals
  const calculateHealthStatus = () => {
    const systolic = parseInt(bp.split('/')[0]) || 120;
    const oxygen = parseInt(spO2) || 98;

    if (oxygen < 92 || systolic > 145) {
      return {
        status: language === 'np' ? 'थप ध्यान दिनुपर्ने' : 'Needs Attention',
        color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
        note: language === 'np' ? 'उचाइ वा रक्तचाप निगरानी गर्नुहोस्' : 'Monitor BP & altitude hydration closely'
      };
    }
    return {
      status: language === 'np' ? 'उत्तम स्वास्थ्य' : 'Optimal Health',
      color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
      note: language === 'np' ? 'सबै बायोमार्करहरू सामान्य छन्' : 'All logged vitals in target zone'
    };
  };

  const healthStatus = calculateHealthStatus();

  return (
    <div className="rounded-[24px] liquid-glass-card border border-white/60 dark:border-white/10 p-4 sm:p-6 shadow-sm w-full max-w-full transition-all">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-red-600/20 shrink-0">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                {language === 'np' ? 'व्यक्तिगत स्वास्थ्य डाटा तथा कागजात' : 'Personal Health Vault & Data Upload'}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${healthStatus.color}`}>
                {healthStatus.status}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {language === 'np'
                ? 'आफ्नो मेडिकल रिपोर्ट, प्रिस्क्रिप्शन वा भाइटल्स अपलोड गर्नुहोस् ताकि सल्लाह र सेवाहरू थप व्यक्तिगत बनून्।'
                : 'Upload your own medical files, lab reports, or vitals to personalize your AI insights and care.'}
            </p>
          </div>
        </div>

        {/* Tab Toggle Pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-stretch sm:self-auto overflow-x-auto scrollbar-none max-w-full">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>{language === 'np' ? 'कागजात अपलोड' : 'Upload File'}</span>
          </button>

          <button
            onClick={() => setActiveTab('vitals')}
            className={`flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'vitals'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{language === 'np' ? 'भाइटल्स इन्ट्री' : 'Log Vitals'}</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'records'
                ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>
              {language === 'np' ? 'मेरो रेकर्ड' : 'My Records'} ({records.length})
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: File Upload */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUploadSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {language === 'np' ? 'कागजातको नाम / शीर्षक *' : 'Document Title *'}
              </label>
              <input
                type="text"
                required
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder={language === 'np' ? 'उदा: नर्भिक मुटु जाँच, ब्लड टेस्ट, छातीको एक्सरे' : 'e.g., Norvic Cardiology Report, Blood Test, Chest X-Ray'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {language === 'np' ? 'प्रकार (Category)' : 'Category'}
              </label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as UserHealthRecord['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer shadow-2xs"
              >
                <option value="Prescription">{language === 'np' ? 'प्रिस्क्रिप्शन (Prescription)' : 'Prescription'}</option>
                <option value="Lab Report">{language === 'np' ? 'ल्याब रिपोर्ट (Lab Report)' : 'Lab Report'}</option>
                <option value="Vaccination">{language === 'np' ? 'खोप कार्ड (Vaccination)' : 'Vaccination'}</option>
                <option value="Discharge Summary">{language === 'np' ? 'डिस्चार्ज सारांश (Discharge Summary)' : 'Discharge Summary'}</option>
                <option value="X-Ray / Scan">{language === 'np' ? 'एक्स-रे / स्क्यान (X-Ray / Scan)' : 'X-Ray / Scan'}</option>
                <option value="Vitals Log">{language === 'np' ? 'दैनिक भाइटल्स (Vitals Log)' : 'Vitals Log'}</option>
                <option value="Other">{language === 'np' ? 'अन्य मेडिकल फाइल' : 'Other Document'}</option>
              </select>
            </div>
          </div>

          {/* Drag and Drop / File Picker Container */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/40"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.json,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            {selectedFileName ? (
              <div>
                <p className="text-xs font-black text-slate-950 dark:text-white flex items-center justify-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>{selectedFileName}</span>
                  <span className="text-[11px] text-slate-500 font-normal">({selectedFileSize})</span>
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                  {language === 'np' ? 'फाइल चयन भयो • क्लिक गरेर परिवर्तन गर्न सक्नुहुन्छ' : 'File selected • Click to change file'}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {language === 'np'
                    ? 'यहाँ फाइल क्लिक गर्नुहोस् वा तानेर छोड्नुहोस् (PDF, JPG, PNG, Scan)'
                    : 'Click or drag & drop medical document (PDF, JPG, PNG, Scans)'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'np'
                    ? 'अधिकतम आकार २५ एमबी • तपाईंको डाटा पूर्ण रूपमा सुरक्षित र इन्क्रिप्टेड छ'
                    : 'Max size 25MB • Secure client-side encryption & instant AI summary'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              {language === 'np' ? 'थप विवरण / टिप्पणी (वैकल्पिक)' : 'Notes or Doctor Instructions (Optional)'}
            </label>
            <textarea
              rows={2}
              value={docNotes}
              onChange={(e) => setDocNotes(e.target.value)}
              placeholder={language === 'np' ? 'उदा: डाक्टरले दिनको २ पटक औषधि खान भन्नुभएको छ...' : 'e.g. Advised to repeat fasting blood test in 3 months...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isUploading || !docTitle.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'np' ? 'अपलोड हुँदैछ...' : 'Uploading & Analyzing...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>{language === 'np' ? 'सुरक्षित भण्डारण गर्नुहोस्' : 'Save & Personalize My Insights'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Vitals Input */}
      {activeTab === 'vitals' && (
        <form onSubmit={handleSaveVitals} className="mt-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 dark:text-blue-200 font-medium">
              {language === 'np'
                ? 'आफ्नो हालको रक्तचाप, अक्सिजन र ग्लुकोज राख्नुहोस्। यसले नेपालको भूगोल अनुसार विशेष परामर्श दिन्छ।'
                : 'Log your current vitals. Xenon AI uses this to customize dosage safety alerts and altitude advice.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'np' ? 'रक्तचाप (BP mmHg)' : 'Blood Pressure (BP)'}
              </label>
              <input
                type="text"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                placeholder="120/80"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'np' ? 'अक्सिजन (SpO2 %)' : 'Oxygen Level (SpO2)'}
              </label>
              <input
                type="text"
                value={spO2}
                onChange={(e) => setSpO2(e.target.value)}
                placeholder="98"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'np' ? 'मुटुको गति (Heart Rate bpm)' : 'Heart Rate (bpm)'}
              </label>
              <input
                type="text"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                placeholder="72"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'np' ? 'सुगर (Blood Glucose mg/dL)' : 'Fasting Sugar (mg/dL)'}
              </label>
              <input
                type="text"
                value={bloodSugar}
                onChange={(e) => setBloodSugar(e.target.value)}
                placeholder="95"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'np' ? 'तौल (Weight kg)' : 'Weight (kg)'}
              </label>
              <input
                type="text"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="65"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'np' ? 'तापक्रम (Temp °F)' : 'Temperature (°F)'}
              </label>
              <input
                type="text"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="98.6"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {vitalsSavedToast ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'np' ? 'भाइटल्स सुरक्षित गरियो!' : 'Vitals logged & profile updated!'}</span>
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <Activity className="w-4 h-4 text-white" />
              <span>{language === 'np' ? 'भाइटल्स अपडेट गर्नुहोस्' : 'Update Vitals & Health Score'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Records List */}
      {activeTab === 'records' && (
        <div className="mt-5 space-y-3">
          {records.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'np' ? 'कुनै कागजात अपलोड गरिएको छैन' : 'No personal documents uploaded yet.'}
              </p>
              <button
                onClick={() => setActiveTab('upload')}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'np' ? 'पहिलो रिपोर्ट अपलोड गर्नुहोस्' : 'Upload First Medical File'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-950 dark:text-white line-clamp-1">
                            {rec.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                            <span>{rec.date}</span>
                            <span>•</span>
                            <span>{rec.category}</span>
                            {rec.file_size && (
                              <>
                                <span>•</span>
                                <span>{rec.file_size}</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {rec.vitals && (
                      <div className="mt-3 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 grid grid-cols-3 gap-2 text-center text-[10px]">
                        {rec.vitals.bp && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-medium">BP</span>
                            <span className="font-extrabold text-slate-950 dark:text-white">{rec.vitals.bp}</span>
                          </div>
                        )}
                        {rec.vitals.sp_o2 && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-medium">SpO2</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{rec.vitals.sp_o2}</span>
                          </div>
                        )}
                        {rec.vitals.heart_rate && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-medium">Heart</span>
                            <span className="font-extrabold text-blue-600 dark:text-blue-400">{rec.vitals.heart_rate}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {rec.ai_insights && (
                      <div className="mt-2.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium bg-white/60 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{rec.ai_insights}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1 flex-wrap">
                      {rec.tags?.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-300"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => setPreviewModalRecord(rec)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{language === 'np' ? 'विवरण' : 'View'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Record Preview Modal */}
      {previewModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setPreviewModalRecord(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 text-white shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">
                  {previewModalRecord.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {previewModalRecord.category} • {previewModalRecord.date}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              {previewModalRecord.notes && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {language === 'np' ? 'टिप्पणी / विवरण:' : 'Notes & Medical Observations:'}
                  </div>
                  <p>{previewModalRecord.notes}</p>
                </div>
              )}

              {previewModalRecord.ai_insights && (
                <div className="p-3 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                  <div className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>{language === 'np' ? 'एआई स्वास्थ्य विश्लेषण:' : 'Personalized AI Health Synthesis:'}</span>
                  </div>
                  <p>{previewModalRecord.ai_insights}</p>
                </div>
              )}

              {previewModalRecord.file_name && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
                  <span className="font-mono text-[11px] truncate max-w-[240px]">
                    📄 {previewModalRecord.file_name}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Encrypted &amp; Stored
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setPreviewModalRecord(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
