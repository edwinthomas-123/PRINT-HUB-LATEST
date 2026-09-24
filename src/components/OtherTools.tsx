import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, X, Loader2, UploadCloud, Download, QrCode, ScanBarcode } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import imageCompression from 'browser-image-compression';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { jsPDF } from 'jspdf';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ToolLayoutSplit } from './ToolLayoutSplit';

export function GenericMockTool({ name, desc, btnLabel, onBack }: { name: string, desc: string, icon: any, btnLabel: string, onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [outputName, setOutputName] = useState('processed');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const handleDownload = () => {
    if (!previewUrl || !file) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `${outputName}.${file.name.split('.').pop()}`;
    link.click();
  };

  const controls = (
    <div className="space-y-6">
      <label className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-8 hover:border-indigo-600 cursor-pointer transition-all">
        <UploadCloud className="w-8 h-8 text-indigo-600 mb-2" />
        <h3 className="font-bold text-slate-900">Upload File</h3>
        <p className="text-xs text-slate-500 mt-1 text-center">Click to browse</p>
        <input className="hidden" type="file" onChange={handleFile} />
      </label>
      {file && (
        <div className="p-3 border border-slate-200 rounded bg-white text-sm truncate">
          {file.name}
        </div>
      )}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Output Filename</label>
        <input 
          type="text" 
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
        />
      </div>
      <button 
        onClick={handleDownload}
        disabled={!previewUrl}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
      >
        <Download className="w-5 h-5" /> {btnLabel}
      </button>
    </div>
  );

  return (
    <ToolLayoutSplit 
      title={name} 
      description={desc}
      onBack={onBack}
      controls={controls}
      previewUrl={previewUrl}
      previewType={file?.type.startsWith('image/') ? 'image' : 'pdf'}
    />
  );
}

export function QRGeneratorTool({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState('https://example.com');
  const [outputName, setOutputName] = useState('qrcode');

  const downloadQR = () => {
    const svg = document.getElementById("qr-code-svg")?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${outputName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const controls = (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">URL or Text</label>
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" 
          placeholder="Enter text to encode" 
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Output Filename</label>
        <input 
          type="text" 
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" 
        />
      </div>
      <button onClick={downloadQR} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition flex justify-center items-center gap-2">
        <Download className="w-5 h-5" /> Download QR
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F4F5F7] -m-6 md:-m-10">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">QR Code Generator</h1>
            <p className="text-sm text-slate-500">Generate a QR code from text or URL.</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="w-full lg:w-[350px] xl:w-[400px] bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto p-6 shrink-0 z-10 relative shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
          {controls}
        </div>
        
        <div className="flex-1 bg-slate-100 flex flex-col p-4 md:p-6 overflow-hidden relative">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden relative">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">visibility</span>
                Live Preview
              </h3>
            </div>
            <div className="flex-1 bg-slate-200/50 p-2 md:p-4 overflow-hidden relative flex flex-col items-center justify-center">
              <div className="p-8 bg-white shadow rounded-xl border border-slate-200" id="qr-code-svg">
                <QRCodeSVG value={text || 'https://example.com'} size={250} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BarcodeGeneratorTool({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState('123456789012');
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F4F5F7] -m-6 md:-m-10">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Barcode Generator</h1>
            <p className="text-sm text-slate-500">Generate 1D barcodes.</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="w-full lg:w-[350px] xl:w-[400px] bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto p-6 shrink-0 z-10 relative shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Barcode Value</label>
              <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="Enter alphanumeric value" />
            </div>
            <p className="text-xs text-slate-500">Right click the barcode and select "Save Image As..." to save.</p>
          </div>
        </div>
        <div className="flex-1 bg-slate-100 flex flex-col p-4 md:p-6 overflow-hidden relative">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden relative">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">visibility</span>
                Live Preview
              </h3>
            </div>
            <div className="flex-1 bg-slate-200/50 p-2 md:p-4 overflow-hidden relative flex flex-col items-center justify-center">
              <div className="p-8 bg-white shadow rounded-xl border border-slate-200">
                <Barcode value={text || ' '} background="#ffffff" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImageToPDFTool({ onBack }: { onBack: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [outputName, setOutputName] = useState('images');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (files.length > 0) {
      setPreviewUrl(URL.createObjectURL(files[0]));
    } else {
      setPreviewUrl(null);
    }
  }, [files]);

  const handleProcess = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const doc = new jsPDF();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imgData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        
        if (i > 0) doc.addPage();
        
        const props = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (props.height * pdfWidth) / props.width;
        
        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
      doc.save(`${outputName}.pdf`);
      toast.success('PDF created successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Error converting images to PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const controls = (
    <div className="space-y-6">
      <label className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-8 hover:border-indigo-600 cursor-pointer transition-all">
        <UploadCloud className="w-8 h-8 text-indigo-600 mb-2" />
        <h3 className="font-bold text-slate-900">Upload Images</h3>
        <p className="text-xs text-slate-500 mt-1 text-center">Drag & drop or click to browse</p>
        <input accept="image/*" className="hidden" multiple type="file" onChange={handleFiles} />
      </label>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-700 text-sm flex justify-between items-center">
            <span>Images ({files.length})</span>
            <button onClick={() => setFiles([])} className="text-xs text-indigo-600 hover:text-indigo-800">Clear all</button>
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-2 border border-slate-200 rounded bg-white text-sm">
                <span className="truncate flex-1">{f.name}</span>
                <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Output Filename</label>
        <input 
          type="text" 
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
        />
      </div>

      <button 
        onClick={handleProcess}
        disabled={files.length === 0 || loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        {loading ? 'Processing...' : 'Download PDF'}
      </button>
    </div>
  );

  return (
    <ToolLayoutSplit 
      title="Image to PDF" 
      description="Convert multiple images into a single PDF."
      onBack={onBack}
      controls={controls}
      previewUrl={previewUrl}
      previewType="image"
    />
  );
}


export function WatermarkPDFTool({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [watermark, setWatermark] = useState('CONFIDENTIAL');
  const [outputName, setOutputName] = useState('watermarked');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();
        page.drawText(watermark, {
          x: width / 4,
          y: height / 2,
          size: 50,
          color: rgb(0.7, 0.7, 0.7),
          rotate: degrees(45),
          opacity: 0.5,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${outputName}.pdf`;
      link.click();
      toast.success('Watermark added successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add watermark.');
    } finally {
      setLoading(false);
    }
  };

  const controls = (
    <div className="space-y-6">
      <label className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-8 hover:border-indigo-600 cursor-pointer transition-all">
        <UploadCloud className="w-8 h-8 text-indigo-600 mb-2" />
        <h3 className="font-bold text-slate-900">Upload PDF</h3>
        <p className="text-xs text-slate-500 mt-1 text-center">Click to browse</p>
        <input accept=".pdf" className="hidden" type="file" onChange={handleFile} />
      </label>
      {file && (
        <div className="p-3 border border-slate-200 rounded bg-white text-sm truncate">
          {file.name}
        </div>
      )}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Watermark Text</label>
        <input 
          type="text" 
          value={watermark}
          onChange={(e) => setWatermark(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Output Filename</label>
        <input 
          type="text" 
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
        />
      </div>
      <button 
        onClick={handleProcess}
        disabled={!file || loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        {loading ? 'Processing...' : 'Add Watermark'}
      </button>
    </div>
  );

  return (
    <ToolLayoutSplit 
      title="Watermark PDF" 
      description="Add a text watermark to your PDF."
      onBack={onBack}
      controls={controls}
      previewUrl={previewUrl}
      previewType="pdf"
    />
  );
}

export function DigitalSignatureTool({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [signerName, setSignerName] = useState('');
  const [outputName, setOutputName] = useState('signed');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetPage, setTargetPage] = useState<'first' | 'last' | 'all' | 'custom'>('last');
  const [customPage, setCustomPage] = useState('1');
  const [position, setPosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center'>('bottom-right');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();
      
      let pagesToSign: number[] = [];
      if (targetPage === 'all') {
        pagesToSign = pages.map((_, i) => i);
      } else if (targetPage === 'first') {
        pagesToSign = [0];
      } else if (targetPage === 'last') {
        pagesToSign = [pages.length - 1];
      } else if (targetPage === 'custom') {
        const pageIdx = parseInt(customPage, 10) - 1;
        if (!isNaN(pageIdx) && pageIdx >= 0 && pageIdx < pages.length) {
          pagesToSign = [pageIdx];
        }
      }

      // Get signature image from canvas
      const canvas = canvasRef.current;
      let signatureImage: any = null;
      let sigWidth = 0, sigHeight = 0;

      if (canvas) {
         const dataUrl = canvas.toDataURL('image/png');
         const imageBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
         signatureImage = await pdfDoc.embedPng(imageBytes);
         const scale = signatureImage.scale(0.5);
         sigWidth = scale.width;
         sigHeight = scale.height;
      }

      for (const pageIdx of pagesToSign) {
        const page = pages[pageIdx];
        const { width, height } = page.getSize();
        
        let x = 50, y = 50;
        const margin = 50;
        
        if (position === 'bottom-left') {
          x = margin; y = margin;
        } else if (position === 'bottom-right') {
          x = width - sigWidth - margin; y = margin;
        } else if (position === 'top-left') {
          x = margin; y = height - sigHeight - margin;
        } else if (position === 'top-right') {
          x = width - sigWidth - margin; y = height - sigHeight - margin;
        } else if (position === 'center') {
          x = (width - sigWidth) / 2; y = (height - sigHeight) / 2;
        }

        if (signatureImage) {
          page.drawImage(signatureImage, {
            x, y, width: sigWidth, height: sigHeight,
          });
        }

        if (signerName) {
          page.drawText(`Signed by: ${signerName}`, {
            x, y: y - 15,
            size: 10,
            color: rgb(0,0,0)
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${outputName}.pdf`;
      link.click();
      toast.success('Digital signature applied!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add signature.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     const canvas = canvasRef.current;
     if (!canvas) return;
     const ctx = canvas.getContext('2d');
     if (!ctx) return;
     
     let isDrawing = false;
     
     // Smooth drawing configuration
     ctx.lineWidth = 2.5;
     ctx.lineCap = 'round';
     ctx.lineJoin = 'round';
     ctx.strokeStyle = '#0f172a'; // dark slate
     
     const getCoords = (e: MouseEvent | TouchEvent) => {
        let clientX = 0, clientY = 0;
        if (e instanceof MouseEvent) {
          clientX = e.clientX; clientY = e.clientY;
        } else if (e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
        }
        const rect = canvas.getBoundingClientRect();
        return { x: clientX - rect.left, y: clientY - rect.top };
     };
     
     const startDrawing = (e: MouseEvent | TouchEvent) => {
        isDrawing = true;
        const { x, y } = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        e.preventDefault();
     };
     
     const stopDrawing = () => {
        if (!isDrawing) return;
        isDrawing = false;
        ctx.closePath();
     };
     
     const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const { x, y } = getCoords(e);
        ctx.lineTo(x, y);
        ctx.stroke();
     };
     
     canvas.addEventListener('mousedown', startDrawing);
     canvas.addEventListener('mousemove', draw);
     canvas.addEventListener('mouseup', stopDrawing);
     canvas.addEventListener('mouseout', stopDrawing);
     
     canvas.addEventListener('touchstart', startDrawing, { passive: false });
     canvas.addEventListener('touchmove', draw, { passive: false });
     canvas.addEventListener('touchend', stopDrawing);

     return () => {
       canvas.removeEventListener('mousedown', startDrawing);
       canvas.removeEventListener('mousemove', draw);
       canvas.removeEventListener('mouseup', stopDrawing);
       canvas.removeEventListener('mouseout', stopDrawing);
       canvas.removeEventListener('touchstart', startDrawing);
       canvas.removeEventListener('touchmove', draw);
       canvas.removeEventListener('touchend', stopDrawing);
     };
  }, []);

  const clearCanvas = () => {
     const canvas = canvasRef.current;
     if (canvas) {
       const ctx = canvas.getContext('2d');
       ctx?.clearRect(0, 0, canvas.width, canvas.height);
     }
  };

  const controls = (
    <div className="space-y-6">
      <label className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-6 hover:border-indigo-600 cursor-pointer transition-all">
        <UploadCloud className="w-8 h-8 text-indigo-600 mb-2" />
        <h3 className="font-bold text-slate-900">Upload PDF</h3>
        <p className="text-xs text-slate-500 mt-1 text-center">Click to browse</p>
        <input accept=".pdf" className="hidden" type="file" onChange={handleFile} />
      </label>
      
      {file && (
        <div className="p-2 border border-slate-200 rounded bg-white text-xs truncate font-medium text-slate-700">
          {file.name}
        </div>
      )}
      
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold text-slate-700">Draw Signature</label>
            <button onClick={clearCanvas} className="text-xs text-indigo-600 font-semibold hover:text-indigo-800">Clear</button>
          </div>
          <div className="border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm">
            <canvas ref={canvasRef} width={350} height={150} className="w-full h-[150px] touch-none cursor-crosshair bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAnIGhlaWdodD0nMTAwJz48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWxsPSdub25lJyBzdHJva2U9JyNlMmU4ZjAnIHN0cm9rZS13aWR0aD0nMicgc3Ryb2tlLWRhc2hhcnJheT0nNSA1Jy8+PC9zdmc+')] bg-repeat" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Signer Name (Optional)</label>
          <input 
            type="text" 
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Page</label>
            <select 
              value={targetPage} 
              onChange={e => setTargetPage(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
            >
              <option value="first">First Page</option>
              <option value="last">Last Page</option>
              <option value="all">All Pages</option>
              <option value="custom">Custom Page...</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Position</label>
            <select 
              value={position} 
              onChange={e => setPosition(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
              <option value="center">Center</option>
            </select>
          </div>
        </div>

        {targetPage === 'custom' && (
           <div className="space-y-2">
             <label className="block text-sm font-medium text-slate-700">Page Number</label>
             <input 
               type="number" 
               min="1"
               value={customPage}
               onChange={(e) => setCustomPage(e.target.value)}
               className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
             />
           </div>
        )}
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200">
        <label className="block text-sm font-medium text-slate-700">Output Filename</label>
        <input 
          type="text" 
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
        />
      </div>

      <button 
        onClick={handleProcess}
        disabled={!file || loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-sm"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        {loading ? 'Processing...' : 'Sign & Download'}
      </button>
    </div>
  );

  return (
    <ToolLayoutSplit 
      title="Digital Signature" 
      description="Draw your signature and place it securely on your PDF."
      onBack={onBack}
      controls={controls}
      previewUrl={previewUrl}
      previewType="pdf"
    />
  );
}

// Fallback all others to GenericMockTool
export const RotatePDFTool = (props: any) => <GenericMockTool {...props} name="Rotate PDF" desc="Rotate pages in your PDF." icon={null} btnLabel="Rotate PDF" />;
export function CompressPDFTool({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [outputName, setOutputName] = useState('compressed_document');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setOriginalSize(e.target.files[0].size);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fileBuffer = await file.arrayBuffer();
      // Load PDF, and then save with useObjectStreams to compress metadata/structure
      const pdfDoc = await PDFDocument.load(fileBuffer);
      
      // Save it with object streams which reduces size losslessly
      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setCompressedSize(blob.size);
      
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${outputName}.pdf`;
      link.click();
      toast.success('PDF compressed successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to compress PDF.');
    } finally {
      setLoading(false);
    }
  };

  const controls = (
    <div className="space-y-6">
      <label className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-8 hover:border-indigo-600 cursor-pointer transition-all">
        <UploadCloud className="w-8 h-8 text-indigo-600 mb-2" />
        <h3 className="font-bold text-slate-900">Upload PDF</h3>
        <p className="text-xs text-slate-500 mt-1 text-center">Click to browse</p>
        <input accept=".pdf" className="hidden" type="file" onChange={handleFile} />
      </label>
      
      {file && (
        <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex flex-col gap-1 text-sm">
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-700 truncate">{file.name}</span>
            <button onClick={() => { setFile(null); setOriginalSize(0); setCompressedSize(0); }} className="text-slate-400 hover:text-red-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <span className="text-xs text-slate-500">Original Size: {(originalSize / 1024 / 1024).toFixed(2)} MB</span>
          {compressedSize > 0 && (
             <span className="text-xs text-emerald-600 font-semibold">Compressed: {(compressedSize / 1024 / 1024).toFixed(2)} MB</span>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Output Filename</label>
        <input 
          type="text" 
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
        />
      </div>

      <button 
        onClick={handleProcess}
        disabled={!file || loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        {loading ? 'Compressing...' : 'Compress & Download Lossless'}
      </button>
    </div>
  );

  return (
    <ToolLayoutSplit 
      title="Compress PDF" 
      description="Reduce your PDF file size losslessly using object streams compression."
      onBack={onBack}
      controls={controls}
      previewUrl={previewUrl}
      previewType="pdf"
    />
  );
}
export const ShopLayoutTool = (props: any) => <GenericMockTool {...props} name="Shop Layout" desc="Design shop layout." icon={null} btnLabel="Save Layout" />;
export function PassportPhotoTool({ onBack, initialImage }: { onBack: () => void; initialImage?: string | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  
  const [photoSizePreset, setPhotoSizePreset] = useState<'indian' | 'indian_alt' | 'us' | 'stamp' | 'custom'>('indian');
  const [customPhotoWidth, setCustomPhotoWidth] = useState<number>(3.5);
  const [customPhotoHeight, setCustomPhotoHeight] = useState<number>(4.5);
  
  const [pageSizePreset, setPageSizePreset] = useState<'a4' | '6x4' | '7x5' | '8x6'>('a4');
  const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');
  
  const [copies, setCopies] = useState<number>(8);
  const [maxCapacity, setMaxCapacity] = useState<number>(35);
  
  const [outlineColor, setOutlineColor] = useState<string>('#cccccc'); // Gray default outline
  const [customOutlineColor, setCustomOutlineColor] = useState<string>('#000000');
  const [outlineWidth, setOutlineWidth] = useState<number>(2); // 2px border default
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>('passport-grid');
  const [loading, setLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
    }
  };

  useEffect(() => {
    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        setImageElement(img);
      };
      img.src = initialImage;
      const mockFile = new File([new Blob()], "ai-passport-photo.jpg", { type: "image/jpeg" });
      setFile(mockFile);
    }
  }, [initialImage]);

  useEffect(() => {
    if (!file) {
      setImageElement(null);
      return;
    }
    
    if (file.name === "ai-passport-photo.jpg" && file.size === 0) {
      // It's the initialized mock file, imageElement is already being loaded from initialImage
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setImageElement(img);
    };
    img.src = url;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const getPhotoDimensions = () => {
    if (photoSizePreset === 'indian') return { w: 35, h: 45 }; // 3.5x4.5 cm
    if (photoSizePreset === 'indian_alt') return { w: 33, h: 43 }; // 3.3x4.3 cm
    if (photoSizePreset === 'stamp') return { w: 25, h: 35 }; // 2.5x3.5 cm
    if (photoSizePreset === 'us') return { w: 50.8, h: 50.8 }; // 2x2 inch
    return { w: (Number(customPhotoWidth) || 3.5) * 10, h: (Number(customPhotoHeight) || 4.5) * 10 };
  };

  const getPageDimensions = () => {
    let w = 210;
    let h = 297;
    if (pageSizePreset === '6x4') { w = 152.4; h = 101.6; }
    else if (pageSizePreset === '7x5') { w = 177.8; h = 127; }
    else if (pageSizePreset === '8x6') { w = 203.2; h = 152.4; }

    if (orientation === 'Landscape') {
      return { w: Math.max(w, h), h: Math.min(w, h) };
    } else {
      return { w: Math.min(w, h), h: Math.max(w, h) };
    }
  };

  // Update maxCapacity
  useEffect(() => {
    const { w: photoW, h: photoH } = getPhotoDimensions();
    const { w: pageW, h: pageH } = getPageDimensions();

    const DPI = 300;
    const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI);

    const canvasWidth = mmToPx(pageW);
    const canvasHeight = mmToPx(pageH);
    const itemW = mmToPx(photoW);
    const itemH = mmToPx(photoH);
    const margin = mmToPx(6); // 6mm margin
    const gap = mmToPx(3);    // 3mm gap

    const cols = Math.floor((canvasWidth - margin * 2 + gap) / (itemW + gap));
    const rows = Math.floor((canvasHeight - margin * 2 + gap) / (itemH + gap));
    const cap = Math.max(0, cols * rows);
    
    setMaxCapacity(cap);
    if (copies > cap && cap > 0) {
      setCopies(cap);
    }
  }, [photoSizePreset, customPhotoWidth, customPhotoHeight, pageSizePreset, orientation]);

  // Generate preview live
  useEffect(() => {
    if (!imageElement) {
      setPreviewUrl(null);
      return;
    }

    const { w: photoW, h: photoH } = getPhotoDimensions();
    const { w: pageW, h: pageH } = getPageDimensions();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPI = 300;
    const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI);

    const canvasWidth = mmToPx(pageW);
    const canvasHeight = mmToPx(pageH);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const itemW = mmToPx(photoW);
    const itemH = mmToPx(photoH);
    const margin = mmToPx(6);
    const gap = mmToPx(3);

    const cols = Math.floor((canvasWidth - margin * 2 + gap) / (itemW + gap));
    if (cols <= 0) return;

    // Center crop coordinates
    const targetAspectRatio = photoW / photoH;
    const imageAspectRatio = imageElement.width / imageElement.height;
    let sx = 0, sy = 0, sWidth = imageElement.width, sHeight = imageElement.height;

    if (imageAspectRatio > targetAspectRatio) {
      sWidth = imageElement.height * targetAspectRatio;
      sx = (imageElement.width - sWidth) / 2;
    } else if (imageAspectRatio < targetAspectRatio) {
      sHeight = imageElement.width / targetAspectRatio;
      sy = (imageElement.height - sHeight) / 2;
    }

    const strokeColor = outlineColor === 'custom' ? customOutlineColor : outlineColor;

    for (let i = 0; i < copies; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = margin + col * (itemW + gap);
      const y = margin + row * (itemH + gap);

      if (y + itemH > canvasHeight - margin) break;

      ctx.drawImage(imageElement, sx, sy, sWidth, sHeight, x, y, itemW, itemH);

      if (outlineColor !== 'none' && outlineWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = outlineWidth;
        ctx.strokeRect(x, y, itemW, itemH);
      }
    }

    setPreviewUrl(canvas.toDataURL('image/jpeg', 0.95));
  }, [imageElement, copies, photoSizePreset, customPhotoWidth, customPhotoHeight, pageSizePreset, orientation, outlineColor, customOutlineColor, outlineWidth]);

  const handleCopiesChange = (val: number) => {
    if (val < 1) setCopies(1);
    else if (val > maxCapacity) setCopies(maxCapacity);
    else setCopies(val);
  };

  const handleFillPage = () => {
    if (maxCapacity > 0) {
      setCopies(maxCapacity);
    }
  };

  const downloadAsImage = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `${outputName}.jpg`;
    link.click();
  };

  const downloadAsPDF = () => {
    if (!previewUrl) return;
    setLoading(true);
    try {
      const { w: pageW, h: pageH } = getPageDimensions();
      const doc = new jsPDF({
        orientation: orientation === 'Landscape' ? 'l' : 'p',
        unit: 'mm',
        format: [pageW, pageH]
      });
      doc.addImage(previewUrl, 'JPEG', 0, 0, pageW, pageH);
      doc.save(`${outputName}.pdf`);
      toast.success('PDF layout created successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const controls = (
    <div className="space-y-5">
      {/* File Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700">Upload Portrait Photo</label>
        <label className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-6 hover:border-indigo-600 cursor-pointer transition-all">
          <UploadCloud className="w-8 h-8 text-indigo-600 mb-1" />
          <span className="text-xs font-semibold text-slate-700">
            {file ? 'Change Photo' : 'Click to browse'}
          </span>
          <input className="hidden" type="file" accept="image/*" onChange={handleFile} ref={fileInputRef} />
        </label>
        {file && (
          <div className="flex items-center justify-between p-2 border border-slate-200 rounded bg-white text-xs truncate">
            <span className="truncate flex-1">{file.name}</span>
            <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-slate-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {file && (
        <>
          {/* Photo Size selection */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Passport Photo Size</label>
            <select
              value={photoSizePreset}
              onChange={(e) => setPhotoSizePreset(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm bg-white"
            >
              <option value="indian">Indian Passport (3.5 x 4.5 cm)</option>
              <option value="indian_alt">Indian Passport Alt (3.3 x 4.3 cm)</option>
              <option value="stamp">Indian Stamp Size (2.5 x 3.5 cm)</option>
              <option value="us">US Passport (2" x 2" / 5.1 x 5.1 cm)</option>
              <option value="custom">Custom Size</option>
            </select>
          </div>

          {/* Custom size inputs */}
          {photoSizePreset === 'custom' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Width (cm)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="1"
                  value={customPhotoWidth}
                  onChange={(e) => setCustomPhotoWidth(parseFloat(e.target.value) || 3.5)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Height (cm)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="1"
                  value={customPhotoHeight}
                  onChange={(e) => setCustomPhotoHeight(parseFloat(e.target.value) || 4.5)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Output Page Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Sheet Page Size</label>
              <select
                value={pageSizePreset}
                onChange={(e) => setPageSizePreset(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm bg-white"
              >
                <option value="a4">A4 Sheet</option>
                <option value="6x4">6" x 4" (4R)</option>
                <option value="7x5">7" x 5" (5R)</option>
                <option value="8x6">8" x 6" (6R)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Orientation</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm bg-white"
              >
                <option value="Portrait">Portrait</option>
                <option value="Landscape">Landscape</option>
              </select>
            </div>
          </div>

          {/* Copies Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-slate-700">Number of Copies</label>
              <button 
                onClick={handleFillPage}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Fill Page
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max={maxCapacity}
                value={copies}
                onChange={(e) => handleCopiesChange(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
              />
              <span className="text-xs text-slate-500">
                Max capacity: <strong className="text-slate-800 font-bold">{maxCapacity}</strong>
              </span>
            </div>
          </div>

          {/* Outline / Stroke Selection */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Outline Color</label>
              <select
                value={outlineColor === 'none' ? 'none' : ['#cccccc', '#000000', '#ffffff', '#3b82f6'].includes(outlineColor) ? outlineColor : 'custom'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setOutlineColor('custom');
                  } else {
                    setOutlineColor(val);
                  }
                }}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="none">No Outline</option>
                <option value="#cccccc">Gray (Default)</option>
                <option value="#000000">Black</option>
                <option value="#ffffff">White</option>
                <option value="#3b82f6">Blue</option>
                <option value="custom">Custom Hex</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Outline Thickness</label>
              <select
                value={outlineWidth}
                onChange={(e) => setOutlineWidth(parseInt(e.target.value) || 1)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value={1}>Thin (1px)</option>
                <option value={2}>Medium (2px)</option>
                <option value={3}>Thick (3px)</option>
              </select>
            </div>

            {outlineColor === 'custom' && (
              <div className="col-span-2 pt-2 border-t border-slate-200/50 flex items-center gap-3">
                <input 
                  type="color" 
                  value={customOutlineColor}
                  onChange={(e) => setCustomOutlineColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer shrink-0"
                />
                <input 
                  type="text" 
                  value={customOutlineColor}
                  onChange={(e) => setCustomOutlineColor(e.target.value)}
                  className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="#000000"
                />
              </div>
            )}
          </div>

          {/* Output Filename */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Output Filename</label>
            <input 
              type="text" 
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button 
              onClick={downloadAsPDF}
              disabled={loading || !previewUrl}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </button>
            <button 
              onClick={downloadAsImage}
              disabled={loading || !previewUrl}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download Image (JPEG)
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <ToolLayoutSplit 
      title="Passport Photo Maker" 
      description="Assemble standard passport photos into grids of various print page sizes."
      onBack={onBack}
      controls={controls}
      previewUrl={previewUrl}
      previewType="image"
    />
  );
}
export const InkEstimatorTool = (props: any) => <GenericMockTool {...props} name="Ink Estimator" desc="Estimate ink usage." icon={null} btnLabel="Estimate" />;


export * from './ImageCompressorTool';

export * from './DocumentScannerTool';
