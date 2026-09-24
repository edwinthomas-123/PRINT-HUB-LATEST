const parsePageRange = (rangeStr, maxPages) => {
  if (!rangeStr || rangeStr.toLowerCase() === 'all') return maxPages;
  return 1; // mock
};
const pricing = {};
const bwPage1 = pricing.bwPage1 ?? 5;
const bwPage2To15 = pricing.bwPage2To15 ?? 3;
const bwPage16Plus = pricing.bwPage16Plus ?? 2;
const pagesToPrint = 2;
const totalBwPages = 2;
let baseBwPrice = bwPage1;
if (totalBwPages === 1) baseBwPrice = bwPage1;
else if (totalBwPages > 1 && totalBwPages <= 15) baseBwPrice = bwPage2To15;
else if (totalBwPages > 15) baseBwPrice = bwPage16Plus;
console.log(baseBwPrice);
