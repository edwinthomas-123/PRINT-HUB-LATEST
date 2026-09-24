const fs = require('fs');
let code = fs.readFileSync('src/pages/Upload.tsx', 'utf8');

const regex = /const bwPage1 = pricing\.bwPage1 \?\? 5;[\s\S]*?const colorPage16Plus = pricing\.colorPage16Plus \?\? 8;/s;

const newFallback = `const bwPage1 = pricing.bwPage1 ?? pricing.bwBase ?? 5;
    const bwPage2To15 = pricing.bwPage2To15 ?? pricing.bwBase ?? 3;
    const bwPage16Plus = pricing.bwPage16Plus ?? pricing.bwBase ?? 2;
    
    const colorPage1 = pricing.colorPage1 ?? pricing.colorBase ?? 15;
    const colorPage2To15 = pricing.colorPage2To15 ?? pricing.colorBase ?? 10;
    const colorPage16Plus = pricing.colorPage16Plus ?? pricing.colorBase ?? 8;`;

code = code.replace(regex, newFallback);
fs.writeFileSync('src/pages/Upload.tsx', code);
