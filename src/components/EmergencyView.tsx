import React, { useState } from 'react';
import { PhoneCall, ShieldAlert, HeartPulse, Copy, Check, AlertTriangle, Navigation, MapPin, Plane, Radio, Zap, Shield, Crosshair } from 'lucide-react';
import { EmergencyContact, Language } from '../types';
import { t } from '../data/mockData';

interface EmergencyViewProps {
  contacts: EmergencyContact[];
  language: Language;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({
  contacts,
  language
}) => {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [requestModal, setRequestModal] = useState<'helicopter' | 'drone' | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleSimulateDispatch = (type: 'helicopter' | 'drone') => {
    setDispatchStatus(
      type === 'helicopter'
        ? language === 'np'
          ? 'नेपाली सेना हवाई उद्धार कमान्ड सेन्टर (+977-01-4246950) मा तत्काल अलर्ट पठाइयो। GPS समन्वय सक्रिय छ।'
          : 'Emergency Medevac flight dispatch request transmitted to Nepal Army Air Operations (+977-01-4246950). Stand by on frequency.'
        : language === 'np'
          ? 'DJI FlyCart 30 रिमोट ड्रोन स्टेशन (+977-01-5970102) मा आपतकालीन औषधि तथा ब्लड प्याक ढुवानी समन्वय सुरु भयो।'
          : 'Autonomous DJI FlyCart 30 medical drone logistics hub (+977-01-5970102) alerted for urgent payload dispatch.'
    );
    setTimeout(() => setDispatchStatus(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Warning Banner */}
      <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 text-white shadow-md shadow-red-600/20 shrink-0 border border-white/20">
              <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-black dark:text-white">
                {t('emergencyHubTitle', language)}
              </h2>
              <p className="text-xs text-black dark:text-white mt-1 font-medium opacity-85">
                {t('emergencyHubSubtitle', language)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:102"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-sm shadow-md shadow-red-600/30 transition-all cursor-pointer animate-pulse"
            >
              <PhoneCall className="w-4 h-4 text-white" />
              <span>Call Ambulance: 102</span>
            </a>
          </div>
        </div>
      </div>

      {/* High-Altitude Air Ambulance & DJI FlyCart 30 Mission Control Section */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-900 via-blue-950 to-red-950 text-white p-6 shadow-xl border border-blue-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Plane className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-black tracking-wide uppercase mb-2">
                <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
                <span>Nepal Air Medevac & Remote Drone Supply Network</span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>🚁 Nepal Army Air Rescue</span>
                <span className="text-blue-400">&amp;</span>
                <span>🛸 DJI FlyCart 30 Medical Drone</span>
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                {language === 'np'
                  ? 'दुर्गम पहाडी तथा हिमाली जिल्लाहरू, सडक नभएका गाउँपालिका, र आपतकालीन दुर्घटनामा नेपाली सेनाको उद्धार हेलिकप्टर र ३०-४० केजी बोक्ने DJI FlyCart 30 ड्रोनमार्फत जीवनरक्षक औषधि, एन्टी-भेनम तथा रगत ढुवानी।'
                  : 'Emergency aerial medevac coordination with Nepal Army Air Operations for alpine rescue, coupled with DJI FlyCart 30 autonomous heavy-payload drones (up to 40kg / 6,000m altitude) for rapid medicine & blood delivery to remote health posts.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="tel:+977014246950"
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                <span>🚁 Call Army Medevac (+977-01-4246950)</span>
              </a>
              <div
                className="px-4 py-2.5 rounded-xl bg-slate-800/90 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-2 select-none"
                title="Service line is currently unavailable due to incorrect contact number"
              >
                <span>🛸 Drone Dispatch: Currently Unavailable</span>
              </div>
            </div>
          </div>

          {dispatchStatus && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{dispatchStatus}</span>
            </div>
          )}

          {/* Quick specs grid for Army Heli and DJI Drone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-white/10 dark:bg-black/30 backdrop-blur-md border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚁</span>
                  <span className="text-sm font-black text-white">Nepal Army Aviation Medevac</span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500 text-white">
                  Critical Trauma &amp; SAR
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Operates high-altitude Mi-17 and Bell 407 utility rescue helicopters with trained flight medics. Dedicated to remote disaster triage, complicated maternal emergencies, and extreme-altitude search &amp; rescue across Himalaya passes.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 font-bold">Direct Line: +977-01-4246950</span>
                <button
                  type="button"
                  onClick={() => handleSimulateDispatch('helicopter')}
                  className="text-xs font-bold text-red-300 hover:text-white underline cursor-pointer"
                >
                  {language === 'np' ? 'हेलिकप्टर अलर्ट पठाउनुहोस्' : 'Trigger Medevac Alert →'}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 dark:bg-black/40 backdrop-blur-md border border-amber-500/30 space-y-2 opacity-90">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛸</span>
                  <span className="text-sm font-black text-white">DJI FlyCart 30 Cargo Drone Logistics</span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-black">
                  Service Unavailable
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Autonomous heavy-lift medical delivery drone specifications. <b>Notice:</b> Direct telephone dispatch is currently not available because the contact number was incorrect/unverified. Hotline will be updated once verified.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                <span className="text-xs font-mono text-amber-300 font-bold">Dispatch Line: Unavailable (Incorrect Number)</span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {language === 'np' ? 'हाल सेवा बन्द' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Emergency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {contacts.map((c, i) => {
          const isUnavailable = c.available === false;
          return (
            <div
              key={i}
              className={`rounded-[22px] bg-white dark:bg-[#0F172A] border p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none transition-all flex flex-col justify-between group ${
                isUnavailable
                  ? 'border-amber-500/30 dark:border-amber-500/20 opacity-80'
                  : 'border-black/[0.08] dark:border-white/[0.08] hover:shadow-lg hover:border-red-600/30 dark:hover:border-blue-600/30 hover:translate-y-[-1px]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                      isUnavailable ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {c.icon && <span>{c.icon}</span>}
                    <span>{c.badge || 'National Helpline'}</span>
                  </span>
                  {isUnavailable ? (
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Unavailable
                    </span>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>

                <h3 className="text-base font-black text-black dark:text-white mt-2">
                  {language === 'np' ? c.name_np : c.name}
                </h3>

                <div
                  className={`my-3 py-3 px-4 rounded-2xl border flex items-center justify-between ${
                    isUnavailable
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
                      : 'bg-[#F8FAFC] dark:bg-[#1E293B] border-black/10 dark:border-white/10 text-black dark:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-lg sm:text-xl tracking-tight truncate">
                    <PhoneCall
                      className={`w-5 h-5 stroke-[2.2] shrink-0 ${
                        isUnavailable ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    />
                    <span className="truncate">{c.number}</span>
                  </div>
                  {!isUnavailable && (
                    <button
                      onClick={() => handleCopy(c.number)}
                      className="p-2 rounded-xl bg-white dark:bg-[#0F172A] text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 text-xs border border-black/10 dark:border-white/10 shadow-2xs transition-all cursor-pointer shrink-0"
                      title="Copy Number"
                    >
                      {copiedNumber === c.number ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-black dark:text-white" />
                      )}
                    </button>
                  )}
                </div>

                <p className="text-xs text-black dark:text-white leading-relaxed font-medium opacity-90">
                  {c.desc}
                </p>

                {c.unavailableReason && (
                  <div className="mt-2.5 p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] font-semibold text-amber-900 dark:text-amber-300">
                    ⚠️ {c.unavailableReason}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                {isUnavailable ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold text-xs border border-slate-200 dark:border-slate-700 cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <span>⚠️ Service Currently Unavailable</span>
                  </button>
                ) : (
                  <a
                    href={`tel:${c.number.replace(/\s+/g, '')}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 text-white font-bold text-xs shadow-sm shadow-red-600/20 transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4 text-white" />
                    <span>
                      {t('callNow', language)} ({c.number})
                    </span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Emergency Guidance Protocol */}
      <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4">
        <h3 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Critical First Aid & Triage Guidelines (आपतकालीन प्राथमिक उपचार निर्देशिका)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 space-y-1">
            <h4 className="font-extrabold text-red-600 dark:text-red-400">1. Chest Pain / Cardiac Emergency</h4>
            <p className="text-black dark:text-white leading-relaxed font-medium opacity-90">
              Keep patient in a comfortable seated position. Loosen tight clothing. Call 102 immediately. If conscious and not allergic, give Disprin 300mg chewable.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 space-y-1">
            <h4 className="font-extrabold text-red-600 dark:text-red-400">2. Severe Bleeding / Trauma</h4>
            <p className="text-black dark:text-white leading-relaxed font-medium opacity-90">
              Apply continuous firm pressure directly on wound using a sterile or clean cloth. Elevate limb if possible without moving injured joints.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 space-y-1">
            <h4 className="font-extrabold text-blue-600 dark:text-blue-400">3. High Fever / Seizures</h4>
            <p className="text-black dark:text-white leading-relaxed font-medium opacity-90">
              Do not insert anything into patient's mouth. Turn patient onto left side (recovery position) to keep airway open. Apply normal temperature water sponging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
