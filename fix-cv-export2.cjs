const fs = require('fs');
let code = fs.readFileSync('src/components/CVBuilderTool.tsx', 'utf-8');

const replacement = `      const domtoimage = (await import('dom-to-image-more')).default;
      const { jsPDF } = await import('jspdf');

      const elemW = cvRef.current.scrollWidth || 794;
      const elemH = cvRef.current.scrollHeight || 1123;

      const imgData = await domtoimage.toJpeg(cvRef.current, {
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
      }

      pdf.save(\`\${data.name.replace(/\\s+/g, '_')}_CV.pdf\`);`;

// We need to replace from "const domtoimage = " to "pdf.save..."
code = code.replace(/const domtoimage = \(await import\('dom-to-image-more'\)\)\.default;[\s\S]*?pdf\.save\(`\$\{data\.name\.replace\(\/\\s\+\/g, '_'\)\}_CV\.pdf`\);/, replacement);
fs.writeFileSync('src/components/CVBuilderTool.tsx', code);
