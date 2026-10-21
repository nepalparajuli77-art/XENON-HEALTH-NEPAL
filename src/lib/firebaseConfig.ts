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
  projectId: appletConfig.projectId || env.VITE_FIREBASE_PROJECT_ID || 'thematic-valve-td2jw',
  appId: appletConfig.appId || env.VITE_FIREBASE_APP_ID || '',
  apiKey: appletConfig.apiKey || env.VITE_FIREBASE_API_KEY || '',
  authDomain: appletConfig.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN || 'thematic-valve-td2jw.firebaseapp.com',
  firestoreDatabaseId: (appletConfig as any).firestoreDatabaseId || '',
  storageBucket: appletConfig.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: appletConfig.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  measurementId: appletConfig.measurementId || '',
  oAuthClientId: appletConfig.oAuthClientId || env.VITE_FIREBASE_OAUTH_CLIENT_ID || '',
  recaptchaSiteKey: appletConfig.recaptchaSiteKey || '',
};

