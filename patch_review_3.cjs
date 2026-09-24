const fs = require('fs');
let code = fs.readFileSync('src/pages/Review.tsx', 'utf8');

code = code.replace(/const getStripePromise = \([\s\S]*?return stripePromiseInstance;\n\};/g, '');
code = code.replace(/interface CheckoutFormProps \{[\s\S]*?\}\n/g, '');
code = code.replace(/import \{ loadStripe.*?;/g, '');

fs.writeFileSync('src/pages/Review.tsx', code);
