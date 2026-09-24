import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, UploadCloud, Sparkles, Download, Camera, RotateCcw, 
  RefreshCw, Check, Loader2, Grid, ChevronRight, Sliders, Info, Crown
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AIPassportImageMakerProps {
  onBack: () => void;
  onUseInGrid: (imageUrl: string) => void;
  shopId?: string | null;
}

const BACKGROUND_PRESETS = [
  { name: 'Studio Blue', color: '#0044ff', label: 'Blue (Standard)' },
  { name: 'Clean White', color: '#ffffff', label: 'White (Standard)' },
  { name: 'Light Grey', color: '#e2e8f0', label: 'Off-White / Grey' },
  { name: 'Passport Red', color: '#ff0000', label: 'Red (Standard)' },
  { name: 'Light Blue', color: '#a5f3fc', label: 'Light Blue' },
];

const CLOTHING_PRESETS = [
  { id: 'suit', name: 'Dark Navy Formal Suit', desc: 'Classic suit with clean white shirt and dark necktie' },
  { id: 'blazer', name: 'Charcoal Professional Blazer', desc: 'Modern professional grey/charcoal coat and crisp shirt' },
  { id: 'shirt', name: 'Formal White Shirt', desc: 'Neat, crisp ironed white button-up collar shirt' },
  { id: 'traditional', name: 'Traditional Kurta', desc: 'Elegant traditional attire for elegant official portraits' },
  { id: 'doctor', name: 'Doctor Lab Coat', desc: 'Professional medical lab coat with formal inner collar' },
  { id: 'none', name: 'Keep Original Clothes', desc: 'Do not modify clothing; only change the background' },
];

export function AIPassportImageMaker({ onBack, onUseInGrid, shopId }: AIPassportImageMakerProps) {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Camera variables
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Configuration options
  const [selectedBg, setSelectedBg] = useState('blue');
  const [selectedClothing, setSelectedClothing] = useState('suit');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [selectedOutputIdx, setSelectedOutputIdx] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    "Uploading raw image...",
    "Analyzing face contours and skin tones...",
    "Segmenting foreground and isolating background...",
    "Applying high-definition background color...",
    "Reconstructing professional clothing with AI models...",
    "Polishing studio lighting and enhancing facial clarity...",
    "Generating alternative output variations..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setGenerationStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setOutputs([]);
      setError(null);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setOutputs([]);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("Could not access camera. Please check camera permissions or upload an image instead.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally for natural preview mirror effect
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], "captured-selfie.jpg", { type: "image/jpeg" });
            setFile(capturedFile);
            setPreviewUrl(URL.createObjectURL(capturedFile));
            stopCamera();
          }
        }, "image/jpeg", 0.95);
      }
    }
  };

  const handleGenerate = async () => {
    if (!previewUrl) return;

    setIsGenerating(true);
    setGenerationStep(0);
    setError(null);
    setOutputs([]);

    try {
      // Convert previewUrl to base64
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.readAsDataURL(blob);
      });

      const base64Image = await base64Promise;

      const apiRes = await fetch('/api/ai/passport-maker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          mimeType: blob.type || 'image/jpeg',
          backgroundColor: selectedBg,
          clothingPreset: selectedClothing,
          shopId: shopId || undefined
        }),
      });

      if (!apiRes.ok) {
        const errorText = await apiRes.text();
        let errorMessage = 'Failed to process AI Passport Maker request.';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          if (errorData.upgradeRequired) {
            setUpgradeRequired(true);
          }
        } catch (_) {
          if (errorText && errorText.trim().startsWith('<')) {
            errorMessage = `Server returned an HTML error page (Status ${apiRes.status}). Please check the server logs.`;
          } else if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }

      const responseText = await apiRes.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error(`Failed to parse server response as JSON (Status ${apiRes.status}).`);
      }
      if (data.outputs && data.outputs.length > 0) {
        setOutputs(data.outputs);
        setSelectedOutputIdx(0);
      } else {
        throw new Error("No image was returned from the AI model. Please try again.");
      }
    } catch (err: any) {
      console.error("AI Passport Maker Error:", err);
      setError(err.message || "An unexpected error occurred while calling the Gemini API. Please make sure the service is fully configured.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imgUrl: string) => {
    const link = document.createElement('a');
    link.href = imgUrl;
    link.download = `ai-passport-photo-${selectedClothing}-${selectedBg}-${selectedOutputIdx + 1}.jpg`;
    link.click();
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setOutputs([]);
    setError(null);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">AI Passport Image Maker</h1>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <Crown className="w-3 h-3 fill-current text-amber-600" /> Business Plus
              </span>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Powered by Gemini
              </span>
            </div>
            <p className="text-sm text-slate-500">Transform any standard photo into high-quality studio passport photos with custom outfits.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Inputs and Configuration */}
        <div className="w-full lg:w-[450px] bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto p-6 shrink-0">
          
          {/* Section 1: Capture or Upload */}
          {!previewUrl && !isCameraActive && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Step 1: Upload or Snap Portrait</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-slate-50 transition-all text-slate-700"
                >
                  <Camera className="w-8 h-8 text-indigo-600 mb-2" />
                  <span className="font-bold text-sm">Use Live Camera</span>
                  <span className="text-[10px] text-slate-400 mt-1">Capture directly</span>
                </button>

                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-slate-50 cursor-pointer transition-all text-slate-700">
                  <UploadCloud className="w-8 h-8 text-indigo-600 mb-2" />
                  <span className="font-bold text-sm">Upload Photo</span>
                  <span className="text-[10px] text-slate-400 mt-1">Browse computer</span>
                  <input className="hidden" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                </label>
              </div>

              {cameraError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  {cameraError}
                </div>
              )}

              {/* Passport Photo Requirements / Guidance */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-500" />
                  Tips for Perfect AI Results:
                </h4>
                <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                  <li>Look directly into the camera with eyes open.</li>
                  <li>Keep a neutral facial expression or a gentle smile.</li>
                  <li>Ensure your face is well-lit and not covered by hair.</li>
                  <li>Gemini will isolate your head and face, automatically matching chosen attire!</li>
                </ul>
              </div>
            </div>
          )}

          {/* Camera View Mode */}
          {isCameraActive && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Step 1: Snap Portrait</h3>
              <div className="relative aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                />
                {/* Oval silhouette overlay for positioning */}
                <div className="absolute inset-0 border-[3px] border-dashed border-indigo-500/40 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-[60%] h-[70%] border-4 border-dashed border-indigo-400/70 rounded-[50%] opacity-80" />
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 text-[10px] text-white px-2 py-1 rounded-md font-mono">
                  ALIGN FACE IN OVAL
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={stopCamera} 
                  className="py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={capturePhoto} 
                  className="py-2.5 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Camera className="w-4 h-4" /> Take Picture
                </button>
              </div>
            </div>
          )}

          {/* Configuration and Presets (Only when image is loaded/preview available) */}
          {previewUrl && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                
                {/* Header of loaded portrait */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Your Raw Photo</h3>
                  <button 
                    onClick={handleReset}
                    className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Start Over
                  </button>
                </div>

                {/* Background color selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-700">Studio Background Color</label>
                    <span className="text-[11px] text-indigo-600 font-medium">Auto-replaced</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {BACKGROUND_PRESETS.map((bg) => (
                      <button
                        key={bg.name}
                        onClick={() => setSelectedBg(bg.name.toLowerCase())}
                        style={{ backgroundColor: bg.color }}
                        title={bg.label}
                        className={`aspect-square rounded-xl border relative flex items-center justify-center transition-all ${
                          selectedBg === bg.name.toLowerCase() 
                            ? 'ring-4 ring-indigo-600 ring-offset-2 border-indigo-600 scale-105' 
                            : 'border-slate-200 hover:scale-105'
                        }`}
                      >
                        {bg.name.toLowerCase() === 'clean white' && selectedBg === 'clean white' && (
                          <Check className="w-5 h-5 text-indigo-600" />
                        )}
                        {bg.name.toLowerCase() !== 'clean white' && selectedBg === bg.name.toLowerCase() && (
                          <Check className="w-5 h-5 text-white shadow-sm" />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">Standard background requirements vary by document. Blue/White is universally accepted.</p>
                </div>

                {/* Clothing Preset selector */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">Professional Suit / Clothing Preset</label>
                  <div className="space-y-2">
                    {CLOTHING_PRESETS.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedClothing(item.id)}
                        className={`p-3 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                          selectedClothing === item.id 
                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' 
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          selectedClothing === item.id 
                            ? 'border-indigo-600 bg-indigo-600 text-white' 
                            : 'border-slate-300'
                        }`}>
                          {selectedClothing === item.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Generate Trigger */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-95 transition flex justify-center items-center gap-2 shadow-md disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Preparing Outputs...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Generate 2 AI Output Options
                  </>
                )}
              </button>

            </div>
          )}

        </div>

        {/* Right Side: Live preview and Results */}
        <div className="flex-1 bg-slate-100 flex flex-col p-4 md:p-6 overflow-hidden relative">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden relative">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                AI Studio Output Canvas
              </h3>
              {outputs.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 2 Variations Generated Successfully
                </span>
              )}
            </div>

            <div className="flex-1 bg-slate-50/50 p-4 overflow-y-auto flex flex-col items-center justify-center">
              
              {/* No Input State */}
              {!previewUrl && !isGenerating && (
                <div className="text-center p-8 max-w-sm space-y-3">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Generate Passport Photo instantly</h3>
                  <p className="text-xs text-slate-500">
                    Upload a raw portrait or snap a selfie. Select a custom background color and dress coat preset, and Gemini will render 2 professional output photos in seconds.
                  </p>
                </div>
              )}

              {/* Generating Loading State */}
              {isGenerating && (
                <div className="text-center p-8 max-w-md space-y-6 flex flex-col items-center">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin flex items-center justify-center" />
                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-bounce" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-800">Gemini is Processing Image</h3>
                    <p className="text-xs text-indigo-600 font-semibold animate-pulse uppercase tracking-wider">
                      {steps[generationStep]}
                    </p>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-xs">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-700" 
                      style={{ width: `${((generationStep + 1) / steps.length) * 100}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                    Please keep this window active. Our advanced AI models are meticulously adjusting apparel boundaries and aligning studio lighting to keep facial proportions completely unchanged.
                  </p>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="text-center p-8 max-w-md space-y-4">
                  <div className={`w-12 h-12 ${upgradeRequired ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center mx-auto`}>
                    {upgradeRequired ? <Crown className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {upgradeRequired ? 'Business Plus Upgrade Required' : 'AI Generation Failed'}
                  </h3>
                  <p className={`text-xs ${upgradeRequired ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-100'} leading-relaxed p-4 border rounded-xl`}>
                    {error}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    {upgradeRequired ? (
                      <button 
                        onClick={() => navigate('/pricing?plan=business_plus')} 
                        className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black rounded-xl hover:from-amber-400 hover:to-yellow-400 shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Crown className="w-4 h-4 fill-current" /> Upgrade to Business Plus (₹999/mo)
                      </button>
                    ) : (
                      <button 
                        onClick={handleGenerate} 
                        className="py-2 px-4 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                      >
                        Retry Generation
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Just uploaded photo preview */}
              {previewUrl && !isGenerating && outputs.length === 0 && !error && (
                <div className="flex flex-col items-center space-y-4 max-w-sm">
                  <div className="aspect-[3/4] w-64 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-md relative">
                    <img 
                      src={previewUrl} 
                      alt="Raw Input Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 bg-slate-800/80 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      Raw Selfie
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">Photo Loaded Successfully</p>
                    <p className="text-xs text-slate-500 mt-1">Select your favorite jacket/suit preset and background color on the left, then click "Generate".</p>
                  </div>
                </div>
              )}

              {/* Generated AI Output Display */}
              {outputs.length > 0 && !isGenerating && !error && (
                <div className="w-full max-w-4xl space-y-6 p-2">
                  
                  {/* Option Tabs / Grid toggle */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-sm font-bold text-slate-800">Select AI Option:</span>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => setSelectedOutputIdx(0)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedOutputIdx === 0 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Option 1 (Classic Stylization)
                      </button>
                      <button
                        onClick={() => setSelectedOutputIdx(1)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedOutputIdx === 1 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Option 2 (Modern Variation)
                      </button>
                    </div>
                  </div>

                  {/* Side-by-Side original vs output */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
                    
                    {/* Original */}
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Before (Original Upload)</span>
                      <div className="aspect-[3/4] w-52 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
                        <img 
                          src={previewUrl!} 
                          alt="Before" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-all" />
                      </div>
                    </div>

                    {/* AI Edited Option */}
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> After (AI Option {selectedOutputIdx + 1})
                      </span>
                      <div className="aspect-[3/4] w-52 bg-white rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-lg relative">
                        <img 
                          src={outputs[selectedOutputIdx]} 
                          alt={`AI Output ${selectedOutputIdx + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-2 right-2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          Option {selectedOutputIdx + 1}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Action items for selected output */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 justify-center">
                    
                    <button
                      onClick={() => handleDownload(outputs[selectedOutputIdx])}
                      className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 border border-slate-200"
                    >
                      <Download className="w-4 h-4" /> Download Single Photo
                    </button>

                    <button
                      onClick={() => onUseInGrid(outputs[selectedOutputIdx])}
                      className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md hover:scale-[1.02]"
                    >
                      <Grid className="w-4 h-4" /> Use in Print layout sheet
                      <ChevronRight className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
