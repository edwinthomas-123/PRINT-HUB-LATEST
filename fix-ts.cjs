const fs = require('fs');
let code = fs.readFileSync('src/components/DocumentScannerTool.tsx', 'utf-8');

code = code.replace(
  "import wasmUrl from 'wascanner/wasm?url';",
  "// @ts-ignore\nimport wasmUrl from 'wascanner/wasm?url';"
);
code = code.replace(
  "import wasmExecUrl from 'wascanner/wasm-exec?url';",
  "// @ts-ignore\nimport wasmExecUrl from 'wascanner/wasm-exec?url';"
);
code = code.replace(
  "import workerUrl from 'wascanner/worker?url';",
  "// @ts-ignore\nimport workerUrl from 'wascanner/worker?url';"
);

fs.writeFileSync('src/components/DocumentScannerTool.tsx', code);
