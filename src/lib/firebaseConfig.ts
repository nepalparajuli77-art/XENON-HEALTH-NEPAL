// Secure configuration loader: Uses environment variables rather than hardcoded credentials
export interface FirebaseClientConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId: string;
  oAuthClientId: string;
  recaptchaSiteKey: string;
}

const env = (import.meta as any).env || {};

export const firebaseConfig: FirebaseClientConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'thematic-valve-td2jw',
  appId: env.VITE_FIREBASE_APP_ID || '',
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'thematic-valve-td2jw.firebaseapp.com',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  measurementId: '',
  oAuthClientId: env.VITE_FIREBASE_OAUTH_CLIENT_ID || '',
  recaptchaSiteKey: '',
};
