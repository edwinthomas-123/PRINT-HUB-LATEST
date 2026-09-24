const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopSetup.tsx', 'utf8');

const coverOld = `const storageRef = ref(storage, \`shops/\${user.uid}/cover_\${Date.now()}\`);
      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);
      setCover(url);`;

const coverNew = `const formData = new FormData();
      formData.append('file', compressedFile, 'cover.jpg');
      formData.append('path', \`shops/\${user.uid}/cover_\${Date.now()}.jpg\`);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCover(data.url);`;

const logoOld = `const storageRef = ref(storage, \`shops/\${user.uid}/logo_\${Date.now()}\`);
      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);
      setLogo(url);`;

const logoNew = `const formData = new FormData();
      formData.append('file', compressedFile, 'logo.jpg');
      formData.append('path', \`shops/\${user.uid}/logo_\${Date.now()}.jpg\`);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogo(data.url);`;

code = code.replace(coverOld, coverNew);
code = code.replace(logoOld, logoNew);
fs.writeFileSync('src/pages/ShopSetup.tsx', code);
