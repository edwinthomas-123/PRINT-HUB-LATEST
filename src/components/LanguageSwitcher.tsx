import React, { useEffect, useState, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'ur', name: 'اردو (Urdu)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  ];

  useEffect(() => {
    // Add Google Translate script if not exists
    if (!document.getElementById('google-translate-script')) {
      const addScript = document.createElement('script');
      addScript.id = 'google-translate-script';
      addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      addScript.async = true;
      document.body.appendChild(addScript);

      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,hi,bn,te,mr,ta,ur,gu,kn,ml,pa',
            autoDisplay: false
          }, 'google_translate_element');
        }
      };
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code: string) => {
    setCurrentLang(code);
    setIsOpen(false);
    
    // Interact with the hidden google translate element
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    } else {
      // Retry in case it's not loaded yet
      setTimeout(() => {
        const retrySelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (retrySelect) {
          retrySelect.value = code;
          retrySelect.dispatchEvent(new Event('change'));
        }
      }, 500);
    }
  };

  const selectedLangName = languages.find(l => l.code === currentLang)?.name || 'Language';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden container for the native Google Translate widget */}
      <div id="google_translate_element" className="hidden"></div>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm font-medium"
        title="Change Language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{selectedLangName}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-[200] max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
          <div className="px-3 pb-2 mb-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Select Language
          </div>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition flex items-center justify-between group"
            >
              <span>{lang.name}</span>
              {currentLang === lang.code && (
                <Check className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
