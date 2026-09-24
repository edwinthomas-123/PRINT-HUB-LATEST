import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';

export function QuickReceiptTool({ onBack }: { onBack: () => void }) {
  const [shopName, setShopName] = useState('YOUR SHOP NAME');
  const [address, setAddress] = useState('123 Main Street, City, State');
  const [phone, setPhone] = useState('Ph: +1 234 567 8900');
  const [gstNo, setGstNo] = useState('GSTIN: 22AAAAA0000A1Z5');
  
  const [includeDate, setIncludeDate] = useState(true);
  const [includeReceiptNo, setIncludeReceiptNo] = useState(true);
  const [blankRows, setBlankRows] = useState(8);
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [footerText, setFooterText] = useState('Thank you for shopping!\nVisit again.');
  
  const [layout, setLayout] = useState<'thermal' | '2-a5' | '4-a6'>('thermal');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);
    try {
                  const domtoimage = (await import('dom-to-image-more')).default;
      const elemW = receiptRef.current.scrollWidth;
      const elemH = receiptRef.current.scrollHeight;

      const imgData = await domtoimage.toPng(receiptRef.current, { 
        scale: 4, 
        bgcolor: '#ffffff',
        width: elemW,
        height: elemH
      });
      
      const img = new Image();
      img.src = imgData;
      await new Promise(r => img.onload = r);
      const canvasWidth = img.width;
      const canvasHeight = img.height;


      
      if (layout === 'thermal') {
        const width = 80; // 80mm thermal
        const height = (canvasHeight * width) / canvasWidth;
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [width, height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save('blank_receipt.pdf');
      } else if (layout === '2-a5') {
        // 2 A5 receipts on an A4 Landscape page
        // A4 Landscape: 297 x 210 mm
        // Each A5 is 148.5 x 210 mm (portrait A5 in A4 landscape)
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        // Calculate image print dimensions
        // We want to fit the receipt inside a 148.5 x 210 box, leaving some margin.
        const boxW = 148.5;
        const boxH = 210;
        const margin = 10;
        
        const maxW = boxW - margin * 2;
        const maxH = boxH - margin * 2;
        
        const imgRatio = canvasWidth / canvasHeight;
        let printW = maxW;
        let printH = printW / imgRatio;
        if (printH > maxH) {
          printH = maxH;
          printW = printH * imgRatio;
        }
        
        // First receipt (left half)
        const x1 = (boxW - printW) / 2;
        const y1 = (boxH - printH) / 2;
        pdf.addImage(imgData, 'PNG', x1, y1, printW, printH);
        
        // Second receipt (right half)
        const x2 = boxW + (boxW - printW) / 2;
        pdf.addImage(imgData, 'PNG', x2, y1, printW, printH);
        
        // Draw cut line down the middle
        (pdf as any).setLineDash([2, 2], 0);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(148.5, 0, 148.5, 210);
        
        pdf.save('blank_receipt_2_a5.pdf');
      } else if (layout === '4-a6') {
        // 4 A6 receipts on an A4 Portrait page
        // A4 Portrait: 210 x 297 mm
        // Each A6 is 105 x 148.5 mm
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const boxW = 105;
        const boxH = 148.5;
        const margin = 10;
        
        const maxW = boxW - margin * 2;
        const maxH = boxH - margin * 2;
        
        const imgRatio = canvasWidth / canvasHeight;
        let printW = maxW;
        let printH = printW / imgRatio;
        if (printH > maxH) {
          printH = maxH;
          printW = printH * imgRatio;
        }
        
        // Calculate offsets inside each quadrant
        const offsetX = (boxW - printW) / 2;
        const offsetY = (boxH - printH) / 2;
        
        // Top-left
        pdf.addImage(imgData, 'PNG', offsetX, offsetY, printW, printH);
        // Top-right
        pdf.addImage(imgData, 'PNG', boxW + offsetX, offsetY, printW, printH);
        // Bottom-left
        pdf.addImage(imgData, 'PNG', offsetX, boxH + offsetY, printW, printH);
        // Bottom-right
        pdf.addImage(imgData, 'PNG', boxW + offsetX, boxH + offsetY, printW, printH);
        
        // Draw cut lines
        (pdf as any).setLineDash([2, 2], 0);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(105, 0, 105, 297); // vertical
        pdf.line(0, 148.5, 210, 148.5); // horizontal
        
        pdf.save('blank_receipt_4_a6.pdf');
      }
      toast.success('Receipt generated successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Editor Panel */}
      <div className="flex-1 bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Receipt Maker</h2>
            <p className="text-xs text-slate-500">Design a blank thermal receipt</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Name</label>
            <input 
              type="text" 
              value={shopName} 
              onChange={e => setShopName(e.target.value)} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <textarea 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input 
                type="text" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST / Tax Number</label>
              <input 
                type="text" 
                value={gstNo} 
                onChange={e => setGstNo(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={includeDate} onChange={e => setIncludeDate(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
              Include Date / Time
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={includeReceiptNo} onChange={e => setIncludeReceiptNo(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
              Receipt Number field
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={includeBarcode} onChange={e => setIncludeBarcode(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
              Include Barcode
            </label>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Blank Rows (for items)</label>
            <input 
              type="number" 
              min={1} max={50}
              value={blankRows} 
              onChange={e => setBlankRows(Number(e.target.value))} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Footer Message</label>
            <textarea 
              value={footerText} 
              onChange={e => setFooterText(e.target.value)} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={2}
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">PDF Print Layout</label>
            <select 
              value={layout} 
              onChange={(e) => setLayout(e.target.value as 'thermal' | '2-a5' | '4-a6')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="thermal">Single Thermal Receipt (80mm)</option>
              <option value="2-a5">2 Receipts on A4 (A5 size)</option>
              <option value="4-a6">4 Receipts on A4 (A6 size)</option>
            </select>
          </div>

          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isGenerating ? 'Generating...' : 'Download Receipt PDF'}
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 bg-slate-50 p-6 border border-slate-200 rounded-xl flex flex-col items-center justify-center shadow-inner overflow-hidden">
        <div className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Live Preview</div>
        
        {/* Receipt Container - simulating 80mm thermal paper */}
        <div 
          className="bg-white shadow-md mx-auto" 
          style={{ width: '320px', padding: '24px 16px', fontFamily: '"Courier New", Courier, monospace', color: '#000' }}
        >
          <div ref={receiptRef} className="bg-white" style={{ padding: '0px' }}>
            {/* Header */}
            <div className="text-center mb-4">
              {shopName && <h1 className="font-bold text-xl uppercase mb-1">{shopName}</h1>}
              {address && <p className="text-sm leading-tight whitespace-pre-wrap mb-1">{address}</p>}
              {phone && <p className="text-sm leading-tight">{phone}</p>}
              {gstNo && <p className="text-sm leading-tight mt-1 font-bold">{gstNo}</p>}
            </div>

            {/* Meta */}
            <div className="border-t border-dashed border-black pt-2 mb-2 text-sm">
              {includeDate && (
                <>
                  <div className="flex justify-between mb-1"><span>Date: ____________</span><span>Time: ________</span></div>
                </>
              )}
              {includeReceiptNo && (
                <div className="mb-1">Receipt #: ___________________</div>
              )}
            </div>

            {/* Table Header */}
            <div className="border-t border-b border-black py-1 mb-2 flex text-sm font-bold">
              <div className="w-8 text-left">Qty</div>
              <div className="flex-1 text-left px-1">Item</div>
              <div className="w-14 text-right">Price</div>
              <div className="w-16 text-right">Amount</div>
            </div>

            {/* Blank Rows */}
            <div className="mb-2">
              {Array.from({ length: blankRows }).map((_, i) => (
                <div key={i} className="flex text-sm py-1 border-b border-dotted" style={{ borderColor: '#ccc' }}>
                  <div className="w-8 border-r border-dotted h-4" style={{ borderColor: '#ccc' }}></div>
                  <div className="flex-1 px-1 border-r border-dotted h-4" style={{ borderColor: '#ccc' }}></div>
                  <div className="w-14 border-r border-dotted h-4" style={{ borderColor: '#ccc' }}></div>
                  <div className="w-16 h-4"></div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-black pt-2 mt-2 text-sm flex flex-col gap-1 items-end">
              <div className="flex justify-between w-48">
                <span>Subtotal:</span>
                <span>$________</span>
              </div>
              <div className="flex justify-between w-48">
                <span>Tax:</span>
                <span>$________</span>
              </div>
              <div className="flex justify-between w-48 font-bold text-base mt-1">
                <span>TOTAL:</span>
                <span>$________</span>
              </div>
            </div>

            <div className="border-t border-dashed border-black mt-4 pt-4 mb-4 text-sm">
              <div className="mb-2">Payment: ______________________</div>
              <div className="whitespace-pre-wrap text-center">{footerText}</div>
            </div>

            {/* Barcode */}
            {includeBarcode && (
              <div className="flex justify-center mt-4">
                <Barcode value="RECEIPT-BLANK" width={1.5} height={40} displayValue={false} background="#ffffff" lineColor="#000000" margin={0} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
