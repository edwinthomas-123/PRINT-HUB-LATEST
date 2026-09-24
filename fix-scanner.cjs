const fs = require('fs');
let code = fs.readFileSync('src/pages/Tools.tsx', 'utf-8');

// Replace the DocumentScannerTool mock import 
code = code.replace(
  "import { QRGeneratorTool, BarcodeGeneratorTool, ImageToPDFTool, RotatePDFTool, WatermarkPDFTool, CompressPDFTool, DocumentScannerTool, GenericMockTool",
  "import { QRGeneratorTool, BarcodeGeneratorTool, ImageToPDFTool, RotatePDFTool, WatermarkPDFTool, CompressPDFTool, GenericMockTool"
);

code = code.replace(
  "import { RemovePDFPasswordTool } from '../components/RemovePDFPasswordTool';",
  "import { RemovePDFPasswordTool } from '../components/RemovePDFPasswordTool';\nimport { DocumentScannerTool } from '../components/DocumentScannerTool';"
);

// We don't need to change the render block because it's already using <DocumentScannerTool> in Tools.tsx:
// {activeTool === 'Document Scanner' && <div className="max-w-2xl mx-auto"><DocumentScannerTool onBack={() => setActiveTool(null)} /></div>}

fs.writeFileSync('src/pages/Tools.tsx', code);
