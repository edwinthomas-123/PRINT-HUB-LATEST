const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopDashboard.tsx', 'utf8');

// Replace state
code = code.replace(/const \[editStripeAccountId, setEditStripeAccountId\] = useState<string>\(''\);/g, 
  "const [editPhonepeMerchantId, setEditPhonepeMerchantId] = useState<string>('');\n  const [editPhonepeSaltKey, setEditPhonepeSaltKey] = useState<string>('');\n  const [editPhonepeSaltIndex, setEditPhonepeSaltIndex] = useState<string>('');");

code = code.replace(/setEditStripeAccountId\(shop\.stripeAccountId \|\| ''\);/g, 
  "setEditPhonepeMerchantId(shop.phonepeMerchantId || '');\n      setEditPhonepeSaltKey(shop.phonepeSaltKey || '');\n      setEditPhonepeSaltIndex(shop.phonepeSaltIndex || '');");

code = code.replace(/stripeAccountId: editStripeAccountId,/g, "phonepeMerchantId: editPhonepeMerchantId, phonepeSaltKey: editPhonepeSaltKey, phonepeSaltIndex: editPhonepeSaltIndex,");

// Remove wizard state
code = code.replace(/const \[showStripeWizard, setShowStripeWizard\] = useState\(false\);.*?$/gm, '');
code = code.replace(/const \[wizardStep, setWizardStep\] = useState\(0\);.*?$/gm, '');
// just removing everything up to `BankAcc`
code = code.replace(/const \[bizName, setBizName\] = useState\(''\);[\s\S]*?const \[bankAcc, setBankAcc\] = useState\(''\);/, '');
code = code.replace(/\{showStripeWizard && createPortal\([\s\S]*?\)\}      <div className="flex flex-col lg:flex-row gap-8 animate-fade-in pb-12">/, '<div className="flex flex-col lg:flex-row gap-8 animate-fade-in pb-12">');

let stripeUiRegex = /<h3 className="font-bold text-slate-900 text-sm mb-4">Payouts & Stripe Integration<\/h3>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/form>/;

let phonepeUi = `<h3 className="font-bold text-slate-900 text-sm mb-4">PhonePe Integration</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Merchant ID</label>
                    <input type="text" value={editPhonepeMerchantId} onChange={e => setEditPhonepeMerchantId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="e.g. PGTESTPAYUAT" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Salt Key</label>
                    <input type="password" value={editPhonepeSaltKey} onChange={e => setEditPhonepeSaltKey(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="e.g. 099eb0cd-02cf-4e2a-8aca-3e6c6aff0399" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Salt Index</label>
                    <input type="text" value={editPhonepeSaltIndex} onChange={e => setEditPhonepeSaltIndex(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="e.g. 1" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                type="submit"
                disabled={savingSettings}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold tracking-wide hover:bg-indigo-500 transition shadow-sm shadow-indigo-200 flex items-center gap-2 cursor-pointer"
              >
                {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {savingSettings ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </form>`;

code = code.replace(stripeUiRegex, phonepeUi);

fs.writeFileSync('src/pages/ShopDashboard.tsx', code);
