import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { OrderFile, PrintOrder, PrintSettings, Shop, UserProfile } from '../types';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2, FileText, ArrowLeft, Eye, AlertCircle, Sparkles, CheckCircle2, QrCode } from 'lucide-react';
import { isShopCurrentlyOpen } from '../utils';
import { parseResponseJson } from '../utils/api';
import toast from 'react-hot-toast';
import { openRazorpayModal } from '../utils/razorpay';









export function Review() {
  const { shopId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planUsage, setPlanUsage] = useState<any>(null);
  const [limitReached, setLimitReached] = useState(false);

  type ReviewFile = {
    file: File;
    fileName: string;
    fileSize: number;
    fileType: string;
    pagesCount: number;
    settings: PrintSettings;
    price: number;
    fileUrl?: string;
    filePath?: string;
  };

  const state = location.state as { 
    uploadFiles: ReviewFile[];
    price: number;
  };

  useEffect(() => {
    async function loadData() {
      try {
        setError(null);
        if (auth.currentUser) {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
        }
        
        if (shopId && shopId !== 'demo-local-shop') {
          const shopDoc = await getDoc(doc(db, 'shops', shopId));
          if (shopDoc.exists()) {
            const shopData = { id: shopDoc.id, ...shopDoc.data() } as Shop;
            setShop(shopData);
            setIsShopOpen(isShopCurrentlyOpen(shopData));
          }

          // Check monthly order limit via backend validation API
          try {
            const planRes = await fetch(`/api/shops/${shopId}/plan-usage`);
            const contentType = planRes.headers.get('content-type') || '';
            if (planRes.ok && contentType.includes('application/json')) {
              const planJson = await planRes.json();
              if (planJson?.usage) {
                setPlanUsage(planJson.usage);
                if (planJson.usage.isLimitReached) {
                  setLimitReached(true);
                }
              }
            }
          } catch (e) {
            console.warn("Could not fetch shop plan usage:", e);
          }
        } else if (shopId === 'demo-local-shop') {
          setIsShopOpen(true);
        }
      } catch (err: any) {
        console.error("Error loading data in Review:", err);
        const errMsg = err?.message || String(err);
        const isOffline = errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('network') || errMsg.toLowerCase().includes('failed to get document') || errMsg.toLowerCase().includes('unavailable');
        setError(isOffline ? "Your network seems to be offline or the database is currently unreachable. You can still try to proceed, but operations requiring database access may fail." : errMsg);
      }
    }
    loadData();
  }, [shopId]);



  if (!state || !state.uploadFiles) {
    return <div className="p-8 text-center text-slate-500">Invalid order state. Please return to upload page.</div>;
  }

  
  const handleRazorpayPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const orderId = await createOrderAndUpload();
      if (!orderId) {
        setLoading(false);
        return;
      }

      // 1. Create Razorpay order on backend (uses shop's configured keys with safe fallback)
      const res = await fetch(`/api/shops/${shopId}/create-order-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: state.price,
          orderId
        })
      });

      const data = await parseResponseJson(res, 'Payment initiation failed');
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment gateway');
      }

      // 2. Open Razorpay Checkout modal
      const checkoutResult = await openRazorpayModal({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: data.shopName || shop?.name || 'PrintHub',
        description: `Print Order Payment (₹${state.price.toFixed(2)})`,
        order_id: data.orderId,
        notes: {
          orderId,
          shopId: shopId || ''
        },
        theme: {
          color: '#4f46e5'
        },
        handler: async (response) => {
          const verifyToast = toast.loading('Confirming payment...');
          try {
            const verifyRes = await fetch(`/api/shops/${shopId}/verify-order-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await parseResponseJson(verifyRes, 'Payment verification failed');
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Could not verify payment');
            }

            toast.success('🎉 Payment Complete! Your files are queued for printing.', { id: verifyToast });
            navigate(`/track/${orderId}`);
          } catch (vErr: any) {
            console.error('Customer payment verify error:', vErr);
            toast.error(`Verification note: ${vErr.message || 'Please check order tracking.'}`, { id: verifyToast });
            navigate(`/track/${orderId}`);
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment window closed. Order saved in queue. You can retry or pay at counter.', { icon: 'ℹ️' });
            setLoading(false);
          }
        }
      });

      if (!checkoutResult.success) {
        throw new Error(checkoutResult.error || 'Failed to open Razorpay modal');
      }
    } catch (e: any) {
      console.error('Razorpay payment error:', e);
      setError(e.message || 'Payment initiation failed');
      setLoading(false);
    }
  };

  const createOrderAndUpload = async () => {
    // 1. Strict backend plan limit validation check
    if (shopId && shopId !== 'demo-local-shop') {
      try {
        const valRes = await fetch('/api/orders/validate-shop-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopId })
        });
        const valData = await parseResponseJson(valRes, 'Shop order limit check failed');
        if (!valRes.ok || !valData.allowed) {
          setLimitReached(true);
          setPlanUsage(valData.usage);
          setError(valData.error || 'This shop has reached its monthly order limit. Please ask the shop to upgrade its subscription.');
          return null;
        }
      } catch (err: any) {
        console.warn("Backend order limit pre-check failed, continuing:", err);
      }
    }

    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    const customerId = auth.currentUser?.uid || 'guest_' + Math.random().toString(36).substring(2, 9);
    const orderData: any = {
      customerId,
      shopId,
      status: 'Waiting',
      price: state.price,
      token,
      createdAt: Date.now()
    };
    try {
      const orderRef = doc(collection(db, 'orders'));
      orderData.id = orderRef.id;
      
      const uploadedFiles = [];
      for (const uf of state.uploadFiles) {
        if (uf.file) {
          let uploadedUrl = '';
          let uploadedPath = '';
          
          const formData = new FormData();
          formData.append('file', uf.file);
          formData.append('orderId', orderRef.id);
          const apiRes = await fetch('/api/upload', { method: 'POST', body: formData });
          const apiData = await parseResponseJson(apiRes, `File upload failed for ${uf.fileName}`);
          uploadedUrl = apiData.url || `/uploads/${uf.file.name}`;
          uploadedPath = apiData.path || `uploads/${uf.file.name}`;

          uploadedFiles.push({ 
            ...uf, 
            fileUrl: uploadedUrl, 
            filePath: uploadedPath, 
            file: undefined 
          });
        } else {
          uploadedFiles.push(uf);
        }
      }
      orderData.files = uploadedFiles;
      orderData.settings = state.uploadFiles[0]?.settings || {};
      
      await setDoc(orderRef, orderData);
      localStorage.setItem('lastOrderId', orderRef.id);
      return orderRef.id;
    } catch (err: any) {
      console.error("createOrderAndUpload error:", err);
      setError(err.message || 'Failed to place order.');
      return null;
    }
  };

  const handlePayAtCounter = async () => {
    setLoading(true);
    setError(null);
    try {
      const orderId = await createOrderAndUpload();
      if (!orderId) {
        setLoading(false);
        return;
      }
      navigate(`/track/${orderId}`);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to place order');
      setLoading(false);
    }
  };

  const openPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button onClick={() => navigate(`/shop/${shopId}/upload`, { state: { uploadFiles: state.uploadFiles } })} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Upload
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Review Your Order</h1>
            <p className="text-slate-500">Please review your documents and print settings before payment.</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          
          {limitReached && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start justify-between gap-4 animate-fade-in shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-900 text-base">Monthly Order Limit Reached</h4>
                  <p className="text-sm text-rose-700 mt-1 leading-relaxed">
                    This shop has reached its monthly limit of <strong>{planUsage?.orderLimit} orders</strong> on the <strong>{planUsage?.planName} Plan</strong> ({planUsage?.ordersUsed} / {planUsage?.orderLimit} used).
                  </p>
                  <p className="text-xs text-rose-600 mt-2 font-medium">
                    ✓ Your uploaded documents and print settings are completely safe. The shop needs to upgrade their plan to continue accepting orders.
                  </p>
                </div>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <Link
                  to="/pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  <Sparkles className="w-4 h-4" /> Upgrade Shop Plan
                </Link>
              </div>
            </div>
          )}

          {error && !limitReached && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">Connection Note</h4>
                <p className="text-sm text-amber-700 mt-1">
                  {error}
                </p>
              </div>
            </div>
          )}

          {!isShopOpen && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">The shop is closed right now.</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Your files will be saved in the queue. You can still pay and place the order. 
                  Printing will begin automatically when the shop opens.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Documents & Settings</h3>
            
            <div className="space-y-4">
              {state.uploadFiles.map((uf, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-indigo-50 p-2 rounded-lg shadow-sm text-indigo-600 shrink-0"><FileText className="w-5 h-5" /></div>
                      <div className="overflow-hidden">
                        <div className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-md">{uf.fileName}</div>
                        <div className="text-xs text-slate-500">{(uf.fileSize / 1024 / 1024).toFixed(2)} MB • {uf.pagesCount} {uf.pagesCount === 1 ? 'page' : 'pages'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <span className="font-bold text-slate-900">₹{uf.price.toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={() => navigate(`/shop/${shopId}/upload`, { state: { uploadFiles: state.uploadFiles } })}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                      >
                        Edit Settings
                      </button>
                      <button 
                        onClick={() => openPreview(uf.file)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" /> Preview
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Color:</span>
                        <span className="font-semibold text-slate-900">{uf.settings.color}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Orientation:</span>
                        <span className="font-semibold text-slate-900">{uf.settings.orientation}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Sides:</span>
                        <span className="font-semibold text-slate-900">{uf.settings.sides}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Pages:</span>
                        <span className="font-semibold text-slate-900">{uf.settings.pages}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Copies:</span>
                        <span className="font-semibold text-slate-900">{uf.settings.copies}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold px-2 py-0.5 rounded-md text-xs border ${
                          uf.settings.fitToPage !== false
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
                            : 'text-amber-700 bg-amber-50 border-amber-200/60'
                        }`}>
                          {uf.settings.fitToPage !== false ? 'Fit to Printable Area' : '100% Actual Size'}
                        </span>
                      </div>
                      {uf.settings.isIdCard && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-200/60">
                            🪪 ID Card Curved Corners
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 mt-8 flex flex-col items-end gap-6">
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-slate-500 font-medium">Order Total:</span>
              <span className="text-3xl font-black text-slate-900">₹{state.price.toFixed(2)}</span>
            </div>
            
            <div className="w-full flex flex-col sm:flex-row items-center justify-end gap-3">
              {limitReached ? (
                <>
                  <Link
                    to="/pricing"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold tracking-wide transition bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5" />
                    Upgrade Partner Plan
                  </Link>
                  <button 
                    disabled
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold tracking-wide transition bg-slate-200 text-slate-400 cursor-not-allowed"
                    title="This shop has reached its monthly order limit."
                  >
                    <CreditCard className="w-5 h-5" />
                    Order Limit Reached
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handlePayAtCounter}
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold tracking-wide transition border-2 border-slate-300 hover:border-slate-400 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer shadow-sm"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5 text-indigo-600" />}
                    Pay at Counter / Pick Up
                  </button>
                  <button 
                    onClick={() => handleRazorpayPayment()}
                    disabled={loading}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold tracking-wide transition cursor-pointer shadow-md ${
                      loading ? 'bg-indigo-400 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                    Pay Online via Razorpay (UPI / Cards)
                  </button>
                </>
              )}
            </div>

            <div className="w-full flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 mt-2 gap-2">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Instant Print-and-Go — No account or login required!
              </span>
              <span>Token will be generated immediately for pickup.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
