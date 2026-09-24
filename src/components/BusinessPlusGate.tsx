import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { Shop, PARTNER_PLANS } from '../types';
import { signInWithGoogle } from '../firebase';
import toast from 'react-hot-toast';
import { 
  Sparkles, ArrowLeft, CheckCircle2, Crown, 
  Layers, Camera, Image, ShieldCheck, ArrowRight, Store 
} from 'lucide-react';

interface BusinessPlusGateProps {
  onBack: () => void;
  user: User | null;
  shop: Shop | null;
  onOpenFreePassport: () => void;
}

export function BusinessPlusGate({ onBack, user, shop, onOpenFreePassport }: BusinessPlusGateProps) {
  const navigate = useNavigate();
  const currentPlan = (shop?.plan || shop?.subscription?.plan || 'free').toLowerCase();
  const [signingIn, setSigningIn] = useState(false);

  const handlePartnerSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    localStorage.setItem('intendedRole', 'shop');
    try {
      const u = await signInWithGoogle();
      if (u) {
        toast.success('Signed in with Google!');
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request'
      ) {
        toast.error(err?.message || 'Sign in failed');
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm">
          <Crown className="w-3.5 h-3.5 fill-current" />
          Business Plus Tier Exclusive
        </span>
      </div>

      {/* Hero Showcase Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1 rounded-full text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            AI Studio Suit & Portrait Suite
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            AI Passport Photo & Formal Suit Studio
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            The AI Passport Image Maker is an exclusive studio tool built for <strong className="text-white">Business Plus partners</strong>. Turn raw customer phone selfies into studio-grade passport and visa photos with auto AI suits, blazers, and clean biometric backgrounds in seconds.
          </p>

          {/* Key Value Bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>AI Suit & Blazer Styling:</strong> Dark navy suit, charcoal blazer, crisp white shirt & doctor coat.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Official Biometric Backdrops:</strong> Studio Blue, Pure White, Off-White, Red, and Light Blue.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>1-Click Grid Generation:</strong> Seamlessly send photos into 4x6 / A4 printable grids.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>1,000+ High Volume Limit:</strong> Unlimited daily generation for walk-in studio clients.</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {user ? (
              <button 
                onClick={() => navigate('/pricing?plan=business_plus')}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition text-sm cursor-pointer"
              >
                <Crown className="w-4 h-4 fill-current" />
                <span>Upgrade to Business Plus (₹999/mo)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button 
                  onClick={handlePartnerSignIn}
                  disabled={signingIn}
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md transition text-sm cursor-pointer disabled:opacity-60"
                >
                  {signingIn ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-4 h-4" />
                      <span>Partner Sign In with Google</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => navigate('/pricing?plan=business_plus')}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-6 py-3.5 rounded-2xl transition text-sm cursor-pointer"
                >
                  <span>Explore Plan Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            <button 
              onClick={onOpenFreePassport}
              className="inline-flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-semibold px-5 py-3.5 rounded-2xl transition text-xs cursor-pointer"
            >
              <span>Use Free Grid Maker</span>
            </button>
          </div>

          {user && (
            <p className="text-[11px] text-slate-400">
              Logged in as partner • Your current tier: <span className="font-bold text-slate-200 uppercase">{currentPlan}</span>
            </p>
          )}
        </div>
      </div>

      {/* Free Alternative Comparison Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-bold text-slate-900">Looking for Free Standard Passport Grids?</h3>
          <p className="text-xs text-slate-500">
            Our standard <strong>Passport Photo Maker</strong> is 100% free for everyone to crop, arrange, and print 8-up or 12-up photo sheets on 4x6 photo paper.
          </p>
        </div>
        <button 
          onClick={onOpenFreePassport}
          className="shrink-0 font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-3 rounded-xl transition cursor-pointer"
        >
          Open Free Passport Photo Tool &rarr;
        </button>
      </div>
    </div>
  );
}
