import React, { useState, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { X, UploadCloud, Download, Loader2 } from 'lucide-react';
import { ToolLayoutSplit } from './ToolLayoutSplit';

export function MergePDFTool({ onBack }: { onBack: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [outputName, setOutputName] = useState('merged_document');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generatePreview(files);
  }, [files]);

  const generatePreview = async (currentFiles: File[]) => {
    if (currentFiles.length === 0) {
      setPreviewUrl(null);
      return;
    }
    setLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of currentFiles) {
        const fileBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const mergedPdfFile = await mergedPdf.save();
      const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= files.length) return;
    
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[nextIndex];
    newFiles[nextIndex] = temp;
    
    setFiles(newFiles);
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `${outputName}.pdf`;
    link.click();
  };

  const controls = (
    <div className="space-y-6">
      <label className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-8 hover:border-indigo-600 cursor-pointer transition-all">
        <span className="material-symbols-outlined text-indigo-600 text-3xl mb-2">upload_file</span>
        <h3 className="font-bold text-slate-900">Upload PDFs</h3>
        <p className="text-xs text-slate-500 mt-1 text-center">Drag & drop or click to browse</p>
        <input accept=".pdf" className="hidden" multiple type="file" onChange={handleFiles} />
      </label>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-700 text-sm flex justify-between items-center">
            <span>Files ({files.length}) - Reorder using arrows</span>
            <button onClick={() => setFiles([])} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">Clear all</button>
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-2 border border-slate-200 rounded bg-white text-sm">
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="truncate flex-1 text-slate-700 font-medium">{f.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    disabled={i === 0}
                    onClick={() => moveFile(i, -1)}
                    className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                    title="Move Up"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                  </button>
                  <button 
                    disabled={i === files.length - 1}
                    onClick={() => moveFile(i, 1)}
                    className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                    title="Move Down"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </button>
                  <button 
                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
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
        onClick={handleDownload}
        disabled={files.length < 2 || !previewUrl || loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        {loading ? 'Processing...' : 'Download Merged PDF'}
      </button>
    </div>
  );

  return (
    <ToolLayoutSplit 
      title="Merge PDFs" 
      description="Combine multiple PDF files into one seamless document."
      onBack={onBack}
      controls={controls}
      previewUrl={previewUrl}
    />
  );
}

export function SplitPDFTool({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [outputName, setOutputName] = useState('split_document');
  const [pageInput, setPageInput] = useState('1');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      generatePreview(file, pageInput);
    }, 500); // debounce
    return () => clearTimeout(timer);
  }, [file, pageInput]);

  const parsePages = (input: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = input.split(',').map(s => s.trim());
    for (const part of parts) {
      if (!part) continue;
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s, 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i > 0 && i <= maxPages) pages.add(i - 1);
          }
        }
      } else {
        const page = parseInt(part, 10);
        if (!isNaN(page) && page > 0 && page <= maxPages) {
          pages.add(page - 1);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const generatePreview = async (currentFile: File | null, pagesStr: string) => {
    if (!currentFile) {
      setPreviewUrl(null);
      return;
    }
    setLoading(true);
    try {
      const fileBuffer = await currentFile.arrayBuffer();
      const pdf = await PDFDocument.load(fileBuffer);
      const maxPages = pdf.getPageCount();
      const pagesToExtract = parsePages(pagesStr, maxPages);

      if (pagesToExtract.length === 0) {
        setPreviewUrl(null);
        setLoading(false);
        return;
      }

      const splitPdf = await PDFDocument.create();
      const copiedPages = await splitPdf.copyPages(pdf, pagesToExtract);
      copiedPages.forEach(page => splitPdf.addPage(page));
      
      const splitPdfBytes = await splitPdf.save();
      const blob = new Blob([splitPdfBytes], { type: 'application/pdf' });
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `${outputName}.pdf`;
    link.click();
  };

  const controls = (
    <div className="space-y-6">
      {!file ? (
        <label className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-8 hover:border-indigo-600 cursor-pointer transition-all">
          <UploadCloud className="w-8 h-8 text-indigo-600 mb-2" />
          <h3 className="font-bold text-slate-900">Upload PDF</h3>
          <p className="text-xs text-slate-500 mt-1 text-center">Click to browse</p>
          <input accept=".pdf" className="hidden" type="file" onChange={handleFile} />
        </label>
      ) : (
        <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex justify-between items-center">
          <span className="font-medium text-slate-700 truncate text-sm">{file.name}</span>
          <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {file && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Pages to Extract</label>
          <input 
            type="text" 
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            placeholder="e.g. 1, 3, 5-8"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
          />
          <p className="text-xs text-slate-500">Enter page numbers and/or ranges separated by commas.</p>
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
        disabled={!file || !previewUrl || loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        {loading ? 'Processing...' : 'Download Extracted Pages'}
      </button>
    </div>
  );

  return (
    <ToolLayoutSplit 
      title="Split PDF" 
      description="Extract pages from your PDF document."
      onBack={onBack}
      controls={controls}
      previewUrl={previewUrl}
    />
  );
}

export function EditPDFTool({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [outputName, setOutputName] = useState('edited_document');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generatePreview();
  }, [file, text]);

  const generatePreview = async () => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      if (text) {
        const font = await pdf.embedFont(StandardFonts.Helvetica);
        const pages = pdf.getPages();
        const firstPage = pages[0];
        const { height } = firstPage.getSize();
        firstPage.drawText(text, {
          x: 50,
          y: height - 50,
          size: 24,
          font,
          color: rgb(0, 0.53, 0.71),
        });
      }
      const modifiedPdf = await pdf.save();
      const blob = new Blob([modifiedPdf], { type: 'application/pdf' });
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `${outputName}.pdf`;
    link.click();
  };

  const controls = (
    <div className="space-y-6">
      {!file ? (
        <label className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-8 hover:border-indigo-600 cursor-pointer transition-all">
          <UploadCloud className="w-8 h-8 text-indigo-600 mb-2" />
          <h3 className="font-bold text-slate-900">Upload PDF</h3>
          <p className="text-xs text-slate-500 mt-1 text-center">Click to browse</p>
          <input accept=".pdf" className="hidden" type="file" onChange={handleFile} />
        </label>
      ) : (
        <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex justify-between items-center">
          <span className="font-medium text-slate-700 truncate text-sm">{file.name}</span>
          <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {file && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Add Text to Top Left</label>
          <input 
            type="text" 
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type text here..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
          />
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
        disabled={!file || !previewUrl || loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        {loading ? 'Processing...' : 'Download PDF'}
      </button>
    </div>
  );

  return (
    <ToolLayoutSplit 
      title="Edit PDF Text" 
      description="Add text to your PDF document with live preview."
      onBack={onBack}
      controls={controls}
      previewUrl={previewUrl}
    />
  );
}

export function GenericTool({ name, onBack }: { name: string, onBack: () => void }) {
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
        <Download className="w-5 h-5" /> Download
      </button>
    </div>
  );

  return (
    <ToolLayoutSplit 
      title={name} 
      description={`Upload a file to preview and process using ${name}.`}
      onBack={onBack}
      controls={controls}
      previewUrl={previewUrl}
      previewType={file?.type.startsWith('image/') ? 'image' : 'pdf'}
    />
  );
}
