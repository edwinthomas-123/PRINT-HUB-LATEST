import React, { useState, useRef } from 'react';
import { ArrowLeft, Image as ImageIcon, Upload, Download, Loader2, Settings, FileImage } from 'lucide-react';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

export function ImageCompressorTool({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [targetSizeKB, setTargetSizeKB] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setCompressedFile(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: targetSizeKB / 1024,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        initialQuality: 0.8,
      };

      const compressed = await imageCompression(file, options);
      setCompressedFile(compressed);
      toast.success('Image compressed successfully!');
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Failed to compress image. Please try again with different settings.');
    } finally {
      setIsCompressing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-green-500" />
            Image Compressor
          </h2>
          <p className="text-slate-500 text-sm mt-1">Reduce image file size while maintaining quality.</p>
        </div>
      </div>

      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-64 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-green-50 hover:border-green-400 transition-colors cursor-pointer"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/jpeg,image/png,image/webp" 
            className="hidden" 
          />
          <Upload className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">Upload an Image</h3>
          <p className="text-sm text-slate-500">Supports JPG, PNG, WEBP</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                {compressedFile ? (
                  <img src={URL.createObjectURL(compressedFile)} alt="Compressed" className="w-full h-full object-cover" />
                ) : (
                  <img src={URL.createObjectURL(file)} alt="Original" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 break-all">{file.name}</h4>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Original: <span className="font-semibold text-slate-700">{formatSize(file.size)}</span>
                  </span>
                  {compressedFile && (
                    <>
                      <span className="text-slate-400">→</span>
                      <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200 font-bold">
                        Compressed: {formatSize(compressedFile.size)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                setFile(null);
                setCompressedFile(null);
              }}
              className="text-sm text-slate-500 hover:text-red-500 font-medium"
            >
              Choose different file
            </button>
          </div>

          {!compressedFile && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" /> Compression Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target File Size (KB)
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="10" 
                      max="1000" 
                      step="10"
                      value={targetSizeKB}
                      onChange={(e) => setTargetSizeKB(Number(e.target.value))}
                      className="flex-1 accent-green-600"
                    />
                    <div className="w-24 flex items-center">
                      <input 
                        type="number" 
                        value={targetSizeKB}
                        onChange={(e) => setTargetSizeKB(Number(e.target.value))}
                        className="w-full text-center border border-slate-300 rounded-lg py-1.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-green-500 outline-none"
                      />
                      <span className="text-slate-500 text-sm ml-2 font-medium">KB</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    * The tool will try to compress the image below this size while preserving maximum possible quality.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            {!compressedFile ? (
              <button
                onClick={handleCompress}
                disabled={isCompressing}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Compress Image
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  const url = URL.createObjectURL(compressedFile);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `compressed_${file.name}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition"
              >
                <Download className="w-5 h-5" />
                Download Image
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
