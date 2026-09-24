const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopDashboard.tsx', 'utf-8');

const replacement = `                    const domtoimage = (await import('dom-to-image-more')).default;
                    const { jsPDF } = await import('jspdf');

                    const imgData = await domtoimage.toJpeg(element, {
                      quality: 1.0,
                      scale: 2,
                      bgcolor: '#ffffff'
                    });

                    const pdf = new jsPDF({
                      orientation: 'portrait',
                      unit: 'mm',
                      format: 'a4'
                    });

                    const elemW = element.clientWidth || 300;
                    const elemH = element.clientHeight || 300;

                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (elemH * pdfWidth) / elemW;

                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);`;

code = code.replace(/const html2canvas = \(await import\('html2canvas'\)\)\.default;[\s\S]*?pdf\.addImage\(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight\);/, replacement);

fs.writeFileSync('src/pages/ShopDashboard.tsx', code);
