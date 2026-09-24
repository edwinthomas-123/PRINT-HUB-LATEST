const fs = require('fs');
let code = fs.readFileSync('src/components/QuickReceiptTool.tsx', 'utf-8');

const replacement = `      const domtoimage = (await import('dom-to-image-more')).default;
      const imgData = await domtoimage.toPng(receiptRef.current, { scale: 3, bgcolor: '#ffffff' });
      
      const img = new Image();
      img.src = imgData;
      await new Promise(r => img.onload = r);
      const canvasWidth = img.width;
      const canvasHeight = img.height;
`;

code = code.replace(/const canvas = await html2canvas[\s\S]*?const imgData = canvas\.toDataURL\('image\/png'\);/, replacement);
code = code.replace(/canvas\.width/g, 'canvasWidth');
code = code.replace(/canvas\.height/g, 'canvasHeight');
fs.writeFileSync('src/components/QuickReceiptTool.tsx', code);
