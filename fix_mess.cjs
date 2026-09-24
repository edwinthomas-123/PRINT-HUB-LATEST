const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopSetup.tsx', 'utf-8');

code = code.replace(
  /const \[openingHours,\s*workingDays,\s*mapLink, setOpeningHours\] = useState\(\{ open: '09:00', close: '18:00' \}\);/,
  "const [openingHours, setOpeningHours] = useState({ open: '09:00', close: '18:00' });"
);

fs.writeFileSync('src/pages/ShopSetup.tsx', code);
