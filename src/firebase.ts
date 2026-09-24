import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import config from '../firebase-applet-config.json';

const app = initializeApp(config);

export const auth = getAuth(app);

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, (config as any).firestoreDatabaseId);
} catch (e) {
  console.warn("initializeFirestore with persistent local cache failed, falling back to standard getFirestore:", e);
  dbInstance = getFirestore(app, (config as any).firestoreDatabaseId);
}
export const db = dbInstance;

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
let activeSignInPromise: Promise<any> | null = null;

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const signInWithGoogle = async () => {
  // If a popup request is already in-flight, return the existing promise
  // This prevents Firebase from aborting the previous request with auth/cancelled-popup-request
  if (activeSignInPromise) {
    return activeSignInPromise;
  }

  activeSignInPromise = (async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
      }
      return result.user;
    } catch (error: any) {
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request'
      ) {
        console.warn('Google Auth popup closed or cancelled by user:', error?.code);
        return null;
      }
      if (error?.code === 'auth/popup-blocked') {
        console.warn('Google Auth popup was blocked by browser.');
        throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      }
      console.error('Error signing in with Google', error);
      throw error;
    } finally {
      activeSignInPromise = null;
    }
  })();

  return activeSignInPromise;
};

export const requireGoogleLogin = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const user = await signInWithGoogle();
    if (!user) {
      return null;
    }
    return cachedAccessToken;
  } catch (e: any) {
    if (
      e?.code === 'auth/popup-closed-by-user' ||
      e?.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('Google Auth popup closed or cancelled by user.');
      return null;
    }
    throw e;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  const isOfflineError = 
    errMsg.includes('offline') || 
    errMsg.includes('network') || 
    errMsg.includes('unavailable') || 
    errMsg.includes('internet');

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isOfflineError) {
    console.warn('Gracefully handled offline/network Firestore error:', errInfo.error);
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  const isSecurityOrPermissionError = 
    errMsg.includes('permission') || 
    errMsg.includes('insufficient') || 
    errMsg.includes('unauthorized') || 
    errMsg.includes('security');

  if (isSecurityOrPermissionError) {
    console.warn('Gracefully handled permissions error:', errInfo.error);
    return; // Do not throw, allow the app to continue with empty data
  } else {
    throw new Error(errInfo.error);
  }
}
