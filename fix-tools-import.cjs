const fs = require('fs');

// 1. Remove ImageCompressorTool mock from OtherTools.tsx
let otherTools = fs.readFileSync('src/components/OtherTools.tsx', 'utf-8');
otherTools = otherTools.replace(/export const ImageCompressorTool = [\s\S]*?;\n/, '');
// actually just add `export * from './ImageCompressorTool';` at the top or bottom of OtherTools.tsx
otherTools += "\nexport * from './ImageCompressorTool';\n";
fs.writeFileSync('src/components/OtherTools.tsx', otherTools);

