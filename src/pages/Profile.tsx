import { User } from 'firebase/auth';
import { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, onSnapshot, getDocFromCache, getDocsFromCache } from 'firebase/firestore';
import { db, logOut, handleFirestoreError, OperationType } from '../firebase';
import { PrintOrder, Shop, UserProfile } from '../types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, LogOut, Search, Filter, MapPin, Clock, Tag, CheckCircle2, Printer, Layers, ArrowRight, Wallet, XCircle, Sparkles, Folder, Trash2, Download } from 'lucide-react';

export function Profile({ user }: { user: User | null }) {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [shops, setShops] = useState<Record<string, Shop>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'files'>('orders');
  const [editingBalance, setEditingBalance] = useState(false);
  const [customBalanceInput, setCustomBalanceInput] = useState('');

  const handleSaveCustomBalance = async () => {
    if (!user || !profile) return;
    const amount = parseFloat(customBalanceInput);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid balance amount");
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid), { walletBalance: amount }, { merge: true });
      setProfile({ ...profile, walletBalance: amount });
      toast.success(`Wallet balance updated to ₹${amount.toFixed(2)}!`);
      setEditingBalance(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update wallet balance");
    }
  };

  const prevOrders = useRef<Record<string, string>>({});

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    async function loadWalletAndShops() {
      try {
        setLoading(true);
        const userRef = doc(db, 'users', user!.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userRef);
        } catch (err: any) {
          console.warn("getDoc offline:", err);
        }
        if (!userSnap) {
          const offlineProfile: UserProfile = { uid: user!.uid, email: user!.email || '', walletBalance: 0, displayName: user!.displayName || user!.email?.split('@')[0] || 'User' };
          setProfile(offlineProfile);
        } else if (!userSnap.exists()) {
           const newProfile: UserProfile = { uid: user!.uid, email: user!.email || '', walletBalance: 0 };
           try {
             await setDoc(userRef, newProfile);
           } catch (setErr) {
             console.warn("Could not write new profile:", setErr);
           }
           setProfile(newProfile);
        } else {
           setProfile(userSnap.data() as UserProfile);
        }
        
        const qShops = query(collection(db, 'shops'));
        let shopsSnap;
        try {
          shopsSnap = await getDocs(qShops);
        } catch (getDocsErr: any) {
          if (getDocsErr.message?.toLowerCase().includes('offline') || getDocsErr.code === 'unavailable') {
            try {
              shopsSnap = await getDocsFromCache(qShops);
            } catch (cacheErr) {
              console.warn("Failed to get shops from cache:", cacheErr);
            }
          }
        }

        const shopMap: Record<string, Shop> = {};
        if (shopsSnap) {
          shopsSnap.forEach(d => { shopMap[d.id] = { id: d.id, ...d.data() } as Shop; });
        }
        setShops(shopMap);
      } catch(err) {
        handleFirestoreError(err, OperationType.GET, 'users/shops');
      }
    }
    
    loadWalletAndShops();

    const qOrders = query(collection(db, 'orders'), where('customerId', '==', user.uid));
    const unsubscribe = onSnapshot(qOrders, (snap) => {
      const loaded: PrintOrder[] = [];
      snap.forEach(d => loaded.push({ id: d.id, ...d.data() } as PrintOrder));
      loaded.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(loaded);
      setLoading(false);
      
      // Notifications for changes
      snap.docChanges().forEach(change => {
         if (change.type === 'modified') {
            const data = change.doc.data();
            const oldStatus = prevOrders.current[change.doc.id];
            if (oldStatus && oldStatus !== data.status) {
               toast.success(`Order Status: ${data.status}`, { icon: '🔔' });
               if (Notification.permission === 'granted') {
                 new Notification('PrintHub Order Update', { body: `Your order is now: ${data.status}` });
               }
            }
         }
         prevOrders.current[change.doc.id] = change.doc.data().status;
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  const handleCancelOrder = async (order: PrintOrder) => {
    if (!user || !profile || !order.id) return;
    const confirmCancel = window.confirm("Are you sure you want to cancel this order? The amount will be refunded to your in-app wallet.");
    if (!confirmCancel) return;
    
    setCancellingId(order.id);
    try {
      // Refund to wallet
      const newBalance = profile.walletBalance + order.price;
      await setDoc(doc(db, 'users', user.uid), { walletBalance: newBalance }, { merge: true });
      setProfile({ ...profile, walletBalance: newBalance });
      
      // Update order status
      await updateDoc(doc(db, 'orders', order.id), { status: 'Cancelled' });
      
      setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'Cancelled' } : o));
      toast.success("Order cancelled. Amount refunded to wallet.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to cancel order.");
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) return <div className="text-center p-12 text-slate-500">Please sign in to view your profile.</div>;

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'Uploaded': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Payment Complete': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Waiting': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Printing Started': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Printing Completed': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Ready for Pickup': return 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse font-semibold';
      case 'Completed': return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };


  const handleDeleteFile = async (filePath: string, orderId: string, fileIdx: number) => {
    if (!window.confirm("Are you sure you want to delete this file from everywhere?")) return;
    try {
      if (filePath) {
        try {
          await fetch('/api/delete-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath })
          });
        } catch (delErr) {
          console.warn('File removal error:', delErr);
        }
      }
      
      const orderRef = doc(db, 'orders', orderId);
      const order = orders.find(o => o.id === orderId);
      if (order && order.files) {
         const newFiles = [...order.files];
         newFiles[fileIdx] = { ...newFiles[fileIdx], fileUrl: '', filePath: '' };
         await updateDoc(orderRef, { files: newFiles });
      }
      toast.success("File deleted");
    } catch(err) {
       console.error(err);
       toast.error("Failed to delete file");
    }
  };

  const filteredOrders = orders.filter(order => {
    const shopName = shops[order.shopId]?.name || 'Unknown Print Shop';
    const firstFileName = order.files && order.files.length > 0 ? order.files[0].fileName : (order as any).fileName || '';
    
    const matchesSearch = 
      firstFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.token.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Active') return order.status !== 'Completed' && order.status !== 'Cancelled';
    if (statusFilter === 'Completed') return order.status === 'Completed';
    return order.status === statusFilter;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Profile Header */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-150 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || 'User'}`} 
              referrerPolicy="no-referrer"
              alt="Profile" 
              className="w-16 h-16 rounded-full bg-slate-100 border-2 border-indigo-100 shadow-sm object-cover" 
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900">{user.displayName}</h1>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-1 inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Customer Account
              </div>
            </div>
          </div>
          <button 
            onClick={logOut} 
            className="flex items-center gap-2 text-slate-600 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition text-sm font-medium border border-slate-200 hover:border-red-100"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 px-2">
         <button 
           className={`pb-3 text-sm font-semibold transition ${activeTab === 'orders' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
           onClick={() => setActiveTab('orders')}
         >
           My Orders
         </button>
         <button 
           className={`pb-3 text-sm font-semibold transition ${activeTab === 'files' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
           onClick={() => setActiveTab('files')}
         >
           Your Files
         </button>
      </div>

      {activeTab === 'orders' && (
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Print Orders</h2>
            <p className="text-xs text-slate-500">Track and manage your document prints</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['All', 'Active', 'Completed'].map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                  statusFilter === filter
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by file, shop name or pickup token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Uploaded">Uploaded</option>
              <option value="Payment Complete">Payment Completed</option>
              <option value="Waiting">Waiting</option>
              <option value="Printing Started">Printing Started</option>
              <option value="Ready for Pickup">Ready for Pickup</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Loader or Order List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-150 shadow-sm">
            <Printer className="animate-bounce text-indigo-500 w-10 h-10 mb-3" />
            <p className="text-sm text-slate-500">Fetching order history...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
            <FileText className="mx-auto text-slate-300 w-12 h-12 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No print orders found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {orders.length === 0 
                ? "You haven't uploaded any documents or placed any orders yet." 
                : "Try adjusting your search query or status filter to find your order."}
            </p>
            {orders.length === 0 && (
              <Link 
                to="/" 
                className="mt-4 inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition"
              >
                Find a Print Shop <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const shop = shops[order.shopId];
              const shopName = shop?.name || 'Local Print Shop';
              const shopAddress = shop?.address || 'Unknown Address';
              const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });
              const orderTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
              });
              
              const canCancel = order.status === 'Payment Complete' || order.status === 'Waiting';

              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  {/* Top Bar with Shop Name and Status */}
                  <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span className="notranslate" translate="no">{shopName}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 ml-5 notranslate" translate="no">{shopAddress}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canCancel && (
                        <button 
                          onClick={() => handleCancelOrder(order)}
                          disabled={cancellingId === order.id}
                          className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-full transition mr-2"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel & Refund
                        </button>
                      )}
                      <span className={`inline-flex items-center border text-[11px] px-2.5 py-0.5 rounded-full font-medium ${getStatusBadgeStyles(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* File Details */}
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 truncate">
                            {order.files ? (
                               order.files.length === 1 
                                 ? order.files[0].fileName 
                                 : `${order.files.length} Files`
                            ) : (order as any).fileName}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            {order.files && order.files.length > 0 && order.files.length === 1 && (
                              <>
                                <span>{formatFileSize(order.files[0].fileSize)}</span>
                                <span>•</span>
                              </>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {orderDate}, {orderTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        {order.status === 'Completed' || order.status === 'Cancelled' ? (
                          <button onClick={() => toast.success('Files added to reorder queue!')} className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition">
                            <Printer className="w-3.5 h-3.5" /> Reprint
                          </button>
                        ) : null}
                        <Link 
                          to={`/order/${order.id}/cover`} 
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition"
                        >
                          View Cover Slip
                        </Link>
                        <Link 
                          to={`/track/${order.id}`} 
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 px-3.5 py-2 rounded-xl transition"
                        >
                          Track Status <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Print Specifications Summary */}
                    <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4 text-slate-600">
                        <div>
                          <span className="text-slate-400">Color Mode:</span>{' '}
                          <span className="font-semibold text-slate-700">{order.settings.color}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Copies:</span>{' '}
                          <span className="font-semibold text-slate-700">{order.settings.copies}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Sides:</span>{' '}
                          <span className="font-semibold text-slate-700">{order.settings.sides}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Paper:</span>{' '}
                          <span className="font-semibold text-slate-700">{order.settings.paperSize} ({order.settings.paperType})</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata Bar */}
                    <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3.5 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" /> Pickup Token:
                        </span>
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800 tracking-wider">
                          {order.token}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Total Price:</span>{' '}
                        <span className="text-sm font-black text-slate-900">
                          ₹{order.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
      
      {activeTab === 'files' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
             <Folder className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
             <div className="text-sm text-slate-700">
               <strong>File Storage Policy:</strong> You can keep below 3MB files here forever. Files above 3MB automatically delete after 24 hours. Small size files are kept indefinitely. You have the option to delete them from everywhere.
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.flatMap(o => o.files?.map((f, i) => ({ ...f, orderId: o.id!, fileIdx: i, createdAt: o.createdAt }))).filter(f => f && f.fileName && f.filePath).length === 0 ? (
               <div className="col-span-full p-8 text-center bg-white border border-dashed border-slate-300 rounded-2xl text-slate-500">
                 No uploaded files found.
               </div>
            ) : (
              orders.flatMap(o => o.files?.map((f, i) => ({ ...f, orderId: o.id!, fileIdx: i, createdAt: o.createdAt }))).filter(f => f && f.fileName && f.filePath).map((f: any, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                   <div className="flex items-start gap-3 mb-3">
                     <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 shrink-0">
                       <FileText className="w-5 h-5" />
                     </div>
                     <div className="overflow-hidden">
                       <h4 className="font-semibold text-sm text-slate-900 truncate" title={f.fileName}>{f.fileName}</h4>
                       <p className="text-xs text-slate-500">{(f.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                       <p className="text-[10px] text-slate-400 mt-1">{new Date(f.createdAt).toLocaleDateString('en-IN')}</p>
                     </div>
                   </div>
                   {f.fileUrl && f.filePath && f.filePath.startsWith('drive:') && (
                     <div className="mt-1 mb-2">
                       <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                         View in Google Drive
                       </a>
                     </div>
                   )}
                   <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-100">
                     {f.fileUrl && (
                       <a href={f.fileUrl} target="_blank" rel="noreferrer" className="flex-1 text-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-xs py-1.5 rounded-lg transition">
                         View
                       </a>
                     )}
                     <button onClick={() => handleDeleteFile(f.filePath, f.orderId, f.fileIdx)} className="flex-1 text-center bg-red-50 text-red-600 hover:bg-red-100 font-medium text-xs py-1.5 rounded-lg transition">
                       Delete
                     </button>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}

