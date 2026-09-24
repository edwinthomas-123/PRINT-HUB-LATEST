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
              <Link 
                to="/dashboard"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-slate-600 hover:bg-slate-50"
              >
                <Store className="w-4 h-4" />
                <span>Overview</span>
              </Link>
              <Link 
                to="/dashboard/pricing"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all bg-indigo-50 text-indigo-700 shadow-sm border-r-4 border-indigo-600"
              >
                <Settings className="w-4 h-4" />
                <span>Pricing</span>
              </Link>
              <Link 
                to="/dashboard"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-slate-600 hover:bg-slate-50"
              >
                <Laptop className="w-4 h-4" />
                <span>Companion App</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Workspace Column */}
        <div className="flex-1 min-w-0 space-y-8">
          <header className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <Link to="/dashboard" className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-xs font-bold transition">
                  <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <span className="text-slate-300">|</span>
                <span className="font-bold text-xs text-slate-400 font-sans uppercase tracking-wider">Pricing Configuration</span>
              </div>
              <h1 className="text-2xl font-black text-slate-950 truncate max-w-md notranslate" translate="no">{shop?.name || 'My Print Shop'}</h1>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-100 disabled:opacity-50"
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
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Black & White Range Pricing</h2>
                    <p className="text-[11px] text-slate-400">Volume discounted rates for printing black & white documents</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <span className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">1 Page (Base)</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('bwPage1')} 
                        onChange={e => handleInputChange('bwPage1', e.target.value)}
                        onBlur={() => handleInputBlur('bwPage1', 5)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-800" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">Applied to single-page documents</span>
                  </div>

                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <span className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">2 - 15 Pages</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('bwPage2To15')} 
                        onChange={e => handleInputChange('bwPage2To15', e.target.value)}
                        onBlur={() => handleInputBlur('bwPage2To15', 3)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-800" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">Per page price for medium files</span>
                  </div>

                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <span className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">16+ Pages</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('bwPage16Plus')} 
                        onChange={e => handleInputChange('bwPage16Plus', e.target.value)}
                        onBlur={() => handleInputBlur('bwPage16Plus', 2)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-800" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">Per page price for bulky files</span>
                  </div>
                </div>
              </div>

              {/* Range Pricing Color Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Color Range Pricing</h2>
                    <p className="text-[11px] text-slate-400">Volume discounted rates for printing color documents</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <span className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">1 Page (Base)</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('colorPage1')} 
                        onChange={e => handleInputChange('colorPage1', e.target.value)}
                        onBlur={() => handleInputBlur('colorPage1', 15)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-800" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">Applied to single-page documents</span>
                  </div>

                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <span className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">2 - 15 Pages</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('colorPage2To15')} 
                        onChange={e => handleInputChange('colorPage2To15', e.target.value)}
                        onBlur={() => handleInputBlur('colorPage2To15', 10)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-800" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">Per page price for medium files</span>
                  </div>

                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <span className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">16+ Pages</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('colorPage16Plus')} 
                        onChange={e => handleInputChange('colorPage16Plus', e.target.value)}
                        onBlur={() => handleInputBlur('colorPage16Plus', 8)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-800" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">Per page price for bulky files</span>
                  </div>
                </div>
              </div>

              {/* Side Options & Surcharges Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Double-Sided & Surcharges</h2>
                    <p className="text-[11px] text-slate-400">Specify paper size multipliers, double side pricing, and photo base fallbacks</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* B&W Double Sided vs Fallback */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-50 pb-1">Black & White Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold mb-1">Double-Sided Sheet (₹)</span>
                        <div className="flex items-center">
                          <span className="text-slate-400 mr-1.5 text-xs">₹</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={getInputValue('bwDoubleSide')} 
                            onChange={e => handleInputChange('bwDoubleSide', e.target.value)}
                            onBlur={() => handleInputBlur('bwDoubleSide', 3)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-bold text-slate-800" 
                          />
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold mb-1">Legacy Base (₹)</span>
                        <div className="flex items-center">
                          <span className="text-slate-400 mr-1.5 text-xs">₹</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={getInputValue('bwBase')} 
                            onChange={e => handleInputChange('bwBase', e.target.value)}
                            onBlur={() => handleInputBlur('bwBase', 2)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-bold text-slate-800" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Color Double Sided vs Fallback */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-50 pb-1">Color Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold mb-1">Double-Sided Sheet (₹)</span>
                        <div className="flex items-center">
                          <span className="text-slate-400 mr-1.5 text-xs">₹</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={getInputValue('colorDoubleSide')} 
                            onChange={e => handleInputChange('colorDoubleSide', e.target.value)}
                            onBlur={() => handleInputBlur('colorDoubleSide', 15)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-bold text-slate-800" 
                          />
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold mb-1">Legacy Base (₹)</span>
                        <div className="flex items-center">
                          <span className="text-slate-400 mr-1.5 text-xs">₹</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={getInputValue('colorBase')} 
                            onChange={e => handleInputChange('colorBase', e.target.value)}
                            onBlur={() => handleInputBlur('colorBase', 10)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-bold text-slate-800" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Surcharges (A3 and Glossy) */}
                  <div className="space-y-4 md:col-span-2">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-50 pb-1">Media Options & Paper Upgrades</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold text-slate-700">A3 Multiplier (x)</span>
                          <span className="text-[10px] text-slate-400">Multiplies page cost for larger format paper</span>
                        </div>
                        <div className="flex items-center w-24">
                          <span className="text-slate-400 font-bold mr-1 text-xs">x</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={getInputValue('a3Multiplier')} 
                            onChange={e => handleInputChange('a3Multiplier', e.target.value)}
                            onBlur={() => handleInputBlur('a3Multiplier', 2)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-right font-bold text-xs outline-none" 
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold text-slate-700">Glossy Paper Add-on (₹)</span>
                          <span className="text-[10px] text-slate-400">Flat premium added per glossy sheet</span>
                        </div>
                        <div className="flex items-center w-24">
                          <span className="text-slate-400 font-bold mr-1 text-xs">₹</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={getInputValue('glossyAddon')} 
                            onChange={e => handleInputChange('glossyAddon', e.target.value)}
                            onBlur={() => handleInputBlur('glossyAddon', 5)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-right font-bold text-xs outline-none" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Printing Rates */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Image className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Premium Photo Printing</h2>
                    <p className="text-[11px] text-slate-400">Configure flat rates for printing on premium glossy photo paper cuts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <span className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">6" x 4" Photo</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('photo6x4')} 
                        onChange={e => handleInputChange('photo6x4', e.target.value)}
                        onBlur={() => handleInputBlur('photo6x4', 15)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-800" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">Per print charge</span>
                  </div>

                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <span className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">7" x 5" Photo</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('photo7x5')} 
                        onChange={e => handleInputChange('photo7x5', e.target.value)}
                        onBlur={() => handleInputBlur('photo7x5', 25)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-800" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">Per print charge</span>
                  </div>

                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                    <span className="block text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">8" x 6" Photo</span>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold mr-2">₹</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={getInputValue('photo8x6')} 
                        onChange={e => handleInputChange('photo8x6', e.target.value)}
                        onBlur={() => handleInputBlur('photo8x6', 35)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-800" 
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">Per print charge</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Sandbox Sidebar (Calculator & Quick Save) */}
            <div className="space-y-6">
              
              {/* Simulation Sandbox Card */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 sticky top-20">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold">Pricing Simulation Sandbox</h3>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Test and verify how your new range rates and surcharges apply to customer uploads in real-time.
                </p>

                <div className="space-y-4 text-xs">
                  {/* Select Paper size & photo */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1.5">Document or Photo Size</label>
                    <select 
                      value={simPaperSize} 
                      onChange={e => {
                        const val = e.target.value as any;
                        setSimPaperSize(val);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 outline-none focus:border-indigo-500 text-white font-medium"
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
                        <label className="block text-slate-400 font-medium mb-1.5">Color Option</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-xl">
                          <button 
                            type="button"
                            onClick={() => setSimColor('Black & White')}
                            className={`py-1.5 rounded-lg text-center font-bold transition ${simColor === 'Black & White' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            B&W
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSimColor('Color')}
                            className={`py-1.5 rounded-lg text-center font-bold transition ${simColor === 'Color' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Color
                          </button>
                        </div>
                      </div>

                      {/* Number of Pages */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-medium mb-1.5">Number of Pages</label>
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
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 outline-none focus:border-indigo-500 text-white font-bold" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-medium mb-1.5">Sides</label>
                          <select 
                            value={simSides} 
                            onChange={e => setSimSides(e.target.value as any)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 outline-none focus:border-indigo-500 text-white"
                          >
                            <option value="Single">Single Sided</option>
                            <option value="Double">Double Sided</option>
                          </select>
                        </div>
                      </div>

                      {/* Paper Type */}
                      <div>
                        <label className="block text-slate-400 font-medium mb-1.5">Paper Type Upgrade</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-xl">
                          <button 
                            type="button"
                            onClick={() => setSimPaperType('Plain')}
                            className={`py-1.5 rounded-lg text-center font-bold transition ${simPaperType === 'Plain' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Plain
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSimPaperType('Glossy')}
                            className={`py-1.5 rounded-lg text-center font-bold transition ${simPaperType === 'Glossy' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Glossy (+{pricing.glossyAddon} /sheet)
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Number of Copies */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1.5">Number of Copies</label>
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 outline-none focus:border-indigo-500 text-white font-bold" 
                    />
                  </div>

                  {/* Calculated Result Display */}
                  <div className="pt-6 border-t border-slate-800 mt-6 text-center bg-slate-850 p-4 rounded-2xl border border-indigo-500/10">
                    <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-extrabold mb-1">Estimated Customer Price</span>
                    <span className="text-3xl font-black text-indigo-300">₹{calculatedSimPrice.toFixed(2)}</span>
                    <span className="block text-[10px] text-slate-500 mt-1">
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
