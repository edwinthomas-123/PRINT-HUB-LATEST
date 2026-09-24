const fs = require('fs');
let code = fs.readFileSync('src/pages/Review.tsx', 'utf8');

code = code.replace(/user!\.uid/g, 'auth.currentUser!.uid');
code = code.replace(/generateOrderToken\(\)/g, "Math.random().toString(36).substring(2, 8).toUpperCase()");

fs.writeFileSync('src/pages/Review.tsx', code);
