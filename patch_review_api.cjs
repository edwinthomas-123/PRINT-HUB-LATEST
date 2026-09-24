const fs = require('fs');
let code = fs.readFileSync('src/pages/Review.tsx', 'utf8');

const oldCode = `const storageRef = ref(storage, filePath);
          await uploadBytes(storageRef, f.file);
          fileUrl = await getDownloadURL(storageRef);`;

const newCode = `const formData = new FormData();
          formData.append('file', f.file, f.fileName);
          formData.append('path', filePath);
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          fileUrl = data.url;`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/pages/Review.tsx', code);
