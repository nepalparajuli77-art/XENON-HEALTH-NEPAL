// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
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
  ExternalLink,
  Route,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Search,
  X,
  Check,
  Radio as SignalIcon
} from 'lucide-react';
import { Hospital, MedevacBase, Language } from '../types';
import { INITIAL_HOSPITALS, NEPAL_MEDEVAC_BASES } from '../data/mockData';
import { triggerHaptic } from '../utils/haptics';

interface LocationMedevacViewProps {
  language: Language;
  onBookDoctor?: (hospitalId?: string) => void;
  onNavigate?: (tab: string) => void;
  hospitals?: Hospital[];
  preselectedHospital?: Hospital | null;
}

export interface ComputedRouteInfo {
  distance: string;
  distanceValueMeters: number;
  duration: string;
  durationValueSeconds: number;
  summary: string;
  startAddress: string;
  endAddress: string;
  steps: string[];
  trafficStatus?: string;
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

// Searchable Neighborhoods, Districts and Hospital POIs
interface SearchableLocationItem {
  id: string;
  name: string;
  nameNp: string;
  category: 'neighborhood' | 'hospital' | 'city';
  lat: number;
  lng: number;
  district: string;
  details?: string;
}

const SEARCHABLE_LOCATIONS: SearchableLocationItem[] = [
  // Neighborhoods & Sub-hubs in Kathmandu Valley
  { id: 'loc_gatthaghar', name: 'Gatthaghar, Madhyapur Thimi', nameNp: 'गठ्ठाघर, मध्यपुर थिमी (भक्तपुर)', category: 'neighborhood', lat: 27.6788, lng: 85.3670, district: 'Bhaktapur', details: 'Araniko Highway corridor' },
  { id: 'loc_thimi', name: 'Madhyapur Thimi / Radhe Radhe', nameNp: 'मध्यपुर थिमी / राधे राधे', category: 'neighborhood', lat: 27.6830, lng: 85.3850, district: 'Bhaktapur', details: 'Central Bhaktapur junction' },
  { id: 'loc_suryabinayak', name: 'Suryabinayak / Bhaktapur City', nameNp: 'सूर्यविनायक / भक्तपुर', category: 'neighborhood', lat: 27.6710, lng: 85.4298, district: 'Bhaktapur', details: 'Historical valley east hub' },
  { id: 'loc_sallaghari', name: 'Sallaghari, Bhaktapur', nameNp: 'सल्लाघारी, भक्तपुर', category: 'neighborhood', lat: 27.6720, lng: 85.4050, district: 'Bhaktapur', details: 'Araniko Highway intersection' },
  { id: 'loc_dhumbarahi', name: 'Dhumbarahi, Kathmandu', nameNp: 'धुम्बाराही, काठमाडौँ', category: 'neighborhood', lat: 27.7329, lng: 85.3444, district: 'Kathmandu', details: 'Ring road north corridor' },
  { id: 'loc_koteshwor', name: 'Koteshwor / Jadibuti', nameNp: 'कोटेश्वर / जडीबुटी', category: 'neighborhood', lat: 27.6782, lng: 85.3488, district: 'Kathmandu', details: 'Valley eastern gateway' },
  { id: 'loc_baneshwor', name: 'New Baneshwor / Shankhamul', nameNp: 'नयाँ बानेश्वर / शंखमुल', category: 'neighborhood', lat: 27.6915, lng: 85.3420, district: 'Kathmandu', details: 'Central administrative zone' },
  { id: 'loc_minbhawan', name: 'Minbhawan / Tinkune', nameNp: 'मीनभवन / तीनकुने', category: 'neighborhood', lat: 27.6872, lng: 85.3424, district: 'Kathmandu', details: 'Civil Hospital area' },
  { id: 'loc_sinamangal', name: 'Sinamangal / TIA Airport', nameNp: 'सिनामंगल / विमानस्थल', category: 'neighborhood', lat: 27.6961, lng: 85.3533, district: 'Kathmandu', details: 'KMC Hospital vicinity' },
  { id: 'loc_chabahil', name: 'Chabahil / Bouddha', nameNp: 'चाबहिल / बौद्ध', category: 'neighborhood', lat: 27.7176, lng: 85.3503, district: 'Kathmandu', details: 'Northeast Kathmandu hub' },
  { id: 'loc_maharajgunj', name: 'Maharajgunj / Teaching', nameNp: 'महाराजगञ्ज / शिक्षण अस्पताल', category: 'neighborhood', lat: 27.7360, lng: 85.3303, district: 'Kathmandu', details: 'TUTH & Kanti Medical zone' },
  { id: 'loc_bansbari', name: 'Bansbari / Golfutar', nameNp: 'बाँसबारी / गोल्फुटार', category: 'neighborhood', lat: 27.7402, lng: 85.3377, district: 'Kathmandu', details: 'Gangalal Heart Centre area' },
  { id: 'loc_dhapasi', name: 'Dhapasi / Tokha', nameNp: 'धापासी / टोखा', category: 'neighborhood', lat: 27.7516, lng: 85.3276, district: 'Kathmandu', details: 'Grande Hospital sector' },
  { id: 'loc_thapathali', name: 'Thapathali / Maitighar', nameNp: 'थापाथली / माइतीघर', category: 'neighborhood', lat: 27.6917, lng: 85.3197, district: 'Kathmandu', details: 'Norvic & bridge corridor' },
  { id: 'loc_teku', name: 'Tripureshwor / Teku', nameNp: 'त्रिपुरेश्वर / टेकु', category: 'neighborhood', lat: 27.6968, lng: 85.3149, district: 'Kathmandu', details: 'Sukraraj Hospital sector' },
  { id: 'loc_kalanki', name: 'Kalanki / Balkhu', nameNp: 'कलंकी / बल्खु', category: 'neighborhood', lat: 27.6936, lng: 85.2818, district: 'Kathmandu', details: 'Western highway gateway' },
  { id: 'loc_gwarko', name: 'Gwarko / Balkumari / Imadol', nameNp: 'ग्वार्को / बालकुमारी', category: 'neighborhood', lat: 27.6657, lng: 85.3323, district: 'Lalitpur', details: 'B&B Hospital sector' },
  { id: 'loc_lagankhel', name: 'Lagankhel / Jawalakhel / Patan', nameNp: 'लगनखेल / जावलाखेल / पाटन', category: 'neighborhood', lat: 27.6687, lng: 85.3204, district: 'Lalitpur', details: 'Patan Hospital heart' },
  { id: 'loc_bhaisepati', name: 'Bhaisepati / Ekantakuna', nameNp: 'भैँसेपाटी / एकान्तकुना', category: 'neighborhood', lat: 27.6599, lng: 85.3045, district: 'Lalitpur', details: 'Mediciti Hospital zone' },
  { id: 'loc_jorpati', name: 'Jorpati / Gokarneshwor', nameNp: 'जोरपाटी / गोकर्णेश्वर', category: 'neighborhood', lat: 27.7214, lng: 85.3787, district: 'Kathmandu', details: 'NMC Hospital zone' },
  { id: 'loc_banepa', name: 'Banepa / Dhulikhel', nameNp: 'बनेपा / धुलिखेल', category: 'city', lat: 27.6298, lng: 85.5214, district: 'Kavrepalanchok', details: 'Araniko Highway east' },
  { id: 'loc_pokhara', name: 'Pokhara / Kaski', nameNp: 'पोखरा / कास्की', category: 'city', lat: 28.2096, lng: 83.9856, district: 'Kaski', details: 'Western emergency hub' },
  { id: 'loc_chitwan', name: 'Bharatpur / Chitwan', nameNp: 'भरतपुर / चितवन', category: 'city', lat: 27.6830, lng: 84.4320, district: 'Chitwan', details: 'Central Terai medical hub' },
  { id: 'loc_dharan', name: 'Dharan / Eastern Hub', nameNp: 'धरान / पूर्वी क्षेत्र', category: 'city', lat: 26.8125, lng: 87.2835, district: 'Sunsari', details: 'BPKIHS medical academy' },
  { id: 'loc_surkhet', name: 'Surkhet / Karnali', nameNp: 'सुर्खेत / कर्णाली', category: 'city', lat: 28.5875, lng: 81.6360, district: 'Surkhet', details: 'Mid-western airbase hub' },
  { id: 'loc_lukla', name: 'Lukla / Everest Khumbu', nameNp: 'लुक्ला / खुम्बु', category: 'city', lat: 27.6869, lng: 86.7290, district: 'Solukhumbu', details: 'Alpine rescue hub' },
  { id: 'loc_manang', name: 'Manang / Annapurna Track', nameNp: 'मनाङ / अन्नपूर्ण', category: 'city', lat: 28.6655, lng: 84.0210, district: 'Manang', details: 'HRA high altitude post' },
  { id: 'loc_mustang', name: 'Mustang / Jomsom', nameNp: 'मुस्ताङ / जोमसोम', category: 'city', lat: 28.7820, lng: 83.7380, district: 'Mustang', details: 'Northern transit post' },

  // Direct Hospital searchable items
  { id: 'loc_hosp_nagarik', name: 'Nagarik Community Teaching Hospital (Gatthaghar)', nameNp: 'नागरिक सामुदायिक शिक्षण अस्पताल (गठ्ठाघर)', category: 'hospital', lat: 27.6788, lng: 85.3670, district: 'Bhaktapur', details: '24/7 ICU & Trauma Hub' },
  { id: 'loc_hosp_hams', name: 'HAMS Hospital (Dhumbarahi)', nameNp: 'ह्याम्स हस्पिटल (धुम्बाराही)', category: 'hospital', lat: 27.7329, lng: 85.3444, district: 'Kathmandu', details: 'Critical Care & Surgery' },
  { id: 'loc_hosp_patan', name: 'Patan Hospital (Lagankhel)', nameNp: 'पाटन अस्पताल (लगनखेल)', category: 'hospital', lat: 27.6687, lng: 85.3204, district: 'Lalitpur', details: 'Non-profit tertiary care' },
  { id: 'loc_hosp_bb', name: 'B&B Hospital (Gwarko)', nameNp: 'बी एण्ड बी अस्पताल (ग्वार्को)', category: 'hospital', lat: 27.6657, lng: 85.3323, district: 'Lalitpur', details: 'Orthopedics & Trauma' },
  { id: 'loc_hosp_tuth', name: 'TU Teaching Hospital TUTH (Maharajgunj)', nameNp: 'त्रि.वि. शिक्षण अस्पताल (महाराजगञ्ज)', category: 'hospital', lat: 27.7360, lng: 85.3303, district: 'Kathmandu', details: 'Premier academic referral' },
  { id: 'loc_hosp_bir', name: 'Bir Hospital & National Trauma Centre', nameNp: 'वीर अस्पताल तथा ट्रमा सेन्टर', category: 'hospital', lat: 27.7042, lng: 85.3142, district: 'Kathmandu', details: 'National central public hub' },
  { id: 'loc_hosp_civil', name: 'Civil Service Hospital (Minbhawan)', nameNp: 'निजामती कर्मचारी अस्पताल (मीनभवन)', category: 'hospital', lat: 27.6872, lng: 85.3424, district: 'Kathmandu', details: 'Modern diagnostics' },
  { id: 'loc_hosp_kmc', name: 'Kathmandu Medical College KMC (Sinamangal)', nameNp: 'काठमाडौं मेडिकल कलेज (सिनामंगल)', category: 'hospital', lat: 27.6961, lng: 85.3533, district: 'Kathmandu', details: 'Academic tertiary care' },
  { id: 'loc_hosp_mediciti', name: 'Nepal Mediciti Hospital (Bhaisepati)', nameNp: 'नेपाल मेडिसिटी हस्पिटल (भैँसेपाटी)', category: 'hospital', lat: 27.6599, lng: 85.3045, district: 'Lalitpur', details: 'Quaternary Helipad Hospital' },
  { id: 'loc_hosp_gangalal', name: 'Shahid Gangalal Heart Centre (Bansbari)', nameNp: 'शहीद गंगालाल हृदय केन्द्र (बाँसबारी)', category: 'hospital', lat: 27.7402, lng: 85.3377, district: 'Kathmandu', details: 'National cardiac apex' },
  { id: 'loc_hosp_kanti', name: 'Kanti Children’s Hospital (Maharajgunj)', nameNp: 'कान्ति बाल अस्पताल (महाराजगञ्ज)', category: 'hospital', lat: 27.7375, lng: 85.3312, district: 'Kathmandu', details: 'Pediatric emergency' },
  { id: 'loc_hosp_sukraraj', name: 'Sukraraj Tropical Hospital (Teku)', nameNp: 'शुक्रराज ट्रपिकल अस्पताल (टेकु)', category: 'hospital', lat: 27.6983, lng: 85.3041, district: 'Kathmandu', details: 'Rabies, snakebite & infections' },
  { id: 'loc_hosp_norvic', name: 'Norvic International Hospital (Thapathali)', nameNp: 'नर्भिक इन्टरनेशनल हस्पिटल (थापाथली)', category: 'hospital', lat: 27.6917, lng: 85.3197, district: 'Kathmandu', details: 'Multi-specialty cardiac' },
  { id: 'loc_hosp_grande', name: 'Grande International Hospital (Dhapasi)', nameNp: 'ग्रान्डी इन्टरनेशनल हस्पिटल (धापासी)', category: 'hospital', lat: 27.7516, lng: 85.3276, district: 'Kathmandu', details: 'Quaternary with rooftop helipad' },
  { id: 'loc_hosp_om', name: 'Om Hospital (Chabahil)', nameNp: 'ओम हस्पिटल (चाबहिल)', category: 'hospital', lat: 27.7176, lng: 85.3503, district: 'Kathmandu', details: 'Surgical & Laparoscopy' }
];

const FALLBACK_MAPS_KEY = 'AIzaSyALom9O46yLbzkV_GOnAjOl6B6sUpODgbE';

// Helper to resolve reverse geocode or proximity to nearest known neighborhood/city
const resolveLocationName = async (lat: number, lng: number, lang: Language): Promise<string> => {
  // Proximity check against SEARCHABLE_LOCATIONS neighborhoods and cities
  let bestMatch: { name: string; nameNp: string; dist: number } | null = null;
  for (const loc of SEARCHABLE_LOCATIONS) {
    const d = calculateHaversineDistance(lat, lng, loc.lat, loc.lng);
    if (!bestMatch || d < bestMatch.dist) {
      bestMatch = { name: loc.name, nameNp: loc.nameNp, dist: d };
    }
  }

  if (bestMatch && bestMatch.dist <= 2.8) {
    return lang === 'np' ? `📍 लाइभ: ${bestMatch.nameNp}` : `📍 Live: ${bestMatch.name}`;
  }

  // Fallback to high accuracy coordinates
  return lang === 'np'
    ? `📍 लाइभ जीपीएस (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    : `📍 Live Device GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
};

// Quick Select Chips (Neutral major hubs, Nagarik removed as default)
const QUICK_SELECT_CHIPS = [
  { name: 'Kathmandu Central', nameNp: 'काठमाडौँ केन्द्र', lat: 27.7172, lng: 85.324, district: 'Kathmandu' },
  { name: 'Lalitpur / Patan', nameNp: 'पाटन / ललितपुर', lat: 27.6687, lng: 85.3204, district: 'Lalitpur' },
  { name: 'New Baneshwor', nameNp: 'नयाँ बानेश्वर', lat: 27.6915, lng: 85.3420, district: 'Kathmandu' },
  { name: 'Maharajgunj / Teaching', nameNp: 'महाराजगञ्ज / शिक्षण अस्पताल', lat: 27.7360, lng: 85.3303, district: 'Kathmandu' },
  { name: 'Dhumbarahi / Ring Road', nameNp: 'धुम्बाराही / रिङरोड', lat: 27.7329, lng: 85.3444, district: 'Kathmandu' },
  { name: 'Koteshwor / Tinkune', nameNp: 'कोटेश्वर / तीनकुने', lat: 27.6782, lng: 85.3488, district: 'Kathmandu' },
  { name: 'Bhaktapur Durbar Area', nameNp: 'भक्तपुर दरबार क्षेत्र', lat: 27.6710, lng: 85.4298, district: 'Bhaktapur' },
  { name: 'Pokhara / Kaski', nameNp: 'पोखरा / कास्की', lat: 28.2096, lng: 83.9856, district: 'Kaski' },
  { name: 'Chitwan / Bharatpur', nameNp: 'चितवन / भरतपुर', lat: 27.683, lng: 84.432, district: 'Chitwan' },
  { name: 'Dharan / Eastern Hub', nameNp: 'धरान / पूर्वी क्षेत्र', lat: 26.8125, lng: 87.2835, district: 'Sunsari' }
];

/**
 * DirectionsRendererChild:
 * Uses @vis.gl/react-google-maps useMap() and useMapsLibrary('routes')
 * to invoke Google Maps DirectionsService and render high-visibility
 * emergency transit polyline with real directions on the map.
 */
interface DirectionsRendererChildProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number } | null;
  onRouteComputed: (data: ComputedRouteInfo | null) => void;
  onCalculatingStateChange: (loading: boolean) => void;
  onError: (err: string | null) => void;
}

const DirectionsRendererChild: React.FC<DirectionsRendererChildProps> = ({
  origin,
  destination,
  onRouteComputed,
  onCalculatingStateChange,
  onError
}) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;

    const service = new routesLibrary.DirectionsService();
    const renderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: false,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: '#2563EB',
        strokeWeight: 6,
        strokeOpacity: 0.9
      }
    });

    setDirectionsService(service);
    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
    };
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    if (!destination) {
      directionsRenderer.setDirections({ routes: [] });
      onRouteComputed(null);
      onError(null);
      onCalculatingStateChange(false);
      return;
    }

    onCalculatingStateChange(true);
    onError(null);

    directionsService.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      },
      (response, status) => {
        onCalculatingStateChange(false);
        if (status === google.maps.DirectionsStatus.OK && response && response.routes.length > 0) {
          directionsRenderer.setDirections(response);
          const primaryRoute = response.routes[0];
          const leg = primaryRoute.legs[0];

          const stepsList = (leg.steps || []).map((step) => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = step.instructions || '';
            return tempDiv.textContent || tempDiv.innerText || step.instructions || '';
          });

          onRouteComputed({
            distance: leg.distance?.text || `${(leg.distance?.value || 0) / 1000} km`,
            distanceValueMeters: leg.distance?.value || 0,
            duration: leg.duration?.text || '',
            durationValueSeconds: leg.duration?.value || 0,
            summary: primaryRoute.summary || 'Fastest Emergency Transit',
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            steps: stepsList
          });
          onError(null);
        } else {
          console.warn('Google Maps Directions Service returned status:', status);
          directionsRenderer.setDirections({ routes: [] });
          onError(`Directions status: ${status}. Switched to GPS Geodesic Corridor.`);
          onRouteComputed(null);
        }
      }
    );
  }, [directionsService, directionsRenderer, origin.lat, origin.lng, destination?.lat, destination?.lng]);

  return null;
};

const MapTouchPanController: React.FC<{
  panTarget: { lat: number; lng: number } | null;
  userCoords: { lat: number; lng: number };
}> = ({ panTarget, userCoords }) => {
  const map = useMap();
  const lastKey = useRef<string>('');

  useEffect(() => {
    if (!map) return;
    const target = panTarget || userCoords;
    if (!target || !target.lat || !target.lng) return;
    const key = `${target.lat.toFixed(4)},${target.lng.toFixed(4)}`;
    if (lastKey.current !== key) {
      lastKey.current = key;
      map.panTo(target);
    }
  }, [map, panTarget, userCoords.lat, userCoords.lng]);

  return null;
};

const MapTouchOverlayButtons: React.FC<{
  onRecenterGPS: () => void;
  onRecenterHospital?: () => void;
  hasHospital: boolean;
}> = ({ onRecenterGPS, onRecenterHospital, hasHospital }) => {
  const map = useMap();

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
      <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => {
            if (map) map.setZoom((map.getZoom() || 11) + 1);
          }}
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <span className="text-base font-bold leading-none">+</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (map) map.setZoom((map.getZoom() || 11) - 1);
          }}
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <span className="text-base font-bold leading-none">-</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onRecenterGPS}
        className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors flex items-center justify-center cursor-pointer"
        title="Center GPS"
      >
        <Crosshair className="w-4 h-4" />
      </button>

      {hasHospital && (
        <button
          type="button"
          onClick={onRecenterHospital}
          className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors flex items-center justify-center cursor-pointer"
          title="Center Hospital"
        >
          <HospitalIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export const LocationMedevacView: React.FC<LocationMedevacViewProps> = ({
  language,
  onBookDoctor,
  onNavigate,
  hospitals = INITIAL_HOSPITALS,
  preselectedHospital = null
}) => {
  // Live GPS Tracking & Permission State
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'requesting'>('prompt');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // User Position State (Auto-detects live user location, neutral fallback while obtaining GPS)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; label: string; district?: string }>({
    lat: 27.7172,
    lng: 85.3240,
    label: language === 'np' ? 'लाइभ जीपीएस पत्ता लगाउँदै...' : 'Detecting your live location...',
    district: 'Auto GPS'
  });
  const [isLiveDetected, setIsLiveDetected] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(null);

  // Location Search State
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Selected Entity for Marker InfoWindow
  const [selectedEntity, setSelectedEntity] = useState<
    | { type: 'hospital'; data: Hospital; distanceKm: number; driveMins: number }
    | { type: 'medevac'; data: MedevacBase; airDistanceKm: number; flightEtaMins: number }
    | null
  >(null);

  // Active Tab Filter for Map Markers
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'hospitals' | 'medevac'>('all');

  // Directions API State for Fastest Driving Route
  const [routedHospital, setRoutedHospital] = useState<Hospital | null>(preselectedHospital);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [computedRoute, setComputedRoute] = useState<ComputedRouteInfo | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showTurnSteps, setShowTurnSteps] = useState(false);

  const routePodRef = useRef<HTMLDivElement | null>(null);

  // Reactive Google Maps API Key State (with instant fallback demo key)
  const [apiKey, setApiKey] = useState<string>(
    () => (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || FALLBACK_MAPS_KEY
  );

  useEffect(() => {
    fetch('/api/maps-key')
      .then((r) => r.json())
      .then((data) => {
        if (data?.apiKey) {
          setApiKey(data.apiKey);
        }
      })
      .catch(() => {});
  }, []);

  // If a preselected hospital was passed from HospitalsView, start routing immediately
  useEffect(() => {
    if (preselectedHospital) {
      setRoutedHospital(preselectedHospital);
      setTimeout(() => {
        routePodRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 200);
    }
  }, [preselectedHospital]);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request Live GPS Location Permission & Start Real-Time Tracking
  const requestLiveLocation = (silent = false) => {
    if (!silent) {
      triggerHaptic('medium');
    }
    setPermissionStatus('requesting');
    setGpsError(null);

    if (!navigator.geolocation) {
      setPermissionStatus('denied');
      setGpsError(
        language === 'np'
          ? 'तपाईंको ब्राउजरमा जीपीएस लोकेशन सुविधा उपलब्ध छैन।'
          : 'Geolocation is not supported by your browser.'
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsAccuracy(Math.round(accuracy));
        setPermissionStatus('granted');
        setIsLiveTracking(true);
        setIsLiveDetected(true);
        setPanTarget({ lat: latitude, lng: longitude });

        const resolvedLabel = await resolveLocationName(latitude, longitude, language);

        setUserCoords({
          lat: latitude,
          lng: longitude,
          label: resolvedLabel,
          district: 'Live Device GPS'
        });

        if (!silent) {
          triggerHaptic('success');
        }

        // Setup real-time watchPosition for continuous live location sharing
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          async (watchPos) => {
            const wLat = watchPos.coords.latitude;
            const wLng = watchPos.coords.longitude;
            setGpsAccuracy(Math.round(watchPos.coords.accuracy));
            setPanTarget({ lat: wLat, lng: wLng });
            setUserCoords((prev) => ({
              ...prev,
              lat: wLat,
              lng: wLng
            }));
          },
          (watchErr) => {
            console.warn('Live watchPosition error:', watchErr);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
        );
      },
      (err) => {
        console.warn('Geolocation permission error:', err);
        setPermissionStatus('denied');
        setUserCoords((prev) => ({
          ...prev,
          label: language === 'np' ? 'काठमाडौँ केन्द्र (म्यानुअल छनोट)' : 'Kathmandu Valley Central (Manual Select)'
        }));
        setGpsError(
          language === 'np'
            ? 'जीपीएस अनुमति प्राप्त भएन। कृपया ब्राउजरमा लोकेशन सेयरिङ अन गर्नुहोस् वा तलको खोज बाकसबाट आफ्नो टोल छान्नुहोस्।'
            : 'Live GPS permission denied or timed out. Please allow location access or search your neighborhood below.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Automatically prompt for live location permission on component mount
  useEffect(() => {
    requestLiveLocation(true);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Toggle Live Tracking On / Off
  const toggleLiveTracking = () => {
    triggerHaptic('light');
    if (isLiveTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveTracking(false);
    } else {
      setIsLiveTracking(true);
      requestLiveLocation(false);
    }
  };

  // Filter Search Locations
  const filteredSearchSuggestions = useMemo(() => {
    const q = locationSearchQuery.trim().toLowerCase();
    if (!q) {
      return SEARCHABLE_LOCATIONS.slice(0, 8);
    }
    return SEARCHABLE_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.nameNp.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        (loc.details && loc.details.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [locationSearchQuery]);

  // Handle Search Result Selection
  const handleSelectLocation = (loc: SearchableLocationItem) => {
    triggerHaptic('medium');
    // Pause live auto-watch if user manually searched a specific location
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveTracking(false);

    setUserCoords({
      lat: loc.lat,
      lng: loc.lng,
      label: language === 'np' ? loc.nameNp : loc.name,
      district: loc.district
    });
    setLocationSearchQuery('');
    setIsSearchDropdownOpen(false);
  };

  // Calculate Geodesic Distances & Sort Hospitals / Medevac
  const hospitalsWithDistance = useMemo(() => {
    return hospitals.map((h) => {
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
  }, [userCoords, hospitals]);

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

  // Gatthaghar Nagarik & HAMS Fast Access Pointers
  const nagarikHospital = useMemo(
    () => hospitalsWithDistance.find((h) => h.id === 'hosp_020' || h.name.includes('Nagarik')),
    [hospitalsWithDistance]
  );

  const hamsHospital = useMemo(
    () => hospitalsWithDistance.find((h) => h.id === 'hosp_011' || h.name.includes('HAMS')),
    [hospitalsWithDistance]
  );

  // Trigger Google Maps Directions API Calculation to Selected Hospital
  const handleCalculateDirections = (hospital: Hospital) => {
    triggerHaptic('medium');
    setRoutedHospital(hospital);
    setShowTurnSteps(false);

    // Scroll smoothly to route view pod
    setTimeout(() => {
      routePodRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleClearRoute = () => {
    triggerHaptic('light');
    setRoutedHospital(null);
    setComputedRoute(null);
    setRouteError(null);
    setShowTurnSteps(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-1 sm:px-0 pb-12">
      {/* Live Location Sharing Permission & State Pod */}
      <div className="rounded-[26px] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 shadow-2xl border border-blue-500/20 relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Header Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg">
                <Crosshair className="w-6 h-6 text-white animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {language === 'np' ? 'लाइभ जीपीएस सेयरिङ तथा नजिकको अस्पताल रडार' : 'Live GPS Location Sharing & Nearest Hospital Radar'}
                  </h1>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold tracking-wider uppercase flex items-center gap-1 shadow-xs">
                    <SignalIcon className="w-3 h-3 animate-pulse" /> Live Sensor
                  </span>
                </div>
                <p className="text-xs text-blue-200/80 font-medium mt-0.5">
                  {language === 'np'
                    ? 'ब्राउजर जीपीएस अनुमति अन गरी तपाईंको वास्तविक स्थान पत्ता लगाउनुहोस् र साँचो नजिकको अस्पताल गणना गर्नुहोस्'
                    : 'Real-time GPS calculates your genuine closest emergency hospital and fastest driving transit route'}
                </p>
              </div>
            </div>

            {/* Live Location Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => requestLiveLocation(false)}
                disabled={permissionStatus === 'requesting'}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-blue-600 to-indigo-600 hover:from-red-700 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <LocateFixed className={`w-4 h-4 text-white ${permissionStatus === 'requesting' ? 'animate-spin' : ''}`} />
                <span>
                  {permissionStatus === 'requesting'
                    ? (language === 'np' ? 'जीपीएस अनुरोध हुँदैछ...' : 'Requesting GPS...')
                    : (language === 'np' ? '📍 मेरो लाइभ जीपीएस पत्ता लगाउनुहोस्' : '📍 Ping My Live GPS')}
                </span>
              </button>

              <button
                onClick={toggleLiveTracking}
                className={`px-3 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isLiveTracking
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                    : 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/20'
                }`}
                title={isLiveTracking ? 'Live tracking is active' : 'Live tracking is paused'}
              >
                <span className={`w-2 h-2 rounded-full ${isLiveTracking ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
                <span>{isLiveTracking ? 'Live Sharing: ON' : 'Live Sharing: OFF'}</span>
              </button>
            </div>
          </div>

          {/* Location Permission Prompt Banner (Shows if not granted) */}
          {permissionStatus === 'denied' && (
            <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-100 text-xs font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold text-amber-200">
                    {language === 'np' ? 'जीपीएस अनुमति आवश्यक (स्थान सेयरिङ बन्द छ)' : 'GPS Location Permission Needed'}
                  </p>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    {language === 'np'
                      ? 'तपाईंको ब्राउजरले जीपीएस अनुमति नदिएकाले नर्भिक पूर्व-सेट देखिन सक्छ। वास्तविक नजिकको अस्पतालका लागि अनुमति दिनुहोस् वा तलको खोज बाकस प्रयोग गर्नुहोस्।'
                      : 'Without live location permission, default central valley coordinates apply. Allow GPS or search your neighborhood below to find your true closest hospital.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => requestLiveLocation(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs shrink-0 cursor-pointer transition-all shadow-md active:scale-95"
              >
                {language === 'np' ? 'अनुमति पुनः अनुरोध गर्नुहोस्' : 'Allow GPS Location'}
              </button>
            </div>
          )}

          {/* Current Pinged Coords Bar with Accuracy Pill */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              <div className="text-xs min-w-0">
                <span className="text-slate-400 font-medium">
                  {language === 'np' ? 'सक्रिय स्थान (तपाईंको नजिक):' : 'Active Location Anchor:'}{' '}
                </span>
                <span className="font-bold text-white font-mono truncate">{userCoords.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {gpsAccuracy !== null && isLiveTracking && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                  ±{gpsAccuracy}m Accuracy
                </span>
              )}
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Lat: {userCoords.lat.toFixed(4)}, Lng: {userCoords.lng.toFixed(4)}</span>
              </div>
            </div>
          </div>

          {/* SEARCH BAR FOR NEIGHBORHOODS, PLACES & HOSPITALS */}
          <div ref={searchContainerRef} className="relative z-30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {language === 'np'
                    ? 'टोल, ठाउँ वा अस्पताल खोज्नुहोस् (उदा: गठ्ठाघर, ठिमी, धुम्बाराही...)'
                    : 'Search Your Neighborhood, Town, or Hospital:'}
                </span>
              </label>
              <span className="text-[10px] text-slate-400">
                {language === 'np' ? 'स्थान छान्दा नजिकको अस्पताल तुरुन्त फेरिन्छ' : 'Instantly re-ranks closest emergency facilities'}
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={locationSearchQuery}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onChange={(e) => {
                  setLocationSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                placeholder={
                  language === 'np'
                    ? 'खोज्नुहोस्: गठ्ठाघर, ठिमी, धुम्बाराही, कोटेश्वर, बानेश्वर, पाटन, नागरिक अस्पताल...'
                    : 'Type neighborhood (e.g. Gatthaghar, Thimi, Dhumbarahi, Koteshwor, Patan, Nagarik...)'
                }
                className="w-full pl-10 pr-24 py-3 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-blue-400 text-white placeholder:text-slate-400 text-xs font-medium focus:outline-hidden transition-all shadow-inner"
              />

              {locationSearchQuery ? (
                <button
                  onClick={() => {
                    setLocationSearchQuery('');
                    setIsSearchDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => requestLiveLocation(false)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LocateFixed className="w-3 h-3" />
                  <span>GPS</span>
                </button>
              )}

              {/* Suggestions Dropdown */}
              {isSearchDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-slate-900 border border-white/20 shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-white/10 z-50 backdrop-blur-xl animate-fade-in">
                  <div className="p-2 bg-slate-950/80 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>{language === 'np' ? 'सुझाइएका स्थानहरू' : 'Suggested Neighborhoods & Hospitals'}</span>
                    <span>{filteredSearchSuggestions.length} Results</span>
                  </div>

                  {filteredSearchSuggestions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      {language === 'np' ? 'कुनै स्थान भेटिएन। कृपया अन्य नाम खोज्नुहोस्।' : 'No matching locations found. Try another neighborhood or hospital name.'}
                    </div>
                  ) : (
                    filteredSearchSuggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectLocation(item)}
                        className="w-full text-left p-3 hover:bg-blue-600/20 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${
                            item.category === 'hospital'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {item.category === 'hospital' ? (
                              <HospitalIcon className="w-4 h-4" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block group-hover:text-blue-300 truncate">
                              {language === 'np' ? item.nameNp : item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {item.district} {item.details ? `• ${item.details}` : ''}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          Select →
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Select Chips Carousel (Kept directly below search bar) */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === 'np' ? 'वा नेपालका मुख्य क्षेत्रहरू छिटो चयन गर्नुहोस्:' : 'Or Quick Select Popular Sectors:'}</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_SELECT_CHIPS.map((loc) => {
                const isSelected = Math.abs(userCoords.lat - loc.lat) < 0.01 && Math.abs(userCoords.lng - loc.lng) < 0.01;
                return (
                  <button
                    key={loc.name}
                    onClick={() => {
                      triggerHaptic('light');
                      if (watchIdRef.current !== null) {
                        navigator.geolocation.clearWatch(watchIdRef.current);
                        watchIdRef.current = null;
                      }
                      setIsLiveTracking(false);
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

      {/* Dynamic Auto-Detected Nearest Emergency Facility Callout Bar (Nagarik removed as hardcoded default) */}
      {nearestHospital && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-950/80 via-slate-900/95 to-blue-950/80 border-2 border-emerald-500/40 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600/30 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
              <HospitalIcon className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500 text-white font-black uppercase tracking-wider">
                  {language === 'np' ? '📍 तपाईंको सबैभन्दा नजिकको आपतकालीन अस्पताल' : '📍 Auto-Detected Closest Emergency Facility'}
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-300">
                  {nearestHospital.distanceKm.toFixed(1)} km • ~{nearestHospital.driveMins} mins
                </span>
              </div>
              <h2 className="text-sm font-black text-white mt-1">
                {language === 'np' ? nearestHospital.name_np : nearestHospital.name}
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {nearestHospital.address} • {nearestHospital.beds} Beds • 24/7 ICU & Emergency Trauma Hotline: <span className="text-emerald-400 font-bold">{nearestHospital.phone}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => handleCalculateDirections(nearestHospital)}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-900/40 cursor-pointer active:scale-95"
            >
              <Route className="w-4 h-4" />
              <span>{language === 'np' ? 'नजिकको अस्पताल रुट हेर्नुहोस्' : 'Route to Closest'}</span>
            </button>

            <a
              href={`tel:${nearestHospital.phone.replace(/[^0-9]/g, '')}`}
              className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span className="hidden sm:inline">Call ER</span>
            </a>

            {hospitalsWithDistance[1] && (
              <button
                onClick={() => handleCalculateDirections(hospitalsWithDistance[1])}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 text-xs font-bold transition-all cursor-pointer"
                title={hospitalsWithDistance[1].name}
              >
                <span>Alt: {hospitalsWithDistance[1].distanceKm.toFixed(1)} km</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Driving Route Pod (Google Maps Directions API Display) */}
      {routedHospital && (
        <div
          ref={routePodRef}
          className="rounded-[24px] bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 border-2 border-blue-400/50 shadow-2xl animate-fade-in relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Top Bar with Clear Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-md">
                  <Route className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-red-400">
                      {language === 'np' ? 'आपतकालीन सडक रुट सक्रिय' : 'Emergency Driving Route Active'}
                    </span>
                    {isCalculatingRoute && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold animate-pulse">
                        Calculating Directions...
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {language === 'np' ? routedHospital.name_np : routedHospital.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${routedHospital.lat},${routedHospital.lng}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'np' ? 'गुगल म्याप्स एपमा खोल्नुहोस्' : 'Open in Google Maps'}</span>
                </a>

                <button
                  onClick={handleClearRoute}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Clear Route"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Origin -> Destination summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  {language === 'np' ? 'सुरुवात (वर्तमान जीपीएस स्थान)' : 'Origin (Your Live Anchor)'}
                </span>
                <p className="text-xs font-bold text-white mt-1 truncate">
                  {userCoords.label}
                </p>
                <span className="text-[10px] font-mono text-emerald-400 mt-0.5 block">
                  {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  {language === 'np' ? 'गन्तव्य (अस्पताल)' : 'Destination'}
                </span>
                <p className="text-xs font-bold text-white mt-1 truncate">
                  {routedHospital.address}
                </p>
                <span className="text-[10px] font-mono text-blue-300 mt-0.5 block">
                  {routedHospital.district} • {routedHospital.beds} Beds • 24/7 ICU
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-950/60 to-blue-900/60 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-300 font-bold block uppercase tracking-wider">
                    {language === 'np' ? 'द्रुत ड्राइभिङ समय र दूरी' : 'Fastest Driving Time'}
                  </span>
                  <div className="text-xl font-black text-white flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <span>
                      {computedRoute ? computedRoute.duration : `~${Math.round(calculateHaversineDistance(userCoords.lat, userCoords.lng, routedHospital.lat || 27.7052, routedHospital.lng || 85.3142) * 1.35 / 35 * 60) + 5} mins`}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-300 block">
                    {computedRoute ? computedRoute.distance : `${calculateHaversineDistance(userCoords.lat, userCoords.lng, routedHospital.lat || 27.7052, routedHospital.lng || 85.3142).toFixed(1)} km`}
                    {computedRoute?.summary ? ` • via ${computedRoute.summary}` : ''}
                  </span>
                </div>

                <a
                  href={`tel:${routedHospital.emergency}`}
                  className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call {routedHospital.emergency}</span>
                </a>
              </div>
            </div>

            {/* Turn-by-Turn Steps Accordion */}
            {computedRoute && computedRoute.steps.length > 0 && (
              <div className="pt-1">
                <button
                  onClick={() => setShowTurnSteps(!showTurnSteps)}
                  className="text-xs font-bold text-blue-200 hover:text-white flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <span>{language === 'np' ? 'सडक मोड तथा दिशानिर्देशहरू हेर्नुहोस्' : 'Turn-by-Turn Driving Guidance'} ({computedRoute.steps.length} turns)</span>
                  {showTurnSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showTurnSteps && (
                  <div className="mt-2 p-3.5 rounded-2xl bg-black/40 border border-white/10 max-h-56 overflow-y-auto space-y-2 text-xs divide-y divide-white/5 scrollbar-thin">
                    {computedRoute.steps.map((step, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600/40 text-blue-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-slate-200 font-medium leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nearest Medevac & Hospital Callout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nearest Hospital Card */}
        {nearestHospital && (
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border-2 border-emerald-500/30 dark:border-emerald-500/40 shadow-xl relative overflow-hidden group hover:border-emerald-500 transition-all">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                <HospitalIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'np' ? 'तपाईंको स्थानबाट सबैभन्दा नजिकको अस्पताल' : 'Nearest Emergency Hospital to You'}</span>
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                {nearestHospital.distanceKm.toFixed(1)} km away
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {language === 'np' ? nearestHospital.name_np : nearestHospital.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{nearestHospital.address}</span>
                  </p>
                </div>
                {nearestHospital.id === 'hosp_020' && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-black shrink-0">
                    BHAKTAPUR HUB
                  </span>
                )}
                {nearestHospital.id === 'hosp_011' && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black shrink-0">
                    DHUMBARAHI HUB
                  </span>
                )}
              </div>

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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                <button
                  onClick={() => handleCalculateDirections(nearestHospital)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Route className="w-3.5 h-3.5" />
                  <span>{language === 'np' ? 'द्रुत ड्राइभिङ रुट गणना गर्नुहोस्' : 'Calculate Fastest Route'}</span>
                </button>

                <a
                  href={`tel:${nearestHospital.emergency}`}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
                <span>{language === 'np' ? 'सबैभन्दा नजिकको एयर एम्बुलेन्स / उद्धार हब' : 'Nearest Medevac Airbase & Air Rescue'}</span>
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
                {nearestMedevac.hotline && !nearestMedevac.hotline.includes('Not Available') ? (
                  <a
                    href={`tel:${nearestMedevac.hotline}`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-white" />
                    <span>Call Air Rescue {nearestMedevac.hotline}</span>
                  </a>
                ) : (
                  <div className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-not-allowed">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Fly Service Offline (No Active Number)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive Google Map Container using @vis.gl/react-google-maps */}
      <div className="rounded-[26px] bg-white dark:bg-[#0F172A] border-2 border-blue-600/20 dark:border-blue-500/30 shadow-2xl overflow-hidden space-y-0">
        {/* Filter Pills and Status */}
        <div className="p-4 bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
            <MapIcon className="w-4 h-4 text-blue-600" />
            <span>{language === 'np' ? 'गुगल म्याप्स आपतकालीन ट्राइएज रडार' : 'Interactive Google Maps Triage Radar'}</span>
            {routedHospital && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold">
                Route Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200 dark:bg-slate-900">
            {(['all', 'hospitals', 'medevac'] as const).map((filter) => {
              const isActive = activeTabFilter === filter;
              const label = {
                all: language === 'np' ? 'सबै (All Pins)' : 'Show All Pins',
                hospitals: language === 'np' ? 'अस्पतालहरू (Hospitals)' : 'Hospitals Only',
                medevac: language === 'np' ? 'हवाई उद्धार (Medevac)' : 'Medevac & Bases'
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
        <div className="h-[520px] w-full relative">
          {!mapLoadError ? (
            <APIProvider
              apiKey={apiKey || FALLBACK_MAPS_KEY}
              libraries={['places', 'marker', 'routes', 'geometry']}
              onLoad={() => setMapLoadError(false)}
              onError={(err) => {
                console.warn('Google Maps API load error:', err);
                setMapLoadError(true);
              }}
            >
              <Map
                defaultCenter={{ lat: userCoords.lat, lng: userCoords.lng }}
                defaultZoom={12}
                mapId="DEMO_MAP_ID"
                gestureHandling="greedy"
                disableDefaultUI={false}
                className="w-full h-full touch-pan-x touch-pan-y"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              >
                {/* Touch Camera Controller & Floating Touch Zoom/Recenter Controls */}
                <MapTouchPanController panTarget={panTarget} userCoords={userCoords} />
                <MapTouchOverlayButtons
                  onRecenterGPS={() => setPanTarget({ lat: userCoords.lat, lng: userCoords.lng })}
                  onRecenterHospital={
                    routedHospital && routedHospital.lat && routedHospital.lng
                      ? () => setPanTarget({ lat: routedHospital.lat, lng: routedHospital.lng })
                      : undefined
                  }
                  hasHospital={Boolean(routedHospital && routedHospital.lat && routedHospital.lng)}
                />
                {/* DirectionsRendererChild to draw Google Maps Directions API driving polyline */}
                <DirectionsRendererChild
                  origin={{ lat: userCoords.lat, lng: userCoords.lng }}
                  destination={
                    routedHospital && routedHospital.lat && routedHospital.lng
                      ? { lat: routedHospital.lat, lng: routedHospital.lng }
                      : null
                  }
                  onRouteComputed={setComputedRoute}
                  onCalculatingStateChange={setIsCalculatingRoute}
                  onError={setRouteError}
                />

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
                  hospitalsWithDistance.map((h) => {
                    const isRouted = routedHospital?.id === h.id;
                    const isNearest = nearestHospital?.id === h.id;

                    return (
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
                          background={isRouted ? '#9333EA' : isNearest ? '#10B981' : '#2563EB'}
                          borderColor="#FFFFFF"
                          glyphColor="#FFFFFF"
                          scale={isRouted ? 1.25 : 1}
                        >
                          <HospitalIcon className="w-4 h-4 text-white" />
                        </Pin>
                      </AdvancedMarker>
                    );
                  })}

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

                      {/* Route Action inside InfoWindow */}
                      {selectedEntity.type === 'hospital' && (
                        <button
                          onClick={() => {
                            handleCalculateDirections(selectedEntity.data as Hospital);
                            setSelectedEntity(null);
                          }}
                          className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                        >
                          <Route className="w-3 h-3 text-white" />
                          <span>Calculate Fastest Driving Route</span>
                        </button>
                      )}

                      {/* Phone Dial */}
                      {selectedEntity.type === 'hospital' ? (
                        <a
                          href={`tel:${selectedEntity.data.emergency}`}
                          className="w-full py-1.5 rounded-lg bg-red-600 text-white font-bold text-[11px] flex items-center justify-center gap-1"
                        >
                          <PhoneCall className="w-3 h-3 text-white" />
                          <span>Call {selectedEntity.data.emergency}</span>
                        </a>
                      ) : (selectedEntity.data as MedevacBase).hotline && !(selectedEntity.data as MedevacBase).hotline.includes('Not Available') ? (
                        <a
                          href={`tel:${(selectedEntity.data as MedevacBase).hotline}`}
                          className="w-full py-1.5 rounded-lg bg-red-600 text-white font-bold text-[11px] flex items-center justify-center gap-1"
                        >
                          <PhoneCall className="w-3 h-3 text-white" />
                          <span>Call {(selectedEntity.data as MedevacBase).hotline}</span>
                        </a>
                      ) : (
                        <div className="w-full py-1.5 rounded-lg bg-slate-200 text-slate-500 font-bold text-[11px] text-center">
                          Offline / No Number
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white rounded-2xl p-6 relative overflow-hidden">
              {/* Live interactive OpenStreetMap tile fallback iframe */}
              <iframe
                title="Emergency Radar Fallback Map"
                className="w-full h-full absolute inset-0 opacity-80 pointer-events-auto"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${userCoords.lng - 0.04}%2C${userCoords.lat - 0.03}%2C${userCoords.lng + 0.04}%2C${userCoords.lat + 0.03}&layer=mapnik&marker=${userCoords.lat}%2C${userCoords.lng}`}
              />

              {/* Foreground interactive card */}
              <div className="relative z-10 max-w-md w-full p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 backdrop-blur-md shadow-2xl text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{language === 'np' ? 'लाइभ आपतकालीन स्थान सक्रिय' : 'Live Emergency Location Active'}</span>
                </div>
                <h4 className="text-sm font-black text-white">{userCoords.label}</h4>
                <p className="text-[11px] text-slate-300">
                  {nearestHospital
                    ? `${language === 'np' ? 'नजिकको अस्पताल:' : 'Nearest hospital:'} ${nearestHospital.name} (${nearestHospital.distanceKm.toFixed(1)} km, ~${nearestHospital.driveMins} mins)`
                    : 'Calculating closest facility...'}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${routedHospital ? `${routedHospital.lat},${routedHospital.lng}` : `${nearestHospital?.lat},${nearestHospital?.lng}`}&travelmode=driving`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Google Maps</span>
                  </a>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setMapLoadError(false);
                    }}
                    className="w-full sm:w-auto py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 text-xs font-bold transition-all cursor-pointer"
                  >
                    Retry Maps Engine
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Distance & Route Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tertiary Hospitals Distance & Route Trigger Table */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>{language === 'np' ? 'नेपालका आपतकालीन अस्पतालहरू (दूरी तथा रुट)' : 'Nepal Emergency Hospitals (Ranked by Distance)'}</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500">{hospitalsWithDistance.length} Facilities</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
                <tr>
                  <th className="p-3 text-slate-500 font-bold">Hospital Name</th>
                  <th className="p-3 text-slate-500 font-bold">Distance</th>
                  <th className="p-3 text-slate-500 font-bold">Drive ETA</th>
                  <th className="p-3 text-slate-500 font-bold">Fastest Route</th>
                  <th className="p-3 text-slate-500 font-bold">Hotline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {hospitalsWithDistance.map((h, i) => {
                  const isCurrentRoute = routedHospital?.id === h.id;
                  const isGatthaghar = h.id === 'hosp_020' || h.name.includes('Nagarik');
                  const isHams = h.id === 'hosp_011' || h.name.includes('HAMS');

                  return (
                    <tr
                      key={h.id}
                      className={`transition-colors ${
                        isCurrentRoute
                          ? 'bg-blue-50 dark:bg-blue-950/40 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                          {i === 0 && (
                            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-white text-[9px] font-black">
                              NEAREST
                            </span>
                          )}
                          {isGatthaghar && (
                            <span className="px-1.5 py-0.2 rounded-md bg-indigo-600 text-white text-[9px] font-black">
                              BHAKTAPUR HUB
                            </span>
                          )}
                          {isHams && (
                            <span className="px-1.5 py-0.2 rounded-md bg-blue-600 text-white text-[9px] font-black">
                              TRAUMA PARTNER
                            </span>
                          )}
                          <span>{language === 'np' ? h.name_np : h.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {h.address} • {h.beds} Beds • 24/7 ICU
                        </div>
                      </td>

                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {h.distanceKm.toFixed(1)} km
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        ~{h.driveMins} mins
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => handleCalculateDirections(h)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 ${
                            isCurrentRoute
                              ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                              : 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          <Route className="w-3 h-3" />
                          <span>{isCurrentRoute ? 'Routing...' : 'Route'}</span>
                        </button>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Medevac Airbases & Drones Table */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-600 animate-pulse" />
              <span>{language === 'np' ? 'नेपाल सेना हेलिकप्टर र एयरबेस (दूरी अनुसार)' : 'Nepal Medevac Airbases (Ranked by Flight ETA)'}</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500">{medevacWithDistance.length} Airbases</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
                <tr>
                  <th className="p-3 text-slate-500 font-bold">Airbase / Hub</th>
                  <th className="p-3 text-slate-500 font-bold">Air Distance</th>
                  <th className="p-3 text-slate-500 font-bold">Flight ETA</th>
                  <th className="p-3 text-slate-500 font-bold">Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {medevacWithDistance.map((mb, i) => {
                  const isFlyDrone = mb.type.includes('Drone') || mb.name.includes('Fly');
                  const hasValidPhone = mb.hotline && !mb.hotline.includes('Not Available');

                  return (
                    <tr key={mb.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                          {i === 0 && (
                            <span className="px-1.5 py-0.2 rounded-md bg-red-600 text-white text-[9px] font-black">
                              NEAREST
                            </span>
                          )}
                          {isFlyDrone && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-black text-[9px] font-black">
                              UNAVAILABLE
                            </span>
                          )}
                          <span>{language === 'np' ? mb.name_np : mb.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {mb.aircraft} • {mb.base_location}
                        </div>
                      </td>

                      <td className="p-3 font-mono font-bold text-red-600 dark:text-red-400">
                        {mb.airDistanceKm.toFixed(1)} km
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        ~{mb.flightEtaMins} mins
                      </td>

                      <td className="p-3">
                        {hasValidPhone ? (
                          <a
                            href={`tel:${mb.hotline}`}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-all inline-flex items-center gap-1 shadow-sm"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Dispatch</span>
                          </a>
                        ) : (
                          <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-bold">
                            Offline (No Phone)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
