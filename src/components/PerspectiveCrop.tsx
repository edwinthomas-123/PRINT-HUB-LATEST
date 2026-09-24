import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, RotateCcw, Maximize2, Check, Loader2, ZoomIn } from 'lucide-react';
import jscanify from 'jscanify/client';

// Solves Ax = B using Gaussian elimination
function solveLinearSystem(A: number[][], B: number[]): number[] {
  const n = B.length;
  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) {
        maxEl = Math.abs(A[k][i]);
        maxRow = k;
      }
    }
    
    const tmpA = A[maxRow];
    A[maxRow] = A[i];
    A[i] = tmpA;
    const tmpB = B[maxRow];
    B[maxRow] = B[i];
    B[i] = tmpB;

    if (A[i][i] === 0) continue; // Singular matrix check

    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          A[k][j] = 0;
        } else {
          A[k][j] += c * A[i][j];
        }
      }
      B[k] += c * B[i];
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    if (A[i][i] !== 0) {
      x[i] = (B[i] - sum) / A[i][i];
    }
  }
  return x;
}

function getPerspectiveTransform(srcPts: number[], dstPts: number[]): (x: number, y: number) => [number, number] {
  const A = [];
  const B = [];
  for (let i = 0; i < 4; i++) {
    const x = srcPts[i * 2];
    const y = srcPts[i * 2 + 1];
    const u = dstPts[i * 2];
    const v = dstPts[i * 2 + 1];

    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    B.push(u);
    B.push(v);
  }

  const h = solveLinearSystem(A, B);

  return (x: number, y: number) => {
    const divisor = h[6] * x + h[7] * y + 1;
    const u = (h[0] * x + h[1] * y + h[2]) / divisor;
    const v = (h[3] * x + h[4] * y + h[5]) / divisor;
    return [u, v];
  };
}

export interface Point {
  x: number;
  y: number;
}

interface PerspectiveCropProps {
  imageSrc: string;
  cardSideTitle?: string;
  onComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

const CORNER_LABELS = [
  'Top-Left',
  'Top-Right',
  'Bottom-Right',
  'Bottom-Left'
];

export function PerspectiveCrop({ imageSrc, cardSideTitle = 'ID Card', onComplete, onCancel }: PerspectiveCropProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const scannerRef = useRef<any>(null);
  
  const [points, setPoints] = useState<[Point, Point, Point, Point]>([
    { x: 10, y: 10 },
    { x: 90, y: 10 },
    { x: 90, y: 90 },
    { x: 10, y: 90 },
  ]);
  
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [detecting, setDetecting] = useState(false);

  // Initialize jscanify instance if available
  useEffect(() => {
    try {
      scannerRef.current = new jscanify();
    } catch (e) {
      console.warn("jscanify initialization note:", e);
    }
  }, []);

  // Standard ID Card aspect ratio: 85.6mm / 54.0mm = 1.585
  const getStandardIdPoints = (w: number, h: number): [Point, Point, Point, Point] => {
    const targetRatio = 85.6 / 54.0; // ~1.585
    let cardW = w * 0.8;
    let cardH = cardW / targetRatio;
    
    if (cardH > h * 0.8) {
      cardH = h * 0.8;
      cardW = cardH * targetRatio;
    }
    
    const marginX = (w - cardW) / 2;
    const marginY = (h - cardH) / 2;
    
    return [
      { x: marginX, y: marginY },
      { x: marginX + cardW, y: marginY },
      { x: marginX + cardW, y: marginY + cardH },
      { x: marginX, y: marginY + cardH }
    ];
  };

  // Automatic edge detection using jscanify or contrast analysis
  const autoDetectEdges = useCallback((w: number, h: number) => {
    if (!imgRef.current || !imgRef.current.complete || imgRef.current.naturalWidth <= 0) return;
    setDetecting(true);

    try {
      const naturalW = imgRef.current.naturalWidth;
      const naturalH = imgRef.current.naturalHeight;

      // Try OpenCV / jscanify
      let detectedPoints: [Point, Point, Point, Point] | null = null;
      if (scannerRef.current && (window as any).cv && (window as any).cv.Mat) {
        try {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = naturalW;
          tempCanvas.height = naturalH;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(imgRef.current, 0, 0);
            const contour = scannerRef.current.findPaperContour(tempCanvas);
            if (contour) {
              const corners = scannerRef.current.getCornerPoints(contour);
              if (corners && corners.topLeftCorner && corners.topRightCorner && corners.bottomRightCorner && corners.bottomLeftCorner) {
                const scaleX = w / naturalW;
                const scaleY = h / naturalH;
                detectedPoints = [
                  { x: Math.max(0, Math.min(w, corners.topLeftCorner.x * scaleX)), y: Math.max(0, Math.min(h, corners.topLeftCorner.y * scaleY)) },
                  { x: Math.max(0, Math.min(w, corners.topRightCorner.x * scaleX)), y: Math.max(0, Math.min(h, corners.topRightCorner.y * scaleY)) },
                  { x: Math.max(0, Math.min(w, corners.bottomRightCorner.x * scaleX)), y: Math.max(0, Math.min(h, corners.bottomRightCorner.y * scaleY)) },
                  { x: Math.max(0, Math.min(w, corners.bottomLeftCorner.x * scaleX)), y: Math.max(0, Math.min(h, corners.bottomLeftCorner.y * scaleY)) },
                ];
              }
            }
          }
        } catch (e) {
          console.warn("jscanify auto detection fallback:", e);
        }
      }

      // If OpenCV contour not detected, fallback to standard centered ID card proportion
      if (!detectedPoints) {
        detectedPoints = getStandardIdPoints(w, h);
      }

      setPoints(detectedPoints);
    } catch (err) {
      console.warn("Auto edge detection error, applying standard ratio:", err);
      setPoints(getStandardIdPoints(w, h));
    } finally {
      setDetecting(false);
    }
  }, []);

  // Set initial points when image loads
  const handleImageLoad = () => {
    if (imgRef.current && imgRef.current.complete) {
      const w = imgRef.current.clientWidth;
      const h = imgRef.current.clientHeight;
      setImgSize({ w, h });
      autoDetectEdges(w, h);
    }
  };

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      handleImageLoad();
    }
  }, [imageSrc]);

  // Update loupe canvas when dragging a handle
  const updateLoupe = (point: Point) => {
    if (!loupeCanvasRef.current || !imgRef.current) return;
    const canvas = loupeCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = imgRef.current.naturalWidth / imgSize.w;
    const scaleY = imgRef.current.naturalHeight / imgSize.h;
    const srcX = point.x * scaleX;
    const srcY = point.y * scaleY;

    const zoom = 2.5;
    const sampleSize = 60; // area to sample from natural image

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Draw magnified image
    ctx.drawImage(
      imgRef.current,
      srcX - sampleSize / 2,
      srcY - sampleSize / 2,
      sampleSize,
      sampleSize,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Crosshairs
    const midX = canvas.width / 2;
    const midY = canvas.height / 2;
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(midX - 16, midY);
    ctx.lineTo(midX + 16, midY);
    ctx.moveTo(midX, midY - 16);
    ctx.lineTo(midX, midY + 16);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(midX, midY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePointerDown = (idx: number, e: React.PointerEvent) => {
    e.preventDefault();
    setDraggingIdx(idx);
    // @ts-ignore
    e.target.setPointerCapture(e.pointerId);
    updateLoupe(points[idx]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx !== null && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, imgSize.w));
      const y = Math.max(0, Math.min(e.clientY - rect.top, imgSize.h));

      const newPoints = [...points] as [Point, Point, Point, Point];
      newPoints[draggingIdx] = { x, y };
      setPoints(newPoints);
      updateLoupe({ x, y });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingIdx !== null) {
      // @ts-ignore
      e.target.releasePointerCapture(e.pointerId);
      setDraggingIdx(null);
    }
  };

  const resetToStandard = () => {
    if (imgSize.w > 0 && imgSize.h > 0) {
      setPoints(getStandardIdPoints(imgSize.w, imgSize.h));
    }
  };

  const expandToFit = () => {
    if (imgSize.w > 0 && imgSize.h > 0) {
      const pad = 12;
      setPoints([
        { x: pad, y: pad },
        { x: imgSize.w - pad, y: pad },
        { x: imgSize.w - pad, y: imgSize.h - pad },
        { x: pad, y: imgSize.h - pad }
      ]);
    }
  };

  const handleCrop = () => {
    if (!imgRef.current) return;
    setProcessing(true);

    setTimeout(() => {
      try {
        const scaleX = imgRef.current!.naturalWidth / imgSize.w;
        const scaleY = imgRef.current!.naturalHeight / imgSize.h;

        const srcPts = points.flatMap(p => [p.x * scaleX, p.y * scaleY]);

        // Destination size for standard ID card at high clarity (1024 x 646 ~ 1.585)
        const destW = 1024;
        const destH = 646;
        const destPts = [0, 0, destW, 0, destW, destH, 0, destH];

        const transform = getPerspectiveTransform(destPts, srcPts);

        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = imgRef.current!.naturalWidth;
        srcCanvas.height = imgRef.current!.naturalHeight;
        const srcCtx = srcCanvas.getContext('2d');
        if (!srcCtx) throw new Error("Failed to get context");

        srcCtx.drawImage(imgRef.current!, 0, 0, srcCanvas.width, srcCanvas.height);
        const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

        const destCanvas = document.createElement('canvas');
        destCanvas.width = destW;
        destCanvas.height = destH;
        const destCtx = destCanvas.getContext('2d');
        if (!destCtx) throw new Error("Failed to get context");

        const destData = destCtx.createImageData(destW, destH);

        for (let y = 0; y < destH; y++) {
          for (let x = 0; x < destW; x++) {
            const pt = transform(x, y);
            const u = Math.floor(pt[0]);
            const v = Math.floor(pt[1]);

            if (u >= 0 && u < srcCanvas.width && v >= 0 && v < srcCanvas.height) {
              const srcIdx = (v * srcCanvas.width + u) * 4;
              const destIdx = (y * destW + x) * 4;
              destData.data[destIdx] = srcData.data[srcIdx];
              destData.data[destIdx + 1] = srcData.data[srcIdx + 1];
              destData.data[destIdx + 2] = srcData.data[srcIdx + 2];
              destData.data[destIdx + 3] = 255;
            }
          }
        }

        destCtx.putImageData(destData, 0, 0);
        onComplete(destCanvas.toDataURL('image/jpeg', 0.96));
      } catch (err) {
        console.error("Perspective crop error:", err);
      } finally {
        setProcessing(false);
      }
    }, 50);
  };

  return (
    <div className="flex flex-col items-center space-y-5 max-w-4xl mx-auto w-full">
      {/* Header with Title and Quick Actions */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <h3 className="text-base font-bold text-slate-900">
              Align {cardSideTitle} Corners
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag the 4 corner dots to match the edges of your card.
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => autoDetectEdges(imgSize.w, imgSize.h)}
            disabled={detecting || imgSize.w === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition border border-indigo-200 disabled:opacity-50 cursor-pointer"
            title="Automatically detect card edges"
          >
            {detecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>Auto-Detect Edges</span>
          </button>

          <button
            type="button"
            onClick={resetToStandard}
            disabled={imgSize.w === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition border border-slate-200 cursor-pointer"
            title="Reset to 85.6mm x 54mm ID Card Ratio"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Standard Ratio</span>
          </button>

          <button
            type="button"
            onClick={expandToFit}
            disabled={imgSize.w === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition border border-slate-200 cursor-pointer"
            title="Expand to Full Frame"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Full Image</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div 
        ref={containerRef}
        className="relative inline-block touch-none select-none border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-950 shadow-md max-w-full"
        onPointerMove={handlePointerMove}
      >
        <img 
          ref={imgRef}
          src={imageSrc} 
          alt="ID Card for crop" 
          onLoad={handleImageLoad}
          className="block touch-none select-none"
          style={{ maxWidth: '100%', maxHeight: '62vh' }}
          draggable={false}
        />
        
        {/* Polygon & Diagonal Grid Lines */}
        {imgSize.w > 0 && (
          <svg 
            className="absolute inset-0 pointer-events-none" 
            width={imgSize.w} 
            height={imgSize.h}
          >
            <defs>
              <linearGradient id="polyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.18" />
              </linearGradient>
            </defs>
            {/* Filled polygon */}
            <polygon 
              points={points.map(p => `${p.x},${p.y}`).join(' ')} 
              fill="url(#polyGrad)"
              stroke="#4f46e5"
              strokeWidth="2.5"
            />
            {/* Guide diagonals */}
            <line 
              x1={points[0].x} y1={points[0].y} 
              x2={points[2].x} y2={points[2].y} 
              stroke="rgba(255,255,255,0.25)" 
              strokeWidth="1" 
              strokeDasharray="3 3" 
            />
            <line 
              x1={points[1].x} y1={points[1].y} 
              x2={points[3].x} y2={points[3].y} 
              stroke="rgba(255,255,255,0.25)" 
              strokeWidth="1" 
              strokeDasharray="3 3" 
            />
          </svg>
        )}
        
        {/* Interactive Corner Dots with Touch Target & Glow */}
        {imgSize.w > 0 && points.map((p, idx) => {
          const isDragging = draggingIdx === idx;
          return (
            <div
              key={idx}
              onPointerDown={(e) => handlePointerDown(idx, e)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`absolute -ml-5 -mt-5 w-10 h-10 rounded-full cursor-move z-20 flex items-center justify-center transition-transform ${
                isDragging ? 'scale-125' : 'hover:scale-110'
              }`}
              style={{ 
                left: p.x, 
                top: p.y,
                touchAction: 'none'
              }}
            >
              {/* Outer pulsing ring */}
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg backdrop-blur-xs transition-colors ${
                isDragging 
                  ? 'bg-indigo-600 border-white text-white shadow-indigo-500/50' 
                  : 'bg-white/95 border-indigo-600 text-indigo-700 shadow-black/40'
              }`}>
                {/* Center dot / number */}
                <span className="text-[10px] font-black leading-none select-none">
                  {idx + 1}
                </span>
              </div>

              {/* Corner Name Badge */}
              <div className={`absolute pointer-events-none whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm transition-opacity ${
                idx === 0 ? '-top-5 -left-2' :
                idx === 1 ? '-top-5 -right-2' :
                idx === 2 ? '-bottom-5 -right-2' :
                '-bottom-5 -left-2'
              } ${
                isDragging ? 'bg-indigo-600 text-white opacity-100' : 'bg-slate-900/80 text-white/90 opacity-0 group-hover:opacity-100'
              }`}>
                {CORNER_LABELS[idx]}
              </div>
            </div>
          );
        })}

        {/* Floating Magnifier Loupe when dragging a point */}
        <div 
          className={`absolute top-3 right-3 z-30 transition-all duration-200 pointer-events-none ${
            draggingIdx !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <div className="bg-slate-900/90 p-1.5 rounded-2xl border-2 border-indigo-400 shadow-2xl backdrop-blur-md flex flex-col items-center">
            <canvas 
              ref={loupeCanvasRef} 
              width={96} 
              height={96} 
              className="rounded-xl bg-black border border-slate-700"
            />
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-indigo-200">
              <ZoomIn className="w-3 h-3 text-indigo-400" />
              <span>{draggingIdx !== null ? CORNER_LABELS[draggingIdx] : '2.5x'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Helpful Hint */}
      <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
        <span>Standard credit/ID card format (85.6mm × 54mm) will be rendered on A4 sheet</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button 
          type="button"
          onClick={onCancel} 
          disabled={processing}
          className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm cursor-pointer"
        >
          Cancel
        </button>
        <button 
          type="button"
          onClick={handleCrop} 
          disabled={processing || imgSize.w === 0}
          className="px-7 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-md cursor-pointer disabled:opacity-50"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing Perspective...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Confirm & Apply Crop</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
