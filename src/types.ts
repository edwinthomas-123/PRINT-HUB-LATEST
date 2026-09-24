export type Shop = {
  id: string;
  name: string;
  address: string;
  location?: { lat: number, lng: number };
  ownerId: string;
  rating: number;
  coverImage?: string;
  logo?: string;
  isOpen: boolean;
  services?: string[];
  paperSizes?: string[];
  printers?: { id: string, name: string, mappedServices: string[], testPrinted: boolean }[];
  openingHours?: { open: string, close: string };
  workingDays?: string[];
  mapLink?: string;
  phonepeMerchantId?: string;
  phonepeSaltKey?: string;
  phonepeSaltIndex?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  razorpayEnabled?: boolean;
  upiId?: string;
  upiEnabled?: boolean;
  cashOnCounterEnabled?: boolean;
  plan?: 'free' | 'starter' | 'business' | 'business_plus';
  businessPlusPrice?: number;
  subscription?: {
    plan: 'free' | 'starter' | 'business' | 'business_plus';
    periodStart?: number;
    periodEnd?: number;
    ordersThisMonth?: number;
    customBusinessPlusPrice?: number;
    updatedAt?: number;
    status?: 'active' | 'cancelled';
  };
  pricing?: {
    bwPage1?: number;
    bwPage2To15?: number;
    bwPage16Plus?: number;
    colorPage1?: number;
    colorPage2To15?: number;
    colorPage16Plus?: number;
    bwBase?: number;
    bwDoubleSide?: number;
    colorBase?: number;
    colorDoubleSide?: number;
    a3Multiplier?: number;
    glossyAddon?: number;
    photo6x4?: number;
    photo7x5?: number;
    photo8x6?: number;
  };
};

export type PrintSettings = {
  color: 'Black & White' | 'Color';
  paperSize: 'A4' | 'A3' | 'Legal' | '6x4 Photo' | '7x5 Photo' | '8x6 Photo';
  paperType: 'Plain' | 'Glossy';
  orientation: 'Portrait' | 'Landscape';
  sides: 'Single' | 'Double';
  copies: number;
  pages: string;
  fitToPage?: boolean;
  scaleOption?: 'fit' | 'actual' | 'fill';
  isIdCard?: boolean;
  idCardLayout?: 'stacked' | 'side-by-side';
};

export type OrderFile = {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl?: string;
  filePath?: string;
  pagesCount?: number;
  settings?: PrintSettings;
  price?: number;
  isIdCard?: boolean;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
};

export type PrintOrder = {
  id?: string;
  customerId: string;
  shopId: string;
  status: 'Uploaded' | 'Payment Complete' | 'Waiting' | 'Printing Started' | 'Printing Completed' | 'Ready for Pickup' | 'Completed' | 'Cancelled';
  files: OrderFile[];
  settings: PrintSettings;
  price: number;
  token: string;
  createdAt: number;
};

export type UserProfile = {
  uid: string;
  email: string;
  walletBalance: number;
  displayName?: string;
};

export type SubscriptionPlanId = 'free' | 'starter' | 'business' | 'business_plus';

export interface PartnerPlan {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  priceLabel: string;
  orderLimit: number | null; // null represents 1,000+ / high-volume / unlimited
  orderLimitLabel: string;
  description: string;
  popular?: boolean;
  features: string[];
  upgradeMessage?: string;
}

export const PARTNER_PLANS: Record<SubscriptionPlanId, PartnerPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '₹0/month',
    orderLimit: 10,
    orderLimitLabel: '10 orders/month',
    description: 'Essential basic PrintHub features for small shops getting started.',
    features: [
      'Up to 10 orders/month',
      'Essential basic PrintHub features',
      'QR Code order reception',
      'Customer pickup queue',
      'Standard document upload & PDF tools',
      'Real-time order notifications'
    ],
    upgradeMessage: 'Upgrade to Starter to process up to 200 orders/month.'
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 99,
    priceLabel: '₹99/month',
    orderLimit: 200,
    orderLimitLabel: '200 orders/month',
    description: 'Perfect for active neighborhood photocopy & printing shops.',
    features: [
      'Up to 200 orders/month',
      'All Free features included',
      'PrintBridge Desktop Companion App',
      'Custom range discounts & media pricing',
      'Auto-print incoming paid orders',
      'Shop profile & local map discovery'
    ],
    upgradeMessage: 'Upgrade to Business to process up to 1,000 orders/month.'
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 499,
    priceLabel: '₹499/month',
    orderLimit: 1000,
    orderLimitLabel: '1,000 orders/month',
    popular: true,
    description: 'Ideal for high-demand campus, commercial, and business print centers.',
    features: [
      'Up to 1,000 orders/month',
      'All Starter features included',
      'Multi-printer hardware routing',
      'Razorpay & UPI online payment gateway',
      'Real-time revenue & sales analytics',
      '30-day extended cloud file cache',
      'Priority partner support'
    ],
    upgradeMessage: 'Upgrade to Business Plus for 1,000+ high-volume capacity.'
  },
  business_plus: {
    id: 'business_plus',
    name: 'Business Plus',
    price: 999, // default, configurable by admin
    priceLabel: '₹999/month',
    orderLimit: null, // effectively unlimited / 1,000+
    orderLimitLabel: '1,000+ orders/month (High-Volume)',
    description: 'Tailored for high-volume enterprise print centers with exclusive AI Passport & Suit Studio.',
    features: [
      '✨ AI Studio Passport Photo & Suit Maker (Exclusive)',
      '1,000+ orders / High-Volume capacity',
      'All Business features included',
      'No fixed 1,000-order hard limit',
      'Auto AI Suit, Blazer, White Shirt, Doctor Coat & Kurta styling',
      'Studio biometric background replacement & instant 4x6 grid export',
      'Multi-counter concurrent staff handling',
      'Bulk batch PDF processing',
      'Dedicated enterprise SLA & VIP support',
      'Configurable enterprise billing rate'
    ]
  }
};

