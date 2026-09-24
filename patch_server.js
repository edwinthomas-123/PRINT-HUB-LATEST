const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// replace Stripe routes
const startIndex = code.indexOf('app.get(\'/api/stripe/config');
const endIndex = code.indexOf("app.get('/api/companion/validate", startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find bounds");
  process.exit(1);
}

const phonepeCode = `
  app.post('/api/phonepe/pay', async (req, res) => {
    try {
      const { amount, shopId, orderId } = req.body;
      const dbAdmin = getFirestoreDb();
      const shopDoc = await dbAdmin.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) return res.status(404).json({ error: 'Shop not found' });
      const shop = shopDoc.data();
      
      const merchantId = shop.phonepeMerchantId;
      const saltKey = shop.phonepeSaltKey;
      const saltIndex = shop.phonepeSaltIndex;
      
      if (!merchantId || !saltKey || !saltIndex) {
        return res.status(400).json({ error: 'PhonePe credentials not configured for this shop' });
      }

      const payload = {
        merchantId: merchantId,
        merchantTransactionId: orderId,
        merchantUserId: shopId,
        amount: Math.round(amount * 100),
        redirectUrl: \`https://\${req.get('host')}/api/phonepe/callback?orderId=\${orderId}&shopId=\${shopId}\`,
        redirectMode: "POST",
        callbackUrl: \`https://\${req.get('host')}/api/phonepe/callback?orderId=\${orderId}&shopId=\${shopId}\`,
        paymentInstrument: {
          type: "PAY_PAGE"
        }
      };

      const payloadString = JSON.stringify(payload);
      const base64EncodedPayload = Buffer.from(payloadString).toString("base64");
      
      const crypto = await import('crypto');
      const stringToSign = base64EncodedPayload + "/pg/v1/pay" + saltKey;
      const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
      const checksum = sha256 + "###" + saltIndex;

      // Note: For prod, use api.phonepe.com
      const phonepeEndpoint = 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';

      const response = await fetch(phonepeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum
        },
        body: JSON.stringify({ request: base64EncodedPayload })
      });
      
      const data = await response.json();
      if (data.success && data.data?.instrumentResponse?.redirectInfo) {
        res.json({ url: data.data.instrumentResponse.redirectInfo.url });
      } else {
        throw new Error(data.message || 'Payment initiation failed');
      }
    } catch (error: any) {
      console.error('PhonePe error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/phonepe/callback', async (req, res) => {
    try {
      const { orderId } = req.query;
      const { code } = req.body;
      
      if (code === 'PAYMENT_SUCCESS') {
        const dbAdmin = getFirestoreDb();
        await dbAdmin.collection('orders').doc(orderId).update({
          status: 'Payment Complete'
        });
      }
      
      res.redirect(\`/track/\${orderId}\`);
    } catch (e) {
      console.error('Callback error:', e);
      res.redirect('/dashboard');
    }
  });

  `;

code = code.substring(0, startIndex) + phonepeCode + code.substring(endIndex);
fs.writeFileSync('server.ts', code);
