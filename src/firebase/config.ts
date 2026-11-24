import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

export const firebaseConfig: FirebaseAppConfig = {
  projectId: firebaseConfigData.projectId || 'home-connect-a2350',
  appId: firebaseConfigData.appId || '',
  apiKey: firebaseConfigData.apiKey || '',
  authDomain: firebaseConfigData.authDomain || 'home-connect-a2350.firebaseapp.com',
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId || 'ai-studio-homeconnect-ecb0a5ef-3cd6-4b57-a2d4-4e6d9a636ef8',
  storageBucket: firebaseConfigData.storageBucket || 'home-connect-a2350.firebasestorage.app',
  messagingSenderId: firebaseConfigData.messagingSenderId || '',
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);

// Always initialize with database ID if configured
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export function handleFirestoreError(error: unknown, context: string): string {
  console.error(`Firestore error in ${context}:`, error);

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case 'permission-denied':
        return `Permission denied in ${context}. Please ensure you are authorized.`;
      case 'not-found':
        return `Requested item was not found in ${context}.`;
      case 'already-exists':
        return `Record already exists in ${context}.`;
      case 'unauthenticated':
        return `You must be logged in to perform ${context}.`;
      case 'resource-exhausted':
        return `Service limit reached. Please try again shortly.`;
      case 'unavailable':
        return `Firestore service temporarily unavailable. Working offline.`;
      default:
        return (error as { message?: string }).message || `Error in ${context}`;
    }
  }

  return error instanceof Error ? error.message : `Unexpected error in ${context}`;
}
