const fs = require('fs');
let code = fs.readFileSync('src/components/QuickReceiptTool.tsx', 'utf-8');

const replacement = `      const domtoimage = (await import('dom-to-image-more')).default;
      const elemW = receiptRef.current.scrollWidth;
      const elemH = receiptRef.current.scrollHeight;

      const imgData = await domtoimage.toPng(receiptRef.current, { 
        scale: 4, 
        bgcolor: '#ffffff',
        width: elemW,
        height: elemH
      });
      
      const img = new Image();
      img.src = imgData;
      await new Promise(r => img.onload = r);
      const canvasWidth = img.width;
      const canvasHeight = img.height;
`;

code = code.replace(/const domtoimage = \(await import\('dom-to-image-more'\)\)\.default;\n      const imgData = await domtoimage\.toPng\(receiptRef\.current, \{ scale: 3, bgcolor: '#ffffff' \}\);\n      \n      const img = new Image\(\);\n      img\.src = imgData;\n      await new Promise\(r => img\.onload = r\);\n      const canvasWidth = img\.width;\n      const canvasHeight = img\.height;/m, replacement);
fs.writeFileSync('src/components/QuickReceiptTool.tsx', code);
