const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopSetup.tsx', 'utf8');

const regex = /if \(data\.pricing\) setPricing\(\{...DEFAULT_PRICING, ...data\.pricing\}\);/g;

const newFallback = `if (data.pricing) {
            setPricing({
              ...DEFAULT_PRICING,
              ...data.pricing,
              bwPage1: data.pricing.bwPage1 ?? data.pricing.bwBase ?? 5,
              bwPage2To15: data.pricing.bwPage2To15 ?? data.pricing.bwBase ?? 3,
              bwPage16Plus: data.pricing.bwPage16Plus ?? data.pricing.bwBase ?? 2,
              colorPage1: data.pricing.colorPage1 ?? data.pricing.colorBase ?? 15,
              colorPage2To15: data.pricing.colorPage2To15 ?? data.pricing.colorBase ?? 10,
              colorPage16Plus: data.pricing.colorPage16Plus ?? data.pricing.colorBase ?? 8,
            });
          }`;

code = code.replace(regex, newFallback);
fs.writeFileSync('src/pages/ShopSetup.tsx', code);
