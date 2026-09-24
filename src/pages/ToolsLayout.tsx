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
    <div className="fixed inset-0 z-50 bg-[#F4F5F7] text-slate-900 font-sans flex overflow-hidden">
      {/* SideNavBar */}
      <nav className="hidden md:flex flex-col h-full p-4 space-y-2 bg-white border-r border-slate-200 w-[280px] shrink-0 z-50 font-sans">
        <div className="flex items-center space-x-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>print</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-indigo-700">Print & Doc</h1>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Professional Workbench</p>
          </div>
        </div>
        <div className="flex-grow space-y-1">
          <button 
            onClick={() => onCategoryChange?.('all')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 text-left cursor-pointer ${
              activeCategory === 'all' 
                ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm shadow-indigo-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>All Tools</span>
          </button>
          
          <button 
            onClick={() => onCategoryChange?.('pdf')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 text-left cursor-pointer ${
              activeCategory === 'pdf' 
                ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm shadow-indigo-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined">picture_as_pdf</span>
            <span>PDF Tools</span>
          </button>

          <button 
            onClick={() => onCategoryChange?.('image')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 text-left cursor-pointer ${
              activeCategory === 'image' 
                ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm shadow-indigo-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined">image</span>
            <span>Image & Scanning</span>
          </button>

          <button 
            onClick={() => onCategoryChange?.('shop')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 text-left cursor-pointer ${
              activeCategory === 'shop' 
                ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm shadow-indigo-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined">storefront</span>
            <span>Shop Utilities</span>
          </button>
        </div>
        <div className="mt-auto space-y-1">
          <Link to="/" className="flex items-center space-x-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all duration-200 text-sm font-medium">
            <span className="material-symbols-outlined">logout</span>
            <span>Exit Tools</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col overflow-auto">
        {/* TopNavBar */}
        <header className="md:hidden flex justify-between items-center w-full px-6 h-16 bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-200 z-40 shrink-0">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-indigo-700">Print & Doc</h1>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
        
        <footer className="w-full py-6 px-10 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto border-t border-slate-200 shrink-0 text-sm text-slate-500 mt-10">
          <div className="mb-4 md:mb-0">
            <span className="font-bold text-indigo-700">Print & Doc</span>
            <p className="mt-1">© 2024 Print & Doc Professional. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600">Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
