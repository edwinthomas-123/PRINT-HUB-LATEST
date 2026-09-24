const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add import for TermsAndConditions
if (!content.includes("import { TermsAndConditions }")) {
  content = content.replace("import { PrivacyPolicy } from './pages/PrivacyPolicy';", "import { PrivacyPolicy } from './pages/PrivacyPolicy';\nimport { TermsAndConditions } from './pages/TermsAndConditions';");
}

// Add route for TermsAndConditions
if (!content.includes('<Route path="/terms" element={<TermsAndConditions />} />')) {
  content = content.replace('<Route path="/privacy" element={<PrivacyPolicy />} />', '<Route path="/privacy" element={<PrivacyPolicy />} />\n            <Route path="/terms" element={<TermsAndConditions />} />');
}

// Update footer to include Terms And Conditions
if (content.includes('<Link to="/privacy" className="text-slate-500 hover:text-indigo-600 text-sm">Privacy Policy</Link>')) {
  content = content.replace(
    '<Link to="/privacy" className="text-slate-500 hover:text-indigo-600 text-sm">Privacy Policy</Link>',
    '<Link to="/privacy" className="text-slate-500 hover:text-indigo-600 text-sm">Privacy Policy</Link>\n              <Link to="/terms" className="text-slate-500 hover:text-indigo-600 text-sm">Terms & Conditions</Link>'
  );
}

fs.writeFileSync('src/App.tsx', content);
