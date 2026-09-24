const fs = require('fs');
let code = fs.readFileSync('src/pages/Review.tsx', 'utf8');

const importAdd = `import { requireGoogleLogin } from '../firebase';
import { getOrCreateFolder, uploadFileToDrive } from '../drive';`;

code = code.replace(`import { useEffect, useState } from 'react';`, `import { useEffect, useState } from 'react';\n${importAdd}`);

const uploadLogicOld = `        let fileUrl = '';
        let filePath = '';
        if (f.file) {
          filePath = \`orders/\${auth.currentUser!.uid}/\${Date.now()}_\${f.fileName}\`;
          const formData = new FormData();
          formData.append('file', f.file, f.fileName);
          formData.append('path', filePath);
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          fileUrl = data.url;
        }`;

const uploadLogicNew = `        let fileUrl = '';
        let filePath = '';
        if (f.file) {
          if (f.file.size < 3 * 1024 * 1024) {
            // Upload to Google Drive for files < 3MB
            const accessToken = await requireGoogleLogin();
            const folderId = await getOrCreateFolder(accessToken, 'Print Shop Orders');
            const driveData = await uploadFileToDrive(accessToken, f.file, folderId);
            fileUrl = driveData.webViewLink;
            filePath = \`drive:\${driveData.id}\`;
          } else {
            filePath = \`orders/\${auth.currentUser!.uid}/\${Date.now()}_\${f.fileName}\`;
            const formData = new FormData();
            formData.append('file', f.file, f.fileName);
            formData.append('path', filePath);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            fileUrl = data.url;
          }
        }`;

code = code.replace(uploadLogicOld, uploadLogicNew);

fs.writeFileSync('src/pages/Review.tsx', code);
