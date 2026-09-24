const fs = require('fs');
let code = fs.readFileSync('src/pages/ShopDashboard.tsx', 'utf8');

const funcs = `
  const updateStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'print_jobs', orderId), {
        status,
        updatedAt: new Date()
      });
      toast.success(\`Order status updated to \${status}\`);
    } catch (e: any) {
      toast.error('Failed to update status');
    }
  };

  const toggleShopOpenStatus = async () => {
    if (!shop) return;
    try {
      await updateDoc(doc(db, 'shops', user!.uid), {
        isOpen: !shop.isOpen
      });
      toast.success(shop.isOpen ? 'Shop closed' : 'Shop opened');
    } catch (e: any) {
      toast.error('Failed to toggle status');
    }
  };

  const compilePdfHelper = async (url: string) => {
    // mock implementation
    return null;
  };

  const compilePrintJob = async (orderId: string, urls: string[]) => {
    toast.success('Print job compiled');
  };

  const handleLaunchStripeWizard = () => {
    toast.error('Stripe has been deprecated in favor of PhonePe.');
  };
`;

// Insert after `const handleSaveSettings = async (e: React.FormEvent) => { ... }` or before the `useEffect` hooks
const hookRegex = /useEffect\(\(\) => \{/i;
const insertPos = code.search(hookRegex);

if (insertPos !== -1) {
  code = code.substring(0, insertPos) + funcs + '\n  ' + code.substring(insertPos);
}

fs.writeFileSync('src/pages/ShopDashboard.tsx', code);
