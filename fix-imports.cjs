const fs = require('fs');
['src/pages/ShopDashboard.tsx', 'src/pages/OrderCoverPage.tsx', 'src/components/QuickReceiptTool.tsx'].forEach(file => {
  let code = fs.readFileSync(file, 'utf-8');
  code = code.replace(/import html2canvas from 'html2canvas';\n/, '');
  fs.writeFileSync(file, code);
});
