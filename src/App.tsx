/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Home } from './pages/Home';
import { ShopDashboard } from './pages/ShopDashboard';
import { ShopProfile } from './pages/ShopProfile';
import { Upload } from './pages/Upload';
import { Review } from './pages/Review';
import { Track } from './pages/Track';
import { Profile } from './pages/Profile';
import { ShopSetup } from './pages/ShopSetup';
import { Tools } from './pages/Tools';
import { OrderCoverPage } from './pages/OrderCoverPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { AboutUs } from './pages/AboutUs';
import { ContactUs } from './pages/ContactUs';
import { CookiePolicy } from './pages/CookiePolicy';
import { AcceptableUsePolicy } from './pages/AcceptableUsePolicy';
import { Disclaimer } from './pages/Disclaimer';
import { FAQ } from './pages/FAQ';
import { ShopPricing } from './pages/ShopPricing';
import { Pricing } from './pages/Pricing';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from './firebase';

import { LanguageSwitcher } from './components/LanguageSwitcher';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        const intendedRole = localStorage.getItem('intendedRole');
        if (intendedRole === 'shop') {
          localStorage.removeItem('intendedRole');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handlePartnerLogin = async () => {
    if (signingIn) return;
    setSigningIn(true);
    localStorage.setItem('intendedRole', 'shop');
    try {
      const u = await signInWithGoogle();
      if (u) {
        toast.success('Signed in to Partner Portal!');
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request'
      ) {
        toast.error(err?.message || 'Failed to sign in with Google');
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Router>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold tracking-tight text-indigo-600 flex items-center gap-2">
                <span className="bg-indigo-600 text-white p-1.5 rounded-lg text-sm font-black">PH</span> PrintHub
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/tools" className="text-sm font-medium text-slate-600 hover:text-indigo-600">PDF Tools</Link>
                <Link to="/pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Partner Plans</Link>
              </nav>
            </div>
            <nav className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link to="/tools" className="md:hidden text-sm font-medium text-slate-600 hover:text-indigo-600">Tools</Link>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link 
                    to="/dashboard" 
                    className="text-sm font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 px-3.5 py-1.5 rounded-lg hover:bg-indigo-100 transition"
                  >
                    Partner Dashboard
                  </Link>
                  <button 
                    onClick={() => logOut()}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 px-2 py-1.5 transition cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handlePartnerLogin}
                  disabled={signingIn}
                  className="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-500 transition shadow-sm shadow-indigo-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  {signingIn ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Shop Partner Login</span>
                  )}
                </button>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 relative z-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/shop/:shopId" element={<ShopProfile />} />
            <Route path="/shop/:shopId/upload" element={<Upload />} />
            <Route path="/shop/:shopId/review" element={<Review />} />
            <Route path="/track/:orderId" element={<Track />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/dashboard" element={<ShopDashboard user={user} authLoading={authLoading} />} />
            <Route path="/dashboard/setup" element={<ShopSetup user={user} authLoading={authLoading} />} />
            <Route path="/dashboard/pricing" element={<ShopPricing user={user} />} />
            <Route path="/pricing" element={<Pricing user={user} />} />
            <Route path="/subscription" element={<Pricing user={user} />} />
            <Route path="/shop-setup" element={<ShopSetup user={user} authLoading={authLoading} />} />
            <Route path="/order/:orderId/cover" element={<OrderCoverPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/aup" element={<AcceptableUsePolicy />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/faq" element={<FAQ />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-200 mt-auto py-6">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Print Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/pricing" className="text-slate-500 hover:text-indigo-600 text-sm font-semibold">Pricing</Link>
              <Link to="/privacy" className="text-slate-500 hover:text-indigo-600 text-sm">Privacy Policy</Link>
              <Link to="/about" className="text-slate-500 hover:text-indigo-600 text-sm">About Us</Link>
              <Link to="/contact" className="text-slate-500 hover:text-indigo-600 text-sm">Contact</Link>
              <Link to="/faq" className="text-slate-500 hover:text-indigo-600 text-sm">FAQ</Link>
              <Link to="/terms" className="text-slate-500 hover:text-indigo-600 text-sm">Terms & Conditions</Link>
              <Link to="/cookies" className="text-slate-500 hover:text-indigo-600 text-sm">Cookie Policy</Link>
              <Link to="/aup" className="text-slate-500 hover:text-indigo-600 text-sm">Acceptable Use</Link>
              <Link to="/disclaimer" className="text-slate-500 hover:text-indigo-600 text-sm">Disclaimer</Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

