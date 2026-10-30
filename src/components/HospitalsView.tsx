import React, { useState, useMemo } from 'react';
import {
  Search,
  Building2,
  Phone,
  PhoneCall,
  Mail,
  MessageSquare,
  MessageCircle,
  Bed,
  Check,
  Sparkles,
  MapPin,
  Globe,
  ExternalLink,
  Plus,
  X,
  ShieldCheck,
  Activity,
  Compass,
  AlertCircle
} from 'lucide-react';
import { Hospital, Language } from '../types';
import { t } from '../data/mockData';
import { api } from '../services/api';

interface HospitalsViewProps {
  hospitals: Hospital[];
  language: Language;
  onOpenChat: (hospital: Hospital) => void;
  onNavigateToMap?: () => void;
  onHospitalAdded?: (hospital: Hospital) => void;
}

export const HospitalsView: React.FC<HospitalsViewProps> = ({
  hospitals,
  language,
  onOpenChat,
  onNavigateToMap,
  onHospitalAdded
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);
  const [addErrorMessage, setAddErrorMessage] = useState<string | null>(null);

  // Form state for adding new hospital
  const [formName, setFormName] = useState('');
  const [formNameNp, setFormNameNp] = useState('');
  const [formDistrict, setFormDistrict] = useState('Kathmandu');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmergency, setFormEmergency] = useState('102');
  const [formBeds, setFormBeds] = useState('50');
  const [formIcu, setFormIcu] = useState(true);
  const [formOxygen, setFormOxygen] = useState(true);
  const [formBloodBank, setFormBloodBank] = useState(true);
  const [formHelipad, setFormHelipad] = useState(false);
  const [formLat, setFormLat] = useState('27.7000');
  const [formLng, setFormLng] = useState('85.3200');
  const [formSpecialties, setFormSpecialties] = useState('Emergency & Trauma, General Medicine');

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
        const searchable = `${h.name} ${h.name_np || ''} ${h.district} ${h.address} ${(h.specialties || []).join(' ')} ${h.type || ''}`.toLowerCase();
        if (!searchable.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [hospitals, selectedDistrict, searchQuery]);

  const handleQuickCoord = (lat: string, lng: string, districtName: string, sampleAddress: string) => {
    setFormLat(lat);
    setFormLng(lng);
    setFormDistrict(districtName);
    if (!formAddress) setFormAddress(sampleAddress);
  };

  const handleDetectGPS = () => {
    if (typeof window !== 'undefined' && navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormLat(pos.coords.latitude.toFixed(4));
          setFormLng(pos.coords.longitude.toFixed(4));
        },
        () => {
          // Low accuracy network fallback
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setFormLat(pos.coords.latitude.toFixed(4));
              setFormLng(pos.coords.longitude.toFixed(4));
            },
            () => {
              setFormLat('27.7172');
              setFormLng('85.3240');
            },
            { enableHighAccuracy: false, timeout: 6000 }
          );
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setAddErrorMessage('Hospital name is required.');
      return;
    }

    setIsSubmitting(true);
    setAddErrorMessage(null);

    const newHosp: Partial<Hospital> = {
      id: `hosp_${Date.now()}`,
      name: formName.trim(),
      name_np: formNameNp.trim() || formName.trim(),
      district: formDistrict,
      address: formAddress.trim() || `${formDistrict}, Nepal`,
      phone: formPhone.trim() || '+977-1-4000000',
      emergency: formEmergency.trim() || '102',
      email: 'info@hospital.np',
      type: 'Teaching',
      beds: Number(formBeds) || 50,
      icu: formIcu,
      specialties: formSpecialties.split(',').map((s) => s.trim()).filter(Boolean),
      open_247: true,
      rating: 4.8,
      lat: Number(formLat) || 27.7052,
      lng: Number(formLng) || 85.3142,
      description: `Verified medical facility recorded in Xenon database with 24/7 care.${formOxygen ? ' Oxygen plant available.' : ''}${formBloodBank ? ' Blood bank on site.' : ''}`
    };

    try {
      const res = await api.createHospital(newHosp);
      if (res.success && res.hospital) {
        if (onHospitalAdded) {
          onHospitalAdded(res.hospital);
        }
        setAddSuccessMessage(
          language === 'np'
            ? `अस्पताल "${res.hospital.name}" सफलतापूर्वक डाटाबेसमा दर्ता भयो!`
            : `Hospital "${res.hospital.name}" successfully registered in database!`
        );
        setTimeout(() => {
          setIsAddModalOpen(false);
          setAddSuccessMessage(null);
          // Reset form
          setFormName('');
          setFormNameNp('');
          setFormAddress('');
          setFormPhone('');
        }, 1500);
      } else {
        setAddErrorMessage(res.error || 'Failed to register hospital in database');
      }
    } catch (err: any) {
      setAddErrorMessage(err?.message || 'Error communicating with database');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Google Maps Radar Navigation Banner */}
      {onNavigateToMap && (
        <div className="rounded-[22px] bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white p-4 sm:p-5 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/30 text-blue-300 border border-blue-400/30 shrink-0">
              <MapPin className="w-5 h-5 text-blue-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">
                  {language === 'np' ? 'आपतकालीन जीपीएस गुगल नक्सा तथा दूरी रडार' : 'Emergency GPS Live Map & Hospital Radar'}
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                  Google Maps
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5 font-medium">
                {language === 'np'
                  ? 'तपाईंको लाइभ जीपीएस स्थानबाट सबैभन्दा नजिकको अस्पताल र सेना उद्धार हेलिकप्टर बेस पत्ता लगाउनुहोस्'
                  : 'Ping your live GPS to discover nearest emergency hospitals, driving time & air medevac dispatch bases'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToMap}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
          >
            <MapPin className="w-4 h-4" />
            <span>{language === 'np' ? 'गुगल नक्सामा हेर्नुहोस् →' : 'Open Live Google Map →'}</span>
          </button>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="rounded-[22px] bg-white dark:bg-[#0F172A] p-5 border border-black/[0.08] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600 dark:text-red-400" />
            <input
              type="text"
              placeholder={t('searchHospitals', language)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-xs text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* ADD HOSPITAL BUTTON (Persists directly to database) */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'np' ? 'अस्पताल थप्नुहोस्' : '+ Add Hospital'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
          {districts.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDistrict(d)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedDistrict === d
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
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
          const cleanPhone = (hosp.phone || '').replace(/[^0-9+]/g, '');
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
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 text-teal-400 flex items-center justify-center shadow-sm border border-teal-500/20 shrink-0">
                      <Building2 className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-sm text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                          {language === 'np' ? hosp.name_np || hosp.name : hosp.name}
                        </h3>
                        {hosp.id === 'hosp_020' && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-black">
                            GATTHAGHAR HUB
                          </span>
                        )}
                        {hosp.id === 'hosp_011' && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black">
                            DHUMBARAHI HUB
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-black/60 dark:text-white/60 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>{hosp.address}</span>
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] text-[10px] font-bold text-black/70 dark:text-white/70 border border-black/5 dark:border-white/5 shrink-0">
                    {hosp.district}
                  </span>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1.5 my-3.5">
                  {(hosp.specialties || []).map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[10px] font-bold border border-red-200/50 dark:border-red-900/40"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Facilities Pills */}
                <div className="flex items-center gap-3 text-xs text-black/70 dark:text-white/70 py-2 border-y border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold">{hosp.beds || 50}</span>
                    <span className="text-[11px] text-black/50 dark:text-white/50">{t('beds', language)}</span>
                  </div>
                  {hosp.icu && (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('icuAvailable', language)}</span>
                    </div>
                  )}
                  {hosp.open_247 && (
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-[11px] ml-auto">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>24/7</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${hosp.emergency || hosp.phone}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Emergency ({hosp.emergency || '102'})</span>
                  </a>

                  <a
                    href={`tel:${hosp.phone}`}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center transition-colors"
                    title="Reception Hotline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={smsUri}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center transition-colors"
                    title="Send SMS"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenChat(hosp)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{t('chatWithHospital', language)}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD HOSPITAL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-600 text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {language === 'np' ? 'नयाँ अस्पताल दर्ता गर्नुहोस्' : 'Register New Hospital'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Saves directly to Cloud SQL & Xenon database
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addSuccessMessage && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{addSuccessMessage}</span>
              </div>
            )}

            {addErrorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hospital Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nagarik Community Teaching Hospital"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    अस्पतालको नाम (नेपाली)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा: नागरिक कम्युनिटी टिचिङ हस्पिटल"
                    value={formNameNp}
                    onChange={(e) => setFormNameNp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    District
                  </label>
                  <select
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Kathmandu">Kathmandu (काठमाडौं)</option>
                    <option value="Bhaktapur">Bhaktapur (भक्तपुर - गठ्ठाघर/ठिमी)</option>
                    <option value="Lalitpur">Lalitpur (ललितपुर - पाटन)</option>
                    <option value="Kaski">Kaski / Pokhara (कास्की/पोखरा)</option>
                    <option value="Chitwan">Chitwan / Bharatpur (चितवन)</option>
                    <option value="Morang">Morang / Biratnagar (मोरङ)</option>
                    <option value="Banke">Banke / Nepalgunj (बाँके)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Street Address & Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gatthaghar, Araniko Highway"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reception Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+977-1-6635200"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Ambulance Hotline
                  </label>
                  <input
                    type="text"
                    placeholder="102 or +977-1-6635201"
                    value={formEmergency}
                    onChange={(e) => setFormEmergency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Coordinates & Quick Pre-fills */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-500" />
                    <span>GPS Coordinates (Lat / Lng)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 cursor-pointer"
                  >
                    Detect My GPS
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Latitude (e.g. 27.6788)"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Longitude (e.g. 85.3670)"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickCoord('27.6788', '85.3670', 'Bhaktapur', 'Gatthaghar, Bhaktapur')}
                    className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold cursor-pointer"
                  >
                    Gatthaghar (27.6788, 85.3670)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCoord('27.7329', '85.3444', 'Kathmandu', 'Dhumbarahi, Kathmandu')}
                    className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold cursor-pointer"
                  >
                    Dhumbarahi (27.7329, 85.3444)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCoord('27.6685', '85.3206', 'Lalitpur', 'Patan, Lalitpur')}
                    className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold cursor-pointer"
                  >
                    Patan (27.6685, 85.3206)
                  </button>
                </div>
              </div>

              {/* Beds & Facilities */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Beds
                  </label>
                  <input
                    type="number"
                    value={formBeds}
                    onChange={(e) => setFormBeds(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Specialties (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formSpecialties}
                    onChange={(e) => setFormSpecialties(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIcu}
                    onChange={(e) => setFormIcu(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">24/7 ICU</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formOxygen}
                    onChange={(e) => setFormOxygen(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">Oxygen</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formBloodBank}
                    onChange={(e) => setFormBloodBank(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">Blood Bank</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formHelipad}
                    onChange={(e) => setFormHelipad(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">Helipad</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Saving to Database...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{language === 'np' ? 'डाटाबेसमा सुरक्षित गर्नुहोस्' : 'Save Hospital to Database'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
