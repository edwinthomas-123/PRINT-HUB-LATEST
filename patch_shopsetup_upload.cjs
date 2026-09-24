const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopSetup.tsx', 'utf8');

const importAdd = `import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';`;

code = code.replace(`import { db, handleFirestoreError, OperationType } from '../firebase';`, importAdd);

const handleCoverUploadOld = `const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.15, maxWidthOrHeight: 800 });
      const reader = new FileReader();
      reader.onload = (event) => setCover(event.target?.result as string);
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error(error);
    }
  };`;

const handleCoverUploadNew = `const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setSaving(true);
      const imageCompression = (await import('browser-image-compression')).default;
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.15, maxWidthOrHeight: 800 });
      
      const storageRef = ref(storage, \`shops/\${user.uid}/cover_\${Date.now()}\`);
      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);
      setCover(url);
    } catch (error) {
      console.error(error);
      alert("Failed to upload cover image.");
    } finally {
      setSaving(false);
    }
  };`;

const handleLogoUploadOld = `const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.1, maxWidthOrHeight: 512 });
      const reader = new FileReader();
      reader.onload = (event) => setLogo(event.target?.result as string);
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error(error);
    }
  };`;

const handleLogoUploadNew = `const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setSaving(true);
      const imageCompression = (await import('browser-image-compression')).default;
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.1, maxWidthOrHeight: 512 });
      
      const storageRef = ref(storage, \`shops/\${user.uid}/logo_\${Date.now()}\`);
      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);
      setLogo(url);
    } catch (error) {
      console.error(error);
      alert("Failed to upload logo.");
    } finally {
      setSaving(false);
    }
  };`;

code = code.replace(handleCoverUploadOld, handleCoverUploadNew);
code = code.replace(handleLogoUploadOld, handleLogoUploadNew);

const shopDataOld = `const shopData: Partial<Shop> = {
        name, address, services, coverImage: cover, logo, paperSizes, printers, openingHours, workingDays, mapLink,
        isOpen: true,
        pricing
      };`;

const shopDataNew = `const shopData: Partial<Shop> = {
        name, address, services, coverImage: cover, logo, paperSizes, printers, openingHours, workingDays, mapLink,
        isOpen: true,
        pricing,
        ownerId: user.uid
      };`;

code = code.replace(shopDataOld, shopDataNew);

fs.writeFileSync('src/pages/ShopSetup.tsx', code);
