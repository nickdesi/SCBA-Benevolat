import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Functions } from 'firebase/functions';

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const missing = requiredEnvVars.filter((key) => !import.meta.env[key as string]);

if (missing.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missing.join(', ')}. ` +
      'Create a .env.local file from .env.example.',
  );
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with multi-tab persistent IndexedDB local cache for instant mobile startup & offline gyms support.
// Gracefully fall back to default Firestore if IndexedDB is unavailable (e.g., Safari private browsing).
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const auth = getAuth(app);

// Cloud Functions is only used by the admin CSV import flow (ImportCSVModal, already
// lazy-loaded). Loading & initializing it eagerly here would ship it in the critical
// bundle for every visitor. Lazy-init on first use instead.
let functionsInstance: Functions | null = null;
export async function getFirebaseFunctions(): Promise<Functions> {
  if (!functionsInstance) {
    const { getFunctions } = await import('firebase/functions');
    functionsInstance = getFunctions(app, 'europe-west1');
  }
  return functionsInstance;
}
