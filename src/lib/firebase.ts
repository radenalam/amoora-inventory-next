import admin from 'firebase-admin';
import path from 'path';

let credential: admin.credential.Credential;

const credBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credBase64) {
  // Vercel: credentials stored as base64 env var
  const json = Buffer.from(credBase64, 'base64').toString('utf-8');
  credential = admin.credential.cert(JSON.parse(json));
} else {
  // Local/Docker: read from file
  credential = admin.credential.cert(path.join(process.cwd(), 'service-account.json'));
}

if (!admin.apps.length) {
  admin.initializeApp({ credential });
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
