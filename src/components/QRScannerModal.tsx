import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Camera, Upload, Keyboard, AlertCircle, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import jsQR from 'jsqr';
import { toast } from 'react-hot-toast';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Manual input state
  const [manualInput, setManualInput] = useState('');

  // Refs for camera scanning
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setError(null);
    setIsScanning(true);

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        videoRef.current.play();
        
        // Start decoding loop
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      setError("Unable to access the camera. Please check your system/browser permissions or upload an image instead.");
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || activeTab !== 'camera') {
      return;
    }

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        
        // Draw video frame to hidden canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Extract pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Scan with jsQR
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          handleQRCodeFound(code.data);
          return; // Stop requesting more animation frames
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const handleQRCodeFound = (text: string) => {
    stopCamera();
    
    // Play a gentle beep sound using web audio API (very premium!)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5 note
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      // ignore audio context failures
    }

    setSuccessMsg("QR Code Scanned Successfully!");
    
    // Parse the QR content
    processScannedText(text);
  };

  const processScannedText = (text: string) => {
    const trimmed = text.trim();
    
    // Try to extract shop ID from typical URL: /shop/SHOP_ID/upload or /shop/SHOP_ID
    const shopUrlMatch = trimmed.match(/\/shop\/([a-zA-Z0-9_-]+)/);
    
    if (shopUrlMatch && shopUrlMatch[1]) {
      const shopId = shopUrlMatch[1];
      toast.success("Shop identified! Redirecting...");
      setTimeout(() => {
        onClose();
        navigate(`/shop/${shopId}/upload`);
      }, 1000);
    } else if (trimmed.length >= 10 && !trimmed.includes('/') && /^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      // Fallback: scanned content is just the shop ID itself
      const shopId = trimmed;
      toast.success("Shop ID detected! Redirecting...");
      setTimeout(() => {
        onClose();
        navigate(`/shop/${shopId}/upload`);
      }, 1000);
    } else {
      // Unrecognized format
      setError(`Decoded text is not a valid Shop QR Code: "${trimmed.substring(0, 50)}${trimmed.length > 50 ? '...' : ''}"`);
      // Resume scanner if it was camera tab
      if (activeTab === 'camera') {
        setTimeout(() => {
          setError(null);
          startCamera();
        }, 3000);
      }
    }
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError("Failed to initialize canvas context.");
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          handleQRCodeFound(code.data);
        } else {
          setError("Could not find any valid QR Code in this image. Please make sure the QR code is clear and well-lit.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Manual Submit handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setError(null);
    processScannedText(manualInput.trim());
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in w-full h-full">
      <div className="bg-white w-full max-w-md min-w-[320px] sm:min-w-[440px] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-slate-950 text-lg">Scan & Print</h3>
            <p className="text-xs text-slate-500 mt-0.5">Connect to a printer instantly via QR</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-100 shrink-0 p-1 bg-slate-50 m-4 rounded-xl">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'camera' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" /> Live Camera
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" /> Upload Image
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'manual' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Manual ID
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-start">
          
          {/* Status feedback alerts */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-3 mb-4 animate-scale-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <div className="text-sm font-semibold">{successMsg}</div>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-start gap-3 mb-4 animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed font-medium">{error}</div>
            </div>
          )}

          {/* TAB 1: LIVE CAMERA */}
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-72 h-72 rounded-3xl overflow-hidden bg-slate-950 shadow-inner border-2 border-slate-800 flex items-center justify-center">
                
                {/* Laser scan line effect */}
                {isScanning && !successMsg && (
                  <div className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_#6366f1] z-10 animate-scan-line"></div>
                )}

                {/* Target bounding bracket guides */}
                <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center z-10">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
                </div>

                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover transform scale-x-[-1]" 
                  style={{ display: isScanning ? 'block' : 'none' }}
                />

                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {!isScanning && !successMsg && (
                  <div className="flex flex-col items-center text-slate-400 p-6 text-center space-y-2">
                    {hasPermission === false ? (
                      <>
                        <AlertCircle className="w-10 h-10 text-rose-400" />
                        <p className="text-xs">Camera access was denied</p>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-10 h-10 animate-spin text-slate-600" />
                        <p className="text-xs">Starting camera feed...</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {isScanning && (
                <div className="flex gap-2 w-full justify-center">
                  <button 
                    onClick={toggleCameraFacing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Switch Camera
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-400 text-center max-w-[260px]">
                Align the shop owner's QR code within the frame to scan automatically.
              </p>
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE */}
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <label className="w-full max-w-xs h-48 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer p-4 bg-slate-50 hover:bg-indigo-50/20 transition-all text-center">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
                <Upload className="w-10 h-10 text-slate-400 mb-3" />
                <span className="font-bold text-slate-800 text-sm">Select QR Code Image</span>
                <span className="text-xs text-slate-400 mt-1">Upload a photo or screen-capture of the QR</span>
              </label>
              
              <p className="text-xs text-slate-400 text-center max-w-[280px]">
                Take a photo of the shop owner's printed QR standee, or upload a digital file to parse it.
              </p>
            </div>
          )}

          {/* TAB 3: MANUAL ID */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Shop Link or Shop ID</label>
                <input 
                  type="text" 
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. demo-local-shop or full URL" 
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-slate-50/50"
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl text-sm font-bold shadow-sm hover:shadow transition cursor-pointer flex justify-center items-center gap-1.5"
              >
                Connect to Shop &rarr;
              </button>

              <p className="text-xs text-slate-400 text-center max-w-[300px] mx-auto mt-2">
                Tip: Enter the full shop link (e.g. <span className="font-mono bg-slate-100 px-1 rounded">.../shop/shop-id/upload</span>) or just the shop ID directly.
              </p>
            </form>
          )}

        </div>
      </div>

      {/* Define inline keyframes for laser animation since it's customizable inside this element */}
      <style>{`
        @keyframes scan-line {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        .animate-scan-line {
          animation: scan-line 3s linear infinite;
        }
      `}</style>
    </div>,
    document.body
  );
}
