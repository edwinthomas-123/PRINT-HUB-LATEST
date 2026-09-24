const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes("import { Disclaimer }")) {
  content = content.replace("import { AcceptableUsePolicy } from './pages/AcceptableUsePolicy';", "import { AcceptableUsePolicy } from './pages/AcceptableUsePolicy';\nimport { Disclaimer } from './pages/Disclaimer';");
}

if (!content.includes('<Route path="/disclaimer" element={<Disclaimer />} />')) {
  content = content.replace('<Route path="/aup" element={<AcceptableUsePolicy />} />', '<Route path="/aup" element={<AcceptableUsePolicy />} />\n            <Route path="/disclaimer" element={<Disclaimer />} />');
}

if (content.includes('<Link to="/aup" className="text-slate-500 hover:text-indigo-600 text-sm">Acceptable Use</Link>') && !content.includes('<Link to="/disclaimer"')) {
  content = content.replace(
    '<Link to="/aup" className="text-slate-500 hover:text-indigo-600 text-sm">Acceptable Use</Link>',
    '<Link to="/aup" className="text-slate-500 hover:text-indigo-600 text-sm">Acceptable Use</Link>\n              <Link to="/disclaimer" className="text-slate-500 hover:text-indigo-600 text-sm">Disclaimer</Link>'
  );
}

fs.writeFileSync('src/App.tsx', content);
