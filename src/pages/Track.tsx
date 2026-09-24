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
    <div className="max-w-lg mx-auto bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 text-center animate-fade-in">
      <h1 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Order Status</h1>
      <p className="text-slate-500 mb-8 text-xs sm:text-sm">
        Token: <span className="text-indigo-600 font-mono font-black text-base sm:text-lg bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-xl ml-1 shadow-2xs tracking-wider inline-block">{order.token}</span>
      </p>

      <div className="space-y-6 text-left relative pl-1">
        {statuses.map((s, i) => {
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;
          
          return (
            <div key={s} className={`relative flex items-center gap-4 text-sm ${isPast || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
              {/* Connecting line */}
              {i < statuses.length - 1 && (
                <div 
                  className={`absolute left-[15px] top-[30px] w-[2px] h-[calc(100%+8px)] z-0 ${
                    i < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} 
                />
              )}
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                isPast 
                  ? 'bg-emerald-50 text-emerald-600 ring-2 ring-emerald-500/20 shadow-2xs' 
                  : isCurrent 
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/25 shadow-sm' 
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {isPast ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <span className={`transition-all ${
                isCurrent 
                  ? 'font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-150' 
                  : isPast 
                  ? 'font-medium text-slate-800' 
                  : 'text-slate-400 font-normal'
              }`}>
                {s}
              </span>
            </div>
          );
        })}
      </div>
      
      {order.status === 'Ready for Pickup' && (
        <div className="mt-8 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl text-emerald-900 text-sm shadow-xs animate-fade-in text-left">
          <p className="font-bold mb-1 flex items-center gap-1.5 text-emerald-800 text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Ready for Collection!
          </p>
          <p className="text-emerald-700 text-xs sm:text-sm mt-1 leading-relaxed">
            Show your token <strong className="font-mono bg-white border border-emerald-300 px-2 py-0.5 rounded text-emerald-900 font-bold">{order.token}</strong> at the shop to collect your prints.
          </p>
        </div>
      )}
    </div>
  );
}
