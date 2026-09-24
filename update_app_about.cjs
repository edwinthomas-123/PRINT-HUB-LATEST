const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes("import { AboutUs }")) {
  content = content.replace("import { TermsAndConditions } from './pages/TermsAndConditions';", "import { TermsAndConditions } from './pages/TermsAndConditions';\nimport { AboutUs } from './pages/AboutUs';");
}

if (!content.includes('<Route path="/about" element={<AboutUs />} />')) {
  content = content.replace('<Route path="/terms" element={<TermsAndConditions />} />', '<Route path="/terms" element={<TermsAndConditions />} />\n            <Route path="/about" element={<AboutUs />} />');
}

if (content.includes('<Link to="/terms" className="text-slate-500 hover:text-indigo-600 text-sm">Terms & Conditions</Link>')) {
  content = content.replace(
    '<Link to="/terms" className="text-slate-500 hover:text-indigo-600 text-sm">Terms & Conditions</Link>',
    '<Link to="/about" className="text-slate-500 hover:text-indigo-600 text-sm">About Us</Link>\n              <Link to="/terms" className="text-slate-500 hover:text-indigo-600 text-sm">Terms & Conditions</Link>'
  );
}

fs.writeFileSync('src/App.tsx', content);
