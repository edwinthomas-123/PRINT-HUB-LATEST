const fs = require('fs');
let code = fs.readFileSync('src/pages/OrderCoverPage.tsx', 'utf-8');

const replacementHandlePrint = `      const domtoimage = (await import('dom-to-image-more')).default;
      const { jsPDF } = await import('jspdf');

      const elemW = printAreaRef.current.scrollWidth || 794;
      const elemH = printAreaRef.current.scrollHeight || 1123;

      const imgData = await domtoimage.toJpeg(printAreaRef.current, {
        quality: 1.0,
        scale: 4,
        bgcolor: '#ffffff',
        width: elemW,
        height: elemH
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (elemH * pdfWidth) / elemW;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }`;

code = code.replace(/const domtoimage = \(await import\('dom-to-image-more'\)\)\.default;[\s\S]*?pdf\.addImage\(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight\);/, replacementHandlePrint);

// Also fix handleDownloadGrayscalePdf
const replacementGrayscale = `      const domtoimage = (await import('dom-to-image-more')).default;
      const elemW = printAreaRef.current.scrollWidth || 794;
      const elemH = printAreaRef.current.scrollHeight || 1123;

      // create a canvas from dom-to-image to manipulate pixels
      const dataUrl = await domtoimage.toPng(printAreaRef.current, {
        scale: 4,
        bgcolor: '#ffffff',
        width: elemW,
        height: elemH
      });`;

code = code.replace(/const domtoimage = \(await import\('dom-to-image-more'\)\)\.default;\s*\/\/ create a canvas from dom-to-image to manipulate pixels[\s\S]*?bgcolor: '#ffffff'\n      \}\);/, replacementGrayscale);

fs.writeFileSync('src/pages/OrderCoverPage.tsx', code);
