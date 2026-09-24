import React, { useState, useEffect } from 'react';
import { 
  X, Printer, CheckCircle2, AlertCircle, Download, RefreshCw, 
  Terminal, Monitor, Laptop, Play, ShieldCheck, Copy, Check, ExternalLink, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PrintBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId?: string;
  shopName?: string;
  onPrintersImported?: (printers: Array<{ name: string; isDefault?: boolean }>) => void;
}

export function PrintBridgeModal({
  isOpen,
  onClose,
  shopId,
  shopName,
  onPrintersImported
}: PrintBridgeModalProps) {
  const [activeTab, setActiveTab] = useState<'windows' | 'macos'>('windows');
  const [checking, setChecking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [bridgeInfo, setBridgeInfo] = useState<any>(null);
  const [detectedPrinters, setDetectedPrinters] = useState<Array<{ name: string; isDefault?: boolean }>>([]);
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const checkConnection = async (isManual = false) => {
    if (isManual) setChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      
      const res = await fetch('http://127.0.0.1:1337/status', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        setIsConnected(true);
        setBridgeInfo(data);
        
        // Fetch printer list
        try {
          const pRes = await fetch('http://127.0.0.1:1337/printers');
          if (pRes.ok) {
            const pData = await pRes.json();
            if (pData.printers && Array.isArray(pData.printers)) {
              setDetectedPrinters(pData.printers);
            }
          }
        } catch (_) {}

        if (isManual) {
          toast.success("Print Bridge is connected and active on port 1337!", { icon: '🟢' });
        }
      } else {
        setIsConnected(false);
        if (isManual) toast.error("Bridge not responding on port 1337. Please launch Start-PrintBridge.bat");
      }
    } catch (e) {
      setIsConnected(false);
      if (isManual) {
        toast.error("Could not reach Print Bridge locally. Make sure it is running on this computer.", { id: 'bridge-offline' });
      }
    } finally {
      if (isManual) setChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkConnection(false);
      const interval = setInterval(() => checkConnection(false), 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleTestPrint = async () => {
    setIsTestPrinting(true);
    const toastId = toast.loading("Sending hardware test page to your printer...");
    try {
      const res = await fetch('http://127.0.0.1:1337/test-print');
      if (res.ok) {
        toast.success("🎉 Test page dispatched! Check your printer output tray.", { id: toastId });
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Test print failed');
      }
    } catch (err: any) {
      toast.error(`Test print failed: ${err.message || 'Make sure a printer is turned on'}`, { id: toastId });
    } finally {
      setIsTestPrinting(false);
    }
  };

  const handleCopyShopId = () => {
    if (!shopId) return;
    navigator.clipboard.writeText(shopId);
    setCopiedId(true);
    toast.success("Shop ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleImportPrinters = () => {
    if (detectedPrinters.length === 0) {
      toast.error("No printers detected to import. Check that your printer is turned on.");
      return;
    }
    if (onPrintersImported) {
      onPrintersImported(detectedPrinters);
      toast.success(`Imported ${detectedPrinters.length} printer(s) to your shop!`);
      onClose();
    }
  };

  if (!isOpen) return null;

  const downloadUrl = `/api/download/windows${shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''}`;
  const macDownloadUrl = `/api/download/macos${shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 relative flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-400">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                PrintHub Print Bridge
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Zero-Click Printing
                </span>
              </h2>
              <p className="text-slate-300 text-xs mt-0.5">
                Connect your physical desktop printers to print orders automatically.
              </p>
            </div>
          </div>

          {/* Real-time Status Strip */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse' : 'bg-rose-500'}`} />
              <span className="font-bold text-white">
                {isConnected ? 'Bridge Online & Ready' : 'Bridge Offline (Not Running)'}
              </span>
              <span className="text-slate-400 text-[11px]">
                {isConnected ? `Listening on port 1337` : `Requires local launcher`}
              </span>
            </div>

            <button
              onClick={() => checkConnection(true)}
              disabled={checking}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking...' : 'Check Connection'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* If Connected Banner */}
          {isConnected ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-extrabold text-emerald-950 text-sm">
                    Print Bridge is active on this computer!
                  </h4>
                  <p className="text-emerald-700 text-xs mt-0.5">
                    Your physical printers are connected. Incoming paid orders will print automatically with zero manual clicks.
                  </p>
                </div>
              </div>

              {/* Detected Printers */}
              <div className="bg-white/80 rounded-xl p-3 border border-emerald-100 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Detected Printers ({detectedPrinters.length})</span>
                  {detectedPrinters.length > 0 && onPrintersImported && (
                    <button
                      onClick={handleImportPrinters}
                      className="text-indigo-600 hover:text-indigo-700 font-bold normal-case text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Auto-sync to Shop
                    </button>
                  )}
                </div>
                {detectedPrinters.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Scanning system printers...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detectedPrinters.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <Printer className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                        {p.isDefault && (
                          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Default
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleTestPrint}
                  disabled={isTestPrinting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isTestPrinting ? 'Printing Test Page...' : 'Test Print 1 Page'}</span>
                </button>
                {onPrintersImported && (
                  <button
                    onClick={handleImportPrinters}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Sync Printers to Shop Profile</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Setup Instructions & Download (When Offline) */
            <div className="space-y-6">
              {/* OS Selector Tabs */}
              <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                <button
                  onClick={() => setActiveTab('windows')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                    activeTab === 'windows' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Windows (Recommended - 99% of Shops)</span>
                </button>
                <button
                  onClick={() => setActiveTab('macos')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                    activeTab === 'macos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Laptop className="w-4 h-4" />
                  <span>macOS</span>
                </button>
              </div>

              {/* Windows Tab */}
              {activeTab === 'windows' && (
                <div className="space-y-5">
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-950 leading-relaxed">
                      <strong className="block text-indigo-900 font-bold mb-0.5">
                        Zero Installation Required on Windows 10 & 11
                      </strong>
                      This package uses Windows native printing. You do <strong>not</strong> need to install Node.js, Python, or administrative software.
                    </div>
                  </div>

                  {/* 3 Step Visual Guide */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Setup in 3 Easy Steps (30 Seconds):
                    </h4>

                    <div className="grid gap-2.5">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          1
                        </div>
                        <div className="text-xs text-slate-700 flex-1">
                          <strong>Download the Pre-Configured ZIP</strong> below. It already includes your shop's credentials.
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          2
                        </div>
                        <div className="text-xs text-slate-700 flex-1">
                          Extract the ZIP to your Desktop and double-click <strong>Start-PrintBridge.bat</strong>.
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          3
                        </div>
                        <div className="text-xs text-slate-700 flex-1">
                          Leave that small window open. This indicator will turn <strong>🟢 Green</strong> automatically!
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="pt-2">
                    <a
                      href={downloadUrl}
                      download={`PrintHub-PrintBridge-${shopId || 'Package'}.zip`}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold p-4 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2.5 text-center cursor-pointer"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download Print Bridge for Windows (Pre-Configured ZIP)</span>
                    </a>
                    <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
                      Self-contained package (~25 KB) • Automatically paired with Shop ID: {shopId ? `${shopId.slice(0, 8)}...` : 'Active Shop'}
                    </p>
                  </div>
                </div>
              )}

              {/* macOS Tab */}
              {activeTab === 'macos' && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Setup for Mac:
                    </h4>

                    <div className="grid gap-2.5">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-black text-xs flex items-center justify-center shrink-0">
                          1
                        </div>
                        <div className="text-xs text-slate-700 flex-1">
                          Download the macOS companion package below.
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-black text-xs flex items-center justify-center shrink-0">
                          2
                        </div>
                        <div className="text-xs text-slate-700 flex-1">
                          Extract the ZIP and double-click <strong>Start-PrintBridge-Mac.command</strong>.
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-black text-xs flex items-center justify-center shrink-0">
                          3
                        </div>
                        <div className="text-xs text-slate-700 flex-1">
                          The bridge routes print jobs directly to your Mac's default CUPS printer queue.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={macDownloadUrl}
                      download={`PrintHub-PrintBridge-Mac.zip`}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold p-4 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2.5 text-center cursor-pointer"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download Print Bridge for macOS (.zip)</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Shop ID Backup Helper */}
              {shopId && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Your Unique Shop ID (Pre-baked into download):</span>
                    <code className="font-mono font-bold text-slate-800 text-xs">{shopId}</code>
                  </div>
                  <button
                    onClick={handleCopyShopId}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Need assistance? Print Bridge works in the background during store hours.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
