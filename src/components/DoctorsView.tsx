import React, { useState, useMemo } from 'react';
import { Search, Stethoscope, Star, CheckCircle, Clock, ShieldCheck, MapPin, DollarSign, CalendarPlus } from 'lucide-react';
import { Doctor, Language } from '../types';
import { t } from '../data/mockData';

interface DoctorsViewProps {
  doctors: Doctor[];
  language: Language;
  onBookDoctor: (doctor: Doctor) => void;
  onOpenDoctorRegister?: () => void;
}

export const DoctorsView: React.FC<DoctorsViewProps> = ({
  doctors,
  language,
  onBookDoctor,
  onOpenDoctorRegister
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [availableOnly, setAvailableOnly] = useState(false);

  const specialties = useMemo(() => {
    const list = Array.from(new Set(doctors.map((d) => d.specialty)));
    return ['all', ...list];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      if (selectedSpecialty !== 'all' && doc.specialty !== selectedSpecialty) {
        return false;
      }
      if (availableOnly && !doc.available) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const searchable = `${doc.name} ${doc.specialty} ${doc.specialty_np} ${doc.hospital} ${doc.degrees} ${doc.nmc_number}`.toLowerCase();
        if (!searchable.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [doctors, selectedSpecialty, availableOnly, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-5 border border-black/[0.08] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600 dark:text-red-400" />
            <input
              type="text"
              placeholder={t('searchDoctors', language)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-xs text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
            <label className="flex items-center gap-2 text-xs font-bold text-black dark:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-600 border-black/20 dark:border-white/20 cursor-pointer accent-red-600"
              />
              <span>{t('availableOnly', language)}</span>
            </label>

            {onOpenDoctorRegister && (
              <button
                onClick={onOpenDoctorRegister}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-black shadow-sm shadow-blue-600/20 cursor-pointer transition-all hover:scale-105"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>{language === 'np' ? '+ डाक्टर दर्ता' : '+ Register Doctor'}</span>
              </button>
            )}

            <span className="text-xs text-black dark:text-white font-medium">
              Showing <b className="text-red-600 dark:text-red-400 font-bold">{filteredDoctors.length}</b> Specialists
            </span>
          </div>
        </div>

        {/* Specialty Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {specialties.map((spec) => {
            const active = selectedSpecialty === spec;
            return (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-red-600 to-blue-700 text-white shadow-sm shadow-red-600/20'
                    : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-[#283548] border border-black/5 dark:border-white/5'
                }`}
              >
                <span>{spec === 'all' ? t('allSpecialties', language) : spec}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            className="rounded-[22px] bg-white dark:bg-[#0F172A] border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-lg hover:border-red-600/30 dark:hover:border-blue-600/30 hover:translate-y-[-1px] transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Doctor Top Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 text-white flex items-center justify-center text-xl font-bold shadow-sm shadow-red-600/20 border border-white/20">
                    👨‍⚕️
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                      {doc.name}
                    </h3>
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mt-0.5">
                      {language === 'np' ? doc.specialty_np : doc.specialty}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${doc.available ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-neutral-100 dark:bg-[#1E293B] text-black dark:text-white border border-black/10 dark:border-white/10'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${doc.available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span>{doc.available ? t('available', language) : t('busy', language)}</span>
                  </span>
                </div>
              </div>

              {/* Degrees & Badges */}
              <div className="mt-3 text-[11px] text-black dark:text-white">
                <span className="font-semibold text-black dark:text-white">{doc.degrees}</span>
              </div>

              {/* Meta Details */}
              <div className="mt-3.5 space-y-2 pt-3 border-t border-black/5 dark:border-white/5 text-xs">
                <div className="flex items-center gap-1.5 text-black dark:text-white">
                  <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  <span className="truncate font-medium">{doc.hospital}</span>
                </div>

                <div className="flex items-center justify-between text-black dark:text-white font-medium">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{doc.nmc_number}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{doc.rating}</span>
                    <span className="text-[10px] opacity-75">({doc.reviews_count || 45})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-black dark:text-white font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-black dark:text-white opacity-70" />
                    <span>{doc.experience_years} yrs exp</span>
                  </div>
                  <div className="font-black text-black dark:text-white">
                    Rs. {doc.fee_npr}
                  </div>
                </div>

                <div className="text-[11px] text-black dark:text-white truncate font-medium">
                  🗣️ {doc.languages.join(', ')}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
              <button
                onClick={() => onBookDoctor(doc)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 text-white font-bold text-xs shadow-sm shadow-red-600/20 transition-all cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4 text-white" />
                <span>{t('bookNow', language)}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
