const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});
console.log("Success!");
