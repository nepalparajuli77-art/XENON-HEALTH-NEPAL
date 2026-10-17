import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'thematic-valve-td2jw',
  });
}

export const adminAuth = getAuth();
