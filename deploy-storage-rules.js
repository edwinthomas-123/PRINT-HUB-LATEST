import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
import { readFileSync } from 'fs';

initializeApp({
  credential: applicationDefault()
});

async function deploy() {
  try {
    const rules = getSecurityRules();
    const source = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`;
    
    console.log("Creating ruleset...");
    const ruleset = await rules.createRuleset({
      source: {
        files: [
          {
            name: "storage.rules",
            content: source
          }
        ]
      }
    });
    console.log("Ruleset created:", ruleset.name);
    
    console.log("Releasing ruleset to storage...");
    await rules.releaseFirestoreRulesetFromSource(source); // wait, this is for firestore.
  } catch (e) {
    console.error(e);
  }
}
deploy();
