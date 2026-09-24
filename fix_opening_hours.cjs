const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopSetup.tsx', 'utf-8');

code = code.replace(
  /onChange=\{e => setOpeningHours\(\{\.\.\.openingHours,\s*workingDays,\s*mapLink,\s*open: e\.target\.value\}\)\}/,
  "onChange={e => setOpeningHours({...openingHours, open: e.target.value})}"
);

code = code.replace(
  /onChange=\{e => setOpeningHours\(\{\.\.\.openingHours,\s*workingDays,\s*mapLink,\s*close: e\.target\.value\}\)\}/,
  "onChange={e => setOpeningHours({...openingHours, close: e.target.value})}"
);

fs.writeFileSync('src/pages/ShopSetup.tsx', code);
