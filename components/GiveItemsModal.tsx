
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, getDocs, updateDoc, doc, addDoc, serverTimestamp, Timestamp, orderBy, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { motion, AnimatePresence } from 'framer-motion';

interface GiveItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GiveItemsModal: React.FC<GiveItemsModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [storeItems, setStoreItems] = useState<{frames: any[], entries: any[], backgrounds: any[]}>({ frames: [], entries: [], backgrounds: [] });
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [duration, setDuration] = useState(15);
  const [category, setCategory] = useState<'frames' | 'entries' | 'backgrounds'>('frames');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch some users (limited for performance, search will filter client-side for now or we can implement real search)
      const userSnap = await getDocs(query(collection(db, "users"), orderBy("displayName", "asc")));
      setUsers(userSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch all store items
      const framesSnap = await getDocs(query(collection(db, "storeFrames"), orderBy("createdAt", "desc")));
      const entriesSnap = await getDocs(query(collection(db, "storeEntries"), orderBy("createdAt", "desc")));
      const bgsSnap = await getDocs(query(collection(db, "storeBackgrounds"), orderBy("createdAt", "desc")));

      setStoreItems({
        frames: framesSnap.docs.map(d => ({ id: d.id, type: 'frame', ...d.data() })),
        entries: entriesSnap.docs.map(d => ({ id: d.id, type: 'entry', ...d.data() })),
        backgrounds: bgsSnap.docs.map(d => ({ id: d.id, type: 'background', ...d.data() }))
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.customId?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleGiveItem = async () => {
    if (!selectedUser || !selectedItem || isProcessing) return;
    setIsProcessing(true);
    try {
      const now = new Date();
      const itemTypeAr = selectedItem.type === 'frame' ? 'إطار' : selectedItem.type === 'entry' ? 'دخولية' : 'خلفية';
      
      // Check if user already owns this item
      const inventoryRef = collection(db, "users", selectedUser.id, "inventory");
      const q = query(inventoryRef, where("itemId", "==", selectedItem.id));
      const querySnap = await getDocs(q);
      
      let existingItemDoc: any = null;
      querySnap.forEach(snap => {
        const data = snap.data();
        // Even if expired, we can extend from current time or from old expiry if still valid
        if (!existingItemDoc) existingItemDoc = { id: snap.id, ...data };
      });

      if (existingItemDoc) {
        // Aggregate duration
        const baseDate = (existingItemDoc.expiresAt && existingItemDoc.expiresAt.toDate() > now) 
          ? existingItemDoc.expiresAt.toDate() 
          : now;
        
        const newExpiresAt = new Date(baseDate.getTime() + duration * 24 * 60 * 60 * 1000);
        
        await updateDoc(doc(db, "users", selectedUser.id, "inventory", existingItemDoc.id), {
          expiresAt: Timestamp.fromDate(newExpiresAt),
          purchasedAt: serverTimestamp(),
          giftedBy: auth.currentUser?.displayName || 'الإدارة',
          isGift: true
        });
      } else {
        // Fresh gift
        const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
        await addDoc(collection(db, "users", selectedUser.id, "inventory"), {
          itemId: selectedItem.id,
          name: selectedItem.name || 'عنصر',
          imageUrl: selectedItem.imageUrl || null,
          videoUrl: selectedItem.videoUrl || null,
          previewImage: selectedItem.previewImage || null,
          type: selectedItem.type,
          price: 0,
          isGift: true,
          giftedBy: auth.currentUser?.displayName || 'الإدارة',
          purchasedAt: serverTimestamp(),
          expiresAt: Timestamp.fromDate(expiresAt),
          isEquipped: false 
        });
      }

      // 2. Send System Notification with custom format
      await addDoc(collection(db, "users", selectedUser.id, "systemNotifications"), {
        title: "هدية من الإدارة! 🎁",
        desc: `مبروك! لقد حصلت على ${itemTypeAr} (${selectedItem.name}) لمدة ${duration} أيام. تفقدها الآن في حقيبتك في المتجر.`,
        icon: "fas fa-gift",
        type: "gift",
        createdAt: serverTimestamp()
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedItem(null);
        setSelectedUser(null);
      }, 3000);

    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء منح العنصر");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a0b2e] w-full max-w-[450px] h-[85vh] rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl"
      >
        <header className="p-6 border-b border-white/5 flex justify-between items-center bg-purple-600/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <i className="fas fa-gift"></i>
            </div>
            <div>
              <h3 className="text-white font-black text-sm">إعطاء عناصر المتجر</h3>
              <p className="text-[9px] text-purple-300/50 font-bold uppercase tracking-wider">Gift Management</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 text-white/40 flex items-center justify-center border border-white/10 active:scale-95">
            <i className="fas fa-times text-xs"></i>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Step 1: Select User */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-white/40 font-black">1</span>
              <h4 className="text-white font-black text-xs">اختر المستخدم</h4>
            </div>
            
            {!selectedUser ? (
              <div className="space-y-3">
                <div className="relative">
                  <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs"></i>
                  <input 
                    type="text" 
                    value={userSearch} 
                    onChange={e => setUserSearch(e.target.value)} 
                    placeholder="ابحث بالاسم أو ID..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-11 pl-4 text-xs text-white outline-none focus:border-purple-500/40"
                  />
                </div>
                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1">
                  {filteredUsers.slice(0, 10).map(u => (
                    <button 
                      key={u.id} 
                      onClick={() => setSelectedUser(u)}
                      className="w-full bg-white/5 p-3 rounded-2xl flex items-center gap-3 border border-white/5 hover:border-purple-500/30 transition-all"
                    >
                      <img src={u.photoURL || "https://picsum.photos/50"} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                      <div className="text-right">
                        <p className="text-[10px] font-black text-white">{u.displayName}</p>
                        <p className="text-[8px] font-bold text-white/40">ID: {u.customId}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={selectedUser.photoURL || "https://picsum.photos/50"} className="w-10 h-10 rounded-full border border-purple-500/30" />
                  <div>
                    <p className="text-xs font-black text-white">{selectedUser.displayName}</p>
                    <p className="text-[9px] font-bold text-purple-300/40">ID: {selectedUser.customId}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-[10px] font-black text-purple-400 uppercase">تغيير</button>
              </div>
            )}
          </section>

          {/* Step 2: Select Category & Item */}
          <section className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-white/40 font-black">2</span>
              <h4 className="text-white font-black text-xs">اختر العنصر</h4>
            </div>

            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
              {(['frames', 'entries', 'backgrounds'] as const).map(cat => (
                <button 
                  key={cat}
                  onClick={() => { setCategory(cat); setSelectedItem(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${category === cat ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                >
                  {cat === 'frames' ? 'إطارات' : cat === 'entries' ? 'دخوليات' : 'خلفيات'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {storeItems[category].map(item => (
                <button 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  className={`aspect-square rounded-2xl border transition-all flex flex-col items-center justify-center p-2 gap-2 ${selectedItem?.id === item.id ? 'bg-purple-600/20 border-purple-500 shadow-lg' : 'bg-white/5 border-white/5'}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center overflow-hidden">
                    {item.imageUrl || item.previewImage ? (
                      <img src={item.imageUrl || item.previewImage} className="w-full h-full object-cover" />
                    ) : (
                      <i className={`fas ${category === 'frames' ? 'fa-border-none' : category === 'entries' ? 'fa-door-open' : 'fa-image'} text-white/20`}></i>
                    )}
                  </div>
                  <span className="text-[8px] font-bold text-white truncate w-full text-center">{item.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Step 3: Select Duration */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-white/40 font-black">3</span>
              <h4 className="text-white font-black text-xs">المدة بالأيام</h4>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[7, 15, 30, 90].map(d => (
                <button 
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-3 rounded-2xl text-[10px] font-black transition-all ${duration === d ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/40'}`}
                >
                  {d} يوم
                </button>
              ))}
            </div>
          </section>
        </div>

        <footer className="p-6 border-t border-white/5 bg-purple-600/5">
          <button 
            disabled={!selectedUser || !selectedItem || isProcessing}
            onClick={handleGiveItem}
            className="w-full py-4 rounded-2xl bg-purple-600 text-white font-black text-xs shadow-xl active:scale-95 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3 overflow-hidden relative"
          >
            {isProcessing ? (
              <i className="fas fa-spinner animate-spin"></i>
            ) : (
              <>
                <i className="fas fa-gift"></i>
                <span>منح العنصر الآن</span>
              </>
            )}
            
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  initial={{ y: 50 }} 
                  animate={{ y: 0 }} 
                  exit={{ y: -50 }}
                  className="absolute inset-0 bg-green-500 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-check-circle"></i>
                  <span>تم المنح بنجاح!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </footer>
      </motion.div>
    </div>
  );
};
