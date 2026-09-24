import toast from 'react-hot-toast';
import { User } from 'firebase/auth';
import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Shop } from '../types';
import { 
  Loader2, Settings, ArrowLeft, Store, Laptop, QrCode, 
  Layers, Check, HelpCircle, Info, Calculator, FileText, 
  Image, Sparkles, AlertCircle, Ban, CheckCircle, Flame
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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

type PricingKey = keyof typeof DEFAULT_PRICING;

export function ShopPricing({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [saving, setSaving] = useState(false);

  // String state for inputs so users can hold, select-all, clear/backspace, and replace freely without sticky digits
  const [inputStrings, setInputStrings] = useState<Record<string, string>>({});
  const [rawSimPages, setRawSimPages] = useState<string>('5');
  const [rawSimCopies, setRawSimCopies] = useState<string>('1');

  // Simulation State
  const [simColor, setSimColor] = useState<'Black & White' | 'Color'>('Black & White');
  const [simPages, setSimPages] = useState<number>(5);
  const [simCopies, setSimCopies] = useState<number>(1);
  const [simPaperSize, setSimPaperSize] = useState<'A4' | 'A3' | 'Legal' | '6x4 Photo' | '7x5 Photo' | '8x6 Photo'>('A4');
  const [simPaperType, setSimPaperType] = useState<'Plain' | 'Glossy'>('Plain');
  const [simSides, setSimSides] = useState<'Single' | 'Double'>('Single');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const docRef = doc(db, 'shops', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const shopData = { id: docSnap.id, ...docSnap.data() } as Shop;
        setShop(shopData);
        if (shopData.pricing) {
          setPricing({
            ...DEFAULT_PRICING,
            ...shopData.pricing
          });
        }
        setLoading(false);
      } else {
        setLoading(false);
        navigate('/shop-setup');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `shops/${user.uid}`);
      setLoading(false);
      navigate('/shop-setup');
    });

    return unsubscribe;
  }, [user, navigate]);

  const updatePriceValue = (key: PricingKey, val: number) => {
    setPricing(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const getInputValue = (key: PricingKey): string => {
    if (inputStrings[key] !== undefined) return inputStrings[key];
    return pricing[key] !== undefined ? String(pricing[key]) : '0';
  };

  const handleInputChange = (key: PricingKey, text: string) => {
    setInputStrings(prev => ({ ...prev, [key]: text }));
    if (text.trim() === '') return;
    const num = parseFloat(text);
    if (!isNaN(num)) {
      updatePriceValue(key, num);
    }
  };

  const handleInputBlur = (key: PricingKey, fallback: number = 0) => {
    const current = inputStrings[key];
    if (current === undefined) return;
    if (current.trim() === '' || isNaN(parseFloat(current))) {
      const defaultVal = pricing[key] ?? fallback;
      setInputStrings(prev => ({ ...prev, [key]: String(defaultVal) }));
      updatePriceValue(key, defaultVal);
    } else {
      const num = parseFloat(current);
      setInputStrings(prev => ({ ...prev, [key]: String(num) }));
      updatePriceValue(key, num);
    }
  };

  const handleSave = async () => {
    if (!shop) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'shops', shop.id), { pricing }, { merge: true });
      toast.success('All pricing structures updated successfully!', {
        icon: '💰',
        style: {
          borderRadius: '16px',
          background: '#333',
          color: '#fff',
        }
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `shops/${shop.id}`);
    } finally {
      setSaving(false);
    }
  };

  // Live Pricing Calculation Simulation matching Upload.tsx logic
  const calculateSimulatedPrice = (): number => {
    const isPhoto = simPaperSize.includes('Photo');
    const isColor = simColor === 'Color';
    const isDouble = simSides === 'Double';
    
    if (isPhoto) {
      let basePhotoPrice = pricing.photo6x4;
      if (simPaperSize === '7x5 Photo') basePhotoPrice = pricing.photo7x5;
      if (simPaperSize === '8x6 Photo') basePhotoPrice = pricing.photo8x6;
      return basePhotoPrice * simCopies;
    }

    const bwPage1 = pricing.bwPage1 ?? pricing.bwBase ?? 5;
    const bwPage2To15 = pricing.bwPage2To15 ?? pricing.bwBase ?? 3;
    const bwPage16Plus = pricing.bwPage16Plus ?? pricing.bwBase ?? 2;
    
    const colorPage1 = pricing.colorPage1 ?? pricing.colorBase ?? 15;
    const colorPage2To15 = pricing.colorPage2To15 ?? pricing.colorBase ?? 10;
    const colorPage16Plus = pricing.colorPage16Plus ?? pricing.colorBase ?? 8;

    let sheetPrice = 0;
    if (isColor) {
      let baseColorPrice = colorPage1;
      if (simPages === 1) baseColorPrice = colorPage1;
      else if (simPages > 1 && simPages <= 15) baseColorPrice = colorPage2To15;
      else if (simPages > 15) baseColorPrice = colorPage16Plus;
      
      if (isDouble) sheetPrice = pricing.colorDoubleSide || (baseColorPrice * 1.5);
      else sheetPrice = baseColorPrice;
    } else {
      let baseBwPrice = bwPage1;
      if (simPages === 1) baseBwPrice = bwPage1;
      else if (simPages > 1 && simPages <= 15) baseBwPrice = bwPage2To15;
      else if (simPages > 15) baseBwPrice = bwPage16Plus;
      
      if (isDouble) sheetPrice = pricing.bwDoubleSide || (baseBwPrice * 1.5);
      else sheetPrice = baseBwPrice;
    }

    if (simPaperSize === 'A3') sheetPrice *= pricing.a3Multiplier || 2;
    if (simPaperType === 'Glossy') sheetPrice += pricing.glossyAddon || 5;

    let sheets = simPages;
    if (isDouble) {
      sheets = Math.ceil(simPages / 2);
    }

    return sheetPrice * sheets * simCopies;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <h2 className="text-xl font-bold mb-2">Partner Sign In Required</h2>
        <p className="text-slate-500 mb-6 text-sm">Sign in or create an account to configure your shop's print pricing.</p>
        <Link to="/" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition">
          Back to Homepage
        </Link>
      </div>
    );
  }

  const calculatedSimPrice = calculateSimulatedPrice();

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-8 animate-fade-in pb-12">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col gap-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-600/20 ring-2 ring-indigo-500/20">
                PH
              </div>
              <div>
                <h2 className="font-black text-slate-900 leading-tight text-sm tracking-tight">PrintHub</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Partner Portal</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5">
              <Link 
                to="/dashboard"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                <Store className="w-4 h-4 text-slate-400" />
                <span>Overview</span>
              </Link>
              <Link 
                to="/dashboard/pricing"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all bg-indigo-50/90 text-indigo-700 shadow-xs border-r-4 border-indigo-600"
              >
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>Pricing</span>
              </Link>
              <Link 
                to="/dashboard"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                <Laptop className="w-4 h-4 text-slate-400" />
                <span>Companion App</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Workspace Column */}
        <div className="flex-1 min-w-0 space-y-8">
          <header className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <Link to="/dashboard" className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-xs font-bold transition">
                  <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <span className="text-slate-300">|</span>
                <span className="font-black text-[10px] text-slate-400 font-sans uppercase tracking-widest">Pricing Configuration</span>
              </div>
              <h1 className="text-2xl font-black text-slate-950 truncate max-w-md tracking-tight notranslate" translate="no">{shop?.name || 'My Print Shop'}</h1>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold py-3 px-6 rounded-2xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save All Rates</span>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Rates Configuration */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Range Pricing Black & White Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                  <div className="p-2.5 bg-slate-100 border border-slate-200/70 text-slate-700 rounded-2xl shadow-xs">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Black & White Range Pricing</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Volume discounted rates for printing black & white documents</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50/70 p-4 sm:p-5 border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-colors">
                    <span className="block text-[11px] text-slate-500 font-black uppercase tracking-wider mb-2">1 Page (Base)</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2 text-sm">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('bwPage1')} 
                        onChange={e => handleInputChange('bwPage1', e.target.value)}
                        onBlur={() => handleInputBlur('bwPage1', 5)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl p-2.5 focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none font-black text-slate-900 shadow-2xs transition" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 block font-medium">Applied to single-page documents</span>
                  </div>

                  <div className="bg-slate-50/70 p-4 sm:p-5 border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-colors">
                    <span className="block text-[11px] text-slate-500 font-black uppercase tracking-wider mb-2">2 - 15 Pages</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2 text-sm">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('bwPage2To15')} 
                        onChange={e => handleInputChange('bwPage2To15', e.target.value)}
                        onBlur={() => handleInputBlur('bwPage2To15', 3)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl p-2.5 focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none font-black text-slate-900 shadow-2xs transition" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 block font-medium">Per page price for medium files</span>
                  </div>

                  <div className="bg-slate-50/70 p-4 sm:p-5 border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-colors">
                    <span className="block text-[11px] text-slate-500 font-black uppercase tracking-wider mb-2">16+ Pages</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2 text-sm">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('bwPage16Plus')} 
                        onChange={e => handleInputChange('bwPage16Plus', e.target.value)}
                        onBlur={() => handleInputBlur('bwPage16Plus', 2)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl p-2.5 focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none font-black text-slate-900 shadow-2xs transition" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 block font-medium">Per page price for bulky files</span>
                  </div>
                </div>
              </div>

              {/* Range Pricing Color Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                  <div className="p-2.5 bg-rose-50 border border-rose-100/70 text-rose-600 rounded-2xl shadow-xs">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Color Range Pricing</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Volume discounted rates for printing color documents</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50/70 p-4 sm:p-5 border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-colors">
                    <span className="block text-[11px] text-slate-500 font-black uppercase tracking-wider mb-2">1 Page (Base)</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2 text-sm">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('colorPage1')} 
                        onChange={e => handleInputChange('colorPage1', e.target.value)}
                        onBlur={() => handleInputBlur('colorPage1', 15)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl p-2.5 focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none font-black text-slate-900 shadow-2xs transition" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 block font-medium">Applied to single-page documents</span>
                  </div>

                  <div className="bg-slate-50/70 p-4 sm:p-5 border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-colors">
                    <span className="block text-[11px] text-slate-500 font-black uppercase tracking-wider mb-2">2 - 15 Pages</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2 text-sm">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('colorPage2To15')} 
                        onChange={e => handleInputChange('colorPage2To15', e.target.value)}
                        onBlur={() => handleInputBlur('colorPage2To15', 10)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl p-2.5 focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none font-black text-slate-900 shadow-2xs transition" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 block font-medium">Per page price for medium files</span>
                  </div>

                  <div className="bg-slate-50/70 p-4 sm:p-5 border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-colors">
                    <span className="block text-[11px] text-slate-500 font-black uppercase tracking-wider mb-2">16+ Pages</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2 text-sm">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('colorPage16Plus')} 
                        onChange={e => handleInputChange('colorPage16Plus', e.target.value)}
                        onBlur={() => handleInputBlur('colorPage16Plus', 8)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl p-2.5 focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none font-black text-slate-900 shadow-2xs transition" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 block font-medium">Per page price for bulky files</span>
                  </div>
                </div>
              </div>

              {/* Side Options & Surcharges Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100/70 text-indigo-600 rounded-2xl shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Double-Sided & Surcharges</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Specify paper size multipliers, double side pricing, and photo base fallbacks</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* B&W Double Sided vs Fallback */}
                  <div className="space-y-4">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Black & White Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wide">Double-Sided Sheet</span>
                        <div className="flex items-center">
                          <span className="text-slate-400 mr-1.5 text-xs font-bold">₹</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={getInputValue('bwDoubleSide')} 
                            onChange={e => handleInputChange('bwDoubleSide', e.target.value)}
                            onBlur={() => handleInputBlur('bwDoubleSide', 3)}
                            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none text-xs font-black text-slate-900 shadow-2xs transition" 
                          />
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wide">Legacy Base</span>
                        <div className="flex items-center">
                          <span className="text-slate-400 mr-1.5 text-xs font-bold">₹</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={getInputValue('bwBase')} 
                            onChange={e => handleInputChange('bwBase', e.target.value)}
                            onBlur={() => handleInputBlur('bwBase', 2)}
                            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none text-xs font-black text-slate-900 shadow-2xs transition" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Color Double Sided vs Fallback */}
                  <div className="space-y-4">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Color Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wide">Double-Sided Sheet</span>
                        <div className="flex items-center">
                          <span className="text-slate-400 mr-1.5 text-xs font-bold">₹</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={getInputValue('colorDoubleSide')} 
                            onChange={e => handleInputChange('colorDoubleSide', e.target.value)}
                            onBlur={() => handleInputBlur('colorDoubleSide', 15)}
                            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none text-xs font-black text-slate-900 shadow-2xs transition" 
                          />
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wide">Legacy Base</span>
                        <div className="flex items-center">
                          <span className="text-slate-400 mr-1.5 text-xs font-bold">₹</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={getInputValue('colorBase')} 
                            onChange={e => handleInputChange('colorBase', e.target.value)}
                            onBlur={() => handleInputBlur('colorBase', 10)}
                            className="w-full bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none text-xs font-black text-slate-900 shadow-2xs transition" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Surcharges (A3 and Glossy) */}
                  <div className="space-y-4 md:col-span-2">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Media Options & Paper Upgrades</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:border-slate-300 transition-colors">
                        <div>
                          <span className="block text-xs font-bold text-slate-800">A3 Multiplier (x)</span>
                          <span className="text-[10px] text-slate-500">Multiplies page cost for larger format paper</span>
                        </div>
                        <div className="flex items-center w-24">
                          <span className="text-slate-400 font-bold mr-1.5 text-xs">x</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={getInputValue('a3Multiplier')} 
                            onChange={e => handleInputChange('a3Multiplier', e.target.value)}
                            onBlur={() => handleInputBlur('a3Multiplier', 2)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-right font-black text-xs outline-none focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 transition shadow-2xs" 
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:border-slate-300 transition-colors">
                        <div>
                          <span className="block text-xs font-bold text-slate-800">Glossy Paper Add-on (₹)</span>
                          <span className="text-[10px] text-slate-500">Flat premium added per glossy sheet</span>
                        </div>
                        <div className="flex items-center w-24">
                          <span className="text-slate-400 font-bold mr-1.5 text-xs">₹</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={getInputValue('glossyAddon')} 
                            onChange={e => handleInputChange('glossyAddon', e.target.value)}
                            onBlur={() => handleInputBlur('glossyAddon', 5)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-right font-black text-xs outline-none focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 transition shadow-2xs" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Printing Rates */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100/70 text-emerald-600 rounded-2xl shadow-xs">
                    <Image className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Premium Photo Printing</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Configure flat rates for printing on premium glossy photo paper cuts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50/70 p-4 sm:p-5 border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-colors">
                    <span className="block text-[11px] text-slate-500 font-black uppercase tracking-wider mb-2">6" x 4" Photo</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2 text-sm">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('photo6x4')} 
                        onChange={e => handleInputChange('photo6x4', e.target.value)}
                        onBlur={() => handleInputBlur('photo6x4', 15)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl p-2.5 focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none font-black text-slate-900 shadow-2xs transition" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 block font-medium">Per print charge</span>
                  </div>

                  <div className="bg-slate-50/70 p-4 sm:p-5 border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-colors">
                    <span className="block text-[11px] text-slate-500 font-black uppercase tracking-wider mb-2">7" x 5" Photo</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2 text-sm">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('photo7x5')} 
                        onChange={e => handleInputChange('photo7x5', e.target.value)}
                        onBlur={() => handleInputBlur('photo7x5', 25)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl p-2.5 focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none font-black text-slate-900 shadow-2xs transition" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 block font-medium">Per print charge</span>
                  </div>

                  <div className="bg-slate-50/70 p-4 sm:p-5 border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-colors">
                    <span className="block text-[11px] text-slate-500 font-black uppercase tracking-wider mb-2">8" x 6" Photo</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2 text-sm">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('photo8x6')} 
                        onChange={e => handleInputChange('photo8x6', e.target.value)}
                        onBlur={() => handleInputBlur('photo8x6', 35)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl p-2.5 focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none font-black text-slate-900 shadow-2xs transition" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2 block font-medium">Per print charge</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Sandbox Sidebar (Calculator & Quick Save) */}
            <div className="space-y-6">
              
              {/* Simulation Sandbox Card */}
              <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-800 sticky top-20">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 bg-indigo-500/15 border border-indigo-500/25 rounded-xl text-indigo-400 shadow-xs">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black tracking-tight text-white">Pricing Simulation</h3>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Test and verify how your range rates and surcharges apply to customer uploads in real-time.
                </p>

                <div className="space-y-4 text-xs">
                  {/* Select Paper size & photo */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Document or Photo Size</label>
                    <select 
                      value={simPaperSize} 
                      onChange={e => {
                        const val = e.target.value as any;
                        setSimPaperSize(val);
                      }}
                      className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 text-white font-bold transition shadow-xs cursor-pointer"
                    >
                      <option value="A4">A4 (Standard)</option>
                      <option value="A3">A3 (Large Surcharge)</option>
                      <option value="Legal">Legal</option>
                      <option value="6x4 Photo">6" x 4" Photo Print</option>
                      <option value="7x5 Photo">7" x 5" Photo Print</option>
                      <option value="8x6 Photo">8" x 6" Photo Print</option>
                    </select>
                  </div>

                  {!simPaperSize.includes('Photo') && (
                    <>
                      {/* B&W or Color */}
                      <div>
                        <label className="block text-slate-300 font-bold mb-1.5">Color Option</label>
                        <div className="grid grid-cols-2 gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/70">
                          <button 
                            type="button"
                            onClick={() => setSimColor('Black & White')}
                            className={`py-2 rounded-lg text-center font-black transition cursor-pointer text-xs ${simColor === 'Black & White' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            B&W
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSimColor('Color')}
                            className={`py-2 rounded-lg text-center font-black transition cursor-pointer text-xs ${simColor === 'Color' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Color
                          </button>
                        </div>
                      </div>

                      {/* Number of Pages */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1.5">Number of Pages</label>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={rawSimPages} 
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setRawSimPages(val);
                              if (val !== '') setSimPages(Math.max(1, parseInt(val, 10)));
                            }}
                            onBlur={() => {
                              if (!rawSimPages || parseInt(rawSimPages, 10) < 1) {
                                setRawSimPages('1');
                                setSimPages(1);
                              } else {
                                setRawSimPages(String(parseInt(rawSimPages, 10)));
                              }
                            }}
                            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 text-white font-bold transition shadow-xs" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1.5">Sides</label>
                          <select 
                            value={simSides} 
                            onChange={e => setSimSides(e.target.value as any)}
                            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 text-white font-bold transition shadow-xs cursor-pointer"
                          >
                            <option value="Single">Single Sided</option>
                            <option value="Double">Double Sided</option>
                          </select>
                        </div>
                      </div>

                      {/* Paper Type */}
                      <div>
                        <label className="block text-slate-300 font-bold mb-1.5">Paper Type Upgrade</label>
                        <div className="grid grid-cols-2 gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/70">
                          <button 
                            type="button"
                            onClick={() => setSimPaperType('Plain')}
                            className={`py-2 rounded-lg text-center font-black transition cursor-pointer text-xs ${simPaperType === 'Plain' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Plain
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSimPaperType('Glossy')}
                            className={`py-2 rounded-lg text-center font-black transition cursor-pointer text-xs ${simPaperType === 'Glossy' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Glossy (+₹{pricing.glossyAddon})
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Number of Copies */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Number of Copies</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={rawSimCopies} 
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setRawSimCopies(val);
                        if (val !== '') setSimCopies(Math.max(1, parseInt(val, 10)));
                      }}
                      onBlur={() => {
                        if (!rawSimCopies || parseInt(rawSimCopies, 10) < 1) {
                          setRawSimCopies('1');
                          setSimCopies(1);
                        } else {
                          setRawSimCopies(String(parseInt(rawSimCopies, 10)));
                        }
                      }}
                      className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 text-white font-bold transition shadow-xs" 
                    />
                  </div>

                  {/* Calculated Result Display */}
                  <div className="pt-6 border-t border-slate-800 mt-6 text-center bg-gradient-to-b from-slate-800/70 to-indigo-950/30 p-5 rounded-2xl border border-indigo-500/20 shadow-inner">
                    <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-extrabold mb-1">Estimated Customer Price</span>
                    <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-indigo-100 to-white tracking-tight">₹{calculatedSimPrice.toFixed(2)}</span>
                    <span className="block text-[11px] text-slate-400 mt-1.5 font-medium">
                      {simPaperSize.includes('Photo') ? (
                        <span>Photo size print rate ({simPaperSize})</span>
                      ) : (
                        <span>
                          {simPages} page{simPages > 1 ? 's' : ''} {simSides === 'Double' ? 'double-sided' : 'single-sided'} × {simCopies} cop{simCopies > 1 ? 'ies' : 'y'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
