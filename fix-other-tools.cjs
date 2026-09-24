const fs = require('fs');

let otherTools = fs.readFileSync('src/components/OtherTools.tsx', 'utf-8');
// Remove DocumentScannerTool
otherTools = otherTools.replace(/export function DocumentScannerTool\(\{ onBack \}: \{ onBack: \(\) => void \}\) \{[\s\S]*?\}\n\n/g, '');

// Since it might not match perfectly if there's no trailing \n\n, let's just add export * from './DocumentScannerTool'
otherTools += "\nexport * from './DocumentScannerTool';\n";
fs.writeFileSync('src/components/OtherTools.tsx', otherTools);
