import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Camera, Download, Loader2, RotateCcw, SlidersHorizontal, Image as ImageIcon, Check, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import jscanify from 'jscanify/client';

export function DocumentScannerTool({ onBack }: { onBack: () => void }) {
  const [isCvLoaded, setIsCvLoaded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedCanvas, setCapturedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<'original' | 'enhanced' | 'bw'>('enhanced');

  // Image processing controls for thresholding and contrast adjustments
  const [contrast, setContrast] = useState<number>(1.3);
  const [brightness, setBrightness] = useState<number>(10);
  const [thresholdMode, setThresholdMode] = useState<'adaptive' | 'otsu' | 'simple'>('adaptive');
  const [binaryThreshold, setBinaryThreshold] = useState<number>(128);
  const [adaptiveBlockSize, setAdaptiveBlockSize] = useState<number>(21);
  const [adaptiveC, setAdaptiveC] = useState<number>(15);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerRef = useRef<any>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    // Load OpenCV
    if ((window as any).cv && (window as any).cv.Mat) {
      setIsCvLoaded(true);
      return;
    }

    // Set Module BEFORE script appends
    (window as any).Module = {
      onRuntimeInitialized: () => {
        setIsCvLoaded(true);
      }
    };

    let script = document.getElementById('opencv-script') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'opencv-script';
      script.src = 'https://docs.opencv.org/4.7.0/opencv.js';
      script.async = true;
      document.body.appendChild(script);
    }

    const handleLoad = () => {
      if ((window as any).cv && (window as any).cv.Mat) {
        setIsCvLoaded(true);
      }
    };

    script.addEventListener('load', handleLoad);

    return () => {
      script.removeEventListener('load', handleLoad);
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error(err);
      toast.error('Camera access denied or unavailable.');
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (isCvLoaded && !scannerRef.current) {
      scannerRef.current = new jscanify();
    }
  }, [isCvLoaded]);

  // Video processing loop for highlighting
  const processVideo = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !scannerRef.current || !stream) {
      requestRef.current = requestAnimationFrame(processVideo);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
          const highlightedCanvas = scannerRef.current.highlightPaper(canvas);
          if (highlightedCanvas) {
            // Clear and draw highlighted
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(highlightedCanvas, 0, 0);
          }
        } catch (e) {
          // Ignore errors during highlight (e.g. no contour found)
        }
      }
    }

    requestRef.current = requestAnimationFrame(processVideo);
  }, [stream]);

  useEffect(() => {
    if (stream && isCvLoaded) {
      requestRef.current = requestAnimationFrame(processVideo);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [stream, isCvLoaded, processVideo]);

  const capturePhoto = () => {
    if (!videoRef.current || !scannerRef.current) return;
    
    const video = videoRef.current;
    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      console.warn('Video dimensions are not valid yet.');
      return;
    }
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    try {
      // Extract paper, A4 proportion
      const paperWidth = 794;
      const paperHeight = 1123;
      const extractedCanvas = scannerRef.current.extractPaper(tempCanvas, paperWidth, paperHeight);
      if (extractedCanvas) {
        setCapturedCanvas(extractedCanvas);
      } else {
        console.warn('No paper contour found, falling back to original image');
        setCapturedCanvas(tempCanvas);
      }
      stopCamera();
    } catch (e) {
      console.error(e);
      // Fallback: just use the whole image if paper not found
      setCapturedCanvas(tempCanvas);
      stopCamera();
    }
  };

  const applyFilter = useCallback(() => {
    if (!capturedCanvas || capturedCanvas.width <= 0 || capturedCanvas.height <= 0) return;
    
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = capturedCanvas.width;
    finalCanvas.height = capturedCanvas.height;
    
    let processed = false;
    
    // Try to use OpenCV.js for high-fidelity scanning and thresholding
    if ((window as any).cv && (window as any).cv.Mat) {
      try {
        const cv = (window as any).cv;
        let src = cv.imread(capturedCanvas);
        let dst = new cv.Mat();
        
        if (filter === 'bw') {
          // Convert to grayscale
          cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
          
          if (thresholdMode === 'adaptive') {
            // Adaptive threshold is beautiful for scanning documents (clears shadows perfectly!)
            // Block size must be an odd number >= 3
            let blockSize = Math.max(3, adaptiveBlockSize);
            if (blockSize % 2 === 0) blockSize += 1;
            
            cv.adaptiveThreshold(
              dst,
              dst,
              255,
              cv.ADAPTIVE_THRESH_GAUSSIAN_C,
              cv.THRESH_BINARY,
              blockSize,
              adaptiveC
            );
          } else if (thresholdMode === 'otsu') {
            cv.threshold(dst, dst, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
          } else {
            cv.threshold(dst, dst, binaryThreshold, 255, cv.THRESH_BINARY);
          }
          
          // Convert back to RGBA for canvas rendering
          cv.cvtColor(dst, src, cv.COLOR_GRAY2RGBA, 0);
          
          // Apply contrast/brightness: output = input * contrast + brightness
          if (contrast !== 1.0 || brightness !== 0) {
            src.convertTo(src, -1, contrast, brightness);
          }
          
          cv.imshow(finalCanvas, src);
        } else if (filter === 'enhanced') {
          // Contrast & Brightness Enhancement
          src.convertTo(dst, -1, contrast, brightness);
          cv.imshow(finalCanvas, dst);
        } else {
          // Original with custom adjustments if modified
          src.convertTo(dst, -1, contrast, brightness);
          cv.imshow(finalCanvas, dst);
        }
        
        // Clean up cv objects to prevent memory leak
        src.delete();
        dst.delete();
        processed = true;
      } catch (e) {
        console.error('OpenCV processing error, falling back to manual: ', e);
      }
    }
    
    // Fallback: Custom high-performance JS pixel manipulation
    if (!processed) {
      const ctx = finalCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(capturedCanvas, 0, 0);
        try {
          const imgData = ctx.getImageData(0, 0, finalCanvas.width, finalCanvas.height);
          const data = imgData.data;
          
          if (filter === 'bw') {
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              
              // Standard luminance formula
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              
              // Thresholding
              let pixelVal = gray;
              if (thresholdMode === 'simple') {
                pixelVal = gray >= binaryThreshold ? 255 : 0;
              } else {
                // Approximate adaptive thresholding on the fly
                pixelVal = gray >= 128 ? 255 : 0;
              }
              
              // Contrast/brightness adjustment
              let adjusted = (pixelVal - 128) * contrast + 128 + brightness;
              adjusted = Math.min(255, Math.max(0, adjusted));
              
              data[i] = adjusted;
              data[i + 1] = adjusted;
              data[i + 2] = adjusted;
            }
            ctx.putImageData(imgData, 0, 0);
          } else {
            // Original / Enhanced custom adjustments
            for (let i = 0; i < data.length; i += 4) {
              for (let j = 0; j < 3; j++) {
                let val = data[i + j];
                let adjusted = (val - 128) * contrast + 128 + brightness;
                adjusted = Math.min(255, Math.max(0, adjusted));
                data[i + j] = adjusted;
              }
            }
            ctx.putImageData(imgData, 0, 0);
          }
        } catch (err) {
          console.error('Fallback pixel processing error: ', err);
          // Last resort fallback: native CSS filters
          ctx.drawImage(capturedCanvas, 0, 0);
          if (filter === 'bw') {
            ctx.filter = `grayscale(100%) contrast(${(contrast * 150).toFixed(0)}%) brightness(${(100 + brightness).toFixed(0)}%)`;
          } else if (filter === 'enhanced') {
            ctx.filter = `contrast(${(contrast * 120).toFixed(0)}%) brightness(${(100 + brightness).toFixed(0)}%)`;
          }
          ctx.drawImage(capturedCanvas, 0, 0);
        }
      }
    }
    
    setPreviewUrl(finalCanvas.toDataURL('image/jpeg', 0.95));
  }, [capturedCanvas, filter, contrast, brightness, thresholdMode, binaryThreshold, adaptiveBlockSize, adaptiveC]);

  useEffect(() => {
    if (capturedCanvas) {
      applyFilter();
    }
  }, [capturedCanvas, filter, contrast, brightness, thresholdMode, binaryThreshold, adaptiveBlockSize, adaptiveC, applyFilter]);

  const resetCapture = () => {
    setCapturedCanvas(null);
    setPreviewUrl(null);
    startCamera();
  };

  const printDocument = () => {
    if (!previewUrl) return;
    
    // Create an iframe to print the document cleanly without other page elements
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      const win = window.open(previewUrl);
      if (win) {
        win.print();
      }
      return;
    }
    
    doc.write(`
      <html>
        <head>
          <title>Print Document Scan</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background-color: white;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <img src="${previewUrl}" onload="window.print(); setTimeout(function() { window.frameElement.remove(); }, 1000);" />
        </body>
      </html>
    `);
    doc.close();
  };

  const downloadImage = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `scan_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Camera className="w-6 h-6 text-green-500" />
            Document Scanner
          </h2>
          <p className="text-slate-500 text-sm mt-1">Smartly detect, crop, and enhance physical documents.</p>
        </div>
      </div>

      {!isCvLoaded ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
          <h3 className="font-bold text-slate-700">Loading Scanner Engine...</h3>
          <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">Please wait while we initialize the computer vision algorithms for smart cropping.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {!previewUrl && !stream ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer" onClick={startCamera}>
              <Camera className="w-12 h-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Start Camera</h3>
              <p className="text-sm text-slate-500 text-center mb-6">Position your document on a contrasting background for best results.</p>
            </div>
          ) : null}

          {stream && !previewUrl && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] sm:aspect-video flex items-center justify-center border border-slate-200 shadow-inner">
                {/* We use two elements: a video (hidden or under canvas) and a canvas to draw video + highlights */}
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="hidden"
                />
                <canvas 
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                />
                
                {/* Target overlay guide */}
                <div className="absolute inset-0 border-2 border-green-500/30 m-8 rounded pointer-events-none flex flex-col items-center justify-center">
                  <div className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm mb-4">
                    Align document within frame
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Capture Document
                </button>
              </div>
            </div>
          )}

          {previewUrl && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="relative aspect-[1/1.4] max-h-[60vh] mx-auto bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
                  <img 
                    src={previewUrl} 
                    alt="Scanned Document" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-green-500" /> Enhancement Presets
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => {
                      setFilter('original');
                      setContrast(1.0);
                      setBrightness(0);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${filter === 'original' ? 'border-green-500 bg-green-50' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <ImageIcon className={`w-6 h-6 mb-1 ${filter === 'original' ? 'text-green-600' : 'text-slate-400'}`} />
                    <span className={`text-xs font-bold ${filter === 'original' ? 'text-green-700' : 'text-slate-600'}`}>Original</span>
                  </button>
                  <button 
                    onClick={() => {
                      setFilter('enhanced');
                      setContrast(1.4);
                      setBrightness(15);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${filter === 'enhanced' ? 'border-green-500 bg-green-50' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <div className="relative mb-1">
                      <ImageIcon className={`w-6 h-6 ${filter === 'enhanced' ? 'text-green-600' : 'text-slate-400'}`} />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white"></div>
                    </div>
                    <span className={`text-xs font-bold ${filter === 'enhanced' ? 'text-green-700' : 'text-slate-600'}`}>Enhanced</span>
                  </button>
                  <button 
                    onClick={() => {
                      setFilter('bw');
                      setContrast(1.6);
                      setBrightness(20);
                      setThresholdMode('adaptive');
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${filter === 'bw' ? 'border-green-500 bg-green-50' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <div className="flex mb-1">
                      <div className="w-3 h-6 bg-slate-800 rounded-l"></div>
                      <div className="w-3 h-6 bg-slate-200 rounded-r"></div>
                    </div>
                    <span className={`text-xs font-bold ${filter === 'bw' ? 'text-green-700' : 'text-slate-600'}`}>B & W</span>
                  </button>
                </div>
              </div>

              {/* Detailed Adjustments Panel */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-green-500" /> Image Processing Settings
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">Fine-tune Scan</span>
                </div>

                {/* Common controls: Contrast & Brightness */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                      <span>Contrast</span>
                      <span className="font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{contrast.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.5" 
                      step="0.1" 
                      value={contrast}
                      onChange={(e) => setContrast(parseFloat(e.target.value))}
                      className="w-full accent-green-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                      <span>Brightness</span>
                      <span className="font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{brightness > 0 ? `+${brightness}` : brightness}</span>
                    </div>
                    <input 
                      type="range" 
                      min="-50" 
                      max="50" 
                      step="5" 
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full accent-green-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* B&W Specific Controls (Threshold Mode, etc.) */}
                {filter === 'bw' && (
                  <div className="pt-3 border-t border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">Thresholding Method</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['adaptive', 'otsu', 'simple'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setThresholdMode(mode)}
                            className={`py-1.5 px-2 rounded text-xs font-bold border transition-all capitalize ${
                              thresholdMode === mode 
                                ? 'bg-green-600 text-white border-green-600 shadow-sm' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {mode === 'simple' ? 'Manual' : mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Adaptive settings */}
                    {thresholdMode === 'adaptive' && (
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div>
                          <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                            <span>Block Size</span>
                            <span className="font-mono text-green-600">{adaptiveBlockSize}px</span>
                          </div>
                          <input 
                            type="range" 
                            min="3" 
                            max="99" 
                            step="2" 
                            value={adaptiveBlockSize}
                            onChange={(e) => setAdaptiveBlockSize(parseInt(e.target.value))}
                            className="w-full accent-green-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                            <span>Noise Constant C</span>
                            <span className="font-mono text-green-600">{adaptiveC}</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="30" 
                            step="1" 
                            value={adaptiveC}
                            onChange={(e) => setAdaptiveC(parseInt(e.target.value))}
                            className="w-full accent-green-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Manual Threshold settings */}
                    {thresholdMode === 'simple' && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                          <span>Cutoff Threshold</span>
                          <span className="font-mono text-green-600 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200/50">{binaryThreshold} / 255</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="255" 
                          step="1" 
                          value={binaryThreshold}
                          onChange={(e) => setBinaryThreshold(parseInt(e.target.value))}
                          className="w-full accent-green-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={resetCapture}
                  className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2 flex-1"
                >
                  <RotateCcw className="w-5 h-5" />
                  Retake
                </button>
                <button
                  onClick={printDocument}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 flex-1"
                >
                  <Printer className="w-5 h-5" />
                  Print Scan
                </button>
                <button
                  onClick={downloadImage}
                  className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2 flex-1"
                >
                  <Download className="w-5 h-5" />
                  Download Image
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
