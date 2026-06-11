
import React, { useState, useEffect, useRef } from 'react';
import { Room, ChatMessage } from './types';
import { RoomCard } from './components/RoomCard';
import { VoiceRoom } from './components/VoiceRoom';
import { Login } from './components/Login';
import { registerBackAction } from './backButtonManager';
import { SetupProfile } from './components/SetupProfile';
import { NewsPage } from './components/NewsPage';
import { MessagesPage } from './components/MessagesPage';
import { ProfilePage } from './components/ProfilePage';
import { CreateRoomModal } from './components/CreateRoomModal';
import { NotificationsPage } from './components/NotificationsPage';
import { BanModal } from './components/BanModal';
import { RoomBanModal } from './components/RoomBanModal';
import { CarnivalEventPage } from './components/CarnivalEventPage';
// @ts-ignore
import carnivalBannerUrl from './src/assets/images/carnival_banner_1780918603249.png';
import { auth, db } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, onSnapshot, collection, query, orderBy, limit, addDoc, serverTimestamp, deleteDoc, updateDoc, getDocs, getDoc, deleteField, where, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { useLanguage } from './LanguageContext';

const getDeviceId = () => {
  let devId = localStorage.getItem('yalla_device_id');
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('yalla_device_id', devId);
  }
  return devId;
};

const App: React.FC = () => {
  const { language, t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRoomBanModal, setShowRoomBanModal] = useState(false);
  const [kickedRoomName, setKickedRoomName] = useState("");
  const [banUntil, setBanUntil] = useState<string | null>(null);
  const [deviceBanUntil, setDeviceBanUntil] = useState<string | null>(null);
  const [isProfileSetup, setIsProfileSetup] = useState(false);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordRoom, setPasswordRoom] = useState<Room | null>(null);
  const [joiningPassword, setJoiningPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'news' | 'messages' | 'me'>('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCarnivalPage, setShowCarnivalPage] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showHasRoomError, setShowHasRoomError] = useState(false);
  const [shouldOpenWalletOnProfile, setShouldOpenWalletOnProfile] = useState(false);
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadPrivateCount, setUnreadPrivateCount] = useState(0);
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
  const [carnivalSettings, setCarnivalSettings] = useState<any>(null);
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
    const unsubCarnival = onSnapshot(doc(db, "settings", "carnival"), (snap) => {
      if (snap.exists()) setCarnivalSettings(snap.data());
    });

    // منع النسخ والقص وتحديد النصوص بشكل كامل لجميع عناصر التطبيق
    const handlePreventCopy = (e: ClipboardEvent) => {
      if (auth.currentUser?.email === 'admin@yalla.com') return;
      e.preventDefault();
    };
    const handlePreventSelect = (e: Event) => {
      if (auth.currentUser?.email === 'admin@yalla.com') return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
    };

    // منع زر الفأرة الأيمن والضغط المطول بالكامل لمنع حفظ أو تحميل الصور والملفات
    const handleContextMenu = (e: MouseEvent) => {
      if (auth.currentUser?.email === 'admin@yalla.com') return;
      e.preventDefault();
    };

    // منع سحب الصور تماما لمنع تصفحها أو تحميلها
    const handleDragStart = (e: DragEvent) => {
      if (auth.currentUser?.email === 'admin@yalla.com') return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'IMG' || target.tagName === 'IMAGE' || target.tagName === 'svg' || target.style.backgroundImage)) {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handlePreventCopy);
    document.addEventListener('cut', handlePreventCopy);
    document.addEventListener('selectstart', handlePreventSelect);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      unsubDesign();
      unsubDefaultImages();
      unsubCarnival();
      document.removeEventListener('copy', handlePreventCopy);
      document.removeEventListener('cut', handlePreventCopy);
      document.removeEventListener('selectstart', handlePreventSelect);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  useEffect(() => {
    if (user?.email === 'admin@yalla.com') {
      document.body.classList.add('admin-user');
    } else {
      document.body.classList.remove('admin-user');
    }
  }, [user]);

  const isVideoUrl = (url?: string | null) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/) !== null || url.includes('video');
  };

  // Real-time listener for current device ban
  useEffect(() => {
    const devId = getDeviceId();
    const unsub = onSnapshot(doc(db, "bannedDevices", devId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.banUntil) {
          const banDate = new Date(data.banUntil);
          if (banDate > new Date()) {
            setDeviceBanUntil(data.banUntil);
            setBanUntil(data.banUntil);
            setShowBanModal(true);
            signOut(auth).catch(console.error);
            return;
          }
        }
      }
      setDeviceBanUntil(null);
    });
    return () => unsub();
  }, []);

  // 1. Auth Listener (Runs once)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      const devId = getDeviceId();
      setLoading(true);
      
      // Device Ban check
      try {
        const devSnap = await getDoc(doc(db, "bannedDevices", devId));
        if (devSnap.exists()) {
          const devData = devSnap.data();
          if (devData.banUntil) {
            const banDate = new Date(devData.banUntil);
            if (banDate > new Date()) {
              setBanUntil(devData.banUntil);
              setDeviceBanUntil(devData.banUntil);
              setShowBanModal(true);
              await signOut(auth);
              setLoading(false);
              return;
            }
          }
        }
      } catch (devError) {
        console.error("Device ban check error:", devError);
      }

      if (currentUser) {
        try {
          // Store deviceId on successful check
          await setDoc(doc(db, "users", currentUser.uid), { deviceId: devId }, { merge: true });

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

        // Self-healing: shrink document if size approaches Firestore 1MB limits to prevent Quota Exceeded errors
        try {
          const docString = JSON.stringify(data);
          if (docString.length > 700000) { // More than 700KB (strict limit is 1MB)
            console.warn("User document size is extremely large: " + docString.length + " bytes. Pruning base64 fields to prevent Firestore limit crash!");
            const prunes: any = {};
            if (data.headerURL && data.headerURL.startsWith("data:")) {
              prunes.headerURL = deleteField();
            }
            if (data.animatedAvatar && data.animatedAvatar.startsWith("data:")) {
              prunes.animatedAvatar = deleteField();
            }
            if (docString.length > 900000) {
              // Extremely critical size, prune photoURL if it's base64, replacing it with a lighter random image
              if (data.photoURL && data.photoURL.startsWith("data:")) {
                prunes.photoURL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231a0b2e'/><circle cx='50' cy='35' r='20' fill='%23ffffff' fill-opacity='0.3'/><path d='M25 80c0-15 10-25 25-25s25 10 25 25' fill='%23ffffff' fill-opacity='0.3'/></svg>";
              }
            }
            if (Object.keys(prunes).length > 0) {
              await updateDoc(doc(db, "users", user.uid), prunes);
              alert(t("تنبيه: تم تحسين مساحة التخزين لملفك الشخصي بنجاح لمنع توقف الحساب متجاوز الحد الأقصى.", "Warning: Your profile storage has been optimized to prevent account suspension. Massive images were removed."));
            }
          }
        } catch (shrinkErr) {
          console.error("Error running user self-healing shrink scheme:", shrinkErr);
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
            const itemTypeLabel = item.type === 'frame' ? t('الإطار', 'Frame') : item.type === 'entry' ? t('الدخولية', 'Entrance') : t('الخلفية', 'Background');
            const itemIcon = item.type === 'frame' ? 'fa-id-badge' : item.type === 'entry' ? 'fa-door-open' : 'fa-image';

            try {
              await addDoc(collection(db, "users", user.uid, "systemNotifications"), {
                title: t("انتهت صلاحية العنصر", "Item Expired"),
                desc: language === 'ar' 
                  ? `تم انتهاء وقت ${itemTypeLabel} الخاص بك: "${item.name}". يمكنك التوجه للمتجر للحصول عليه مرة أخرى.`
                  : `Your ${itemTypeLabel} has expired: "${item.name}". You can head to the store to get it again.`,
                icon: itemIcon,
                createdAt: serverTimestamp()
              });

              const updates: any = {};
              if (item.type === 'frame' && userData?.currentFrame === item.imageUrl) updates.currentFrame = null;
              if (item.type === 'entry' && userData?.currentEntry === item.videoUrl) updates.currentEntry = null;
              if (item.type === 'background') {
                try {
                  const publicBgsSnapshot = await getDocs(query(collection(db, "roomBackgrounds"), limit(1)));
                  const defaultBgUrl = !publicBgsSnapshot.empty ? publicBgsSnapshot.docs[0].data().imageUrl : null;
                  
                  if (userData?.currentRoomBackground === item.imageUrl || item.isEquipped) {
                    updates.currentRoomBackground = defaultBgUrl;
                  }

                  // Also proactively find all rooms owned by the user and update if utilizing this background
                  const roomsSnap = await getDocs(query(
                    collection(db, "rooms"),
                    where("owner.uid", "==", user.uid)
                  ));
                  for (const roomDoc of roomsSnap.docs) {
                    const rData = roomDoc.data();
                    if (rData.roomBackground === item.imageUrl) {
                      await updateDoc(roomDoc.ref, {
                        roomBackground: defaultBgUrl
                      });
                    }
                  }
                } catch (e) {
                  console.error("Error resetting room backgrounds in expiration check:", e);
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
        const createdAt = typeof data.createdAt?.toMillis === 'function'
          ? data.createdAt.toMillis()
          : (data.createdAt ? new Date(data.createdAt).getTime() : 0);
        return createdAt > lastReadTimestamp;
      }).length;
      
      const unsubscribeSystem = onSnapshot(collection(db, "users", user.uid, "systemNotifications"), (sysSnap) => {
        const newSystem = sysSnap.docs.filter(doc => {
          const data = doc.data();
          const createdAt = typeof data.createdAt?.toMillis === 'function'
            ? data.createdAt.toMillis()
            : (data.createdAt ? new Date(data.createdAt).getTime() : 0);
          return createdAt > lastReadTimestamp;
        }).length;
        setUnreadCount(newOfficial + newSystem);
      });

      return () => unsubscribeSystem();
    });

    return () => unsubscribeOfficial();
  }, [user, lastReadTimestamp]);

  // Listen for unread private messages
  useEffect(() => {
    if (!user) {
      setUnreadPrivateCount(0);
      return;
    }
    const chatsRef = collection(db, "privateChats");
    const q = query(chatsRef, where("participants", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      let sum = 0;
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const unreadMsgCount = data[`unread_${user.uid}`] || 0;
        sum += unreadMsgCount;
      });
      setUnreadPrivateCount(sum);
    }, (err) => {
      console.error("Error listening for unread private chats:", err);
    });
    return () => unsub();
  }, [user]);

  // 4. Global Data Listeners (Rooms, Banners)
  useEffect(() => {
    const bannersQuery = query(collection(db, "banners"), orderBy("createdAt", "desc"), limit(5));
    const unsubscribeBanners = onSnapshot(bannersQuery, (snapshot) => {
      const dbBanners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const carnivalBannerItem = {
        id: 'carnival_event',
        title: language === 'ar' ? 'مكافأة كرنفال الافتتاح 🎪 احصل على 10 مليون عملة مجاناً!' : 'Opening Carnival Reward 🎪 Get 10,000,000 Free Coins!',
        imageUrl: carnivalSettings?.bannerUrl || carnivalBannerUrl,
        isEvent: true
      };
      setBanners([carnivalBannerItem, ...dbBanners]);
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
  }, [language, carnivalSettings]);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex(prev => (prev + 1) % banners.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  // Back key event interceptors for App-level state
  useEffect(() => {
    if (showCarnivalPage) {
      return registerBackAction(() => {
        setShowCarnivalPage(false);
        return true;
      });
    }
  }, [showCarnivalPage]);

  useEffect(() => {
    if (showNotifications) {
      return registerBackAction(() => {
        setShowNotifications(false);
        return true;
      });
    }
  }, [showNotifications]);

  useEffect(() => {
    if (isCreateModalOpen) {
      return registerBackAction(() => {
        setIsCreateModalOpen(false);
        return true;
      });
    }
  }, [isCreateModalOpen]);

  useEffect(() => {
    if (showPasswordPrompt) {
      return registerBackAction(() => {
        setShowPasswordPrompt(false);
        setPasswordRoom(null);
        return true;
      });
    }
  }, [showPasswordPrompt]);

  useEffect(() => {
    if (showHasRoomError) {
      return registerBackAction(() => {
        setShowHasRoomError(false);
        return true;
      });
    }
  }, [showHasRoomError]);

  useEffect(() => {
    if (activeTab !== 'home' && !showNotifications) {
      return registerBackAction(() => {
        setActiveTab('home');
        return true;
      });
    }
  }, [activeTab, showNotifications]);

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
    // Check if user is banned from this room
    if (room.bannedUsers && user?.uid && room.bannedUsers.includes(user.uid)) {
      setKickedRoomName(room.title || room.name || t("الغرفة", "the room"));
      setShowRoomBanModal(true);
      return;
    }

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
      alert(t("كلمة المرور غير صحيحة", "Incorrect Password"));
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

  const finalUserPhoto = userData?.photoURL || defaultImages?.profileImage || user?.photoURL || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231a0b2e'/><circle cx='50' cy='35' r='20' fill='%23ffffff' fill-opacity='0.3'/><path d='M25 80c0-15 10-25 25-25s25 10 25 25' fill='%23ffffff' fill-opacity='0.3'/></svg>";

  return (
    <div className={`min-h-screen max-w-md mx-auto bg-[#1a0b2e] shadow-2xl relative overflow-hidden flex flex-col border-x border-white/5 ${(!showNotifications && !showCarnivalPage) ? 'pb-16' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {activeTab === 'home' && !showNotifications && !showCarnivalPage && (
        <header className="px-5 py-3 flex justify-between items-center sticky top-0 z-10 bg-[#1a0b2e]/90 backdrop-blur-md">
          <h1 className="text-lg font-black tracking-tighter bg-gradient-to-r from-purple-400 via-pink-500 via-fuchsia-500 to-purple-400 bg-clip-text text-transparent animate-gradient-x">Yalla Party</h1>
          <div className="flex gap-2">
            <button 
              className="w-8 h-8 relative bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-white active:scale-90 transition-all"
              onClick={() => {}}
            >
              <i className="fas fa-search text-xs"></i>
            </button>
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
      ) : showCarnivalPage ? (
        <CarnivalEventPage onBack={() => setShowCarnivalPage(false)} userData={userData} carnivalSettings={carnivalSettings} />
      ) : (
        <>
          {activeTab === 'home' && (
            <main className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
              {/* تم تقليل حواف البنر من rounded-[2.5rem] إلى rounded-2xl */}
              <div className="w-full h-32 rounded-2xl overflow-hidden relative shadow-2xl border border-white/5 bg-white/5">
                {banners.length > 0 ? banners.map((banner, index) => (
                  <div 
                    key={banner.id} 
                    onClick={() => {
                      if (banner.isEvent) {
                        setShowCarnivalPage(true);
                      }
                    }}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBannerIndex ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} ${banner.isEvent ? 'cursor-pointer' : ''}`}
                  >
                    <img src={banner.imageUrl} className="w-full h-full object-cover" />
                    {!banner.isEvent && (
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0b2e]/90 via-transparent to-transparent p-5 flex flex-col justify-end">
                        <h4 className="font-black text-sm text-white text-shadow-sm">{banner.title}</h4>
                      </div>
                    )}
                  </div>
                )) : <div className="h-full flex items-center justify-center opacity-20"><i className="fas fa-images"></i></div>}
              </div>
              <section>
                <h2 className="text-base font-black text-white mb-3">{t("غرف صوتية", "Voice Rooms")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {rooms.map(room => (
                    <RoomCard key={room.id} room={room} design={designSettings} onClick={handleRoomClick} />
                  ))}
                </div>
              </section>
            </main>
          )}

          {activeTab === 'news' && <NewsPage />}
          {activeTab === 'messages' && <MessagesPage db={db} user={user} currentUserData={userData} defaultImages={defaultImages} />}
          {activeTab === 'me' && <ProfilePage initialUserData={userData} forceOpenWallet={shouldOpenWalletOnProfile} onWalletOpened={() => setShouldOpenWalletOnProfile(false)} />}
        </>
      )}

      {!showNotifications && !showCarnivalPage && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 bg-[#0d051a]/98 backdrop-blur-xl border-t border-white/5 flex justify-around items-center px-2 z-50 rounded-t-3xl">
          <button onClick={() => { setActiveTab('home'); setShowNotifications(false); }} className={`flex flex-col items-center gap-0.5 ${activeTab === 'home' && !showNotifications ? 'text-purple-400' : 'text-purple-300/30'}`}><i className="fas fa-home text-sm"></i><span className="text-[8px] font-black uppercase">{t("الرئيسية", "Home")}</span></button>
          <button onClick={() => { setActiveTab('news'); setShowNotifications(false); }} className={`flex flex-col items-center gap-0.5 ${activeTab === 'news' ? 'text-purple-400' : 'text-purple-300/30'}`}><i className="fas fa-newspaper text-sm"></i><span className="text-[8px] font-black uppercase">{t("أخبار", "News")}</span></button>
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
            <span className="text-[8px] font-black uppercase text-purple-300/60">{t("إنشاء", "Create")}</span>
          </div>
          <button 
            onClick={() => { setActiveTab('messages'); setShowNotifications(false); }} 
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'messages' ? 'text-purple-400' : 'text-purple-300/30'}`}
          >
            <div className="relative">
              <i className="fas fa-comment-dots text-sm"></i>
              {unreadPrivateCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#0d051a]">
                  {unreadPrivateCount}
                </span>
              )}
            </div>
            <span className="text-[8px] font-black uppercase">{t("رسائل", "Messages")}</span>
          </button>
          <button onClick={() => { setActiveTab('me'); setShowNotifications(false); }} className={`flex flex-col items-center gap-0.5 ${activeTab === 'me' ? 'text-purple-400' : 'text-purple-300/30'}`}><i className="fas fa-user text-sm"></i><span className="text-[8px] font-black uppercase">{t("أنا", "Me")}</span></button>
        </nav>
      )}

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
              <h4 className="text-white font-black text-sm mb-2">{t("تنبيه", "Warning")}</h4>
              <p className="text-white/60 text-[11px] leading-relaxed mb-6 font-bold">{t("عذراً لديك غرفة بالفعل", "Sorry, you already have a room")}</p>
              <button 
                onClick={() => setShowHasRoomError(false)}
                className="w-full py-3 bg-purple-600 text-white text-xs font-black rounded-xl active:scale-95 transition-transform"
              >
                {t("فهمت ذلك", "I understand")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showPasswordPrompt && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="w-full max-w-[320px] bg-[#2d0f4d]/90 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <header className="p-5 flex justify-between items-center border-b border-white/5">
              <h3 className="text-white font-black text-sm">{t("هذه الغرفة مغلقة", "This room is locked")}</h3>
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
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest pl-2">{t("أدخل كلمة المرور", "Enter Password")}</label>
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
                <span>{t("دخول الغرفة", "Enter Room")}</span>
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
            onKicked={(roomName) => {
              setKickedRoomName(roomName);
              setShowRoomBanModal(true);
            }}
            onMinimize={() => setIsMinimized(true)}
            onOpenWallet={() => { setActiveTab('me'); setIsMinimized(false); setShouldOpenWalletOnProfile(true); handleLeaveRoom(); }}
            onOpenChat={(otherUid: string) => {
              setActiveTab('messages');
              setIsMinimized(false);
              localStorage.setItem("autoOpenChatWith", otherUid);
              window.dispatchEvent(new CustomEvent("triggerAutoOpenChat", { detail: otherUid }));
            }}
            micStates={roomMicStates}
            setMicStates={setRoomMicStates}
            isMicMuted={isMicMuted}
            setIsMicMuted={setIsMicMuted}
            messages={roomMessages}
            setMessages={setRoomMessages}
            isMinimized={isMinimized}
          />
        </div>
      )}



      <RoomBanModal 
        isOpen={showRoomBanModal} 
        onClose={() => setShowRoomBanModal(false)} 
        roomName={kickedRoomName} 
      />

      <style>{`
        @keyframes slowRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-slow-rotate {
          animation: slowRotate 8s linear infinite;
        }
        @keyframes gradientX {
          0% { background-position: 200% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradientX 4s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
