import { initializeApp, getApps, deleteApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig.ts';

// Initialize Firebase client safely using verified configuration
export const app: FirebaseApp = (() => {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    const defaultApp = existingApps[0];
    if (defaultApp.options && defaultApp.options.apiKey === firebaseConfig.apiKey) {
      return defaultApp;
    }
    try {
      deleteApp(defaultApp);
    } catch {
      // Continue to initialize
    }
  }
  return initializeApp(firebaseConfig);
})();

export const auth: Auth | null = (() => {
  try {
    const key = app?.options?.apiKey || firebaseConfig.apiKey;
    if (!key || typeof key !== 'string' || key.includes(':') || key.length < 10) {
      console.warn('Firebase API key is invalid or not configured.');
      return null;
    }
    return getAuth(app);
  } catch (error) {
    console.warn('Firebase Auth initialization warning:', error);
    return null;
  }
})();

export const firestore: Firestore = (() => {
  try {
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  } catch (error) {
    console.warn('Firestore initialization warning:', error);
    return getFirestore(app);
  }
})();

// Validate connection to Firestore per skill guidelines
async function testConnection() {
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    return;
  }
  try {
    await getDocFromServer(doc(firestore, 'health', 'connection-check'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore notice:', error.message);
    }
  }
}
testConnection();

// Provider configured with Google Workspace scopes (Gmail & Contacts)
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleAuthProvider.addScope('https://www.googleapis.com/auth/gmail.send');

// In-memory token storage (Do NOT store in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const idToken = await user.getIdToken();
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken || idToken);
      } catch {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; idToken: string } | null> => {
  if (!auth) {
    throw new Error('Firebase Auth is not available.');
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    const idToken = await result.user.getIdToken();

    return {
      user: result.user,
      accessToken: cachedAccessToken || '',
      idToken,
    };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logout = async () => {
  if (auth) {
    await signOut(auth);
  }
  cachedAccessToken = null;
};
