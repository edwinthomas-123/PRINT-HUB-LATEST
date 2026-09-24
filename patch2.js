const fs = require('fs');
let content = fs.readFileSync('src/pages/ShopDashboard.tsx', 'utf8');
content = content.replace(/\{showStripeWizard && createPortal\([\s\S]*?\{\/\* Header \*\//m,
`{showStripeWizard && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true"></div>
          <div className="relative bg-white rounded-3xl w-[90vw] max-w-[500px] shadow-2xl border border-slate-100 overflow-hidden overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 text-left flex flex-col">
            {/* Header */`);
fs.writeFileSync('src/pages/ShopDashboard.tsx', content);

let content2 = fs.readFileSync('src/pages/ShopSetup.tsx', 'utf8');
content2 = content2.replace(/\{showStripeWizard && createPortal\([\s\S]*?\{\/\* Header \*\//m,
`{showStripeWizard && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden="true"></div>
          <div className="relative bg-white rounded-3xl w-[90vw] max-w-[500px] shadow-2xl border border-slate-100 overflow-hidden overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 text-left flex flex-col">
            {/* Header */`);
fs.writeFileSync('src/pages/ShopSetup.tsx', content2);
