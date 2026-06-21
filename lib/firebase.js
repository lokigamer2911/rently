import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function isPlaceholderValue(value) {
  return typeof value === 'string' && /^(YOUR_|REPLACE_|CHANGE_|<)/i.test(value.trim());
}

let app;
let auth = null;
let googleProvider = null;
let firebaseInitError = null;

try {
  const invalidFields = ['apiKey', 'authDomain', 'projectId', 'appId'].filter((key) => {
    const value = firebaseConfig[key];
    return !value || isPlaceholderValue(value);
  });

  if (invalidFields.length > 0) {
    throw new Error(`Invalid Firebase env vars: ${invalidFields.join(', ')}. Update frontend/.env.local.`);
  }

  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
  googleProvider.setCustomParameters({
    prompt: 'select_account',
    access_type: 'offline',
  });

  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    try {
      getAnalytics(app);
    } catch (analyticsErr) {
      console.warn('Analytics initialization warning:', analyticsErr.message);
    }
  }
} catch (err) {
  firebaseInitError = err.message || 'Firebase failed to initialize';
  console.error('Firebase initialization error:', err);
}

if (!auth) {
  firebaseInitError = firebaseInitError || 'Firebase Auth failed to initialize. Check your env configuration.';
}

if (!googleProvider && !firebaseInitError) {
  firebaseInitError = 'Google provider failed to initialize.';
}

export { auth, googleProvider, RecaptchaVerifier, firebaseInitError };
