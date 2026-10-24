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

// Safely probe for optional applet config without failing Vite compilation if absent
let appletConfig: Record<string, any> = {};
try {
  const globFn = (import.meta as any).glob;
  if (typeof globFn === 'function') {
    const configs = globFn('../*.json', { eager: true }) as Record<string, any>;
    const match = Object.entries(configs).find(([k]) => k.includes('firebase-applet-config'));
    if (match && match[1]) {
      appletConfig = match[1].default || match[1];
    }
  }
} catch {
  appletConfig = {};
}

export const firebaseConfig: FirebaseClientConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || 'thematic-valve-td2jw',
  appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId || '',
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || 'thematic-valve-td2jw.firebaseapp.com',
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || appletConfig.measurementId || '',
  oAuthClientId: env.VITE_FIREBASE_OAUTH_CLIENT_ID || appletConfig.oAuthClientId || '',
  recaptchaSiteKey: env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || appletConfig.recaptchaSiteKey || '',
};

