const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopDashboard.tsx', 'utf8');

// Replace "Stripe Connect Onboarding & Payouts" block
const startStripe = code.indexOf('              {/* Stripe Payment Integration Section */}');
if (startStripe !== -1) {
  // Find the end of this block which is likely before </form>
  const endStripe = code.indexOf('            </div>\n            \n            <div className="flex justify-end pt-4 border-t border-slate-100">');
  
  if (endStripe !== -1) {
    const replacement = `              {/* PhonePe Payment Integration Section */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    PhonePe Payment Gateway
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl mt-1">
                    Manage your PhonePe API credentials to accept online payments.
                  </p>
                </div>
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
`;
    code = code.substring(0, startStripe) + replacement + code.substring(endStripe);
  }
}

// Remove the obsolete handleLaunchStripeWizard function from ShopDashboard if it exists
code = code.replace(/const handleLaunchStripeWizard[\s\S]*?\} catch \(e\) \{[\s\S]*?\} finally \{[\s\S]*?\}[\s\S]*?\};/g, '');

fs.writeFileSync('src/pages/ShopDashboard.tsx', code);
