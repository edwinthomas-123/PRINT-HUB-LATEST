import React from 'react';
import { 
  Scissors, User, Store, Calendar, Clock, FileText, Copy, 
  Paintbrush, Layers, Maximize, Smartphone, Heart, Globe, Phone, Mail, CheckCircle2, Wallet
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export interface PrintCoverPageProps {
  token?: string;
  customerName?: string;
  shopName?: string;
  date?: string;
  time?: string;
  orderId?: string;
  filesCount?: number;
  totalPages?: number;
  copies?: number;
  paperSize?: string;
  colorMode?: string;
  duplex?: string;
  orientation?: string;
  totalPaid?: number;
  paymentMethod?: string;
  status?: string;
}

export function PrintCoverPage({
  token = 'PH-847261',
  customerName = 'Edwin Thomas',
  shopName = 'ABC Print Shop',
  date = '07 Aug 2026',
  time = '10:42 AM',
  orderId = '#54219',
  filesCount = 3,
  totalPages = 87,
  copies = 2,
  paperSize = 'A4',
  colorMode = 'Black & White',
  duplex = 'Yes',
  orientation = 'Portrait',
  totalPaid = 174.00,
  paymentMethod = 'UPI',
  status = 'Completed'
}: PrintCoverPageProps) {
  return (
    <div className="bg-white border border-slate-300 w-full max-w-[800px] mx-auto p-8 shadow-md text-slate-800 relative select-none font-sans" style={{ minHeight: '1120px' }}>
      
      {/* Top Scissors Border */}
      <div className="flex items-center justify-between text-slate-400 text-xs font-bold tracking-widest uppercase mb-6">
        <div className="flex items-center gap-1 flex-1">
          <Scissors className="w-3.5 h-3.5 transform -rotate-90 shrink-0" />
          <span className="border-t border-dashed border-slate-300 flex-1"></span>
        </div>
        <span className="px-4 text-slate-500 font-bold shrink-0">THIS IS THE LAST PAGE OF YOUR PRINT JOB</span>
        <div className="flex items-center gap-1 flex-1">
          <span className="border-t border-dashed border-slate-300 flex-1"></span>
          <Scissors className="w-3.5 h-3.5 transform rotate-90 shrink-0" />
        </div>
      </div>

      {/* Header Container */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-6">
        <div className="flex items-center gap-4">
          {/* PrintHub custom styled Logo */}
          <div className="relative w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center shadow-inner shrink-0 overflow-hidden">
            <span className="text-white text-3xl font-black font-sans tracking-tighter">P</span>
            {/* Pixel block decoration inside logo */}
            <div className="absolute right-0 bottom-0 w-5 h-5 flex flex-wrap gap-0.5 p-0.5">
              <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-sm"></div>
              <div className="w-1.5 h-1.5 bg-white opacity-40 rounded-sm"></div>
              <div className="w-1.5 h-1.5 bg-blue-200 rounded-sm"></div>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-none">PrintHub</h1>
            </div>
            <p className="text-xs text-slate-500 font-semibold tracking-wide mt-1">Print Anywhere. Pick Up Anywhere.</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-xs font-semibold text-slate-600 space-y-1.5 self-center sm:self-end text-center sm:text-right">
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>printhub.app</span>
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>1800-123-PRINT</span>
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>support@printhub.app</span>
          </div>
        </div>
      </div>

      <hr className="border-slate-300 mb-6" />

      {/* Token & QR Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mb-6">
        <div className="md:col-span-3 flex flex-col items-center">
          <div className="flex items-center justify-center w-full gap-4 mb-3">
            <span className="h-[1px] bg-slate-300 flex-1"></span>
            <span className="text-xs font-black text-slate-500 tracking-widest uppercase shrink-0">TOKEN NUMBER</span>
            <span className="h-[1px] bg-slate-300 flex-1"></span>
          </div>
          <div className="w-full border-2 border-dashed border-indigo-500/80 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-center mb-3">
            <span className="text-4xl md:text-5xl font-black text-indigo-700 font-mono tracking-wider">{token}</span>
          </div>
          <p className="text-xs font-bold text-slate-500 text-center uppercase tracking-wide">Show this token to the shop to collect your prints</p>
        </div>

        {/* Scan Order QR */}
        <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-6 shrink-0">
          <span className="text-[10px] font-black text-slate-500 tracking-wider mb-2 text-center uppercase leading-tight">SCAN TO VIEW<br />THIS ORDER</span>
          <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <QRCodeSVG value={`https://printhub.app/track/${orderId}`} size={85} />
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="h-[1px] bg-slate-300 flex-1"></span>
          <span className="text-xs font-black text-slate-500 tracking-widest uppercase shrink-0">ORDER DETAILS</span>
          <span className="h-[1px] bg-slate-300 flex-1"></span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</span>
              <span className="text-sm font-bold text-slate-700 block truncate">{customerName}</span>
            </div>
          </div>
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
              <Store className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shop Name</span>
              <span className="text-sm font-bold text-slate-700 block truncate notranslate" translate="no">{shopName}</span>
            </div>
          </div>
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
              <span className="text-sm font-bold text-slate-700 block truncate">{date}</span>
            </div>
          </div>
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</span>
              <span className="text-sm font-bold text-slate-700 block truncate">{time}</span>
            </div>
          </div>
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order ID</span>
              <span className="text-sm font-bold text-slate-700 block truncate">{orderId}</span>
            </div>
          </div>
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Files</span>
              <span className="text-sm font-bold text-slate-700 block truncate">{filesCount} {filesCount === 1 ? 'File' : 'Files'}</span>
            </div>
          </div>
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pages</span>
              <span className="text-sm font-bold text-slate-700 block truncate">{totalPages} Pages</span>
            </div>
          </div>
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
              <Copy className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Copies</span>
              <span className="text-sm font-bold text-slate-700 block truncate">{copies} {copies === 1 ? 'Copy' : 'Copies'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Print Settings */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="h-[1px] bg-slate-300 flex-1"></span>
          <span className="text-xs font-black text-slate-500 tracking-widest uppercase shrink-0">PRINT SETTINGS</span>
          <span className="h-[1px] bg-slate-300 flex-1"></span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex items-center gap-3">
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 shrink-0">
              <Maximize className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Paper Size</span>
              <span className="text-xs font-bold text-slate-700 block truncate">{paperSize}</span>
            </div>
          </div>
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex items-center gap-3">
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 shrink-0">
              <Paintbrush className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Color Mode</span>
              <span className="text-xs font-bold text-slate-700 block truncate">{colorMode}</span>
            </div>
          </div>
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex items-center gap-3">
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Duplex</span>
              <span className="text-xs font-bold text-slate-700 block truncate">{duplex}</span>
            </div>
          </div>
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex items-center gap-3">
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 shrink-0">
              <Clock className="w-4 h-4 rotate-90" />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Orientation</span>
              <span className="text-xs font-bold text-slate-700 block truncate">{orientation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="h-[1px] bg-slate-300 flex-1"></span>
          <span className="text-xs font-black text-slate-500 tracking-widest uppercase shrink-0">PAYMENT DETAILS</span>
          <span className="h-[1px] bg-slate-300 flex-1"></span>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL PAID</span>
              <span className="block text-xl font-black text-slate-800">₹{totalPaid.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-8 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-8 w-full md:w-auto justify-around md:justify-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PAYMENT METHOD</span>
              <span className="text-sm font-extrabold text-slate-700 block">{paymentMethod}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">STATUS</span>
              <span className="flex items-center gap-1 text-emerald-600 font-extrabold text-sm mt-0.5">
                <CheckCircle2 className="w-4 h-4 fill-emerald-100" /> {status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* App Download Promotional Banner */}
      <div className="border border-indigo-100 rounded-2xl p-4 bg-gradient-to-r from-indigo-50/40 via-white to-indigo-50/40 flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-100">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-indigo-950 text-sm leading-tight">Need more prints?</h4>
            <h3 className="text-base font-black text-indigo-600 tracking-tight mt-0.5">Download PrintHub</h3>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5 tracking-wider">Upload. Pay. Print. Easy.</p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-indigo-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-around md:justify-start">
          <div className="flex flex-col items-center shrink-0">
            <span className="text-[9px] font-bold text-indigo-950/60 uppercase tracking-wider mb-1.5 text-center leading-tight">SCAN TO DOWNLOAD<br />THE PRINT HUB APP</span>
            <div className="p-1 bg-white border border-indigo-50 rounded-lg">
              <QRCodeSVG value="https://printhub.app/download" size={48} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Google Play Badges with beautiful CSS styling */}
            <div className="bg-black text-white px-2 py-1 rounded flex items-center gap-1.5 cursor-pointer hover:bg-slate-900 transition w-[110px]">
              <span className="material-symbols-outlined text-[14px] text-white">play_arrow</span>
              <div className="leading-none text-[8px]">
                <span className="text-slate-400 block text-[6px] scale-90 -ml-1">GET IT ON</span>
                <span className="font-bold tracking-tight font-sans">Google Play</span>
              </div>
            </div>
            <div className="bg-black text-white px-2 py-1 rounded flex items-center gap-1.5 cursor-pointer hover:bg-slate-900 transition w-[110px]">
              <span className="material-symbols-outlined text-[14px] text-white font-semibold">phone_iphone</span>
              <div className="leading-none text-[8px]">
                <span className="text-slate-400 block text-[6px] scale-90 -ml-1">Download on the</span>
                <span className="font-bold tracking-tight font-sans">App Store</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thank you and Bottom Heart Slogan */}
      <div className="flex items-center justify-center gap-2 text-indigo-600 font-extrabold text-xs mb-8">
        <Heart className="w-4 h-4 fill-indigo-100" />
        <span>Thank you for using PrintHub!</span>
        <Heart className="w-4 h-4 fill-indigo-100" />
      </div>

      {/* Bottom Scissors Border */}
      <div className="flex items-center justify-between text-slate-400 text-xs font-bold tracking-widest uppercase mt-4">
        <div className="flex items-center gap-1 flex-1">
          <Scissors className="w-3.5 h-3.5 transform -rotate-90 shrink-0" />
          <span className="border-t border-dashed border-slate-300 flex-1"></span>
        </div>
        <span className="px-4 text-slate-500 font-bold shrink-0">THIS IS THE LAST PAGE OF YOUR PRINT JOB</span>
        <div className="flex items-center gap-1 flex-1">
          <span className="border-t border-dashed border-slate-300 flex-1"></span>
          <Scissors className="w-3.5 h-3.5 transform rotate-90 shrink-0" />
        </div>
      </div>

    </div>
  );
}
