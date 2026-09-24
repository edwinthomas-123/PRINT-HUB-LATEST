const fs = require('fs');
let code = fs.readFileSync('src/pages/Tools.tsx', 'utf-8');

const compressorCard = `              <div onClick={() => setActiveTool('Image Compressor')} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col hover:border-green-500 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <span className="material-symbols-outlined text-green-500 text-3xl mb-4 group-hover:scale-110 transition-transform">photo_size_select_small</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Image Compressor</h3>
                <p className="text-sm text-slate-500">Compress images to a specific file size.</p>
              </div>`;

code = code.replace(/<h3 className="text-lg font-bold text-slate-900 mb-2">Passport Photo<\/h3>[\s\S]*?<\/p>\s*<\/div>/, match => {
  return match + "\n" + compressorCard;
});

fs.writeFileSync('src/pages/Tools.tsx', code);
