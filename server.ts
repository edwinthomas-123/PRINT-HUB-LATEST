import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import multer from 'multer';
import fsSync from 'fs';
import AdmZip from 'adm-zip';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Platform Razorpay Credentials for SaaS Subscription Plans
const PLATFORM_RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TfucDn4PA9xBO0';
const PLATFORM_RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '3lsvJFk0qVkUsuIqY2SJkLn9';

const platformRazorpay = new Razorpay({
  key_id: PLATFORM_RAZORPAY_KEY_ID,
  key_secret: PLATFORM_RAZORPAY_KEY_SECRET,
});

let config: any = {};
try {
  config = JSON.parse(fsSync.readFileSync('./firebase-applet-config.json', 'utf8'));
} catch (e: any) {
  console.log("Firebase config load error:", e.message);
}

// Robust Firestore REST helpers to communicate directly with the applet's database
// (configured in firebase-applet-config.json) without relying on ambient service credentials.
function decodeFirestoreValue(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('mapValue' in val) {
    const res: any = {};
    const fields = val.mapValue?.fields || {};
    for (const k of Object.keys(fields)) {
      res[k] = decodeFirestoreValue(fields[k]);
    }
    return res;
  }
  if ('arrayValue' in val) {
    return (val.arrayValue?.values || []).map(decodeFirestoreValue);
  }
  if ('nullValue' in val) return null;
  return null;
}

function decodeFirestoreDoc(doc: any): any {
  if (!doc || !doc.fields) return null;
  const res: any = { id: doc.name?.split('/')?.pop() };
  for (const k of Object.keys(doc.fields)) {
    res[k] = decodeFirestoreValue(doc.fields[k]);
  }
  return res;
}

function encodeFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(encodeFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: any = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = encodeFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function getFirestoreDoc(collectionName: string, docId: string): Promise<any | null> {
  try {
    const projectId = config.projectId;
    const dbId = config.firestoreDatabaseId || '(default)';
    const apiKey = config.apiKey;
    if (!projectId || !apiKey) return null;

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/${collectionName}/${encodeURIComponent(docId)}?key=${apiKey}`;
    const res = await fetch(url);
    if (res.status === 404) return null;
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Firestore REST get error (${res.status}):`, errText);
      return null;
    }
    const json = await res.json();
    return decodeFirestoreDoc(json);
  } catch (err: any) {
    console.warn(`Firestore REST get exception:`, err.message);
    return null;
  }
}

async function updateFirestoreDoc(collectionName: string, docId: string, fields: Record<string, any>): Promise<any | null> {
  try {
    const projectId = config.projectId;
    const dbId = config.firestoreDatabaseId || '(default)';
    const apiKey = config.apiKey;
    if (!projectId || !apiKey) return null;

    const encodedFields: any = {};
    const fieldPaths: string[] = [];
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        encodedFields[key] = encodeFirestoreValue(value);
        fieldPaths.push(key);
      }
    }

    const maskParams = fieldPaths.map(fp => `updateMask.fieldPaths=${encodeURIComponent(fp)}`).join('&');
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/${collectionName}/${encodeURIComponent(docId)}?${maskParams}&key=${apiKey}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: encodedFields })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Firestore REST patch error (${res.status}):`, errText);
      return null;
    }
    const json = await res.json();
    return decodeFirestoreDoc(json);
  } catch (err: any) {
    console.warn('Firestore REST patch exception:', err.message);
    return null;
  }
}

async function queryFirestoreOrders(shopId: string, minCreatedAt?: number): Promise<any[]> {
  try {
    const projectId = config.projectId;
    const dbId = config.firestoreDatabaseId || '(default)';
    const apiKey = config.apiKey;
    if (!projectId || !apiKey) return [];

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents:runQuery?key=${apiKey}`;
    const filters: any[] = [
      {
        fieldFilter: {
          field: { fieldPath: 'shopId' },
          op: 'EQUAL',
          value: { stringValue: shopId }
        }
      }
    ];

    if (minCreatedAt) {
      filters.push({
        fieldFilter: {
          field: { fieldPath: 'createdAt' },
          op: 'GREATER_THAN_OR_EQUAL',
          value: { integerValue: minCreatedAt.toString() }
        }
      });
    }

    const where = filters.length === 1 ? filters[0] : {
      compositeFilter: {
        op: 'AND',
        filters
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'orders' }],
          where
        }
      })
    });

    if (!res.ok) {
      return [];
    }

    const results = await res.json();
    if (!Array.isArray(results)) return [];
    return results
      .filter((r: any) => r.document)
      .map((r: any) => decodeFirestoreDoc(r.document));
  } catch (err: any) {
    return [];
  }
}

async function queryFirestorePendingOrders(shopId: string): Promise<any[]> {
  try {
    const projectId = config.projectId;
    const dbId = config.firestoreDatabaseId || '(default)';
    const apiKey = config.apiKey;
    if (!projectId || !apiKey) return [];

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents:runQuery?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'orders' }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: [
                {
                  fieldFilter: {
                    field: { fieldPath: 'shopId' },
                    op: 'EQUAL',
                    value: { stringValue: shopId }
                  }
                },
                {
                  fieldFilter: {
                    field: { fieldPath: 'status' },
                    op: 'EQUAL',
                    value: { stringValue: 'Payment Complete' }
                  }
                }
              ]
            }
          }
        }
      })
    });

    if (!res.ok) return [];
    const results = await res.json();
    if (!Array.isArray(results)) return [];
    return results
      .filter((r: any) => r.document)
      .map((r: any) => decodeFirestoreDoc(r.document));
  } catch (err: any) {
    return [];
  }
}

const upload = multer({ limits: { fileSize: 35 * 1024 * 1024 } }); // 35MB

import dotenv from 'dotenv';

dotenv.config();

let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fsSync.existsSync(uploadsDir)) {
    fsSync.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  const publicDir = path.join(process.cwd(), 'public');
  if (fsSync.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  app.get('/service-worker.js', (req, res) => {
    const swPath = path.join(publicDir, 'service-worker.js');
    if (fsSync.existsSync(swPath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.sendFile(swPath);
    } else {
      res.status(404).send('Not found');
    }
  });

  app.post('/api/upload', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error("Multer upload error:", err);
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const originalName = req.file.originalname || 'document.pdf';
      const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${Date.now()}_${safeName}`;
      const localFilePath = path.join(uploadsDir, filename);
      
      fsSync.writeFileSync(localFilePath, req.file.buffer);
      const publicUrl = `/uploads/${filename}`;
      
      return res.json({ 
        url: publicUrl,
        path: publicUrl,
        filename: safeName,
        size: req.file.size
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || 'Server error saving uploaded file' });
    }
  });

  app.post('/api/delete-file', async (req, res) => {
    try {
      const { filePath } = req.body;
      if (!filePath) return res.status(400).json({ error: 'filePath is required' });
      
      if (filePath.startsWith('/uploads/') || filePath.startsWith('uploads/')) {
        const cleanName = path.basename(filePath);
        const diskPath = path.join(uploadsDir, cleanName);
        if (fsSync.existsSync(diskPath)) {
          fsSync.unlinkSync(diskPath);
        }
      }
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });


  // API endpoints
  app.post('/api/ai/ask', async (req, res) => {
    try {
      const { prompt } = req.body;
      
      const isMapQuery = prompt.toLowerCase().match(/(where|near|find|shop|map)/);
      let response;
      
      if (isMapQuery) {
        response = await getAI().models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }],
          },
        });
      } else {
        response = await getAI().models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
          },
        });
      }
      
      res.json({ text: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/passport-maker', async (req, res) => {
    try {
      const { image, mimeType, backgroundColor, clothingPreset, shopId } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image is required' });
      }

      if (!shopId) {
        return res.status(403).json({
          error: 'AI Passport Maker is exclusively available to Business Plus subscribers. Please sign in as a shop partner.',
          upgradeRequired: true
        });
      }

      // Verify Business Plus plan
      let isAuthorized = false;
      let currentPlan = 'free';

      if (shopId === 'demo-local-shop') {
        isAuthorized = true;
        currentPlan = 'business_plus';
      } else {
        const shopData = await getFirestoreDoc('shops', shopId);
        if (!shopData) {
          return res.status(404).json({ error: 'Shop profile not found' });
        }
        currentPlan = (shopData?.plan || shopData?.subscription?.plan || 'free').toLowerCase();
        if (currentPlan === 'business_plus') {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({
          error: `AI Passport Maker is an exclusive feature for Business Plus partners (₹999/mo). Your shop is currently on the ${currentPlan} plan. Please upgrade to unlock AI Passport Photo Studio.`,
          upgradeRequired: true,
          currentPlan
        });
      }

      let base64Data = image;
      if (image.includes(',')) {
        base64Data = image.split(',')[1];
      }

      const bgStr = backgroundColor || 'light blue';

      let clothes1 = '';
      let clothes2 = '';

      if (clothingPreset === 'suit') {
        clothes1 = 'Change the clothing to a professional, elegant, studio-grade dark navy formal suit with a crisp white collared shirt and a matching dark blue silk necktie.';
        clothes2 = 'Change the clothing to a modern, professional, studio-grade charcoal black formal suit with a crisp white collared shirt and an elegant dark red necktie.';
      } else if (clothingPreset === 'blazer') {
        clothes1 = 'Change the clothing to an elegant professional grey blazer worn over a neat collared shirt.';
        clothes2 = 'Change the clothing to a professional dark grey blazer worn over a crisp white collared shirt.';
      } else if (clothingPreset === 'shirt') {
        clothes1 = 'Change the clothing to a clean, crisp, studio-grade formal white button-up shirt, perfectly ironed.';
        clothes2 = 'Change the clothing to a professional light blue button-up collared shirt, perfectly ironed.';
      } else if (clothingPreset === 'traditional') {
        clothes1 = 'Change the clothing to an elegant traditional Indian white embroidered kurta.';
        clothes2 = 'Change the clothing to a neat light grey traditional Nehru jacket or elegant kurta.';
      } else if (clothingPreset === 'doctor') {
        clothes1 = 'Change the clothing to a clean white professional doctor lab coat with a collared shirt underneath.';
        clothes2 = 'Change the clothing to a professional white medical coat with a stethoscope around the neck and collared shirt.';
      } else {
        clothes1 = 'Keep the original clothing exactly as is, do not alter the clothes. Only edit the background to solid flat background.';
        clothes2 = 'Keep the original clothing exactly as is, do not alter the clothes. Only edit the background, adding a very subtle soft studio lighting effect.';
      }

      const buildPrompt = (clothesPrompt: string) => {
        return `Please edit this photo to make it a professional, high-quality passport size photo.
Change the background to a completely solid, flat, studio-grade ${bgStr} color. Remove any cluttered, busy, or textured background.
${clothesPrompt}
Strictly preserve the exact face, facial features, eyes, nose, mouth, facial shape, skin tone, hairstyle, and identity of the person. Do not morph, distort, or change the face or head shape.
The final image must be clean, high quality, centered, and perfectly suitable for official government passport and visa applications.`;
      };

      const prompt1 = buildPrompt(clothes1);
      const prompt2 = buildPrompt(clothes2);

      const runModel = async (promptText: string) => {
        const ai = getAI();
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType || 'image/jpeg'
                }
              },
              {
                text: promptText
              }
            ]
          }
        });

        let outputBase64 = null;
        if (response?.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              outputBase64 = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        }
        return outputBase64;
      };

      const results = await Promise.allSettled([
        runModel(prompt1),
        runModel(prompt2)
      ]);

      const outputs = results
        .filter((r): r is PromiseFulfilledResult<string | null> => r.status === 'fulfilled' && !!r.value)
        .map(r => r.value as string);

      if (outputs.length === 0) {
        const firstRejection = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
        throw new Error(firstRejection?.reason?.message || 'AI was unable to generate edited images. Please try different options.');
      }

      res.json({ outputs });
    } catch (error: any) {
      console.error("AI Passport Maker Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  
  // --- PARTNER SUBSCRIPTION PLANS & USAGE HELPER ---
  async function calculateShopPlanUsage(shopId: string, preloadedShop?: any) {
    let shop = preloadedShop;
    if (!shop) {
      try {
        shop = await getFirestoreDoc('shops', shopId);
      } catch (dbErr: any) {
        console.warn('Could not query shop:', dbErr.message);
      }
    }

    if (!shop) {
      shop = { plan: 'free' };
    }

    const rawPlan = (shop.plan || shop.subscription?.plan || 'free').toLowerCase();
    const plan: 'free' | 'starter' | 'business' | 'business_plus' = 
      ['free', 'starter', 'business', 'business_plus'].includes(rawPlan) ? rawPlan : 'free';

    const now = Date.now();
    const nowDate = new Date(now);
    const calendarStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();
    const calendarEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

    let periodStart = calendarStart;
    let periodEnd = calendarEnd;

    if (shop.subscription?.periodStart && shop.subscription?.periodEnd) {
      if (now >= shop.subscription.periodStart && now <= shop.subscription.periodEnd) {
        periodStart = shop.subscription.periodStart;
        periodEnd = shop.subscription.periodEnd;
      } else if (now > shop.subscription.periodEnd) {
        // Automatically advance the billing period
        const cycleMs = 30 * 24 * 60 * 60 * 1000;
        let nextStart = shop.subscription.periodStart;
        let nextEnd = shop.subscription.periodEnd;
        while (now > nextEnd) {
          nextStart = nextEnd;
          nextEnd = nextStart + cycleMs;
        }
        periodStart = nextStart;
        periodEnd = nextEnd;
      }
    }

    // Query non-cancelled orders created within the current period
    let ordersUsed = 0;
    try {
      const orders = await queryFirestoreOrders(shopId, periodStart);
      for (const o of orders) {
        if (o.status !== 'Cancelled') {
          ordersUsed++;
        }
      }
    } catch (orderQueryErr: any) {
      console.warn('Could not query orders:', orderQueryErr.message);
    }

    const PLAN_LIMITS: Record<string, number | null> = {
      free: 10,
      starter: 200,
      business: 1000,
      business_plus: null // 1,000+ / effectively unlimited
    };

    const orderLimit = PLAN_LIMITS[plan];
    const isLimitReached = orderLimit !== null ? ordersUsed >= orderLimit : false;
    const ordersRemaining = orderLimit !== null ? Math.max(0, orderLimit - ordersUsed) : null;

    const PLAN_NAMES: Record<string, string> = {
      free: 'Free',
      starter: 'Starter',
      business: 'Business',
      business_plus: 'Business Plus'
    };

    const businessPlusPrice = Number(shop.businessPlusPrice || shop.subscription?.customBusinessPlusPrice || 999);

    return {
      shopId,
      plan,
      planName: PLAN_NAMES[plan] || 'Free',
      orderLimit,
      ordersUsed,
      ordersRemaining,
      isLimitReached,
      periodStart,
      periodEnd,
      businessPlusPrice
    };
  }

  // API to fetch real-time plan usage for a shop
  app.get('/api/shops/:shopId/plan-usage', async (req, res) => {
    try {
      const { shopId } = req.params;
      const usage = await calculateShopPlanUsage(shopId);
      res.json({ success: true, usage });
    } catch (err: any) {
      console.error('Plan usage error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API to validate if an order can be created for this shop
  app.post('/api/orders/validate-shop-limit', async (req, res) => {
    try {
      const { shopId } = req.body;
      if (!shopId) return res.status(400).json({ error: 'Shop ID is required' });
      const usage = await calculateShopPlanUsage(shopId);
      if (usage.isLimitReached) {
        return res.status(403).json({
          allowed: false,
          error: `Monthly order limit reached: ${usage.ordersUsed} / ${usage.orderLimit} orders used on the ${usage.planName} plan. Please upgrade to accept additional orders.`,
          usage
        });
      }
      res.json({ allowed: true, usage });
    } catch (err: any) {
      console.error('Order limit validation error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API to create an order securely with backend validation
  app.post('/api/orders/create', async (req, res) => {
    try {
      const { orderData } = req.body;
      if (!orderData || !orderData.shopId) {
        return res.status(400).json({ error: 'Order data with shopId is required' });
      }

      const usage = await calculateShopPlanUsage(orderData.shopId);
      if (usage.isLimitReached) {
        return res.status(403).json({
          allowed: false,
          limitReached: true,
          error: `Monthly order limit reached: ${usage.ordersUsed} / ${usage.orderLimit} orders used on the ${usage.planName} plan.`,
          usage
        });
      }

      const orderId = orderData.id || `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const finalOrder = {
        ...orderData,
        id: orderId,
        createdAt: orderData.createdAt || Date.now()
      };

      await updateFirestoreDoc('orders', orderId, finalOrder);
      res.json({ success: true, orderId: orderId, token: finalOrder.token });
    } catch (err: any) {
      console.error('Secure order creation error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API to subscribe or upgrade shop plan
  app.post('/api/shops/:shopId/plan', async (req, res) => {
    try {
      const { shopId } = req.params;
      const { plan, businessPlusPrice } = req.body;
      const validPlans = ['free', 'starter', 'business', 'business_plus'];
      if (!validPlans.includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan selected' });
      }

      const updateData: any = {
        plan,
        subscription: {
          plan,
          periodStart: Date.now(),
          periodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now(),
          status: 'active'
        }
      };

      if (businessPlusPrice !== undefined && !isNaN(Number(businessPlusPrice))) {
        updateData.businessPlusPrice = Number(businessPlusPrice);
        updateData.subscription.customBusinessPlusPrice = Number(businessPlusPrice);
      }

      await updateFirestoreDoc('shops', shopId, updateData);
      const usage = await calculateShopPlanUsage(shopId);
      res.json({ success: true, message: `Successfully upgraded to ${usage.planName} Plan!`, usage });
    } catch (err: any) {
      console.error('Plan upgrade error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API to configure Business Plus price from admin settings
  app.post('/api/shops/:shopId/settings/business-plus-price', async (req, res) => {
    try {
      const { shopId } = req.params;
      const { price } = req.body;
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ error: 'Valid price is required' });
      }

      await updateFirestoreDoc('shops', shopId, {
        businessPlusPrice: numPrice
      });

      res.json({ success: true, price: numPrice });
    } catch (err: any) {
      console.error('Business Plus price config error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // RAZORPAY SUBSCRIPTION APIs (PrintHub Platform)
  // Routes subscription plans to platform Razorpay account
  // ==========================================
  app.post('/api/razorpay/create-subscription-order', async (req, res) => {
    try {
      const { planId, shopId, customPrice } = req.body;
      if (!planId || !shopId) {
        return res.status(400).json({ error: 'planId and shopId are required' });
      }

      if (planId === 'free') {
        await updateFirestoreDoc('shops', shopId, {
          plan: 'free',
          subscription: {
            plan: 'free',
            periodStart: Date.now(),
            periodEnd: Date.now() + 365 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now(),
            status: 'active'
          }
        });
        return res.json({ success: true, isFree: true, planId: 'free' });
      }

      let price = 0;
      let planName = 'Starter';
      if (planId === 'starter') {
        price = 99;
        planName = 'Starter Plan';
      } else if (planId === 'business') {
        price = 499;
        planName = 'Business Plan';
      } else if (planId === 'business_plus') {
        price = (customPrice && !isNaN(Number(customPrice))) ? Number(customPrice) : 999;
        planName = 'Business Plus Plan';
      } else {
        return res.status(400).json({ error: 'Invalid plan selected' });
      }

      const amountInPaise = Math.round(price * 100);
      const receipt = `sub_${shopId.slice(0, 8)}_${Date.now().toString().slice(-6)}`;

      const rzpOrder = await platformRazorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          shopId,
          planId,
          price: price.toString(),
          purpose: 'PrintHub Subscription'
        }
      });

      res.json({
        success: true,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || 'INR',
        keyId: PLATFORM_RAZORPAY_KEY_ID,
        planId,
        planName,
        price
      });
    } catch (err: any) {
      console.error('Create Razorpay subscription order error:', err);
      res.status(500).json({ error: err.message || 'Failed to create subscription order' });
    }
  });

  app.post('/api/razorpay/verify-subscription', async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shopId, planId, customPrice } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !shopId || !planId) {
        return res.status(400).json({ error: 'Missing required Razorpay verification fields' });
      }

      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', PLATFORM_RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment signature verification failed' });
      }

      const updateData: any = {
        plan: planId,
        subscription: {
          plan: planId,
          periodStart: Date.now(),
          periodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now(),
          status: 'active',
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id
        }
      };

      if (planId === 'business_plus' && customPrice && !isNaN(Number(customPrice))) {
        updateData.businessPlusPrice = Number(customPrice);
        updateData.subscription.customBusinessPlusPrice = Number(customPrice);
      }

      await updateFirestoreDoc('shops', shopId, updateData);
      res.json({ success: true, message: `Successfully subscribed to ${planId}!`, planId });
    } catch (err: any) {
      console.error('Verify Razorpay subscription error:', err);
      res.status(500).json({ error: err.message || 'Failed to verify subscription' });
    }
  });

  // ==========================================
  // SHOP OWNER CUSTOMER PAYMENT SETTINGS APIs
  // Allows shop owners to test and save their Razorpay & UPI details
  // ==========================================
  app.post('/api/shops/:shopId/test-razorpay', async (req, res) => {
    try {
      const { keyId, keySecret } = req.body;
      const testKey = (keyId || '').trim();
      const testSecret = (keySecret || '').trim();

      if (!testKey || !testSecret) {
        return res.status(400).json({ success: false, error: 'Both Key ID and Key Secret are required to test connection' });
      }

      const authHeader = 'Basic ' + Buffer.from(`${testKey}:${testSecret}`).toString('base64');
      const checkRes = await fetch('https://api.razorpay.com/v1/orders?count=1', {
        method: 'GET',
        headers: {
          Authorization: authHeader
        }
      });

      if (checkRes.ok) {
        return res.json({ success: true, message: 'Razorpay keys verified successfully! Live API connection confirmed.' });
      } else {
        const errJson = await checkRes.json().catch(() => ({}));
        const desc = errJson?.error?.description || `Authentication failed (${checkRes.status}). Please check your Key ID and Key Secret.`;
        return res.status(400).json({ success: false, error: desc });
      }
    } catch (err: any) {
      console.error('Test Razorpay connection error:', err);
      res.status(500).json({ success: false, error: err.message || 'Connection test failed' });
    }
  });

  app.post('/api/shops/:shopId/payment-settings', async (req, res) => {
    try {
      const { shopId } = req.params;
      const {
        razorpayEnabled,
        razorpayKeyId,
        razorpayKeySecret,
        upiEnabled,
        upiId,
        cashOnCounterEnabled
      } = req.body;

      const updateData: any = {
        razorpayEnabled: Boolean(razorpayEnabled),
        razorpayKeyId: (razorpayKeyId || '').trim(),
        upiEnabled: Boolean(upiEnabled),
        upiId: (upiId || '').trim(),
        cashOnCounterEnabled: cashOnCounterEnabled !== false
      };

      if (razorpayKeySecret && razorpayKeySecret.trim() && !razorpayKeySecret.includes('••••')) {
        updateData.razorpayKeySecret = razorpayKeySecret.trim();
      }

      await updateFirestoreDoc('shops', shopId, updateData);
      res.json({ success: true, message: 'Payment settings saved securely!' });
    } catch (err: any) {
      console.error('Save payment settings error:', err);
      res.status(500).json({ error: err.message || 'Failed to save payment settings' });
    }
  });

  // ==========================================
  // CUSTOMER PRINT ORDER PAYMENT APIs
  // Supports shop's own Razorpay keys with safe fallback
  // ==========================================
  app.post('/api/shops/:shopId/create-order-payment', async (req, res) => {
    try {
      const { shopId } = req.params;
      const { orderId, amount } = req.body;
      if (!orderId || !amount) {
        return res.status(400).json({ error: 'orderId and amount are required' });
      }

      let shop = await getFirestoreDoc('shops', shopId);
      if (!shop && (shopId === 'demo-local-shop' || shopId.startsWith('demo-'))) {
        shop = { id: shopId, name: 'Demo Print Shop' };
      }
      if (!shop) return res.status(404).json({ error: 'Shop not found' });

      // Check monthly plan limit
      const planUsage = await calculateShopPlanUsage(shopId, shop);
      if (planUsage.isLimitReached) {
        return res.status(403).json({
          error: `Shop has reached its monthly order limit (${planUsage.ordersUsed} / ${planUsage.orderLimit} orders used on the ${planUsage.planName} plan). Please upgrade your subscription to accept additional orders.`,
          limitReached: true,
          upgradeRequired: true,
          usage: planUsage
        });
      }

      let rzpClient = platformRazorpay;
      let usedKeyId = PLATFORM_RAZORPAY_KEY_ID;

      // If the shop owner configured valid custom credentials, route payments to them
      if (shop.razorpayKeyId && shop.razorpayKeySecret && shop.razorpayEnabled !== false) {
        try {
          rzpClient = new Razorpay({
            key_id: shop.razorpayKeyId.trim(),
            key_secret: shop.razorpayKeySecret.trim()
          });
          usedKeyId = shop.razorpayKeyId.trim();
        } catch (initErr) {
          console.warn('Failed to initialize shop Razorpay client, falling back safely to platform:', initErr);
          rzpClient = platformRazorpay;
          usedKeyId = PLATFORM_RAZORPAY_KEY_ID;
        }
      }

      const amountInPaise = Math.max(100, Math.round(Number(amount) * 100)); // Minimum 100 paise (₹1)
      const receipt = `ord_${orderId.slice(0, 8)}_${Date.now().toString().slice(-6)}`;

      const order = await rzpClient.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          orderId,
          shopId,
          shopName: shop.name || 'Print Shop'
        }
      });

      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency || 'INR',
        keyId: usedKeyId,
        shopName: shop.name || 'Print Shop'
      });
    } catch (err: any) {
      console.error('Create customer order payment error:', err);
      res.status(500).json({ error: err.message || 'Payment initiation failed' });
    }
  });

  app.post('/api/shops/:shopId/verify-order-payment', async (req, res) => {
    try {
      const { shopId } = req.params;
      const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing required Razorpay payment verification fields' });
      }

      const shop = await getFirestoreDoc('shops', shopId);
      let secret = PLATFORM_RAZORPAY_KEY_SECRET;
      if (shop?.razorpayKeySecret && shop.razorpayEnabled !== false) {
        secret = shop.razorpayKeySecret.trim();
      }

      // Verify signature
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      let expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      // Fallback check against platform secret if shop secret mismatch
      if (expectedSignature !== razorpay_signature && secret !== PLATFORM_RAZORPAY_KEY_SECRET) {
        expectedSignature = crypto
          .createHmac('sha256', PLATFORM_RAZORPAY_KEY_SECRET)
          .update(body)
          .digest('hex');
      }

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Invalid payment signature' });
      }

      // Update order status in Firestore
      await updateFirestoreDoc('orders', orderId, {
        status: 'Payment Complete',
        paidAt: Date.now(),
        paymentMethod: 'razorpay',
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id
      });

      res.json({ success: true, orderId });
    } catch (err: any) {
      console.error('Verify customer order payment error:', err);
      res.status(500).json({ error: err.message || 'Payment verification failed' });
    }
  });

  // Legacy fallback compatibility
  app.post('/api/phonepe/pay', async (req, res) => {
    res.status(400).json({ error: 'Payment gateway upgraded to Razorpay. Please use Razorpay checkout.' });
  });

  app.get('/api/companion/validate', async (req, res) => {
    try {
      const { shopId } = req.query;
      if (!shopId) return res.status(400).json({ valid: false, error: 'Shop ID required' });
      
      const shop = await getFirestoreDoc('shops', shopId as string);
      
      if (shop) {
        return res.json({ valid: true, name: shop.name || 'My Print Shop' });
      } else {
        return res.json({ valid: false, error: 'Shop not found' });
      }
    } catch (e: any) {
      res.status(500).json({ valid: false, error: e.message });
    }
  });

  // 2. Fetch pending orders for shop
  app.get('/api/companion/pending-orders', async (req, res) => {
    try {
      const { shopId } = req.query;
      if (!shopId) return res.status(400).json({ error: 'Shop ID required' });
      
      const pending = await queryFirestorePendingOrders(shopId as string);
      res.json(pending);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 3. Compile and download a unified print PDF for a specific order
  app.get('/api/companion/download-pdf/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await getFirestoreDoc('orders', orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      if (!order) {
        return res.status(404).json({ error: 'Order data is empty' });
      }
      
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();
      
      if (order.files && order.files.length > 0) {
        for (const fileObj of order.files) {
          if (!fileObj.fileUrl) continue;
          
          let arrayBuffer: ArrayBuffer;
          if (fileObj.fileUrl.startsWith('/uploads/')) {
            const localPath = path.join(process.cwd(), fileObj.fileUrl);
            const fileBuf = fsSync.readFileSync(localPath);
            arrayBuffer = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);
          } else {
            const fileRes = await fetch(fileObj.fileUrl);
            arrayBuffer = await fileRes.arrayBuffer();
          }
          
          if (fileObj.fileType === 'application/pdf') {
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach(p => mergedPdf.addPage(p));
          } else if (fileObj.fileType.startsWith('image/')) {
            const isLandscape = fileObj.settings?.orientation === 'Landscape';
            const pageWidth = isLandscape ? 841.890 : 595.276;
            const pageHeight = isLandscape ? 595.276 : 841.890;
            const imagePage = mergedPdf.addPage([pageWidth, pageHeight]);

            let embeddedImg;
            if (fileObj.fileType === 'image/jpeg' || fileObj.fileType === 'image/jpg') {
              embeddedImg = await mergedPdf.embedJpg(arrayBuffer);
            } else {
              embeddedImg = await mergedPdf.embedPng(arrayBuffer);
            }

            const isFit = fileObj.settings?.fitToPage !== false;
            let width: number;
            let height: number;

            if (isFit) {
              // Safe printable margins (18pt / ~6.35mm margin) so physical printer edges never crop
              const margin = 18;
              const printableWidth = pageWidth - (margin * 2);
              const printableHeight = pageHeight - (margin * 2);
              const scaled = embeddedImg.scaleToFit(printableWidth, printableHeight);
              width = scaled.width;
              height = scaled.height;
            } else {
              // 100% / full unmargined scale
              const scaled = embeddedImg.scaleToFit(pageWidth, pageHeight);
              width = scaled.width;
              height = scaled.height;
            }

            imagePage.drawImage(embeddedImg, {
              x: (pageWidth - width) / 2,
              y: (pageHeight - height) / 2,
              width,
              height
            });
          }
        }
      }
      
      const finalPdfBytes = await mergedPdf.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=PrintHub_Job_${order.token}.pdf`);
      res.send(Buffer.from(finalPdfBytes));
    } catch (e: any) {
      console.error("Server-side PDF compile error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // 4. Update order status
  app.post('/api/companion/update-status', async (req, res) => {
    try {
      const { orderId, status } = req.body;
      if (!orderId || !status) return res.status(400).json({ error: 'Order ID and status required' });
      
      await updateFirestoreDoc('orders', orderId as string, { status });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Helper to dynamically build customized PrintBridge ZIP with pre-baked shopId and cloud host
  function generatePrintBridgeZip(shopId: string, apiHost: string) {
    const zip = new AdmZip();

    const batPath = path.join(process.cwd(), 'Start-PrintBridge.bat');
    const ps1Path = path.join(process.cwd(), 'print-bridge.ps1');
    const jsPath = path.join(process.cwd(), 'print-bridge.js');
    const macPath = path.join(process.cwd(), 'Start-PrintBridge-Mac.command');
    const readmePath = path.join(process.cwd(), 'README-Setup.txt');

    if (fsSync.existsSync(batPath)) zip.addLocalFile(batPath);
    if (fsSync.existsSync(ps1Path)) zip.addLocalFile(ps1Path);
    if (fsSync.existsSync(jsPath)) zip.addLocalFile(jsPath);
    if (fsSync.existsSync(macPath)) zip.addLocalFile(macPath);
    if (fsSync.existsSync(readmePath)) zip.addLocalFile(readmePath);

    const configObj = {
      shopId: shopId || '',
      apiHost: apiHost,
      port: 1337
    };
    zip.addFile('printbridge-config.json', Buffer.from(JSON.stringify(configObj, null, 2), 'utf8'));

    return zip.toBuffer();
  }

  // Dynamic Companion & Native App Download Routes
  app.get(['/api/download/windows', '/api/download/macos', '/api/companion/download-package'], (req, res) => {
    try {
      const shopId = (req.query.shopId as string) || '';
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const apiHost = `${protocol}://${host}`;

      const buffer = generatePrintBridgeZip(shopId, apiHost);
      const isMac = req.path.includes('macos');
      const filename = isMac 
        ? `PrintHub-PrintBridge-macOS${shopId ? `-${shopId.slice(0, 6)}` : ''}.zip`
        : `PrintHub-PrintBridge-Windows${shopId ? `-${shopId.slice(0, 6)}` : ''}.zip`;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.send(buffer);
    } catch (e: any) {
      console.error("Error creating dynamic PrintBridge zip:", e);
      const fallbackPath = path.join(process.cwd(), 'public', 'bin', 'PrintHub-Companion.zip');
      if (fsSync.existsSync(fallbackPath)) {
        res.download(fallbackPath, 'PrintHub-PrintBridge.zip');
      } else {
        res.status(500).json({ error: 'Failed to generate companion package' });
      }
    }
  });

  app.get('/api/download/android', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PrintHub Android App</title>
  <link rel="manifest" href="/manifest.json" />
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: white; border-radius: 24px; padding: 32px; max-width: 420px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .btn { background: #4f46e5; color: white; border: none; padding: 14px 24px; border-radius: 14px; font-weight: 700; font-size: 16px; width: 100%; cursor: pointer; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 48px; margin-bottom: 12px;">📱</div>
    <h2 style="margin: 0 0 8px 0; font-size: 22px;">PrintHub Android App</h2>
    <p style="font-size: 14px; color: #64748b; line-height: 1.5;">Tap below to launch PrintHub. In Chrome, tap the menu (⋮) and select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</p>
    <button class="btn" onclick="window.location.href='/'">Launch & Install PrintHub</button>
  </div>
</body>
</html>`);
  });

  app.get('/api/download/bridge-script', (req, res) => {
    const filePath = path.join(process.cwd(), 'print-bridge.js');
    if (fsSync.existsSync(filePath)) {
      res.download(filePath, 'print-bridge.js');
    } else {
      res.status(404).send('Bridge script not found');
    }
  });

  // Explicitly return JSON 404 for any unmatched /api/* route so it NEVER falls through to Vite HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
  });

  // Global API error handler ensuring JSON responses instead of default HTML error pages
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api') || req.headers.accept?.includes('application/json')) {
      console.error("API Error encountered:", err);
      const status = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 500);
      return res.status(status).json({
        error: err.message || 'Internal server error',
        code: err.code || 'SERVER_ERROR'
      });
    }
    next(err);
  });

  // Detect if we should run in production mode
  const isProduction = process.env.NODE_ENV === 'production' || 
                       !fsSync.existsSync(path.join(process.cwd(), 'server.ts')) || 
                       process.argv[1]?.includes('dist/server.cjs') ||
                       process.argv[1]?.includes('server.cjs');

  // Vite middleware for development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
