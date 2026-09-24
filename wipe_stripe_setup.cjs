const fs = require('fs');

function wipeStripeFromSetup() {
  let code = fs.readFileSync('src/pages/ShopSetup.tsx', 'utf8');

  // Find the block starting at `              <div className={\`border p-4 rounded-xl flex flex-col justify-between transition-all \$\{`
  // and ending at `                )}` then `              </div>`
  const startRegex = /<div className=\{`border p-4 rounded-xl flex flex-col justify-between transition-all \$\{[\s\S]*?Stripe Payouts[\s\S]*?<\/button>\n\s*<\/div>\n\s*\)\s*:\s*\([\s\S]*?<\/button>\n\s*\}\)\n\s*<\/div>/;
  
  // Actually, I can just find the `<div className={\`border p-4 rounded-xl` with `Stripe Payouts` and replace it with PhonePe info block.
  
  // Wait, let's just use string replace. I will search for the specific SVG line which is unique.
  let svgStart = code.indexOf('<svg className="w-4 h-4 text-[#635BFF]"');
  if (svgStart !== -1) {
    let blockStart = code.lastIndexOf('<div className={`border p-4 rounded-xl', svgStart);
    let blockEnd = code.indexOf('              </div>\n\n              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col justify-between">', blockStart);
    if (blockStart !== -1 && blockEnd !== -1) {
      let replacement = `<div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-amber-900 text-sm mb-1 flex items-center gap-1.5">
                    PhonePe Integration
                  </h3>
                  <p className="text-amber-700 text-xs mb-3">
                    Configure your PhonePe Payment Gateway from the Partner Dashboard after completing shop setup.
                  </p>
                </div>
              </div>`;
      code = code.substring(0, blockStart) + replacement + code.substring(blockEnd);
    }
  }

  // Remove handleLaunchStripeWizard
  code = code.replace(/const handleLaunchStripeWizard[\s\S]*?\} catch \(e\) \{[\s\S]*?\} finally \{[\s\S]*?\}[\s\S]*?\};/g, '');
  
  fs.writeFileSync('src/pages/ShopSetup.tsx', code);
}

wipeStripeFromSetup();
