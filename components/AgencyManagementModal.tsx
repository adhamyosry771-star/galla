
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, serverTimestamp, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

interface AgencyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AgencyRowProps {
  agency: any;
  onToggle: (uid: string, status: boolean) => void;
  onRecharge: (uid: string, name: string, amount: string) => Promise<void>;
  onWithdraw: (uid: string, name: string, amount: string) => Promise<void>;
  isProcessing: boolean;
  confirmToggle: any;
  setConfirmToggle: (val: any) => void;
}

const AgencyRow: React.FC<AgencyRowProps> = ({ agency, onToggle, onRecharge, onWithdraw, isProcessing, confirmToggle, setConfirmToggle }) => {
  const [localAmount, setLocalAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'charge' | 'withdraw' | null>(null);

  const handleAction = async (type: 'charge' | 'withdraw') => {
    if (!localAmount) return;
    setLoading(true);
    setActionType(type);
    try {
      if (type === 'charge') {
        await onRecharge(agency.uid, agency.displayName, localAmount);
      } else {
        await onWithdraw(agency.uid, agency.displayName, localAmount);
      }
      setLocalAmount('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={agency.photoURL || "https://picsum.photos/100"} className="w-9 h-9 rounded-lg object-cover" alt="" />
          <div>
            <h4 className="text-white font-black text-[11px]">{agency.displayName}</h4>
            <span className="text-[9px] text-white/30 font-bold">رصيد الوكالة: {(agency.agencyBalance || 0).toLocaleString()} <i className="fas fa-coins text-[8px] text-yellow-500"></i></span>
          </div>
        </div>
        {confirmToggle?.uid === agency.uid ? (
          <div className="flex gap-2">
            <button onClick={() => onToggle(agency.uid, true)} className="text-[9px] bg-red-500 text-white px-3 py-1 rounded-lg font-black">نعم، سحب</button>
            <button onClick={() => setConfirmToggle(null)} className="text-[9px] bg-white/10 text-white px-3 py-1 rounded-lg font-black">تراجع</button>
          </div>
        ) : (
          <button 
            onClick={() => setConfirmToggle({ uid: agency.uid, status: true })} 
            disabled={isProcessing}
            className="text-[9px] text-red-400/50 hover:text-red-500 font-black px-2 py-1 disabled:opacity-30"
          >
            سحب الوكالة
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          value={localAmount}
          placeholder="المبلغ..." 
          className="flex-1 bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-[10px] text-white outline-none focus:border-indigo-500/30 font-bold"
          onChange={(e) => setLocalAmount(e.target.value)}
        />
        <div className="flex gap-1">
          <button 
            onClick={() => handleAction('charge')}
            disabled={isProcessing || (loading && actionType === 'withdraw') || !localAmount}
            className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 rounded-lg text-[9px] font-black active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1 h-8"
          >
            {loading && actionType === 'charge' ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-plus"></i>}
            شحن
          </button>
          <button 
            onClick={() => handleAction('withdraw')}
            disabled={isProcessing || (loading && actionType === 'charge') || !localAmount}
            className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 rounded-lg text-[9px] font-black active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1 h-8"
          >
            {loading && actionType === 'withdraw' ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-minus"></i>}
            سحب رصيد
          </button>
        </div>
      </div>
    </div>
  );
};

export const AgencyManagementModal: React.FC<AgencyManagementModalProps> = ({ isOpen, onClose }) => {
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<{uid: string, status: boolean} | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, "users"), where("isAgency", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setAgencies(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setSearching(true);
    setFoundUser(null);
    try {
      const q = query(collection(db, "users"), where("customId", "==", searchId.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert("لم يتم العثور على مستخدم بهذا الـ ID");
      } else {
        setFoundUser({ uid: snap.docs[0].id, ...snap.docs[0].data() });
      }
    } catch (e) {
      alert("خطأ في البحث");
    } finally {
      setSearching(false);
    }
  };

  const toggleAgency = async (uid: string, currentStatus: any) => {
    const isCurrentlyAgency = !!currentStatus;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        isAgency: !isCurrentlyAgency,
        agencyBalance: !isCurrentlyAgency ? 250000000 : increment(0)
      });
      
      if (!isCurrentlyAgency) {
        await addDoc(collection(db, "users", uid, "systemNotifications"), {
          title: "وكالة الشحن",
          desc: "تهانينا حصلت على نظام شحن للمستخدمين اصبحت الان وكيل شحن معتمد لدينا وحصلت على رصيد ترحيبي 250,000,000 ذهب",
          icon: 'fa-building-shield',
          type: 'agency_onboarding',
          createdAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "users", uid, "systemNotifications"), {
          title: "سحب الوكالة",
          desc: "نأسف لإبلاغك بأنه تم سحب صلاحيات وكالة الشحن من حسابك الرسمي",
          icon: 'fa-user-slash',
          type: 'agency_revoked',
          createdAt: serverTimestamp()
        });
      }

      if (foundUser && foundUser.uid === uid) {
        setFoundUser({ ...foundUser, isAgency: !isCurrentlyAgency });
      }
      setConfirmToggle(null);
    } catch (e: any) {
      console.error("Toggle Agency Error:", e);
      // Fallback to basic alert if something goes wrong, but we should ideally have a toast system
      alert(`فشلت العملية: ${e.message || "خطأ غير معروف"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const addBalance = async (uid: string, name: string, inputAmount: string) => {
    const val = parseInt(inputAmount);
    if (isNaN(val) || val <= 0) {
      alert("ادخل مبلغ صحيح");
      throw new Error("Invalid amount");
    }
    
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        agencyBalance: increment(val)
      });
      
      // Log transaction
      await addDoc(collection(db, "agencyTransactions"), {
        type: 'admin_to_agency',
        adminEmail: 'admin@yalla.com',
        targetUid: uid,
        targetName: name,
        amount: val,
        createdAt: serverTimestamp()
      });

      // Add notification for the agent
      await addDoc(collection(db, "users", uid, "systemNotifications"), {
        title: "شحن محفظة الوكالة",
        desc: `تم إضافة ${val.toLocaleString()} رصيد في محفظة الوكالة الخاصة بك من قبل الإدارة`,
        icon: 'fa-vault',
        type: 'agency_recharge',
        createdAt: serverTimestamp()
      });

      // No alert here, success is visible by the updated balance in the list (onSnapshot)
    } catch (e: any) {
      alert(`فشل شحن الرصيد: ${e.message}`);
      throw e;
    } finally {
      setIsProcessing(false);
    }
  };

  const withdrawBalance = async (uid: string, name: string, inputAmount: string) => {
    const val = parseInt(inputAmount);
    if (isNaN(val) || val <= 0) {
      alert("ادخل مبلغ صحيح");
      throw new Error("Invalid amount");
    }
    
    setIsProcessing(true);
    try {
      const agencyRef = doc(db, "users", uid);
      const snap = await getDoc(agencyRef);
      const currentBalance = snap.data()?.agencyBalance || 0;
      
      if (currentBalance < val) {
        alert("رصيد الوكيل غير كافٍ للسحب");
        throw new Error("Insufficient balance");
      }

      await updateDoc(agencyRef, {
        agencyBalance: increment(-val)
      });
      
      // Log transaction
      await addDoc(collection(db, "agencyTransactions"), {
        type: 'admin_withdraw_agency',
        adminEmail: 'admin@yalla.com',
        targetUid: uid,
        targetName: name,
        amount: val,
        createdAt: serverTimestamp()
      });

      // Add notification for the agent
      await addDoc(collection(db, "users", uid, "systemNotifications"), {
        title: "سحب من محفظة الوكالة",
        desc: `تم سحب ${val.toLocaleString()} رصيد من محفظة الوكالة الخاصة بك من قبل الإدارة`,
        icon: 'fa-money-bill-transfer',
        type: 'agency_withdrawal',
        createdAt: serverTimestamp()
      });

    } catch (e: any) {
      if (e.message !== "Insufficient balance") {
        alert(`فشل سحب الرصيد: ${e.message}`);
      }
      throw e;
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[#1a0b2e] w-full max-w-2xl h-[80vh] rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <i className="fas fa-building-shield text-base"></i>
            </div>
            <h3 className="text-base font-black text-white">إدارة الوكالات</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-transform">
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          
          {/* Search Section */}
          <div className="space-y-3">
            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mr-2">إضافة وكيل جديد</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={searchId} 
                onChange={e => {
                  setSearchId(e.target.value);
                  if (!e.target.value.trim()) setFoundUser(null);
                }} 
                placeholder="ادخل ID المستخدم..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all font-bold"
              />
              <button 
                onClick={handleSearch} 
                disabled={searching}
                className="bg-indigo-600 px-6 rounded-xl text-white font-black text-xs active:scale-95 transition-all disabled:opacity-50"
              >
                {searching ? <i className="fas fa-spinner animate-spin"></i> : 'بحث'}
              </button>
            </div>

            {foundUser && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3">
                  <img src={foundUser.photoURL || "https://picsum.photos/100"} className="w-11 h-11 rounded-lg object-cover border border-white/10" alt="" />
                  <div>
                    <h4 className="text-white font-black text-xs">{foundUser.displayName}</h4>
                    <p className="text-[9px] text-white/40 font-bold">ID: {foundUser.customId}</p>
                  </div>
                </div>
                {confirmToggle?.uid === foundUser.uid ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleAgency(foundUser.uid, foundUser.isAgency)}
                      disabled={isProcessing}
                      className="bg-green-500 text-white px-4 py-2 rounded-xl text-[10px] font-black"
                    >
                      {isProcessing ? <i className="fas fa-spinner animate-spin"></i> : 'تأكيد'}
                    </button>
                    <button 
                      onClick={() => setConfirmToggle(null)}
                      className="bg-white/10 text-white px-4 py-2 rounded-xl text-[10px] font-black"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmToggle({ uid: foundUser.uid, status: foundUser.isAgency })}
                    disabled={isProcessing}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all ${isProcessing ? 'opacity-50 grayscale' : ''} ${foundUser.isAgency ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500 text-white'}`}
                  >
                    {foundUser.isAgency ? 'سحب الوكالة' : 'تعيين كوكيل'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Agencies List */}
          <div className="space-y-4">
            <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mr-2">الوكلاء الحاليين ({agencies.length})</h4>
            <div className="grid gap-2">
              {agencies.length === 0 ? (
                <div className="text-center py-10 text-white/20 text-xs font-bold bg-white/5 rounded-2xl border border-white/5 border-dashed">
                  لا يوجد وكلاء حاليين
                </div>
              ) : agencies.map((agency) => (
                <AgencyRow 
                  key={agency.uid}
                  agency={agency}
                  onToggle={toggleAgency}
                  onRecharge={addBalance}
                  onWithdraw={withdrawBalance}
                  isProcessing={isProcessing}
                  confirmToggle={confirmToggle}
                  setConfirmToggle={setConfirmToggle}
                />
              ))}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};
