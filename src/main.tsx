import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Patch CSSStyleSheet to prevent CORS security errors when libraries like dom-to-image read cross-origin rules
try {
  const originalCssRules = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, 'cssRules');
  if (originalCssRules && originalCssRules.get) {
    const originalGet = originalCssRules.get;
    Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', {
      get() {
        try {
          return originalGet.call(this);
        } catch (e) {
          console.warn('Gracefully bypassed CORS restriction on CSSStyleSheet.cssRules:', e);
          return [];
        }
      },
      enumerable: true,
      configurable: true,
    });
  }
} catch (e) {
  console.error('Failed to patch CSSStyleSheet.cssRules:', e);
}

try {
  const originalRules = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, 'rules');
  if (originalRules && originalRules.get) {
    const originalGet = originalRules.get;
    Object.defineProperty(CSSStyleSheet.prototype, 'rules', {
      get() {
        try {
          return originalGet.call(this);
        } catch (e) {
          return [];
        }
      },
      enumerable: true,
      configurable: true,
    });
  }
} catch (e) {
  console.error('Failed to patch CSSStyleSheet.rules:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
