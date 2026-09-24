const fs = require('fs');
let code = fs.readFileSync('src/pages/Tools.tsx', 'utf-8');

const passwordCard = `              <div onClick={() => setActiveTool('Remove PDF Password')} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col hover:border-orange-500 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <span className="material-symbols-outlined text-orange-500 text-3xl mb-4 group-hover:scale-110 transition-transform">key_off</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Remove Password</h3>
                <p className="text-sm text-slate-500">Unlock password-protected PDFs before printing.</p>
              </div>`;

code = code.replace(/<h3 className="text-lg font-bold text-slate-900 mb-2">Watermark PDF<\/h3>[\s\S]*?<\/p>\s*<\/div>/, match => {
  return match + "\n" + passwordCard;
});

fs.writeFileSync('src/pages/Tools.tsx', code);
