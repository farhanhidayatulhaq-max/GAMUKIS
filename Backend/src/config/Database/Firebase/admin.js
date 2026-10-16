require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
let serviceAccount;

if (serviceAccountJson) {
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (error) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON bukan JSON yang valid.');
  }
} else if (serviceAccountPath) {
  const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File Firebase service account tidak ditemukan: ${absolutePath}`);
  }

  serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
} else {
  throw new Error(
    'Konfigurasi Firebase belum ada. Isi FIREBASE_SERVICE_ACCOUNT_PATH atau FIREBASE_SERVICE_ACCOUNT_JSON di Backend/.env.'
  );
}

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

const firebaseAuth = getAuth(firebaseApp);
const firebaseDatabase = getDatabase(firebaseApp);

module.exports = { firebaseAuth, firebaseDatabase };