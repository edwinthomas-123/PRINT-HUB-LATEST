const fs = require('fs');
let code = fs.readFileSync('src/pages/Tools.tsx', 'utf8');

// remove QuickReceiptTool from OtherTools import
code = code.replace(/, QuickReceiptTool } from '\.\.\/components\/OtherTools';/, "} from '../components/OtherTools';");
// add import for QuickReceiptTool
code = code.replace(/import \{ QRGeneratorTool,/, "import { QuickReceiptTool } from '../components/QuickReceiptTool';\nimport { QRGeneratorTool,");

fs.writeFileSync('src/pages/Tools.tsx', code);
