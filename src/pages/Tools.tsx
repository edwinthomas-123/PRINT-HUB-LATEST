import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ToolsLayout } from './ToolsLayout';
import { MergePDFTool, SplitPDFTool, GenericTool } from '../components/PDFTools';
import { SmartIDPrintTool } from '../components/SmartIDPrintTool';
import { QuickReceiptTool } from '../components/QuickReceiptTool';
import { QRGeneratorTool, BarcodeGeneratorTool, ImageToPDFTool, RotatePDFTool, WatermarkPDFTool, CompressPDFTool, GenericMockTool, ImageCompressorTool, ShopLayoutTool, PassportPhotoTool, InkEstimatorTool, DigitalSignatureTool} from '../components/OtherTools';
import { CVBuilderTool } from '../components/CVBuilderTool';
import { RemovePDFPasswordTool } from '../components/RemovePDFPasswordTool';
import { DocumentScannerTool } from '../components/DocumentScannerTool';
import { ImageIcon, KeyRound, FileType2, Sparkles, Crown } from 'lucide-react';
import { AIPassportImageMaker } from '../components/AIPassportImageMaker';
import { BusinessPlusGate } from '../components/BusinessPlusGate';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Shop } from '../types';

export function Tools() {
  const [searchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<string | null>(() => {
    const toolParam = searchParams.get('tool');
    if (toolParam === 'ai-passport') return 'AI Passport Maker';
    if (toolParam === 'passport-photo') return 'Passport Photo';
    return null;
  });
  const [activeCategory, setActiveCategory] = useState<'all' | 'pdf' | 'image' | 'shop'>('all');
  const [sharedImage, setSharedImage] = useState<string | null>(null);

  // Shop partner auth and plan check
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const shopDoc = await getDoc(doc(db, 'shops', currentUser.uid));
          if (shopDoc.exists()) {
            setShop({ id: shopDoc.id, ...shopDoc.data() } as Shop);
          } else {
            setShop(null);
          }
        } catch (e) {
          console.error("Error loading partner shop in Tools:", e);
          setShop(null);
        }
      } else {
        setShop(null);
      }
      setLoadingShop(false);
    });

    return () => unsubscribe();
  }, []);

  const isBusinessPlus = ((shop?.plan || shop?.subscription?.plan || '').toLowerCase() === 'business_plus');

  const handleCategoryChange = (category: 'all' | 'pdf' | 'image' | 'shop') => {
    setActiveCategory(category);
    setActiveTool(null);
    setSharedImage(null);
  };

  if (activeTool) {
    return (
      <ToolsLayout activeCategory={activeCategory} onCategoryChange={handleCategoryChange}>
        {activeTool === 'AI Passport Maker' && (
          isBusinessPlus ? (
            <div className="max-w-4xl mx-auto">
              <AIPassportImageMaker 
                shopId={shop?.id || user?.uid || null}
                onBack={() => setActiveTool(null)} 
                onUseInGrid={(imgUrl) => {
                  setSharedImage(imgUrl);
                  setActiveTool('Passport Photo');
                }}
              />
            </div>
          ) : (
            <BusinessPlusGate 
              onBack={() => setActiveTool(null)}
              user={user}
              shop={shop}
              onOpenFreePassport={() => setActiveTool('Passport Photo')}
            />
          )
        )}
        {activeTool === 'Smart ID Print' && <div className="max-w-3xl mx-auto"><SmartIDPrintTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Merge PDF' && <div className="max-w-4xl mx-auto"><MergePDFTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Split PDF' && <div className="max-w-2xl mx-auto"><SplitPDFTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'QR Code Generator' && <div className="max-w-2xl mx-auto"><QRGeneratorTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Barcode Generator' && <div className="max-w-2xl mx-auto"><BarcodeGeneratorTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Image to PDF' && <div className="max-w-2xl mx-auto"><ImageToPDFTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Rotate PDF' && <div className="max-w-2xl mx-auto"><RotatePDFTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Watermark PDF' && <div className="max-w-2xl mx-auto"><WatermarkPDFTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Compress PDF' && <div className="max-w-2xl mx-auto"><CompressPDFTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Document Scanner' && <div className="max-w-2xl mx-auto"><DocumentScannerTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'PDF to Image' && <div className="max-w-2xl mx-auto"><GenericMockTool name="PDF to Image" desc="Extract images or save PDF pages as images." icon={ImageIcon} btnLabel="Extract Images" onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Remove PDF Password' && <div className="max-w-2xl mx-auto"><RemovePDFPasswordTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'File Converter' && <div className="max-w-2xl mx-auto"><GenericMockTool name="File Converter" desc="Convert between various document formats." icon={FileType2} btnLabel="Convert File" onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Image Compressor' && <div className="max-w-2xl mx-auto"><ImageCompressorTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Layout Maker' && <div className="max-w-2xl mx-auto"><ShopLayoutTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Passport Photo' && <div className="max-w-2xl mx-auto"><PassportPhotoTool onBack={() => { setActiveTool(null); setSharedImage(null); }} initialImage={sharedImage} /></div>}
        {activeTool === 'Ink Estimator' && <div className="max-w-2xl mx-auto"><InkEstimatorTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Sign PDF' && <div className="max-w-4xl mx-auto"><DigitalSignatureTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'Quick Receipt' && <div className="max-w-2xl mx-auto"><QuickReceiptTool onBack={() => setActiveTool(null)} /></div>}
        {activeTool === 'CV Builder' && <div className="max-w-5xl mx-auto"><CVBuilderTool onBack={() => setActiveTool(null)} /></div>}
      </ToolsLayout>
    );
  }

  return (
    <ToolsLayout activeCategory={activeCategory} onCategoryChange={handleCategoryChange}>
      <div className="mb-10">
        <div className="w-full h-36 border-2 border-dashed border-slate-300/80 rounded-2xl flex flex-col items-center justify-center bg-white transition-all duration-200 hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer shadow-xs">
          <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">upload_file</span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-0.5 tracking-tight">Drag &amp; Drop files here</h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">or click to browse from your computer</p>
        </div>
      </div>

      <div className="space-y-12">
        {(activeCategory === 'all' || activeCategory === 'pdf') && (
          <section>
            <div className="flex items-center space-x-2 mb-6">
              <span className="material-symbols-outlined text-orange-500 text-2xl">picture_as_pdf</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">PDF Tools</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div onClick={() => setActiveTool('Merge PDF')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-orange-500 text-3xl mb-4 group-hover:scale-110 transition-transform">call_merge</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Merge PDF</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Combine multiple PDFs into one unified document.</p>
              </div>
              <div onClick={() => setActiveTool('Split PDF')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-orange-500 text-3xl mb-4 group-hover:scale-110 transition-transform">call_split</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Split PDF</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Extract pages or split a large PDF into smaller files.</p>
              </div>
              <div onClick={() => setActiveTool('Compress PDF')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-orange-500 text-3xl mb-4 group-hover:scale-110 transition-transform">compress</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Compress PDF</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Reduce file size while maintaining visual quality.</p>
              </div>
              <div onClick={() => setActiveTool('Rotate PDF')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-orange-500 text-3xl mb-4 group-hover:scale-110 transition-transform">rotate_right</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Rotate PDF</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Rotate specific pages or entire documents instantly.</p>
              </div>
              <div onClick={() => setActiveTool('Sign PDF')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-orange-500 text-3xl mb-4 group-hover:scale-110 transition-transform">draw</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Sign PDF</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Add digital signatures and stamps to your PDFs.</p>
              </div>
              <div onClick={() => setActiveTool('Watermark PDF')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-orange-500 text-3xl mb-4 group-hover:scale-110 transition-transform">water_drop</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Watermark PDF</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Add custom text or image watermarks to your pages.</p>
              </div>
              <div onClick={() => setActiveTool('Remove PDF Password')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-orange-500 text-3xl mb-4 group-hover:scale-110 transition-transform">key_off</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Remove Password</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Unlock password-protected PDFs before printing.</p>
              </div>
            </div>
          </section>
        )}

        {(activeCategory === 'all' || activeCategory === 'image') && (
          <section>
            <div className="flex items-center space-x-2 mb-6">
              <span className="material-symbols-outlined text-emerald-500 text-2xl">document_scanner</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Image &amp; Scanning</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div 
                onClick={() => setActiveTool('AI Passport Maker')} 
                className={`border rounded-2xl p-5 sm:p-6 flex flex-col transition-all duration-200 cursor-pointer group relative overflow-hidden shadow-2xs ${
                  isBusinessPlus 
                    ? 'bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-300 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5' 
                    : 'bg-gradient-to-br from-indigo-50/60 via-white to-amber-50/50 border-indigo-200 hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className="absolute top-2.5 right-2.5 z-10">
                  {isBusinessPlus ? (
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Crown className="w-2.5 h-2.5 fill-current" /> Business Plus Active
                    </span>
                  ) : (
                    <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Crown className="w-2.5 h-2.5 fill-current text-slate-950" /> Business Plus Only
                    </span>
                  )}
                </div>
                <span className="material-symbols-outlined text-indigo-600 text-3xl mb-4 group-hover:scale-110 transition-transform">face</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">AI Passport Maker</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Transform selfies to perfect passport pictures with professional coats and suits.</p>
              </div>
              <div onClick={() => setActiveTool('Image to PDF')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-emerald-500 text-3xl mb-4 group-hover:scale-110 transition-transform">image</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Image to PDF</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Convert JPG, PNG, or TIFF files to a single PDF.</p>
              </div>
              <div onClick={() => setActiveTool('Document Scanner')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-emerald-500 text-3xl mb-4 group-hover:scale-110 transition-transform">center_focus_strong</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Document Scanner</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Enhance and crop photos of physical documents.</p>
              </div>
              <div onClick={() => setActiveTool('Passport Photo')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-emerald-500 text-3xl mb-4 group-hover:scale-110 transition-transform">person</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Passport Photo</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Create a 4x6 sheet of passport photos for printing.</p>
              </div>
              <div onClick={() => setActiveTool('Image Compressor')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-emerald-500 text-3xl mb-4 group-hover:scale-110 transition-transform">photo_size_select_small</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Image Compressor</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Compress images to a specific file size.</p>
              </div>
            </div>
          </section>
        )}

        {(activeCategory === 'all' || activeCategory === 'shop') && (
          <section>
            <div className="flex items-center space-x-2 mb-6">
              <span className="material-symbols-outlined text-purple-500 text-2xl">build</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Shop Utilities</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div onClick={() => setActiveTool('Smart ID Print')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-purple-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-purple-500 text-3xl mb-4 group-hover:scale-110 transition-transform">badge</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Smart ID Print</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Auto-align ID cards (Aadhaar, PAN) for A4 printing.</p>
              </div>
              <div onClick={() => setActiveTool('QR Code Generator')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-purple-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-purple-500 text-3xl mb-4 group-hover:scale-110 transition-transform">qr_code_2</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">QR Generator</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Create custom, print-ready QR codes quickly.</p>
              </div>
              <div onClick={() => setActiveTool('Quick Receipt')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-purple-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-purple-500 text-3xl mb-4 group-hover:scale-110 transition-transform">receipt_long</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Quick Receipt</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Generate professional thermal receipts for shops.</p>
              </div>
              <div onClick={() => setActiveTool('CV Builder')} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 flex flex-col hover:border-purple-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs">
                <span className="material-symbols-outlined text-purple-500 text-3xl mb-4 group-hover:scale-110 transition-transform">contact_page</span>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">CV Builder</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Create professional CVs with 15 layout presets.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </ToolsLayout>
  );
}
