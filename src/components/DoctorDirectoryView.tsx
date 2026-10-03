import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  Search,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Star,
  CheckCircle2,
  Filter,
  ShieldCheck,
  Video
} from 'lucide-react';
import { Doctor, Language } from '../types';

interface DoctorDirectoryViewProps {
  doctors: Doctor[];
  language: Language;
  onBookDoctor: (doctor: Doctor) => void;
}

export const DoctorDirectoryView: React.FC<DoctorDirectoryViewProps> = ({
  doctors,
  language,
  onBookDoctor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedHospital, setSelectedHospital] = useState<string>('all');

  const specialties = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialty));
    return ['all', ...Array.from(set)];
  }, [doctors]);

  const hospitals = useMemo(() => {
    const set = new Set(doctors.map((d) => d.hospital));
    return ['all', ...Array.from(set)];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.degrees.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.nmc_number.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSpecialty = selectedSpecialty === 'all' || doc.specialty === selectedSpecialty;
      const matchHospital = selectedHospital === 'all' || doc.hospital === selectedHospital;

      return matchSearch && matchSpecialty && matchHospital;
    });
  }, [doctors, searchQuery, selectedSpecialty, selectedHospital]);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{language === 'np' ? 'विशेषज्ञ सेवा' : 'Specialist Services'}</span>
          <span aria-hidden="true">·</span>
          <span>NMC Verified Directory</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Telemedicine Available</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          {language === 'np' ? 'नेपालका प्रमाणित विशेषज्ञ डाक्टरहरू' : 'Nepal Medical Council (NMC) Specialist Directory'}
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          {language === 'np'
            ? 'वरिष्ठ मुटुरोग, आँखारोग, बालरोग, र शल्यक्रिया विशेषज्ञहरूसँग प्रत्यक्ष भिडियो परामर्श बुक गर्नुहोस्।'
            : 'Schedule official teleconsultations with top cardiologists, ophthalmologists, surgeons, and pediatricians across Nepal.'}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={language === 'np' ? 'डाक्टरको नाम, अस्पताल, वा विशेषज्ञता खोज्नुहोस्...' : 'Search by doctor name, specialty, hospital, or NMC number...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Specialty:</span>
          </div>
          {specialties.slice(0, 5).map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedSpecialty === spec
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {spec === 'all' ? 'All Specialties' : spec.split('&')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDoctors.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No doctors matching your criteria. Try clearing search filters.
          </div>
        ) : (
          filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-lg shrink-0 border border-blue-200/60 dark:border-blue-900/40">
                    🩺
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                      {doc.nmc_number}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold justify-end mt-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{doc.rating}</span>
                      <span className="text-slate-400 font-normal">({doc.reviews_count})</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {doc.name}
                  </h3>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                    {doc.specialty}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {doc.degrees}
                  </p>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.hospital}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.schedule}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white">NPR {doc.fee_npr}</span>
                    <span className="text-[11px] text-slate-400">/ Consultation</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onBookDoctor(doc)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>{language === 'np' ? 'परामर्श बुक गर्नुहोस्' : 'Book Video Consultation'}</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
