// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';
import {
  Navigation,
  MapPin,
  Hospital as HospitalIcon,
  PhoneCall,
  Clock,
  Compass,
  AlertTriangle,
  Plane,
  Radio,
  Building2,
  CheckCircle2,
  Activity,
  LocateFixed,
  Zap,
  Phone,
  Crosshair,
  Map as MapIcon,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Hospital, MedevacBase, Language } from '../types';
import { INITIAL_HOSPITALS, NEPAL_MEDEVAC_BASES } from '../data/mockData';
import { triggerHaptic } from '../utils/haptics';

interface LocationMedevacViewProps {
  language: Language;
  onBookDoctor?: (hospitalId?: string) => void;
  onNavigate?: (tab: string) => void;
}

// Haversine Geodesic Distance Formula in Kilometers
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Preset Locations in Nepal
const PRESET_LOCATIONS = [
  { name: 'Kathmandu Valley', nameNp: 'काठमाडौँ उपत्यका', lat: 27.7172, lng: 85.324, district: 'Kathmandu' },
  { name: 'Pokhara / Kaski', nameNp: 'पोखरा / कास्की', lat: 28.2096, lng: 83.9856, district: 'Kaski' },
  { name: 'Manang / Annapurna Track', nameNp: 'मनाङ / अन्नपूर्ण ट्र्याक', lat: 28.6655, lng: 84.021, district: 'Manang' },
  { name: 'Mustang / Jomsom', nameNp: 'मुस्ताङ / जोमसोम', lat: 28.782, lng: 83.738, district: 'Mustang' },
  { name: 'Lukla / Everest Khumbu', nameNp: 'लुक्ला / एभरेस्ट खुम्बु', lat: 27.6869, lng: 86.729, district: 'Solukhumbu' },
  { name: 'Chitwan / Bharatpur', nameNp: 'चितवन / भरतपुर', lat: 27.683, lng: 84.432, district: 'Chitwan' },
  { name: 'Dharan / Eastern Hub', nameNp: 'धरान / पूर्वी क्षेत्र', lat: 26.8125, lng: 87.2835, district: 'Sunsari' },
  { name: 'Surkhet / Karnali Airbase', nameNp: 'सुर्खेत / कर्णाली एयरबेस', lat: 28.5875, lng: 81.636, district: 'Surkhet' }
];

export const LocationMedevacView: React.FC<LocationMedevacViewProps> = ({
  language,
  onBookDoctor,
  onNavigate
}) => {
  // User Pinged Location State (Default Kathmandu)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; label: string; district?: string }>({
    lat: 27.7172,
    lng: 85.324,
    label: language === 'np' ? 'काठमाडौँ उपत्यका (सुरुवाती स्थान)' : 'Kathmandu Valley (Default Ping)',
    district: 'Kathmandu'
  });

  const [isPingingGps, setIsPingingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<
    | { type: 'hospital'; data: Hospital; distanceKm: number; driveMins: number }
    | { type: 'medevac'; data: MedevacBase; airDistanceKm: number; flightEtaMins: number }
    | null
  >(null);

  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'hospitals' | 'medevac'>('all');

  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  // Ping Current GPS Location
  const handlePingGps = () => {
    triggerHaptic('medium');
    setIsPingingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError(
        language === 'np'
          ? 'तपाईंको ब्राउजरले जीपीएस लोकेशन सपोर्ट गर्दैन।'
          : 'Geolocation is not supported by your browser.'
      );
      setIsPingingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({
          lat,
          lng,
          label: language === 'np' ? `जीपीएस स्थान पिंग गरियो (${lat.toFixed(4)}, ${lng.toFixed(4)})` : `Live GPS Ping (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          district: 'Live Device GPS'
        });
        setIsPingingGps(false);
        triggerHaptic('success');
      },
      (err) => {
        console.warn('GPS Ping error:', err);
        setGpsError(
          language === 'np'
            ? 'जीपीएस लोकेशन प्राप्त गर्न सकिएन। कृपया पूर्व-सेट स्थान चयन गर्नुहोस्।'
            : 'Could not access GPS. Please select a preset region below.'
        );
        setIsPingingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Calculate Distances & Nearest Hospital / Medevac
  const hospitalsWithDistance = useMemo(() => {
    return INITIAL_HOSPITALS.map((h) => {
      const lat = h.lat || 27.7052;
      const lng = h.lng || 85.3142;
      const distanceKm = calculateHaversineDistance(userCoords.lat, userCoords.lng, lat, lng);
      // Nepal Road Winding Multiplier ~1.35x, Avg speed 35 km/h
      const driveMins = Math.round((distanceKm * 1.35 / 35) * 60) + 5;

      return {
        ...h,
        lat,
        lng,
        distanceKm,
        driveMins
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userCoords]);

  const medevacWithDistance = useMemo(() => {
    return NEPAL_MEDEVAC_BASES.map((mb) => {
      const airDistanceKm = calculateHaversineDistance(userCoords.lat, userCoords.lng, mb.lat, mb.lng);
      // Direct Flight ETA: Air distance / Speed + 12 mins scramble/prep
      const flightEtaMins = Math.round((airDistanceKm / mb.avg_speed_kmh) * 60) + (mb.type.includes('Drone') ? 5 : 12);

      return {
        ...mb,
        airDistanceKm,
        flightEtaMins
      };
    }).sort((a, b) => a.airDistanceKm - b.airDistanceKm);
  }, [userCoords]);

  const nearestHospital = hospitalsWithDistance[0];
  const nearestMedevac = medevacWithDistance[0];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-1 sm:px-0 pb-12">
      {/* Banner / Location Control Pod */}
      <div className="rounded-[26px] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 shadow-2xl border border-blue-500/20 relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg">
                <Crosshair className="w-6 h-6 text-white animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {language === 'np' ? 'जीपीएस लोकेशन तथा एयर एम्बुलेन्स / अस्पताल खोजकर्ता' : 'Emergency GPS Location & Nearest Medevac Triage'}
                  </h1>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold tracking-wider uppercase">
                    Live GPS Radar
                  </span>
                </div>
                <p className="text-xs text-blue-200/80 font-medium mt-0.5">
                  {language === 'np'
                    ? 'जीपीएस लोकेशन पिंग गरी सबैभन्दा नजिकको आईसीयू अस्पताल र नेपाली सेना हेलिकप्टर / ड्रोन उद्धार हब पत्ता लगाउनुहोस्'
                    : 'Instant GPS distance calculation to all Nepal tertiary emergency hospitals & Nepal Army airbases'}
                </p>
              </div>
            </div>

            {/* GPS Ping Action Button */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={handlePingGps}
                disabled={isPingingGps}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-blue-600 to-indigo-600 hover:from-red-700 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <LocateFixed className={`w-4 h-4 text-white ${isPingingGps ? 'animate-spin' : ''}`} />
                <span>{isPingingGps ? (language === 'np' ? 'जीपीएस पिंग हुँदैछ...' : 'Pinging GPS Location...') : (language === 'np' ? '📡 मेरो जीपीएस लोकेशन पिंग गर्नुहोस्' : '📡 Ping My Live GPS Location')}</span>
              </button>
            </div>
          </div>

          {/* Current Pinged Coords Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              <div className="text-xs min-w-0">
                <span className="text-slate-400 font-medium">{language === 'np' ? 'वर्तमान पिंग गरिएको स्थान:' : 'Current Pinged Location:'} </span>
                <span className="font-bold text-white font-mono truncate">{userCoords.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 font-bold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Lat: {userCoords.lat.toFixed(4)}, Lng: {userCoords.lng.toFixed(4)}</span>
            </div>
          </div>

          {gpsError && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* Region Presets Carousel */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === 'np' ? 'वा नेपालका मुख्य क्षेत्रहरू चयन गर्नुहोस्:' : 'Or Quick Select Regional Sector in Nepal:'}</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PRESET_LOCATIONS.map((loc) => {
                const isSelected = Math.abs(userCoords.lat - loc.lat) < 0.01 && Math.abs(userCoords.lng - loc.lng) < 0.01;
                return (
                  <button
                    key={loc.name}
                    onClick={() => {
                      triggerHaptic('light');
                      setUserCoords({
                        lat: loc.lat,
                        lng: loc.lng,
                        label: language === 'np' ? loc.nameNp : loc.name,
                        district: loc.district
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md scale-105'
                        : 'bg-white/10 text-slate-200 hover:bg-white/20 border-white/10'
                    }`}
                  >
                    {language === 'np' ? loc.nameNp : loc.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Nearest Medevac & Hospital Callout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nearest Hospital Card */}
        {nearestHospital && (
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border-2 border-emerald-500/30 dark:border-emerald-500/40 shadow-xl relative overflow-hidden group hover:border-emerald-500 transition-all">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                <HospitalIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'np' ? 'सबैभन्दा नजिकको आपतकालीन अस्पताल' : 'Nearest Emergency Tertiary Hospital'}</span>
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {nearestHospital.distanceKm.toFixed(1)} km away
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {language === 'np' ? nearestHospital.name_np : nearestHospital.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{nearestHospital.address}</span>
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">{language === 'np' ? 'सडक सवारी समय' : 'Driving Time'}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> ~{nearestHospital.driveMins} mins
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">{language === 'np' ? 'आईसीयू र आकस्मिक कक्ष' : 'Emergency & ICU'}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-red-500" /> {nearestHospital.beds} Beds • 24/7 ICU
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <a
                  href={`tel:${nearestHospital.emergency}`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call {nearestHospital.emergency}</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Nearest Medevac Airbase Card */}
        {nearestMedevac && (
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border-2 border-red-500/30 dark:border-red-500/40 shadow-xl relative overflow-hidden group hover:border-red-500 transition-all">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-xs font-black uppercase tracking-wider">
                <Plane className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>{language === 'np' ? 'सबैभन्दा नजिकको एयर एम्बुलेन्स / ड्रोन हब' : 'Nearest Medevac Airbase & Drone Hub'}</span>
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800">
                {nearestMedevac.airDistanceKm.toFixed(1)} km air distance
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {language === 'np' ? nearestMedevac.name_np : nearestMedevac.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{nearestMedevac.base_location}</span>
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">{language === 'np' ? 'अनुमानित उडान आगमन' : 'Flight Arrival ETA'}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <Zap className="w-3.5 h-3.5 text-red-600 animate-pulse" /> ~{nearestMedevac.flightEtaMins} mins
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">{language === 'np' ? 'उडान क्षमता र विमान' : 'Aircraft & Fleet'}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate block mt-0.5">
                    {nearestMedevac.aircraft}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <a
                  href={`tel:${nearestMedevac.hotline}`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-white" />
                  <span>Call Air Rescue {nearestMedevac.hotline}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive Google Map Container using @vis.gl/react-google-maps */}
      <div className="rounded-[26px] bg-white dark:bg-[#0F172A] border-2 border-blue-600/20 dark:border-blue-500/30 shadow-2xl overflow-hidden space-y-0">
        {/* Filter Pills */}
        <div className="p-4 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
            <MapIcon className="w-4 h-4 text-blue-600" />
            <span>{language === 'np' ? 'गुगल म्याप्स आपतकालीन ट्राइएज रडार' : 'Interactive Google Maps Triage Radar'}</span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200 dark:bg-slate-900">
            {(['all', 'hospitals', 'medevac'] as const).map((filter) => {
              const isActive = activeTabFilter === filter;
              const label = {
                all: language === 'np' ? 'सबै (All Pins)' : 'Show All Pins',
                hospitals: language === 'np' ? 'अस्पतालहरू (Hospitals)' : 'Hospitals Only',
                medevac: language === 'np' ? 'हवाई उद्धार (Medevac)' : 'Medevac & Drones'
              }[filter];

              return (
                <button
                  key={filter}
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveTabFilter(filter);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Frame */}
        <div className="h-[500px] w-full relative">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={{ lat: userCoords.lat, lng: userCoords.lng }}
              center={{ lat: userCoords.lat, lng: userCoords.lng }}
              defaultZoom={11}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              disableDefaultUI={false}
              className="w-full h-full"
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            >
              {/* User Ping Marker */}
              <AdvancedMarker position={{ lat: userCoords.lat, lng: userCoords.lng }}>
                <div className="relative group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-red-600/30 animate-ping absolute inset-0" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-blue-600 text-white border-2 border-white shadow-xl flex items-center justify-center relative z-10">
                    <Crosshair className="w-5 h-5 text-white" />
                  </div>
                </div>
              </AdvancedMarker>

              {/* Hospital Markers */}
              {(activeTabFilter === 'all' || activeTabFilter === 'hospitals') &&
                hospitalsWithDistance.map((h) => (
                  <AdvancedMarker
                    key={h.id}
                    position={{ lat: h.lat, lng: h.lng }}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedEntity({
                        type: 'hospital',
                        data: h,
                        distanceKm: h.distanceKm,
                        driveMins: h.driveMins
                      });
                    }}
                  >
                    <Pin
                      background={h.id === nearestHospital?.id ? '#10B981' : '#2563EB'}
                      borderColor="#FFFFFF"
                      glyphColor="#FFFFFF"
                    >
                      <HospitalIcon className="w-4 h-4 text-white" />
                    </Pin>
                  </AdvancedMarker>
                ))}

              {/* Medevac Base Markers */}
              {(activeTabFilter === 'all' || activeTabFilter === 'medevac') &&
                medevacWithDistance.map((mb) => (
                  <AdvancedMarker
                    key={mb.id}
                    position={{ lat: mb.lat, lng: mb.lng }}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedEntity({
                        type: 'medevac',
                        data: mb,
                        airDistanceKm: mb.airDistanceKm,
                        flightEtaMins: mb.flightEtaMins
                      });
                    }}
                  >
                    <Pin background="#DC2626" borderColor="#FFFFFF" glyphColor="#FFFFFF">
                      <Plane className="w-4 h-4 text-white" />
                    </Pin>
                  </AdvancedMarker>
                ))}

              {/* InfoWindow for Clicked Entity */}
              {selectedEntity && (
                <InfoWindow
                  position={{
                    lat: selectedEntity.data.lat,
                    lng: selectedEntity.data.lng
                  }}
                  onCloseClick={() => setSelectedEntity(null)}
                >
                  <div className="p-2 space-y-2 max-w-xs text-slate-900">
                    <div className="flex items-center gap-1.5 font-bold text-xs border-b pb-1.5">
                      {selectedEntity.type === 'hospital' ? (
                        <HospitalIcon className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Plane className="w-4 h-4 text-red-600" />
                      )}
                      <span className="truncate">{selectedEntity.data.name}</span>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      {selectedEntity.type === 'hospital'
                        ? selectedEntity.data.address
                        : (selectedEntity.data as MedevacBase).base_location}
                    </p>

                    <div className="p-2 rounded-lg bg-slate-100 text-[11px] font-bold space-y-1">
                      {selectedEntity.type === 'hospital' ? (
                        <>
                          <div className="flex justify-between">
                            <span>Distance:</span>
                            <span className="text-emerald-700">{selectedEntity.distanceKm.toFixed(1)} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Drive Time:</span>
                            <span>~{selectedEntity.driveMins} mins</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span>Air Distance:</span>
                            <span className="text-red-700">{(selectedEntity as any).airDistanceKm.toFixed(1)} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Flight ETA:</span>
                            <span className="text-red-700 font-extrabold">~{(selectedEntity as any).flightEtaMins} mins</span>
                          </div>
                        </>
                      )}
                    </div>

                    <a
                      href={`tel:${
                        selectedEntity.type === 'hospital'
                          ? selectedEntity.data.emergency
                          : (selectedEntity.data as MedevacBase).hotline
                      }`}
                      className="w-full py-1.5 rounded-lg bg-red-600 text-white font-bold text-[11px] flex items-center justify-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3 text-white" />
                      <span>
                        Call {selectedEntity.type === 'hospital' ? selectedEntity.data.emergency : (selectedEntity.data as MedevacBase).hotline}
                      </span>
                    </a>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>
      </div>

      {/* Complete Distance Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tertiary Hospitals Distance Table */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>{language === 'np' ? 'नेपालका आपतकालीन अस्पतालहरू (दूरी अनुसार)' : 'Nepal Emergency Hospitals (Ranked by Distance)'}</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500">{hospitalsWithDistance.length} Facilities</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 text-slate-500 font-bold">Hospital Name</th>
                  <th className="p-3 text-slate-500 font-bold">Distance</th>
                  <th className="p-3 text-slate-500 font-bold">Drive ETA</th>
                  <th className="p-3 text-slate-500 font-bold">Hotline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {hospitalsWithDistance.map((h, i) => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {i === 0 && <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-white text-[9px] font-black">NEAREST</span>}
                        <span>{language === 'np' ? h.name_np : h.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{h.district} • {h.beds} Beds</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {h.distanceKm.toFixed(1)} km
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      ~{h.driveMins} mins
                    </td>
                    <td className="p-3">
                      <a
                        href={`tel:${h.emergency}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white font-bold text-[11px] text-slate-800 dark:text-slate-200 transition-all inline-flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Medevac Airbases & Drone Hubs Table */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-600 animate-pulse" />
              <span>{language === 'np' ? 'नेपाल सेना हेलिकप्टर र ड्रोन हब (दूरी अनुसार)' : 'Nepal Medevac Airbases & Drones (Ranked by Flight ETA)'}</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500">{medevacWithDistance.length} Airbases</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 text-slate-500 font-bold">Airbase / Drone Hub</th>
                  <th className="p-3 text-slate-500 font-bold">Air Line</th>
                  <th className="p-3 text-slate-500 font-bold">Flight ETA</th>
                  <th className="p-3 text-slate-500 font-bold">Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {medevacWithDistance.map((mb, i) => (
                  <tr key={mb.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {i === 0 && <span className="px-1.5 py-0.2 rounded-md bg-red-600 text-white text-[9px] font-black">NEAREST</span>}
                        <span>{language === 'np' ? mb.name_np : mb.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{mb.aircraft} • {mb.base_location}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-red-600 dark:text-red-400">
                      {mb.airDistanceKm.toFixed(1)} km
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      ~{mb.flightEtaMins} mins
                    </td>
                    <td className="p-3">
                      <a
                        href={`tel:${mb.hotline}`}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-all inline-flex items-center gap-1 shadow-sm"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Dispatch</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
