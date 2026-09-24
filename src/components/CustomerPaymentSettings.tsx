import React, { useState, useEffect } from 'react';
import { Shop } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { 
  CreditCard, ShieldCheck, CheckCircle2, AlertCircle, 
  Eye, EyeOff, Sparkles, HelpCircle, ExternalLink, 
  QrCode, Banknote, Loader2, Check, RefreshCw
} from 'lucide-react';

interface CustomerPaymentSettingsProps {
  shop: Shop | null;
  shopId: string;
  onUpdate?: () => void;
}

export function CustomerPaymentSettings({ shop, shopId, onUpdate }: CustomerPaymentSettingsProps) {
  const [razorpayEnabled, setRazorpayEnabled] = useState<boolean>(true);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [upiEnabled, setUpiEnabled] = useState<boolean>(false);
  const [upiId, setUpiId] = useState<string>('');
  const [cashOnCounterEnabled, setCashOnCounterEnabled] = useState<boolean>(true);

  const [saving, setSaving] = useState<boolean>(false);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);

  useEffect(() => {
    if (shop) {
      setRazorpayEnabled(shop.razorpayEnabled !== false);
      setRazorpayKeyId(shop.razorpayKeyId || '');
      setRazorpayKeySecret(shop.razorpayKeySecret || '');
      setUpiEnabled(shop.upiEnabled || false);
      setUpiId(shop.upiId || '');
      setCashOnCounterEnabled(shop.cashOnCounterEnabled !== false);
    }
  }, [shop]);

  const handleTestConnection = async () => {
    const key = razorpayKeyId.trim();
    const secret = razorpayKeySecret.trim();

    if (!key || !secret) {
      toast.error('Please enter both your Razorpay Key ID and Key Secret to test.');
      return;
    }

    setTestingConnection(true);
    setTestResult({ status: 'idle' });
    const toastId = toast.loading('Testing connection with Razorpay API...');

    try {
      const res = await fetch(`/api/shops/${shopId}/test-razorpay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId: key, keySecret: secret })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          status: 'success',
          message: data.message || 'Razorpay keys verified successfully! Live API connection confirmed.'
        });
        toast.success('✓ Razorpay API verified successfully!', { id: toastId });
      } else {
        setTestResult({
          status: 'error',
          message: data.error || 'Authentication failed. Please verify your Key ID and Secret.'
        });
        toast.error(`✕ Razorpay Error: ${data.error || 'Invalid credentials'}`, { id: toastId });
      }
    } catch (err: any) {
      console.error('Test connection error:', err);
      setTestResult({
        status: 'error',
        message: err.message || 'Network connection failed.'
      });
      toast.error(`Connection test failed: ${err.message}`, { id: toastId });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    const toastId = toast.loading('Saving payment settings...');

    try {
      const updateData: any = {
        razorpayEnabled,
        razorpayKeyId: razorpayKeyId.trim(),
        upiEnabled,
        upiId: upiId.trim(),
        cashOnCounterEnabled
      };

      if (razorpayKeySecret.trim() && !razorpayKeySecret.includes('••••')) {
        updateData.razorpayKeySecret = razorpayKeySecret.trim();
      }

      // 1. Authoritative write to Firestore
      await setDoc(doc(db, 'shops', shopId), updateData, { merge: true });

      // 2. Sync with backend
      try {
        await fetch(`/api/shops/${shopId}/payment-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
      } catch (beErr) {
        console.warn('Backend sync notice (non-fatal):', beErr);
      }

      toast.success('Payment settings saved successfully!', { id: toastId });
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Save payment settings error:', err);
      toast.error(`Failed to save: ${err.message || 'Please try again'}`, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const isTestModeKey = razorpayKeyId.trim().startsWith('rzp_test');
  const isLiveModeKey = razorpayKeyId.trim().startsWith('rzp_live');

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-sm border border-indigo-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Direct Merchant Settlement
            </div>
            <h2 className="text-xl font-black tracking-tight">Customer Payment Settings</h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Connect your Razorpay account so print customers pay directly to your merchant account with <strong>0 platform commission</strong>. Supported: UPI, GPay, PhonePe, Paytm, Debit/Credit Cards & NetBanking.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Payment Settings
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Razorpay Gateway Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                  ₹
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Razorpay Payment Gateway</h3>
                  <p className="text-xs text-slate-500">Accept customer payments via UPI, Credit/Debit cards & Wallets</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={razorpayEnabled}
                  onChange={(e) => setRazorpayEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Status Indicator Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  razorpayKeyId ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-amber-400'
                }`} />
                <span className="font-semibold text-slate-700">
                  Status: {razorpayKeyId ? (razorpayEnabled ? 'Active & Ready' : 'Disabled by Owner') : 'Not Configured (Using Platform Safe Fallback)'}
                </span>
              </div>
              {isTestModeKey && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  🧪 Test Mode (rzp_test)
                </span>
              )}
              {isLiveModeKey && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ⚡ Live Mode (rzp_live)
                </span>
              )}
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razorpay Key ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={razorpayKeyId}
                  onChange={(e) => {
                    setRazorpayKeyId(e.target.value);
                    setTestResult({ status: 'idle' });
                  }}
                  placeholder="e.g. rzp_test_... or rzp_live_..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Found in your Razorpay Dashboard &rarr; Settings &rarr; API Keys.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Razorpay Key Secret <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showSecret ? 'Hide Secret' : 'Show Secret'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={razorpayKeySecret}
                    onChange={(e) => {
                      setRazorpayKeySecret(e.target.value);
                      setTestResult({ status: 'idle' });
                    }}
                    placeholder="Enter your Razorpay Key Secret"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition pr-10"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  🔒 Kept strictly confidential and securely used on server for HMAC-SHA256 signature verification.
                </p>
              </div>

              {/* Test Button & Result Banner */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !razorpayKeyId.trim() || !razorpayKeySecret.trim()}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {testingConnection ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  ⚡ Test Razorpay Connection
                </button>

                {testResult.status === 'success' && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Connection Verified!</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        {testResult.message || 'Your Razorpay credentials are authenticated and valid. Customer orders will settle to your account.'}
                      </p>
                    </div>
                  </div>
                )}

                {testResult.status === 'error' && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Connection Failed</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        {testResult.message || 'Please check that you copied the correct Key ID and Key Secret without extra spaces.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Zero Crash Guarantee Callout */}
            <div className="bg-indigo-50/70 border border-indigo-150 rounded-xl p-3.5 text-xs text-indigo-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-950">Zero-Crash Payment Architecture:</span>
                <span className="text-[11px] text-indigo-800 block mt-0.5">
                  If your Razorpay keys are not yet added or invalid, the customer checkout automatically switches to safe sandbox mode or counter payment, preventing customer payment errors or lost sales.
                </span>
              </div>
            </div>
          </div>

          {/* Pay at Counter / Cash in Shop Toggle Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Pay at Counter (Cash / UPI at Shop)</h4>
                <p className="text-xs text-slate-500">Allow customers to order online and pay upon picking up their prints</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={cashOnCounterEnabled}
                onChange={(e) => setCashOnCounterEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Right Sidebar: Direct UPI & Quick Setup Guide */}
        <div className="space-y-6">
          {/* Direct UPI ID & QR Code */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Direct UPI ID & QR</h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={upiEnabled}
                  onChange={(e) => setUpiEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID (VPA)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourshop@okhdfcbank"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Google Pay, PhonePe, Paytm, or BHIM VPA</p>
            </div>

            {upiId.trim() ? (
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-center">
                <span className="text-[11px] font-bold text-slate-600">Counter QR Preview</span>
                <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-150">
                  <QRCodeSVG
                    value={`upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(shop?.name || 'Print Shop')}&cu=INR`}
                    size={120}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono break-all">{upiId}</span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Enter your UPI ID to preview your shop's payment QR code.
              </div>
            )}
          </div>

          {/* Quick Guide Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Need Help Getting Keys?
              </span>
              <button
                type="button"
                onClick={() => setShowHelpGuide(!showHelpGuide)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
              >
                {showHelpGuide ? 'Hide' : 'View Guide'}
              </button>
            </div>

            <ol className="text-xs text-slate-600 space-y-2.5 list-decimal list-inside leading-relaxed">
              <li>
                Sign in to your <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline inline-flex items-center gap-0.5">Razorpay Dashboard <ExternalLink className="w-2.5 h-2.5" /></a>.
              </li>
              <li>
                Click on <strong>Account & Settings</strong> in the left sidebar.
              </li>
              <li>
                Under <strong>API Keys</strong>, click <strong>Generate Key</strong>.
              </li>
              <li>
                Copy the <strong>Key ID</strong> and <strong>Key Secret</strong>.
              </li>
              <li>
                Paste them into the fields and click <strong>Test Razorpay Connection</strong>.
              </li>
            </ol>

            <div className="pt-2 border-t border-slate-200/80">
              <p className="text-[11px] text-slate-500">
                💡 For testing without real money, switch the toggle in top right of Razorpay Dashboard to <strong>Test Mode</strong> and generate a test key.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
