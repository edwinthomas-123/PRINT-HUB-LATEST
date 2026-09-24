import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));

initializeApp({
  credential: applicationDefault(),
  storageBucket: config.storageBucket
});

const bucket = getStorage().bucket();
console.log("Bucket name:", bucket.name);
