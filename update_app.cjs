const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add import for PrivacyPolicy
if (!content.includes("import { PrivacyPolicy }")) {
  content = content.replace("import { OrderCoverPage } from './pages/OrderCoverPage';", "import { OrderCoverPage } from './pages/OrderCoverPage';\nimport { PrivacyPolicy } from './pages/PrivacyPolicy';");
}

// Add route for PrivacyPolicy
if (!content.includes('<Route path="/privacy" element={<PrivacyPolicy />} />')) {
  content = content.replace('          </Routes>', '            <Route path="/privacy" element={<PrivacyPolicy />} />\n          </Routes>');
}

// Add footer
const footerStr = `
        <footer className="bg-white border-t border-slate-200 mt-auto py-6">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Print Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-slate-500 hover:text-indigo-600 text-sm">Privacy Policy</Link>
            </div>
          </div>
        </footer>
`;

if (!content.includes('<footer className="bg-white border-t border-slate-200')) {
  content = content.replace('        </main>\n      </div>', '        </main>' + footerStr + '      </div>');
}

fs.writeFileSync('src/App.tsx', content);
