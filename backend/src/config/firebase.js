let adminApp = null;
let isFirebaseConfigured = false;

try {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    isFirebaseConfigured = true;
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      try {
        adminApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        isFirebaseConfigured = true;
        console.log('Firebase Admin initialized successfully.');
      } catch (err) {
        console.error('Failed to initialize Firebase Admin:', err);
      }
    } else {
      console.warn('Firebase Admin credentials missing. Firebase login endpoint will be disabled.');
    }
  }
} catch (e) {
  console.warn('firebase-admin module not available:', e.message);
}

function getAuth() {
  if (!adminApp) return null;
  try {
    return require('firebase-admin/auth').getAuth(adminApp);
  } catch {
    return null;
  }
}

module.exports = {
  get isConfigured() { return isFirebaseConfigured && adminApp !== null; },
  getAuth,
};