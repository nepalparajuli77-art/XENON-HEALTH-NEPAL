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
  nmc: 'doctors',
  'nmc-verification': 'doctors',
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
      return isNp ? 'स्वास्थ्य ड्यासबोर्ड | XENON HEALTH Nepal' : 'Patient Health Dashboard | XENON HEALTH Nepal';
    case 'records':
      return isNp ? 'मेडिकल रेकर्ड तथा भाइटल्स | XENON HEALTH' : 'Medical Records & Vitals Vault | XENON HEALTH';
    case 'book':
      return isNp ? 'विशेषज्ञ डाक्टर बुकिङ | XENON HEALTH' : 'Book Specialist OPD Consultation | XENON HEALTH';
    case 'doctors':
      return isNp ? 'NMC डाक्टर सूची तथा काउन्सिल प्रमाणीकरण | XENON HEALTH' : 'NMC Verified Doctors & Council Registry | XENON HEALTH';
    case 'hospitals':
      return isNp ? 'अस्पताल तथा आईसीयू सूची नेपाल | XENON HEALTH' : 'Hospitals & Emergency ICU Directory Nepal | XENON HEALTH';
    case 'lab':
      return isNp ? 'ल्याब तथा रेडियोलोजी अभिलेख | XENON HEALTH' : 'Diagnostic Lab & Radiology Archive | XENON HEALTH';
    case 'xenon':
      return isNp ? 'जेनोन AI स्वास्थ्य सहायक | XENON HEALTH' : 'Xenon AI Telemedicine & Clinical Triage | XENON HEALTH';
    case 'emergency':
      return isNp ? 'आपतकालीन १०२ एम्बुलेन्स सेवा | XENON HEALTH' : 'Emergency SOS 102 Ambulance Nepal | XENON HEALTH';
    case 'offlineGuide':
      return isNp ? 'हिमाली प्राथमिक उपचार गाइड (AMS/HAPE) | XENON HEALTH' : 'High Altitude Sickness First Aid Guide | XENON HEALTH';
    case 'developer':
      return isNp ? 'प्रणाली व्यवस्थापक कन्सोल | XENON HEALTH' : 'Developer Console & Operations | XENON HEALTH';
    default:
      return 'XENON HEALTH — Next-Gen AI Telemedicine Nepal';
  }
}

/**
 * Provides targeted, keyword-rich meta descriptions for search engine snippets
 */
export function getTabMetaDescription(tab: string, language: Language = 'en'): string {
  const isNp = language === 'np';
  switch (tab) {
    case 'doctors':
      return isNp
        ? 'नेपाल मेडिकल काउन्सिल (NMC) बाट प्रमाणित विशेषज्ञ डाक्टरहरूको लाइसेन्स जाँच्नुहोस् र तत्काल भिडियो परामर्श लिनुहोस्।'
        : 'Search & verify Nepal Medical Council (NMC) registered specialist doctors. Inspect qualifications, experience, and book OPD video consultations.';
    case 'emergency':
      return isNp
        ? 'नेपाल आपतकालीन १०२ एम्बुलेन्स सेवा, आपतकालीन वार्ड तथा जीवनरक्षक हटलाइन तत्काल सम्पर्क गर्नुहोस्।'
        : 'Emergency SOS 102 Nepal: Direct ambulance dispatch, GPS emergency broadcasting, and ICU trauma hotlines across Nepal.';
    case 'hospitals':
      return isNp
        ? 'काठमाडौँ तथा नेपालभरिका अस्पतालहरू, आईसीयू बेड उपलब्धता तथा विशेषज्ञ सेवाहरूको विस्तृत विवरण।'
        : 'Live directory of accredited hospitals in Kathmandu & Nepal with 24/7 ICU beds, emergency trauma care, and ventilator status.';
    case 'altitude':
      return isNp
        ? 'हिमाली यात्रामा लाग्ने लेक लाग्ने समस्या (AMS, HAPE, HACE) को प्राथमिक उपचार, रोकथाम तथा औषधी गाइड।'
        : 'Comprehensive Himalayan high-altitude sickness (AMS, HAPE, HACE) clinical first-aid protocols, oxygen, and emergency evacuation guide.';
    case 'records':
      return isNp
        ? 'तपाईंको डिजिटल मेडिकल रेकर्ड, भाइटल चेकलिस्ट तथा डिजिटल प्रेस्क्रिप्सन सुरक्षित रूपमा हेर्नुहोस्।'
        : 'Secure personal health vault: track daily vitals, chronic condition checklists, digital prescriptions, and diagnostic lab reports.';
    default:
      return 'Next-generation digital healthcare & telemedicine platform for Nepal featuring Xenon AI Clinical Triage, doctor bookings, hospital directory, and patient health records.';
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
  if (currentPathWithSearch !== targetUrl) {
    try {
      if (options?.replace) {
        window.history.replaceState({ tab }, '', targetUrl);
      } else {
        window.history.pushState({ tab }, '', targetUrl);
      }
    } catch (err) {
      console.warn('History navigation sync warning:', err);
    }
  }

  // Update dynamic document title and OpenGraph metadata
  const docTitle = getTabDocumentTitle(tab, options?.lang || 'en');
  const docDesc = getTabMetaDescription(tab, options?.lang || 'en');

  document.title = docTitle;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', docDesc);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', docTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', docDesc);

  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.setAttribute('content', docTitle);

  const twitterDesc = document.querySelector('meta[name="twitter:description"]');
  if (twitterDesc) twitterDesc.setAttribute('content', docDesc);
}
