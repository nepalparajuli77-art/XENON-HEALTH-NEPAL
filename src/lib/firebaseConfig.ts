import appletConfig from '../../firebase-applet-config.json';

export interface FirebaseClientConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId: string;
  oAuthClientId: string;
  recaptchaSiteKey: string;
}

const env = (import.meta as any).env || {};
const parsedConfig: any = (appletConfig as any)?.default || appletConfig || {};

// Authoritative provisioned Firebase project configuration with multi-layer fallback
export const firebaseConfig: FirebaseClientConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || parsedConfig.projectId || 'thematic-valve-td2jw',
  appId: env.VITE_FIREBASE_APP_ID || parsedConfig.appId || '1:824458655234:web:5bffdc081c649b3ad9d91b',
  apiKey: env.VITE_FIREBASE_API_KEY || parsedConfig.apiKey || 'AIzaSyDZuEDlsXgTl6lzWa3mhE6SmA69NCF3Rvk',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || parsedConfig.authDomain || 'thematic-valve-td2jw.firebaseapp.com',
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || parsedConfig.firestoreDatabaseId || 'ai-studio-xenonhealthnepal-970559bb-69c8-497d-9c39-49014e771c96',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || parsedConfig.storageBucket || 'thematic-valve-td2jw.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || parsedConfig.messagingSenderId || '824458655234',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || parsedConfig.measurementId || '',
  oAuthClientId: env.VITE_FIREBASE_OAUTH_CLIENT_ID || parsedConfig.oAuthClientId || '824458655234-gmr0iu9og7eprspnurlgq53opfcuni6h.apps.googleusercontent.com',
  recaptchaSiteKey: env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || parsedConfig.recaptchaSiteKey || '',
};
