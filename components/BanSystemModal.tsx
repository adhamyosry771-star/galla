
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, getDocs, updateDoc, doc, deleteField, orderBy, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { motion, AnimatePresence } from 'framer-motion';

interface BanSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BanSystemModal: React.FC<BanSystemModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showAdminBanError, setShowAdminBanError] = useState(false);
  const [protectionMessage, setProtectionMessage] = useState('');

  const adminUser = users.find(u => u.id === auth.currentUser?.uid);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("displayName", "asc"));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (uid: string, days: number | 'permanent') => {
    const userToBan = users.find(u => u.id === uid);
    
    if (uid === auth.currentUser?.uid) {
      setProtectionMessage("عذراً لا يمكنك حظر نفسك");
      setShowAdminBanError(true);
      return;
    }

    if (userToBan?.email === 'admin@yalla.com') {
      setProtectionMessage("عذراً لا يمكنك حظر هذا الحساب فهو حساب المدير الرسمي.");
      setShowAdminBanError(true);
      return;
    }

    let banUntil: string;
    if (days === 'permanent') {
      banUntil = '2099-01-01T00:00:00Z';
    } else {
      const date = new Date();
      date.setDate(date.getDate() + days);
      banUntil = date.toISOString();
    }

    try {
      await updateDoc(doc(db, "users", uid), { banUntil });
      
      // Log the action
      await addDoc(collection(db, "banLogs"), {
        action: 'ban',
        adminId: auth.currentUser?.uid,
        adminName: adminUser?.displayName || 'مسؤول',
        adminPhoto: adminUser?.photoURL || adminUser?.animatedAvatar || null,
        targetId: uid,
        targetName: userToBan?.displayName || 'مستخدم',
        targetPhoto: userToBan?.photoURL || userToBan?.animatedAvatar || null,
        duration: days,
        banUntil: banUntil,
        timestamp: serverTimestamp()
      });

      alert("تم الحظر بنجاح");
      fetchUsers();
      setSelectedUserId(null);
    } catch (e) {
      alert("حدث خطأ");
    }
  };

  const handleUnban = async (uid: string) => {
    const userToUnban = users.find(u => u.id === uid);
    try {
      await updateDoc(doc(db, "users", uid), { banUntil: deleteField() });
      
      // Log the action
      await addDoc(collection(db, "banLogs"), {
        action: 'unban',
        adminId: auth.currentUser?.uid,
        adminName: adminUser?.displayName || 'مسؤول',
        adminPhoto: adminUser?.photoURL || adminUser?.animatedAvatar || null,
        targetId: uid,
        targetName: userToUnban?.displayName || 'مستخدم',
        targetPhoto: userToUnban?.photoURL || userToUnban?.animatedAvatar || null,
        timestamp: serverTimestamp()
      });

      alert("تم فك الحظر");
      fetchUsers();
      setSelectedUserId(null);
    } catch (e) {
      alert("حدث خطأ");
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    u.customId?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" dir="rtl">
      <div className="bg-[#1a0b2e] w-full max-w-[360px] h-[80vh] rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl animate-in zoom-in">
        <header className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-white font-black text-sm">نظام حظر المستخدمين</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center border border-white/10"><i className="fas fa-times"></i></button>
        </header>

        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs"></i>
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="ابحث عن الاسم أو الـ ID..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-11 pl-4 text-xs text-white outline-none focus:border-purple-500/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-20"><i className="fas fa-spinner animate-spin text-purple-500"></i></div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-white/20 text-xs">لا يوجد مستخدمين</div>
          ) : filteredUsers.map(u => (
            <div key={u.id} className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={u.photoURL || "https://picsum.photos/50"} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                <div>
                  <p className="text-[11px] font-black text-white">{u.displayName}</p>
                  <p className={`text-[9px] font-bold ${u.banUntil ? 'text-red-400' : 'text-purple-400'}`}>ID: {u.customId}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (u.id === auth.currentUser?.uid) {
                    setProtectionMessage("عذراً لا يمكنك حظر نفسك");
                    setShowAdminBanError(true);
                    return;
                  }
                  if (u.email === 'admin@yalla.com') {
                    setProtectionMessage("عذراً لا يمكنك حظر هذا الحساب فهو حساب المدير الرسمي.");
                    setShowAdminBanError(true);
                    return;
                  }
                  setSelectedUserId(selectedUserId === u.id ? null : u.id);
                }} 
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${u.banUntil ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}
              >
                <i className={`fas ${u.banUntil ? 'fa-user-slash' : 'fa-ban'}`}></i>
              </button>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {showAdminBanError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[700] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowAdminBanError(false)}
            >
              <motion.div 
                className="bg-[#1a0b2e]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 w-full max-w-[300px] text-center shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-4">
                  <i className="fas fa-shield-halved text-2xl"></i>
                </div>
                <h4 className="text-white font-black text-sm mb-2">تنبيه حماية</h4>
                <p className="text-white/60 text-[11px] leading-relaxed mb-6 font-bold">{protectionMessage}</p>
                <button 
                  onClick={() => setShowAdminBanError(false)}
                  className="w-full py-3 bg-purple-600 text-white text-xs font-black rounded-xl active:scale-95 transition-transform"
                >
                  فهمت ذلك
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedUserId && (
            <motion.div 
              initial={{ y: 100 }} 
              animate={{ y: 0 }} 
              exit={{ y: 100 }}
              className="bg-[#0d051a] border-t border-white/10 p-6 space-y-4 shadow-2xl rounded-t-[2rem]"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-black text-white">خيارات الحظر</span>
                <button onClick={() => setSelectedUserId(null)} className="text-white/40 text-[10px]">إلغاء</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleBan(selectedUserId, 1)} className="py-3 bg-white/5 text-white text-[10px] font-black rounded-xl border border-white/10 active:scale-95">يوم واحد</button>
                <button onClick={() => handleBan(selectedUserId, 7)} className="py-3 bg-white/5 text-white text-[10px] font-black rounded-xl border border-white/10 active:scale-95">أسبوع واحد</button>
                <button onClick={() => handleBan(selectedUserId, 30)} className="py-3 bg-white/5 text-white text-[10px] font-black rounded-xl border border-white/10 active:scale-95">شهر واحد</button>
                <button onClick={() => handleBan(selectedUserId, 365)} className="py-3 bg-white/5 text-white text-[10px] font-black rounded-xl border border-white/10 active:scale-95">سنة كاملة</button>
                <button onClick={() => handleBan(selectedUserId, 'permanent')} className="py-3 bg-red-600/20 text-red-500 text-[10px] font-black rounded-xl border border-red-600/30 active:scale-95 col-span-2">حظر نهائي</button>
                <button onClick={() => handleUnban(selectedUserId)} className="py-3 bg-green-600/20 text-green-400 text-[10px] font-black rounded-xl border border-green-600/30 active:scale-95 col-span-2">فك الحظر</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
