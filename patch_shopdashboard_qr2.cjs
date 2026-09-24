const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopDashboard.tsx', 'utf8');

const oldPrintFn = `const printContents = document.getElementById('printable-qr-area')?.innerHTML;
                  const originalContents = document.body.innerHTML;
                  if (printContents) {
                    document.body.innerHTML = \\\`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">\\\${printContents}</div>\\\`;
                    window.print();
                    document.body.innerHTML = originalContents;
                    window.location.reload();
                  }`;

const newPrintFn = `window.print();`;

code = code.replace(oldPrintFn, newPrintFn);
fs.writeFileSync('src/pages/ShopDashboard.tsx', code);
