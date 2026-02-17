import * as admin from 'firebase-admin';

export const initializeFirebase = () => {
  // Check if Firebase is enabled via environment variable
  const firebaseEnabled = process.env.FIREBASE_ENABLED === 'true';

  if (!firebaseEnabled) {
    console.log(
      'Firebase is disabled via FIREBASE_ENABLED environment variable',
    );
    return null;
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin;
};
