const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopDashboard.tsx', 'utf8');

const importRegex = /import \{ Loader2, .*? \} from 'lucide-react';/;
code = code.replace(importRegex, (match) => {
  return match.replace('Loader2,', 'Loader2, QrCode, X,');
});

code = code.replace(`import { Link, useNavigate } from 'react-router-dom';`, `import { Link, useNavigate } from 'react-router-dom';\nimport { QRCodeSVG } from 'qrcode.react';`);

const stateRegex = /const \[shopStatus, setShopStatus\] = useState<'Open' \| 'Closed'>\('Closed'\);/;
code = code.replace(stateRegex, `const [shopStatus, setShopStatus] = useState<'Open' | 'Closed'>('Closed');\n  const [showQRModal, setShowQRModal] = useState(false);`);

const btnRegex = /<Link \n             to="\/tools"/;
code = code.replace(btnRegex, `<button 
            onClick={() => setShowQRModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            <QrCode className="w-4 h-4" /> Print QR
          </button>\n          <Link \n             to="/tools"`);

const modalJSX = `
      {showQRModal && shop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Print Shop QR</h3>
              <button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center" id="printable-qr-area">
              <h2 className="text-xl font-black text-slate-900 mb-2 text-center">{shop.name}</h2>
              <p className="text-sm text-slate-500 mb-6 text-center">Scan to print your documents instantly</p>
              <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                <QRCodeSVG 
                  value={\`\${window.location.origin}/shop/\${shop.id}/upload\`} 
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs font-mono text-slate-400 mt-6 tracking-widest uppercase">
                {window.location.host}/shop/{shop.id.substring(0, 8)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const printContents = document.getElementById('printable-qr-area')?.innerHTML;
                  const originalContents = document.body.innerHTML;
                  if (printContents) {
                    document.body.innerHTML = \`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">\${printContents}</div>\`;
                    window.print();
                    document.body.innerHTML = originalContents;
                    window.location.reload();
                  }
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition flex justify-center items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}
`;

const returnRegex = /return \(\n    <div className="space-y-8">/;
code = code.replace(returnRegex, `return (\n    <div className="space-y-8">\n${modalJSX}`);

fs.writeFileSync('src/pages/ShopDashboard.tsx', code);
