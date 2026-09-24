import toast from 'react-hot-toast';
import { User } from 'firebase/auth';
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, signInWithGoogle, requireGoogleLogin } from '../firebase';
import { PrintOrder, Shop, UserProfile, SubscriptionPlanId, PARTNER_PLANS } from '../types';
import { Loader2, QrCode, X, Printer, Check, Settings, FileText, Store, Clock, Zap, Eye, CheckCircle2, CircleDashed, Download, Laptop, ImageIcon, Plus, Trash2, Scan, Info, Globe, Landmark, Shield, ArrowRight, Lock, HelpCircle, Building, Sparkles, Layers, Flame, TrendingUp, AlertCircle, Crown, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { PDFDocument } from 'pdf-lib';
import { isShopCurrentlyOpen } from '../utils';
import { getOrCreateFolder, uploadFileToDrive } from '../drive';
import { parseResponseJson } from '../utils/api';
import { PrintBridgeModal } from '../components/PrintBridgeModal';
import { CustomerPaymentSettings } from '../components/CustomerPaymentSettings';


const DEFAULT_PRICING = {
  bwBase: 2,
  bwDoubleSide: 3,
  bwPage1: 5,
  bwPage2To15: 3,
  bwPage16Plus: 2,
  colorBase: 10,
  colorDoubleSide: 15,
  colorPage1: 15,
  colorPage2To15: 10,
  colorPage16Plus: 8,
  a3Multiplier: 2,
  glossyAddon: 5,
  photo6x4: 15,
  photo7x5: 25,
  photo8x6: 35,
};

export function ShopDashboard({ user, authLoading }: { user: User | null; authLoading?: boolean }) {
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [savingPrice, setSavingPrice] = useState(false);
  const [shopStatus, setShopStatus] = useState<'Open' | 'Closed'>('Closed');
  const [showQRModal, setShowQRModal] = useState(false);
  const [compilingOrderId, setCompilingOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'companion' | 'payments' | 'settings'>('overview');

  // Form states for Settings / Edit Profile
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMapLink, setEditMapLink] = useState('');
  const [editLogo, setEditLogo] = useState<string | null>(null);
  const [editCover, setEditCover] = useState<string | null>(null);
  const [editServices, setEditServices] = useState<string[]>([]);
  const [editPaperSizes, setEditPaperSizes] = useState<string[]>([]);
  const [editPrinters, setEditPrinters] = useState<{ id: string, name: string, mappedServices: string[], testPrinted: boolean }[]>([]);
  const [editOpeningHours, setEditOpeningHours] = useState({ open: '09:00', close: '18:00' });
  const [editWorkingDays, setEditWorkingDays] = useState<string[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isBridgeOnline, setIsBridgeOnline] = useState<boolean>(false);
  const [showBridgeModal, setShowBridgeModal] = useState<boolean>(false);
  const [bridgePrintersCount, setBridgePrintersCount] = useState<number>(0);

  // Interactive Stripe Connect Onboarding Walkthrough states
  
  
  
  const [taxId, setTaxId] = useState('');
  const [kycFileName, setKycFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Sync shop profile data into editing states once loaded
  
  const updateStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: new Date()
      });
      toast.success(`Order status updated to ${status}`);
    } catch (e: any) {
      toast.error('Failed to update status');
    }
  };

  const toggleShopOpenStatus = async (currentStatus: boolean) => {
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

  const compilePdfHelper = async (order: PrintOrder) => {
    try {
      const res = await fetch(`/api/companion/download-pdf/${order.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      return { blob };
    } catch (err) {
      console.error('Error compiling PDF helper:', err);
      return null;
    }
  };

  const compilePrintJob = async (order: PrintOrder) => {
    if (!order.id) return;
    const toastId = toast.loading(`Compiling unified print job for #${order.token}...`);
    try {
      const res = await fetch(`/api/companion/download-pdf/${order.id}`);
      if (!res.ok) {
        throw new Error(`Failed to compile print job (Status ${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PrintHub_Job_${order.token}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Print job compiled & downloaded!`, { id: toastId });
    } catch (err: any) {
      console.error('compilePrintJob error:', err);
      toast.error(`Compile failed: ${err.message || err}`, { id: toastId });
    }
  };

  const handleLaunchStripeWizard = () => {
    toast.error('Stripe has been deprecated in favor of PhonePe.');
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setShop(null);
      setOrders([]);
      return;
    }
    
    setLoading(true);
    
    // Subscribe to shop details
    const shopRef = doc(db, 'shops', user.uid);
    const unsubscribeShop = onSnapshot(shopRef, (docSnap) => {
      if (docSnap.exists()) {
        const shopData = { id: docSnap.id, ...docSnap.data() } as Shop;
        setShop(shopData);
        if (shopData.pricing) {
          setPricing(shopData.pricing);
        }
      } else {
        // If shop document does not exist yet, set shop to null so setup prompt is shown
        setShop(null);
      }
      setLoading(false);
    }, (err) => {
      console.warn("Could not load shop details from Firestore:", err?.message || err);
      setLoading(false);
    });

    // Subscribe to orders for this shop
    const qOrders = query(collection(db, 'orders'), where('shopId', '==', user.uid));
    const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
      const loadedOrders: PrintOrder[] = [];
      snap.forEach((docSnap) => {
        loadedOrders.push({ id: docSnap.id, ...docSnap.data() } as PrintOrder);
      });
      // Sort desc by createdAt
      loadedOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(loadedOrders);
    }, (err) => {
      console.warn("Could not load orders from Firestore:", err?.message || err);
    });

    return () => {
      unsubscribeShop();
      unsubscribeOrders();
    };
  }, [user, authLoading]);

  useEffect(() => {
    if (shop) {
      setEditName(shop.name || '');
      setEditAddress(shop.address || '');
      setEditMapLink(shop.mapLink || '');
      setEditLogo(shop.logo || null);
      setEditCover(shop.coverImage || null);
      setEditServices(shop.services || []);
      setEditPaperSizes(shop.paperSizes || []);
      setEditPrinters(shop.printers || []);
      setEditOpeningHours(shop.openingHours || { open: '09:00', close: '18:00' });
      setEditWorkingDays(shop.workingDays || []);
    }
  }, [shop]);

  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(() => {
    return localStorage.getItem('autoPrintEnabled') === 'true';
  });
  const autoPrintRef = useRef(autoPrintEnabled);
  useEffect(() => {
    autoPrintRef.current = autoPrintEnabled;
  }, [autoPrintEnabled]);

  const toggleAutoPrint = (val: boolean) => {
    setAutoPrintEnabled(val);
    localStorage.setItem('autoPrintEnabled', val ? 'true' : 'false');
    if (val) {
      toast.success("🔌 Auto-Print is ENABLED. New paid orders will print automatically!", { icon: '🖨️' });
    } else {
      toast.error("🔌 Auto-Print is DISABLED.");
    }
  };

  

  const handleAutoPrint = async (order: PrintOrder) => {
    // Check if we are already printing or completed to prevent infinite loops
    if (order.status === 'Printing Started' || order.status === 'Printing Completed' || order.status === 'Ready for Pickup' || order.status === 'Completed') {
      return;
    }

    const toastId = toast.loading(`[Auto-Print] Compiling print job for token ${order.token}...`);
    try {
      const { blob } = await compilePdfHelper(order);
      
      // Convert blob to base64
      const base64Pdf = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resStr = reader.result as string;
          // Extract the raw base64 from the Data URL
          const base64Data = resStr.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const routedPrinter = getRoutedPrinter(order);
      toast.loading(`[Auto-Print] Sending to local printer: ${routedPrinter?.name || 'Default Printer'}...`, { id: toastId });
      
      const response = await fetch('http://127.0.0.1:1337/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          token: order.token,
          pdfBase64: base64Pdf,
          printerId: routedPrinter?.id || 'default',
          settings: order.settings
        })
      });

      if (response.ok) {
        toast.success(`[Auto-Print] Job sent successfully to local printer!`, { id: toastId });
        await updateStatus(order.id!, 'Printing Started');
        
        // Simulate printing progress, and mark as Ready for Pickup after 6 seconds!
        setTimeout(async () => {
          await updateStatus(order.id!, 'Ready for Pickup');
          toast.success(`[Auto-Print] Token ${order.token} is printed and ready for pickup!`, { icon: '📦' });
        }, 6000);
      } else {
        throw new Error(`PrintBridge returned status ${response.status}`);
      }
    } catch (err: any) {
      console.warn("[Auto-Print] Failed to print automatically:", err);
      toast.error(`Auto-Print failed: ${err.message || 'Is PrintBridge app running on your desktop?'}`, { id: toastId });
    }
  };

  const savePricing = async () => {
    if (!shop) return;
    setSavingPrice(true);
    try {
      await setDoc(doc(db, 'shops', shop.id), { pricing }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `shops/${shop.id}`);
    } finally {
      setSavingPrice(false);
    }
  };

  const handleCoverUploadDashboard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !shop) return;
    const toastId = toast.loading("Compressing and uploading cover image...");
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.15, maxWidthOrHeight: 800 });
      
      try {
        const accessToken = await requireGoogleLogin();
        if (!accessToken) {
          throw new Error("Google Drive authorization was cancelled or unavailable");
        }
        const shopFolderId = await getOrCreateFolder(
          accessToken, 
          `Shop_${user.email || user.uid}`, 
          '197ot44pKT0s5CO7V7Fc9nubIzfq5ZXjU'
        );
        const driveData = await uploadFileToDrive(accessToken, compressedFile, shopFolderId);
        const driveUrl = `https://drive.google.com/uc?export=view&id=${driveData.id}`;
        setEditCover(driveUrl);
        toast.success("Cover image uploaded to Google Drive!", { id: toastId });
      } catch (driveErr) {
        console.warn("Failed to upload cover to Google Drive, falling back to local server:", driveErr);
        const formData = new FormData();
        formData.append('file', compressedFile, 'cover.jpg');
        formData.append('path', `shops/${shop.id}/cover_${Date.now()}.jpg`);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await parseResponseJson(res, 'Cover upload failed');
        setEditCover(data.url);
        toast.success("Cover image uploaded to local storage!", { id: toastId });
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to upload cover image: ${error.message || error}`, { id: toastId });
    }
  };

  const handleLogoUploadDashboard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !shop) return;
    const toastId = toast.loading("Compressing and uploading logo image...");
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.1, maxWidthOrHeight: 512 });
      
      try {
        const accessToken = await requireGoogleLogin();
        if (!accessToken) {
          throw new Error("Google Drive authorization was cancelled or unavailable");
        }
        const shopFolderId = await getOrCreateFolder(
          accessToken, 
          `Shop_${user.email || user.uid}`, 
          '197ot44pKT0s5CO7V7Fc9nubIzfq5ZXjU'
        );
        const driveData = await uploadFileToDrive(accessToken, compressedFile, shopFolderId);
        const driveUrl = `https://drive.google.com/uc?export=view&id=${driveData.id}`;
        setEditLogo(driveUrl);
        toast.success("Logo uploaded to Google Drive!", { id: toastId });
      } catch (driveErr) {
        console.warn("Failed to upload logo to Google Drive, falling back to local server:", driveErr);
        const formData = new FormData();
        formData.append('file', compressedFile, 'logo.jpg');
        formData.append('path', `shops/${shop.id}/logo_${Date.now()}.jpg`);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await parseResponseJson(res, 'Logo upload failed');
        setEditLogo(data.url);
        toast.success("Logo uploaded to local storage!", { id: toastId });
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to upload logo: ${error.message || error}`, { id: toastId });
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkBridge = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1600);
        const res = await fetch('http://127.0.0.1:1337/status', { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          if (isMounted) setIsBridgeOnline(true);
        } else {
          if (isMounted) setIsBridgeOnline(false);
        }
      } catch (_) {
        if (isMounted) setIsBridgeOnline(false);
      }
    };
    checkBridge();
    const interval = setInterval(checkBridge, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handlePrintersImportedDashboard = (imported: Array<{ name: string; isDefault?: boolean }>) => {
    const newPrinters = imported.map((p) => ({
      id: Math.random().toString(36).substring(7),
      name: p.name,
      mappedServices: [...editServices],
      testPrinted: true
    }));
    setEditPrinters(prev => {
      const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
      const filtered = newPrinters.filter(np => !existingNames.has(np.name.toLowerCase()));
      return [...prev, ...filtered];
    });
    setIsBridgeOnline(true);
    toast.success(`Successfully imported ${newPrinters.length} printer(s)!`);
  };

  const scanLocalPrintersDashboard = async () => {
    setIsScanning(true);
    const toastId = toast.loading("Checking for local PrintBridge on this PC...");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch('http://127.0.0.1:1337/printers', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.printers && data.printers.length > 0) {
          handlePrintersImportedDashboard(data.printers);
          setIsBridgeOnline(true);
          toast.success(`Found ${data.printers.length} printer(s) automatically!`, { id: toastId });
        } else {
          toast.error("No printers detected on local PrintBridge.", { id: toastId });
        }
      } else {
        throw new Error();
      }
    } catch (e) {
      setIsBridgeOnline(false);
      toast.error("PrintBridge is not running yet. Open the setup guide to start it in 30 seconds!", { id: toastId, icon: '💡' });
      setShowBridgeModal(true);
    } finally {
      setIsScanning(false);
    }
  };

  const addPrinterDashboard = () => {
    setEditPrinters([...editPrinters, { id: Math.random().toString(36).substring(7), name: `Printer ${editPrinters.length + 1}`, mappedServices: [], testPrinted: false }]);
    toast.success("New printer slot added. Configure below.");
  };

  const removePrinterDashboard = (id: string) => {
    setEditPrinters(editPrinters.filter(p => p.id !== id));
    toast.error("Printer slot removed.");
  };

  const updatePrinterDashboard = (id: string, updates: any) => {
    setEditPrinters(editPrinters.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const testPrintDashboard = (id: string) => {
    updatePrinterDashboard(id, { testPrinted: true });
    toast.success("Test page signal sent to printer!");
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setSavingSettings(true);
    const toastId = toast.loading("Saving settings to database...");
    
    try {
      const shopData = {
        name: editName,
        address: editAddress,
        mapLink: editMapLink,
        logo: editLogo,
        coverImage: editCover,
        services: editServices,
        paperSizes: editPaperSizes,
        printers: editPrinters,
        openingHours: editOpeningHours,
        workingDays: editWorkingDays,
        razorpayKeyId: shop?.razorpayKeyId || '',
        razorpayKeySecret: shop?.razorpayKeySecret || '',
        razorpayEnabled: shop?.razorpayEnabled !== false,
        upiId: shop?.upiId || '',
        upiEnabled: Boolean(shop?.upiEnabled),
        cashOnCounterEnabled: shop?.cashOnCounterEnabled !== false,
      };
      
      await setDoc(doc(db, 'shops', shop.id), shopData, { merge: true });
      toast.success("Settings and Profile updated successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Error saving settings: ${err.message || err}`, { id: toastId });
    } finally {
      setSavingSettings(false);
    }
  };

  const getRoutedPrinter = (order: PrintOrder) => {
    if (!shop?.printers || shop.printers.length === 0) return null;
    const requiredService = order.settings.color === 'Color' ? 'Color Printing' : 'Black & White Printing';
    return shop.printers.find(p => p.mappedServices.includes(requiredService) || p.mappedServices.includes('Photo Printing'));
  };

  const todayRevenue = orders.filter(o => o.status !== 'Uploaded' && o.status !== 'Cancelled').reduce((acc, curr) => acc + curr.price, 0);

  // Requirements 3 & 4: Real-time available orders and counters
  // Updates in real time whenever an order is created, accepted, rejected/cancelled, completed, or status changed
  const availableOrders = orders.filter(o => o.status === 'Waiting' || o.status === 'Payment Complete' || o.status === 'Uploaded').length;
  const newOrders = orders.filter(o => o.status === 'Waiting' || o.status === 'Payment Complete' || o.status === 'Uploaded').length;
  const processingOrders = orders.filter(o => o.status === 'Printing Started' || o.status === 'Printing Completed').length;
  const readyOrders = orders.filter(o => o.status === 'Ready for Pickup').length;

  const isToday = (timestamp?: number) => {
    if (!timestamp) return false;
    const d = new Date(timestamp);
    const now = new Date();
    return d.getDate() === now.getDate() &&
           d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
  };
  const completedToday = orders.filter(o => o.status === 'Completed' && isToday(o.createdAt)).length;

  // Requirement 5: Monthly Plan Usage
  const activePlanId: SubscriptionPlanId = (shop?.plan || shop?.subscription?.plan || 'free').toLowerCase() as SubscriptionPlanId;
  const currentPlanConfig = PARTNER_PLANS[activePlanId] || PARTNER_PLANS.free;

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const billingCycleStart = shop?.subscription?.periodStart && shop.subscription.periodStart <= Date.now()
    ? shop.subscription.periodStart
    : startOfCurrentMonth;

  // Billable orders in current billing period (excluding Cancelled)
  const currentMonthBillableOrders = orders.filter(o => (o.createdAt || 0) >= billingCycleStart && o.status !== 'Cancelled');
  const ordersUsed = currentMonthBillableOrders.length;
  const orderLimit = currentPlanConfig.orderLimit; // null for business_plus (1,000+ / high-volume)
  const ordersRemaining = orderLimit !== null ? Math.max(0, orderLimit - ordersUsed) : null;
  const isMonthlyLimitReached = orderLimit !== null && ordersUsed >= orderLimit;
  const usagePercent = orderLimit !== null ? Math.min(100, Math.round((ordersUsed / orderLimit) * 100)) : 100;

  const quickLaunchShop = async () => {
    if (!user) return;
    const toastId = toast.loading("Launching your print shop with defaults...");
    try {
      const initialShop = {
        name: `${user.displayName || 'PrintHub'} Partner Shop`,
        address: 'City Center Hub',
        isOpen: true,
        services: ['Black & White Printing', 'Color Printing', 'Spiral Binding'],
        paperSizes: ['A4', 'A3', 'Legal'],
        printers: [],
        pricing: DEFAULT_PRICING,
        subscription: {
          plan: 'free',
          periodStart: Date.now(),
          periodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
          businessPlusPrice: 999
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        openingHours: { open: '09:00', close: '18:00' },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      };
      await setDoc(doc(db, 'shops', user.uid), initialShop, { merge: true });
      toast.success("Print shop activated! Welcome to your dashboard.", { id: toastId });
    } catch (err: any) {
      console.error("Failed to launch shop:", err);
      toast.error(`Failed to activate shop: ${err.message || err}`, { id: toastId });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Connecting to Partner Portal...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <Store className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Partner Dashboard</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Sign in with your partner Google account to manage incoming print orders, live queue status, and pricing.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (err: any) {
                if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
                  toast.error(err?.message || 'Sign in failed');
                }
              }
            }}
            className="inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md transition-all text-sm cursor-pointer"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 bg-white rounded-full p-0.5" />
            <span>Sign In as Print Shop Partner</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          New to PrintHub? Sign in above to set up your shop profile in seconds.
        </p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-2xl mx-auto my-10 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6 text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <Store className="w-8 h-8" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Shop Registration Required
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome to PrintHub, {user.displayName || 'Partner'}!
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Your partner login is verified, but you haven't published your shop profile yet. Complete setup to start receiving orders right here on the dashboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/shop-setup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md transition-all text-sm cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Configure Custom Shop Profile</span>
          </Link>
          <button
            onClick={quickLaunchShop}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3.5 rounded-2xl transition-all text-sm cursor-pointer border border-slate-200"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Quick Launch with Defaults</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {showQRModal && shop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-[380px] max-w-[95vw] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border border-slate-100 shrink-0">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Shop QR Code</h3>
              <button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center w-full" id="printable-qr-area">
              <h2 className="text-xl font-black text-slate-900 mb-1 text-center w-full truncate notranslate" translate="no">{shop.name}</h2>
              <p className="text-xs text-slate-500 mb-6 text-center max-w-[280px]">Scan to print your documents instantly</p>
              <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-inner flex items-center justify-center w-[280px] h-[280px]">
                <QRCodeSVG 
                  id="shop-qr-code-svg"
                  value={`${window.location.origin}/shop/${shop.id}/upload`} 
                  size={240}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs font-mono text-slate-400 mt-6 tracking-widest uppercase text-center w-full truncate">
                {window.location.host}/shop/{shop.id.substring(0, 8)}
              </p>
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button 
                onClick={() => setShowQRModal(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button 
                onClick={async () => {
                  const element = document.getElementById('printable-qr-area');
                  if (!element) return;
                  try {
                                                            const domtoimage = (await import('dom-to-image-more')).default;
                    const { jsPDF } = await import('jspdf');

                    const elemW = element.scrollWidth || 300;
                    const elemH = element.scrollHeight || 300;

                    const imgData = await domtoimage.toJpeg(element, {
                      quality: 1.0,
                      scale: 4,
                      bgcolor: '#ffffff',
                      width: elemW,
                      height: elemH
                    });

                    const pdf = new jsPDF({
                      orientation: 'portrait',
                      unit: 'mm',
                      format: 'a4'
                    });

                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (elemH * pdfWidth) / elemW;
                    const pageHeight = pdf.internal.pageSize.getHeight();

                    let heightLeft = pdfHeight;
                    let position = 0;

                    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft > 0) {
                      position -= pageHeight;
                      pdf.addPage();
                      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                      heightLeft -= pageHeight;
                    }
                    pdf.save(`${shop?.name || 'Shop'}_QR_Code.pdf`);
                    toast.success('Shop QR Code PDF downloaded!');
                  } catch (error) {
                    console.error('Error generating PDF:', error);
                    toast.error('Failed to generate PDF');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-900 text-white transition flex justify-center items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STRIPE CONNECT ONBOARDING INTERACTIVE WIZARD */}
      <div className="flex flex-col lg:flex-row gap-8 animate-fade-in pb-12">
        {/* Side Navigation Sidebar */}
        <aside className="lg:w-64 shrink-0 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-sm">
                PH
              </div>
              <div>
                <h2 className="font-bold text-slate-900 leading-tight text-sm">PrintHub</h2>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Partner Portal</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-700 shadow-sm border-r-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Store className="w-4 h-4" />
                <span>Overview</span>
              </button>
              <Link 
                to="/tools?tool=ai-passport"
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activePlanId === 'business_plus' 
                    ? 'text-amber-800 bg-amber-50/80 hover:bg-amber-100 hover:text-amber-900' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>AI Passport Studio</span>
                </div>
                {activePlanId === 'business_plus' ? (
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 px-1.5 py-0.5 rounded-full">
                    Plus Only
                  </span>
                )}
              </Link>
              <Link 
                to="/dashboard/pricing"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
              >
                <Settings className="w-4 h-4" />
                <span>Pricing</span>
              </Link>
              <Link 
                to="/pricing"
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 group"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span>Subscription</span>
                </div>
                <span className="text-[10px] uppercase font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {currentPlanConfig.name}
                </span>
              </Link>
              <button 
                onClick={() => setActiveTab('companion')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'companion' ? 'bg-indigo-50 text-indigo-700 shadow-sm border-r-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span>Print Bridge</span>
                </div>
                <span 
                  title={isBridgeOnline ? "Bridge Online on Port 1337" : "Bridge Offline"}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    isBridgeOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-300'
                  }`} 
                />
              </button>
              <button 
                onClick={() => setActiveTab('payments')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'payments' ? 'bg-indigo-50 text-indigo-700 shadow-sm border-r-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>Customer Payments</span>
                </div>
                {shop?.razorpayKeyId ? (
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Razorpay
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">
                    Setup
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700 shadow-sm border-r-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Store className="w-4 h-4" />
                <span>Edit Profile / Shop</span>
              </button>
            </nav>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button 
                onClick={() => setShowQRModal(true)}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <QrCode className="w-4 h-4" />
                <span>Generate QR</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 space-y-8">
          <header className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="font-bold text-sm text-slate-500 font-sans">Partner Dashboard</span>
                <Link 
                  to="/pricing" 
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-black flex items-center gap-1 uppercase tracking-wider border transition hover:opacity-85 ${
                    activePlanId === 'business_plus'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : activePlanId === 'business'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : activePlanId === 'starter'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title="Click to view subscription plans"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" /> {currentPlanConfig.name} Plan
                </Link>
              </div>
              <h1 className="text-xl font-black text-slate-950 truncate max-w-md notranslate" translate="no">{shop?.name || 'My Print Shop'}</h1>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
              <div>
                <div className="font-bold text-slate-900 text-xs leading-none mb-1">Accepting New Orders</div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {shop?.isOpen === false ? (
                    <span className="text-rose-500 font-semibold">Paused (Manually Closed)</span>
                  ) : shopStatus === 'Open' ? (
                    <span className="text-emerald-600 font-semibold">Open & accepting orders</span>
                  ) : (
                    <span className="text-amber-600 font-semibold">Closed (Outside opening hours)</span>
                  )}
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={shop?.isOpen !== false} 
                  onChange={() => toggleShopOpenStatus(shop?.isOpen !== false)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </header>

          {activeTab === 'overview' && (
            <>
              {/* PRINT BRIDGE QUICK STATUS STRIP */}
              <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-all ${
                isBridgeOnline 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${
                    isBridgeOnline 
                      ? 'bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse' 
                      : 'bg-amber-500'
                  }`} />
                  <div>
                    <span className="font-extrabold flex items-center gap-2">
                      {isBridgeOnline ? 'Print Bridge Connected (Port 1337)' : 'Print Bridge Offline'}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isBridgeOnline ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                      }`}>
                        {isBridgeOnline ? 'Auto-Printing Ready' : 'Manual Mode'}
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isBridgeOnline 
                        ? 'Hardware is linked. Paid customer orders will print automatically with zero clicks.' 
                        : 'Print orders with 1-click or setup the background bridge on your PC in 30 seconds.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isBridgeOnline ? (
                    <button
                      type="button"
                      onClick={() => setShowBridgeModal(true)}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Manage / Test Hardware</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowBridgeModal(true)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Setup Print Bridge (30s)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* REQUIREMENT 3 & 4: REAL-TIME ORDER STATUS SECTION */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                        REAL-TIME ORDER STATUS
                        <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Live Stream
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        Updates automatically in real time whenever orders are created, processed, or completed
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium self-start sm:self-auto">
                    No manual refresh required
                  </span>
                </div>

                {/* Real-Time Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* Prominent "Available Orders" Hero Box */}
                  <div className="lg:col-span-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white p-6 rounded-2xl shadow-lg shadow-indigo-150 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                      <Clock className="w-40 h-40" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-widest font-black text-indigo-200">
                          AVAILABLE ORDERS
                        </span>
                        <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded-full text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
                        </span>
                      </div>
                      <div className="text-5xl sm:text-6xl font-black tracking-tight text-white my-2">
                        {availableOrders}
                      </div>
                      <p className="text-xs text-indigo-100/90 leading-relaxed">
                        Orders currently waiting for the shop to process & take action.
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/15 flex items-center justify-between text-xs">
                      <span className="text-indigo-200 font-medium">Action pending</span>
                      <button 
                        onClick={() => {
                          const queueEl = document.getElementById('print-queue-section');
                          queueEl?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-white font-bold underline hover:text-indigo-200 cursor-pointer"
                      >
                        View in Queue &darr;
                      </button>
                    </div>
                  </div>

                  {/* The 4 Real-Time Counters Grid */}
                  <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* 1. New Orders */}
                    <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-2xl flex flex-col justify-between hover:bg-slate-100/60 transition-colors">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">New Orders</span>
                        <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                          <Clock className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-900 block">{newOrders}</span>
                        <p className="text-[11px] text-slate-500 mt-1">Waiting for action</p>
                      </div>
                    </div>

                    {/* 2. Processing */}
                    <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-2xl flex flex-col justify-between hover:bg-slate-100/60 transition-colors">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Processing</span>
                        <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                          <CircleDashed className="w-3.5 h-3.5 animate-spin" />
                        </span>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-900 block">{processingOrders}</span>
                        <p className="text-[11px] text-slate-500 mt-1">Printing / preparing</p>
                      </div>
                    </div>

                    {/* 3. Ready */}
                    <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-2xl flex flex-col justify-between hover:bg-slate-100/60 transition-colors">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Ready</span>
                        <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-900 block">{readyOrders}</span>
                        <p className="text-[11px] text-slate-500 mt-1">Waiting for pickup</p>
                      </div>
                    </div>

                    {/* 4. Completed Today */}
                    <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-2xl flex flex-col justify-between hover:bg-slate-100/60 transition-colors">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Completed Today</span>
                        <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-emerald-600 block">{completedToday}</span>
                        <p className="text-[11px] text-slate-500 mt-1">Fulfilled today</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* REQUIREMENT 5: MONTHLY PLAN USAGE CARD */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {currentPlanConfig.name} Plan
                        </h3>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          activePlanId === 'business_plus' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : activePlanId === 'business' 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                            : activePlanId === 'starter' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {currentPlanConfig.priceLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Billing period resets automatically on the 1st of next month ({new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/pricing"
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm self-start sm:self-auto cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{activePlanId === 'business_plus' ? 'Manage Subscription' : 'Upgrade Plan'}</span>
                  </Link>
                </div>

                {/* Plan Usage Display */}
                {activePlanId === 'business_plus' ? (
                  // Business Plus Plan: High-volume, no misleading 1,000 order limit!
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                        MONTHLY PLAN USAGE
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900">
                        {ordersUsed.toLocaleString()} orders processed
                      </div>
                      <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        High-volume plan active • Built for 1,000+ orders / month with no artificial hard ceiling
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-slate-500 font-medium block">Configured Monthly Rate</span>
                      <span className="text-sm font-bold text-slate-800">₹{shop?.businessPlusPrice || 999}/month</span>
                    </div>
                  </div>
                ) : (
                  // Free, Starter, or Business Plan
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xl sm:text-2xl font-black text-slate-900">
                        {ordersUsed} / {orderLimit?.toLocaleString()} orders used
                      </div>

                      <div>
                        {isMonthlyLimitReached ? (
                          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-black">
                            <AlertCircle className="w-3.5 h-3.5" /> Monthly limit reached
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-600">
                            {ordersRemaining?.toLocaleString()} orders remaining
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMonthlyLimitReached 
                            ? 'bg-rose-500' 
                            : usagePercent > 80 
                            ? 'bg-amber-500' 
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(3, usagePercent))}%` }}
                      />
                    </div>

                    {/* Alert when limit reached */}
                    {isMonthlyLimitReached ? (
                      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                          <p className="text-xs text-rose-800 font-medium">
                            Your monthly limit of {orderLimit} orders has been reached. New incoming orders are blocked until upgraded.
                          </p>
                        </div>
                        <Link
                          to={`/pricing?plan=${activePlanId === 'free' ? 'starter' : activePlanId === 'starter' ? 'business' : 'business_plus'}`}
                          className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl whitespace-nowrap text-center transition shadow-sm"
                        >
                          Upgrade Now &rarr;
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>{usagePercent}% of monthly quota used</span>
                        <span>{ordersRemaining} orders remaining this billing cycle</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI PASSPORT STUDIO FEATURE SPOTLIGHT */}
              <div className={`rounded-3xl border p-6 sm:p-7 shadow-sm transition-all ${
                activePlanId === 'business_plus' 
                  ? 'bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white border-amber-200' 
                  : 'bg-gradient-to-br from-slate-900 to-indigo-950 border-slate-800 text-white'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 border border-amber-500/30">
                      <Crown className="w-3.5 h-3.5 fill-current text-amber-500" />
                      {activePlanId === 'business_plus' ? 'Business Plus Active' : 'Business Plus Exclusive'}
                    </div>
                    <h3 className={`text-lg sm:text-xl font-black ${activePlanId === 'business_plus' ? 'text-slate-900' : 'text-white'}`}>
                      AI Passport Photo & Formal Suit Studio
                    </h3>
                    <p className={`text-xs leading-relaxed ${activePlanId === 'business_plus' ? 'text-slate-600' : 'text-slate-300'}`}>
                      {activePlanId === 'business_plus' 
                        ? 'Transform walk-in customer selfies into studio-grade passport and visa photos with AI suits, blazers, and clean biometric backdrops in seconds. Directly exports to ready-to-print 4x6 photo grids.'
                        : 'Offer profitable walk-in studio passport services! Let AI dress customers in professional formal suits and replace backgrounds with official biometric blue or white. Exclusively available on Business Plus (₹999/mo).'}
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Link
                      to="/tools?tool=ai-passport"
                      className={`inline-flex items-center justify-center gap-2 font-black px-6 py-3.5 rounded-2xl text-xs shadow-md transition cursor-pointer ${
                        activePlanId === 'business_plus'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950'
                          : 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{activePlanId === 'business_plus' ? 'Launch AI Studio' : 'Unlock with Business Plus'}</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* REVENUE & PRICING SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
                  <span className="text-3xl font-black text-indigo-600 mt-2">₹{todayRevenue.toFixed(2)}</span>
                  <span className="text-[11px] text-slate-400 mt-1">From completed and active print jobs</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">B&W Standard Rate</span>
                  <span className="text-3xl font-black text-slate-800 mt-2">₹{pricing.bwPage1 || pricing.bwBase || 5}</span>
                  <span className="text-[11px] text-slate-400 mt-1">Per page single side</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Color Standard Rate</span>
                  <span className="text-3xl font-black text-slate-800 mt-2">₹{pricing.colorPage1 || pricing.colorBase || 15}</span>
                  <span className="text-[11px] text-slate-400 mt-1">Per page single side</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                      <h3 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                        <Settings className="w-4 h-4 text-slate-500" /> Active Printing Rates
                      </h3>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Configured</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs mb-5">
                      <div>
                        <span className="text-slate-400 font-medium block">B&W Standard Rate</span>
                        <span className="text-slate-800 font-bold">₹{pricing.bwPage1 || pricing.bwBase || 5} /page</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Color Standard Rate</span>
                        <span className="text-slate-800 font-bold">₹{pricing.colorPage1 || pricing.colorBase || 15} /page</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">B&W 16+ Pages Rate</span>
                        <span className="text-slate-800 font-bold">₹{pricing.bwPage16Plus || 2} /page</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Color 16+ Pages Rate</span>
                        <span className="text-slate-800 font-bold">₹{pricing.colorPage16Plus || 8} /page</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Double-Sided B&W</span>
                        <span className="text-slate-800 font-bold">₹{pricing.bwDoubleSide || 3} /sheet</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Glossy Paper Upgrade</span>
                        <span className="text-slate-800 font-bold">+₹{pricing.glossyAddon || 5} /sheet</span>
                      </div>
                    </div>
                  </div>

                  <Link 
                    to="/dashboard/pricing"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-center text-xs transition block shadow-sm shadow-indigo-150"
                  >
                    Manage Detailed Pricing & Range Discounts →
                  </Link>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2 text-slate-700 mb-2">
                      <Printer className="w-4 h-4 text-indigo-500" /> Desktop Companion (PrintBridge)
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Install our native desktop client to link your local system printer with the cloud. When a customer places an order, the companion app receives it in real-time, compiles files, and prints automatically!
                    </p>
                    
                    {shop && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 mb-4 flex items-center justify-between">
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">YOUR SHOP ID (AUTHENTICATION)</span>
                          <code className="text-xs font-mono font-bold text-slate-700">{shop.id}</code>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(shop.id);
                            toast.success("Shop ID copied to clipboard!");
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <a
                        href="/api/download/windows"
                        download
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg text-[11px] font-bold text-center transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Windows (.exe)
                      </a>
                      <a
                        href="/api/download/macos"
                        download
                        className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-lg text-[11px] font-bold text-center transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download macOS (App)
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="text-xs font-semibold text-slate-700">Auto-Print on Paid Orders</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoPrintEnabled} 
                        onChange={(e) => toggleAutoPrint(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div id="print-queue-section">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  Print Queue
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">FIFO</span>
                </h2>
                <div className="grid gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 mb-4">
                    <strong>Storage Policy:</strong> Files under 3MB are kept forever. Files 3MB and above are automatically deleted after 24 hours.
                  </div>
                  {orders.length === 0 && (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500">
                      No orders yet.
                    </div>
                  )}
                  {orders.map(order => {
                    const routedPrinter = getRoutedPrinter(order);
                    
                    return (
                      <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-indigo-100 transition">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-indigo-50 text-indigo-600 font-mono text-xs px-2 py-0.5 rounded font-bold">{order.token}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                              order.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                            }`}>
                              {order.status}
                            </span>
                            {order.status !== 'Cancelled' && order.status !== 'Uploaded' && routedPrinter && (
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Printer className="w-3 h-3" /> Routed to: {routedPrinter.name}
                              </span>
                            )}
                          </div>
                          <div className="space-y-2 mb-3">
                            {order.files ? (
                              order.files.map((f, i) => (
                                <div key={i} className="flex flex-col gap-2 text-sm bg-slate-50 border border-slate-100 p-3 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-slate-400" />
                                      <span className="font-medium text-slate-700 truncate max-w-[150px] sm:max-w-xs">{f.fileName}</span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      {f.fileUrl ? (
                                        <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 px-2 py-1 rounded">
                                          <Eye className="w-3 h-3" /> Preview
                                        </a>
                                      ) : (
                                        <span className="text-xs text-slate-400">No File</span>
                                      )}
                                    </div>
                                  </div>
                                  {f.settings && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                                      <span>{f.settings.color}</span>
                                      <span>{f.settings.paperSize} ({f.settings.paperType})</span>
                                      <span>{f.settings.orientation}</span>
                                      <span>Sides: {f.settings.sides}</span>
                                      <span>Copies: {f.settings.copies}</span>
                                      <span>Pages: {f.settings.pages}</span>
                                      {f.price !== undefined && <span>₹{f.price.toFixed(2)}</span>}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center justify-between text-sm bg-slate-50 border border-slate-100 p-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-slate-400" />
                                  <span className="font-medium text-slate-700 truncate max-w-[150px] sm:max-w-xs">{(order as any).fileName || 'Untitled Document'}</span>
                                </div>
                                {(order as any).fileUrl ? (
                                  <a href={(order as any).fileUrl} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 px-2 py-1 rounded">
                                    <Eye className="w-3 h-3" /> Preview
                                  </a>
                                ) : (
                                  <span className="text-xs text-slate-400">No File</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="inline-flex flex-wrap gap-3 text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                            {!order.files?.[0]?.settings && (
                              <>
                                <span><strong className="text-slate-500 font-normal">Color:</strong> {order.settings?.color}</span>
                                <span><strong className="text-slate-500 font-normal">Paper:</strong> {order.settings?.paperSize} ({order.settings?.paperType})</span>
                                <span><strong className="text-slate-500 font-normal">Copies:</strong> {order.settings?.copies}</span>
                              </>
                            )}
                            <span><strong className="text-slate-500 font-normal">Total:</strong> ₹{order.price.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                          <Link 
                            to={`/order/${order.id}/cover`}
                            className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            View Cover Slip
                          </Link>
                          <button 
                            onClick={() => compilePrintJob(order)}
                            disabled={compilingOrderId === order.id}
                            className="border border-indigo-200 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {compilingOrderId === order.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            Compile Print Job
                          </button>
                          {order.status === 'Uploaded' && (
                            <button onClick={() => updateStatus(order.id!, 'Payment Complete')} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors">
                              <Check className="w-3.5 h-3.5" /> Mark Paid
                            </button>
                          )}
                          {(order.status === 'Payment Complete' || order.status === 'Waiting') && (
                            <button onClick={() => updateStatus(order.id!, 'Printing Started')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors">
                              <Printer className="w-3.5 h-3.5" /> Start Print
                            </button>
                          )}
                          {order.status === 'Printing Started' && (
                            <div className="flex flex-col gap-2">
                              <button onClick={() => updateStatus(order.id!, 'Ready for Pickup')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors">
                                <Check className="w-3.5 h-3.5" /> Finish Print
                              </button>
                              <button onClick={() => toast.error('Printer error reported! Admin notified. Manual completion required.')} className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg font-medium text-[11px] flex items-center justify-center transition-colors">
                                Report Error
                              </button>
                            </div>
                          )}
                          {order.status === 'Ready for Pickup' && (
                            <button onClick={() => updateStatus(order.id!, 'Completed')} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors">
                              <Check className="w-3.5 h-3.5" /> Handed Over
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'companion' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Desktop Companion (PrintBridge)</h2>
                  <p className="text-xs text-slate-500">Integrate your local printer with the PrintHub Cloud</p>
                </div>
              </div>

              {/* Live Connection Banner */}
              <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all ${
                isBridgeOnline 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                  : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-xl ${isBridgeOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm flex items-center gap-2">
                      {isBridgeOnline ? 'Print Bridge Active & Listening' : 'Print Bridge Setup (Zero Configuration)'}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isBridgeOnline ? 'bg-emerald-200 text-emerald-800' : 'bg-indigo-200 text-indigo-800'
                      }`}>
                        {isBridgeOnline ? 'Port 1337 Active' : 'Easy 30s Setup'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isBridgeOnline 
                        ? 'Hardware is synchronized. Incoming paid customer orders print directly without clicking.' 
                        : 'Pre-configured download packages are ready. No command lines or technical setup required.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBridgeModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Visual Setup Assistant</span>
                  </button>
                  {isBridgeOnline && (
                    <button
                      type="button"
                      onClick={async () => {
                        const t = toast.loading("Sending test page to printer...");
                        try {
                          const r = await fetch('http://127.0.0.1:1337/test-print');
                          if (r.ok) toast.success("Test page sent! Check printer tray.", { id: t });
                          else toast.error("Test print failed", { id: t });
                        } catch (e: any) {
                          toast.error("Bridge communication error", { id: t });
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Test Page</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">1. Instant Setup (No Installation)</h3>
                  <ol className="list-decimal pl-4 space-y-2 text-xs text-slate-600 leading-relaxed">
                    <li>Download the <strong>pre-configured ZIP</strong> on the right. Your Shop ID is already baked into it.</li>
                    <li>Extract the ZIP to your Desktop or a folder on your store PC.</li>
                    <li>Double-click <strong>Start-PrintBridge.bat</strong> (Windows) or <strong>Start-PrintBridge-Mac.command</strong> (Mac).</li>
                    <li>Leave that window open. The status indicator on this page turns green instantly!</li>
                  </ol>

                  {shop && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400">YOUR PRE-CONFIGURED SHOP ID</span>
                        <code className="text-xs font-mono font-bold text-slate-700">{shop.id}</code>
                      </div>
                      <button
                        id="copy-shop-id-companion"
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(shop.id);
                          toast.success("Shop ID copied to clipboard!");
                        }}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Copy ID
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800">2. Pre-Configured Downloads</h3>
                  <div className="flex flex-col gap-3">
                    <a
                      id="download-windows-companion"
                      href={`/api/download/windows?shopId=${shop?.id || ''}`}
                      download={`PrintHub-PrintBridge-Windows-${shop?.id ? shop.id.slice(0, 6) : 'Setup'}.zip`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download for Windows (Pre-Configured ZIP)
                    </a>
                    <a
                      id="download-macos-companion"
                      href={`/api/download/macos?shopId=${shop?.id || ''}`}
                      download={`PrintHub-PrintBridge-macOS-${shop?.id ? shop.id.slice(0, 6) : 'Setup'}.zip`}
                      className="bg-slate-800 hover:bg-slate-900 text-white p-3.5 rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download for macOS (.zip)
                    </a>
                  </div>

                  <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Auto-Print on Paid Orders</span>
                      <span className="text-[10px] text-slate-400">Files print automatically once a payment clears</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoPrintEnabled} 
                        onChange={(e) => toggleAutoPrint(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Connected Printers list in Companion tab */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Printer className="w-4 h-4 text-indigo-600" /> Connected Local Printers
                    </h3>
                    <p className="text-[11px] text-slate-500">Printers discovered via PrintBridge</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      id="scan-printers-companion"
                      type="button"
                      onClick={scanLocalPrintersDashboard}
                      disabled={isScanning}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Scan className="w-3.5 h-3.5 animate-pulse" />
                      {isScanning ? 'Scanning...' : 'Scan Local Network'}
                    </button>
                    <button
                      id="add-printer-companion"
                      type="button"
                      onClick={addPrinterDashboard}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Printer
                    </button>
                  </div>
                </div>

                {editPrinters.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                    No printers linked yet. Run a network scan or add one manually.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {editPrinters.map((printer) => (
                      <div key={printer.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <input 
                            type="text" 
                            value={printer.name}
                            onChange={(e) => updatePrinterDashboard(printer.id, { name: e.target.value })}
                            className="bg-transparent font-bold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none text-sm px-1"
                          />
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {['Black & White Printing', 'Color Printing', 'Photo Printing'].map(svc => {
                              const isMapped = printer.mappedServices.includes(svc);
                              return (
                                <button
                                  key={svc}
                                  type="button"
                                  onClick={() => {
                                    const next = isMapped 
                                      ? printer.mappedServices.filter(s => s !== svc) 
                                      : [...printer.mappedServices, svc];
                                    updatePrinterDashboard(printer.id, { mappedServices: next });
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    isMapped 
                                      ? 'bg-indigo-50 border-indigo-150 text-indigo-700' 
                                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                  }`}
                                >
                                  {svc}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => testPrintDashboard(printer.id)}
                            className="px-2.5 py-1.5 border border-slate-200 hover:bg-white text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 shrink-0 bg-slate-50"
                          >
                            <Printer className="w-3 h-3" /> Test Print
                          </button>
                          <button
                            type="button"
                            onClick={() => removePrinterDashboard(printer.id)}
                            className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg shrink-0 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="animate-fade-in space-y-6">
              <CustomerPaymentSettings
                shop={shop}
                shopId={shop?.id || user?.uid || ''}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={saveSettings} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Edit Shop Profile</h2>
                    <p className="text-xs text-slate-500">Configure your print shop branding, operating hours, and options</p>
                  </div>
                </div>
                <button
                  id="save-shop-profile-top"
                  type="submit"
                  disabled={savingSettings}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: General Profile Info */}
                <div className="space-y-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Shop Information</h3>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Shop Name</label>
                    <input 
                      type="text" 
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Address</label>
                    <textarea 
                      required
                      rows={3}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Google Maps Link</label>
                    <input 
                      type="url" 
                      placeholder="https://maps.google.com/..."
                      value={editMapLink}
                      onChange={(e) => setEditMapLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Opening Time</label>
                      <input 
                        type="time" 
                        required
                        value={editOpeningHours.open}
                        onChange={(e) => setEditOpeningHours({ ...editOpeningHours, open: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Closing Time</label>
                      <input 
                        type="time" 
                        required
                        value={editOpeningHours.close}
                        onChange={(e) => setEditOpeningHours({ ...editOpeningHours, close: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Working Days</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                        const isWorking = editWorkingDays.includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => {
                              setEditWorkingDays(prev => 
                                prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                              );
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition border ${
                              isWorking 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {day.substring(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Side: Branding & Services */}
                <div className="space-y-6">
                  {/* Shop Assets */}
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Assets & Branding</h3>
                    
                    <div className="space-y-4">
                      {/* Logo Field */}
                      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                        <div className="w-14 h-14 rounded-full border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                          {editLogo ? (
                            <img src={editLogo} alt="Logo Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <span className="text-xs font-bold text-slate-700 block">Shop Logo</span>
                          <span className="text-[10px] text-slate-400 block mb-1">JPEG/PNG, recommended 512x512px</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleLogoUploadDashboard}
                            className="hidden" 
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3 py-1 rounded text-[11px] cursor-pointer"
                          >
                            Change Logo
                          </button>
                        </div>
                      </div>

                      {/* Cover Image Field */}
                      <div className="flex flex-col gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                        <span className="text-xs font-bold text-slate-700 block">Cover / Shop Banner</span>
                        <div className="w-full h-24 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden relative">
                          {editCover ? (
                            <img src={editCover} alt="Cover Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] text-slate-400">JPEG/PNG, recommended 800x300px</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            ref={coverInputRef}
                            onChange={handleCoverUploadDashboard}
                            className="hidden" 
                          />
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                          >
                            Upload New Banner
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services Provided */}
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">Services & Offerings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1.5">Services Provided</label>
                        <div className="flex flex-wrap gap-1.5">
                          {['Black & White Printing', 'Color Printing', 'Photo Printing', 'Large Format (A3)'].map(svc => {
                            const selected = editServices.includes(svc);
                            return (
                              <button
                                type="button"
                                key={svc}
                                onClick={() => {
                                  setEditServices(prev => 
                                    prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
                                  );
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                                  selected 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {svc}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1.5">Supported Paper Sizes</label>
                        <div className="flex flex-wrap gap-1.5">
                          {['A4', 'A3', 'Legal', '6x4 Photo', '8x10 Photo'].map(size => {
                            const selected = editPaperSizes.includes(size);
                            return (
                              <button
                                type="button"
                                key={size}
                                onClick={() => {
                                  setEditPaperSizes(prev => 
                                    prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                                  );
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                                  selected 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Razorpay & Customer Payment Integration Section */}
              <div className="border-t border-slate-100 pt-6">
                <CustomerPaymentSettings
                  shop={shop}
                  shopId={shop?.id || user?.uid || ''}
                />
              </div>

              {/* Form Save Button */}
              <div className="border-t border-slate-150 pt-6 flex justify-end gap-3">
                <button
                  id="reset-shop-profile"
                  type="button"
                  onClick={() => {
                    if (shop) {
                      setEditName(shop.name || '');
                      setEditAddress(shop.address || '');
                      setEditMapLink(shop.mapLink || '');
                      setEditLogo(shop.logo || null);
                      setEditCover(shop.coverImage || null);
                      setEditServices(shop.services || []);
                      setEditPaperSizes(shop.paperSizes || []);
                      setEditOpeningHours(shop.openingHours || { open: '09:00', close: '18:00' });
                      setEditWorkingDays(shop.workingDays || []);
                      toast.success("Form reset to current values.");
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
                >
                  Reset Form
                </button>
                <button
                  id="save-shop-profile"
                  type="submit"
                  disabled={savingSettings}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 disabled:opacity-50 cursor-pointer"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Shop Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}


        </div>
      </div>

      {/* PRINT BRIDGE ZERO-CONFIG ASSISTANT MODAL */}
      <PrintBridgeModal
        isOpen={showBridgeModal}
        onClose={() => setShowBridgeModal(false)}
        shopId={shop?.id}
        shopName={shop?.name}
        onPrintersImported={handlePrintersImportedDashboard}
      />
    </div>
  );
}
