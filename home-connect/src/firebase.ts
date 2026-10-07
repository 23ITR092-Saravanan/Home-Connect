import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// User provided Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDC8_gILcJ8zDNCvKZUS7-IQ3Gm-wM2les",
  authDomain: "home-connect-a2350.firebaseapp.com",
  projectId: "home-connect-a2350",
  storageBucket: "home-connect-a2350.firebasestorage.app",
  messagingSenderId: "466544584398",
  appId: "1:466544584398:web:e4505982cf583b32c9929f"
};

let firebaseApp: Promise<FirebaseApp> | null = null;
let firebaseAuthServices: Promise<{ app: FirebaseApp; auth: Auth }> | null = null;
let firebaseServices: Promise<{ app: FirebaseApp; auth: Auth; db: Firestore }> | null = null;

function loadFirebaseApp(): Promise<FirebaseApp> {
  if (!firebaseApp) {
    firebaseApp = import('firebase/app').then((appSdk) => {
      const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
      return app;
    });
  }

  return firebaseApp;
}

export function loadFirebaseAuthServices(): Promise<{ app: FirebaseApp; auth: Auth }> {
  if (!firebaseAuthServices) {
    firebaseAuthServices = Promise.all([loadFirebaseApp(), import('firebase/auth')]).then(
      ([app, authSdk]) => ({ app, auth: authSdk.getAuth(app) })
    );
  }

  return firebaseAuthServices;
}

export function loadFirebaseServices(): Promise<{ app: FirebaseApp; auth: Auth; db: Firestore }> {
  if (!firebaseServices) {
    firebaseServices = Promise.all([loadFirebaseAuthServices(), import('firebase/firestore')]).then(
      ([services, firestoreSdk]) => {
        let db: Firestore;
        try {
          db = firestoreSdk.initializeFirestore(services.app, {
            localCache: firestoreSdk.persistentLocalCache({
              tabManager: firestoreSdk.persistentMultipleTabManager(),
            }),
          });
        } catch {
          db = firestoreSdk.getFirestore(services.app);
        }
        return { ...services, db };
      }
    );
  }

  return firebaseServices;
}

export function preloadFirebaseAuth(): void {
  void loadFirebaseAuthServices().catch(() => undefined);
}
