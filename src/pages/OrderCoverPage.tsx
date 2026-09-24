import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PrintOrder, Shop, UserProfile } from '../types';
import { PrintCoverPage } from '../components/PrintCoverPage';
import { Loader2, ArrowLeft, Printer, Download, Sparkles, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';

export function OrderCoverPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<PrintOrder | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [customer, setCustomer] = useState<UserProfile | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadOrderData() {
      if (!orderId) return;
      try {
        setLoading(true);
        setError(null);
        const orderSnap = await getDoc(doc(db, 'orders', orderId));
        if (orderSnap.exists()) {
          const orderData = orderSnap.data() as PrintOrder;
          setOrder({ id: orderSnap.id, ...orderData });

          // Load Shop
          if (orderData.shopId) {
            try {
              const shopSnap = await getDoc(doc(db, 'shops', orderData.shopId));
              if (shopSnap.exists()) {
                setShop(shopSnap.data() as Shop);
              }
            } catch (shopErr) {
              console.warn("Failed to load shop in OrderCoverPage:", shopErr);
            }
          }

          // Load Customer
          if (orderData.customerId) {
            try {
              const customerSnap = await getDoc(doc(db, 'users', orderData.customerId));
              if (customerSnap.exists()) {
                setCustomer(customerSnap.data() as UserProfile);
              }
            } catch (custErr) {
              console.warn("Failed to load customer in OrderCoverPage:", custErr);
            }
          }
        } else {
          setError("Order not found");
          toast.error("Order not found");
        }
      } catch (err: any) {
        console.error("Error loading order cover data:", err);
        setError(err?.message || "Failed to load order data");
        toast.error("Failed to load order data");
      } finally {
        setLoading(false);
      }
    }

    loadOrderData();
  }, [orderId]);

    const handlePrint = async () => {
    if (!printAreaRef.current) return;
    try {
      const toastId = toast.loading("Generating PDF...");
                  const domtoimage = (await import('dom-to-image-more')).default;
      const { jsPDF } = await import('jspdf');

      const elemW = printAreaRef.current.scrollWidth || 794;
      const elemH = printAreaRef.current.scrollHeight || 1123;

      const imgData = await domtoimage.toJpeg(printAreaRef.current, {
        quality: 1.0,
        scale: 4,
        bgcolor: '#ffffff',
        width: elemW,
        height: elemH
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (elemH * pdfWidth) / elemW;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`PrintHub_CoverSlip_${order?.token || 'Order'}.pdf`);
      toast.success("PDF generated successfully!", { id: toastId });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadGrayscalePdf = async () => {
    if (!printAreaRef.current) return;
    setGeneratingPdf(true);
    const toastId = toast.loading("Generating Black & White PDF Slip...");
    try {
      // Create high-res canvas of the cover page
                  const domtoimage = (await import('dom-to-image-more')).default;
      const elemW = printAreaRef.current.scrollWidth || 794;
      const elemH = printAreaRef.current.scrollHeight || 1123;

      // create a canvas from dom-to-image to manipulate pixels
      const dataUrl = await domtoimage.toPng(printAreaRef.current, {
        scale: 4,
        bgcolor: '#ffffff',
        width: elemW,
        height: elemH
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise(r => img.onload = r);
      
      if (img.width <= 0 || img.height <= 0) {
        throw new Error("Generated image has invalid dimensions");
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = brightness;
          data[i + 1] = brightness;
          data[i + 2] = brightness;
        }
        ctx.putImageData(imgData, 0, 0);
      }
      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);

      // Create PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.276, 841.890]); // A4 Size in points

      const embeddedImg = await pdfDoc.embedJpg(imgDataUrl);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: 595.276,
        height: 841.890
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `PrintHub_CoverSlip_${order?.token || 'Order'}.pdf`;
      link.click();

      toast.success("Black & White Cover PDF saved successfully!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF.", { id: toastId });
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="animate-spin text-slate-400 w-10 h-10 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading Cover Sheet...</p>
      </div>
    );
  }

  if (error || !order) {
    const isOffline = error && (error.toLowerCase().includes('offline') || error.toLowerCase().includes('network') || error.toLowerCase().includes('failed to get document') || error.toLowerCase().includes('unavailable'));
    return (
      <div className="text-center p-12 max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm mt-8">
        <div className={`w-16 h-16 ${isOffline ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {isOffline ? "Connection is Offline" : (error === "Order not found" ? "Order Not Found" : "Error Loading Data")}
        </h2>
        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
          {isOffline 
            ? "We cannot reach the Cloud Firestore database because your connection is offline or Firestore is temporarily unreachable. Please check your internet connection."
            : (error === "Order not found" ? "We couldn't retrieve the order cover sheet details because this order ID does not exist." : (error || "An unknown error occurred while retrieving the cover sheet.")) || "We couldn't retrieve the order cover sheet details."}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition">
            Go Back
          </button>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              window.location.reload();
            }} 
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Prep order details
  const totalPages = order.files 
    ? order.files.reduce((acc, f) => acc + (f.pagesCount || 1) * (f.settings?.copies || 1), 0)
    : (order as any).pagesCount || 1;

  const totalCopies = order.files 
    ? order.files.reduce((acc, f) => acc + (f.settings?.copies || 1), 0)
    : order.settings?.copies || 1;

  const totalFiles = order.files ? order.files.length : 1;
  const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeFormatted = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const settings = order.files?.[0]?.settings || order.settings || {
    paperSize: 'A4',
    color: 'Black & White',
    sides: 'Single',
    orientation: 'Portrait'
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="no-print flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-1.5">
              Print Cover Page
              <span className="text-[10px] uppercase bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full">Cover Slip</span>
            </h1>
            <p className="text-xs text-slate-500">Official print job separator and collection receipt.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Cover Page
          </button>
          <button 
            onClick={handleDownloadGrayscalePdf}
            disabled={generatingPdf}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm disabled:opacity-50"
          >
            {generatingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download B&W PDF
          </button>
        </div>
      </div>

      {totalPages > 15 && (
        <div className="no-print bg-indigo-50 border border-indigo-100 text-indigo-950 p-4 rounded-xl flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm flex items-center gap-1.5">
              Extended Print Job Detected! <span className="bg-indigo-200 text-indigo-800 text-[9px] font-black uppercase px-2 py-0.5 rounded">{totalPages} Pages</span>
            </p>
            <p className="text-xs text-indigo-900/80 mt-1">This print job contains more than 15 pages. In accordance with shop print policies, this Cover Slip will automatically append to the end of the compiled document as a separator in black and white.</p>
          </div>
        </div>
      )}

      {/* Render card */}
      <div className="bg-slate-100 p-4 sm:p-8 rounded-3xl border border-slate-200/60 overflow-x-auto flex justify-center">
        <div id="printable-cover-card" ref={printAreaRef} className="shrink-0">
          <PrintCoverPage 
            token={order.token}
            customerName={customer?.displayName || customer?.email?.split('@')[0] || 'Edwin Thomas'}
            shopName={shop?.name || 'ABC Print Shop'}
            date={dateFormatted}
            time={timeFormatted}
            orderId={order.id?.substring(0, 8).toUpperCase() || '#54219'}
            filesCount={totalFiles}
            totalPages={totalPages}
            copies={totalCopies}
            paperSize={settings.paperSize || 'A4'}
            colorMode={settings.color || 'Black & White'}
            duplex={settings.sides === 'Double' ? 'Yes' : 'No'}
            orientation={settings.orientation || 'Portrait'}
            totalPaid={order.price}
            paymentMethod="UPI"
            status={order.status === 'Completed' ? 'Completed' : 'Completed'}
          />
        </div>
      </div>
    </div>
  );
}
