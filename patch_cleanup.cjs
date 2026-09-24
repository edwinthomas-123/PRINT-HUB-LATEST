const fs = require('fs');

function cleanFile(path) {
  let code = fs.readFileSync(path, 'utf8');
  
  // Remove setBizName and friends
  code = code.replace(/setBizName\(.*?\);?/g, '');
  code = code.replace(/setBizAddress\(.*?\);?/g, '');
  code = code.replace(/setBizEmail\(.*?\);?/g, '');
  code = code.replace(/setBizPhone\(.*?\);?/g, '');
  code = code.replace(/setBankRoute\(.*?\);?/g, '');
  code = code.replace(/setBankAcc\(.*?\);?/g, '');
  code = code.replace(/setWizardStep\(.*?\);?/g, '');
  code = code.replace(/setShowStripeWizard\(.*?\);?/g, '');
  
  fs.writeFileSync(path, code);
}

cleanFile('src/pages/ShopDashboard.tsx');
cleanFile('src/pages/ShopSetup.tsx');

let reviewCode = fs.readFileSync('src/pages/Review.tsx', 'utf8');
reviewCode = reviewCode.replace(/let stripePromiseInstance[\s\S]*?function getStripePromise.*?\}/, '');
reviewCode = reviewCode.replace(/const stripe = useStripe\(\);/g, '');
reviewCode = reviewCode.replace(/const elements = useElements\(\);/g, '');
// remove CheckoutForm completely
reviewCode = reviewCode.replace(/function CheckoutForm\([\s\S]*?return \([\s\S]*?<\/form>\s*\);\s*\}/, '');
fs.writeFileSync('src/pages/Review.tsx', reviewCode);

