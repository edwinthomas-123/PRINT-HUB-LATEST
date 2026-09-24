import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Shop } from '../types';
import { Link } from 'react-router-dom';
import { MapPin, Printer, Search, FileText, Loader2, Map as MapIcon, List, QrCode, Camera, Laptop, Smartphone, DownloadCloud } from 'lucide-react';
import { MapLocator } from '../components/MapLocator';
import { QRScannerModal } from '../components/QRScannerModal';
import { DownloadAppModal } from '../components/DownloadAppModal';
import { isShopCurrentlyOpen } from '../utils';

export function Home() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  useEffect(() => {
    async function loadShops() {
      try {
        const querySnapshot = await getDocs(collection(db, 'shops'));
        const loadedShops: Shop[] = [];
        querySnapshot.forEach((doc) => {
          loadedShops.push({ id: doc.id, ...doc.data() } as Shop);
        });
        
        // Use a local fallback if empty for demo, rather than attempting to write to database
        if (loadedShops.length === 0) {
          loadedShops.push({
            id: 'demo-local-shop',
            name: 'Demo Print Shop',
            address: '123 Main Street',
            ownerId: 'demo',
            rating: 4.8,
            isOpen: true
          });
        }
        
        setShops(loadedShops);
      } catch (e) {
        console.error(e);
        handleFirestoreError(e, OperationType.LIST, 'shops');
      } finally {
        setLoading(false);
      }
    }
    loadShops();
  }, []);

  // Filter shops based on search query
  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Hero Section */}
      <section className="mt-2">
        <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 md:p-14 text-center shadow-xl border border-slate-800/80 relative overflow-hidden">
          {/* Background Pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-300">
              Print Anywhere. Pick Up Anywhere.
            </h1>
            <p className="text-sm md:text-base text-slate-300/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Upload your files, pay online, and skip the queue at your local print shop.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-lg mx-auto">
              <div className="relative w-full sm:w-auto flex-grow text-slate-900">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  className="w-full pl-10 pr-14 py-3 rounded-xl border border-slate-200/80 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-sm outline-none text-xs sm:text-sm bg-white placeholder:text-slate-400 transition-all" 
                  placeholder="Search for nearby shops by name or address..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button 
                onClick={() => setIsQRModalOpen(true)}
                className="w-full sm:w-auto font-bold text-xs px-5 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-500/20 whitespace-nowrap cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan QR to Print</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Shops (lg:col-span-2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="text-indigo-600 w-5 h-5" />
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Nearby Shops</h2>
            </div>
            <div className="bg-slate-100/90 rounded-xl p-1 flex shadow-xs border border-slate-200/70">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${viewMode === 'list' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${viewMode === 'map' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
              >
                <MapIcon className="w-3.5 h-3.5" /> Map
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[300px] shadow-xs">
              <Loader2 className="animate-spin text-indigo-600 w-8 h-8 mb-4" />
              <p className="text-sm font-medium text-slate-500">Locating print shops near you...</p>
            </div>
          ) : viewMode === 'list' ? (
            filteredShops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredShops.map((shop) => (
                  <Link to={`/shop/${shop.id}`} key={shop.id} className="block group">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors leading-tight notranslate" translate="no">{shop.name}</h3>
                          {isShopCurrentlyOpen(shop) ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Open
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">Closed</span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed notranslate" translate="no">{shop.address}</p>
                      </div>
                      <div className="flex items-center text-xs font-bold text-indigo-600 group-hover:text-indigo-700 group-hover:translate-x-1 transition-all mt-2">
                        <Printer className="w-3.5 h-3.5 mr-1.5" /> Order Print &rarr;
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[300px] text-center max-w-md mx-auto w-full shadow-xs">
                <Search className="w-10 h-10 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-800 text-base">No matching shops found</h3>
                <p className="text-slate-500 text-xs mt-1 px-4 leading-relaxed">Try searching with a different term, or use the QR Code scanner to connect directly.</p>
              </div>
            )
          ) : (
            <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs">
              <MapLocator shops={filteredShops} />
            </div>
          )}
        </div>

        {/* Right Column: Tools & Scan (lg:col-span-1) */}
        <div className="flex flex-col gap-6">
          {/* Document Tools Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:border-indigo-200 hover:shadow-sm transition-all duration-200 relative group">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600 w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Document Tools</h3>
              </div>
              <Link to="/tools" className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center transition-colors">
                View All &rarr;
              </Link>
            </div>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">
              Need to prepare your files before printing? We offer free tools to merge, split, and unlock password-protected PDFs.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <Link to="/tools" className="bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200/70 hover:border-indigo-300 rounded-xl p-3 text-center transition-all text-xs font-semibold text-slate-700 hover:text-indigo-700">
                Remove Password
              </Link>
              <Link to="/tools" className="bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200/70 hover:border-indigo-300 rounded-xl p-3 text-center transition-all text-xs font-semibold text-slate-700 hover:text-indigo-700">
                Merge PDF
              </Link>
              <Link to="/tools" className="bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200/70 hover:border-indigo-300 rounded-xl p-3 text-center transition-all text-xs font-semibold text-slate-700 hover:text-indigo-700">
                Split PDF
              </Link>
              <Link to="/tools" className="bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200/70 hover:border-indigo-300 rounded-xl p-3 text-center transition-all text-xs font-semibold text-slate-700 hover:text-indigo-700">
                Compress
              </Link>
            </div>
          </div>

          {/* Scan & Print Instantly Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/60 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-xs">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Scan &amp; Print Instantly</h3>
            </div>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed relative z-10">
              At the print shop right now? Scan the shop owner's printed QR code standee to connect instantly, upload your files, make a payment, and start printing immediately without searching.
            </p>
            <button 
              onClick={() => setIsQRModalOpen(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all shadow-sm relative z-10 text-xs cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Launch QR Scanner</span>
            </button>
          </div>
        </div>
      </section>

      {/* Premium Download the App Section */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-800/80 relative overflow-hidden mt-6">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-700/20 rounded-full blur-2xl"></div>
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center lg:text-left">
            <span className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-3 inline-block">
              PrintHub Portable Apps
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
              Take PrintHub with You
            </h2>
            <p className="text-slate-300/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              Install our dedicated standalone client on your Windows, Mac, or Android device. Enjoy lightning-fast startup, seamless local uploads, and native window views.
            </p>
          </div>
          
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold px-7 py-3.5 rounded-xl shadow-md hover:shadow-emerald-500/20 transition-all duration-150 flex items-center justify-center gap-2 text-xs cursor-pointer whitespace-nowrap self-center"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Download Desktop &amp; Mobile App</span>
          </button>
        </div>
      </section>

      {/* QR Code Scanner Modal */}
      <QRScannerModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
      />

      {/* App Download Modal */}
      <DownloadAppModal 
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
}

