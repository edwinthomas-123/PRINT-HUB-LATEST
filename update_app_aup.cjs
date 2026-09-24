const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes("import { AcceptableUsePolicy }")) {
  content = content.replace("import { CookiePolicy } from './pages/CookiePolicy';", "import { CookiePolicy } from './pages/CookiePolicy';\nimport { AcceptableUsePolicy } from './pages/AcceptableUsePolicy';");
}

if (!content.includes('<Route path="/aup" element={<AcceptableUsePolicy />} />')) {
  content = content.replace('<Route path="/cookies" element={<CookiePolicy />} />', '<Route path="/cookies" element={<CookiePolicy />} />\n            <Route path="/aup" element={<AcceptableUsePolicy />} />');
}

if (content.includes('<Link to="/cookies" className="text-slate-500 hover:text-indigo-600 text-sm">Cookie Policy</Link>') && !content.includes('<Link to="/aup"')) {
  content = content.replace(
    '<Link to="/cookies" className="text-slate-500 hover:text-indigo-600 text-sm">Cookie Policy</Link>',
    '<Link to="/cookies" className="text-slate-500 hover:text-indigo-600 text-sm">Cookie Policy</Link>\n              <Link to="/aup" className="text-slate-500 hover:text-indigo-600 text-sm">Acceptable Use</Link>'
  );
}

fs.writeFileSync('src/App.tsx', content);
