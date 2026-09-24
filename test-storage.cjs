const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const config = require('./firebase-applet-config.json');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: config.storageBucket
});

const bucket = getStorage().bucket();
console.log("Bucket name:", bucket.name);
