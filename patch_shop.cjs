const fs = require('fs');

const files = ['src/pages/ShopDashboard.tsx', 'src/pages/ShopSetup.tsx'];
for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');

  // Strip all the wizard step logic out entirely
  code = code.replace(/\{showStripeWizard[\s\S]*?animate-fade-in pb-12">/, '<div className="flex flex-col lg:flex-row gap-8 animate-fade-in pb-12">');
  
  // also catch the end of the portal wrapper just in case
  code = code.replace(/createPortal\(/g, '//');
  
  // just remove `{showStripeWizard && ...}` entirely. 
  // It starts with `{showStripeWizard && (` and ends right before `<div className="flex flex-col lg:flex-row`.
  
  const portalIndex = code.indexOf('{showStripeWizard &&');
  const mainDivIndex = code.indexOf('<div className="flex flex-col lg:flex-row gap-8 animate-fade-in pb-12">');
  
  if (portalIndex !== -1 && mainDivIndex !== -1 && portalIndex < mainDivIndex) {
    code = code.substring(0, portalIndex) + code.substring(mainDivIndex);
  }

  // Remove `setWizardStep`, `setBizName` calls in useEffect or handle functions
  // Since we don't have those states, any function calling them will fail.
  // Actually, there is an `editStripeAccountId` still left somewhere.
  code = code.replace(/editStripeAccountId/g, 'editPhonepeMerchantId');
  code = code.replace(/setEditStripeAccountId/g, 'setEditPhonepeMerchantId');
  code = code.replace(/stripeAccountId/g, 'phonepeMerchantId');
  code = code.replace(/setStripeAccountId/g, 'setPhonepeMerchantId');

  fs.writeFileSync(file, code);
}
