import React from 'react';
import { Link } from 'react-router-dom';

export function ToolsLayout({ 
  children,
  activeCategory = 'all',
  onCategoryChange
}: { 
  children: React.ReactNode;
  activeCategory?: string;
  onCategoryChange?: (category: 'all' | 'pdf' | 'image' | 'shop') => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[#F8F9FC] text-slate-900 font-sans flex overflow-hidden antialiased">
      {/* SideNavBar */}
      <nav className="hidden md:flex flex-col h-full p-4 space-y-2 bg-white border-r border-slate-200/80 w-[270px] shrink-0 z-50 font-sans shadow-xs">
        <div className="flex items-center space-x-3 mb-6 px-2 pt-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>print</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Print & Doc</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workbench</p>
          </div>
        </div>
        <div className="flex-grow space-y-1">
          <button 
            onClick={() => onCategoryChange?.('all')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-150 text-left cursor-pointer ${
              activeCategory === 'all' 
                ? 'bg-indigo-50/90 text-indigo-700 font-bold border border-indigo-200/70 shadow-2xs' 
                : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>All Tools</span>
          </button>
          
          <button 
            onClick={() => onCategoryChange?.('pdf')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-150 text-left cursor-pointer ${
              activeCategory === 'pdf' 
                ? 'bg-indigo-50/90 text-indigo-700 font-bold border border-indigo-200/70 shadow-2xs' 
                : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            <span>PDF Tools</span>
          </button>

          <button 
            onClick={() => onCategoryChange?.('image')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-150 text-left cursor-pointer ${
              activeCategory === 'image' 
                ? 'bg-indigo-50/90 text-indigo-700 font-bold border border-indigo-200/70 shadow-2xs' 
                : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">image</span>
            <span>Image & Scanning</span>
          </button>

          <button 
            onClick={() => onCategoryChange?.('shop')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-150 text-left cursor-pointer ${
              activeCategory === 'shop' 
                ? 'bg-indigo-50/90 text-indigo-700 font-bold border border-indigo-200/70 shadow-2xs' 
                : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">storefront</span>
            <span>Shop Utilities</span>
          </button>
        </div>
        <div className="mt-auto space-y-1 pt-2 border-t border-slate-100">
          <Link to="/" className="flex items-center space-x-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all duration-150 text-xs sm:text-sm font-semibold">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Exit Tools</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col overflow-auto">
        {/* TopNavBar */}
        <header className="md:hidden flex justify-between items-center w-full px-5 h-16 bg-white/95 backdrop-blur-md sticky top-0 border-b border-slate-200/80 z-40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[18px]">print</span>
            </div>
            <h1 className="text-base font-black text-slate-900">Print & Doc</h1>
          </div>
          <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-slate-800">Exit</Link>
        </header>

        <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
        
        <footer className="w-full py-6 px-6 md:px-10 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto border-t border-slate-200/80 shrink-0 text-xs text-slate-500 mt-10">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <span className="font-bold text-slate-800">Print & Doc</span>
            <p className="mt-0.5 text-slate-400">&copy; {new Date().getFullYear()} PrintHub Professional Workbench. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-indigo-600 transition-colors">Support</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
