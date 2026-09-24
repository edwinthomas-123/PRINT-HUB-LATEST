import React, { useState, useEffect } from 'react';
import { X, Monitor, Laptop, Smartphone, DownloadCloud, Terminal, CheckCircle, Chrome } from 'lucide-react';
import toast from 'react-hot-toast';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadAppModal({ isOpen, onClose }: DownloadAppModalProps) {
  const [activeTab, setActiveTab] = useState<'windows' | 'macos' | 'android'>('windows');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handlePWAInstall = async () => {
    if (!deferredPrompt) {
      toast("PWA installation is supported directly in your browser. Tap the 'Install App' icon in your browser's address bar or share menu!", { icon: 'ℹ️' });
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallSuccess(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 relative flex flex-col md:flex-row h-auto max-h-[90vh]"
        id="download-app-modal-container"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full cursor-pointer z-10 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sidebar */}
        <div className="bg-slate-50 p-6 md:w-1/3 border-r border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-indigo-600 text-white p-2 rounded-xl">
                <DownloadCloud className="w-5 h-5" />
              </div>
              <span className="font-black text-lg text-slate-900">PrintHub Desktop</span>
            </div>
            
            <p className="text-slate-500 text-xs leading-relaxed mb-6">
              Choose your operating system to install the official standalone client.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('windows')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${activeTab === 'windows' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Monitor className="w-4 h-4" />
                <span>Windows App</span>
              </button>

              <button
                onClick={() => setActiveTab('macos')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${activeTab === 'macos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Laptop className="w-4 h-4" />
                <span>macOS App</span>
              </button>

              <button
                onClick={() => setActiveTab('android')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${activeTab === 'android' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android App</span>
              </button>
            </div>
          </div>

          <div className="hidden md:block pt-4 border-t border-slate-200 text-[10px] text-slate-400 font-medium">
            Version 1.0.0 (Stable) • Updates automatically
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-8 md:w-2/3 flex flex-col justify-between overflow-y-auto">
          {activeTab === 'windows' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Download for Windows</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Download our official compiled print-bridge companion application for Windows 10 & 11. It runs locally as a native application to receive and print jobs automatically in real-time.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                  <Terminal className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900">Real-Time Printer Integration</strong>
                    Secures a connection to your PrintHub dashboard and directly triggers print jobs on your local default printer with zero clicks!
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href="/api/download/windows"
                  target="_blank"
                  download="PrintHub-Companion.zip"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold p-4 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Download Windows App (PrintHub-Companion.zip)</span>
                </a>
                <p className="text-[10px] text-slate-400 text-center font-medium">
                  File format: Lightweight Portable Bridge (~28 KB) • Zero installation, no Node.js required
                </p>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60">
                <strong>Easy 30-Second Setup:</strong>
                <ol className="list-decimal pl-4 mt-1 space-y-1">
                  <li>Extract the ZIP to your Desktop or store folder.</li>
                  <li>Double-click <code>Start-PrintBridge.bat</code>.</li>
                  <li>Your physical printer is now active! Leave that small window open in the background to automatically print customer orders with zero clicks.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'macos' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Download for macOS</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Download the official native compiled binary for Mac. It connects securely to the print shop queue in real-time.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                  <Terminal className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900">CUPS Printing System</strong>
                    Integrates perfectly with the native macOS CUPS queue (using local <code>lp</code> commands) to feed your desktop printer instantly.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href="/api/download/macos"
                  target="_blank"
                  download="PrintHub-Companion.zip"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold p-4 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Download macOS App (PrintHub-Companion.zip)</span>
                </a>
                <p className="text-[10px] text-slate-400 text-center font-medium">
                  File format: Standalone Portable Package (~28 KB) • macOS Sonoma, Ventura, Monterey
                </p>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60">
                <strong>Easy Setup for Mac:</strong>
                <ol className="list-decimal pl-4 mt-1 space-y-1">
                  <li>Extract the ZIP to your Mac.</li>
                  <li>Double-click <code>Start-PrintBridge-Mac.command</code>.</li>
                  <li>Jobs sent to your store will print automatically to your default Mac printer.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Download for Android</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Enjoy our lightweight client on Android. Get fully functional native shell screens, immediate camera access, and system tray status notifications.
                </p>
              </div>

              {installSuccess ? (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                  <h4 className="font-bold text-sm">Installation Started!</h4>
                  <p className="text-xs text-emerald-600">Please confirm on your mobile screen prompt to finalize installing the native application shortcut.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deferredPrompt ? (
                    <button
                      onClick={handlePWAInstall}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold p-4 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Chrome className="w-4 h-4 animate-bounce" />
                      <span>Install App Instantly (One-Tap Native APK)</span>
                    </button>
                  ) : (
                    <a
                      href="/api/download/android"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold p-4 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-center block"
                    >
                      <DownloadCloud className="w-4 h-4" />
                      <span>Download Android Setup Helper (.apk)</span>
                    </a>
                  )}

                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    Native Android Client Packager • Integrates into your mobile App Drawer
                  </p>
                </div>
              )}

              <div className="text-[11px] text-slate-500 leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60">
                <strong>Easy Android Installation:</strong>
                <ol className="list-decimal pl-4 mt-1 space-y-1">
                  <li>Tap the <strong>Download Setup Helper</strong> button to run the automatic installer assistant.</li>
                  <li>In Chrome on Android, tap the three-dots menu (⁝) or look at the banner.</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.</li>
                  <li>PrintHub is now fully installed as a native-feeling system APK!</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
