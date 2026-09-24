const fs = require('fs');
let code = fs.readFileSync('src/pages/Upload.tsx', 'utf8');

const regex = /let sheetPrice = 0;[\s\S]*?if \(isDouble\) \{/s;

const newPricingLogic = `
    const totalBwPages = uploadFiles.filter(f => f.settings.color === 'Black & White' && !f.settings.paperSize.includes('Photo')).reduce((acc, f) => {
      let p = f.pagesCount;
      if (f.settings.pages && f.settings.pages.toLowerCase() !== 'all') p = parsePageRange(f.settings.pages, f.pagesCount);
      return acc + p * f.settings.copies;
    }, 0);

    const totalColorPages = uploadFiles.filter(f => f.settings.color === 'Color' && !f.settings.paperSize.includes('Photo')).reduce((acc, f) => {
      let p = f.pagesCount;
      if (f.settings.pages && f.settings.pages.toLowerCase() !== 'all') p = parsePageRange(f.settings.pages, f.pagesCount);
      return acc + p * f.settings.copies;
    }, 0);

    let sheetPrice = 0;
    
    const bwPage1 = pricing.bwPage1 ?? 5;
    const bwPage2To15 = pricing.bwPage2To15 ?? 3;
    const bwPage16Plus = pricing.bwPage16Plus ?? 2;
    
    const colorPage1 = pricing.colorPage1 ?? 15;
    const colorPage2To15 = pricing.colorPage2To15 ?? 10;
    const colorPage16Plus = pricing.colorPage16Plus ?? 8;

    if (isColor) {
      let baseColorPrice = colorPage1;
      if (totalColorPages === 1) baseColorPrice = colorPage1;
      else if (totalColorPages > 1 && totalColorPages <= 15) baseColorPrice = colorPage2To15;
      else if (totalColorPages > 15) baseColorPrice = colorPage16Plus;
      
      if (isDouble) sheetPrice = pricing.colorDoubleSide || (baseColorPrice * 1.5);
      else sheetPrice = baseColorPrice;
    } else {
      let baseBwPrice = bwPage1;
      if (totalBwPages === 1) baseBwPrice = bwPage1;
      else if (totalBwPages > 1 && totalBwPages <= 15) baseBwPrice = bwPage2To15;
      else if (totalBwPages > 15) baseBwPrice = bwPage16Plus;
      
      if (isDouble) sheetPrice = pricing.bwDoubleSide || (baseBwPrice * 1.5);
      else sheetPrice = baseBwPrice;
    }

    if (settings.paperSize === 'A3') sheetPrice *= pricing.a3Multiplier || 2;
    if (settings.paperType === 'Glossy') sheetPrice += pricing.glossyAddon || 5;
    
    if (isDouble) {`;

code = code.replace(regex, newPricingLogic);

fs.writeFileSync('src/pages/Upload.tsx', code);
