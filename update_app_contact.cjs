const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes("import { ContactUs }")) {
  content = content.replace("import { AboutUs } from './pages/AboutUs';", "import { AboutUs } from './pages/AboutUs';\nimport { ContactUs } from './pages/ContactUs';");
}

if (!content.includes('<Route path="/contact" element={<ContactUs />} />')) {
  content = content.replace('<Route path="/about" element={<AboutUs />} />', '<Route path="/about" element={<AboutUs />} />\n            <Route path="/contact" element={<ContactUs />} />');
}

if (content.includes('<Link to="/about" className="text-slate-500 hover:text-indigo-600 text-sm">About Us</Link>')) {
  content = content.replace(
    '<Link to="/about" className="text-slate-500 hover:text-indigo-600 text-sm">About Us</Link>',
    '<Link to="/about" className="text-slate-500 hover:text-indigo-600 text-sm">About Us</Link>\n              <Link to="/contact" className="text-slate-500 hover:text-indigo-600 text-sm">Contact</Link>'
  );
}

fs.writeFileSync('src/App.tsx', content);
