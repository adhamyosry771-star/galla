import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { 
  collection, addDoc, serverTimestamp, onSnapshot, 
  query, orderBy, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

interface GMPageProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBanSystem: () => void;
  onOpenBanLogs: () => void;
  onOpenGiveItems: () => void;
  onOpenRoomsManagement: () => void;
  onOpenRoomReports: () => void;
}

export const GMPage: React.FC<GMPageProps> = ({ 
  isOpen, onClose, onOpenBanSystem, onOpenBanLogs, 
  onOpenGiveItems, onOpenRoomsManagement, onOpenRoomReports 
}) => {
  const [view, setView] = useState<'menu' | 'banners'>('menu');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || view !== 'banners') return;

    const q = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [isOpen, view]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBannerImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePublishBanner = async () => {
    if (!bannerImage) return alert("يرجى اختيار صورة للبنر");
    setIsPublishing(true);
    try {
      await addDoc(collection(db, "banners"), {
        title: bannerTitle,
        imageUrl: bannerImage,
        createdAt: serverTimestamp()
      });
      setBannerTitle('');
      setBannerImage(null);
      alert("تم نشر البنر بنجاح");
    } catch (e) {
      console.error(e);
      alert("خطأ في النشر");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm("هل تريد حذف هذا البنر؟")) {
      try {
        await deleteDoc(doc(db, "banners", id));
      } catch (e) {
        alert("خطأ في الحذف");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[550] bg-[#0d051a] flex flex-col"
      dir="rtl"
    >
      {/* Header */}
      <header className="p-6 border-b border-white/5 flex items-center gap-4 bg-blue-600/5">
        <button 
          onClick={view === 'banners' ? () => setView('menu') : onClose} 
          className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all"
        >
          <i className={`fas ${view === 'banners' ? 'fa-arrow-right' : 'fa-chevron-right'}`}></i>
        </button>
        <div>
          <h2 className="text-lg font-black text-white">
            {view === 'banners' ? 'إدارة البنارات' : 'نظام المدير العام'}
          </h2>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
            {view === 'banners' ? 'Banner Management' : 'General Manager Panel'}
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          {view === 'menu' ? (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl mb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 text-xl">
                    <i className="fas fa-shield-halved"></i>
                  </div>
                  <div>
                    <h3 className="text-white font-black text-sm">مرحباً بالسيد المدير</h3>
                    <p className="text-white/40 text-[10px] font-bold">لديك كامل الصلاحيات لإدارة المحتوى والمستخدمين.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => setView('banners')}
                  className="w-full flex items-center gap-4 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-emerald-500/20 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg group-hover:scale-110 transition-transform">
                    <i className="fas fa-images text-xl"></i>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-black text-sm text-emerald-100 tracking-wide">إدارة البنارات المتحركة</span>
                    <span className="text-[10px] text-emerald-500/60 font-bold">رفع صور بنارات جديدة لواجهة التطبيق</span>
                  </div>
                </button>

                <button 
                  onClick={onOpenBanSystem}
                  className="w-full flex items-center gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-red-500/20 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 shadow-lg group-hover:scale-110 transition-transform">
                    <i className="fas fa-user-slash text-xl"></i>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-black text-sm text-red-100 tracking-wide">نظام حظر المستخدمين</span>
                    <span className="text-[10px] text-red-500/60 font-bold">إدارة عمليات الحظر وفك الحظر</span>
                  </div>
                </button>

                <button 
                  onClick={onOpenBanLogs}
                  className="w-full flex items-center gap-4 p-5 bg-orange-500/10 border border-orange-500/20 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-orange-500/20 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 shadow-lg group-hover:scale-110 transition-transform">
                    <i className="fas fa-history text-xl"></i>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-black text-sm text-orange-100 tracking-wide">سجلات الحظر</span>
                    <span className="text-[10px] text-orange-500/60 font-bold">عرض تاريخ جميع عمليات الحظر</span>
                  </div>
                </button>

                <button 
                  onClick={onOpenGiveItems}
                  className="w-full flex items-center gap-4 p-5 bg-purple-500/10 border border-purple-500/20 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-purple-500/20 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-500 shadow-lg group-hover:scale-110 transition-transform">
                    <i className="fas fa-gift text-xl"></i>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-black text-sm text-purple-100 tracking-wide">إعطاء عناصر المتجر</span>
                    <span className="text-[10px] text-purple-500/60 font-bold">منح إطارات أو دخوليات أو خلفيات للمستخدمين</span>
                  </div>
                </button>

                <button 
                  onClick={onOpenRoomsManagement}
                  className="w-full flex items-center gap-4 p-5 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-blue-500/20 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 shadow-lg group-hover:scale-110 transition-transform">
                    <i className="fas fa-door-open text-xl"></i>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-black text-sm text-blue-100 tracking-wide">إدارة وحذف الغرف</span>
                    <span className="text-[10px] text-blue-500/60 font-bold">تحذير أصحاب الغرف أو حذفها نهائياً</span>
                  </div>
                </button>

                <button 
                  onClick={onOpenRoomReports}
                  className="w-full flex items-center gap-4 p-5 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-amber-500/20 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg group-hover:scale-110 transition-transform">
                    <i className="fas fa-file-invoice text-xl"></i>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-black text-sm text-amber-100 tracking-wide">استلام بلاغات الغرف</span>
                    <span className="text-[10px] text-amber-500/60 font-bold">مراجعة البلاغات المقدمة ضد الغرف</span>
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="banners"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[100px] -mr-16 -mt-16"></div>
                
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <i className="fas fa-cloud-upload-alt text-emerald-400"></i>
                  رفع بنر جديد
                </h3>

                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={bannerTitle} 
                    onChange={e => setBannerTitle(e.target.value)} 
                    placeholder="عنوان البنر (اختياري)..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-emerald-500/30 font-bold"
                  />
                  
                  <input 
                    type="file" 
                    ref={bannerInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageSelect} 
                  />
                  
                  <button 
                    onClick={() => bannerInputRef.current?.click()} 
                    className="w-full aspect-[21/9] bg-white/5 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-white/10 overflow-hidden group hover:border-emerald-500/30 transition-all relative"
                  >
                    {bannerImage ? (
                      <img src={bannerImage} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all mb-2">
                          <i className="fas fa-plus text-xl"></i>
                        </div>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest group-hover:text-emerald-400">اختر صورة البنر</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handlePublishBanner}
                    disabled={isPublishing || !bannerImage}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black text-xs text-white shadow-xl active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPublishing ? (
                      <i className="fas fa-spinner animate-spin"></i>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i>
                        <span>نشر البنر</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest">البنارات النشطة حالياً</h4>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {banners.map(banner => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={banner.id}
                      className="group relative aspect-[21/9] rounded-3xl overflow-hidden border border-white/5 shadow-xl"
                    >
                      <img src={banner.imageUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-5 flex flex-col justify-end">
                        <p className="text-xs font-black text-white tracking-wide">{banner.title || 'بدون عنوان'}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-red-600/90 text-white flex items-center justify-center shadow-lg active:scale-90 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </motion.div>
                  ))}
                  {banners.length === 0 && (
                    <div className="py-20 text-center opacity-20 flex flex-col items-center">
                      <i className="fas fa-images text-4xl mb-2"></i>
                      <p className="text-[10px] font-black uppercase tracking-widest">لا توجد بنارات حالياً</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <footer className="p-8 text-center bg-gradient-to-t from-blue-600/5 to-transparent">
      </footer>
    </motion.div>
  );
};

