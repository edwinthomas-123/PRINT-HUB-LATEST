const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes("import { FAQ }")) {
  content = content.replace("import { Disclaimer } from './pages/Disclaimer';", "import { Disclaimer } from './pages/Disclaimer';\nimport { FAQ } from './pages/FAQ';");
}

if (!content.includes('<Route path="/faq" element={<FAQ />} />')) {
  content = content.replace('<Route path="/disclaimer" element={<Disclaimer />} />', '<Route path="/disclaimer" element={<Disclaimer />} />\n            <Route path="/faq" element={<FAQ />} />');
}

if (content.includes('<Link to="/contact" className="text-slate-500 hover:text-indigo-600 text-sm">Contact</Link>') && !content.includes('<Link to="/faq"')) {
  content = content.replace(
    '<Link to="/contact" className="text-slate-500 hover:text-indigo-600 text-sm">Contact</Link>',
    '<Link to="/contact" className="text-slate-500 hover:text-indigo-600 text-sm">Contact</Link>\n              <Link to="/faq" className="text-slate-500 hover:text-indigo-600 text-sm">FAQ</Link>'
  );
}

fs.writeFileSync('src/App.tsx', content);
