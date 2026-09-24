const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes("import { CookiePolicy }")) {
  content = content.replace("import { ContactUs } from './pages/ContactUs';", "import { ContactUs } from './pages/ContactUs';\nimport { CookiePolicy } from './pages/CookiePolicy';");
}

if (!content.includes('<Route path="/cookies" element={<CookiePolicy />} />')) {
  content = content.replace('<Route path="/contact" element={<ContactUs />} />', '<Route path="/contact" element={<ContactUs />} />\n            <Route path="/cookies" element={<CookiePolicy />} />');
}

if (content.includes('<Link to="/terms" className="text-slate-500 hover:text-indigo-600 text-sm">Terms & Conditions</Link>')) {
  content = content.replace(
    '<Link to="/terms" className="text-slate-500 hover:text-indigo-600 text-sm">Terms & Conditions</Link>',
    '<Link to="/terms" className="text-slate-500 hover:text-indigo-600 text-sm">Terms & Conditions</Link>\n              <Link to="/cookies" className="text-slate-500 hover:text-indigo-600 text-sm">Cookie Policy</Link>'
  );
}

fs.writeFileSync('src/App.tsx', content);
