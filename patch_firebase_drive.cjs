const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf8');

code = code.replace(
  `export const googleProvider = new GoogleAuthProvider();`,
  `export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};
export const requireGoogleLogin = async () => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return cachedAccessToken;
  } catch (e) {
    throw e;
  }
};
`
);

code = code.replace(
  `export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {`,
  `export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return result.user;
  } catch (error) {`
);

code = code.replace(
  `export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {`,
  `export const logOut = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (error) {`
);

fs.writeFileSync('src/firebase.ts', code);
