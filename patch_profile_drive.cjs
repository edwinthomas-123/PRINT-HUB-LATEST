const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

const regex = /<div className="flex items-start gap-3 mb-3">.*?<p className="text-\[10px\] text-slate-400 mt-1">\{new Date\(f.createdAt\).toLocaleDateString\('en-IN'\)\}<\/p>\s*<\/div>\s*<\/div>/s;

const newCode = `<div className="flex items-start gap-3 mb-3">
                     <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 shrink-0">
                       <FileText className="w-5 h-5" />
                     </div>
                     <div className="overflow-hidden">
                       <h4 className="font-semibold text-sm text-slate-900 truncate" title={f.fileName}>{f.fileName}</h4>
                       <p className="text-xs text-slate-500">{(f.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                       <p className="text-[10px] text-slate-400 mt-1">{new Date(f.createdAt).toLocaleDateString('en-IN')}</p>
                     </div>
                   </div>
                   {f.fileUrl && f.filePath && f.filePath.startsWith('drive:') && (
                     <div className="mt-1 mb-2">
                       <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                         View in Google Drive
                       </a>
                     </div>
                   )}`;

code = code.replace(regex, newCode);

fs.writeFileSync('src/pages/Profile.tsx', code);
