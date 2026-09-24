const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCode = `try {
        await file.makePublic();
      } catch (e) {
        console.warn("Could not make public", e.message);
      }
      
      const publicUrl = \\\`https://storage.googleapis.com/\\\${bucket.name}/\\\${destPath}\\\`;
      res.json({ url: publicUrl });`;

const newCode = `const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '01-01-2100'
      });
      res.json({ url });`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('server.ts', code);
