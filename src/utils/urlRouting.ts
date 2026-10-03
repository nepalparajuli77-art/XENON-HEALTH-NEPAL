import { Language } from '../types';

export const TAB_ROUTE_MAP: Record<string, string> = {
  dashboard: '/dashboard',
  records: '/records',
  book: '/book',
  doctors: '/doctors',
  hospitals: '/hospitals',
  lab: '/lab',
  xenon: '/xenon',
  emergency: '/emergency',
  offlineGuide: '/altitude',
  developer: '/developer'
};

export const ROUTE_TAB_MAP: Record<string, string> = {
  dashboard: 'dashboard',
  records: 'records',
  book: 'book',
  doctors: 'doctors',
  hospitals: 'hospitals',
  lab: 'lab',
  xenon: 'xenon',
  emergency: 'emergency',
  altitude: 'offlineGuide',
  'offline-guide': 'offlineGuide',
  developer: 'developer'
};

export interface ParsedUrlState {
  tab: string | null;
  doctorId: string | null;
  authMode: 'login' | 'register-doctor' | 'register-patient' | null;
  lang: Language | null;
  subTab: string | null;
  searchQuery: string | null;
}

/**
 * Parses the current window.location (pathname, search params, and hash)
 * to determine the initial route and state.
 */
export function parseCurrentUrl(): ParsedUrlState {
  if (typeof window === 'undefined') {
    return {
      tab: null,
      doctorId: null,
      authMode: null,
      lang: null,
      subTab: null,
      searchQuery: null
    };
  }

  const pathname = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');

  // 1. Resolve Tab from Pathname or Hash or Search Params
  let detectedTab: string | null = null;

  if (pathname && ROUTE_TAB_MAP[pathname]) {
    detectedTab = ROUTE_TAB_MAP[pathname];
  } else if (hash && ROUTE_TAB_MAP[hash]) {
    detectedTab = ROUTE_TAB_MAP[hash];
  } else if (searchParams.get('tab') && ROUTE_TAB_MAP[searchParams.get('tab')!]) {
    detectedTab = ROUTE_TAB_MAP[searchParams.get('tab')!];
  }

  // 2. Parse Deep-link parameters
  const doctorId = searchParams.get('doctor') || searchParams.get('doctor_id') || searchParams.get('doc');
  const authParam = searchParams.get('auth');
  let authMode: ParsedUrlState['authMode'] = null;
  if (authParam === 'login' || authParam === 'register-doctor' || authParam === 'register-patient') {
    authMode = authParam;
  }

  const langParam = searchParams.get('lang');
  const lang: Language | null = langParam === 'np' ? 'np' : langParam === 'en' ? 'en' : null;
  const subTab = searchParams.get('subtab') || searchParams.get('section');
  const searchQuery = searchParams.get('q') || searchParams.get('search');

  return {
    tab: detectedTab,
    doctorId,
    authMode,
    lang,
    subTab,
    searchQuery
  };
}

/**
 * Formats dynamic page title based on the active tab and language
 */
export function getTabDocumentTitle(tab: string, language: Language = 'en'): string {
  const isNp = language === 'np';
  switch (tab) {
    case 'dashboard':
      return isNp ? 'स्वास्थ्य ड्यासबोर्ड | XENON HEALTH' : 'Patient Health Dashboard | XENON HEALTH';
    case 'records':
      return isNp ? 'मेडिकल रेकर्ड तथा भाइटल्स | XENON HEALTH' : 'Medical Records & Vitals Vault | XENON HEALTH';
    case 'book':
      return isNp ? 'विशेषज्ञ डाक्टर बुकिङ | XENON HEALTH' : 'Book Specialist OPD Consultation | XENON HEALTH';
    case 'doctors':
      return isNp ? 'क्लिनिकल कार्यथलो तथा डाक्टर लाम | XENON HEALTH' : 'Doctor Clinical Workspace & Queue | XENON HEALTH';
    case 'hospitals':
      return isNp ? 'अस्पताल तथा आईसीयू सूची | XENON HEALTH' : 'Hospitals & Emergency ICU Directory | XENON HEALTH';
    case 'lab':
      return isNp ? 'ल्याब तथा रेडियोलोजी अभिलेख | XENON HEALTH' : 'Diagnostic Lab & Radiology Archive | XENON HEALTH';
    case 'xenon':
      return isNp ? 'जेनोन AI क्लिनिकल सहायक | XENON HEALTH' : 'Xenon AI Telemedicine & Clinical Assistant | XENON HEALTH';
    case 'emergency':
      return isNp ? 'आपतकालीन १०२ उद्धार सेवा | XENON HEALTH' : 'Emergency SOS 102 Nepal | XENON HEALTH';
    case 'offlineGuide':
      return isNp ? 'हिमाली प्राथमिक उपचार गाइड | XENON HEALTH' : 'High Altitude Sickness & First Aid Guide | XENON HEALTH';
    case 'developer':
      return isNp ? 'प्रणाली व्यवस्थापक कन्सोल | XENON HEALTH' : 'Developer Console & Operations | XENON HEALTH';
    default:
      return 'XENON HEALTH — Next-Gen AI Telemedicine Nepal';
  }
}

/**
 * Dynamically pushes or replaces the URL in the browser without reloading the page.
 */
export function syncUrlWithState(
  tab: string,
  options?: {
    replace?: boolean;
    doctorId?: string | null;
    authMode?: string | null;
    lang?: Language;
  }
): void {
  if (typeof window === 'undefined') return;

  const basePath = TAB_ROUTE_MAP[tab] || `/${tab}`;
  const urlParams = new URLSearchParams();

  // Preserve other relevant query params if needed
  if (options?.doctorId) {
    urlParams.set('doctor', options.doctorId);
  }
  if (options?.authMode) {
    urlParams.set('auth', options.authMode);
  }
  if (options?.lang && options.lang !== 'en') {
    urlParams.set('lang', options.lang);
  }

  const queryString = urlParams.toString();
  const targetUrl = queryString ? `${basePath}?${queryString}` : basePath;

  const currentPathWithSearch = window.location.pathname + window.location.search;
  if (currentPathWithSearch === targetUrl) {
    return;
  }

  try {
    if (options?.replace) {
      window.history.replaceState({ tab }, '', targetUrl);
    } else {
      window.history.pushState({ tab }, '', targetUrl);
    }
  } catch (err) {
    console.warn('History navigation sync warning:', err);
  }

  // Update dynamic document title
  document.title = getTabDocumentTitle(tab, options?.lang || 'en');
}
