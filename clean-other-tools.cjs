const fs = require('fs');
const lines = fs.readFileSync('src/components/OtherTools.tsx', 'utf-8').split('\n');

// Find the line index where 'export const ShopLayoutTool = (props: any)' is
const shopIndex = lines.findIndex(line => line.includes('export const ShopLayoutTool = (props: any)'));

// Find the line index for the end of CompressPDFTool, which is just before the stray {stream && !photo
const startSearch = lines.findIndex(line => line.includes('export function CompressPDFTool'));
let endIndex = -1;
for (let i = startSearch; i < lines.length; i++) {
  if (lines[i].includes('{stream && !photo && (')) {
    endIndex = i;
    break;
  }
}

if (endIndex !== -1 && shopIndex !== -1) {
  const newLines = [...lines.slice(0, endIndex), ...lines.slice(shopIndex)];
  fs.writeFileSync('src/components/OtherTools.tsx', newLines.join('\n'));
} else {
  console.log('Could not find indices', endIndex, shopIndex);
}
