import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Shop } from '../types';
import { MapPin, Clock, Star, FileUp, Loader2, Phone, CheckCircle2, FileText, Zap } from 'lucide-react';
import { isShopCurrentlyOpen } from '../utils';

export function ShopProfile() {
  const { shopId } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpenNow, setIsOpenNow] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          phone: '+91 98765 43210',
          openingHours: { open: '09:00', close: '21:00' },
          services: ['Color Printing', 'Black & White Printing', 'Binding', 'Lamination'],
        });
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'shops', shopId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const shopData = { id: docSnap.id, ...docSnap.data() } as Shop;
          setShop(shopData);
          setIsOpenNow(isShopCurrentlyOpen(shopData));
        } else {
          setError('Shop not found.');
        }
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Failed to load shop details.');
        try {
          handleFirestoreError(e, OperationType.GET, `shops/${shopId}`);
        } catch (fErr) {
          console.error("Firestore error logged:", fErr);
        }
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, [shopId]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>;
  
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
        <Link 
          to="/" 
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow inline-block text-center"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const mockEstimatedWait = shop.rating && shop.rating > 4.5 ? '10-15 mins' : '20-30 mins';

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Cover Photo area */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 w-full relative overflow-hidden">
          {shop.coverImage ? (
            <img src={shop.coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-15"></div>
          )}
        </div>

        <div className="px-6 sm:px-8 pb-8 text-center relative -mt-12 sm:-mt-14">
          {/* Logo */}
          <div className="w-24 h-24 bg-white border-4 border-white text-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black mb-4 shadow-md z-10 relative overflow-hidden ring-1 ring-slate-200/80">
            {shop.logo ? (
              <img src={shop.logo} alt="Logo" className="w-full h-full object-contain bg-white" />
            ) : (
              <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                {shop.name.charAt(0)}
              </div>
            )}
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight text-slate-900 notranslate" translate="no">{shop.name}</h1>
          <p className="text-slate-500 text-xs sm:text-sm flex items-center justify-center gap-1.5 mb-5 notranslate" translate="no">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {shop.address}
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-700 mb-8 bg-slate-50/80 py-3 px-4 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-current" /> {shop.rating || '4.0'} Rating</div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center gap-1.5">
              {isOpenNow ? <span className="flex items-center gap-1.5 text-emerald-600 font-bold"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Open Now</span> : <span className="flex items-center gap-1.5 text-red-600 font-bold"><div className="w-2 h-2 rounded-full bg-red-500"></div> Closed</span>}
            </div>
            {shop.phone && (
              <>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> {shop.phone}</div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-left">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Shop Timings & Info
                </h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span>Working Hours:</span>
                    <span className="font-semibold">{shop.openingHours ? `${shop.openingHours.open} - ${shop.openingHours.close}` : '09:00 - 21:00'}</span>
                  </div>
                  {shop.workingDays && shop.workingDays.length > 0 && (
                  <div className="flex justify-between mt-1 border-t border-slate-100 pt-2">
                    <span>Days Open:</span>
                    <span className="font-semibold text-right max-w-[150px]">{shop.workingDays.join(', ')}</span>
                  </div>
                  )}
                  {shop.mapLink && (
                  <div className="mt-4">
                    <a href={shop.mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition">
                      <MapPin className="w-4 h-4" /> View on Google Maps
                    </a>
                  </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Supported Paper Sizes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['A4', 'A3', 'Legal', 'Letter'].map(size => (
                    <span key={size} className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded text-xs font-semibold">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {shop.services && shop.services.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Services Offered
                </h3>
                <div className="space-y-2">
                  {shop.services.map(svc => (
                    <div key={svc} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> {svc}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-8 mt-8">
            <Link 
              to={`/shop/${shopId}/upload`} 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-8 py-3.5 rounded-xl font-bold tracking-wide transition shadow-sm shadow-indigo-600/25 hover:shadow-md hover:shadow-indigo-600/30 text-sm"
            >
              <FileUp className="w-5 h-5" /> Start Print Order
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Star className="w-5 h-5 text-indigo-600" /> Customer Reviews</h2>
        <div className="space-y-6">
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">A</div>
              <div>
                <p className="font-semibold text-sm">Arun Kumar</p>
                <div className="flex text-amber-400">
                  <Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" />
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600">Super fast printing and great paper quality. The owner was very helpful.</p>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">S</div>
              <div>
                <p className="font-semibold text-sm">Sneha P.</p>
                <div className="flex text-amber-400">
                  <Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 text-slate-300" />
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600">Good service, though I had to wait a few minutes extra. Will use again.</p>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition">Write a Review</button>
        </div>
      </div>
    </div>
  );
}
