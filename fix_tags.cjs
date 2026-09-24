const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopSetup.tsx', 'utf8');
code = code.replace(
  /<div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col justify-between">\s*<div>\s*<h3 className="font-bold text-amber-900 text-sm mb-1 flex items-center gap-1\.5">\s*PhonePe Integration\s*<\/h3>\s*<p className="text-amber-700 text-xs mb-3">\s*Configure your PhonePe Payment Gateway from the Partner Dashboard after completing shop setup\.\s*<\/p>\s*<\/div>\s*<div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col justify-between">/,
  `<div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-amber-900 text-sm mb-1 flex items-center gap-1.5">
                    PhonePe Integration
                  </h3>
                  <p className="text-amber-700 text-xs mb-3">
                    Configure your PhonePe Payment Gateway from the Partner Dashboard after completing shop setup.
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col justify-between">`
);
fs.writeFileSync('src/pages/ShopSetup.tsx', code);
