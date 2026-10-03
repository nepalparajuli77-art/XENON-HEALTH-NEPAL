import React, { useState } from 'react';
import {
  FlaskConical,
  UploadCloud,
  FileCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { LabReport, Language } from '../types';

interface LabReportsViewProps {
  labReports: LabReport[];
  onAddLabReport: (report: LabReport) => void;
  language: Language;
}

export const LabReportsView: React.FC<LabReportsViewProps> = ({
  labReports,
  onAddLabReport,
  language
}) => {
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(
    labReports[0] || null
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccessToast, setScanSuccessToast] = useState(false);

  const handleSimulateOCR = (presetType: 'kft' | 'cbc' | 'lipid') => {
    setIsScanning(true);

    setTimeout(() => {
      let newReport: LabReport;
      if (presetType === 'kft') {
        newReport = {
          id: `lab_${Date.now()}`,
          patient_name: 'Ram Sharan Parajuli',
          family_member_id: 'fam_001',
          test_name: 'Renal Function Test (KFT & Electrolytes)',
          test_date: new Date().toISOString().split('T')[0],
          lab_name: 'Bir Hospital Central Pathology Department',
          doctor_ref: 'Dr. Niraj Bajracharya',
          status: 'Completed',
          biomarkers: [
            { parameter: 'Serum Creatinine', value: 1.1, unit: 'mg/dL', reference_range: '0.7 - 1.3', status: 'Normal' },
            { parameter: 'Blood Urea Nitrogen (BUN)', value: 18, unit: 'mg/dL', reference_range: '7 - 20', status: 'Normal' },
            { parameter: 'Serum Sodium (Na+)', value: 139, unit: 'mEq/L', reference_range: '135 - 145', status: 'Normal' },
            { parameter: 'Serum Potassium (K+)', value: 4.4, unit: 'mEq/L', reference_range: '3.5 - 5.1', status: 'Normal' },
            { parameter: 'Uric Acid', value: 7.6, unit: 'mg/dL', reference_range: '3.5 - 7.2', status: 'High' }
          ],
          ai_summary: 'Kidney filtration biomarkers (Creatinine and BUN) are normal. Serum Uric Acid is mildly elevated at 7.6 mg/dL. Recommended: increase daily water intake to 3 Liters, limit red meat, lentils (दाल), and high-purine foods.',
          ai_summary_np: 'मिर्गौला कार्यक्षमता (Creatinine तथा BUN) सामान्य छ। युरिक एसिड सामान्यभन्दा केही बढेको (७.६ mg/dL) देखिएकोले प्रशस्त पानी पिउनुहोस् र रातो मासु कम गर्नुहोस्।'
        };
      } else if (presetType === 'cbc') {
        newReport = {
          id: `lab_${Date.now()}`,
          patient_name: 'Aryan Parajuli',
          family_member_id: 'fam_003',
          test_name: 'Complete Blood Count & Peripheral Smear',
          test_date: new Date().toISOString().split('T')[0],
          lab_name: "Kanti Children's Hospital Clinical Lab",
          doctor_ref: 'Dr. Priya Karki',
          status: 'Completed',
          biomarkers: [
            { parameter: 'Hemoglobin (Hb)', value: 12.8, unit: 'g/dL', reference_range: '11.5 - 14.5', status: 'Normal' },
            { parameter: 'Total WBC', value: 7200, unit: '/cumm', reference_range: '5000 - 13000', status: 'Normal' },
            { parameter: 'Platelets', value: 280000, unit: '/cumm', reference_range: '150000 - 450000', status: 'Normal' },
            { parameter: 'ESR (1st Hour)', value: 10, unit: 'mm/hr', reference_range: '0 - 15', status: 'Normal' }
          ],
          ai_summary: 'All pediatric hematology parameters are within age-appropriate healthy reference ranges with no signs of active infection or anemia.',
          ai_summary_np: 'बालरोग विशेषज्ञको मापदण्डअनुसार सम्पूर्ण रक्त जाँच सामान्य रहेको छ।'
        };
      } else {
        newReport = {
          id: `lab_${Date.now()}`,
          patient_name: 'Sita Devi Parajuli',
          family_member_id: 'fam_002',
          test_name: 'Liver Function Test (LFT Panel)',
          test_date: new Date().toISOString().split('T')[0],
          lab_name: 'Teaching Hospital Clinical Biochemistry Lab',
          doctor_ref: 'Dr. Roshan Shrestha',
          status: 'Completed',
          biomarkers: [
            { parameter: 'SGPT (ALT)', value: 24, unit: 'U/L', reference_range: '7 - 56', status: 'Normal' },
            { parameter: 'SGOT (AST)', value: 28, unit: 'U/L', reference_range: '10 - 40', status: 'Normal' },
            { parameter: 'Total Bilirubin', value: 0.9, unit: 'mg/dL', reference_range: '0.2 - 1.2', status: 'Normal' },
            { parameter: 'Alkaline Phosphatase (ALP)', value: 85, unit: 'U/L', reference_range: '44 - 147', status: 'Normal' }
          ],
          ai_summary: 'Normal liver enzyme activity with healthy bilirubin clearance. No hepatic inflammation detected.',
          ai_summary_np: 'कलेजोको परीक्षण (LFT) सम्पूर्ण रुपमा सामान्य छ।'
        };
      }

      onAddLabReport(newReport);
      setSelectedReport(newReport);
      setIsScanning(false);
      setScanSuccessToast(true);
      setTimeout(() => setScanSuccessToast(false), 4000);
    }, 1500);
  };

  const activeReport = selectedReport || labReports[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="rounded-[24px] bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider">
              🧪 Clinical Diagnostics & OCR
            </span>
            <span className="px-2.5 py-1 rounded-full bg-teal-500/90 text-white text-[10px] font-bold">
              AI Biomarker Analysis
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {language === 'np' ? 'ल्याब रिपोर्ट तथा एआई स्क्यानर' : 'Lab Reports & OCR Biomarker Scanner'}
          </h1>
          <p className="text-xs text-white/80 max-w-2xl mt-1 leading-relaxed">
            Upload hospital pathology reports (CBC, LFT, Lipid, Blood Sugar, KFT) to extract structured biomarkers, detect out-of-range anomalies, and receive clinical guidance.
          </p>
        </div>

        {/* Scan / Upload Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="dropdown relative">
            <button
              disabled={isScanning}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black text-xs transition-all shadow-lg cursor-pointer"
              onClick={() => handleSimulateOCR('kft')}
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Processing OCR...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>+ Scan Sample Lab Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {scanSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>Lab report scanned and parsed successfully with AI biomarker categorization!</span>
          </div>
          <button onClick={() => setScanSuccessToast(false)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Quick OCR Samples Bar */}
      <div className="p-3.5 rounded-2xl bg-[#E2E8F0] dark:bg-[#1E293B] border border-black/[0.06] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span className="font-bold text-black dark:text-white">Quick Scan Nepal Pathology Templates:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSimulateOCR('kft')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0F172A] text-black dark:text-white font-bold border border-black/10 dark:border-white/10 hover:border-teal-500 transition-all cursor-pointer text-[11px]"
          >
            + Kidney (KFT / Electrolytes)
          </button>
          <button
            onClick={() => handleSimulateOCR('cbc')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0F172A] text-black dark:text-white font-bold border border-black/10 dark:border-white/10 hover:border-teal-500 transition-all cursor-pointer text-[11px]"
          >
            + Pediatric CBC
          </button>
          <button
            onClick={() => handleSimulateOCR('lipid')}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0F172A] text-black dark:text-white font-bold border border-black/10 dark:border-white/10 hover:border-teal-500 transition-all cursor-pointer text-[11px]"
          >
            + Liver (LFT Panel)
          </button>
        </div>
      </div>

      {/* Main Grid: Reports List Left + Report Details Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Reports Archive List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Archived Lab Reports ({labReports.length})
          </h3>

          <div className="space-y-2.5">
            {labReports.map((report) => {
              const isSelected = activeReport?.id === report.id;
              const hasAbnormal = report.biomarkers.some(
                (b) => b.status === 'High' || b.status === 'Low' || b.status === 'Critical'
              );

              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-4 rounded-[20px] border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 dark:border-teal-600 shadow-md ring-2 ring-teal-500/20'
                      : 'bg-white dark:bg-[#0F172A] border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400">
                        {report.test_date}
                      </span>
                      <h4 className="font-extrabold text-xs text-black dark:text-white mt-0.5 leading-snug">
                        {report.test_name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Patient: <b>{report.patient_name}</b>
                      </p>
                    </div>

                    {hasAbnormal ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shrink-0">
                        Attention
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shrink-0">
                        Normal
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Report Biomarkers Table & AI Explanation */}
        {activeReport ? (
          <div className="lg:col-span-8 rounded-[24px] bg-white dark:bg-[#0F172A] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-black dark:text-white">
                    {activeReport.test_name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300">
                    {activeReport.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <b>Facility:</b> {activeReport.lab_name} • <b>Date:</b> {activeReport.test_date} • <b>Ref Doctor:</b> {activeReport.doctor_ref}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Patient:</span>
                <p className="text-xs font-black text-black dark:text-white">{activeReport.patient_name}</p>
              </div>
            </div>

            {/* Biomarkers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold">
                    <th className="pb-2.5 font-bold">Biomarker / Test Parameter</th>
                    <th className="pb-2.5 font-bold">Result Value</th>
                    <th className="pb-2.5 font-bold">Standard Reference Range</th>
                    <th className="pb-2.5 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {activeReport.biomarkers.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-extrabold text-black dark:text-white">
                        {b.parameter}
                      </td>
                      <td className="py-3 font-black text-black dark:text-white">
                        {b.value} <span className="font-normal text-[11px] text-slate-500">{b.unit}</span>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">
                        {b.reference_range} {b.unit}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            b.status === 'Normal'
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                              : b.status === 'High'
                              ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI Clinical Translation and Advice Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/40 dark:to-blue-950/40 border border-teal-200 dark:border-teal-900 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-teal-900 dark:text-teal-300">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>AI Clinical Interpretation & Nepal Lifestyle Guidance</span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                {language === 'np' && activeReport.ai_summary_np
                  ? activeReport.ai_summary_np
                  : activeReport.ai_summary}
              </p>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center text-slate-400">
            No lab report selected.
          </div>
        )}
      </div>
    </div>
  );
};
