import admin from 'firebase-admin';
import path from 'path';

const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
