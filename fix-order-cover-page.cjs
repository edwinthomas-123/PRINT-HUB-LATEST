const fs = require('fs');
let code = fs.readFileSync('src/pages/OrderCoverPage.tsx', 'utf-8');

const replacementHandlePrint = `      const domtoimage = (await import('dom-to-image-more')).default;
      const { jsPDF } = await import('jspdf');

      const imgData = await domtoimage.toJpeg(printAreaRef.current, {
        quality: 1.0,
        scale: 2,
        bgcolor: '#ffffff'
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const elemW = printAreaRef.current.clientWidth || 794;
      const elemH = printAreaRef.current.clientHeight || 1123;
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (elemH * pdfWidth) / elemW;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);`;

code = code.replace(/const html2canvas = \(await import\('html2canvas'\)\)\.default;[\s\S]*?pdf\.addImage\(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight\);/, replacementHandlePrint);

// Also fix handleDownloadGrayscalePdf which is using html2canvas directly and ctx
const replacementGrayscale = `      const domtoimage = (await import('dom-to-image-more')).default;
      // create a canvas from dom-to-image to manipulate pixels
      const dataUrl = await domtoimage.toPng(printAreaRef.current, {
        scale: 2,
        bgcolor: '#ffffff'
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise(r => img.onload = r);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = brightness;
          data[i + 1] = brightness;
          data[i + 2] = brightness;
        }
        ctx.putImageData(imgData, 0, 0);
      }
      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);`;

code = code.replace(/const canvas = await html2canvas\(printAreaRef\.current, \{[\s\S]*?const imgDataUrl = canvas\.toDataURL\('image\/jpeg', 0\.95\);/, replacementGrayscale);

fs.writeFileSync('src/pages/OrderCoverPage.tsx', code);
