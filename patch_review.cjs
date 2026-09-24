const fs = require('fs');
let code = fs.readFileSync('src/pages/Review.tsx', 'utf8');

const handlerCode = `
  const handlePhonePePayment = async () => {
    setLoading(true);
    try {
      const orderId = await createOrderAndUpload();
      if (!orderId) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/phonepe/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: state.price,
          shopId,
          orderId
        })
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Payment failed to initiate');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message);
      setLoading(false);
    }
  };

  const createOrderAndUpload = async () => {
    const token = generateOrderToken();
    const orderData: any = {
      customerId: user!.uid,
      shopId,
      status: 'Waiting',
      price: state.price,
      token,
      createdAt: Date.now()
    };
    try {
      const orderRef = doc(collection(db, 'orders'));
      orderData.id = orderRef.id;
      // Upload files
      const storage = (await import('../firebase')).storage;
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      
      const uploadedFiles = [];
      for (const uf of state.uploadFiles) {
        if (uf.file) {
          const fileRef = ref(storage, \`orders/\${orderRef.id}/\${uf.file.name}\`);
          await uploadBytes(fileRef, uf.file);
          const url = await getDownloadURL(fileRef);
          uploadedFiles.push({ ...uf, fileUrl: url, filePath: fileRef.fullPath, file: undefined });
        } else {
          uploadedFiles.push(uf);
        }
      }
      orderData.files = uploadedFiles;
      orderData.settings = state.uploadFiles[0].settings;
      
      await setDoc(orderRef, orderData);
      return orderRef.id;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };
`;

code = code.replace('const handlePayment = async (useWallet: boolean) => {', handlerCode + '\n  const handlePayment = async (useWallet: boolean) => {');

fs.writeFileSync('src/pages/Review.tsx', code);
