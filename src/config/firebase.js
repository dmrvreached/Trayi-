import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = path.resolve('../../mrvtraryi-firebase-adminsdk-fbsvc-6be4d1d446.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
