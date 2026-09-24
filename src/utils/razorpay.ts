// Client-side helper for loading and launching Razorpay Checkout

declare global {
  interface Window {
    Razorpay: any;
  }
}

let razorpayScriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    // Check if script element already exists
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK checkout.js');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export async function openRazorpayModal(options: RazorpayCheckoutOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      return { success: false, error: 'Razorpay SDK could not be loaded. Please check your internet connection.' };
    }

    const rzp = new window.Razorpay(options);
    
    rzp.on('payment.failed', function (response: any) {
      console.warn('Razorpay payment failed:', response.error);
    });

    rzp.open();
    return { success: true };
  } catch (err: any) {
    console.error('Error opening Razorpay modal:', err);
    return { success: false, error: err.message || 'Failed to open payment gateway' };
  }
}
