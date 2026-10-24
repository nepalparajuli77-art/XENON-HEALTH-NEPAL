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

export const firebaseConfig: FirebaseClientConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig?.projectId || 'thematic-valve-td2jw',
  appId: env.VITE_FIREBASE_APP_ID || appletConfig?.appId || '1:824458655234:web:5bffdc081c649b3ad9d91b',
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig?.apiKey || 'AIzaSyDZuEDlsXgTl6lzWa3mhE6SmA69NCF3Rvk',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig?.authDomain || 'thematic-valve-td2jw.firebaseapp.com',
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || appletConfig?.firestoreDatabaseId || 'ai-studio-xenonhealthnepal-970559bb-69c8-497d-9c39-49014e771c96',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig?.storageBucket || 'thematic-valve-td2jw.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig?.messagingSenderId || '824458655234',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || appletConfig?.measurementId || '',
  oAuthClientId: env.VITE_FIREBASE_OAUTH_CLIENT_ID || appletConfig?.oAuthClientId || '824458655234-gmr0iu9og7eprspnurlgq53opfcuni6h.apps.googleusercontent.com',
  recaptchaSiteKey: env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || appletConfig?.recaptchaSiteKey || '',
};
