import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, signInWithGoogle } from '../firebase';
import { Shop, SubscriptionPlanId, PARTNER_PLANS } from '../types';
import toast from 'react-hot-toast';
import { openRazorpayModal } from '../utils/razorpay';
import { 
  Check, ArrowRight, Sparkles, Shield, Zap, HelpCircle, 
  Store, ChevronRight, AlertCircle, ArrowLeft, Settings, 
  Loader2, CheckCircle2, TrendingUp, Layers, Flame, CreditCard
} from 'lucide-react';

export function Pricing({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedPlan = searchParams.get('plan') as SubscriptionPlanId | null;

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  // Business Plus configurable price
  const [businessPlusPrice, setBusinessPlusPrice] = useState<number>(999);
  const [savingAdminPrice, setSavingAdminPrice] = useState(false);
  const [showAdminConfig, setShowAdminConfig] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const shopRef = doc(db, 'shops', user.uid);
    const unsub = onSnapshot(shopRef, (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Shop;
        setShop(data);
        if (data.businessPlusPrice || data.subscription?.customBusinessPlusPrice) {
          setBusinessPlusPrice(data.businessPlusPrice || data.subscription?.customBusinessPlusPrice || 999);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching shop for pricing:', err);
      handleFirestoreError(err, OperationType.GET, `shops/${user.uid}`);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const currentPlanId: SubscriptionPlanId = (shop?.plan || shop?.subscription?.plan || 'free').toLowerCase() as SubscriptionPlanId;

  const handleSelectPlan = async (planId: SubscriptionPlanId) => {
    if (!user) {
      localStorage.setItem('intendedRole', 'shop');
      try {
        const u = await signInWithGoogle();
        if (u) {
          toast.success('Signed in with Google! You can now choose your partner plan.');
        }
      } catch (e: any) {
        if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
          toast.error(e?.message || 'Partner Google sign-in failed');
        }
      }
      return;
    }

    if (!shop) {
      toast.error('Please complete shop setup before choosing a plan.');
      navigate('/shop-setup');
      return;
    }

    if (currentPlanId === planId) {
      toast.success(`You are already on the ${PARTNER_PLANS[planId].name} plan!`);
      return;
    }

    setUpgradingPlan(planId);

    // Free plan: Instant activation
    if (planId === 'free') {
      const toastId = toast.loading(`Activating ${PARTNER_PLANS[planId].name} Plan...`);
      try {
        const targetShopId = shop.id;
        const res = await fetch('/api/razorpay/create-subscription-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: 'free', shopId: targetShopId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to switch to free plan');

        await setDoc(doc(db, 'shops', targetShopId), {
          plan: 'free',
          subscription: {
            plan: 'free',
            periodStart: Date.now(),
            periodEnd: Date.now() + 365 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now(),
            status: 'active'
          }
        }, { merge: true });

        toast.success(`Active on Free Plan!`, { id: toastId });
        setTimeout(() => navigate('/dashboard'), 1000);
      } catch (err: any) {
        toast.error(`Error: ${err.message}`, { id: toastId });
      } finally {
        setUpgradingPlan(null);
      }
      return;
    }

    // Paid plans: Route through Razorpay to Platform Razorpay Account
    const toastId = toast.loading(`Initiating Razorpay checkout for ${PARTNER_PLANS[planId].name}...`);

    try {
      const targetShopId = shop.id;
      const orderRes = await fetch('/api/razorpay/create-subscription-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          shopId: targetShopId,
          customPrice: planId === 'business_plus' ? businessPlusPrice : undefined
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create Razorpay subscription order');
      }

      toast.dismiss(toastId);

      // Launch Razorpay Checkout Modal
      const checkoutResult = await openRazorpayModal({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'PrintHub Cloud Platform',
        description: `Subscription: ${PARTNER_PLANS[planId].name} Plan (₹${orderData.price}/mo)`,
        order_id: orderData.orderId,
        prefill: {
          name: shop.name || user.displayName || 'Print Shop Partner',
          email: user.email || undefined
        },
        theme: {
          color: '#4f46e5'
        },
        handler: async (response) => {
          const verifyToast = toast.loading('Verifying Razorpay payment signature...');
          try {
            const verifyRes = await fetch('/api/razorpay/verify-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                shopId: targetShopId,
                planId,
                customPrice: planId === 'business_plus' ? businessPlusPrice : undefined
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment signature verification failed');
            }

            // Sync with Firestore directly
            await setDoc(doc(db, 'shops', targetShopId), {
              plan: planId,
              subscription: {
                plan: planId,
                periodStart: Date.now(),
                periodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
                updatedAt: Date.now(),
                status: 'active',
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id
              },
              ...(planId === 'business_plus' ? { businessPlusPrice: Number(businessPlusPrice) } : {})
            }, { merge: true });

            toast.success(`🎉 Payment Verified! You are now subscribed to ${PARTNER_PLANS[planId].name}!`, { id: verifyToast });
            setTimeout(() => {
              navigate('/dashboard');
            }, 1200);
          } catch (vErr: any) {
            console.error('Signature verification error:', vErr);
            toast.error(`Verification error: ${vErr.message || 'Please contact support.'}`, { id: verifyToast });
          } finally {
            setUpgradingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            toast('Razorpay payment window closed. No charges were made.', { icon: 'ℹ️' });
            setUpgradingPlan(null);
          }
        }
      });

      if (!checkoutResult.success) {
        throw new Error(checkoutResult.error || 'Could not open Razorpay checkout modal');
      }

    } catch (err: any) {
      console.error('Razorpay subscription error:', err);
      toast.error(`Checkout failed: ${err.message || 'Please try again'}`, { id: toastId });
      setUpgradingPlan(null);
    }
  };

  const handleSaveAdminBusinessPlusPrice = async () => {
    if (!shop && !user) return;
    const targetShopId = shop?.id || user?.uid;
    if (!targetShopId) return;
    setSavingAdminPrice(true);
    try {
      await setDoc(doc(db, 'shops', targetShopId), {
        businessPlusPrice: Number(businessPlusPrice)
      }, { merge: true });

      try {
        await fetch(`/api/shops/${targetShopId}/settings/business-plus-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: businessPlusPrice })
        });
      } catch (_) {}

      toast.success(`Business Plus rate set to ₹${businessPlusPrice}/month!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update price');
    } finally {
      setSavingAdminPrice(false);
    }
  };

  return (
    <div className="space-y-12 pb-16 animate-fade-in max-w-6xl mx-auto">
      {/* Back to Dashboard Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        {shop && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Active Shop:</span>
            <span className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {shop.name}
            </span>
          </div>
        )}
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Transparent Plans for Print Shop Partners
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
          Simple, Predictable Plans for Every Print Business
        </h1>
        <p className="text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          From local neighborhood photocopy counters to enterprise commercial printing centers. Start for free and upgrade as your monthly order volume expands.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-xs text-indigo-700 font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-600" /> Routed Securely via Razorpay
          </span>
          <span className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-xs text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Instant Activation
          </span>
          <span className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-xs text-slate-700">
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> UPI, Cards, NetBanking & Wallets
          </span>
        </div>
      </div>

      {/* Recommended Upgrade Path Visualization */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-slate-200 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-400">RECOMMENDED UPGRADE PATH</span>
            <h3 className="text-lg font-bold text-white">Grow Seamlessly With Your Customer Demand</h3>
          </div>
          <span className="text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-full w-fit border border-white/10">
            Automatic Monthly Counter Resets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Free Step */}
          <div className={`p-4 rounded-2xl border transition-all ${
            currentPlanId === 'free' 
              ? 'bg-indigo-600/30 border-indigo-400 shadow-md ring-1 ring-indigo-400' 
              : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
              <span>Step 1</span>
              <span className="text-indigo-400 font-extrabold">₹0</span>
            </div>
            <h4 className="text-base font-extrabold text-white">FREE</h4>
            <p className="text-xs text-indigo-200 mt-0.5">10 orders/month</p>
            <p className="text-[11px] text-slate-400 mt-2">Test out QR ordering and basic cloud features.</p>
          </div>

          {/* Starter Step */}
          <div className={`p-4 rounded-2xl border transition-all ${
            currentPlanId === 'starter' 
              ? 'bg-indigo-600/30 border-indigo-400 shadow-md ring-1 ring-indigo-400' 
              : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
              <span>Step 2</span>
              <span className="text-indigo-400 font-extrabold">₹99</span>
            </div>
            <h4 className="text-base font-extrabold text-white">STARTER</h4>
            <p className="text-xs text-indigo-200 mt-0.5">200 orders/month</p>
            <p className="text-[11px] text-slate-400 mt-2">Neighborhood shops needing desktop auto-printing.</p>
          </div>

          {/* Business Step */}
          <div className={`p-4 rounded-2xl border transition-all ${
            currentPlanId === 'business' 
              ? 'bg-indigo-600/30 border-indigo-400 shadow-md ring-1 ring-indigo-400' 
              : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
              <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded">RECOMMENDED</span>
              <span className="text-indigo-400 font-extrabold">₹499</span>
            </div>
            <h4 className="text-base font-extrabold text-white">BUSINESS</h4>
            <p className="text-xs text-indigo-200 mt-0.5">1,000 orders/month</p>
            <p className="text-[11px] text-slate-400 mt-2">High-demand campus & commercial operations.</p>
          </div>

          {/* Business Plus Step */}
          <div className={`p-4 rounded-2xl border transition-all ${
            currentPlanId === 'business_plus' 
              ? 'bg-indigo-600/30 border-indigo-400 shadow-md ring-1 ring-indigo-400' 
              : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
              <span>Step 4</span>
              <span className="text-indigo-400 font-extrabold">₹{businessPlusPrice}</span>
            </div>
            <h4 className="text-base font-extrabold text-white">BUSINESS PLUS</h4>
            <p className="text-xs text-indigo-200 mt-0.5">1,000+ orders / High-Volume</p>
            <p className="text-[11px] text-slate-400 mt-2">Unlimited volume for printing factories & enterprise hubs.</p>
          </div>
        </div>
      </div>

      {/* The 4 Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* 1. FREE PLAN */}
        <div className={`bg-white rounded-3xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 shadow-sm relative ${
          currentPlanId === 'free' 
            ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-md' 
            : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md'
        }`}>
          {currentPlanId === 'free' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
              Current Active Plan
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">FREE</span>
            </div>
            <div className="mb-4">
              <span className="text-3xl sm:text-4xl font-black text-slate-950">₹0</span>
              <span className="text-slate-400 font-bold text-xs">/month</span>
            </div>
            <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 mb-6">
              <span className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">Capacity</span>
              <span className="text-sm font-bold text-indigo-700">10 orders / month</span>
              <p className="text-[11px] text-slate-500 mt-1">Essential basic PrintHub features to receive and fulfill orders.</p>
            </div>

            <div className="space-y-3 mb-8">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">Included Features:</span>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Up to <strong>10 orders</strong> per billing month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Instant QR Code customer order portal</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Essential basic PrintHub tools & uploads</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Standard customer pickup queue & cover sheets</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Real-time dashboard notifications</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            {currentPlanId === 'free' ? (
              <button 
                disabled 
                className="w-full bg-slate-100 text-slate-500 font-bold py-3.5 rounded-2xl text-xs cursor-default flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-500" /> Current Plan
              </button>
            ) : (
              <button 
                onClick={() => handleSelectPlan('free')}
                disabled={upgradingPlan !== null}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 rounded-2xl text-xs transition cursor-pointer active:scale-[0.99]"
              >
                Downgrade to Free
              </button>
            )}
            <p className="text-[10px] text-slate-400 text-center mt-2.5">Monthly limit strictly applies at 10 orders.</p>
          </div>
        </div>

        {/* 2. STARTER PLAN */}
        <div className={`bg-white rounded-3xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 shadow-sm relative ${
          currentPlanId === 'starter' 
            ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-md' 
            : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
        }`}>
          {currentPlanId === 'starter' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
              Current Active Plan
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600">STARTER</span>
              <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Step 2</span>
            </div>
            <div className="mb-4">
              <span className="text-3xl sm:text-4xl font-black text-slate-950">₹99</span>
              <span className="text-slate-400 font-bold text-xs">/month</span>
            </div>
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 mb-6">
              <span className="block text-[11px] font-extrabold text-indigo-900 uppercase tracking-wide">Capacity</span>
              <span className="text-sm font-bold text-indigo-700">200 orders / month</span>
              <p className="text-[11px] text-slate-600 mt-1">Ideal for active neighborhood stationery & photocopy shops.</p>
            </div>

            <div className="space-y-3 mb-8">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">Everything in Free, plus:</span>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Up to <strong>200 orders</strong> per billing month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>PrintBridge Desktop Companion</strong> for Windows & Mac</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Custom print rates & range volume discounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>One-click auto-printing for incoming paid jobs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Local customer search discovery & map listing</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            {currentPlanId === 'starter' ? (
              <button 
                disabled 
                className="w-full bg-slate-100 text-slate-500 font-bold py-3.5 rounded-2xl text-xs cursor-default flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-500" /> Current Plan
              </button>
            ) : (
              <button 
                onClick={() => handleSelectPlan('starter')}
                disabled={upgradingPlan !== null}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-xs transition cursor-pointer shadow-md shadow-indigo-150 active:scale-[0.99]"
              >
                {upgradingPlan === 'starter' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Upgrade to Starter'}
              </button>
            )}
            <p className="text-[10px] text-slate-400 text-center mt-2.5">Clear usage tracking up to 200 orders.</p>
          </div>
        </div>

        {/* 3. BUSINESS PLAN (POPULAR) */}
        <div className={`bg-white rounded-3xl border-2 p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 shadow-xl shadow-indigo-100/50 relative ${
          currentPlanId === 'business' 
            ? 'border-indigo-600 ring-2 ring-indigo-600/30' 
            : 'border-indigo-500 hover:shadow-2xl'
        }`}>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
            <Flame className="w-3 h-3 fill-amber-300" /> MOST POPULAR
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 mt-1">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700">BUSINESS</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full border border-amber-200">Step 3</span>
            </div>
            <div className="mb-4">
              <span className="text-3xl sm:text-4xl font-black text-slate-950">₹499</span>
              <span className="text-slate-400 font-bold text-xs">/month</span>
            </div>
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 mb-6">
              <span className="block text-[11px] font-extrabold text-amber-950 uppercase tracking-wide">Capacity</span>
              <span className="text-sm font-bold text-amber-900">1,000 orders / month</span>
              <p className="text-[11px] text-amber-800 mt-1">For high-traffic campus counters & commercial print hubs.</p>
            </div>

            <div className="space-y-3 mb-8">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">Everything in Starter, plus:</span>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Up to <strong>1,000 orders</strong> per billing month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Multi-printer hardware routing</strong> (B&W / Color)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>PhonePe direct merchant settlement integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Comprehensive daily revenue & job volume analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>30-day extended cloud backup retention</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Priority WhatsApp & partner tech support</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            {currentPlanId === 'business' ? (
              <button 
                disabled 
                className="w-full bg-slate-100 text-slate-500 font-bold py-3.5 rounded-2xl text-xs cursor-default flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-500" /> Current Plan
              </button>
            ) : (
              <button 
                onClick={() => handleSelectPlan('business')}
                disabled={upgradingPlan !== null}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black py-3.5 rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-indigo-200 active:scale-[0.99]"
              >
                {upgradingPlan === 'business' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Upgrade to Business'}
              </button>
            )}
            <p className="text-[10px] text-slate-400 text-center mt-2.5">Recommended choice for 85% of active print shops.</p>
          </div>
        </div>

        {/* 4. BUSINESS PLUS PLAN */}
        <div className={`bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 shadow-xl relative ${
          currentPlanId === 'business_plus' 
            ? 'ring-2 ring-emerald-500 shadow-emerald-950/40' 
            : 'hover:border-slate-700'
        }`}>
          {currentPlanId === 'business_plus' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
              Current Active Plan
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">BUSINESS PLUS</span>
              <span className="text-[10px] bg-white/10 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-white/10">Step 4</span>
            </div>
            <div className="mb-4">
              <span className="text-3xl sm:text-4xl font-black text-white">₹{businessPlusPrice}</span>
              <span className="text-slate-400 font-bold text-xs">/month</span>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 mb-6">
              <span className="block text-[11px] font-extrabold text-emerald-300 uppercase tracking-wide">Capacity</span>
              <span className="text-sm font-bold text-white">1,000+ orders / High-Volume</span>
              <p className="text-[11px] text-slate-300 mt-1">No fixed hard limit. Designed for high-volume enterprise print factories.</p>
            </div>

            <div className="space-y-3 mb-8">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">Enterprise High-Volume Capabilities:</span>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 -mx-2 px-2 py-1.5 rounded-lg border border-amber-500/30">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-amber-200"><strong>✨ AI Studio Passport & Suit Maker</strong> (Exclusive)</span>
                </li>
                <li className="flex items-start gap-2 text-amber-100/90">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Auto AI Suits, Blazers, Collared Shirts, Doctor Coats & Kurtas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>1,000+ orders capacity</strong> (Effectively Unlimited)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Multi-station simultaneous shop operator processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Bulk batch PDF compile engine & instant export</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Dedicated enterprise queue performance SLA</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Direct VIP technical onboarding & custom setup</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            {currentPlanId === 'business_plus' ? (
              <button 
                disabled 
                className="w-full bg-white/10 text-emerald-300 font-bold py-3.5 rounded-2xl text-xs cursor-default flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Current Plan
              </button>
            ) : (
              <button 
                onClick={() => handleSelectPlan('business_plus')}
                disabled={upgradingPlan !== null}
                className="w-full bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black py-3.5 rounded-2xl text-xs transition cursor-pointer shadow-md shadow-emerald-950/60 active:scale-[0.99]"
              >
                {upgradingPlan === 'business_plus' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Upgrade to Business Plus'}
              </button>
            )}
            <p className="text-[10px] text-slate-400 text-center mt-2.5">Zero order limits for high-volume operations.</p>
          </div>
        </div>

      </div>

      {/* Admin Settings to Configure Business Plus Price */}
      {shop && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100/60 text-indigo-600 rounded-2xl shadow-xs shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Partner & Admin Plan Configuration</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure custom tier rates and billing preferences for your shop</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAdminConfig(!showAdminConfig)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/70 border border-indigo-200/60 px-4 py-2 rounded-xl transition cursor-pointer self-start sm:self-auto shadow-xs active:scale-[0.98]"
            >
              {showAdminConfig ? 'Hide Settings' : 'Configure Business Plus Price'}
            </button>
          </div>

          {showAdminConfig && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
              <div className="max-w-md">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Business Plus Monthly Subscription Rate (₹)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                    <input 
                      type="number"
                      min="0"
                      step="50"
                      value={businessPlusPrice}
                      onChange={(e) => setBusinessPlusPrice(Number(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-3 focus:ring-indigo-500/15 focus:border-indigo-500 transition shadow-xs"
                    />
                  </div>
                  <button
                    onClick={handleSaveAdminBusinessPlusPrice}
                    disabled={savingAdminPrice}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm active:scale-[0.98]"
                  >
                    {savingAdminPrice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Rate</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  Allows custom enterprise pricing to be configured for your store or network.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plan Feature Comparison Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs overflow-hidden">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-600 mb-2">
            Detailed Breakdown
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Feature Comparison</h3>
          <p className="text-xs text-slate-500 mt-1">Everything you need to know about what's included in each plan tier.</p>
        </div>

        <div className="overflow-x-auto -mx-6 sm:mx-0">
          <table className="w-full text-left border-collapse text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200/90 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 bg-slate-50/60 rounded-tl-xl">Feature</th>
                <th className="py-3.5 px-4 text-center bg-slate-50/60">Free (₹0)</th>
                <th className="py-3.5 px-4 text-center bg-slate-50/60">Starter (₹99)</th>
                <th className="py-3.5 px-4 text-center text-indigo-700 bg-indigo-50/80 border-t border-x border-indigo-200/80 rounded-t-xl font-black">Business (₹499)</th>
                <th className="py-3.5 px-4 text-center bg-slate-50/60 rounded-tr-xl">Business Plus (₹{businessPlusPrice})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">Monthly Order Limit</td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-600">10 orders</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600">200 orders</td>
                <td className="py-3.5 px-4 text-center font-extrabold text-indigo-700 bg-indigo-50/40 border-x border-indigo-100/60">1,000 orders</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">1,000+ (High-Volume)</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-800">PrintBridge Desktop Companion</td>
                <td className="py-3.5 px-4 text-center text-slate-300 font-bold">—</td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center bg-indigo-50/40 border-x border-indigo-100/60"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-800">Custom Pricing & Range Discounts</td>
                <td className="py-3.5 px-4 text-center text-slate-500 font-medium">Standard</td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center bg-indigo-50/40 border-x border-indigo-100/60"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-800">Auto-Print on Paid Orders</td>
                <td className="py-3.5 px-4 text-center text-slate-300 font-bold">—</td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center bg-indigo-50/40 border-x border-indigo-100/60"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-800">Multi-Printer Hardware Routing</td>
                <td className="py-3.5 px-4 text-center text-slate-300 font-bold">—</td>
                <td className="py-3.5 px-4 text-center text-slate-300 font-bold">—</td>
                <td className="py-3.5 px-4 text-center bg-indigo-50/40 border-x border-indigo-100/60"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-800">PhonePe Merchant Direct Payout</td>
                <td className="py-3.5 px-4 text-center text-slate-300 font-bold">—</td>
                <td className="py-3.5 px-4 text-center text-slate-300 font-bold">—</td>
                <td className="py-3.5 px-4 text-center bg-indigo-50/40 border-x border-indigo-100/60"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-800">Real-Time Revenue Analytics</td>
                <td className="py-3.5 px-4 text-center text-slate-500 font-medium">Basic</td>
                <td className="py-3.5 px-4 text-center text-slate-500 font-medium">Basic</td>
                <td className="py-3.5 px-4 text-center bg-indigo-50/40 border-x border-indigo-100/60"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-800">Multi-Counter Staff Access</td>
                <td className="py-3.5 px-4 text-center text-slate-300 font-bold">—</td>
                <td className="py-3.5 px-4 text-center text-slate-300 font-bold">—</td>
                <td className="py-3.5 px-4 text-center bg-indigo-50/40 border-x border-indigo-100/60 text-slate-300 font-bold">—</td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
              <tr className="bg-gradient-to-r from-amber-50/60 via-amber-50/30 to-amber-50/60 hover:from-amber-50/80 transition-colors">
                <td className="py-3.5 px-4 font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  AI Studio Passport & Suit Maker
                </td>
                <td className="py-3.5 px-4 text-center text-slate-300 font-bold">—</td>
                <td className="py-3.5 px-4 text-center text-slate-300 font-bold">—</td>
                <td className="py-3.5 px-4 text-center bg-indigo-50/40 border-x border-indigo-100/60 text-slate-300 font-bold">—</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1 bg-amber-100/90 text-amber-900 border border-amber-300/80 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                    <Check className="w-3 h-3 text-amber-700" /> Exclusive
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-800">Automatic Monthly Reset</td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center bg-indigo-50/40 border-x border-indigo-100/60 border-b border-indigo-200/80 rounded-b-xl"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                <td className="py-3.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-gradient-to-b from-slate-50 to-slate-100/60 border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 text-[11px] font-bold text-slate-600 mb-2 shadow-xs">
            Got Questions?
          </div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <HelpCircle className="w-5 h-5 text-indigo-600" /> Frequently Asked Questions
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <h4 className="font-bold text-slate-900 mb-1.5 text-sm tracking-tight">What happens when my shop hits its monthly limit?</h4>
            <p className="leading-relaxed text-slate-600">
              When a Free (10), Starter (200), or Business (1,000) shop hits its limit, customers will be informed that the shop is at capacity, and you will see a clear upgrade prompt. No data is lost, and you can instantly upgrade to continue receiving orders.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <h4 className="font-bold text-slate-900 mb-1.5 text-sm tracking-tight">When does my order counter reset?</h4>
            <p className="leading-relaxed text-slate-600">
              Order counters reset automatically at the start of each monthly billing period. Cancelled and rejected orders are automatically excluded from your billable count.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <h4 className="font-bold text-slate-900 mb-1.5 text-sm tracking-tight">Can I upgrade or downgrade anytime?</h4>
            <p className="leading-relaxed text-slate-600">
              Yes! You can upgrade your plan at any point in the billing cycle. Your order capacity will update instantly on your dashboard and live customer queue.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <h4 className="font-bold text-slate-900 mb-1.5 text-sm tracking-tight">How does the Business Plus plan work?</h4>
            <p className="leading-relaxed text-slate-600">
              Business Plus is built specifically for high-volume printing operations processing 1,000+ orders. It has no fixed hard ceiling, so your shop never runs into order blocks during peak seasons.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
