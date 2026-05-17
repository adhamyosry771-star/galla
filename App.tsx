
import React, { useState, useEffect, useRef } from 'react';
import { Room, ChatMessage } from './types';
import { RoomCard } from './components/RoomCard';
import { VoiceRoom } from './components/VoiceRoom';
import { Login } from './components/Login';
import { SetupProfile } from './components/SetupProfile';
import { NewsPage } from './components/NewsPage';
import { MessagesPage } from './components/MessagesPage';
import { ProfilePage } from './components/ProfilePage';
import { CreateRoomModal } from './components/CreateRoomModal';
import { NotificationsPage } from './components/NotificationsPage';
import { BanModal } from './components/BanModal';
import { auth, db } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, onSnapshot, collection, query, orderBy, limit, addDoc, serverTimestamp, deleteDoc, updateDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banUntil, setBanUntil] = useState<string | null>(null);
  const [isProfileSetup, setIsProfileSetup] = useState(false);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordRoom, setPasswordRoom] = useState<Room | null>(null);
  const [joiningPassword, setJoiningPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'news' | 'messages' | 'me'>('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showHasRoomError, setShowHasRoomError] = useState(false);
  const [shouldOpenWalletOnProfile, setShouldOpenWalletOnProfile] = useState(false);
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(() => {
    return parseInt(localStorage.getItem('last_read_notifications') || '0');
  });

  const [roomMicStates, setRoomMicStates] = useState<any[]>(Array(15).fill({ status: 'open', user: null }));
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [designSettings, setDesignSettings] = useState<any>(null);
  const [defaultImages, setDefaultImages] = useState<any>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // تتبع العناصر التي تمت معالجة انتهاء صلاحيتها لمنع التكرار
  const processedExpirations = useRef<Set<string>>(new Set());

  // منطق الفقاعة العائمة
  const [bubblePos, setBubblePos] = useState({ x: window.innerWidth - 85, y: window.innerHeight - 220 });
  const isDragging = useRef(false);
  const hasMoved = useRef(false); 
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const unsubDesign = onSnapshot(doc(db, "settings", "design"), (docSnap) => {
      if (docSnap.exists()) setDesignSettings(docSnap.data());
    });
    const unsubDefaultImages = onSnapshot(doc(db, "settings", "default_images"), (snap) => {
      if (snap.exists()) setDefaultImages(snap.data());
    });
    return () => { unsubDesign(); unsubDefaultImages(); };
  }, []);

  const isVideoUrl = (url?: string | null) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/) !== null || url.includes('video');
  };

  // 1. Auth Listener (Runs once)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setLoading(true);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.banUntil) {
              const banDate = new Date(data.banUntil);
              if (banDate > new Date()) {
                setBanUntil(data.banUntil);
                setShowBanModal(true);
                await signOut(auth);
                setLoading(false);
                return;
              }
            }
          }
          setUser(currentUser);
        } catch (e) {
          console.error("Auth check error:", e);
          setUser(currentUser);
        }
      } else {
        setUser(null);
        setUserData(null);
        setIsProfileSetup(false);
        setActiveTab('home');
        setLoading(false);
      }
    });
    return unsubscribeAuth;
  }, []);

  // 2. User Data & Inventory Listener (Runs when user changes)
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribeUserDoc = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Ban check
        if (data.banUntil) {
          const banDate = new Date(data.banUntil);
          const now = new Date();
          if (banDate > now) {
            setBanUntil(data.banUntil);
            setShowBanModal(true);
            await signOut(auth);
            setLoading(false);
            return;
          }
        }

        if (user.email && data.email !== user.email) {
          updateDoc(doc(db, "users", user.uid), { email: user.email });
        }
        setUserData(data);
        // Check if profile is setup: either has a displayName in Firestore, or has a customId, or has one in Auth
        setIsProfileSetup(!!data.displayName || !!data.customId || !!user.displayName);
      } else {
        // If doc doesn't exist, check Auth profile as a fallback for external logins
        setIsProfileSetup(!!user.displayName);
      }
      setLoading(false);
    });

    const unsubscribeInventory = onSnapshot(collection(db, "users", user.uid, "inventory"), async (snap) => {
      const now = new Date();
      const userDocRef = doc(db, "users", user.uid);

      for (const itemDoc of snap.docs) {
        const item = itemDoc.data();
        const itemId = itemDoc.id;

        if (item.expiresAt && !processedExpirations.current.has(itemId)) {
          const expiration = item.expiresAt.toDate();
          if (expiration < now) {
            processedExpirations.current.add(itemId);
            const itemTypeLabel = item.type === 'frame' ? 'الإطار' : item.type === 'entry' ? 'الدخولية' : 'الخلفية';
            const itemIcon = item.type === 'frame' ? 'fa-id-badge' : item.type === 'entry' ? 'fa-door-open' : 'fa-image';

            try {
              await addDoc(collection(db, "users", user.uid, "systemNotifications"), {
                title: "انتهت صلاحية العنصر",
                desc: `تم انتهاء وقت ${itemTypeLabel} الخاص بك: "${item.name}". يمكنك التوجه للمتجر للحصول عليه مرة أخرى.`,
                icon: itemIcon,
                createdAt: serverTimestamp()
              });

              const updates: any = {};
              if (item.type === 'frame' && userData?.currentFrame === item.imageUrl) updates.currentFrame = null;
              if (item.type === 'entry' && userData?.currentEntry === item.videoUrl) updates.currentEntry = null;
              if (item.type === 'background' && (userData?.currentRoomBackground === item.imageUrl || item.isEquipped)) {
                try {
                  const publicBgsSnapshot = await getDocs(query(collection(db, "roomBackgrounds"), limit(1)));
                  if (!publicBgsSnapshot.empty) {
                    updates.currentRoomBackground = publicBgsSnapshot.docs[0].data().imageUrl;
                  } else {
                    updates.currentRoomBackground = null;
                  }
                } catch (e) {
                  updates.currentRoomBackground = null;
                }
              }

              if (Object.keys(updates).length > 0) await updateDoc(userDocRef, updates);
              await deleteDoc(itemDoc.ref);
            } catch (err) {
              console.error("Error processing expired item:", err);
              processedExpirations.current.delete(itemId);
            }
          }
        }
      }
    });

    return () => {
      unsubscribeUserDoc();
      unsubscribeInventory();
    };
  }, [user]);

  // 3. Notifications & Social Listener
  useEffect(() => {
    if (!user) return;

    const unsubscribeOfficial = onSnapshot(collection(db, "officialNotifications"), (snap) => {
      const newOfficial = snap.docs.filter(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toMillis() || 0;
        return createdAt > lastReadTimestamp;
      }).length;
      
      const unsubscribeSystem = onSnapshot(collection(db, "users", user.uid, "systemNotifications"), (sysSnap) => {
        const newSystem = sysSnap.docs.filter(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toMillis() || 0;
          return createdAt > lastReadTimestamp;
        }).length;
        setUnreadCount(newOfficial + newSystem);
      });

      return () => unsubscribeSystem();
    });

    return () => unsubscribeOfficial();
  }, [user, lastReadTimestamp]);

  // 4. Global Data Listeners (Rooms, Banners)
  useEffect(() => {
    const bannersQuery = query(collection(db, "banners"), orderBy("createdAt", "desc"), limit(5));
    const unsubscribeBanners = onSnapshot(bannersQuery, (snapshot) => {
      setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const roomsQuery = query(collection(db, "rooms"), orderBy("createdAt", "desc"), limit(20));
    const unsubscribeRooms = onSnapshot(roomsQuery, (snapshot) => {
      const fetchedRooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setRooms(fetchedRooms.reverse());
    });

    return () => {
      unsubscribeBanners();
      unsubscribeRooms();
    };
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex(prev => (prev + 1) % banners.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    const now = Date.now();
    setLastReadTimestamp(now);
    setUnreadCount(0);
    localStorage.setItem('last_read_notifications', now.toString());
  };

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    hasMoved.current = false;
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    dragOffset.current = {
      x: clientX - bubblePos.x,
      y: clientY - bubblePos.y
    };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      hasMoved.current = true;
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      
      const nextX = Math.min(Math.max(0, clientX - dragOffset.current.x), window.innerWidth - 64);
      const nextY = Math.min(Math.max(0, clientY - dragOffset.current.y), window.innerHeight - 64);
      
      setBubblePos({ x: nextX, y: nextY });
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [bubblePos]);

  const handleRoomClick = (room: Room) => {
    // If room is locked and user is not owner
    if (room.isLocked && room.owner?.uid !== user?.uid) {
      setPasswordRoom(room);
      setShowPasswordPrompt(true);
      setJoiningPassword('');
      return;
    }
    enterRoom(room);
  };

  const enterRoom = (room: Room) => {
    if (activeRoom && activeRoom.id === room.id) {
      setIsMinimized(false);
    } else {
      setRoomMicStates(Array(15).fill({ status: 'open', user: null }));
      setIsMicMuted(true);
      setRoomMessages([]); 
      setActiveRoom(room);
      setIsMinimized(false);
    }
  };

  const verifyPassword = () => {
    if (passwordRoom && joiningPassword === passwordRoom.password) {
      setShowPasswordPrompt(false);
      enterRoom(passwordRoom);
      setPasswordRoom(null);
    } else {
      alert("كلمة المرور غير صحيحة");
    }
  };

  const handleLeaveRoom = () => {
    setActiveRoom(null);
    setIsMinimized(false);
    setRoomMessages([]); // تصفير الرسائل عند الخروج النهائي
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a0b2e] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (showBanModal && banUntil) {
    return (
      <div className="min-h-screen bg-[#1a0b2e]">
        <BanModal 
          isOpen={showBanModal} 
          onClose={() => {
            setShowBanModal(false);
            setBanUntil(null);
            setUser(null);
          }} 
          banUntil={banUntil} 
        />
      </div>
    );
  }

  if (!user) return <Login onLoginSuccess={() => {}} />;
  if (!isProfileSetup) return <SetupProfile onComplete={() => setIsProfileSetup(true)} />;

  const finalUserPhoto = userData?.photoURL || defaultImages?.profileImage || user?.photoURL || "https://picsum.photos/200";

  return (
    <div className="min-h-screen pb-16 max-w-md mx-auto bg-[#1a0b2e] shadow-2xl relative overflow-hidden flex flex-col border-x border-white/5" dir="rtl">
      {activeTab === 'home' && !showNotifications && (
        <header className="px-5 py-3 flex justify-between items-center sticky top-0 z-10 bg-[#1a0b2e]/90 backdrop-blur-md">
          <h1 className="text-lg font-black tracking-tighter bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Yalla Games</h1>
          <div className="flex gap-2">
            <button 
              onClick={handleOpenNotifications}
              className="w-8 h-8 relative bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white active:scale-90 transition-all"
            >
              <i className="fas fa-bell text-xs"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 bg-red-500/90 rounded-full border border-[#1a0b2e] flex items-center justify-center text-[8px] font-black text-white shadow-sm pointer-events-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <div 
              className="w-8 h-8 rounded-full border border-purple-500/50 p-0.5 overflow-hidden cursor-pointer shadow-lg active:scale-90 transition-transform bg-white/5" 
              onClick={() => setActiveTab('me')}
            >
              {userData?.animatedAvatar ? (
                isVideoUrl(userData.animatedAvatar) ? (
                  <video src={userData.animatedAvatar} autoPlay loop muted playsInline className="w-full h-full rounded-full object-cover" />
                ) : (
                  <img src={userData.animatedAvatar} className="w-full h-full rounded-full object-cover" alt="My Profile" />
                )
              ) : (
                <img 
                  src={finalUserPhoto} 
                  className="w-full h-full rounded-full object-cover" 
                  alt="My Profile" 
                  loading="eager"
                />
              )}
            </div>
          </div>
        </header>
      )}

      {showNotifications ? (
        <NotificationsPage onBack={() => setShowNotifications(false)} />
      ) : (
        <>
          {activeTab === 'home' && (
            <main className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
              {/* تم تقليل حواف البنر من rounded-[2.5rem] إلى rounded-2xl */}
              <div className="w-full h-32 rounded-2xl overflow-hidden relative shadow-2xl border border-white/5 bg-white/5">
                {banners.length > 0 ? banners.map((banner, index) => (
                  <div key={banner.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBannerIndex ? 'opacity-100' : 'opacity-0'}`}>
                    <img src={banner.imageUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a0b2e]/90 via-transparent to-transparent p-5 flex flex-col justify-end"><h4 className="font-black text-sm text-white">{banner.title}</h4></div>
                  </div>
                )) : <div className="h-full flex items-center justify-center opacity-20"><i className="fas fa-images"></i></div>}
              </div>
              <section>
                <h2 className="text-base font-black text-white mb-3">غرف صوتية</h2>
                <div className="grid grid-cols-2 gap-3">
                  {rooms.map(room => (
                    <RoomCard key={room.id} room={room} design={designSettings} onClick={handleRoomClick} />
                  ))}
                </div>
              </section>
            </main>
          )}

          {activeTab === 'news' && <NewsPage />}
          {activeTab === 'messages' && <MessagesPage />}
          {activeTab === 'me' && <ProfilePage initialUserData={userData} forceOpenWallet={shouldOpenWalletOnProfile} onWalletOpened={() => setShouldOpenWalletOnProfile(false)} />}
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-[#0d051a]/98 backdrop-blur-xl border-t border-white/5 flex justify-around items-center px-2 z-50 rounded-t-3xl">
        <button onClick={() => { setActiveTab('home'); setShowNotifications(false); }} className={`flex flex-col items-center gap-0.5 ${activeTab === 'home' && !showNotifications ? 'text-purple-400' : 'text-purple-300/30'}`}><i className="fas fa-home text-sm"></i><span className="text-[8px] font-black uppercase">الرئيسية</span></button>
        <button onClick={() => { setActiveTab('news'); setShowNotifications(false); }} className={`flex flex-col items-center gap-0.5 ${activeTab === 'news' ? 'text-purple-400' : 'text-purple-300/30'}`}><i className="fas fa-newspaper text-sm"></i><span className="text-[8px] font-black uppercase">أخبار</span></button>
        <div className="relative -top-3 flex flex-col items-center gap-1">
          <button 
            onClick={() => {
              const userHasRoom = rooms.some(r => r.owner?.uid === user?.uid);
              if (userHasRoom) {
                setShowHasRoomError(true);
              } else {
                setIsCreateModalOpen(true);
              }
            }} 
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg flex items-center justify-center text-lg active:scale-90 transition-transform text-white"
          >
            <i className="fas fa-plus"></i>
          </button>
          <span className="text-[8px] font-black uppercase text-purple-300/60">إنشاء</span>
        </div>
        <button onClick={() => { setActiveTab('messages'); setShowNotifications(false); }} className={`flex flex-col items-center gap-0.5 ${activeTab === 'messages' ? 'text-purple-400' : 'text-purple-300/30'}`}><i className="fas fa-comment-dots text-sm"></i><span className="text-[8px] font-black uppercase">رسائل</span></button>
        <button onClick={() => { setActiveTab('me'); setShowNotifications(false); }} className={`flex flex-col items-center gap-0.5 ${activeTab === 'me' ? 'text-purple-400' : 'text-purple-300/30'}`}><i className="fas fa-user text-sm"></i><span className="text-[8px] font-black uppercase">أنا</span></button>
      </nav>

      {isMinimized && activeRoom && (
        <div 
          className="fixed z-[300] flex flex-col items-start gap-1 touch-none group"
          style={{ left: bubblePos.x, top: bubblePos.y }}
        >
          {/* زر إغلاق شفاف فوق الفقاعة مباشرة */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleLeaveRoom();
            }}
            className="w-6 h-6 bg-black/30 backdrop-blur-md text-white/80 rounded-full flex items-center justify-center shadow-lg active:scale-75 transition-all z-[310] border border-white/10 hover:bg-red-500/50"
          >
            <i className="fas fa-times text-[10px]"></i>
          </button>
          
          <div 
            onMouseDown={onMouseDown}
            onTouchStart={onMouseDown}
            onClick={() => {
              if (!hasMoved.current) setIsMinimized(false);
            }}
            className="w-16 h-16 rounded-full border-[3px] border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-move overflow-hidden bg-[#1a0b2e] active:scale-95 transition-all animate-slow-rotate relative"
          >
            <img src={activeRoom.coverImage} className="w-full h-full object-cover pointer-events-none select-none" alt="minimized" />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent pointer-events-none"></div>
          </div>
        </div>
      )}

      <CreateRoomModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      
      <AnimatePresence>
        {showHasRoomError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowHasRoomError(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a0b2e]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 w-full max-w-[300px] text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl"></i>
              </div>
              <h4 className="text-white font-black text-sm mb-2">تنبيه</h4>
              <p className="text-white/60 text-[11px] leading-relaxed mb-6 font-bold">عذراً لديك غرفة بالفعل</p>
              <button 
                onClick={() => setShowHasRoomError(false)}
                className="w-full py-3 bg-purple-600 text-white text-xs font-black rounded-xl active:scale-95 transition-transform"
              >
                فهمت ذلك
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showPasswordPrompt && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in" dir="rtl">
          <div className="w-full max-w-[320px] bg-[#2d0f4d]/90 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <header className="p-5 flex justify-between items-center border-b border-white/5">
              <h3 className="text-white font-black text-sm">هذه الغرفة مغلقة</h3>
              <button onClick={() => setShowPasswordPrompt(false)} className="text-white/40 hover:text-white transition-colors">
                <i className="fas fa-times text-xs"></i>
              </button>
            </header>
            
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden shadow-lg border border-white/10">
                  <img src={passwordRoom?.coverImage} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-white font-black text-xs">{passwordRoom?.title}</h4>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest pl-2">أدخل كلمة المرور</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={joiningPassword}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length <= 6) setJoiningPassword(val);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-sm font-black text-white outline-none focus:border-purple-500/40 transition-all shadow-inner tracking-[0.5em]"
                  placeholder="••••••"
                />
              </div>

              <button 
                onClick={verifyPassword}
                disabled={joiningPassword.length !== 6}
                className="w-full bg-purple-600/20 border border-purple-500/40 backdrop-blur-md py-4 rounded-2xl font-black text-[11px] text-white shadow-xl active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-door-open"></i>
                <span>دخول الغرفة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* تعديل هنا: الغرفة تبقى نشطة في الـ DOM ولكنها تختفي عند التصغير للحفاظ على حالتها وعدم تكرار الترحيب */}
      {activeRoom && (
        <div className={isMinimized ? "hidden" : "contents"}>
          <VoiceRoom 
            key={activeRoom.id}
            room={activeRoom as any} 
            onLeave={handleLeaveRoom} 
            onMinimize={() => setIsMinimized(true)}
            onOpenWallet={() => { setActiveTab('me'); setIsMinimized(false); setShouldOpenWalletOnProfile(true); handleLeaveRoom(); }}
            micStates={roomMicStates}
            setMicStates={setRoomMicStates}
            isMicMuted={isMicMuted}
            setIsMicMuted={setIsMicMuted}
            messages={roomMessages}
            setMessages={setRoomMessages}
          />
        </div>
      )}

      <style>{`
        @keyframes slowRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-slow-rotate {
          animation: slowRotate 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
