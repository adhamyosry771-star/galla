
import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, updateProfile, deleteUser, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, updateDoc, deleteDoc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, setDoc, where, getDocs, getDoc, increment, deleteField } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { AdminPanel } from './AdminPanel';
import { BanSystemModal } from './BanSystemModal';
import { BanLogsModal } from './BanLogsModal';
import { GMPage } from './GMPage';
import { GiveItemsModal } from './GiveItemsModal';
import { RoomsManagementModal } from './RoomsManagementModal';
import { RoomReportsModal } from './RoomReportsModal';
import { AgencyManagementModal } from './AgencyManagementModal';
import { AgencyWalletModal } from './AgencyWalletModal';
import { StoreModal } from './StoreModal';
import { getWealthLevelInfo, getCharismaLevelInfo } from '../utils';

interface ProfilePageProps {
  initialUserData: any;
  forceOpenWallet?: boolean;
  onWalletOpened?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ initialUserData, forceOpenWallet, onWalletOpened }) => {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isGMPageOpen, setIsGMPageOpen] = useState(false);
  const [isGiveItemsOpen, setIsGiveItemsOpen] = useState(false);
  const [isRoomsManagementOpen, setIsRoomsManagementOpen] = useState(false);
  const [isRoomReportsOpen, setIsRoomReportsOpen] = useState(false);
  const [isAgencyManagementOpen, setIsAgencyManagementOpen] = useState(false);
  const [isAgencyWalletOpen, setIsAgencyWalletOpen] = useState(false);
  const [isBanSystemOpen, setIsBanSystemOpen] = useState(false);
  const [isBanLogsOpen, setIsBanLogsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletTab, setWalletTab] = useState<'coins' | 'diamonds'>('coins');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertAmount, setConvertAmount] = useState('');
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isCPPageOpen, setIsCPPageOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'email' | 'password' | 'support'>('main');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [liveUserData, setLiveUserData] = useState<any>(initialUserData);
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);
  
  // CP Feature States
  const [partnerData, setPartnerData] = useState<any>(null);
  const [showCPRequestModal, setShowCPRequestModal] = useState(false);
  const [showCPBreakupModal, setShowCPBreakupModal] = useState(false);
  const [partnerSearchId, setPartnerSearchId] = useState('');
  const [isSearchingPartner, setIsSearchingPartner] = useState(false);
  const [showCPConfirmModal, setShowCPConfirmModal] = useState<{uid: string, name: string, photo: string} | null>(null);
  const [cpConfig, setCpConfig] = useState<{backgroundUrl?: string} | null>(null);

  const [defaultImages, setDefaultImages] = useState<any>(null);

  const [newName, setNewName] = useState(initialUserData?.displayName || '');
  const [newBio, setNewBio] = useState(initialUserData?.bio || '');
  const [tempRegion, setTempRegion] = useState<{name: string, code: string, flag: string} | null>(
    initialUserData?.region ? { name: initialUserData.region, code: initialUserData.regionCode || '', flag: initialUserData.regionFlag || '' } : null
  );
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const countries = [
    { name: 'مصر', code: 'EG', flag: '🇪🇬' },
    { name: 'السعودية', code: 'SA', flag: '🇸🇦' },
    { name: 'الإمارات', code: 'AE', flag: '🇦🇪' },
    { name: 'الكويت', code: 'KW', flag: '🇰🇼' },
    { name: 'البحرين', code: 'BH', flag: '🇧🇭' },
    { name: 'عمان', code: 'OM', flag: '🇴🇲' },
    { name: 'قطر', code: 'QA', flag: '🇶🇦' },
    { name: 'الأردن', code: 'JO', flag: '🇯🇴' },
    { name: 'لبنان', code: 'LB', flag: '🇱🇧' },
    { name: 'العراق', code: 'IQ', flag: '🇮🇶' },
    { name: 'المغرب', code: 'MA', flag: '🇲🇦' },
    { name: 'تونس', code: 'TN', flag: '🇹🇳' },
    { name: 'الجزائر', code: 'DZ', flag: '🇩🇿' },
    { name: 'ليبيا', code: 'LY', flag: '🇱🇾' },
    { name: 'السودان', code: 'SD', flag: '🇸🇩' },
    { name: 'اليمن', code: 'YE', flag: '🇾🇪' },
    { name: 'فلسطين', code: 'PS', flag: '🇵🇸' },
    { name: 'سوريا', code: 'SY', flag: '🇸🇾' },
    { name: 'موريتانيا', code: 'MR', flag: '🇲🇷' },
    { name: 'الصومال', code: 'SO', flag: '🇸🇴' },
    { name: 'جيبوتي', code: 'DJ', flag: '🇩🇯' },
    { name: 'جزر القمر', code: 'KM', flag: '🇰🇲' },
    { name: 'تركيا', code: 'TR', flag: '🇹🇷' },
    { name: 'إيران', code: 'IR', flag: '🇮🇷' },
    { name: 'الولايات المتحدة', code: 'US', flag: '🇺🇸' },
    { name: 'المملكة المتحدة', code: 'GB', flag: '🇬🇧' },
    { name: 'فرنسا', code: 'FR', flag: '🇫🇷' },
    { name: 'ألمانيا', code: 'DE', flag: '🇩🇪' },
    { name: 'إيطاليا', code: 'IT', flag: '🇮🇹' },
    { name: 'إسبانيا', code: 'ES', flag: '🇪🇸' },
    { name: 'روسيا', code: 'RU', flag: '🇷🇺' },
    { name: 'الصين', code: 'CN', flag: '🇨🇳' },
    { name: 'اليابان', code: 'JP', flag: '🇯🇵' },
    { name: 'كوريا الجنوبية', code: 'KR', flag: '🇰🇷' },
    { name: 'الهند', code: 'IN', flag: '🇮🇳' },
    { name: 'البرازيل', code: 'BR', flag: '🇧🇷' },
    { name: 'كندا', code: 'CA', flag: '🇨🇦' },
    { name: 'أستراليا', code: 'AU', flag: '🇦🇺' },
  ];

  const filteredCountries = countries.filter(c => 
    c.name.includes(countrySearch) || c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  
  // Support Chat States
  const [supportMsg, setSupportMsg] = useState('');
  const [supportChat, setSupportChat] = useState<any[]>([]);
  const supportChatEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  
  const user = auth.currentUser;
  const isOfficialAdmin = user?.email === 'admin@yalla.com' || user?.email === 'adhamyosry56@gmail.com';
  const isAdmin = isOfficialAdmin || liveUserData?.role === 'admin';

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!isImageUploading) {
          setLiveUserData(data);
          setNewName(data.displayName || '');
          setNewBio(data.bio || '');
          if (data.region) {
            setTempRegion({ name: data.region, code: data.regionCode || '', flag: data.regionFlag || '' });
          }
        }
      }
    });
    return () => unsub();
  }, [user, isImageUploading]);

  // CP Background Config Listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "cp_config"), (snap) => {
      if (snap.exists()) {
        setCpConfig(snap.data());
      }
    });
    return unsub;
  }, []);

  // Listen for partner data if partnerUid exists
  useEffect(() => {
    if (liveUserData?.partnerUid) {
      const unsubPartner = onSnapshot(doc(db, "users", liveUserData.partnerUid), (docSnap) => {
        if (docSnap.exists()) {
          setPartnerData(docSnap.data());
        } else {
          setPartnerData(null);
        }
      });
      return unsubPartner;
    } else {
      setPartnerData(null);
    }
  }, [liveUserData?.partnerUid]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "supportChats", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setHasUnreadSupport(!!docSnap.data().unreadByUser);
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (user && settingsView === 'support') {
      updateDoc(doc(db, "supportChats", user.uid), { unreadByUser: false });
      const q = query(collection(db, "supportChats", user.uid, "messages"), orderBy("createdAt", "asc"));
      const unsub = onSnapshot(q, (snap) => {
        setSupportChat(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTimeout(() => supportChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });
      return unsub;
    }
  }, [user, settingsView]);

  useEffect(() => {
    if (forceOpenWallet) {
      setIsWalletOpen(true);
      if (onWalletOpened) onWalletOpened();
    }
  }, [forceOpenWallet]);

  const compressImage = (base64Str: string, maxWidth = 400, maxHeight = 400): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const isVideoUrl = (url: string | null) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/) !== null || url.includes('video');
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
          const compressedBase64 = await compressImage(rawBase64, field === 'headerURL' ? 800 : 400, field === 'headerURL' ? 400 : 400);
          setLiveUserData((prev: any) => ({ ...prev, [field]: compressedBase64 }));
          if (user) await updateDoc(doc(db, "users", user.uid), { [field]: compressedBase64 });
          if (field === 'photoURL' && user) await updateProfile(user, { photoURL: compressedBase64 });
          setTimeout(() => setIsImageUploading(false), 1000);
          alert("تم تحديث الصورة بنجاح");
        } catch (err) {
          alert("حجم الصورة كبير جداً");
          setIsImageUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfileData = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      const updates: any = { displayName: newName, bio: newBio };
      
      // Check region update limit (3 days)
      if (tempRegion && tempRegion.name !== liveUserData?.region) {
        const lastUpdate = liveUserData?.lastRegionUpdate?.toDate?.() || 0;
        const now = new Date();
        const diffInDays = (now.getTime() - new Date(lastUpdate).getTime()) / (1000 * 3600 * 24);
        
        if (lastUpdate && diffInDays < 3) {
          const remainingDays = Math.ceil(3 - diffInDays);
          alert(`يمكنك تغيير الدولة مرة كل 3 أيام. يرجى الانتظار لمدة ${remainingDays} يوم إضافي.`);
          setIsUpdating(false);
          return;
        }
        
        updates.region = tempRegion.name;
        updates.regionCode = tempRegion.code;
        updates.regionFlag = tempRegion.flag;
        updates.lastRegionUpdate = serverTimestamp();
      }

      await updateDoc(doc(db, "users", user.uid), updates);
      await updateProfile(user, { displayName: newName });
      setIsEditModalOpen(false);
      alert("تم تحديث البيانات");
    } catch (err) { 
      console.error(err);
      alert("حدث خطأ"); 
    }
    finally { setIsUpdating(false); }
  };

  const handleUpdateEmail = async () => {
    if (!user || !newAccountEmail.trim()) return;
    setIsUpdating(true);
    try {
      await updateEmail(user, newAccountEmail.trim());
      alert("تم تحديث البريد الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول بالبريد الجديد.");
      setNewAccountEmail('');
      setSettingsView('main');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        alert("للأمان، يرجى تسجيل الخروج والدخول مرة أخرى قبل تغيير البريد");
      } else {
        alert("فشل تحديث البريد: " + err.message);
      }
    } finally { setIsUpdating(false); }
  };

  const handleUpdatePassword = async () => {
    if (!user || !newAccountPassword.trim()) return;
    setIsUpdating(true);
    try {
      await updatePassword(user, newAccountPassword.trim());
      alert("تم تحديث كلمة المرور بنجاح. استخدم كلمة المرور الجديدة في المرة القادمة.");
      setNewAccountPassword('');
      setSettingsView('main');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        alert("للأمان، يرجى تسجيل الخروج والدخول مرة أخرى قبل تغيير كلمة المرور");
      } else {
        alert("فشل تحديث كلمة المرور: " + err.message);
      }
    } finally { setIsUpdating(false); }
  };

  // Default Images Listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "default_images"), (snap) => {
      if (snap.exists()) {
        setDefaultImages(snap.data());
      }
    });
    return unsub;
  }, []);

  const handleSendSupportMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supportMsg.trim()) return;
    if (supportMsg.length > 250) return alert("الرسالة يجب أن لا تتجاوز 250 حرفاً");

    try {
      const chatRef = doc(db, "supportChats", user.uid);
      const activePhoto = liveUserData?.animatedAvatar || liveUserData?.photoURL || user.photoURL || "https://picsum.photos/200";
      
      await setDoc(chatRef, {
        userId: user.uid,
        userName: liveUserData?.displayName || user.displayName || 'مستخدم',
        userPhoto: activePhoto,
        lastMessage: supportMsg.trim(),
        lastTimestamp: serverTimestamp(),
        unreadByAdmin: true,
        unreadByUser: false
      }, { merge: true });

      await addDoc(collection(db, "supportChats", user.uid, "messages"), {
        senderId: user.uid,
        text: supportMsg.trim(),
        createdAt: serverTimestamp()
      });
      setSupportMsg('');
    } catch (e) { alert("فشل الإرسال"); }
  };

  const handleSearchPartner = async () => {
    if (!partnerSearchId.trim()) return;
    setIsSearchingPartner(true);
    try {
      const q = query(collection(db, "users"), where("customId", "==", partnerSearchId.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert("لم يتم العثور على مستخدم بهذا الـ ID");
      } else {
        const found = snap.docs[0];
        const data = found.data();
        if (found.id === user?.uid) return alert("لا يمكنك طلب الارتباط بنفسك!");
        if (data.partnerUid) return alert("هذا المستخدم مرتبط بالفعل!");
        
        setShowCPConfirmModal({
          uid: found.id,
          name: data.displayName,
          photo: data.photoURL || data.animatedAvatar || "https://picsum.photos/100"
        });
        setShowCPRequestModal(false);
      }
    } catch (e) { alert("خطأ في البحث"); }
    finally { setIsSearchingPartner(false); }
  };

  const handleSendCPRequest = async () => {
    if (!showCPConfirmModal || !user) return;
    if ((liveUserData?.coins || 0) < 50000000) return alert("رصيدك غير كافٍ، تحتاج إلى 50,000,000 كوينز");

    setIsUpdating(true);
    try {
      // Deduct coins first
      await updateDoc(doc(db, "users", user.uid), {
        coins: increment(-50000000)
      });

      // Send relationship request notification
      await addDoc(collection(db, "users", showCPConfirmModal.uid, "systemNotifications"), {
        title: "طلب ارتباط (CP)",
        desc: `تقدم ${liveUserData.displayName} بربط علاقة معك`,
        type: 'cp_request',
        senderUid: user.uid,
        senderName: liveUserData.displayName,
        icon: 'fa-heart',
        createdAt: serverTimestamp()
      });

      alert("تم إرسال طلب الارتباط وخصم الكوينز. في حال الرفض ستعود الكوينز لحسابك.");
      setShowCPConfirmModal(null);
      setPartnerSearchId('');
    } catch (e) {
      alert("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmBreakup = async () => {
    if (!user || !liveUserData?.partnerUid) return;
    if ((liveUserData?.coins || 0) < 100000000) return alert("رصيدك غير كافٍ لفك الارتباط، تحتاج إلى 100,000,000 كوينز لتعويض الشريك");

    setIsUpdating(true);
    try {
      const partnerId = liveUserData.partnerUid;
      
      // 1. Deduct 100M from initiator and break link
      await updateDoc(doc(db, "users", user.uid), {
        coins: increment(-100000000),
        partnerUid: deleteField()
      });

      // 2. Compensate partner and break link
      await updateDoc(doc(db, "users", partnerId), {
        coins: increment(100000000),
        partnerUid: deleteField()
      });

      // 3. Send system notification to partner
      await addDoc(collection(db, "users", partnerId, "systemNotifications"), {
        title: "انفصال وتعويض",
        desc: `الشريك الآخر قام بفك العلاقة وقام بتعويضك بمبلغ 100,000,000 عملة ذهبية`,
        icon: 'fa-heart-broken',
        createdAt: serverTimestamp()
      });

      alert("تم إنهاء العلاقة وتعويض الشريك بنجاح");
      setShowCPBreakupModal(false);
      setIsCPPageOpen(false);
    } catch (e) {
      alert("حدث خطأ أثناء فك الارتباط");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConvertDiamonds = async () => {
    if (!user) return;
    const amount = parseInt(convertAmount);
    if (isNaN(amount) || amount <= 0) return alert("يرجى إدخال مبلغ صحيح");
    if (userDiamonds < amount) return alert("رصيد الماس غير كافٍ");

    setIsUpdating(true);
    try {
      const receiveCoins = Math.floor(amount * 0.8);
      await updateDoc(doc(db, "users", user.uid), {
        diamonds: increment(-amount),
        coins: increment(receiveCoins)
      });
      
      // Add profit to fruits game global profit tracking as general admin profit
      await updateDoc(doc(db, "settings", "fruitsGame"), {
        totalProfit24h: increment(amount * 0.2)
      }).catch(() => {});

      alert(`تم تحويل ${amount.toLocaleString()} ماسة إلى ${receiveCoins.toLocaleString()} كوينز (خصم 20% رسوم الإدارة)`);
      setShowConvertModal(false);
      setConvertAmount('');
    } catch (e) {
      alert("حدث خطأ أثناء التحويل");
    } finally {
      setIsUpdating(false);
    }
  };

  const userDisplayName = liveUserData?.displayName || user?.displayName || 'المستخدم';
  const userCustomId = liveUserData?.customId || (isOfficialAdmin ? 'OFFICIAL' : user?.uid.substring(0, 8));
  const userCoins = liveUserData?.coins || 0;
  const userDiamonds = liveUserData?.diamonds || 0;
  const userCustomIdIcon = liveUserData?.customIdIcon;
  const currentFrame = liveUserData?.currentFrame || null;
  const idX = liveUserData?.idOffsetX ?? 28;
  const idY = liveUserData?.idOffsetY ?? 0.5;

  const currentActiveAvatar = liveUserData?.animatedAvatar || liveUserData?.photoURL || defaultImages?.profileImage || user?.photoURL || "https://picsum.photos/200";
  const partnerAvatar = partnerData?.animatedAvatar || partnerData?.photoURL || "https://picsum.photos/200";

  return (
    <div className="flex-1 overflow-y-auto bg-[#1a0b2e] text-purple-50 pb-10" dir="rtl">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'photoURL')} />
      <input type="file" ref={headerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'headerURL')} />

      <div className="relative">
        <div className="h-44 w-full overflow-hidden relative group cursor-pointer" onClick={() => headerInputRef.current?.click()}>
          <img src={liveUserData?.headerURL || defaultImages?.coverImage || "https://picsum.photos/600/300?random=45"} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-300" alt="Cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a0b2e]/60 to-[#1a0b2e]"></div>
          {isImageUploading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10"><i className="fas fa-circle-notch animate-spin text-white"></i></div>}
        </div>
        <div className="absolute top-6 left-6 z-30 flex gap-2">
          <button onClick={() => setIsEditModalOpen(true)} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-lg text-white active:scale-95 transition-all">
            <i className="fas fa-pen-to-square text-sm"></i>
          </button>
        </div>
        <div className="absolute top-28 right-6 left-6 flex items-center gap-3 z-20">
          <div className="relative flex-shrink-0 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className={`${currentFrame ? 'w-[84px] h-[84px]' : 'w-[96px] h-[96px]'} relative flex items-center justify-center transition-all duration-300`}>
              <div className="w-[82%] h-[82%] rounded-full border-[3px] border-[#1a0b2e] shadow-2xl overflow-hidden bg-purple-900 z-10 relative">
                 {liveUserData?.animatedAvatar ? (
                  isVideoUrl(liveUserData.animatedAvatar) ? (
                    <video src={liveUserData.animatedAvatar} autoPlay loop muted playsInline className="w-full h-full object-cover bg-slate-900" />
                  ) : (
                    <img src={liveUserData.animatedAvatar} className="w-full h-full object-cover bg-slate-900" alt="Profile" />
                  )
                ) : (
                  <img src={liveUserData?.photoURL || defaultImages?.profileImage || user?.photoURL || "https://picsum.photos/200"} className={`w-full h-full object-cover group-hover:opacity-70 transition-all ${isImageUploading ? 'opacity-50' : ''}`} alt="Profile" />
                )}
                {isImageUploading && <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-circle-notch animate-spin text-white text-xs"></i></div>}
              </div>
              {currentFrame && (
                <img src={currentFrame} className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20 scale-[1.25]" alt="frame" />
              )}
            </div>
          </div>
          <div className="flex flex-col min-w-0 flex-1 justify-center translate-y-3">
            <h2 className="text-2xl font-black text-white drop-shadow-2xl leading-tight mb-0.5 truncate">{userDisplayName}</h2>
            <div className="flex items-center gap-2">
              {userCustomIdIcon ? (
                <div className="relative w-[90px] h-[28px] flex items-center bg-contain bg-center bg-no-repeat animate-in zoom-in duration-300" style={{ backgroundImage: `url(${userCustomIdIcon})` }}>
                  <span className="font-black text-white tracking-widest text-center w-full block drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" 
                        style={{ 
                          paddingLeft: `${idX}px`, 
                          paddingTop: `${idY}px`,
                          fontSize: `${liveUserData?.idFontSize || 10}px`
                        }}>
                    {userCustomId}
                  </span>
                </div>
              ) : (
                <span className={`text-[11px] font-black w-fit ${userCustomId === 'OFFICIAL' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-purple-300 bg-white/5 border-white/5'} px-3 py-1 rounded-xl border tracking-wider`}>ID: {userCustomId}</span>
              )}

              {/* Gender and Region Info */}
              <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-xl border border-white/5">
                {liveUserData?.gender === 'male' ? (
                  <i className="fas fa-mars text-blue-400 text-[10px]"></i>
                ) : liveUserData?.gender === 'female' ? (
                  <i className="fas fa-venus text-pink-400 text-[10px]"></i>
                ) : null}
                {liveUserData?.regionFlag && (
                  <span className="text-sm leading-none">{liveUserData.regionFlag}</span>
                )}
              </div>
            </div>

            {/* Compact Level Badges */}
            <div className="flex gap-2 mt-2 animate-in slide-in-from-left duration-500">
              {/* Wealth Badge */}
              {(() => {
                const info = getWealthLevelInfo(liveUserData?.wealthXP || 0);
                return (
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${info.tier.border} ${info.tier.bg} backdrop-blur-md shadow-lg`}>
                    <div className={`w-4 h-4 rounded-full ${info.tier.bar} flex items-center justify-center text-[8px] text-white`}>
                      <i className="fas fa-crown"></i>
                    </div>
                    <span className={`text-[10px] font-black ${info.tier.color}`}>{info.level}</span>
                  </div>
                );
              })()}

              {/* Charisma Badge */}
              {(() => {
                const info = getCharismaLevelInfo(liveUserData?.charismaXP || 0);
                return (
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${info.tier.border} ${info.tier.bg} backdrop-blur-md shadow-lg`}>
                    <div className={`w-4 h-4 rounded-full ${info.tier.bar} flex items-center justify-center text-[8px] text-white`}>
                      <i className="fas fa-heart"></i>
                    </div>
                    <span className={`text-[10px] font-black ${info.tier.color}`}>{info.level}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-20 relative z-10">
        <div className="grid grid-cols-3 gap-2 w-full">
          {['friends', 'following', 'followers'].map((type) => (
            <button key={type} className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col items-center active:scale-95 transition-transform">
              <span className="text-lg font-black text-purple-400">0</span>
              <span className="text-[9px] text-purple-300/60 font-black mt-1 uppercase">{type === 'friends' ? 'أصدقاء' : type === 'following' ? 'متابعة' : 'متابعين'}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <button onClick={() => setIsWalletOpen(true)} className="w-full flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-2xl active:scale-[0.98] transition-all group hover:bg-white/10">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400"><i className="fas fa-wallet text-lg"></i></div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm text-white tracking-wide">المحفظة الإلكترونية</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-purple-300/60 font-black">{userCoins.toLocaleString('ar-EG')} <i className="fas fa-coins text-[8px] text-yellow-500"></i></span>
                  <span className="text-[10px] text-cyan-300/60 font-black">{userDiamonds.toLocaleString('ar-EG')} <i className="fas fa-gem text-[8px] text-cyan-400"></i></span>
                </div>
              </div>
            </div>
            <i className="fas fa-chevron-left text-xs text-white/10"></i>
          </button>

          {liveUserData?.isAgency && (
            <button 
              onClick={() => setIsAgencyWalletOpen(true)} 
              className="w-full flex justify-between items-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl active:scale-[0.98] transition-all hover:bg-emerald-500/20 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <i className="fas fa-vault text-lg"></i>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm text-emerald-100 tracking-wide">محفظة وكالة الشحن</span>
                  <span className="text-[10px] text-emerald-500/60 font-bold">رصيد الشحن: {(liveUserData.agencyBalance || 0).toLocaleString()} <i className="fas fa-coins text-[8px]"></i></span>
                </div>
              </div>
              <i className="fas fa-chevron-left text-xs text-emerald-500/30"></i>
            </button>
          )}

          {/* New Levels Display Section */}
          <div className="flex flex-col gap-3 py-4 animate-in slide-in-from-bottom duration-500">
            <div className="grid grid-cols-2 gap-3">
              {/* Wealth Level Card */}
              {(() => {
                const info = getWealthLevelInfo(liveUserData?.wealthXP || 0);
                return (
                  <div className={`p-4 rounded-[2rem] border ${info.tier.border} ${info.tier.bg} shadow-2xl relative overflow-hidden group transition-all duration-500`}>
                    <div className="flex flex-col gap-2 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-extrabold uppercase tracking-tighter ${info.tier.color} drop-shadow-md`}>الثروة</span>
                        <span className={`text-xs font-black ${info.tier.color}`}>Lvl {info.level}</span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div className={`h-full transition-all duration-1000 ease-out ${info.tier.bar} ${info.tier.glow} shadow-lg`} style={{ width: `${info.progress}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[8px] font-black text-white/40 mt-0.5">
                        <span className="truncate">{info.tier.name}</span>
                        <span className="whitespace-nowrap">+{info.xpRemaining.toLocaleString()}</span>
                      </div>
                    </div>
                    {/* Decorative Background Icon */}
                    <i className={`fas fa-crown absolute -bottom-4 -left-4 text-6xl opacity-[0.07] text-white group-hover:scale-125 transition-transform duration-700 blur-[0.5px]`}></i>
                  </div>
                );
              })()}

              {/* Charisma Level Card */}
              {(() => {
                const info = getCharismaLevelInfo(liveUserData?.charismaXP || 0);
                return (
                  <div className={`p-4 rounded-[2rem] border ${info.tier.border} ${info.tier.bg} shadow-2xl relative overflow-hidden group transition-all duration-500`}>
                    <div className="flex flex-col gap-2 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-extrabold uppercase tracking-tighter ${info.tier.color} drop-shadow-md`}>الجاذبية</span>
                        <span className={`text-xs font-black ${info.tier.color}`}>Lvl {info.level}</span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div className={`h-full transition-all duration-1000 ease-out ${info.tier.bar} ${info.tier.glow} shadow-lg`} style={{ width: `${info.progress}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[8px] font-black text-white/40 mt-0.5">
                        <span className="truncate">{info.tier.name}</span>
                        <span className="whitespace-nowrap">+{info.xpRemaining.toLocaleString()}</span>
                      </div>
                    </div>
                    {/* Decorative Background Icon */}
                    <i className={`fas fa-heart absolute -bottom-4 -left-4 text-6xl opacity-[0.07] text-white group-hover:scale-125 transition-transform duration-700 blur-[0.5px]`}></i>
                  </div>
                );
              })()}
            </div>
          </div>

          <button onClick={() => setIsStoreOpen(true)} className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-2xl active:scale-[0.98] transition-all group hover:from-purple-600/20 hover:to-pink-600/20 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20"><i className="fas fa-store text-lg"></i></div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm text-white tracking-wide">متجر التميز</span>
                <span className="text-[10px] text-pink-300/60 font-black">إطارات • دخوليات • خلفيات</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-pink-500/20 text-pink-400 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">جديد</span>
              <i className="fas fa-chevron-left text-xs text-white/10"></i>
            </div>
          </button>

          {/* New CP Button (Standard style outside) */}
          <button onClick={() => setIsCPPageOpen(true)} className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-rose-600/10 to-pink-600/10 border border-rose-500/20 rounded-2xl active:scale-[0.98] transition-all group hover:from-rose-600/20 hover:to-pink-600/20 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20"><i className="fas fa-heart text-lg"></i></div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm text-white tracking-wide">CP</span>
                <span className="text-[10px] text-rose-300/60 font-black">شريك الأحلام</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {liveUserData?.partnerUid && <div className="w-6 h-6 rounded-full overflow-hidden shadow-sm animate-in zoom-in"><img src={partnerAvatar} className="w-full h-full object-cover" /></div>}
              <i className="fas fa-chevron-left text-xs text-white/10"></i>
            </div>
          </button>

          <button onClick={() => { setIsSettingsOpen(true); setSettingsView('main'); }} className="w-full flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-2xl active:scale-[0.98] transition-all group hover:bg-white/10">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-slate-500/20 flex items-center justify-center text-slate-300"><i className="fas fa-cog text-lg"></i></div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm text-white tracking-wide">إعدادات الحساب</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasUnreadSupport && (
                <span className="w-1.5 h-1.5 bg-red-800 rounded-full"></span>
              )}
              <i className="fas fa-chevron-left text-xs text-white/10"></i>
            </div>
          </button>

          {isAdmin && (
            <button onClick={() => setIsAdminPanelOpen(true)} className="w-full flex justify-between items-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl active:scale-[0.98] transition-all hover:bg-yellow-500/20">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500"><i className="fas fa-user-shield text-lg"></i></div>
                <span className="font-bold text-sm text-yellow-100 tracking-wide">لوحة تحكم المسؤول</span>
              </div>
              <i className="fas fa-chevron-left text-xs text-yellow-500/30"></i>
            </button>
          )}

          {isOfficialAdmin && (
            <button 
              onClick={() => setIsAgencyManagementOpen(true)} 
              className="w-full flex justify-between items-center p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl active:scale-[0.98] transition-all hover:bg-indigo-500/20 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <i className="fas fa-building-shield text-lg"></i>
                </div>
                <span className="font-bold text-sm text-indigo-100 tracking-wide">إدارة وكالات الشحن</span>
              </div>
              <i className="fas fa-chevron-left text-xs text-indigo-500/30"></i>
            </button>
          )}

          {(auth.currentUser?.email === 'admin@yalla.com' || liveUserData?.isGM) && (
            <button 
              onClick={() => setIsGMPageOpen(true)}
              className="w-full flex justify-between items-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl active:scale-[0.98] transition-all hover:bg-blue-500/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500"><i className="fas fa-users-cog text-lg"></i></div>
                <span className="font-bold text-sm text-blue-100 tracking-wide">نظام المدير العام</span>
              </div>
              <i className="fas fa-chevron-left text-xs text-blue-500/30"></i>
            </button>
          )}

          {(auth.currentUser?.email === 'admin@yalla.com' || auth.currentUser?.email === 'adhamyosry56@gmail.com' || liveUserData?.canBan) && (
            <button onClick={() => setIsBanSystemOpen(true)} className="w-full flex justify-between items-center p-4 bg-red-500/10 border border-red-500/20 rounded-2xl active:scale-[0.98] transition-all hover:bg-red-500/20">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500"><i className="fas fa-user-slash text-lg"></i></div>
                <span className="font-bold text-sm text-red-100 tracking-wide">نظام حظر المستخدمين</span>
              </div>
              <i className="fas fa-chevron-left text-xs text-red-500/30"></i>
            </button>
          )}

          {auth.currentUser?.email === 'admin@yalla.com' && (
            <button onClick={() => setIsBanLogsOpen(true)} className="w-full flex justify-between items-center p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl active:scale-[0.98] transition-all hover:bg-orange-500/20">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500"><i className="fas fa-history text-lg"></i></div>
                <span className="font-bold text-sm text-orange-100 tracking-wide">سجل عمليات الحظر</span>
              </div>
              <i className="fas fa-chevron-left text-xs text-orange-500/30"></i>
            </button>
          )}
        </div>
      </div>

      {isWalletOpen && (
        <div className="fixed inset-0 z-[500] bg-[#0d051a]/98 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in">
           <div className="w-full max-w-[320px] flex flex-col gap-5">
              <div className="flex justify-between items-center px-2">
                 <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setWalletTab('coins')}
                      className={`text-sm font-black transition-all relative ${walletTab === 'coins' ? 'text-white' : 'text-white/30'}`}
                    >
                      الكوينز
                      {walletTab === 'coins' && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-yellow-500 rounded-full"></div>}
                    </button>
                    <button 
                      onClick={() => setWalletTab('diamonds')}
                      className={`text-sm font-black transition-all relative ${walletTab === 'diamonds' ? 'text-white' : 'text-white/30'}`}
                    >
                      الماس
                      {walletTab === 'diamonds' && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-cyan-400 rounded-full"></div>}
                    </button>
                 </div>
                 <button onClick={() => setIsWalletOpen(false)} className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all"><i className="fas fa-times text-xs"></i></button>
              </div>

              {walletTab === 'coins' ? (
                <div className="relative w-full aspect-[1.7/1] rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#cda34b] via-[#b68e41] to-[#735b2e] shadow-2xl border border-white/10 p-6 flex flex-col justify-between animate-in zoom-in duration-300">
                  <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-white/5 to-transparent"></div>
                  <div className="flex justify-between items-start z-10"><span className="text-[9px] font-black text-[#3d3118] uppercase tracking-[0.2em] opacity-40">Private Wallet</span><div className="text-[#3d3118] font-black text-sm italic opacity-60">COINS</div></div>
                  <div className="flex flex-col items-center z-10"><div className="flex items-center gap-2.5"><i className="fas fa-coins text-[#3d3118] text-2xl opacity-60"></i><span className="text-3xl font-black text-[#2a2210]">{userCoins.toLocaleString('ar-EG')}</span></div></div>
                  <div className="flex flex-col z-10"><span className="text-[12px] font-black text-[#2a2210] tracking-widest uppercase truncate">{userDisplayName}</span><span className="text-[9px] font-bold text-[#3d3118] opacity-60">ID {userCustomId}</span></div>
                </div>
              ) : (
                <div className="relative w-full aspect-[1.7/1] rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#083344] via-[#0e7490] to-[#083344] shadow-2xl border border-white/20 p-6 flex flex-col justify-between animate-in zoom-in duration-300">
                  <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-white/10 to-transparent"></div>
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[9px] font-black text-cyan-300/40 uppercase tracking-[0.2em]">Private Wallet</span>
                    <div className="text-white font-black text-sm italic opacity-80">DIAMONDS</div>
                  </div>
                  <div className="flex flex-col items-center z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <i className="fas fa-gem text-white text-xl"></i>
                      </div>
                      <span className="text-3xl font-black text-white drop-shadow-lg">{userDiamonds.toLocaleString('ar-EG')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col z-10">
                    <span className="text-[12px] font-black text-white tracking-widest uppercase truncate drop-shadow-md">{userDisplayName}</span>
                    <span className="text-[9px] font-bold text-white/80">ID {userCustomId}</span>
                  </div>

                  {/* Bottom Left Convert Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConvertModal(true);
                    }}
                    disabled={userDiamonds <= 0}
                    className="absolute bottom-6 left-6 px-3 py-1.5 bg-cyan-400/10 backdrop-blur-md border border-cyan-400/20 rounded-xl text-[9px] font-black text-white shadow-xl active:scale-95 transition-all flex items-center gap-1.5 hover:bg-cyan-400/20 z-20 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-arrows-rotate text-[8px]"></i>
                    فك الماس
                  </button>
                </div>
              )}
           </div>

           {/* Conversion Modal */}
           {showConvertModal && (
             <div className="fixed inset-0 z-[600] bg-[#0d051a]/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in pr-0">
               <div className="bg-gradient-to-br from-[#083344] via-[#0e7490] to-[#083344] w-full max-w-[320px] rounded-[2.5rem] border border-white/20 p-6 shadow-2xl flex flex-col gap-6 relative overflow-hidden animate-in zoom-in duration-300">
                 <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                 
                 {/* Mimic Card Header */}
                 <div className="flex justify-between items-start z-10 opacity-40">
                   <span className="text-[9px] font-black text-cyan-300 uppercase tracking-[0.2em]">Convert Asset</span>
                   <div className="text-white font-black text-sm italic">DIAMONDS</div>
                 </div>

                 <div className="text-center space-y-1 z-10">
                   <h4 className="text-white font-black text-xl drop-shadow-lg">فك الماس</h4>
                   <p className="text-[10px] text-cyan-200/60 font-bold uppercase tracking-widest">رسوم التطبيق 20%</p>
                 </div>

                 <div className="space-y-4 z-10">
                   <div className="bg-black/20 backdrop-blur-md p-5 rounded-[2rem] border border-white/10 shadow-inner">
                     <div className="flex justify-between items-center mb-3">
                       <span className="text-[10px] text-white/40 font-black">الكمية المراد تحويلها</span>
                       <div className="bg-cyan-400/20 px-2 py-0.5 rounded-lg border border-cyan-400/30">
                         <span className="text-[9px] text-cyan-300 font-black">{userDiamonds.toLocaleString()} <i className="fas fa-gem text-[7px]"></i></span>
                       </div>
                     </div>
                     <input 
                       type="number" 
                       value={convertAmount} 
                       onChange={e => {
                         const val = parseInt(e.target.value);
                         if (!isNaN(val)) {
                           if (val < 0) {
                             setConvertAmount('0');
                           } else if (val > userDiamonds) {
                             setConvertAmount(userDiamonds.toString());
                           } else {
                             setConvertAmount(val.toString());
                           }
                         } else {
                           setConvertAmount('');
                         }
                       }} 
                       placeholder="0" 
                       className="w-full bg-transparent text-3xl font-black text-white outline-none text-center placeholder:text-white/10"
                     />
                   </div>

                   {convertAmount && parseInt(convertAmount) > 0 && (
                     <div className="flex flex-col items-center gap-2 animate-in slide-in-from-top duration-300">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                          <i className="fas fa-arrow-down text-cyan-400 text-sm"></i>
                        </div>
                        <div className="bg-yellow-500/10 px-6 py-3 rounded-2xl border border-yellow-500/20 backdrop-blur-sm shadow-xl">
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] text-yellow-500/60 font-black uppercase mb-1">الرصيد المستلم</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-yellow-400">{Math.floor(parseInt(convertAmount) * 0.8).toLocaleString()}</span>
                              <i className="fas fa-coins text-yellow-500"></i>
                            </div>
                          </div>
                        </div>
                     </div>
                   )}
                 </div>

                 <div className="flex gap-3 z-10">
                   <button 
                     onClick={handleConvertDiamonds}
                     disabled={isUpdating || !convertAmount || parseInt(convertAmount) <= 0}
                     className="flex-[2] bg-white text-[#083344] py-4 rounded-2xl text-xs font-black shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                     {isUpdating ? <i className="fas fa-spinner animate-spin"></i> : (
                       <>
                         <i className="fas fa-check"></i>
                         <span>تأكيد الفك</span>
                       </>
                     )}
                   </button>
                   <button 
                     onClick={() => setShowConvertModal(false)} 
                     className="flex-1 bg-black/20 backdrop-blur-md py-4 rounded-2xl text-xs font-black text-white border border-white/10 active:scale-95 transition-all"
                   >
                     تراجع
                   </button>
                 </div>

                 {/* Decorative background gem */}
                 <i className="fas fa-gem absolute -bottom-10 -right-10 text-[180px] text-white/5 blur-[2px] transform rotate-12"></i>
               </div>
             </div>
           )}
        </div>
      )}

      {/* CP Internal Page */}
      {isCPPageOpen && (
        <div className="fixed inset-0 z-[550] bg-[#1a0b2e] flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Dynamic Full Screen Background */}
          <div className="absolute inset-0 z-0">
            {cpConfig?.backgroundUrl ? (
              isVideoUrl(cpConfig.backgroundUrl) ? (
                <video src={cpConfig.backgroundUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={cpConfig.backgroundUrl} className="w-full h-full object-cover" />
              )
            ) : (
              <div className="w-full h-full bg-[#1a0b2e]"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
          </div>

          {/* Transparent Minimalist Controls directly over background */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20 pointer-events-none">
            <button 
              onClick={() => setIsCPPageOpen(false)} 
              className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-xl text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all shadow-2xl pointer-events-auto"
            >
              <i className="fas fa-times"></i>
            </button>
            <h3 className="text-xl font-black text-white drop-shadow-xl pointer-events-auto">شريك الأحلام (CP)</h3>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 relative z-10">
            <div className="flex items-center justify-center gap-4">
              {/* User Photo Circle */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.3)] overflow-hidden bg-slate-900">
                  <img src={currentActiveAvatar} className="w-full h-full object-cover" alt="Me" />
                </div>
                <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest drop-shadow-lg">أنا</span>
              </div>
              
              {/* Connector Heart Icon */}
              <div className={`w-28 h-28 flex items-center justify-center ${liveUserData?.partnerUid ? 'animate-pulse' : ''}`}>
                {cpConfig?.middleIconUrl ? (
                  <img src={cpConfig.middleIconUrl} className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
                ) : (
                  <i className="fas fa-heart text-rose-500/60 text-6xl drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]"></i>
                )}
              </div>

              {/* Partner Circle or Plus */}
              <div className="flex flex-col items-center gap-3">
                {liveUserData?.partnerUid ? (
                  <div className="w-20 h-20 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.3)] overflow-hidden bg-slate-900 animate-in zoom-in">
                    <img src={partnerAvatar} className="w-full h-full object-cover" alt="Partner" />
                  </div>
                ) : (
                  <button onClick={() => setShowCPRequestModal(true)} className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/40 active:scale-95 transition-all hover:bg-white/10 group shadow-2xl">
                    <i className="fas fa-plus text-xl group-hover:text-rose-500 transition-colors"></i>
                  </button>
                )}
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest drop-shadow-lg">
                  {liveUserData?.partnerUid ? partnerData?.displayName : 'إضافة شريك'}
                </span>
              </div>
            </div>

            {!liveUserData?.partnerUid ? (
              <div className="text-center max-w-[280px] space-y-6">
                <div className="space-y-2">
                  <h4 className="text-white font-black text-base drop-shadow-lg">لم يتم العثور على شريك بعد</h4>
                  <p className="text-[11px] text-white/60 leading-relaxed font-bold drop-shadow-md">
                    قم بدعوة صديقك المفضل ليصبح شريك الأحلام الخاص بك وتظهر علاقتكما المميزة في ملفاتكما الشخصية.
                  </p>
                </div>
                <button onClick={() => setShowCPRequestModal(true)} className="px-10 py-4 bg-rose-500/5 backdrop-blur-md border border-rose-500/20 rounded-2xl text-rose-500 font-black text-xs shadow-2xl active:scale-95 transition-all">
                  بحث عن صديق بالـ ID
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 animate-in fade-in">
                 <p className="text-[11px] text-rose-300 font-black uppercase tracking-widest drop-shadow-lg">لقد وجدت شريك أحلامك!</p>
                 <button onClick={() => setShowCPBreakupModal(true)} className="bg-black/30 backdrop-blur-md px-6 py-2 rounded-full text-white/60 hover:text-red-400 transition-colors text-[9px] font-black uppercase border border-white/5">إنهاء العلاقة</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CP Request ID Modal */}
      {showCPRequestModal && (
        <div className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-[#1a0b2e] w-full max-w-[300px] rounded-[2rem] border border-white/10 p-6 shadow-2xl flex flex-col gap-6">
              <div className="text-center space-y-1">
                <h4 className="text-white font-black text-sm">ارتباط جديد</h4>
                <p className="text-[10px] text-white/40 font-bold">ادخل ID صديقك المفضل</p>
              </div>
              <input 
                type="text" 
                value={partnerSearchId} 
                onChange={e => setPartnerSearchId(e.target.value)} 
                placeholder="ID الصديق..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none text-center font-black"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleSearchPartner} 
                  disabled={isSearchingPartner || !partnerSearchId.trim()}
                  className="flex-1 bg-rose-500/5 backdrop-blur-md border border-rose-500/20 py-3.5 rounded-xl text-[11px] font-black text-rose-500 shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSearchingPartner ? <i className="fas fa-spinner animate-spin"></i> : 'بحث وإرسال'}
                </button>
                <button onClick={() => setShowCPRequestModal(false)} className="flex-1 bg-white/5 py-3.5 rounded-xl text-[11px] font-black text-white border border-white/10 active:scale-95">إلغاء</button>
              </div>
           </div>
        </div>
      )}

      {/* CP Confirmation Modal (50M Coins) */}
      {showCPConfirmModal && (
        <div className="fixed inset-0 z-[750] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in">
           <div className="bg-[#1a0b2e] w-full max-w-[320px] rounded-[2.5rem] border border-white/10 p-8 shadow-2xl flex flex-col items-center gap-6 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-rose-500 p-1">
                <img src={showCPConfirmModal.photo} className="w-full h-full rounded-full object-cover" />
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-black text-sm">تأكيد طلب الارتباط</h4>
                <p className="text-[11px] text-rose-300 font-bold">هل أنت متأكد من طلب الارتباط بـ {showCPConfirmModal.name}؟</p>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 w-full">
                 <p className="text-[10px] text-white/60 font-bold mb-1">تكلفة الطلب:</p>
                 <div className="flex items-center justify-center gap-2">
                    <span className="text-xl font-black text-yellow-500">50,000,000</span>
                    <i className="fas fa-coins text-yellow-500 text-sm"></i>
                 </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button 
                  onClick={handleSendCPRequest}
                  disabled={isUpdating}
                  className="w-full bg-rose-600 py-4 rounded-2xl text-[12px] font-black text-white shadow-xl active:scale-95 transition-all border border-white/10"
                >
                  {isUpdating ? <i className="fas fa-spinner animate-spin"></i> : 'نعم، أرسل الطلب'}
                </button>
                <button onClick={() => setShowCPConfirmModal(null)} className="w-full py-3 text-[11px] font-black text-white/40 hover:text-white transition-colors">تراجع</button>
              </div>
           </div>
        </div>
      )}

      {/* CP Breakup Confirmation Modal (100M Coins Compensation) */}
      {showCPBreakupModal && (
        <div className="fixed inset-0 z-[750] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in">
           <div className="bg-[#1a0b2e] w-full max-w-[320px] rounded-[2.5rem] border border-white/10 p-8 shadow-2xl flex flex-col items-center gap-6 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-red-500 p-1">
                <i className="fas fa-heart-broken text-red-500 text-3xl flex items-center justify-center h-full"></i>
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-black text-sm">تأكيد إنهاء العلاقة</h4>
                <p className="text-[11px] text-red-300 font-bold leading-relaxed">سيتم تعويض شريكك بـ 100,000,000 عملة ذهبية مقابل فك الارتباط. هل أنت متأكد؟</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 w-full">
                 <p className="text-[10px] text-white/60 font-bold mb-1">رسوم التعويض:</p>
                 <div className="flex items-center justify-center gap-2">
                    <span className="text-xl font-black text-yellow-500">100,000,000</span>
                    <i className="fas fa-coins text-yellow-500 text-sm"></i>
                 </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button 
                  onClick={handleConfirmBreakup}
                  disabled={isUpdating}
                  className="w-full bg-red-600 py-4 rounded-2xl text-[12px] font-black text-white shadow-xl active:scale-95 transition-all border border-white/10"
                >
                  {isUpdating ? <i className="fas fa-spinner animate-spin"></i> : 'نعم، فك الارتباط'}
                </button>
                <button onClick={() => setShowCPBreakupModal(false)} className="w-full py-3 text-[11px] font-black text-white/40 hover:text-white transition-colors">تراجع</button>
              </div>
           </div>
        </div>
      )}

      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} user={user} userCoins={userCoins} userPhoto={currentActiveAvatar} currentFrame={liveUserData?.currentFrame || null} currentEntry={liveUserData?.currentEntry || null} onOpenWallet={() => { setIsStoreOpen(false); setIsWalletOpen(true); }} />

      <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} isOfficialAdmin={isOfficialAdmin} />

      <GMPage 
        isOpen={isGMPageOpen} 
        onClose={() => setIsGMPageOpen(false)} 
        onOpenBanSystem={() => setIsBanSystemOpen(true)}
        onOpenBanLogs={() => setIsBanLogsOpen(true)}
        onOpenGiveItems={() => setIsGiveItemsOpen(true)}
        onOpenRoomsManagement={() => setIsRoomsManagementOpen(true)}
        onOpenRoomReports={() => setIsRoomReportsOpen(true)}
      />

      <GiveItemsModal isOpen={isGiveItemsOpen} onClose={() => setIsGiveItemsOpen(false)} />

      <RoomsManagementModal isOpen={isRoomsManagementOpen} onClose={() => setIsRoomsManagementOpen(false)} />

      <RoomReportsModal isOpen={isRoomReportsOpen} onClose={() => setIsRoomReportsOpen(false)} />

      <AgencyManagementModal isOpen={isAgencyManagementOpen} onClose={() => setIsAgencyManagementOpen(false)} />
      <AgencyWalletModal isOpen={isAgencyWalletOpen} onClose={() => setIsAgencyWalletOpen(false)} userBalance={liveUserData?.agencyBalance || 0} />

      <BanSystemModal isOpen={isBanSystemOpen} onClose={() => setIsBanSystemOpen(false)} />

      <BanLogsModal isOpen={isBanLogsOpen} onClose={() => setIsBanLogsOpen(false)} />

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[550] bg-[#1a0b2e] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-5 flex justify-between items-center border-b border-white/5 bg-[#0d051a]">
            {settingsView !== 'main' ? (
              <button onClick={() => setSettingsView('main')} className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all">
                <i className="fas fa-arrow-right"></i>
              </button>
            ) : <div className="w-10"></div>}
            
            <h3 className="text-lg font-black text-white">
              {settingsView === 'main' ? 'إعدادات الحساب' : settingsView === 'email' ? 'تغيير بريد الحساب' : settingsView === 'password' ? 'تغيير كلمة المرور' : 'الدعم الفني'}
            </h3>
            
            <button onClick={() => { setIsSettingsOpen(false); setSettingsView('main'); }} className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all"><i className="fas fa-times"></i></button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide flex flex-col">
            {settingsView === 'main' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <button 
                  onClick={() => setSettingsView('email')}
                  className="w-full flex justify-between items-center p-5 bg-white/5 border border-white/5 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-white/10 shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-blue-600/20 flex items-center justify-center text-blue-400">
                      <i className="fas fa-envelope text-xl"></i>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-black text-sm text-white tracking-wide">تغيير بريد الحساب</span>
                      <span className="text-[10px] text-white/30 font-bold">تحديث البريد الإلكتروني الخاص بدخولك</span>
                    </div>
                  </div>
                  <i className="fas fa-chevron-left text-xs text-white/10"></i>
                </button>

                <button 
                  onClick={() => setSettingsView('password')}
                  className="w-full flex justify-between items-center p-5 bg-white/5 border border-white/5 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-white/10 shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-purple-600/20 flex items-center justify-center text-purple-400">
                      <i className="fas fa-key text-xl"></i>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-black text-sm text-white tracking-wide">تغيير كلمة المرور</span>
                      <span className="text-[10px] text-white/30 font-bold">تحديث مفتاح الأمان الخاص بحسابك</span>
                    </div>
                  </div>
                  <i className="fas fa-chevron-left text-xs text-white/10"></i>
                </button>

                <button 
                  onClick={() => setSettingsView('support')}
                  className="w-full flex justify-between items-center p-5 bg-emerald-600/10 border border-emerald-500/20 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-emerald-600/20 shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-emerald-600/20 flex items-center justify-center text-emerald-400">
                      <i className="fas fa-headset text-xl"></i>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-black text-sm text-white tracking-wide">الدعم الفني</span>
                      <span className="text-[10px] text-emerald-300/60 font-bold">تواصل مباشر مع فريق الدعم</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUnreadSupport && (
                      <span className="w-1.5 h-1.5 bg-red-800 rounded-full"></span>
                    )}
                    <i className="fas fa-chevron-left text-xs text-white/10"></i>
                  </div>
                </button>

                <div className="pt-8 mt-8 border-t border-white/5">
                  <button 
                    onClick={() => { signOut(auth); setIsSettingsOpen(false); }} 
                    className="w-full flex justify-between items-center p-4 bg-red-600/10 border border-red-500/20 rounded-full active:scale-[0.98] transition-all hover:bg-red-600/20 shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-red-600/20 flex items-center justify-center text-red-400">
                        <i className="fas fa-sign-out-alt text-lg"></i>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-sm text-white tracking-wide">تسجيل الخروج من الحساب</span>
                      </div>
                    </div>
                    <i className="fas fa-chevron-left text-xs text-white/10"></i>
                  </button>
                </div>
              </div>
            )}

            {settingsView === 'email' && (
              <div className="space-y-6 animate-in slide-in-from-left duration-300">
                <div className="bg-blue-600/10 p-6 rounded-[2rem] border border-blue-500/20">
                  <p className="text-[11px] text-blue-200/70 leading-relaxed font-bold">
                    * ملاحظة: عند تغيير البريد الإلكتروني، ستحتاج لاستخدامه في المرة القادمة لتسجيل الدخول. تأكد من أن البريد الجديد صالح وتستطيع الوصول إليه.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">البريد الإلكتروني الجديد</label>
                    <input 
                      type="email" 
                      value={newAccountEmail} 
                      onChange={e => setNewAccountEmail(e.target.value)} 
                      placeholder="mail@example.com" 
                      className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-5 px-6 text-sm text-white outline-none focus:border-purple-500 transition-all shadow-inner"
                    />
                  </div>
                  <button 
                    onClick={handleUpdateEmail}
                    disabled={isUpdating}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.5rem] text-sm font-black shadow-xl active:scale-95 transition-all border border-white/10 disabled:opacity-50"
                  >
                    {isUpdating ? <i className="fas fa-spinner animate-spin"></i> : 'تأكيد وحفظ البريد الجديد'}
                  </button>
                </div>
              </div>
            )}

            {settingsView === 'password' && (
              <div className="space-y-6 animate-in slide-in-from-left duration-300">
                <div className="bg-purple-600/10 p-6 rounded-[2rem] border border-blue-500/20">
                  <p className="text-[11px] text-purple-200/70 leading-relaxed font-bold">
                    * ملاحظة: يجب أن تكون كلمة المرور قوية (6 أحرف على الأقل). سيتم تطبيق التغيير فوراً على حسابك.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      value={newAccountPassword} 
                      onChange={e => setNewAccountPassword(e.target.value)} 
                      placeholder="••••••••" 
                      className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-5 px-6 text-sm text-white outline-none focus:border-purple-500 transition-all shadow-inner"
                    />
                  </div>
                  <button 
                    onClick={handleUpdatePassword}
                    disabled={isUpdating}
                    className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-[1.5rem] text-sm font-black shadow-xl active:scale-95 transition-all border border-white/10 disabled:opacity-50"
                  >
                    {isUpdating ? <i className="fas fa-spinner animate-spin"></i> : 'تأكيد وحفظ كلمة المرور'}
                  </button>
                </div>
              </div>
            )}

            {settingsView === 'support' && (
              <div className="flex-1 flex flex-col h-full animate-in slide-in-from-left duration-300">
                <div className="flex-1 overflow-y-auto space-y-4 px-1 py-4 scrollbar-hide min-h-[300px]">
                  {supportChat.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4 mt-20">
                       <i className="fas fa-comments text-5xl"></i>
                       <p className="text-xs font-black text-center max-w-[200px]">أهلاً بك في الدعم الفني، اكتب رسالتك وسنقوم بالرد عليك في أقرب وقت.</p>
                    </div>
                  ) : supportChat.map((msg, i) => {
                    const isFromMe = msg.senderId === user?.uid;
                    return (
                      <div key={msg.id || i} className={`flex items-start gap-3 ${isFromMe ? 'flex-row-reverse' : ''} animate-in fade-in`}>
                        <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 shadow-lg bg-slate-900">
                          {isFromMe ? (
                             liveUserData?.animatedAvatar ? (
                               isVideoUrl(liveUserData.animatedAvatar) ? (
                                 <video src={liveUserData.animatedAvatar} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                               ) : <img src={liveUserData.animatedAvatar} className="w-full h-full object-cover" />
                             ) : <img src={liveUserData?.photoURL || user?.photoURL || "https://picsum.photos/100"} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white"><i className="fas fa-headset text-lg"></i></div>
                          )}
                        </div>
                        <div className={`flex flex-col ${isFromMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                          <span className="text-[9px] font-black text-white/30 mb-1">{isFromMe ? 'أنا' : 'خدمة العملاء'}</span>
                          <div className={`px-4 py-3 rounded-2xl text-[12px] font-bold shadow-xl break-words whitespace-pre-wrap ${isFromMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none border border-white/5'}`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={supportChatEndRef} />
                </div>
                
                <form onSubmit={handleSendSupportMsg} className="mt-4 pb-4">
                  <div className="relative flex items-center gap-3">
                    <div className="relative flex-1">
                      <textarea 
                        value={supportMsg} 
                        onChange={e => { if(e.target.value.length <= 250) setSupportMsg(e.target.value) }}
                        placeholder="اكتب رسالتك للدعم هنا..." 
                        className="w-full bg-white/5 border border-white/10 rounded-[1.8rem] py-4 pr-6 pl-14 text-xs text-white outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all shadow-inner h-14 resize-none"
                      />
                      <div className="absolute left-4 bottom-2.5">
                        <span className={`text-[8px] font-black ${supportMsg.length > 240 ? 'text-red-500' : 'text-white/20'}`}>{supportMsg.length}/250</span>
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={!supportMsg.trim()}
                      className="w-11 h-11 rounded-full bg-purple-600/30 backdrop-blur-md border border-purple-500/20 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-30 flex-shrink-0"
                    >
                      <i className="fas fa-paper-plane text-xs"></i>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[600] bg-[#0d051a]/95 backdrop-blur-xl flex flex-col animate-in fade-in">
          <header className="p-5 flex justify-between items-center border-b border-white/5 bg-[#1a0b2e]">
            <h3 className="text-lg font-black text-white">تعديل الملف الشخصي</h3>
            <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center border border-white/10 active:scale-95 transition-transform"><i className="fas fa-times"></i></button>
          </header>
          <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-hide">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">الاسم المستعار</label>
              <input type="text" value={newName} maxLength={15} onChange={e => setNewName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">السيرة الذاتية (Bio)</label>
              <textarea value={newBio} onChange={e => setNewBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white outline-none h-32 resize-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">البلد / المنطقة</label>
              <button
                type="button"
                onClick={() => setShowCountryPicker(true)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white flex items-center justify-between hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  {tempRegion ? (
                    <>
                      <span className="text-xl">{tempRegion.flag}</span>
                      <span className="font-bold">{tempRegion.name}</span>
                    </>
                  ) : (
                    <span className="text-white/20">اختر بلدك...</span>
                  )}
                </div>
                <i className="fas fa-chevron-left text-[10px] text-white/30"></i>
              </button>
              <p className="text-[9px] text-white/30 font-bold px-2 flex items-center gap-2">
                <i className="fas fa-info-circle text-[8px]"></i>
                يمكن تغيير الدولة مرة واحدة فقط كل 3 أيام
              </p>
            </div>
            <button onClick={handleUpdateProfileData} disabled={isUpdating} className="w-full bg-[#8c52ff]/30 backdrop-blur-sm py-4 rounded-2xl font-black text-white shadow-[0_4px_20px_rgba(140,82,255,0.15)] active:scale-95 transition-all border border-[#8c52ff]/40 hover:bg-[#8c52ff]/40">
              {isUpdating ? <i className="fas fa-spinner animate-spin"></i> : <span>حفظ التغييرات</span>}
            </button>
          </div>
        </div>
      )}

      {showCountryPicker && (
        <div className="fixed inset-0 z-[700] bg-[#1a0b2e] flex flex-col pt-12" dir="rtl">
          <div className="px-6 flex items-center justify-between mb-6">
            <button onClick={() => setShowCountryPicker(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <i className="fas fa-chevron-right text-white"></i>
            </button>
            <h3 className="text-lg font-black text-white">اختر بلدك</h3>
            <div className="w-10"></div>
          </div>

          <div className="px-6 mb-6">
            <div className="relative">
              <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-white/20"></i>
              <input 
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="ابحث عن بلد..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-xs text-white outline-none focus:border-purple-500/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-2">
            {filteredCountries.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setTempRegion(c);
                  setShowCountryPicker(false);
                }}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${tempRegion?.code === c.code ? 'bg-purple-600/20 border-purple-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{c.flag}</span>
                  <span className="font-bold text-sm text-white">{c.name}</span>
                </div>
                {tempRegion?.code === c.code && <i className="fas fa-check text-purple-400"></i>}
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="text-center py-12 text-white/40 text-xs">لا توجد نتائج للبحث</div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes frame-slow {
          0%, 100% { transform: scale(1.25) rotate(0deg); }
          50% { transform: scale(1.3) rotate(1deg); }
        }
        .animate-frame-slow { animation: frame-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
