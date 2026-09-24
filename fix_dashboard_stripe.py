import re

with open('src/pages/ShopDashboard.tsx', 'r') as f:
    content = f.read()

start_str = '{/* Stripe Payment Integration Section */}'
end_str = '{/* Form Save Button */}'

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    replacement = """{/* PhonePe Payment Integration Section */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    PhonePe Payment Gateway
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl mt-1">
                    Manage your PhonePe API credentials to accept online payments securely.
                  </p>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Merchant ID</label>
                      <input 
                        type="text" 
                        value={editPhonepeMerchantId} 
                        onChange={e => setEditPhonepeMerchantId(e.target.value)} 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                        placeholder="e.g. PGTESTPAYUAT" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Salt Index</label>
                      <input 
                        type="text" 
                        value={editPhonepeSaltIndex} 
                        onChange={e => setEditPhonepeSaltIndex(e.target.value)} 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                        placeholder="e.g. 1" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Salt Key</label>
                      <input 
                        type="password" 
                        value={editPhonepeSaltKey} 
                        onChange={e => setEditPhonepeSaltKey(e.target.value)} 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                        placeholder="Enter your PhonePe Salt Key" 
                      />
                    </div>
                  </div>
                </div>
              </div>
              """
    
    new_content = content[:start_idx] + replacement + content[end_idx:]
    with open('src/pages/ShopDashboard.tsx', 'w') as f:
        f.write(new_content)
    print("Replaced Stripe with PhonePe in ShopDashboard.tsx")
else:
    print(f"Could not find start or end index. start={start_idx}, end={end_idx}")
    
