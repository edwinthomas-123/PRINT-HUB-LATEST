import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PrintSettings, Shop } from '../types';
import { 
  UploadCloud, File as FileIcon, ChevronRight, X, Loader2, 
  Settings, Copy, CheckCircle, Shield, Sparkles, Plus, 
  Minus, Check, SlidersHorizontal, Eye, Maximize2, Crop, AlertCircle, Layers,
  HelpCircle, Info
} from 'lucide-react';
import { getPdfPageCount, parsePageRange } from '../utils';
import { parseResponseJson } from '../utils/api';
import { IDCardPrintWorkflow } from '../components/IDCardPrintWorkflow';

export type UploadFile = {
  id: string;
  file: File;
  pagesCount: number;
  settings: PrintSettings;
  previewUrl?: string;
  isIdCard?: boolean;
};

export function Upload() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Tab: 'upload' (standard docs) | 'idcard' (ID card workflow)
  const [activeTab, setActiveTab] = useState<'upload' | 'idcard'>('upload');
  
  // Input clearing fix: maintain raw string state for copies so users can select-all and backspace to empty
  const [copiesInputs, setCopiesInputs] = useState<Record<string, string>>({});

  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>(() => {
    if (location.state && location.state.uploadFiles) {
      return location.state.uploadFiles.map((f: any) => {
        let previewUrl: string | undefined = f.previewUrl;
        if (!previewUrl && f.file && f.file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(f.file);
        }
        return {
          id: Math.random().toString(36).substring(7),
          file: f.file,
          pagesCount: f.pagesCount,
          settings: {
            fitToPage: true,
            scaleOption: 'fit',
            ...f.settings
          },
          previewUrl,
          isIdCard: f.isIdCard || f.settings?.isIdCard || false
        };
      });
    }
    return [];
  });
  const [error, setError] = useState<string | null>(null);
  
  const defaultSettings: PrintSettings = {
    color: 'Black & White',
    paperSize: 'A4',
    paperType: 'Plain',
    orientation: 'Portrait',
    sides: 'Single',
    copies: 1,
    pages: 'All',
    fitToPage: true,
    scaleOption: 'fit'
  };

  const filesRef = useRef<UploadFile[]>([]);
  useEffect(() => {
    filesRef.current = uploadFiles;
  }, [uploadFiles]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach(f => {
        if (f.previewUrl && !f.previewUrl.startsWith('data:')) {
          URL.revokeObjectURL(f.previewUrl);
        }
      });
    };
  }, []);

  useEffect(() => {
    async function loadShop() {
      if (!shopId) return;
      if (shopId === 'demo-local-shop') {
        setShop({
          id: 'demo-local-shop',
          name: 'Demo Print Shop',
          address: '123 Main Street',
          ownerId: 'demo',
          rating: 4.8,
          isOpen: true,
          pricing: {
            bwBase: 2,
            bwDoubleSide: 3,
            colorBase: 10,
            colorDoubleSide: 15,
            a3Multiplier: 2,
            glossyAddon: 5,
            photo6x4: 15,
            photo7x5: 25,
            photo8x6: 35,
          }
        });
        setLoading(false);
      } else {
        try {
          const docRef = doc(db, 'shops', shopId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setShop({ id: docSnap.id, ...docSnap.data() } as Shop);
          } else {
            setError('Shop not found.');
          }
        } catch (err) {
          setError('Failed to load shop details.');
        } finally {
          setLoading(false);
        }
      }
    }
    loadShop();
  }, [shopId]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      const validFiles: File[] = [];
      const MAX_SIZE = 30 * 1024 * 1024; // 30 MB
      
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 
        'image/png'
      ];

      for (const file of selectedFiles) {
        if (!allowedTypes.includes(file.type)) {
          setError(`File ${file.name} is not a supported format.`);
          continue;
        }
        if (file.size > MAX_SIZE) {
          setError(`File ${file.name} exceeds the 30MB size limit.`);
          continue;
        }
        if (file.size === 0) {
          setError(`File ${file.name} appears to be corrupted or empty.`);
          continue;
        }
        validFiles.push(file);
      }

      setProcessingFiles(true);
      const newUploads: UploadFile[] = [];
      for (const file of validFiles) {
        const pagesCount = await getPdfPageCount(file);
        let previewUrl: string | undefined;
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
        }
        newUploads.push({
          id: Math.random().toString(36).substring(7),
          file,
          pagesCount,
          settings: { ...defaultSettings },
          previewUrl
        });
      }
      setUploadFiles(prev => [...prev, ...newUploads]);
      setProcessingFiles(false);
      
      // Reset file input
      e.target.value = '';
    }
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.previewUrl && !fileToRemove.previewUrl.startsWith('data:')) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
    setCopiesInputs(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const updateFileSettings = (id: string, updates: Partial<PrintSettings>) => {
    setUploadFiles(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, settings: { ...f.settings, ...updates } };
      }
      return f;
    }));
  };

  // Safe Copies Input Handlers (Permits clearing, backspace, and replace)
  const getCopiesDisplay = (fileId: string, currentCopies: number): string => {
    if (copiesInputs[fileId] !== undefined) {
      return copiesInputs[fileId];
    }
    return String(currentCopies || 1);
  };

  const handleCopiesChange = (fileId: string, text: string) => {
    // Only allow numeric characters
    const clean = text.replace(/[^0-9]/g, '');
    setCopiesInputs(prev => ({ ...prev, [fileId]: clean }));

    if (clean !== '') {
      const val = parseInt(clean, 10);
      if (!isNaN(val) && val >= 1) {
        updateFileSettings(fileId, { copies: val });
      }
    }
  };

  const handleCopiesBlur = (fileId: string, fallback: number = 1) => {
    const raw = copiesInputs[fileId];
    if (raw === undefined) return;
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 1 || raw.trim() === '') {
      setCopiesInputs(prev => ({ ...prev, [fileId]: String(fallback) }));
      updateFileSettings(fileId, { copies: fallback });
    } else {
      setCopiesInputs(prev => ({ ...prev, [fileId]: String(parsed) }));
      updateFileSettings(fileId, { copies: parsed });
    }
  };

  const stepCopies = (fileId: string, currentCopies: number, delta: number) => {
    const next = Math.max(1, currentCopies + delta);
    setCopiesInputs(prev => ({ ...prev, [fileId]: String(next) }));
    updateFileSettings(fileId, { copies: next });
  };

  // Quick Preset Helper
  const applyPreset = (preset: 'bw' | 'color' | 'double') => {
    setUploadFiles(prev => prev.map(f => {
      if (preset === 'bw') {
        return { ...f, settings: { ...f.settings, color: 'Black & White', sides: 'Single', paperType: 'Plain', fitToPage: true } };
      } else if (preset === 'color') {
        return { ...f, settings: { ...f.settings, color: 'Color', sides: 'Single', fitToPage: true } };
      } else {
        return { ...f, settings: { ...f.settings, color: 'Black & White', sides: 'Double', paperType: 'Plain', fitToPage: true } };
      }
    }));
  };

  // Quick Page Range Helpers for assistance
  const getOddPages = (total: number) => {
    const odds: number[] = [];
    for (let i = 1; i <= Math.min(total, 50); i += 2) odds.push(i);
    return odds.join(', ');
  };

  const getEvenPages = (total: number) => {
    const evens: number[] = [];
    for (let i = 2; i <= Math.min(total, 50); i += 2) evens.push(i);
    return evens.length > 0 ? evens.join(', ') : '2';
  };

  // Handler when ID Card Print Workflow finishes generating A4 document
  const handleIDCardComplete = (file: File, previewUrl: string, settings: Partial<PrintSettings>) => {
    const newIdCardUpload: UploadFile = {
      id: Math.random().toString(36).substring(7),
      file,
      pagesCount: 1,
      settings: {
        ...defaultSettings,
        color: 'Color',
        paperSize: 'A4',
        paperType: 'Plain',
        orientation: 'Portrait',
        sides: 'Single',
        copies: 1,
        pages: 'All',
        fitToPage: true,
        scaleOption: 'fit',
        isIdCard: true,
        ...settings
      },
      previewUrl,
      isIdCard: true
    };

    setUploadFiles(prev => [...prev, newIdCardUpload]);
    setActiveTab('upload'); // Switch to main upload queue so user sees the card ready to print
  };

  const calculateFilePrice = (uf: UploadFile) => {
    if (!shop) return 0;
    
    const pricing = shop.pricing || {
      bwBase: 2,
      bwDoubleSide: 3,
      colorBase: 10,
      colorDoubleSide: 15,
      a3Multiplier: 2,
      glossyAddon: 5,
      photo6x4: 15,
      photo7x5: 25,
      photo8x6: 35,
    };
    
    const { settings, pagesCount } = uf;
    
    let pagesToPrint = pagesCount;
    if (settings.pages && settings.pages.toLowerCase() !== 'all') {
      pagesToPrint = parsePageRange(settings.pages, pagesCount);
    }
    
    let sheets = pagesToPrint;
    
    // Check if it's a photo size
    if (settings.paperSize === '6x4 Photo') {
      return (pricing.photo6x4 || 15) * sheets * settings.copies;
    } else if (settings.paperSize === '7x5 Photo') {
      return (pricing.photo7x5 || 25) * sheets * settings.copies;
    } else if (settings.paperSize === '8x6 Photo') {
      return (pricing.photo8x6 || 35) * sheets * settings.copies;
    }
    
    // Normal A4/A3/Legal
    let isColor = settings.color === 'Color';
    let isDouble = settings.sides === 'Double';
    
    const totalBwPages = uploadFiles.filter(f => f.settings.color === 'Black & White' && !f.settings.paperSize.includes('Photo')).reduce((acc, f) => {
      let p = f.pagesCount;
      if (f.settings.pages && f.settings.pages.toLowerCase() !== 'all') p = parsePageRange(f.settings.pages, f.pagesCount);
      return acc + p * f.settings.copies;
    }, 0);

    const totalColorPages = uploadFiles.filter(f => f.settings.color === 'Color' && !f.settings.paperSize.includes('Photo')).reduce((acc, f) => {
      let p = f.pagesCount;
      if (f.settings.pages && f.settings.pages.toLowerCase() !== 'all') p = parsePageRange(f.settings.pages, f.pagesCount);
      return acc + p * f.settings.copies;
    }, 0);

    let sheetPrice = 0;
    
    const bwPage1 = pricing.bwPage1 ?? pricing.bwBase ?? 5;
    const bwPage2To15 = pricing.bwPage2To15 ?? pricing.bwBase ?? 3;
    const bwPage16Plus = pricing.bwPage16Plus ?? pricing.bwBase ?? 2;
    
    const colorPage1 = pricing.colorPage1 ?? pricing.colorBase ?? 15;
    const colorPage2To15 = pricing.colorPage2To15 ?? pricing.colorBase ?? 10;
    const colorPage16Plus = pricing.colorPage16Plus ?? pricing.colorBase ?? 8;

    if (isColor) {
      let baseColorPrice = colorPage1;
      if (totalColorPages === 1) baseColorPrice = colorPage1;
      else if (totalColorPages > 1 && totalColorPages <= 15) baseColorPrice = colorPage2To15;
      else if (totalColorPages > 15) baseColorPrice = colorPage16Plus;
      
      if (isDouble) sheetPrice = pricing.colorDoubleSide || (baseColorPrice * 1.5);
      else sheetPrice = baseColorPrice;
    } else {
      let baseBwPrice = bwPage1;
      if (totalBwPages === 1) baseBwPrice = bwPage1;
      else if (totalBwPages > 1 && totalBwPages <= 15) baseBwPrice = bwPage2To15;
      else if (totalBwPages > 15) baseBwPrice = bwPage16Plus;
      
      if (isDouble) sheetPrice = pricing.bwDoubleSide || (baseBwPrice * 1.5);
      else sheetPrice = baseBwPrice;
    }

    if (settings.paperSize === 'A3') sheetPrice *= pricing.a3Multiplier || 2;
    if (settings.paperType === 'Glossy') sheetPrice += pricing.glossyAddon || 5;
    
    if (isDouble) {
      sheets = Math.ceil(pagesToPrint / 2);
    }
    
    return sheetPrice * sheets * settings.copies;
  };

  const calculateTotalPrice = () => {
    return uploadFiles.reduce((sum, f) => sum + calculateFilePrice(f), 0);
  };

  const handleContinue = () => {
    if (uploadFiles.length === 0) return;
    setError(null);

    // Map files for review - no user login required, seamless print-and-go
    const filesForReview = uploadFiles.map((uf) => ({
      file: uf.file,
      fileName: uf.file.name,
      fileSize: uf.file.size,
      fileType: uf.file.type || 'application/octet-stream',
      pagesCount: uf.pagesCount,
      settings: uf.settings,
      price: calculateFilePrice(uf),
      fileUrl: '',
      filePath: '',
      isIdCard: uf.isIdCard
    }));

    navigate(`/shop/${shopId}/review`, { 
      state: { 
        uploadFiles: filesForReview,
        price: calculateTotalPrice()
      } 
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
        <span className="text-sm font-semibold text-slate-500">Loading print shop...</span>
      </div>
    );
  }
  
  if (!shop) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-3xl shadow-sm border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
          !
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-950">Shop Not Found</h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            {error || "We couldn't locate this print shop. Please make sure the QR code or link is correct and try again."}
          </p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Top Header with Shop Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-0.5">
            Print Order For
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight notranslate" translate="no">
            {shop.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {shop.address || "Instant Cloud Printing Hub"}
          </p>
        </div>

        {/* Mode Selector Tabs (User Request: option to print documents & option to print ID card) */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-full sm:w-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileIcon className="w-4 h-4" />
            <span>Upload Documents</span>
            {uploadFiles.length > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">
                {uploadFiles.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('idcard')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'idcard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Print ID Card</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-400 text-amber-950">
              New
            </span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB: ID Card Workflow */}
      {activeTab === 'idcard' && (
        <IDCardPrintWorkflow 
          onComplete={handleIDCardComplete}
          onCancel={() => setActiveTab('upload')}
        />
      )}

      {/* RENDER ACTIVE TAB: Standard Documents Upload */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Main Upload Drop Area */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Upload Your Documents</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select PDFs, Word files, or pictures. All pages will be formatted for printing.
                </p>
              </div>

              {/* Quick ID Card CTA Pill */}
              <button
                type="button"
                onClick={() => setActiveTab('idcard')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200/80 cursor-pointer shadow-2xs"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Need to Print ID Card? Switch here</span>
              </button>
            </div>

            <label className={`border-2 border-dashed ${processingFiles ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300/80 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-400'} rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group`}>
              {processingFiles ? (
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:border-indigo-300 group-hover:shadow-sm transition-all duration-200 shadow-2xs">
                  <UploadCloud className="w-8 h-8 text-indigo-600" />
                </div>
              )}
              <span className="font-bold text-slate-800 text-base text-center">
                {processingFiles ? 'Analyzing & preparing files...' : 'Click or drag files here to upload'}
              </span>
              <span className="text-xs text-slate-500 mt-1.5 text-center font-medium">
                Supported: PDF, Word (DOCX/DOC), JPG, PNG up to 30MB
              </span>
              <input 
                type="file" 
                multiple 
                className="hidden" 
                onChange={handleFiles} 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                disabled={processingFiles} 
              />
            </label>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Files List & Print Settings Configuration */}
          {uploadFiles.length > 0 && (
            <div className="space-y-6 animate-fade-in">
              {/* Header with Quick Presets */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Configure Print Settings ({uploadFiles.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize color, orientation, sides, fit, pages, and copies for each document.
                  </p>
                </div>

                {/* Quick Presets for Bulk Settings */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mr-1">
                    Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyPreset('bw')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
                  >
                    B&W Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('color')}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
                  >
                    Full Color
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('double')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
                  >
                    Double Sided
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('idcard')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add ID Card</span>
                  </button>
                </div>
              </div>

              {/* Small Guidance Assistant Banner for Normal Users */}
              <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/40 to-slate-50 border border-indigo-150/70 rounded-2xl p-3.5 flex items-start gap-3 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-700 flex-1 leading-relaxed">
                  <span className="font-bold text-slate-900 mr-1.5">Print Assistant:</span>
                  <span className="text-slate-600">
                    Live preview updates instantly with your choices. We keep <strong className="text-emerald-700 font-semibold">Fit to Printable Area</strong> enabled by default so text and tables never get cut off by printer borders. Choose <strong className="text-slate-800 font-semibold">Double Sided</strong> to print front and back on a single sheet.
                  </span>
                </div>
              </div>
              
              {/* Document Cards */}
              <div className="space-y-5">
                {uploadFiles.map((uf) => {
                  const isId = uf.isIdCard || uf.settings.isIdCard;
                  return (
                    <div 
                      key={uf.id} 
                      className={`bg-white border rounded-3xl shadow-xs overflow-hidden transition ${
                        isId ? 'border-indigo-300 ring-1 ring-indigo-500/20' : 'border-slate-200'
                      }`}
                    >
                      {/* File Card Header */}
                      <div className="p-4 bg-slate-50/80 border-b border-slate-150 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`p-2.5 rounded-2xl shrink-0 ${
                            isId ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {isId ? <Shield className="w-5 h-5" /> : <FileIcon className="w-5 h-5" />}
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                                {uf.file.name}
                              </p>
                              {isId && (
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                                  ID Card • Curved Corners
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {(uf.file.size / 1024 / 1024).toFixed(2)} MB • {uf.pagesCount} {uf.pagesCount === 1 ? 'Page' : 'Pages'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Est. Price
                            </span>
                            <span className="font-black text-slate-900 text-lg">
                              ₹{calculateFilePrice(uf).toFixed(2)}
                            </span>
                          </div>

                          <button 
                            onClick={() => removeFile(uf.id)} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                            title="Remove document"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* File Card Body: Live Preview & Settings */}
                      <div className="p-5 flex flex-col md:flex-row gap-6">
                        {/* Live Preview Column */}
                        <div className="w-full md:w-[220px] shrink-0 flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl p-4 min-h-[240px]">
                          {/* Paper Sheet Preview Container */}
                          <div 
                            className={`relative shadow-md bg-white border border-slate-300 rounded-xs overflow-hidden flex items-center justify-center transition-all duration-300 ${
                              uf.settings.orientation === 'Landscape'
                                ? 'w-44 h-32' // Landscape ratio
                                : 'w-32 h-44' // Portrait ratio
                            }`}
                            style={{
                              filter: uf.settings.color === 'Black & White' ? 'grayscale(100%) contrast(105%)' : 'none'
                            }}
                          >
                            {/* Printable Margin Area Guide (Inner dashed border indicating printable boundary) */}
                            <div className={`w-full h-full ${uf.settings.fitToPage !== false ? 'p-2' : 'p-0'} flex items-center justify-center transition-all duration-200`}>
                              <div className={`w-full h-full ${
                                uf.settings.fitToPage !== false 
                                  ? 'border border-dashed border-slate-300/90 rounded-xs flex items-center justify-center overflow-hidden bg-slate-50/20 p-1'
                                  : 'overflow-hidden flex items-center justify-center'
                              }`}>
                                {uf.previewUrl ? (
                                  <img 
                                    src={uf.previewUrl} 
                                    alt="Print Preview" 
                                    className={`transition-all duration-200 ${
                                      uf.settings.fitToPage !== false
                                        ? 'max-w-full max-h-full object-contain drop-shadow-2xs'
                                        : 'w-full h-full object-cover scale-110'
                                    }`} 
                                  />
                                ) : (
                                  // Mock A4 Page content representation
                                  <div className="w-full h-full p-2 flex flex-col justify-between select-none bg-white">
                                    <div className="flex items-center gap-1 border-b border-slate-100 pb-1">
                                      <span className="bg-red-100 text-red-700 text-[8px] font-bold px-1 py-0.5 rounded leading-none shrink-0">PDF</span>
                                      <div className="h-1 bg-slate-200 rounded w-10"></div>
                                    </div>
                                    <div className="space-y-1.5 flex-1 py-1.5">
                                      <div className="h-1 bg-slate-200 rounded w-full"></div>
                                      <div className="h-1 bg-slate-200 rounded w-11/12"></div>
                                      <div className="h-1 bg-slate-200 rounded w-10/12"></div>
                                      <div className="h-1 bg-slate-200 rounded w-full"></div>
                                    </div>
                                    <div className="text-[7.5px] text-slate-400 text-center font-medium border-t border-slate-100 pt-0.5">
                                      Page 1 of {uf.pagesCount}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Live Badges on Preview */}
                            <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 pointer-events-none">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs leading-none ${
                                uf.settings.color === 'Color' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white'
                              }`}>
                                {uf.settings.color === 'Color' ? 'Color' : 'B&W'}
                              </span>
                            </div>

                            {/* Margin safe indicator badge */}
                            <div className="absolute bottom-1.5 left-1.5 pointer-events-none">
                              <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded shadow-xs leading-none ${
                                uf.settings.fitToPage !== false 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-amber-600 text-white'
                              }`}>
                                {uf.settings.fitToPage !== false ? 'Margin Safe' : '100% Bleed'}
                              </span>
                            </div>
                          </div>

                          <div className="text-center mt-3">
                            <span className="text-[11px] font-bold text-slate-700 block">
                              Live Preview ({uf.settings.orientation})
                            </span>
                            {uf.settings.fitToPage !== false ? (
                              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-emerald-200/60">
                                ✓ Fit to Printable Area
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-amber-200/60">
                                ⚠️ 100% Actual Size
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Settings Form Column */}
                        <div className="flex-1 space-y-4">
                          {/* Row 1: Primary Options (Color, Orientation, Sides) */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            {/* 1. Color / Black & White */}
                            <div>
                              <label className="block text-[11px] font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                                Color Mode
                              </label>
                              <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => updateFileSettings(uf.id, { color: 'Black & White' })}
                                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                    uf.settings.color === 'Black & White'
                                      ? 'bg-slate-900 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                  }`}
                                >
                                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-600 shrink-0"></span>
                                  <span>B&W</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateFileSettings(uf.id, { color: 'Color' })}
                                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                    uf.settings.color === 'Color'
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                  }`}
                                >
                                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 shrink-0"></span>
                                  <span>Color</span>
                                </button>
                              </div>
                            </div>

                            {/* 2. Orientation */}
                            <div>
                              <label className="block text-[11px] font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                                Orientation
                              </label>
                              <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => updateFileSettings(uf.id, { orientation: 'Portrait' })}
                                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                    uf.settings.orientation === 'Portrait'
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                  }`}
                                >
                                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="5" y="3" width="14" height="18" rx="2" />
                                  </svg>
                                  <span>Portrait</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateFileSettings(uf.id, { orientation: 'Landscape' })}
                                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                    uf.settings.orientation === 'Landscape'
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                  }`}
                                >
                                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="3" y="5" width="18" height="14" rx="2" />
                                  </svg>
                                  <span>Landscape</span>
                                </button>
                              </div>
                            </div>

                            {/* 3. Sides */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                  Sides
                                </label>
                                <span className="text-[9.5px] font-bold text-slate-400">
                                  {uf.settings.sides === 'Double' ? 'Front & Back' : '1-Sided'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => updateFileSettings(uf.id, { sides: 'Single' })}
                                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                    uf.settings.sides === 'Single'
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                  }`}
                                >
                                  <Layers className="w-3.5 h-3.5 shrink-0 opacity-90" />
                                  <span>Single</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateFileSettings(uf.id, { sides: 'Double' })}
                                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                    uf.settings.sides === 'Double'
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                  }`}
                                >
                                  <Copy className="w-3.5 h-3.5 shrink-0 opacity-90" />
                                  <span>Double</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Row 2: Fit to Printable Area & Copies */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                            {/* Fit to Printable Area */}
                            <div className="sm:col-span-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <span>Fit to Printable Area</span>
                                  <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    Prevents Cut-Offs
                                  </span>
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => updateFileSettings(uf.id, { fitToPage: true, scaleOption: 'fit' })}
                                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                    uf.settings.fitToPage !== false
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 shrink-0" />
                                  <span>Fit to Printable Area</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateFileSettings(uf.id, { fitToPage: false, scaleOption: 'actual' })}
                                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                    uf.settings.fitToPage === false
                                      ? 'bg-slate-900 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                  }`}
                                >
                                  <span>100% Actual Size</span>
                                </button>
                              </div>
                              {/* Micro-assistance hint */}
                              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                <Info className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span>
                                  {uf.settings.fitToPage !== false
                                    ? 'Auto-scales within paper margins so zero text or borders get cropped.'
                                    : 'Prints exact 1:1 size; printers may clip up to 5mm around sheet borders.'}
                                </span>
                              </p>
                            </div>

                            {/* Copies */}
                            <div>
                              <label className="block text-[11px] font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                                Copies
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => stepCopies(uf.id, uf.settings.copies, -1)}
                                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                                  title="Decrease copies"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>

                                <input 
                                  type="text" 
                                  inputMode="numeric"
                                  className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl py-2 px-2 text-sm font-bold focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:outline-none transition shadow-2xs"
                                  value={getCopiesDisplay(uf.id, uf.settings.copies)} 
                                  onChange={e => handleCopiesChange(uf.id, e.target.value)} 
                                  onBlur={() => handleCopiesBlur(uf.id, uf.settings.copies || 1)}
                                  placeholder="1"
                                />

                                <button
                                  type="button"
                                  onClick={() => stepCopies(uf.id, uf.settings.copies, 1)}
                                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                                  title="Increase copies"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 text-center">
                                {uf.settings.copies} {uf.settings.copies === 1 ? 'copy' : 'copies'} per set
                              </p>
                            </div>
                          </div>

                          {/* Row 3: Pages to Print & Smart Assistance Shortcuts */}
                          <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <span>Pages to Print</span>
                                <span className="text-[10px] font-semibold text-slate-500">
                                  ({uf.pagesCount} {uf.pagesCount === 1 ? 'Page Total' : 'Pages Total'})
                                </span>
                              </label>
                              {uf.settings.pages !== 'All' && (
                                <button
                                  type="button"
                                  onClick={() => updateFileSettings(uf.id, { pages: 'All' })}
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                >
                                  Reset to All Pages
                                </button>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <input 
                                type="text" 
                                placeholder="e.g. All or 1-5, 8" 
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:outline-none transition shadow-2xs"
                                value={uf.settings.pages} 
                                onChange={e => updateFileSettings(uf.id, { pages: e.target.value })} 
                              />

                              {/* Quick 1-Tap Shortcuts for normal users */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => updateFileSettings(uf.id, { pages: 'All' })}
                                  className={`px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                    uf.settings.pages === 'All'
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  All ({uf.pagesCount})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateFileSettings(uf.id, { pages: '1' })}
                                  className={`px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                    uf.settings.pages === '1'
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  Page 1 Only
                                </button>
                                {uf.pagesCount > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => updateFileSettings(uf.id, { pages: getOddPages(uf.pagesCount) })}
                                      className={`px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                        uf.settings.pages === getOddPages(uf.pagesCount)
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                      }`}
                                      title="Print odd pages: 1, 3, 5..."
                                    >
                                      Odd Pages
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateFileSettings(uf.id, { pages: getEvenPages(uf.pagesCount) })}
                                      className={`px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                        uf.settings.pages === getEvenPages(uf.pagesCount)
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                      }`}
                                      title="Print even pages: 2, 4, 6..."
                                    >
                                      Even Pages
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Micro Guidance Assistant note */}
                            <p className="text-[10.5px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                              <span className="font-bold text-indigo-600">💡 Quick Assistance:</span>
                              <span>Tap a shortcut button above, or type custom numbers like <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[9.5px]">1-3, 5</code>.</span>
                            </p>
                          </div>
                          
                          {/* Mobile Price Display */}
                          <div className="sm:hidden pt-3 border-t border-slate-150 flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-500">Est. Price:</span>
                            <span className="font-black text-slate-900 text-base">₹{calculateFilePrice(uf).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Checkout / Review Sticky Summary Bar */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Estimated Order Total
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Instant Pricing
                    </span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1 tracking-tight">
                    ₹{calculateTotalPrice().toFixed(2)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {uploadFiles.length} {uploadFiles.length === 1 ? 'document' : 'documents'} ready • Fit to page applied
                  </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('idcard')}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-indigo-200/80 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs"
                  >
                    <Shield className="w-4 h-4" />
                    <span>+ Add ID Card</span>
                  </button>

                  <button 
                    onClick={handleContinue}
                    disabled={isUploading}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/25 disabled:bg-indigo-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        <span>Uploading files...</span>
                      </>
                    ) : (
                      <>
                        <span>Review & Pay</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
