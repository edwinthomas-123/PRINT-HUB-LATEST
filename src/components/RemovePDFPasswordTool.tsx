import React, { useState, useRef } from 'react';
import { ArrowLeft, KeyRound, Upload, Download, Loader2, FileText, LockOpen } from 'lucide-react';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';

export function RemovePDFPasswordTool({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockedPdfBytes, setUnlockedPdfBytes] = useState<Uint8Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUnlockedPdfBytes(null);
      setError(null);
      setPassword('');
    }
  };

  const handleUnlock = async () => {
    if (!file) return;

    if (!password) {
      setError("Please enter a password to unlock the PDF.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      
      const decryptedBytes = await decryptPDF(pdfBytes, password);
      
      setUnlockedPdfBytes(decryptedBytes);
    } catch (err: any) {
      console.error('Error unlocking PDF:', err);
      if (err === 'Incorrect password' || (err.message && err.message.includes('Incorrect password'))) {
        setError('Incorrect password. Please try again.');
      } else if (err === 'This PDF is not encrypted' || (err.message && err.message.includes('not encrypted'))) {
        setError('This PDF is not encrypted. You can open it without a password.');
      } else {
        setError(`Failed to unlock PDF: ${err.message || err}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-orange-500" />
            Remove PDF Password
          </h2>
          <p className="text-slate-500 text-sm mt-1">Unlock a PDF file so it can be printed or viewed without a password.</p>
        </div>
      </div>

      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-64 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-orange-50 hover:border-orange-400 transition-colors cursor-pointer"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf" 
            className="hidden" 
          />
          <Upload className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">Select a PDF File</h3>
          <p className="text-sm text-slate-500">Only PDF format is supported</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                <FileText className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 break-all">{file.name}</h4>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                setFile(null);
                setUnlockedPdfBytes(null);
                setPassword('');
                setError(null);
              }}
              className="text-sm text-slate-500 hover:text-red-500 font-medium whitespace-nowrap"
            >
              Choose different file
            </button>
          </div>

          {!unlockedPdfBytes ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <label className="block text-sm font-bold text-slate-800 mb-3">
                Enter PDF Password
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlock();
                }}
                placeholder="Password required to open this PDF..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-shadow mb-2"
                disabled={isProcessing}
              />
              
              {error && (
                <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <LockOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-green-800">PDF successfully unlocked!</h4>
                <p className="text-sm text-green-700 mt-1">
                  The password has been removed. You can now download and print the file without any restrictions.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            {!unlockedPdfBytes ? (
              <button
                onClick={handleUnlock}
                disabled={isProcessing || !password}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <LockOpen className="w-5 h-5" />
                    Unlock PDF
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  const blob = new Blob([unlockedPdfBytes], { type: 'application/pdf' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `unlocked_${file.name}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition"
              >
                <Download className="w-5 h-5" />
                Download Unlocked PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
