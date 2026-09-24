const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopDashboard.tsx', 'utf-8');

const replacement = `                    const domtoimage = (await import('dom-to-image-more')).default;
                    const { jsPDF } = await import('jspdf');

                    const elemW = element.scrollWidth || 300;
                    const elemH = element.scrollHeight || 300;

                    const imgData = await domtoimage.toJpeg(element, {
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

code = code.replace(/const domtoimage = \(await import\('dom-to-image-more'\)\)\.default;[\s\S]*?pdf\.addImage\(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight\);/, replacement);
fs.writeFileSync('src/pages/ShopDashboard.tsx', code);
