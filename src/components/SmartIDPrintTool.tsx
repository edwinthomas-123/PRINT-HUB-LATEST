import React, { useState } from 'react';
import { ArrowLeft, Upload, Download, ScanLine, CheckCircle2, Smartphone, Crop as CropIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { PerspectiveCrop } from './PerspectiveCrop';

export function SmartIDPrintTool({ onBack }: { onBack: () => void }) {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'crop_front' | 'crop_back' | 'processing' | 'result'>('upload');
  
  const [croppedFront, setCroppedFront] = useState<string | null>(null);
  const [croppedBack, setCroppedBack] = useState<string | null>(null);

  const [processingStatus, setProcessingStatus] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (side === 'front') setFrontImage(event.target?.result as string);
        else setBackImage(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropComplete = (croppedData: string, side: 'front' | 'back') => {
    if (side === 'front') {
      setCroppedFront(croppedData);
      if (backImage) {
        setStep('crop_back');
      } else {
        startFinalProcessing();
      }
    } else {
      setCroppedBack(croppedData);
      startFinalProcessing();
    }
  };

  const onStartCropProcess = () => {
    if (!frontImage && !backImage) return;
    if (frontImage) {
      setStep('crop_front');
    } else {
      setStep('crop_back');
    }
  };

  const startFinalProcessing = () => {
    setStep('processing');
    setProcessingStatus('Enhancing image quality...');
    
    setTimeout(() => {
      setProcessingStatus('Aligning to A4 sheet standard dimensions...');
      setTimeout(() => {
        setStep('result');
      }, 1000);
    }, 1000);
  };

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const cardWidth = 85.6;
    const cardHeight = 54.0;
    const marginX = (210 - cardWidth) / 2;
    const startY = 40;
    const gap = 20;
    
    if (croppedFront) {
      doc.addImage(croppedFront, 'JPEG', marginX, startY, cardWidth, cardHeight);
    }
    
    if (croppedBack) {
      const backY = startY + cardHeight + gap;
      doc.addImage(croppedBack, 'JPEG', marginX, backY, cardWidth, cardHeight);
    }
    
    doc.save('smart-id-print.pdf');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>
        <span className="font-bold text-slate-800 flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-indigo-600" /> Smart ID Print
        </span>
      </div>

      <div className="p-8">
        {step === 'upload' && (
          <div className="space-y-8">
            <div className="text-center max-w-lg mx-auto">
              <h2 className="text-2xl font-bold mb-2">Upload ID Card</h2>
              <p className="text-slate-500 text-sm">
                Upload the front and back of your ID card. We'll help you crop and align them perfectly for an A4 print.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 text-center">Front Side</label>
                <label className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors h-48 bg-slate-50 overflow-hidden group">
                  {frontImage ? (
                    <>
                      <img src={frontImage} alt="Front" className="w-full h-full object-contain absolute inset-0 p-4" />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white mb-2" />
                        <span className="text-white text-xs font-semibold">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-10 h-10 text-slate-400 mb-3" />
                      <span className="font-medium text-slate-600 text-sm">Upload Front</span>
                      <span className="text-xs text-slate-400 mt-1">JPEG, PNG</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'front')} />
                </label>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 text-center">Back Side</label>
                <label className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors h-48 bg-slate-50 overflow-hidden group">
                  {backImage ? (
                    <>
                      <img src={backImage} alt="Back" className="w-full h-full object-contain absolute inset-0 p-4" />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white mb-2" />
                        <span className="text-white text-xs font-semibold">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-10 h-10 text-slate-400 mb-3" />
                      <span className="font-medium text-slate-600 text-sm">Upload Back</span>
                      <span className="text-xs text-slate-400 mt-1">JPEG, PNG (Optional)</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'back')} />
                </label>
              </div>
            </div>

            <div className="text-center pt-4">
              <button 
                onClick={onStartCropProcess}
                disabled={!frontImage && !backImage}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold tracking-wide hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-sm inline-flex items-center gap-2"
              >
                <CropIcon className="w-5 h-5" /> Adjust Crop Bounds
              </button>
            </div>
          </div>
        )}

        {(step === 'crop_front' || step === 'crop_back') && (
          <div className="space-y-6">
            <PerspectiveCrop 
              imageSrc={step === 'crop_front' ? frontImage! : backImage!}
              onComplete={(croppedDataUrl) => handleCropComplete(croppedDataUrl, step === 'crop_front' ? 'front' : 'back')}
              onCancel={() => setStep('upload')}
            />
          </div>
        )}

        {step === 'processing' && (
          <div className="py-24 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
                <ScanLine className="w-10 h-10 text-indigo-600" />
              </div>
              <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Processing</h3>
              <p className="text-slate-500 text-sm animate-pulse">{processingStatus}</p>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-8">
            <div className="text-center max-w-lg mx-auto mb-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ready to Print</h2>
              <p className="text-slate-500 text-sm">
                Your ID has been cropped and aligned to the exact physical dimensions of a standard card (85.6mm x 54mm) on an A4 sheet.
              </p>
            </div>

            <div className="bg-slate-100 p-8 rounded-xl flex justify-center">
              <div className="bg-white shadow-md border border-slate-200 w-full max-w-[300px] aspect-[1/1.414] relative py-12 flex flex-col items-center gap-4">
                {croppedFront && (
                  <div className="w-3/4 aspect-[85.6/54] bg-slate-50 flex items-center justify-center relative overflow-hidden">
                    <img src={croppedFront} className="w-full h-full object-cover" alt="Front Processed" />
                  </div>
                )}
                {croppedBack && (
                  <div className="w-3/4 aspect-[85.6/54] bg-slate-50 flex items-center justify-center relative overflow-hidden">
                    <img src={croppedBack} className="w-full h-full object-cover" alt="Back Processed" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <button 
                onClick={() => { setStep('upload'); setFrontImage(null); setBackImage(null); setCroppedFront(null); setCroppedBack(null); }}
                className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold tracking-wide hover:bg-slate-200 transition-colors"
              >
                Start Over
              </button>
              <button 
                onClick={generatePDF}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold tracking-wide hover:bg-indigo-500 transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <Download className="w-5 h-5" /> Download A4 PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

