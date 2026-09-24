const fs = require('fs');
let code = fs.readFileSync('src/components/CVBuilderTool.tsx', 'utf-8');

const replacement = `      const domtoimage = (await import('dom-to-image-more')).default;
      const { jsPDF } = await import('jspdf');

      const imgData = await domtoimage.toJpeg(cvRef.current, {
        quality: 1.0,
        scale: 2,
        bgcolor: '#ffffff'
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Get natural dimensions from the element instead of a rendered canvas
      const elemW = cvRef.current.clientWidth || 794; // approx A4 width at 96dpi
      const elemH = cvRef.current.clientHeight || 1123;
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (elemH * pdfWidth) / elemW;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);`;

code = code.replace(/const html2canvas = \(await import\('html2canvas'\)\)\.default;[\s\S]*?pdf\.addImage\(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight\);/, replacement);
fs.writeFileSync('src/components/CVBuilderTool.tsx', code);
