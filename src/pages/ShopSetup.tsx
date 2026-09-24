import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType, requireGoogleLogin, signInWithGoogle } from '../firebase';
import { Shop } from '../types';
import { Store, Save, Loader2, UploadCloud, Image as ImageIcon, Printer, Plus, Trash2, Scan, AlertCircle, Globe, Landmark, Shield, X, ArrowRight, CheckCircle2, Lock, HelpCircle, Info, Building, CreditCard } from 'lucide-react';
import { getOrCreateFolder, uploadFileToDrive } from '../drive';
import { parseResponseJson } from '../utils/api';
import { PrintBridgeModal } from '../components/PrintBridgeModal';

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

export function ShopSetup({ user, authLoading }: { user: User | null; authLoading?: boolean }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [logo, setLogo] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  
  const [paperSizes, setPaperSizes] = useState<string[]>(['A4']);
  const [printers, setPrinters] = useState<{ id: string, name: string, mappedServices: string[], testPrinted: boolean }[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [openingHours, setOpeningHours] = useState({ open: '09:00', close: '18:00' });
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  const [mapLink, setMapLink] = useState('');
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [pricingInputs, setPricingInputs] = useState<Record<string, string>>({});

  const getSetupPriceInput = (key: string, fallback: number) => {
    if (pricingInputs[key] !== undefined) return pricingInputs[key];
    return String((pricing as any)[key] ?? fallback);
  };

  const handleSetupPriceChange = (key: string, val: string) => {
    setPricingInputs(prev => ({ ...prev, [key]: val }));
    if (val.trim() !== '') {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        setPricing(prev => ({ ...prev, [key]: num }));
      }
    }
  };

  const handleSetupPriceBlur = (key: string, fallback: number) => {
    const current = pricingInputs[key];
    if (current === undefined) return;
    if (current.trim() === '' || isNaN(parseFloat(current))) {
      setPricingInputs(prev => ({ ...prev, [key]: String(fallback) }));
      setPricing(prev => ({ ...prev, [key]: fallback }));
    } else {
      setPricingInputs(prev => ({ ...prev, [key]: String(parseFloat(current)) }));
    }
  };

  const [razorpayKeyId, setRazorpayKeyId] = useState<string>('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [showBridgeModal, setShowBridgeModal] = useState<boolean>(false);

  // Interactive Stripe Connect Onboarding Walkthrough states
  
  
  
  const [taxId, setTaxId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [kycFileName, setKycFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function checkExistingShop() {
      try {
        const docRef = doc(db, 'shops', user!.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Shop;
          setName(data.name || '');
          setAddress(data.address || '');
          setServices(data.services || []);
          if (data.coverImage) setCover(data.coverImage);
          if (data.logo) setLogo(data.logo);
          if (data.paperSizes) setPaperSizes(data.paperSizes);
          if (data.printers) setPrinters(data.printers);
          if (data.openingHours) setOpeningHours(data.openingHours);
          if (data.workingDays) setWorkingDays(data.workingDays);
          if (data.mapLink) setMapLink(data.mapLink);
          if (data.razorpayKeyId) setRazorpayKeyId(data.razorpayKeyId);
          if (data.razorpayKeySecret) setRazorpayKeySecret(data.razorpayKeySecret);
          if (data.upiId) setUpiId(data.upiId);
          if (data.pricing) {
            setPricing({
              ...DEFAULT_PRICING,
              ...data.pricing,
              bwPage1: data.pricing.bwPage1 ?? data.pricing.bwBase ?? 5,
              bwPage2To15: data.pricing.bwPage2To15 ?? data.pricing.bwBase ?? 3,
              bwPage16Plus: data.pricing.bwPage16Plus ?? data.pricing.bwBase ?? 2,
              colorPage1: data.pricing.colorPage1 ?? data.pricing.colorBase ?? 15,
              colorPage2To15: data.pricing.colorPage2To15 ?? data.pricing.colorBase ?? 10,
              colorPage16Plus: data.pricing.colorPage16Plus ?? data.pricing.colorBase ?? 8,
            });
          }
        } else {
          setName(`${user!.displayName || 'My'} Print Shop`);
        }
      } catch (e: any) {
        console.warn("Could not load existing shop config:", e?.message);
        setName(`${user!.displayName || 'My'} Print Shop`);
      } finally {
        setLoading(false);
      }
    }
    
    checkExistingShop();
  }, [user, authLoading]);

  const toggleService = (svc: string) => {
    setServices(prev => 
      prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
    );
  };
  
  const togglePaperSize = (size: string) => {
    setPaperSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleLaunchStripeWizard = () => {
    
    
    
    
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode('');
    
    
    setTaxId('');
    setKycFileName('');
    
    
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setSaving(true);
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
        // Direct viewable URL for Google Drive images
        const driveUrl = `https://drive.google.com/uc?export=view&id=${driveData.id}`;
        setCover(driveUrl);
      } catch (driveErr) {
        console.warn("Failed to upload cover to Google Drive, falling back to local server:", driveErr);
        const formData = new FormData();
        formData.append('file', compressedFile, 'cover.jpg');
        formData.append('path', `shops/${user.uid}/cover_${Date.now()}.jpg`);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await parseResponseJson(res, 'Cover upload failed');
        setCover(data.url);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to upload cover image.");
    } finally {
      setSaving(false);
    }
  };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setSaving(true);
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
        // Direct viewable URL for Google Drive images
        const driveUrl = `https://drive.google.com/uc?export=view&id=${driveData.id}`;
        setLogo(driveUrl);
      } catch (driveErr) {
        console.warn("Failed to upload logo to Google Drive, falling back to local server:", driveErr);
        const formData = new FormData();
        formData.append('file', compressedFile, 'logo.jpg');
        formData.append('path', `shops/${user.uid}/logo_${Date.now()}.jpg`);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await parseResponseJson(res, 'Logo upload failed');
        setLogo(data.url);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to upload logo.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrintersImported = (imported: Array<{ name: string; isDefault?: boolean }>) => {
    const newPrinters = imported.map((p) => ({
      id: Math.random().toString(36).substring(7),
      name: p.name,
      mappedServices: [...services],
      testPrinted: true
    }));
    setPrinters(prev => {
      const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
      const filtered = newPrinters.filter(np => !existingNames.has(np.name.toLowerCase()));
      return [...prev, ...filtered];
    });
    toast.success(`Imported ${newPrinters.length} printer(s) to your shop!`);
  };

  const scanLocalPrinters = async () => {
    setIsScanning(true);
    try {
      // Attempt to connect to a local desktop companion app (PrintBridge)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch('http://127.0.0.1:1337/printers', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.printers && data.printers.length > 0) {
          handlePrintersImported(data.printers);
        } else {
          toast.error("No printers detected on local PrintBridge.");
        }
      } else {
        throw new Error('PrintBridge not responding');
      }
    } catch (err) {
      toast.error("PrintBridge is not running yet. Open the setup guide to launch it in 30 seconds!", { icon: '💡' });
      setShowBridgeModal(true);
    } finally {
      setIsScanning(false);
    }
  };
  
  const addPrinter = () => {
    setPrinters([...printers, { id: Math.random().toString(36).substring(7), name: `Printer ${printers.length + 1}`, mappedServices: [], testPrinted: false }]);
  };
  
  const removePrinter = (id: string) => {
    setPrinters(printers.filter(p => p.id !== id));
  };
  
  const updatePrinter = (id: string, updates: any) => {
    setPrinters(printers.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const testPrint = (id: string) => {
    updatePrinter(id, { testPrinted: true });
    toast.success("Test page printed successfully!");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    
    const shopData: Partial<Shop> = {
      name, address, services, coverImage: cover, logo, paperSizes, printers, openingHours, workingDays, mapLink,
      razorpayKeyId: razorpayKeyId.trim(),
      razorpayKeySecret: razorpayKeySecret.trim(),
      razorpayEnabled: true,
      upiId: upiId.trim(),
      upiEnabled: Boolean(upiId.trim()),
      cashOnCounterEnabled: true,
      isOpen: true,
      pricing,
      ownerId: user.uid
    };

    try {
      await setDoc(doc(db, 'shops', user.uid), shopData, { merge: true });
      
      const docSnap = await getDoc(doc(db, 'shops', user.uid));
      if (!docSnap.data()?.pricing) {
        await setDoc(doc(db, 'shops', user.uid), { pricing: DEFAULT_PRICING }, { merge: true });
      }

      toast.success("Shop settings saved successfully!");
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Error saving shop configuration:", err);
      toast.error(`Failed to save shop settings: ${err.message || err}`);
      try {
        handleFirestoreError(err, OperationType.WRITE, `shops/${user.uid}`);
      } catch (firestoreErr) {
        console.error("Firestore error logged:", firestoreErr);
      }
    } finally {
      setSaving(false);
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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Partner Setup</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Please sign in with your Google account to set up your print shop profile and start receiving print orders.
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
            <span>Sign In with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 px-6 py-8 text-white">
          <Store className="w-12 h-12 mb-4 text-indigo-200" />
          <h1 className="text-2xl font-bold">Shop Partner Setup</h1>
          <p className="text-indigo-100 mt-2 text-sm">Configure your print shop details, services, and printers to start receiving orders.</p>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-10">
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b pb-2">1. Basic Details & Hours</h2>
            
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
                  <input 
                    type="text" required
                    value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
                  <textarea 
                    required rows={2}
                    value={address} onChange={e => setAddress(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Opening Time</label>
                    <input 
                      type="time" required
                      value={openingHours.open} onChange={e => setOpeningHours({...openingHours, open: e.target.value})}
                      className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Closing Time</label>
                    <input 
                      type="time" required
                      value={openingHours.close} onChange={e => setOpeningHours({...openingHours, close: e.target.value})}
                      className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          setWorkingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${workingDays.includes(day) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Google Maps Link (Optional)</label>
                  <input 
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={mapLink} onChange={e => setMapLink(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shop Logo (1:1)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition overflow-hidden bg-slate-50"
                  >
                    {logo ? (
                      <img src={logo} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500">Upload Logo</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleLogoUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image</label>
                  <div 
                    onClick={() => document.getElementById('coverUpload')?.click()}
                    className="w-32 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition overflow-hidden bg-slate-50 relative"
                  >
                    {cover ? <img src={cover} className="w-full h-full object-cover absolute inset-0" alt="Cover" /> : null}
                    <input id="coverUpload" type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-[10px] text-slate-500">Upload Cover</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b pb-2">2. Services & Pricing</h2>
            <div className="pt-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Print Pricing (₹)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-800 text-sm mb-3">Black & White (B&W)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>1 Page:</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getSetupPriceInput('bwPage1', 5)} 
                        onChange={e => handleSetupPriceChange('bwPage1', e.target.value)} 
                        onBlur={() => handleSetupPriceBlur('bwPage1', 5)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800" 
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>2 - 15 Pages (/page):</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getSetupPriceInput('bwPage2To15', 3)} 
                        onChange={e => handleSetupPriceChange('bwPage2To15', e.target.value)} 
                        onBlur={() => handleSetupPriceBlur('bwPage2To15', 3)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800" 
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>16+ Pages (/page):</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getSetupPriceInput('bwPage16Plus', 2)} 
                        onChange={e => handleSetupPriceChange('bwPage16Plus', e.target.value)} 
                        onBlur={() => handleSetupPriceBlur('bwPage16Plus', 2)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800" 
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-800 text-sm mb-3">Color Print</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>1 Page:</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getSetupPriceInput('colorPage1', 15)} 
                        onChange={e => handleSetupPriceChange('colorPage1', e.target.value)} 
                        onBlur={() => handleSetupPriceBlur('colorPage1', 15)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800" 
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>2 - 15 Pages (/page):</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getSetupPriceInput('colorPage2To15', 10)} 
                        onChange={e => handleSetupPriceChange('colorPage2To15', e.target.value)} 
                        onBlur={() => handleSetupPriceBlur('colorPage2To15', 10)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800" 
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>16+ Pages (/page):</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getSetupPriceInput('colorPage16Plus', 8)} 
                        onChange={e => handleSetupPriceChange('colorPage16Plus', e.target.value)} 
                        onBlur={() => handleSetupPriceBlur('colorPage16Plus', 8)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded font-bold text-slate-800" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Services Provided</label>
              <div className="flex flex-wrap gap-2">
                {['Black & White Printing', 'Color Printing', 'Photo Printing', 'Large Format (A3)'].map(svc => (
                  <button
                    type="button"
                    key={svc}
                    onClick={() => toggleService(svc)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                      services.includes(svc) 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {svc}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Supported Paper Sizes</label>
              <div className="flex flex-wrap gap-2">
                {['A4', 'A3', 'Legal', '6x4 Photo', '8x10 Photo'].map(size => (
                  <button
                    type="button"
                    key={size}
                    onClick={() => togglePaperSize(size)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                      paperSizes.includes(size) 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
    <div>
      <h2 className="text-lg font-bold">3. Connected Printers</h2>
      <p className="text-[11px] text-slate-500 font-medium mt-1">Requires our free Desktop PrintBridge app to auto-sync hardware printers.</p>
    </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowBridgeModal(true)} 
                  className="flex items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  Setup Print Bridge (1-Click)
                </button>
                <button type="button" onClick={scanLocalPrinters} disabled={isScanning} className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
                  {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
                  {isScanning ? 'Scanning...' : 'Auto-Detect Local Printers'}
                </button>
                <button type="button" onClick={addPrinter} className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-800 px-2 py-1.5 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Add Manually
                </button>
              </div>
            </div>
            
            {printers.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
                No printers added. Click "Add Printer" to connect your hardware.
              </div>
            ) : (
              <div className="space-y-4">
                {printers.map((printer, index) => (
                  <div key={printer.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Printer className="w-5 h-5 text-indigo-600" />
                        <input 
                          type="text" 
                          value={printer.name}
                          onChange={(e) => updatePrinter(printer.id, { name: e.target.value })}
                          className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-semibold focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. Konica C224e"
                        />
                      </div>
                      <button type="button" onClick={() => removePrinter(printer.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="pl-8">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Map Supported Services</label>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {services.map(svc => (
                          <button
                            type="button"
                            key={svc}
                            onClick={() => {
                              const mapped = printer.mappedServices.includes(svc)
                                ? printer.mappedServices.filter(s => s !== svc)
                                : [...printer.mappedServices, svc];
                              updatePrinter(printer.id, { mappedServices: mapped });
                            }}
                            className={`text-xs px-2.5 py-1 rounded-md border ${
                              printer.mappedServices.includes(svc)
                                ? 'bg-indigo-100 border-indigo-200 text-indigo-800 font-medium'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {svc}
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          type="button" 
                          onClick={() => testPrint(printer.id)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                            printer.testPrinted 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          {printer.testPrinted ? 'Test Print Successful' : 'Print Test Page'}
                        </button>
                        {!printer.testPrinted && <span className="text-xs text-red-500">* Required</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-lg font-bold">4. Verification & Payouts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-emerald-800 text-sm mb-1">Mobile & KYC Verified</h3>
                  <p className="text-emerald-700 text-xs mb-3">Your identity is verified and ready.</p>
                  <div className="flex gap-2">
                    <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Phone Verified</span>
                    <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">KYC Approved</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-xl flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-indigo-950 text-sm mb-1 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" /> Razorpay Customer Payments
                  </h3>
                  <p className="text-indigo-800 text-xs leading-relaxed">
                    Receive customer payments directly to your merchant account with UPI, Cards, and NetBanking.
                  </p>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    placeholder="Razorpay Key ID (optional, e.g. rzp_test_...)"
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="password"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    placeholder="Razorpay Key Secret (optional)"
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="Shop UPI ID / VPA (optional, e.g. shop@upi)"
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-indigo-600/80">
                    💡 You can also test and configure live connection later from your Dashboard &rarr; Customer Payments.
                  </p>
                </div>
              </div>
              <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-indigo-950 text-sm">Partner Subscription</h3>
                    <span className="text-[10px] bg-indigo-200/60 text-indigo-900 font-extrabold px-2 py-0.5 rounded-full uppercase">
                      4 Plans Available
                    </span>
                  </div>
                  <p className="text-indigo-800 text-xs leading-relaxed">
                    Choose from <strong>Free (10 orders)</strong>, <strong>Starter (200 orders)</strong>, <strong>Business (1,000 orders)</strong>, or <strong>Business Plus (1,000+ orders)</strong>.
                  </p>
                </div>
                <Link to="/pricing" className="mt-3 text-left text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  Manage & Upgrade Subscription Plans &rarr;
                </Link>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>

      {/* STRIPE CONNECT ONBOARDING INTERACTIVE WIZARD */}
      
      {/* PRINT BRIDGE ZERO-CONFIG SETUP ASSISTANT */}
      <PrintBridgeModal 
        isOpen={showBridgeModal} 
        onClose={() => setShowBridgeModal(false)} 
        shopId={user?.uid} 
        shopName={name} 
        onPrintersImported={handlePrintersImported} 
      />
    </div>
  );
}

