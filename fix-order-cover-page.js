const fs = require('fs');
let code = fs.readFileSync('src/pages/OrderCoverPage.tsx', 'utf-8');

const newHandlePrint = `  const handlePrint = async () => {
    if (!printAreaRef.current) return;
    try {
      const toastId = toast.loading("Generating PDF...");
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(\`PrintHub_CoverSlip_\${order?.token || 'Order'}.pdf\`);
      toast.success("PDF generated successfully!", { id: toastId });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF");
    }
  };`;

// replace handlePrint
code = code.replace(/const handlePrint = \(\) => \{[\s\S]*?window\.print\(\);[\s\S]*?  \};\n/, newHandlePrint + "\n");
fs.writeFileSync('src/pages/OrderCoverPage.tsx', code);
