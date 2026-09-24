const fs = require('fs');
const files = ['src/pages/ShopDashboard.tsx', 'src/pages/ShopSetup.tsx'];
for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  // Just use regex to strip out everything from `{showStripeWizard &&` to the final `)}` before `</div>\n  );`
  
  const endRegex = /document\.body\s*\)\s*\}/;
  const match = code.match(endRegex);
  if (match) {
    const portalStart = code.indexOf('{showStripeWizard &&');
    if (portalStart !== -1) {
       code = code.substring(0, portalStart) + code.substring(match.index + match[0].length);
    }
  }

  // Also remove unused variables that were causing tsc errors
  code = code.replace(/const \[wizardStep, setWizardStep\].*?\n/g, '');
  code = code.replace(/const \[showStripeWizard, setShowStripeWizard\].*?\n/g, '');
  
  fs.writeFileSync(file, code);
}
