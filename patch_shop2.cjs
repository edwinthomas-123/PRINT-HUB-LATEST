const fs = require('fs');

const files = ['src/pages/ShopDashboard.tsx', 'src/pages/ShopSetup.tsx'];
for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');

  // We need to cut out the portal completely.
  const portalStart = code.indexOf('{showStripeWizard &&');
  if (portalStart !== -1) {
    const portalEnd = code.lastIndexOf(',\n      document.body\n      )}');
    if (portalEnd !== -1) {
      code = code.substring(0, portalStart) + code.substring(portalEnd + ',\n      document.body\n      )}'.length);
    }
  }

  fs.writeFileSync(file, code);
}
