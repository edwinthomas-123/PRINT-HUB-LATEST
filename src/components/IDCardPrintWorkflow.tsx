import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, ArrowLeft, ArrowRight, RotateCcw, 
  Sparkles, Check, CheckCircle2, X, RefreshCw, 
  FileText, Shield, Layers, HelpCircle, AlertCircle
} from 'lucide-react';
import { PerspectiveCrop } from './PerspectiveCrop';
import { jsPDF } from 'jspdf';
import { PrintSettings } from '../types';

interface IDCardPrintWorkflowProps {
  onComplete: (file: File, previewUrl: string, settings: Partial<PrintSettings>) => void;
  onCancel: () => void;
}

export function IDCardPrintWorkflow({ onComplete, onCancel }: IDCardPrintWorkflowProps) {
  // Steps: 'select_front' | 'crop_front' | 'select_back' | 'crop_back' | 'layout_preview'
  const [step, setStep] = useState<'select_front' | 'crop_front' | 'select_back' | 'crop_back' | 'layout_preview'>('select_front');
  
  // Images
  const [rawFrontImage, setRawFrontImage] = useState<string | null>(null);
  const [croppedFrontImage, setCroppedFrontImage] = useState<string | null>(null);
  
  const [rawBackImage, setRawBackImage] = useState<string | null>(null);
  const [croppedBackImage, setCroppedBackImage] = useState<string | null>(null);

  // Camera State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraSide, setCameraSide] = useState<'front' | 'back'>('front');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Layout mode: 'stacked' (Front on top, Back below on top-left) or 'side-by-side' (Front and Back side by side on top-left)
  const [layoutMode, setLayoutMode] = useState<'stacked' | 'side-by-side'>('stacked');
  
  // Generated A4 sheet preview
  const [a4PreviewUrl, setA4PreviewUrl] = useState<string | null>(null);
  const [generatingA4, setGeneratingA4] = useState<boolean>(false);

  // Start Camera
  const startCamera = async (side: 'front' | 'back') => {
    setCameraSide(side);
    setCameraError(null);
    setCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(err.message || "Unable to access camera. Please check camera permissions or upload an image file instead.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture frame from active camera stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth <= 0 || video.videoHeight <= 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    stopCamera();

    if (cameraSide === 'front') {
      setRawFrontImage(dataUrl);
      setStep('crop_front');
    } else {
      setRawBackImage(dataUrl);
      setStep('crop_back');
    }
  };

  // Handle file picker selection
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (side === 'front') {
        setRawFrontImage(result);
        setStep('crop_front');
      } else {
        setRawBackImage(result);
        setStep('crop_back');
      }
    };
    reader.readAsDataURL(file);
  };

  // When front crop completes
  const handleFrontCropComplete = (croppedDataUrl: string) => {
    setCroppedFrontImage(croppedDataUrl);
    setStep('select_back');
  };

  // When back crop completes
  const handleBackCropComplete = (croppedDataUrl: string) => {
    setCroppedBackImage(croppedDataUrl);
    buildA4Canvas(croppedFrontImage!, croppedDataUrl, layoutMode);
  };

  // Skip back side (single sided card)
  const handleSkipBack = () => {
    setCroppedBackImage(null);
    buildA4Canvas(croppedFrontImage!, null, layoutMode);
  };

  // Build high-resolution A4 Canvas with curved corners placed at top-left
  const buildA4Canvas = (frontImgSrc: string, backImgSrc: string | null, layout: 'stacked' | 'side-by-side') => {
    setGeneratingA4(true);
    setStep('layout_preview');

    const frontImg = new Image();
    frontImg.crossOrigin = 'anonymous';
    frontImg.src = frontImgSrc;

    frontImg.onload = () => {
      const onAllImagesLoaded = (backImg: HTMLImageElement | null) => {
        // High resolution A4 sheet:
        // 210mm x 297mm. At 10 pixels per mm => 2100 x 2970 pixels
        const canvas = document.createElement('canvas');
        canvas.width = 2100;
        canvas.height = 2970;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clean white paper background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Standard ID Card dimension: 85.6mm x 54.0mm => 856 x 540 pixels
        const cardW = 856;
        const cardH = 540;
        const cornerRadius = 32; // ~3.2mm curved corners for authentic card look!

        // Placement at top-left:
        // Margins: 150px from left (15mm), 160px from top (16mm)
        const marginLeft = 150;
        const marginTop = 160;

        // Helper to draw card with curved corners, subtle realistic border & cut-guide lines
        const drawCurvedCard = (img: HTMLImageElement, x: number, y: number, label: string) => {
          ctx.save();

          // 1. Draw dashed scissor cutting guide around card (2mm outside)
          ctx.save();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.strokeRect(x - 10, y - 10, cardW + 20, cardH + 20);
          ctx.restore();

          // Scissor cut tag
          ctx.save();
          ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText(`✂ Cut line (${label}) - 85.6mm × 54mm`, x, y - 18);
          ctx.restore();

          // 2. Subtle drop shadow for card depth feel
          ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 4;

          // 3. Curved card clipping path
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, cardW, cardH, cornerRadius);
          } else {
            // Fallback for older browsers
            ctx.moveTo(x + cornerRadius, y);
            ctx.arcTo(x + cardW, y, x + cardW, y + cardH, cornerRadius);
            ctx.arcTo(x + cardW, y + cardH, x, y + cardH, cornerRadius);
            ctx.arcTo(x, y + cardH, x, y, cornerRadius);
            ctx.arcTo(x, y, x + cardW, y, cornerRadius);
            ctx.closePath();
          }
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // Clip to curved card
          ctx.clip();

          // Reset shadow so it doesn't blur image pixels
          ctx.shadowColor = 'transparent';

          // Draw the deskewed card image
          ctx.drawImage(img, x, y, cardW, cardH);

          // 4. Subtle inner border for plastic card edge
          ctx.restore();
          ctx.save();
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, cardW, cardH, cornerRadius);
          } else {
            ctx.rect(x, y, cardW, cardH);
          }
          ctx.stroke();
          ctx.restore();
        };

        // Render Front Side at top-left
        drawCurvedCard(frontImg, marginLeft, marginTop, 'Front Side');

        // Render Back Side (if present)
        if (backImg) {
          if (layout === 'stacked') {
            // Stacked on top-left: below front with 90px (~9mm) gap
            const backY = marginTop + cardH + 110;
            drawCurvedCard(backImg, marginLeft, backY, 'Back Side');
          } else {
            // Side-by-side on top-left: with 100px gap
            const backX = marginLeft + cardW + 110;
            // Check if fits horizontally (marginLeft + cardW*2 + 110 = 150 + 1712 + 110 = 1972 < 2100) -> Fits perfectly!
            drawCurvedCard(backImg, backX, marginTop, 'Back Side');
          }
        }

        // Print header metadata watermark at top right
        ctx.save();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('PrintHub Smart ID Card • Standard 1:1 Scale Print', canvas.width - 150, 80);
        ctx.fillText('A4 Paper (210 × 297 mm) • Fit to Page Enabled', canvas.width - 150, 108);
        ctx.restore();

        const previewData = canvas.toDataURL('image/jpeg', 0.95);
        setA4PreviewUrl(previewData);
        setGeneratingA4(false);
      };

      if (backImgSrc) {
        const backImg = new Image();
        backImg.crossOrigin = 'anonymous';
        backImg.src = backImgSrc;
        backImg.onload = () => onAllImagesLoaded(backImg);
      } else {
        onAllImagesLoaded(null);
      }
    };
  };

  // When user switches layout in preview
  const handleLayoutChange = (newLayout: 'stacked' | 'side-by-side') => {
    setLayoutMode(newLayout);
    if (croppedFrontImage) {
      buildA4Canvas(croppedFrontImage, croppedBackImage, newLayout);
    }
  };

  // Finalize and add to print queue
  const handleConfirmAndAdd = async () => {
    if (!a4PreviewUrl) return;

    try {
      // 1. Convert A4 canvas to PDF
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      doc.addImage(a4PreviewUrl, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      const pdfBlob = doc.output('blob');

      const fileName = `ID_Card_${croppedBackImage ? 'Front_Back' : 'Front'}_${Date.now().toString().slice(-4)}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Default optimal settings for ID card:
      // Color, A4, Plain or Glossy, Fit to Page checked
      const settings: Partial<PrintSettings> = {
        color: 'Color',
        orientation: 'Portrait',
        paperSize: 'A4',
        paperType: 'Plain',
        sides: 'Single',
        copies: 1,
        pages: 'All',
        fitToPage: true,
        scaleOption: 'fit',
        isIdCard: true,
        idCardLayout: layoutMode
      };

      onComplete(file, a4PreviewUrl, settings);
    } catch (err) {
      console.error("Error creating ID Card print document:", err);
      // Fallback to image file
      const res = await fetch(a4PreviewUrl);
      const blob = await res.blob();
      const file = new File([blob], `ID_Card_Print.jpg`, { type: 'image/jpeg' });
      onComplete(file, a4PreviewUrl, {
        color: 'Color',
        orientation: 'Portrait',
        paperSize: 'A4',
        paperType: 'Plain',
        sides: 'Single',
        copies: 1,
        pages: 'All',
        fitToPage: true,
        scaleOption: 'fit',
        isIdCard: true
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      {/* Top Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">Smart ID Card Printing</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                A4 Scale Card Mode
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Auto edge-detection, curved plastic card corners & physical 85.6mm × 54mm A4 layout
            </p>
          </div>
        </div>

        <button 
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          title="Cancel ID Card Print"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Wizard Progress Steps */}
      <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between overflow-x-auto text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
            step === 'select_front' || step === 'crop_front'
              ? 'bg-indigo-600 text-white'
              : 'bg-emerald-100 text-emerald-700'
          }`}>
            {croppedFrontImage ? '✓' : '1'}
          </span>
          <span className={`font-semibold ${step === 'select_front' || step === 'crop_front' ? 'text-indigo-600' : 'text-slate-600'}`}>
            Front Side
          </span>
        </div>

        <div className="h-0.5 w-8 bg-slate-200"></div>

        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
            step === 'select_back' || step === 'crop_back'
              ? 'bg-indigo-600 text-white'
              : croppedBackImage
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-400'
          }`}>
            {croppedBackImage ? '✓' : '2'}
          </span>
          <span className={`font-semibold ${step === 'select_back' || step === 'crop_back' ? 'text-indigo-600' : 'text-slate-600'}`}>
            Back Side
          </span>
        </div>

        <div className="h-0.5 w-8 bg-slate-200"></div>

        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
            step === 'layout_preview'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-400'
          }`}>
            3
          </span>
          <span className={`font-semibold ${step === 'layout_preview' ? 'text-indigo-600' : 'text-slate-400'}`}>
            A4 Placement & Print
          </span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Camera Live Modal Overlay */}
        {cameraActive && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4 sm:p-6 backdrop-blur-sm">
            <div className="w-full max-w-xl flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm">
                  Capturing {cameraSide === 'front' ? 'Front Side' : 'Back Side'} of Card
                </span>
              </div>
              <button 
                onClick={stopCamera}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewfinder with Card Outline */}
            <div className="relative w-full max-w-xl aspect-[4/3] bg-black rounded-3xl overflow-hidden flex items-center justify-center border border-white/20 shadow-2xl">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />

              {/* Card Bounding Frame Guide with Rounded Corners */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-indigo-400/90 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex flex-col justify-between p-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-indigo-200 tracking-wider uppercase">
                  <span>Align card edges</span>
                  <span className="bg-indigo-600/80 text-white px-2 py-0.5 rounded-full">{cameraSide.toUpperCase()}</span>
                </div>
                <div className="text-center text-[11px] font-medium text-white/80">
                  Hold steady on a dark surface for best edge detection
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-xl flex items-center justify-center gap-6 py-4">
              <button 
                onClick={stopCamera}
                className="px-6 py-3 bg-white/20 text-white rounded-2xl font-bold text-sm hover:bg-white/30 transition"
              >
                Cancel
              </button>
              <button 
                onClick={capturePhoto}
                className="w-18 h-18 bg-white rounded-full p-1.5 shadow-xl hover:scale-105 active:scale-95 transition flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full border-4 border-indigo-600 bg-white flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600"></div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Select Front Side */}
        {step === 'select_front' && (
          <div className="max-w-2xl mx-auto space-y-8 text-center py-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Step 1 of 2
              </span>
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Select Front Side of ID Card
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Capture the front of your Aadhaar card, Driver's License, Student/Employee ID, or upload a photo from your device.
              </p>
            </div>

            {cameraError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left text-xs text-rose-700 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Camera access notice</p>
                  <p className="mt-0.5">{cameraError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Live Camera */}
              <button
                type="button"
                onClick={() => startCamera('front')}
                className="p-8 rounded-3xl border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 flex flex-col items-center justify-center gap-4 transition group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">Capture Now</h4>
                  <p className="text-xs text-slate-500 mt-1">Use camera with real-time card guide</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Open Camera <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Option 2: Upload File / Gallery */}
              <label className="p-8 rounded-3xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/30 flex flex-col items-center justify-center gap-4 transition group cursor-pointer shadow-xs hover:shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">Choose Photo / File</h4>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG, PDF document scans</p>
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition flex items-center gap-1">
                  Browse Gallery <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="hidden" 
                  onChange={(e) => handleFileInput(e, 'front')} 
                />
              </label>
            </div>

            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> Auto Edge Detection
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> 4-Corner Perspective
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> Real Size 85.6mm
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: Perspective Crop Front */}
        {step === 'crop_front' && rawFrontImage && (
          <PerspectiveCrop
            imageSrc={rawFrontImage}
            cardSideTitle="Front Side"
            onComplete={handleFrontCropComplete}
            onCancel={() => setStep('select_front')}
          />
        )}

        {/* STEP 3: Select Back Side */}
        {step === 'select_back' && (
          <div className="max-w-2xl mx-auto space-y-8 text-center py-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Front Side Saved
              </span>
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Now Select Back Side of ID Card
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Does your card have a back side? Capture or upload it, or skip to print the front side only.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Live Camera */}
              <button
                type="button"
                onClick={() => startCamera('back')}
                className="p-8 rounded-3xl border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 flex flex-col items-center justify-center gap-4 transition group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">Capture Back Side</h4>
                  <p className="text-xs text-slate-500 mt-1">Use camera with real-time card guide</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Open Camera <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Option 2: Upload File / Gallery */}
              <label className="p-8 rounded-3xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/30 flex flex-col items-center justify-center gap-4 transition group cursor-pointer shadow-xs hover:shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">Choose Back Photo</h4>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG from phone or device</p>
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition flex items-center gap-1">
                  Browse Gallery <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="hidden" 
                  onChange={(e) => handleFileInput(e, 'back')} 
                />
              </label>
            </div>

            {/* Skip Back Side Button */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSkipBack}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition cursor-pointer"
              >
                Skip Back Side (Single-Sided Print)
              </button>

              <button
                type="button"
                onClick={() => setStep('crop_front')}
                className="w-full sm:w-auto px-6 py-3.5 text-slate-500 hover:text-slate-800 font-semibold text-xs transition"
              >
                Back to Front Side Adjustment
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Perspective Crop Back */}
        {step === 'crop_back' && rawBackImage && (
          <PerspectiveCrop
            imageSrc={rawBackImage}
            cardSideTitle="Back Side"
            onComplete={handleBackCropComplete}
            onCancel={() => setStep('select_back')}
          />
        )}

        {/* STEP 5: Layout Preview & Placement on A4 */}
        {step === 'layout_preview' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center max-w-xl mx-auto">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">
                A4 ID Card Layout Ready!
              </h3>
              <p className="text-xs text-slate-500">
                Front {croppedBackImage ? '& Back sides have' : 'side has'} been cropped with curved plastic card corners and placed on top-left of standard A4 paper at authentic physical 85.6mm × 54mm scale.
              </p>
            </div>

            {/* Layout Mode Switcher if both sides are present */}
            {croppedBackImage && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Placement on A4:
                </span>
                <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('stacked')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      layoutMode === 'stacked'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Stacked (Top & Below) • Xerox Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('side-by-side')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      layoutMode === 'side-by-side'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Side-by-Side • Fold & Laminate
                  </button>
                </div>
              </div>
            )}

            {/* A4 Sheet Interactive Visual Representation */}
            <div className="flex justify-center">
              <div className="relative p-6 sm:p-8 bg-slate-100 border border-slate-200 rounded-3xl shadow-inner max-w-md w-full flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  A4 Paper Preview (210mm × 297mm)
                </span>

                {/* Simulated A4 Sheet */}
                <div className="relative w-full aspect-[1/1.414] bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden p-4">
                  {a4PreviewUrl ? (
                    <img 
                      src={a4PreviewUrl} 
                      alt="A4 ID Card Print Sheet" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      Generating high-resolution card layout...
                    </div>
                  )}

                  {/* Top-Left Indicator Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider shadow-xs">
                    Left Top Standard
                  </div>
                </div>

                <div className="w-full mt-4 p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-semibold">Curved Card Finish</span>
                  </div>
                  <span className="text-slate-400">85.6 × 54.0 mm</span>
                  <span className="font-bold text-indigo-600">300 DPI</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('crop_front')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Re-adjust Corners
              </button>

              <button
                type="button"
                onClick={handleConfirmAndAdd}
                disabled={generatingA4 || !a4PreviewUrl}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                Add to Print Order & Configure
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
