import React, { useState, useMemo } from 'react';
import { Search, Building2, Phone, PhoneCall, Mail, MessageSquare, MessageCircle, Bed, Check, Sparkles, MapPin, Globe, ExternalLink } from 'lucide-react';
import { Hospital, Language } from '../types';
import { t } from '../data/mockData';

interface HospitalsViewProps {
  hospitals: Hospital[];
  language: Language;
  onOpenChat: (hospital: Hospital) => void;
}

export const HospitalsView: React.FC<HospitalsViewProps> = ({
  hospitals,
  language,
  onOpenChat
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  const districts = useMemo(() => {
    const list = Array.from(new Set(hospitals.map((h) => h.district)));
    return ['all', ...list];
  }, [hospitals]);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      if (selectedDistrict !== 'all' && h.district !== selectedDistrict) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const searchable = `${h.name} ${h.name_np} ${h.district} ${h.address} ${h.specialties.join(' ')} ${h.type}`.toLowerCase();
        if (!searchable.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [hospitals, selectedDistrict, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-5 border border-black/[0.08] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600 dark:text-red-400" />
          <input
            type="text"
            placeholder={t('searchHospitals', language)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-xs text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-red-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
          {districts.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDistrict(d)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedDistrict === d
                  ? 'bg-gradient-to-r from-red-600 to-blue-700 text-white shadow-sm shadow-red-600/20'
                  : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-[#283548] border border-black/5 dark:border-white/5'
              }`}
            >
              <span>{d === 'all' ? 'All Districts' : d}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hospitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHospitals.map((hosp) => {
          const cleanPhone = hosp.phone.replace(/[^0-9+]/g, '');
          const smsText = `Hello ${hosp.name}, I am reaching out through the XENON HEALTH healthcare directory regarding hospital services.`;
          const smsUri = `sms:${cleanPhone}?body=${encodeURIComponent(smsText)}`;

          return (
            <div
              key={hosp.id}
              className="rounded-[22px] bg-white dark:bg-[#0F172A] border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-lg hover:border-red-600/30 dark:hover:border-blue-600/30 hover:translate-y-[-1px] transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 text-white flex items-center justify-center text-xl font-bold shadow-sm shadow-red-600/20 border border-white/20 shrink-0">
                      🏥
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                        {language === 'np' ? hosp.name_np : hosp.name}
                      </h3>
                      <p className="text-xs text-black dark:text-white opacity-85 flex items-center gap-1 mt-0.5 font-medium">
                        <MapPin className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />
                        <span>{hosp.address}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                    {hosp.type}
                  </span>
                  {hosp.icu && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 text-emerald-500" /> <span>ICU Available</span>
                    </span>
                  )}
                  {hosp.open_247 && (
                    <span className="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 text-[10px] font-bold">
                      24/7 Emergency
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] text-black dark:text-white border border-black/10 dark:border-white/10 text-[10px] font-semibold flex items-center gap-1">
                    <Bed className="w-3 h-3 text-black dark:text-white" /> <span>{hosp.beds} beds</span>
                  </span>
                </div>

                <p className="mt-2.5 text-xs text-black dark:text-white line-clamp-2 leading-relaxed font-medium opacity-90">
                  {hosp.description}
                </p>

                {/* Specialties Pills */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {hosp.specialties.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1E293B] text-black dark:text-white border border-black/5 dark:border-white/5 text-[10px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Contacts & Website Links */}
                <div className="mt-3.5 pt-3 border-t border-black/5 dark:border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-black dark:text-white font-medium">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                      title="Call Reception"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{hosp.phone}</span>
                    </a>
                    <a
                      href={`tel:${hosp.emergency.replace(/[^0-9+]/g, '')}`}
                      className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400 hover:underline"
                      title="Call 24/7 Emergency Room"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                      <span>{hosp.emergency}</span>
                    </a>
                  </div>

                  {hosp.website && (
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={hosp.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="truncate">{hosp.website.replace('https://', '')}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-75" />
                      </a>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Official Web</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Message SMS / Open Website / Live Chat */}
              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={smsUri}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs transition-all text-center cursor-pointer shadow-2xs"
                    title="Opens your phone's SMS / Messaging app to message this hospital directly"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">{language === 'np' ? 'एसएमएस सन्देश' : 'SMS Message'}</span>
                  </a>

                  {hosp.website ? (
                    <a
                      href={hosp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-slate-700/60 border border-black/10 dark:border-white/10 text-black dark:text-white font-bold text-xs transition-all text-center cursor-pointer shadow-2xs"
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">{language === 'np' ? 'वेबसाइट' : 'Visit Web'}</span>
                    </a>
                  ) : (
                    <a
                      href={`mailto:${hosp.email}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-slate-700/60 border border-black/10 dark:border-white/10 text-black dark:text-white font-bold text-xs transition-all text-center cursor-pointer shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">Email</span>
                    </a>
                  )}
                </div>

                <button
                  onClick={() => onOpenChat(hosp)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 text-white font-bold text-xs shadow-sm shadow-red-600/20 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>{t('liveChat', language)}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
