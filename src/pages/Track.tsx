import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PrintOrder } from '../types';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';

export function Track() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<PrintOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prevStatus = useRef<string | null>(null);
  
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!orderId) return;
    const docRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      setError(null);
      if (docSnap.exists()) {
        const data = docSnap.data() as PrintOrder;
        setOrder({ id: docSnap.id, ...data });
        
        if (prevStatus.current && prevStatus.current !== data.status) {
           toast.success(`Order Status Update: ${data.status}`, { icon: '🔔' });
           if (Notification.permission === 'granted') {
             new Notification('PrintHub Order Update', { body: `Your order is now: ${data.status}` });
           }
        }
        prevStatus.current = data.status;
      } else {
        setError("Order not found");
      }
    }, (err) => {
      console.error("Firestore onSnapshot error:", err);
      setError(err?.message || String(err));
      handleFirestoreError(err, OperationType.GET, `orders/${orderId}`);
    });
    return () => unsubscribe();
  }, [orderId]);

  if (error) {
    const isOffline = error.toLowerCase().includes('offline') || error.toLowerCase().includes('network') || error.toLowerCase().includes('failed to get document') || error.toLowerCase().includes('unavailable');
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center my-8">
        <div className={`w-16 h-16 ${isOffline ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-2">{isOffline ? "Connection is Offline" : "Error Tracking Order"}</h1>
        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
          {isOffline 
            ? "Your connection is offline or the database is currently unreachable. Please check your internet connection."
            : error}
        </p>
        <button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition">
          Retry Connection
        </button>
      </div>
    );
  }

  if (!order) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>;

  const statuses = [
    'Uploaded',
    'Payment Complete',
    'Waiting',
    'Printing Started',
    'Printing Completed',
    'Ready for Pickup',
    'Completed'
  ];
  const currentIndex = statuses.indexOf(order.status);

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
      <h1 className="text-xl font-bold mb-2">Order Status</h1>
      <p className="text-slate-500 mb-8 text-sm">Token: <span className="text-slate-900 font-mono font-bold text-base bg-slate-100 px-2 py-0.5 rounded ml-1">{order.token}</span></p>

      <div className="space-y-6 text-left">
        {statuses.map((s, i) => {
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;
          
          return (
            <div key={s} className={`flex items-center gap-4 text-sm ${isPast || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPast ? 'bg-green-50 text-green-600' : isCurrent ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100'}`}>
                {isPast ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <span className={`font-medium ${isCurrent ? 'font-bold' : ''}`}>{s}</span>
            </div>
          );
        })}
      </div>
      
      {order.status === 'Ready for Pickup' && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          <p className="font-bold mb-1">Ready for Collection!</p>
          <p>Show your token <strong className="font-mono bg-white px-1 rounded">{order.token}</strong> at the shop to collect your prints.</p>
        </div>
      )}
    </div>
  );
}
