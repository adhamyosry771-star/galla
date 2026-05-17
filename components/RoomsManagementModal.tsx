
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, deleteDoc, doc, addDoc, serverTimestamp, orderBy, where, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { motion, AnimatePresence } from 'framer-motion';

interface RoomsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OwnerName: React.FC<{ userId: string }> = ({ userId }) => {
  const [name, setName] = useState('جاري التحميل...');

  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(doc(db, "users", userId), (snap) => {
      if (snap.exists()) {
        setName(snap.data().displayName || 'بدون اسم');
      } else {
        setName('مستخدم غير معروف');
      }
    });
    return () => unsub();
  }, [userId]);

  return <span>{name}</span>;
};

export const RoomsManagementModal: React.FC<RoomsManagementModalProps> = ({ isOpen, onClose }) => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const q = query(collection(db, "rooms"));
      const unsub = onSnapshot(q, (snap) => {
        const roomsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        roomsData.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        setRooms(roomsData);
        setLoading(false);
      }, (err) => {
        console.error(err);
        setLoading(false);
      });
      return () => unsub();
    }
  }, [isOpen]);

  const handleWarnOwner = async (room: any) => {
    if (isProcessing) return;
    const ownerId = room.owner?.uid || room.ownerId; 
    if (!ownerId) {
      alert("لم يتم العثور على صاحب الغرفة");
      return;
    }
    setIsProcessing(`warn-${room.id}`);
    try {
      await addDoc(collection(db, "users", ownerId, "systemNotifications"), {
        title: "⚠️ تنبيه هام بخصوص غرفتك",
        desc: "تنبيه لقد تلقينا بلاغات عديده على غرفتك في الفتره الحاليه برجاء الالتزام بقواعد المجتمع وإلا سيتم حظر الحساب وتجميد الغرفه نتمني لكم الاستمتاع بلحظاتكم المميزه هنا",
        icon: "fas fa-exclamation-triangle",
        type: "warning",
        createdAt: serverTimestamp()
      });
      alert("تم إرسال التحذير بنجاح لصاحب الغرفة");
    } catch (e) {
      alert("حدث خطأ أثناء إرسال التحذير");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الغرفة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    if (isProcessing) return;
    setIsProcessing(`delete-${roomId}`);
    try {
      await deleteDoc(doc(db, "rooms", roomId));
      setRooms(prev => prev.filter(r => r.id !== roomId));
      alert("تم حذف الغرفة نهائياً");
    } catch (e) {
      alert("حدث خطأ أثناء حذف الغرفة");
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredRooms = rooms.filter(r => 
    r.title?.toLowerCase().includes(search.toLowerCase()) || 
    r.owner?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a0b2e] w-full max-w-[450px] h-[85vh] rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl"
      >
        <header className="p-6 border-b border-white/5 flex justify-between items-center bg-blue-600/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
              <i className="fas fa-door-open"></i>
            </div>
            <div>
              <h3 className="text-white font-black text-sm">إدارة الغرف</h3>
              <p className="text-[9px] text-blue-300/50 font-bold uppercase tracking-wider">Room Management</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 text-white/40 flex items-center justify-center border border-white/10 active:scale-95">
            <i className="fas fa-times text-xs"></i>
          </button>
        </header>

        <div className="p-4 border-b border-white/5 bg-blue-500/5">
          <div className="relative">
            <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs"></i>
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="البحث عن اسم الغرفة أو صاحبها..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-11 pl-4 text-xs text-white outline-none focus:border-blue-500/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20"><i className="fas fa-circle-notch animate-spin text-blue-500 text-2xl"></i></div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20 text-white/20 text-xs">لا يوجد غرف حالياً</div>
          ) : filteredRooms.map(room => (
            <div key={room.id} className="bg-white/5 border border-white/5 rounded-3xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-400 border border-white/5 overflow-hidden">
                  {room.coverImage ? (
                    <img src={room.coverImage} className="w-full h-full object-cover" />
                  ) : (
                    <i className="fas fa-users text-xl"></i>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{room.title}</p>
                  <p className="text-[10px] font-bold text-white/40">بواسطة: <OwnerName userId={room.owner?.uid || room.ownerId} /></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleWarnOwner(room)}
                  disabled={isProcessing === `warn-${room.id}`}
                  className="py-3 rounded-xl bg-orange-500/10 text-orange-500 text-[10px] font-black border border-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-orange-500/20 disabled:opacity-50"
                >
                  {isProcessing === `warn-${room.id}` ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-bullhorn"></i><span>تحذير</span></>}
                </button>
                <button 
                  onClick={() => handleDeleteRoom(room.id)}
                  disabled={isProcessing === `delete-${room.id}`}
                  className="py-3 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black border border-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-red-500/20 disabled:opacity-50"
                >
                   {isProcessing === `delete-${room.id}` ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-trash-alt"></i><span>حذف نهائي</span></>}
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
