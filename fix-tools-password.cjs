const fs = require('fs');
let code = fs.readFileSync('src/pages/Tools.tsx', 'utf-8');

// Add import
code = code.replace(
  "import { CVBuilderTool } from '../components/CVBuilderTool';",
  "import { CVBuilderTool } from '../components/CVBuilderTool';\nimport { RemovePDFPasswordTool } from '../components/RemovePDFPasswordTool';"
);

// Replace render
code = code.replace(
  /{activeTool === 'Remove PDF Password' && <div className="max-w-2xl mx-auto"><GenericMockTool name="Remove PDF Password" desc="Unlock password-protected PDFs before printing." icon={KeyRound} btnLabel="Unlock PDF" onBack={\(\) => setActiveTool\(null\)} \/><\/div>}/,
  "{activeTool === 'Remove PDF Password' && <div className=\"max-w-2xl mx-auto\"><RemovePDFPasswordTool onBack={() => setActiveTool(null)} /></div>}"
);

fs.writeFileSync('src/pages/Tools.tsx', code);
