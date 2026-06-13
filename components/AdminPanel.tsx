
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { 
  doc, updateDoc, collection, query, limit, deleteDoc, addDoc, 
  serverTimestamp, orderBy, onSnapshot, setDoc, deleteField,
  collectionGroup, where, getDocs, getDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import CPAdmin from './CPAdmin';

import { useLanguage } from '../LanguageContext';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isOfficialAdmin: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, isOfficialAdmin }) => {
  const { language, t } = useLanguage();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchId, setSearchId] = useState('');
  const [allBanners, setAllBanners] = useState<any[]>([]);
  const [allRoomBgs, setAllRoomBgs] = useState<any[]>([]);
  const [allNews, setAllNews] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [allOfficialMsgs, setAllOfficialMsgs] = useState<any[]>([]);
  const [allEmojis, setAllEmojis] = useState<any[]>([]);
  const [allGifts, setAllGifts] = useState<any[]>([]);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [defaultProfileImage, setDefaultProfileImage] = useState<string | null>(null);
  const [defaultCoverImage, setDefaultCoverImage] = useState<string | null>(null);

  const [adminTab, setAdminTab] = useState<'users' | 'news' | 'banners' | 'bgs' | 'rooms' | 'design' | 'messages' | 'store' | 'emojis' | 'gifts' | 'support' | 'cp' | 'fruits' | 'reports' | 'mainImages' | 'agencyDesign' | 'carnival'>('users');
  
  // Carnival Opening Event states
  const [carnivalBannerUrlSetting, setCarnivalBannerUrlSetting] = useState('');
  const [carnivalBgUrl, setCarnivalBgUrl] = useState('');
  const [isCarnivalSaving, setIsCarnivalSaving] = useState(false);
  const [carnivalSettings, setCarnivalSettings] = useState<any>(null);
  const [carnivalCodes, setCarnivalCodes] = useState<any[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');

  // Agency Design States
  const [agencyBackgroundUrl, setAgencyBackgroundUrl] = useState('');
  const [isAgencyDesignSaving, setIsAgencyDesignSaving] = useState(false);
  const [fruitsGlobalSettings, setFruitsGlobalSettings] = useState<any>({
    lossThreshold: 10000000,
    globalDifficulty: 'balanced', // 'easy', 'balanced', 'hard'
    totalProfit24h: 0,
    totalRounds: 0
  });
  const [fruitsActiveBets, setFruitsActiveBets] = useState<any[]>([]);
  const [fruitsPlayers, setFruitsPlayers] = useState<any[]>([]);
  const [fruitsSearchQuery, setFruitsSearchQuery] = useState('');
  
  const [showChargePopup, setShowChargePopup] = useState<string | null>(null);
  const [showDeductPopup, setShowDeductPopup] = useState<string | null>(null);
  const [showIdPopup, setShowIdPopup] = useState<string | null>(null);
  const [showGrantPopup, setShowGrantPopup] = useState<string | null>(null);
  const [showGrantAnimatedPopup, setShowGrantAnimatedPopup] = useState<string | null>(null);
  const [showBadgesPopup, setShowBadgesPopup] = useState<string | null>(null);
  const [showRoomCoverPopup, setShowRoomCoverPopup] = useState<string | null>(null);

  const [userInventory, setUserInventory] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  
  const [chargeAmount, setChargeAmount] = useState('');
  const [deductAmount, setDeductAmount] = useState('');
  
  const [newCustomId, setNewCustomId] = useState('');
  const [newCustomIdIcon, setNewCustomIdIcon] = useState<string | null>(null);
  const [idOffsetX, setIdOffsetX] = useState(28); 
  const [idOffsetY, setIdOffsetY] = useState(0.5); 
  const [idFontSize, setIdFontSize] = useState(11); 

  // Coordinates split states
  const [activeIdTab, setActiveIdTab] = useState<'profile' | 'room'>('profile');
  const [profileIdOffsetX, setProfileIdOffsetX] = useState(28);
  const [profileIdOffsetY, setProfileIdOffsetY] = useState(0.5);
  const [profileIdFontSize, setProfileIdFontSize] = useState(11);
  const [roomIdOffsetX, setRoomIdOffsetX] = useState(28);
  const [roomIdOffsetY, setRoomIdOffsetY] = useState(0.5);
  const [roomIdFontSize, setRoomIdFontSize] = useState(11); 

  const [badgeUrl, setBadgeUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const [msgTitle, setMsgTitle] = useState('');
  const [msgDesc, setMsgDesc] = useState('');
  const [msgImage, setMsgImage] = useState<string | null>(null);

  const [newsTitle, setNewsTitle] = useState('');
  const [newsDesc, setNewsDesc] = useState('');
  const [newsImage, setNewsImage] = useState<string | null>(null);
  
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  const [roomBgImage, setRoomBgImage] = useState<string | null>(null);
  const [loginBgImage, setLoginBgImage] = useState<string | null>(null);
  const [loginLogoImage, setLoginLogoImage] = useState<string | null>(null);

  const [micOpenIcon, setMicOpenIcon] = useState<string | null>(null);
  const [micLockedIcon, setMicLockedIcon] = useState<string | null>(null);
  const [waveRoomIcon, setWaveRoomIcon] = useState<string | null>(null);
  const [giftButtonIcon, setGiftButtonIcon] = useState<string | null>(null);

  const [emojiUrl, setEmojiUrl] = useState('');

  // Gift States
  const [giftName, setGiftName] = useState('');
  const [giftPrice, setGiftPrice] = useState('');
  const [giftIcon, setGiftIcon] = useState('');
  const [giftAnimation, setGiftAnimation] = useState('');
  const [giftCategory, setGiftCategory] = useState('normal');

  // Grant States
  const [grantType, setGrantType] = useState<'frame' | 'entry' | 'background'>('frame');
  const [grantName, setGrantName] = useState('');
  const [grantUrl, setGrantUrl] = useState('');
  const [grantPreview, setGrantPreview] = useState<string | null>(null);
  const [grantDuration, setGrantDuration] = useState('7');

  // Grant Animated Avatar States
  const [animatedUrl, setAnimatedUrl] = useState('');

  // Room Cover State
  const [animatedRoomCoverUrl, setAnimatedRoomCoverUrl] = useState('');

  const [storeSection, setStoreSection] = useState<'frames' | 'entries' | 'backgrounds'>('frames');
  
  const [frameName, setFrameName] = useState('');
  const [frameUrl, setFrameUrl] = useState('');
  const [framePrice, setFramePrice] = useState('');
  const [frameDuration, setFrameDuration] = useState('7');
  const [storeFrames, setStoreFrames] = useState<any[]>([]);

  const [entryName, setEntryName] = useState('');
  const [entryVideoUrl, setEntryVideoUrl] = useState('');
  const [entryPreviewImage, setEntryPreviewImage] = useState<string | null>(null);
  const [entryPrice, setEntryPrice] = useState('');
  const [entryDuration, setEntryDuration] = useState('7');
  const [storeEntries, setStoreEntries] = useState<any[]>([]);

  const [storeBgName, setStoreBgName] = useState('');
  const [storeBgImage, setStoreBgImage] = useState<string | null>(null);
  const [storeBgPrice, setStoreBgPrice] = useState('');
  const [storeBgDuration, setStoreBgDuration] = useState('7');
  const [storeBackgrounds, setStoreBackgrounds] = useState<any[]>([]);
  const [fruitsGameIcon, setFruitsGameIcon] = useState<string | null>(null);

  // Support State
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [selectedSupportChatId, setSelectedSupportChatId] = useState<string | null>(null);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [adminSupportReply, setAdminSupportReply] = useState('');
  const adminSupportScrollRef = useRef<HTMLDivElement>(null);

  const newsInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const roomBgInputRef = useRef<HTMLInputElement>(null);
  const loginBgInputRef = useRef<HTMLInputElement>(null);
  const loginLogoInputRef = useRef<HTMLInputElement>(null);
  const entryPreviewInputRef = useRef<HTMLInputElement>(null);
  const storeBgInputRef = useRef<HTMLInputElement>(null);
  const grantPreviewInputRef = useRef<HTMLInputElement>(null);

  // Added missing refs
  const micOpenInputRef = useRef<HTMLInputElement>(null);
  const micLockedInputRef = useRef<HTMLInputElement>(null);
  const waveRoomInputRef = useRef<HTMLInputElement>(null);
  const giftButtonInputRef = useRef<HTMLInputElement>(null);
  const msgImageRef = useRef<HTMLInputElement>(null);
  const idIconInputRef = useRef<HTMLInputElement>(null);
  const fruitsGameIconInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsubUsers = onSnapshot(query(collection(db, "users"), limit(500)), (snap) => {
      setAllUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubNews = onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc")), (snap) => {
      setAllNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubBanners = onSnapshot(query(collection(db, "banners"), orderBy("createdAt", "desc")), (snap) => {
      setAllBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubBgs = onSnapshot(query(collection(db, "roomBackgrounds"), orderBy("createdAt", "desc")), (snap) => {
      setAllRoomBgs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRooms = onSnapshot(query(collection(db, "rooms"), orderBy("createdAt", "desc")), (snap) => {
      setAllRooms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubOfficialMsgs = onSnapshot(query(collection(db, "officialNotifications"), orderBy("createdAt", "desc")), (snap) => {
      setAllOfficialMsgs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubEmojis = onSnapshot(query(collection(db, "emojis"), orderBy("createdAt", "desc")), (snap) => {
      setAllEmojis(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubGifts = onSnapshot(query(collection(db, "gifts"), orderBy("createdAt", "desc")), (snap) => {
      setAllGifts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubStoreFrames = onSnapshot(query(collection(db, "storeFrames"), orderBy("createdAt", "desc")), (snap) => {
      setStoreFrames(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubStoreEntries = onSnapshot(query(collection(db, "storeEntries"), orderBy("createdAt", "desc")), (snap) => {
      setStoreEntries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubStoreBgs = onSnapshot(query(collection(db, "storeBackgrounds"), orderBy("createdAt", "desc")), (snap) => {
      setStoreBackgrounds(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSupport = onSnapshot(query(collection(db, "supportChats"), orderBy("lastTimestamp", "desc")), (snap) => {
      setSupportChats(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAppearance = onSnapshot(doc(db, "settings", "appearance"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLoginBgImage(data.loginBackground || null);
        setLoginLogoImage(data.loginLogo || null);
      }
    });

    const unsubDesign = onSnapshot(doc(db, "settings", "design"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMicOpenIcon(data.micOpenIcon || null);
        setMicLockedIcon(data.micLockedIcon || null);
        setWaveRoomIcon(data.waveRoomIcon || null);
        setGiftButtonIcon(data.giftButtonIcon || null);
      }
    });

    const unsubFruitsSettings = onSnapshot(doc(db, "settings", "fruitsGame"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFruitsGlobalSettings(data);
        setFruitsGameIcon(data.gameIcon || null);
      }
    });

    const unsubFruitsActiveBets = onSnapshot(collection(db, "fruitsGameActiveBets"), (snap) => {
      setFruitsActiveBets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubFruitsPlayers = onSnapshot(query(collection(db, "users"), where("fruitsTotalBet", ">", 0), limit(100)), (snap) => {
      setFruitsPlayers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubReports = onSnapshot(query(collection(db, "reports"), orderBy("createdAt", "desc")), (snap) => {
      setAllReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubDefaultImages = onSnapshot(doc(db, "settings", "default_images"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDefaultProfileImage(data.profileImage || null);
        setDefaultCoverImage(data.coverImage || null);
      }
    });

    const unsubAgencyDesign = onSnapshot(doc(db, "settings", "agencyDesign"), (snap) => {
      if (snap.exists()) {
        setAgencyBackgroundUrl(snap.data().backgroundUrl || '');
      }
    });

    const unsubCarnival = onSnapshot(doc(db, "settings", "carnival"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCarnivalBannerUrlSetting(data.bannerUrl || '');
        setCarnivalBgUrl(data.backgroundUrl || '');
        setCarnivalSettings(data);
      }
    });

    const unsubCarnivalCodes = onSnapshot(collection(db, "carnivalCodes"), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setCarnivalCodes(list);
    });

    return () => {
      unsubUsers(); unsubNews(); unsubBanners(); unsubBgs(); unsubRooms(); unsubDesign(); unsubOfficialMsgs(); unsubAppearance(); unsubStoreFrames(); unsubStoreEntries(); unsubStoreBgs(); unsubEmojis(); unsubGifts(); unsubSupport();
      unsubFruitsSettings(); unsubFruitsActiveBets(); unsubFruitsPlayers(); unsubReports(); unsubDefaultImages(); unsubAgencyDesign(); unsubCarnival();
      unsubCarnivalCodes();
    };
  }, [isOpen]);

  useEffect(() => {
    let unsub: any;
    if (selectedSupportChatId) {
      const q = query(collection(db, "supportChats", selectedSupportChatId, "messages"), orderBy("createdAt", "asc"));
      unsub = onSnapshot(q, (snap) => {
        setSupportMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTimeout(() => adminSupportScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });
      updateDoc(doc(db, "supportChats", selectedSupportChatId), { unreadByAdmin: false });
    }
    return () => { if (unsub) unsub(); };
  }, [selectedSupportChatId]);

  useEffect(() => {
    let unsub: any;
    if (showGrantPopup) {
      unsub = onSnapshot(query(collection(db, "users", showGrantPopup, "inventory"), orderBy("purchasedAt", "desc")), (snap) => {
        setUserInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
    return () => { if (unsub) unsub(); };
  }, [showGrantPopup]);

  useEffect(() => {
    let unsub: any;
    if (showBadgesPopup) {
      unsub = onSnapshot(query(collection(db, "users", showBadgesPopup, "badges"), orderBy("createdAt", "desc")), (snap) => {
        setUserBadges(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
    return () => { if (unsub) unsub(); };
  }, [showBadgesPopup]);

  const handleGiveBadge = async () => {
    if (!showBadgesPopup || !badgeUrl.trim()) return alert("يرجى إدخل رابط الشارة");
    setIsPublishing(true);
    try {
      await addDoc(collection(db, "users", showBadgesPopup, "badges"), {
        imageUrl: badgeUrl.trim(),
        createdAt: serverTimestamp()
      });
      setBadgeUrl('');
      alert("تم منح الشارة للمستخدم بنجاح");
    } catch (e) {
      alert("حدث خطأ");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRemoveBadge = async (badgeId: string) => {
    if (!showBadgesPopup) return;
    if (confirm("هل تريد حذف هذه الشارة من بروفايل المستخدم؟")) {
      await deleteDoc(doc(db, "users", showBadgesPopup, "badges", badgeId));
      alert("تم حذف الشارة");
    }
  };

  const handleRemoveReport = async (reportId: string) => {
    if (confirm("هل تريد حذف هذا البلاغ؟")) {
      try {
        await deleteDoc(doc(db, "reports", reportId));
        alert("تم حذف البلاغ");
      } catch (e) {
        alert("خطأ في الحذف");
      }
    }
  };

  const handleRemoveInventoryItem = async (itemId: string, itemUrl: string, itemType: 'frame' | 'entry' | 'background') => {
    if (!showGrantPopup) return;
    if (confirm("هل تريد حذف هذا العنصر من حقيبة المستخدم؟")) {
      try {
        await deleteDoc(doc(db, "users", showGrantPopup, "inventory", itemId));
        
        // Also unequip if currently wearing
        const userDocRef = doc(db, "users", showGrantPopup);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const updates: any = {};
          if (itemType === 'frame' && userData.currentFrame === itemUrl) updates.currentFrame = null;
          if (itemType === 'entry' && userData.currentEntry === itemUrl) updates.currentEntry = null;
          
          if (itemType === 'background') {
            try {
              const bgsSnap = await getDocs(query(collection(db, "roomBackgrounds"), limit(1)));
              const defaultBgUrl = !bgsSnap.empty ? bgsSnap.docs[0].data().imageUrl : null;
              
              if (userData.currentRoomBackground === itemUrl) {
                updates.currentRoomBackground = defaultBgUrl;
              }

              // Reset rooms owned by this user currently using this custom background
              const roomsSnap = await getDocs(query(
                collection(db, "rooms"),
                where("owner.uid", "==", showGrantPopup)
              ));
              for (const roomDoc of roomsSnap.docs) {
                const rData = roomDoc.data();
                if (rData.roomBackground === itemUrl) {
                  await updateDoc(roomDoc.ref, {
                    roomBackground: defaultBgUrl
                  });
                }
              }
            } catch (e) {
              console.error("Error resetting room backgrounds:", e);
              updates.currentRoomBackground = null;
            }
          }
          
          if (Object.keys(updates).length > 0) {
            await updateDoc(userDocRef, updates);
          }
        }
        alert("تم حذف العنصر بنجاح.");
      } catch (err) {
        alert("حدث خطأ أثناء الحذف.");
      }
    }
  };

  const cleanupInventoryAndUsers = async (itemId: string, type: 'frame' | 'entry' | 'background', itemUrl: string) => {
    try {
      let defaultBgUrl: string | null = null;
      if (type === 'background') {
        try {
          const bgsSnap = await getDocs(query(collection(db, "roomBackgrounds"), limit(1)));
          if (!bgsSnap.empty) defaultBgUrl = bgsSnap.docs[0].data().imageUrl;
        } catch (e) {
          console.error("Error fetching default background:", e);
        }

        // Clean up any rooms using this background globally
        try {
          const roomsResetSnap = await getDocs(query(
            collection(db, "rooms"),
            where("roomBackground", "==", itemUrl)
          ));
          for (const rDoc of roomsResetSnap.docs) {
            await updateDoc(rDoc.ref, { roomBackground: defaultBgUrl });
          }
        } catch (e) {
          console.error("Error cleaning up room backgrounds globally:", e);
        }
      }

      const inventoryQuery = query(collectionGroup(db, "inventory"), where("itemId", "==", itemId));
      const snap = await getDocs(inventoryQuery);
      
      const promises = snap.docs.map(async (invDoc) => {
        const userDocRef = invDoc.ref.parent.parent;
        if (userDocRef) {
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const updates: any = {};
            
            if (type === 'frame' && userData.currentFrame === itemUrl) {
              updates.currentFrame = null;
            }
            if (type === 'entry' && userData.currentEntry === itemUrl) {
              updates.currentEntry = null;
            }
            if (type === 'background' && userData.currentRoomBackground === itemUrl) {
              updates.currentRoomBackground = defaultBgUrl;
            }
            
            if (Object.keys(updates).length > 0) {
              await updateDoc(userDocRef, updates);
            }
          }
        }
        await deleteDoc(invDoc.ref);
      });
      
      await Promise.all(promises);
    } catch (err) {
      console.error("Error during global inventory cleanup:", err);
    }
  };

  const isVideoUrl = (url: string | null) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/) !== null || url.includes('video');
  };

  const handlePublishGift = async () => {
    if (!giftName || !giftPrice || !giftIcon) return alert("يرجى ملأ البيانات الأساسية للهدايا");
    setIsPublishing(true);
    try {
      await addDoc(collection(db, "gifts"), {
        name: giftName,
        price: parseInt(giftPrice),
        icon: giftIcon,
        animation: giftAnimation || null,
        tab: giftCategory,
        createdAt: serverTimestamp()
      });
      setGiftName('');
      setGiftPrice('');
      setGiftIcon('');
      setGiftAnimation('');
      setGiftCategory('normal');
      alert("تم نشر الهدية بنجاح في صندوق الهدايا");
    } catch (e) {
      alert("خطأ في النشر");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGrantItem = async () => {
    if (!showGrantPopup || !grantName || !grantUrl || !grantDuration) return alert("يرجى ملأ البيانات الأساسية");
    if (grantType === 'entry' && !grantPreview) return alert("يرجى اختيار صورة معاينة للدخولية");
    
    setIsPublishing(true);
    try {
      const purchasedAt = new Date();
      const expiresAt = new Date(purchasedAt.getTime() + parseInt(grantDuration) * 24 * 60 * 60 * 1000);

      const itemData: any = {
        name: grantName,
        type: grantType,
        purchasedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        isEquipped: grantType === 'background',
        grantedByAdmin: true
      };

      if (grantType === 'frame') {
        itemData.imageUrl = grantUrl;
      } else if (grantType === 'background') {
        if (isVideoUrl(grantUrl)) {
          itemData.videoUrl = grantUrl;
          itemData.imageUrl = grantUrl;
        } else {
          itemData.imageUrl = grantUrl;
        }
      } else {
        itemData.videoUrl = grantUrl;
        itemData.previewImage = grantPreview;
      }

      await addDoc(collection(db, "users", showGrantPopup, "inventory"), itemData);
      
      await addDoc(collection(db, "users", showGrantPopup, "systemNotifications"), {
        title: "هدية خاصة من الإدارة",
        desc: grantType === 'frame' 
          ? `لقد منحتك الإدارة إطاراً مميزة باسم "${grantName}" لمدة ${grantDuration} أيام. تفقدها الآن في إعدادات المتجر!`
          : grantType === 'background' 
            ? `لقد منحتك الإدارة خلفية غرفه مخصصة باسم "${grantName}" لمدة ${grantDuration} أيام. تفقدها الآن في إعدادات الغرفة!`
            : `لقد منحتك الإدارة دخولية مميزة باسم "${grantName}" لمدة ${grantDuration} أيام. تفقدها الآن في إعدادات المتجر!`,
        icon: grantType === 'frame' ? 'fa-id-badge' : grantType === 'background' ? 'fa-image' : 'fa-door-open',
        createdAt: serverTimestamp()
      });

      setGrantName('');
      setGrantUrl('');
      setGrantPreview(null);
      alert("تم منح العنصر للمستخدم بنجاح");
      setShowGrantPopup(null);
    } catch (e) {
      alert("حدث خطأ");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGrantAnimatedAvatar = async () => {
    if (!showGrantAnimatedPopup) return;
    setIsPublishing(true);
    try {
      const updates: any = {};
      if (animatedUrl.trim()) {
        updates.animatedAvatar = animatedUrl.trim();
      } else {
        updates.animatedAvatar = deleteField();
      }

      await updateDoc(doc(db, "users", showGrantAnimatedPopup), updates);
      
      if (animatedUrl.trim()) {
        await addDoc(collection(db, "users", showGrantAnimatedPopup, "systemNotifications"), {
          title: "صورة متحركة مميزة",
          desc: "لقد تم منحك صوره متحركه مميزة لبروفايلك من قبل الإدارة! استمتع بمظهرك الجديد.",
          icon: "fa-image",
          createdAt: serverTimestamp()
        });
      }

      setShowGrantAnimatedPopup(null);
      setAnimatedUrl('');
      alert(updates.animatedAvatar ? "تم منح الصورة المتحركة بنجاح" : "تم حذف الصورة المتحركة");
    } catch (e) {
      alert("حدث خطأ");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSetAnimatedRoomCover = async () => {
    if (!showRoomCoverPopup || !animatedRoomCoverUrl.trim()) return alert("يرجى إدخال رابط الصورة المتحركة");
    setIsPublishing(true);
    try {
      const room = allRooms.find(r => r.id === showRoomCoverPopup);
      if (!room) return;

      await updateDoc(doc(db, "rooms", showRoomCoverPopup), {
        coverImage: animatedRoomCoverUrl.trim()
      });

      if (room.owner?.uid) {
        await addDoc(collection(db, "users", room.owner.uid, "systemNotifications"), {
          title: "تحديث غلاف الغرفة",
          desc: `لقد قامت الإدارة بمنح غرفتك "${room.title}" غلافاً متحركاً مميزاً وحصرياً. تفقد مظهر غرفتك الجديد الآن!`,
          icon: "fa-image",
          createdAt: serverTimestamp()
        });
      }

      setShowRoomCoverPopup(null);
      setAnimatedRoomCoverUrl('');
      alert("تم تحديث غلاف الغرفة وإرسال تنبيه للمالك");
    } catch (e) {
      alert("حدث خطأ أثناء التحديث");
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishFrame = async () => {
    if (!frameName || !frameUrl || !framePrice || !frameDuration) return alert("يرجى ملأ كافة البيانات");
    setIsPublishing(true);
    try {
      await addDoc(collection(db, "storeFrames"), {
        name: frameName,
        imageUrl: frameUrl,
        price: parseInt(framePrice),
        durationDays: parseInt(frameDuration),
        createdAt: serverTimestamp()
      });
      setFrameName('');
      setFrameUrl('');
      setFramePrice('');
      setFrameDuration('7');
      alert("تم نشر الإطار في المتجر بنجاح");
    } catch (e) {
      alert("حدث خطأ أثناء النشر");
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishEntry = async () => {
    if (!entryName || !entryVideoUrl || !entryPreviewImage || !entryPrice || !entryDuration) return alert("يرجى ملأ كافة البيانات");
    setIsPublishing(true);
    try {
      await addDoc(collection(db, "storeEntries"), {
        name: entryName,
        videoUrl: entryVideoUrl,
        previewImage: entryPreviewImage,
        price: parseInt(entryPrice),
        durationDays: parseInt(entryDuration),
        createdAt: serverTimestamp()
      });
      setEntryName('');
      setEntryVideoUrl('');
      setEntryPreviewImage(null);
      setEntryPrice('');
      setEntryDuration('7');
      alert("تم نشر الدخولية في المتجر بنجاح");
    } catch (e) {
      alert("حدث خطأ أثناء النشر");
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishStoreBg = async () => {
    if (!storeBgName || !storeBgImage || !storeBgPrice || !storeBgDuration) return alert("يرجى ملأ كافة البيانات");
    setIsPublishing(true);
    try {
      await addDoc(collection(db, "storeBackgrounds"), {
        name: storeBgName,
        imageUrl: storeBgImage,
        price: parseInt(storeBgPrice),
        durationDays: parseInt(storeBgDuration),
        createdAt: serverTimestamp()
      });
      setStoreBgName('');
      setStoreBgImage(null);
      setStoreBgPrice('');
      setStoreBgDuration('7');
      alert("تم نشر الخلفية في المتجر بنجاح");
    } catch (e) {
      alert("حدث خطأ أثناء النشر");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUserUpdate = async (userId: string, data: any) => {
    try {
      await updateDoc(doc(db, "users", userId), data);
      return true;
    } catch (e) { 
      alert("خطأ في التحديث"); 
      return false;
    }
  };

  const handleChargeSubmit = async () => {
    if (!showChargePopup || !chargeAmount) return;
    const targetUser = allUsers.find(u => u.id === showChargePopup);
    if (targetUser) {
      const amountNum = parseInt(chargeAmount);
      const success = await handleUserUpdate(showChargePopup, { 
        coins: (targetUser.coins || 0) + amountNum 
      });
      if (success) { 
        await addDoc(collection(db, "users", showChargePopup, "systemNotifications"), {
          title: "تم شحن محفظتك",
          desc: `تم شحن ${amountNum.toLocaleString('en-US')} كوينز لك من قبل الإدارة. استمتع بالألعاب!`,
          icon: 'fa-coins',
          createdAt: serverTimestamp()
        });
        setShowChargePopup(null); 
        setChargeAmount(''); 
      }
    }
  };

  const handleDeductSubmit = async () => {
    if (!showDeductPopup || !deductAmount) return;
    const targetUser = allUsers.find(u => u.id === showDeductPopup);
    if (targetUser) {
      const amountNum = parseInt(deductAmount);
      if ((targetUser.coins || 0) < amountNum) {
        alert("رصيد المستخدم غير كافٍ للخصم");
        return;
      }
      const success = await handleUserUpdate(showDeductPopup, { 
        coins: (targetUser.coins || 0) - amountNum 
      });
      if (success) { 
        await addDoc(collection(db, "users", showDeductPopup, "systemNotifications"), {
          title: "تم سحب رصيد",
          desc: `تم سحب ${amountNum.toLocaleString('en-US')} كوينز من حسابك من قبل الإدارة.`,
          icon: 'fa-minus-circle',
          createdAt: serverTimestamp()
        });
        setShowDeductPopup(null); 
        setDeductAmount(''); 
        alert("تم خصم الرصيد بنجاح");
      }
    }
  };

  const handleIdUpdateSubmit = async () => {
    if (!showIdPopup || !newCustomId) return;
    const data: any = { 
      customId: newCustomId,
      idOffsetX: profileIdOffsetX,
      idOffsetY: profileIdOffsetY,
      idFontSize: profileIdFontSize,
      profileIdOffsetX: profileIdOffsetX,
      profileIdOffsetY: profileIdOffsetY,
      profileIdFontSize: profileIdFontSize,
      roomIdOffsetX: roomIdOffsetX,
      roomIdOffsetY: roomIdOffsetY,
      roomIdFontSize: roomIdFontSize,
    };
    if (newCustomIdIcon) {
      data.customIdIcon = newCustomIdIcon;
    } else {
      data.customIdIcon = deleteField();
    }
    
    const success = await handleUserUpdate(showIdPopup, data);
    if (success) { 
      try {
        await addDoc(collection(db, "users", showIdPopup, "systemNotifications"), {
          title: "تهنئة بالهوية الجديدة",
          desc: `مبروك تم حصولك على ID مميز وحصري من الإدارة. رقم هويتك الجديد هو: ${newCustomId}`,
          icon: 'fa-id-badge',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to send notification:", err);
      }

      setShowIdPopup(null); 
      setNewCustomId(''); 
      setNewCustomIdIcon(null);
      alert("تم تحديث الـ ID وإرسال رسالة تهنئة للمستخدم");
    }
  };

  const handleGrantBanSystem = async (uid: string, name: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { canBan: !currentStatus });
      
      if (!currentStatus) {
        await addDoc(collection(db, "users", uid, "systemNotifications"), {
          title: "تم منحك صلاحية جديدة",
          desc: "لقد تم منحك الوصول إلى نظام حظر المستخدمين. يمكنك الآن العثور عليه في ملفك الشخصي.",
          icon: "fas fa-user-slash",
          createdAt: serverTimestamp(),
          type: 'canBan_grant',
          read: false
        });
      } else {
        await addDoc(collection(db, "users", uid, "systemNotifications"), {
          title: "تنبيه إداري",
          desc: "تم سحب نظام حظر المستخدمين من الحساب بسبب المخالفه للقوانين",
          icon: "fas fa-user-slash",
          createdAt: serverTimestamp(),
          type: 'canBan_revoke',
          read: false
        });
      }
      
      alert(currentStatus ? "تم سحب الصلاحية بنجاح" : "تم منح الصلاحية بنجاح");
    } catch (e: any) {
      alert(`خطأ: ${e.message || String(e)}`);
    }
  };

  const handleGrantGMSystem = async (uid: string, name: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { isGM: !currentStatus });
      
      if (!currentStatus) {
        await addDoc(collection(db, "users", uid, "systemNotifications"), {
          title: "تم منحك صلاحية جديدة",
          desc: "لقد تم منحك الوصول إلى نظام المدير العام. يمكنك الآن العثور عليه في ملفك الشخصي.",
          icon: "fas fa-user-shield",
          createdAt: serverTimestamp(),
          type: 'gm_grant',
          read: false
        });
      } else {
        await addDoc(collection(db, "users", uid, "systemNotifications"), {
          title: "تنبيه إداري",
          desc: "تم سحب نظام المدير العام من الحساب بسبب المخالفه للقوانين",
          icon: "fas fa-user-shield",
          createdAt: serverTimestamp(),
          type: 'gm_revoke',
          read: false
        });
      }
      
      alert(currentStatus ? "تم سحب صلاحية المدير العام بنجاح" : "تم منح صلاحية المدير العام بنجاح");
    } catch (e: any) {
      alert(`خطأ: ${e.message || String(e)}`);
    }
  };

  const handleAdminSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupportChatId || !adminSupportReply.trim()) return;

    try {
      await addDoc(collection(db, "supportChats", selectedSupportChatId, "messages"), {
        senderId: "SUPPORT_AGENT",
        text: adminSupportReply.trim(),
        createdAt: serverTimestamp()
      });
      
      await updateDoc(doc(db, "supportChats", selectedSupportChatId), {
        lastMessage: adminSupportReply.trim(),
        lastTimestamp: serverTimestamp(),
        unreadByAdmin: false,
        unreadByUser: true
      });
      
      setAdminSupportReply('');
    } catch (e) { alert("خطأ في الرد"); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        alert("تنبيه: حجم الملف كبير جداً (أكبر من 800 كيلوبايت).\nيرجى اختيار صورة/ملف أصغر لحماية أداء قاعدة البيانات وتفادي تهنيج التطبيق.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveDesignSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "design"), {
        micOpenIcon,
        micLockedIcon,
        waveRoomIcon,
        giftButtonIcon
      }, { merge: true });
      alert("تم حفظ إعدادات التصميم");
    } catch (e) {
      alert("خطأ في الحفظ");
    }
  };

  const handleSaveLoginSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "appearance"), {
        loginBackground: loginBgImage,
        loginLogo: loginLogoImage
      }, { merge: true });
      alert("تم تحديث إعدادات صفحة تسجيل الدخول بنجاح");
    } catch (e) {
      alert("خطأ أثناء الحفظ");
    }
  };

  const handleSaveDefaultImages = async () => {
    try {
      await setDoc(doc(db, "settings", "default_images"), {
        profileImage: defaultProfileImage,
        coverImage: defaultCoverImage
      }, { merge: true });

      alert("تم تحديث الصور الرئيسية الافتراضية بنجاح");
    } catch (e) {
      alert("خطأ أثناء الحفظ");
    }
  };

  const handleSaveCarnivalSettings = async () => {
    setIsCarnivalSaving(true);
    try {
      await setDoc(doc(db, "settings", "carnival"), {
        bannerUrl: carnivalBannerUrlSetting.trim(),
        backgroundUrl: carnivalBgUrl.trim()
      }, { merge: true });
      alert(t("تم حفظ إعدادات حدث الافتتاح بنجاح", "Opening Event settings saved successfully"));
    } catch (e) {
      console.error(e);
      alert(t("حدث خطأ أثناء الحفظ", "Error saving settings"));
    } finally {
      setIsCarnivalSaving(false);
    }
  };

  const handlePublishEmoji = async () => {
    if (!emojiUrl.trim()) return alert("يرجى إدخال رابط الـ Emoji أولاً");
    setIsPublishing(true);
    try {
      await addDoc(collection(db, "emojis"), {
        imageUrl: emojiUrl.trim(),
        createdAt: serverTimestamp()
      });
      setEmojiUrl('');
      alert("تم نشر الإيموجي بنجاح");
    } catch (e) {
      alert("خطأ في النشر");
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredUsers = (() => {
    const list = searchId.trim() 
      ? allUsers.filter(u => 
          u.customId?.toLowerCase().includes(searchId.toLowerCase()) || 
          u.displayName?.toLowerCase().includes(searchId.toLowerCase())
        )
      : [...allUsers];

    const myUid = auth.currentUser?.uid;
    const myEmail = 'adhamyosry57@gmail.com';

    list.sort((a, b) => {
      const isMeA = (myUid && a.id === myUid) || a.email === myEmail;
      const isMeB = (myUid && b.id === myUid) || b.email === myEmail;
      if (isMeA && !isMeB) return -1;
      if (!isMeA && isMeB) return 1;
      return 0;
    });

    return list;
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-[#1a0b2e] flex flex-col animate-in slide-in-from-bottom" dir="rtl">
      <input type="file" ref={newsInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setNewsImage)} />
      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setBannerImage)} />
      <input type="file" ref={roomBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setRoomBgImage)} />
      <input type="file" ref={loginBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setLoginBgImage)} />
      <input type="file" ref={loginLogoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setLoginLogoImage)} />
      <input type="file" ref={entryPreviewInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setEntryPreviewImage)} />
      <input type="file" ref={storeBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setStoreBgImage)} />
      <input type="file" ref={grantPreviewInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setGrantPreview)} />
      
      <input type="file" ref={micOpenInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setMicOpenIcon)} />
      <input type="file" ref={micLockedInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setMicLockedIcon)} />
      <input type="file" ref={waveRoomInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setWaveRoomIcon)} />
      <input type="file" ref={msgImageRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setMsgImage)} />
      <input type="file" ref={idIconInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setNewCustomIdIcon)} />

      <input type="file" ref={profileImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setDefaultProfileImage)} />
      <input type="file" ref={coverImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, setDefaultCoverImage)} />

      {!selectedSupportChatId && (
        <header className="p-4 border-b border-white/10 flex flex-col bg-[#0d051a] sticky top-0 z-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-black text-lg">{t("لوحة المسؤول", "Admin Panel")}</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              {id: 'users', label: t('المستخدمين', 'Users')},
              {id: 'support', label: t('محادثات الدعم', 'Support Chats')},
              {id: 'rooms', label: t('الغرف', 'Rooms')},
              {id: 'news', label: t('الأخبار', 'News')},
              {id: 'banners', label: t('البنرات', 'Banners')},
              {id: 'bgs', label: t('خلفيات مجانية', 'Free Backgrounds')},
              {id: 'store', label: t('المتجر', 'Store')},
              {id: 'emojis', label: t('إيموجي', 'Emoji')},
              {id: 'gifts', label: t('الهدايا', 'Gifts')},
              {id: 'mainImages', label: t('الصور الرئيسية', 'Main Images')},
              {id: 'agencyDesign', label: t('تصميم الوكالات', 'Agency Design')},
              {id: 'carnival', label: t('حدث الافتتاح', 'Opening Event')},
              {id: 'reports', label: t('استلام البلاغات', 'Received Reports')},
              {id: 'cp', label: t('CP', 'CP')},
              {id: 'design', label: t('التصميم', 'Design Settings')},
              {id: 'messages', label: t('الرسائل', 'Messages')}
            ].map((tab) => (
              <button key={tab.id} onClick={() => setAdminTab(tab.id as any)} className={`flex-shrink-0 px-4 py-2 text-[10px] font-black rounded-xl transition-all uppercase relative ${adminTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-purple-300/60'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </header>
      )}

      <div className={`flex-1 ${selectedSupportChatId ? '' : 'overflow-y-auto p-4 space-y-6 pb-20'}`}>
        {adminTab === 'cp' && <CPAdmin />}
        
        {false /* Moved to GamesControlPanel */ && adminTab === 'fruits' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3 pb-2">
              <div className="bg-white/5 p-4 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[85px] hover:bg-white/10 transition-all">
                 <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none">إجمالي الجولات</p>
                   <i className="fas fa-history text-purple-400/50 text-[10px]"></i>
                 </div>
                 <p className="text-lg font-black text-white mt-1.5 truncate leading-none">{fruitsGlobalSettings.totalRounds || 0}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[85px] hover:bg-white/10 transition-all">
                 <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">أرباح 24 ساعة</p>
                   <i className="fas fa-coins text-emerald-400/50 text-[10px]"></i>
                 </div>
                 <p className="text-lg font-black text-white mt-1.5 truncate leading-none flex items-center gap-1">
                   {(fruitsGlobalSettings.totalProfit24h || 0).toLocaleString('en-US')} <span className="text-[8px] text-yellow-500 font-black">كوينز</span>
                 </p>
              </div>
              <div className="bg-white/5 p-4 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[85px] hover:bg-white/10 transition-all">
                 <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none">الرهانات النشطة</p>
                   <i className="fas fa-dice text-orange-400/50 text-[10px]"></i>
                 </div>
                 <p className="text-lg font-black text-white mt-1.5 truncate leading-none">{fruitsActiveBets.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString('en-US')}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[85px] hover:bg-white/10 transition-all">
                 <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest leading-none">اللاعبين النشطين</p>
                   <i className="fas fa-users text-pink-400/50 text-[10px]"></i>
                 </div>
                 <p className="text-lg font-black text-white mt-1.5 truncate leading-none">{new Set(fruitsActiveBets.map(b => b.userId)).size}</p>
              </div>
            </div>

            {/* Game Icon Settings */}
            <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/10 space-y-4 shadow-2xl">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <i className="fas fa-image text-pink-400 flex-shrink-0"></i>
                أيقونة اللعبة
              </h4>
              
              <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                <div 
                  className={`w-14 h-14 rounded-2xl shadow-lg group relative overflow-hidden flex-shrink-0 ${!fruitsGameIcon ? 'bg-gradient-to-br from-orange-400 to-rose-500 p-[1px]' : ''}`}
                >
                  {fruitsGameIcon ? (
                    <img src={fruitsGameIcon} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-[#130624] flex items-center justify-center border border-white/10">
                      <span className="text-2xl">🍓</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-[10px] text-white/40 font-black">رابط أيقونة اللعبة</p>
                  <input 
                    type="text"
                    value={fruitsGameIcon || ''}
                    onChange={(e) => setFruitsGameIcon(e.target.value)}
                    placeholder="ضع رابط الصورة هنا..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[11px] font-bold text-white focus:outline-none focus:border-purple-500/50 transition-all truncate"
                  />
                </div>
              </div>

              <button 
                onClick={() => setDoc(doc(db, "settings", "fruitsGame"), { gameIcon: fruitsGameIcon }, { merge: true })}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-[11px] font-black text-white hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
              >
                حفظ أيقونة اللعبة
              </button>
            </div>

            {/* Global Algorithm Settings */}
            <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/10 space-y-4 shadow-2xl">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <i className="fas fa-cogs text-purple-400 flex-shrink-0"></i>
                خوارزميات اللعبة العامة
              </h4>
              
              <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-purple-300/80 uppercase tracking-widest pl-2 block">صعوبة اللعبة (لكل المستخدمين)</label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/30 rounded-2xl border border-white/5">
                       {['easy', 'balanced', 'hard'].map(mode => (
                         <button 
                           key={mode}
                           onClick={() => setDoc(doc(db, "settings", "fruitsGame"), { globalDifficulty: mode }, { merge: true })}
                           className={`py-2 rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-0.5 border ${
                             fruitsGlobalSettings.globalDifficulty === mode 
                               ? 'bg-purple-600 border-purple-500 text-white shadow-md' 
                               : 'bg-transparent border-transparent text-white/50 hover:text-white/80'
                           }`}
                         >
                           <span className="text-xs">
                             {mode === 'easy' ? '🟢' : mode === 'balanced' ? '🟡' : '🔴'}
                           </span>
                           <span className="text-[9px]">
                             {mode === 'easy' ? 'سهل (ربح)' : mode === 'balanced' ? 'متوازن' : 'صعب (خسارة)'}
                           </span>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-purple-300/80 uppercase tracking-widest block">حد تفعيل خوارزمية الخسارة (Threshold)</label>
                    <div className="flex gap-2">
                       <input 
                         type="number" 
                         value={fruitsGlobalSettings.lossThreshold ?? 0} 
                         onChange={e => setDoc(doc(db, "settings", "fruitsGame"), { lossThreshold: parseInt(e.target.value) || 0 }, { merge: true })}
                         placeholder="مثلاً: 10000000" 
                         className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-purple-500 transition-all font-sans"
                       />
                       <div className="bg-purple-600/30 px-3 flex items-center rounded-xl text-purple-300 text-[10px] font-black border border-purple-500/20">كوينز</div>
                    </div>
                    <p className="text-[8px] text-white/30 font-bold leading-normal">
                      عندما يصل أرباح المستخدم لهذا المبلغ، ستبدأ الخوارزمية تلقائياً بمنعه وتوجيهه للخسارة لمنع سحب رصيد كبير.
                    </p>
                  </div>
              </div>
            </div>

            {/* Players List with Individual Management */}
            {(() => {
              // Extract unique user IDs from active bets right now
              const activeUserIdsFromBets = Array.from(new Set(fruitsActiveBets.map(bet => bet.userId)));
              
              // Base players list from the Firestore fruitsPlayers listener
              const uniquePlayersMap = new Map<string, any>();
              
              fruitsPlayers.forEach(p => {
                uniquePlayersMap.set(p.id, p);
              });
              
              // Include active betters
              activeUserIdsFromBets.forEach(uid => {
                if (!uniquePlayersMap.has(uid)) {
                  const userDoc = allUsers.find(u => u.id === uid);
                  if (userDoc) {
                    uniquePlayersMap.set(uid, userDoc);
                  } else {
                    const betInfo = fruitsActiveBets.find(b => b.userId === uid);
                    uniquePlayersMap.set(uid, {
                      id: uid,
                      displayName: betInfo?.userName || "لاعب نشط",
                      photoURL: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231a0b2e'/><circle cx='50' cy='35' r='20' fill='%23ffffff' fill-opacity='0.3'/><path d='M25 80c0-15 10-25 25-25s25 10 25 25' fill='%23ffffff' fill-opacity='0.3'/></svg>",
                      fruitsTotalBet: betInfo?.amount || 0,
                      fruitsTotalWin: 0,
                      customId: uid.substring(0, 8)
                    });
                  }
                }
              });

              // Apply Search query (add matching from allUsers to unique map so admin can configure any player)
              if (fruitsSearchQuery.trim()) {
                const searchLower = fruitsSearchQuery.toLowerCase();
                allUsers.forEach(u => {
                  const matches = u.displayName?.toLowerCase().includes(searchLower) || u.customId?.toString().toLowerCase().includes(searchLower);
                  if (matches && !uniquePlayersMap.has(u.id)) {
                    uniquePlayersMap.set(u.id, u);
                  }
                });
              }

              let unifiedFruitsPlayersList = Array.from(uniquePlayersMap.values());

              // If search query is applied, filter the output list to match findings
              if (fruitsSearchQuery.trim()) {
                const searchLower = fruitsSearchQuery.toLowerCase();
                unifiedFruitsPlayersList = unifiedFruitsPlayersList.filter(p => 
                  p.displayName?.toLowerCase().includes(searchLower) || 
                  p.customId?.toString().toLowerCase().includes(searchLower) ||
                  p.id.toLowerCase().includes(searchLower)
                );
              }

              return (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-[11px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                      <i className="fas fa-users-cog"></i>
                      إدارة اللاعبين المخصصة
                    </h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => window.location.reload()}
                        className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-600/30 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all active:scale-[0.93] shadow-md group"
                        title="إعادة تحميل الصفحة"
                      >
                        <i className="fas fa-sync-alt group-hover:rotate-180 transition-transform duration-500 text-[10px]"></i>
                      </button>
                      <span className="text-[9px] font-black text-white/40 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 uppercase font-sans">
                        {`${unifiedFruitsPlayersList.length} لاعب`}
                      </span>
                    </div>
                  </div>

                  {/* Search Player Input */}
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300/30 text-[10px]">
                      <i className="fas fa-search"></i>
                    </span>
                    <input 
                      type="text" 
                      value={fruitsSearchQuery} 
                      onChange={(e) => setFruitsSearchQuery(e.target.value)} 
                      placeholder="بحث عن لاعب لتوجيهه للمكسب/الخسارة..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pr-10 pl-4 text-[11px] font-bold text-white outline-none focus:border-purple-500/40 shadow-inner" 
                    />
                  </div>

                  {unifiedFruitsPlayersList.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-[2rem] border border-white/5 opacity-50 flex flex-col items-center justify-center gap-2">
                      <i className="fas fa-users-slash text-2xl text-purple-400"></i>
                      <p className="text-[11px] font-black text-white/40">لا يوجد لاعبين مطابقين للبحث حالياً</p>
                    </div>
                  ) : unifiedFruitsPlayersList.map(player => {
                    const netProfit = (player.fruitsTotalWin || 0) - (player.fruitsTotalBet || 0);
                    return (
                      <div key={player.id} className="bg-gradient-to-b from-white/5 to-white/[0.02] p-4 rounded-[2rem] border border-white/10 space-y-4 shadow-xl hover:bg-white/10 transition-all animate-in fade-in">
                        {/* Player Info Header */}
                        <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3 font-sans">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 shadow-lg flex-shrink-0">
                              {player.animatedAvatar ? (
                                isVideoUrl(player.animatedAvatar) ? (
                                  <video src={player.animatedAvatar} autoPlay loop muted playsInline className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <img src={player.animatedAvatar} className="w-full h-full object-cover rounded-full" />
                                )
                              ) : (
                                <img src={player.photoURL || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231a0b2e'/><circle cx='50' cy='35' r='20' fill='%23ffffff' fill-opacity='0.3'/><path d='M25 80c0-15 10-25 25-25s25 10 25 25' fill='%23ffffff' fill-opacity='0.3'/></svg>"} className="w-full h-full object-cover rounded-full" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-white truncate max-w-[120px]">{player.displayName}</p>
                              <p className="text-[9px] text-purple-400 font-bold uppercase tracking-wider mt-0.5">ID: {player.customId || player.id.substring(0,8)}</p>
                            </div>
                          </div>
                          
                          <div className="text-left flex-shrink-0">
                             <div className="text-[10px] font-black flex items-center gap-1 justify-end">
                               <span className={netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                 {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString('en-US')}
                               </span>
                               <i className="fas fa-coins text-[8px] text-yellow-500"></i>
                             </div>
                             <p className="text-[8px] font-bold text-white/25 mt-0.5">إجمالي المراهنة: {player.fruitsTotalBet?.toLocaleString('en-US') || 0}</p>
                          </div>
                        </div>

                        {/* Luck Range Slider (Full Width) */}
                        <div className="bg-black/20 p-3 rounded-2xl border border-white/5 space-y-2 font-sans">
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">تعديل نسبة الحظ المخصص</label>
                            <span className="text-[10px] font-black text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/20">
                              {player.fruitsLuckPercent ?? 100}% حظ
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                             <i className="fas fa-percentage text-[10px] text-purple-400/40"></i>
                             <input 
                                type="range" min="0" max="100" 
                                value={player.fruitsLuckPercent ?? 100} 
                                onChange={e => updateDoc(doc(db, "users", player.id), { fruitsLuckPercent: parseInt(e.target.value) })}
                                className="flex-1 accent-purple-500 h-1.5 bg-white/10 rounded-full appearance-none outline-none cursor-pointer"
                             />
                          </div>
                        </div>

                        {/* Forced Loss Manual Override (Full Width) */}
                        <div className="flex items-center justify-between gap-3 bg-black/20 p-3 rounded-2xl border border-white/5 font-sans">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[10px] font-black text-white/80">خسارة إجبارية فورية</span>
                            <span className="text-[8px] text-white/30 font-bold truncate">إجبار اللاعب على خسارة جميع رهاناته للتأديب</span>
                          </div>
                          <button 
                            onClick={() => updateDoc(doc(db, "users", player.id), { fruitsForcedLoss: !player.fruitsForcedLoss, fruitsForcedWin: false })}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all flex items-center gap-1.5 shadow-md ${
                              player.fruitsForcedLoss 
                                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                : 'bg-white/5 text-white/55 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <i className={`fas ${player.fruitsForcedLoss ? 'fa-toggle-on text-red-400' : 'fa-toggle-off text-white/30'}`}></i>
                            {player.fruitsForcedLoss ? 'نشط (خسارة مستمرة)' : 'خسارة يدوية'}
                          </button>
                        </div>

                        {/* Forced Win Manual Override (Full Width) */}
                        <div className="flex items-center justify-between gap-3 bg-black/20 p-3 rounded-2xl border border-white/5 font-sans">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[10px] font-black text-white/80">فوز إجباري فوري</span>
                            <span className="text-[8px] text-white/30 font-bold truncate">إجبار اللاعب على الفوز في أي رهان يضعه</span>
                          </div>
                          <button 
                            onClick={() => updateDoc(doc(db, "users", player.id), { fruitsForcedWin: !player.fruitsForcedWin, fruitsForcedLoss: false })}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all flex items-center gap-1.5 shadow-md ${
                              player.fruitsForcedWin 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                : 'bg-white/5 text-white/55 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <i className={`fas ${player.fruitsForcedWin ? 'fa-toggle-on text-emerald-400' : 'fa-toggle-off text-white/30'}`}></i>
                            {player.fruitsForcedWin ? 'نشط (فوز مستمر)' : 'مكسب إجباري'}
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
        
        {adminTab === 'support' && (
          <div className="h-full flex flex-col animate-in fade-in">
            {!selectedSupportChatId ? (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">طلبات الدعم الفني</p>
                {supportChats.length === 0 ? (
                  <div className="text-center py-20 opacity-20"><i className="fas fa-headset text-4xl mb-2"></i><p className="text-xs font-bold">لا توجد محادثات حالياً</p></div>
                ) : supportChats.map(chat => (
                  <button 
                    key={chat.id} 
                    onClick={() => setSelectedSupportChatId(chat.id)}
                    className="w-full bg-white/5 p-4 rounded-[2rem] border border-white/10 flex items-center gap-4 active:scale-[0.98] transition-all hover:bg-white/10 text-right relative overflow-hidden h-auto"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 flex-shrink-0 shadow-lg relative bg-black/10">
                      {isVideoUrl(chat.userPhoto) ? (
                        <video src={chat.userPhoto} autoPlay loop muted playsInline className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <img src={chat.userPhoto} className="w-full h-full object-cover rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-sm text-white">{chat.userName}</span>
                      </div>
                      <p className={`text-[11px] font-bold leading-tight break-words whitespace-pre-wrap ${chat.unreadByAdmin ? 'text-white' : 'text-white/40'}`}>
                        {chat.lastMessage}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                       {chat.unreadByAdmin && (
                          <span className="w-1.5 h-1.5 bg-red-800 rounded-full"></span>
                       )}
                       <i className="fas fa-chevron-left text-[10px] text-white/10"></i>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="fixed inset-0 z-[600] flex flex-col h-full bg-[#1a0b2e] animate-in slide-in-from-left">
                <header className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0d051a]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 bg-black/15 shadow-lg flex-shrink-0">
                      {(() => {
                        const chatPhoto = supportChats.find(c => c.id === selectedSupportChatId)?.userPhoto;
                        return isVideoUrl(chatPhoto) ? (
                          <video src={chatPhoto} autoPlay loop muted playsInline className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <img src={chatPhoto || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231a0b2e'/><circle cx='50' cy='35' r='20' fill='%23ffffff' fill-opacity='0.3'/><path d='M25 80c0-15 10-25 25-25s25 10 25 25' fill='%23ffffff' fill-opacity='0.3'/></svg>"} className="w-full h-full object-cover rounded-full" />
                        );
                      })()}
                    </div>
                    <div>
                      <h4 className="text-white font-black text-sm">{supportChats.find(c => c.id === selectedSupportChatId)?.userName}</h4>
                      <p className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest">محادثة الدعم المباشرة</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedSupportChatId(null)} className="w-10 h-10 rounded-xl bg-white/5 text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all"><i className="fas fa-times"></i></button>
                </header>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-black/20">
                  {supportMessages.map(msg => {
                    const isFromMe = msg.senderId === "SUPPORT_AGENT";
                    return (
                      <div key={msg.id} className={`flex items-start gap-3 ${isFromMe ? 'flex-row-reverse' : ''} animate-in fade-in`}>
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 flex-shrink-0 shadow-lg">
                          {isFromMe ? (
                            <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white"><i className="fas fa-headset text-lg"></i></div>
                          ) : (
                            (() => {
                              const chatPhoto = supportChats.find(c => c.id === selectedSupportChatId)?.userPhoto;
                              return isVideoUrl(chatPhoto) ? (
                                <video src={chatPhoto} autoPlay loop muted playsInline className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <img src={chatPhoto || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231a0b2e'/><circle cx='50' cy='35' r='20' fill='%23ffffff' fill-opacity='0.3'/><path d='M25 80c0-15 10-25 25-25s25 10 25 25' fill='%23ffffff' fill-opacity='0.3'/></svg>"} className="w-full h-full object-cover rounded-full" />
                              );
                            })()
                          )}
                        </div>
                        <div className={`max-w-[75%] flex flex-col ${isFromMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[8px] font-black text-white/20 mb-1">{isFromMe ? 'أنا (الدعم الفني)' : 'المستخدم'}</span>
                          <div className={`px-4 py-3 rounded-2xl text-[12px] font-bold shadow-xl break-words whitespace-pre-wrap ${isFromMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white/10 text-white border border-white/10 rounded-tl-none'}`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={adminSupportScrollRef} />
                </div>

                <form onSubmit={handleAdminSupportReply} className="p-4 pb-6 bg-[#0d051a] border-t border-white/10">
                  <div className="relative flex items-center gap-3">
                    <textarea 
                      value={adminSupportReply} 
                      onChange={e => setAdminSupportReply(e.target.value)}
                      placeholder="اكتب رد الإدارة هنا..." 
                      className="flex-1 bg-white/5 border border-white/10 rounded-[1.8rem] py-3.5 pr-6 pl-14 text-xs text-white outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all shadow-inner h-14 resize-none" 
                    />
                    <button 
                      type="submit" 
                      disabled={!adminSupportReply.trim()}
                      className="w-11 h-11 rounded-full bg-purple-600/30 backdrop-blur-md border border-purple-500/20 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-30 flex-shrink-0"
                    >
                      <i className="fas fa-paper-plane text-xs"></i>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {adminTab === 'agencyDesign' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-4 shadow-2xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <i className="fas fa-palette text-emerald-400"></i>
                تصميم محفظة الوكالة
              </h3>
              <p className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-widest">تحكم في مظهر محفظة الوكيل (صورة أو فيديو)</p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mr-2">رابط الخلفية (URL)</label>
                  <input 
                    type="text" 
                    value={agencyBackgroundUrl} 
                    onChange={e => setAgencyBackgroundUrl(e.target.value)} 
                    placeholder="رابط صورة أو فيديو (mp4)..." 
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-white outline-none focus:border-emerald-500/40 font-bold" 
                  />
                  <p className="text-[8px] text-white/20 font-bold px-1">يدعم روابط الصور (png, jpg) والروابط المباشرة للفيديوهات (mp4, webm).</p>
                </div>

                {agencyBackgroundUrl && (
                  <div className="w-full aspect-[16/9] bg-black/40 rounded-3xl border border-white/10 overflow-hidden relative">
                    {isVideoUrl(agencyBackgroundUrl) ? (
                      <video src={agencyBackgroundUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={agencyBackgroundUrl} className="w-full h-full object-cover" alt="preview" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">معاينة الخلفية</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={async () => {
                      setIsAgencyDesignSaving(true);
                      try {
                        await setDoc(doc(db, "settings", "agencyDesign"), {
                          backgroundUrl: agencyBackgroundUrl
                        }, { merge: true });
                        alert("تم حفظ التصميم بنجاح");
                      } catch (e) {
                        alert("حدث خطأ أثناء الحفظ");
                      } finally {
                        setIsAgencyDesignSaving(false);
                      }
                    }}
                    disabled={isAgencyDesignSaving}
                    className="bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black text-xs text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isAgencyDesignSaving ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-save"></i> <span>حفظ التعديلات</span></>}
                  </button>

                  <button 
                    onClick={async () => {
                      if (confirm("هل تريد العودة للشكل الافتراضي؟")) {
                        setIsAgencyDesignSaving(true);
                        try {
                          await setDoc(doc(db, "settings", "agencyDesign"), {
                            backgroundUrl: ""
                          }, { merge: true });
                          setAgencyBackgroundUrl("");
                          alert("تمت العودة للشكل الافتراضي");
                        } catch (e) {
                          alert("حدث خطأ");
                        } finally {
                          setIsAgencyDesignSaving(false);
                        }
                      }
                    }}
                    disabled={isAgencyDesignSaving}
                    className="bg-white/5 border border-white/10 py-4 rounded-2xl font-black text-xs text-white/60 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    العودة للافتراضي
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'carnival' && (
          <div className="space-y-6 animate-in fade-in pb-20">
            <div className="bg-[#1d0a33]/85 p-6 rounded-[2.5rem] border border-purple-500/20 space-y-4 shadow-2xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <i className="fas fa-gift text-purple-400"></i>
                إعدادات حدث الافتتاح (الكرنفال)
              </h3>
              <p className="text-[10px] text-purple-300/60 font-bold uppercase tracking-widest">تغيير بنر حدث الافتتاح وخلفية صفحة الكرنفال وتخصيصها</p>

              <div className="space-y-4">
                {/* Banner URL setting */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mr-2">رابط بنر حدث الافتتاح في الصفحة الرئيسية (Banner URL)</label>
                  <input 
                    type="text" 
                    value={carnivalBannerUrlSetting} 
                    onChange={e => setCarnivalBannerUrlSetting(e.target.value)} 
                    placeholder="ضع رابط صورة البنر هنا..." 
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40 font-bold" 
                  />
                  <p className="text-[8px] text-white/20 font-bold px-1">هذه الصورة ستظهر في شريط البنرات المتحرك بالصفحة الرئيسية كعنصر حدث الافتتاح.</p>
                </div>

                {carnivalBannerUrlSetting && (
                  <div className="w-full aspect-[21/9] bg-black/40 rounded-3xl border border-white/10 overflow-hidden relative">
                    <img src={carnivalBannerUrlSetting} className="w-full h-full object-cover" alt="Banner Preview" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">معاينة صورة البنر</p>
                    </div>
                  </div>
                )}

                {/* Page Background URL setting */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mr-2">رابط خلفية صفحة حدث الافتتاح (Background Image URL)</label>
                  <input 
                    type="text" 
                    value={carnivalBgUrl} 
                    onChange={e => setCarnivalBgUrl(e.target.value)} 
                    placeholder="ضع رابط صورة الخلفية هنا..." 
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40 font-bold" 
                  />
                  <p className="text-[8px] text-white/20 font-bold px-1">سيتم تطبيق هذه الصورة كخلفية لصفحة مهرجان الافتتاح بالكامل بدلاً من اللون الافتراضي.</p>
                </div>

                {carnivalBgUrl && (
                  <div className="w-full aspect-[16/9] bg-black/40 rounded-3xl border border-white/10 overflow-hidden relative">
                    <img src={carnivalBgUrl} className="w-full h-full object-cover" alt="Background Preview" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">معاينة صورة الخلفية</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={handleSaveCarnivalSettings}
                    disabled={isCarnivalSaving}
                    className="bg-purple-600 hover:bg-purple-500 py-4 rounded-2xl font-black text-xs text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isCarnivalSaving ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-save"></i> <span>حفظ التعديلات</span></>}
                  </button>

                  <button 
                    onClick={async () => {
                      if (confirm("هل تريد العودة للإعدادات الافتراضية للكرنفال؟")) {
                        setIsCarnivalSaving(true);
                        try {
                          await setDoc(doc(db, "settings", "carnival"), {
                            bannerUrl: "",
                            backgroundUrl: ""
                          }, { merge: true });
                          setCarnivalBannerUrlSetting("");
                          setCarnivalBgUrl("");
                          alert("تمت استعادة الإعدادات الافتراضية بنجاح");
                        } catch (e) {
                          alert("حدث خطأ أثناء الحفظ");
                        } finally {
                          setIsCarnivalSaving(false);
                        }
                      }
                    }}
                    disabled={isCarnivalSaving}
                    className="bg-white/5 border border-white/10 py-4 rounded-2xl font-black text-xs text-white/60 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    العودة للافتراضي
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#1d0a33]/85 p-6 rounded-[2.5rem] border border-purple-500/20 space-y-4 shadow-2xl mt-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <i className="fas fa-sliders-h text-purple-400"></i>
                حالة وجدول الحدث (الكرنفال)
              </h3>
              <p className="text-[10px] text-purple-300/60 font-bold uppercase tracking-widest">مراقبة حالة الكرنفال، تفعيل أو إيقاف الحدث، وإعادة تشغيل التنازلي لـ 60 يوماً</p>
              
              <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">حالة الحدث الحالية:</span>
                  {carnivalSettings?.isStopped ? (
                    <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-black">
                      🔴 متوقف مؤقتاً
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black">
                      🟢 نشط ويعمل
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-bold">تاريخ انتهاء الحدث:</span>
                  <span className="font-mono text-purple-300 font-black">
                    {(() => {
                      if (!carnivalSettings?.endTime) return "2026-08-07T12:00:00Z";
                      const et = carnivalSettings.endTime;
                      let d = new Date();
                      if (typeof et.toDate === 'function') d = et.toDate();
                      else if (et instanceof Date) d = et;
                      else if (typeof et === 'number') d = new Date(et);
                      else if (typeof et === 'string') d = new Date(et);
                      else if (et.seconds) d = new Date(et.seconds * 1000);
                      return d.toLocaleString('ar-EG');
                    })()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={async () => {
                    if (confirm("هل أنت متأكد من إعادة تشغيل الكرنفال؟ سيبدأ عد تنازلي جديد لمدة 60 يوماً من الآن.")) {
                      setIsCarnivalSaving(true);
                      try {
                        const newEndTime = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
                        await setDoc(doc(db, "settings", "carnival"), {
                          endTime: newEndTime
                        }, { merge: true });
                        alert("تمت إعادة تشغيل الحدث بنجاح لمدة 60 يوماً.");
                      } catch (err) {
                        alert("حدث خطأ أثناء ريستارت الحدث");
                      } finally {
                        setIsCarnivalSaving(false);
                      }
                    }
                  }}
                  disabled={isCarnivalSaving}
                  className="bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 py-2.5 px-2 rounded-xl font-black text-[10px] text-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <i className="fas fa-sync-alt text-[9px]"></i>
                  <span>إعادة تشغيل (60 يوم)</span>
                </button>

                {carnivalSettings?.isStopped ? (
                  <button
                    onClick={async () => {
                      setIsCarnivalSaving(true);
                      try {
                        await setDoc(doc(db, "settings", "carnival"), {
                          isStopped: false
                        }, { merge: true });
                        alert("تم تفعيل الكرنفال بنجاح.");
                      } catch (err) {
                        alert("حدث خطأ");
                      } finally {
                        setIsCarnivalSaving(false);
                      }
                    }}
                    disabled={isCarnivalSaving}
                    className="bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 py-2.5 px-2 rounded-xl font-black text-[10px] text-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fas fa-play text-[9px]"></i>
                    <span>تشغيل الحدث</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (confirm("هل أنت متأكد من إيقاف الحدث بالكامل؟ سيتم منع كل من يدخل إليه مع إظهار رسالة التنبيه.")) {
                        setIsCarnivalSaving(true);
                        try {
                          await setDoc(doc(db, "settings", "carnival"), {
                            isStopped: true
                          }, { merge: true });
                          alert("تم إيقاف الكرنفال بنجاح.");
                        } catch (err) {
                          alert("حدث خطأ");
                        } finally {
                          setIsCarnivalSaving(false);
                        }
                      }
                    }}
                    disabled={isCarnivalSaving}
                    className="bg-rose-600/20 border border-rose-500/40 hover:bg-rose-600/30 py-2.5 px-2 rounded-xl font-black text-[10px] text-rose-200 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fas fa-stop text-[9px]"></i>
                    <span>إيقاف الحدث</span>
                  </button>
                )}
              </div>
            </div>

            {/* Carnival Activation Codes Generator Section */}
            <div className="bg-[#1d0a33]/85 p-6 rounded-[2.5rem] border border-purple-500/20 space-y-4 shadow-2xl mt-4 text-right">
              <h3 className="text-sm font-black text-white flex items-center gap-2 justify-start">
                <i className="fas fa-key text-purple-400"></i>
                أكواد تفعيل الكرنفال للمستخدمين
              </h3>
              <p className="text-[10px] text-purple-300/60 font-bold uppercase tracking-widest">توليد وإدارة الأكواد التي يتم منحها للمستخدمين لتفعيل استلام جائزة الـ 10 مليون عملة بعد شحن 2$</p>

              <button
                onClick={async () => {
                  try {
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                    let codePart = '';
                    for (let i = 0; i < 6; i++) {
                      codePart += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    const finalCode = `CARNIVAL-${codePart}`;
                    
                    await setDoc(doc(db, "carnivalCodes", finalCode), {
                      code: finalCode,
                      createdAt: serverTimestamp(),
                      used: false,
                      usedBy: null,
                      usedAt: null
                    });
                    
                    setGeneratedCode(finalCode);
                    alert(`تم توليد كود التفعيل بنجاح: ${finalCode}`);
                  } catch (err) {
                    alert("حدث خطأ أثناء توليد الكود");
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 py-3.5 rounded-2xl font-black text-xs text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fas fa-plus animate-pulse"></i>
                <span>توليد كود تفعيل جديد</span>
              </button>

              {generatedCode && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1">
                  <p className="text-[9px] text-emerald-400 font-black uppercase tracking-wider">الكود المولد الأخير (انسخه لمشاركته):</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-lg font-mono font-black text-white select-all">{generatedCode}</p>
                    <button
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(generatedCode);
                          alert("تم نسخ الكود بنجاح!");
                        } catch (err) {}
                      }}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                      title="نسخ الكود"
                    >
                      <i className="fas fa-copy text-xs"></i>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-white/5">
                <h4 className="text-[11px] font-black text-white/50 tracking-wider">الأكواد الفعالة والسجلات:</h4>
                
                {carnivalCodes.length === 0 ? (
                  <p className="text-[10px] text-white/30 text-center py-4">لم يتم توليد أي أكواد بعد.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {carnivalCodes.map((codeItem) => (
                      <div key={codeItem.id} className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs">
                        <div className="text-right">
                          <p className="font-mono font-black text-purple-300 select-all">{codeItem.code}</p>
                          <p className="text-[8px] text-white/40 mt-0.5">
                            تاريخ الإنشاء: {codeItem.createdAt ? new Date(codeItem.createdAt.seconds * 1000).toLocaleString('ar-EG') : 'الآن'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {codeItem.used ? (
                            <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/10 rounded-full text-[9px] font-extrabold">
                              مستخدم (UID: {codeItem.usedBy?.substring(0, 6)}...)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-full text-[9px] font-extrabold">
                              جاهز ومتاح
                            </span>
                          )}

                          <button
                            onClick={() => {
                              try {
                                navigator.clipboard.writeText(codeItem.code);
                                alert("تم نسخ الكود بنجاح!");
                              } catch (err) {}
                            }}
                            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                            title="نسخ الكود"
                          >
                            <i className="fas fa-copy text-[10px]"></i>
                          </button>

                          <button
                            onClick={async () => {
                              if (confirm("هل أنت متأكد من حذف هذا الكود بالكامل؟")) {
                                try {
                                  await deleteDoc(doc(db, "carnivalCodes", codeItem.id));
                                  alert("تم حذف كود التفعيل بنجاح.");
                                } catch (e) {
                                  alert("حدث خطأ أثناء حذف الكود");
                                }
                              }
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                            title="حذف الكود"
                          >
                            <i className="fas fa-trash-alt text-[10px]"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in pb-20">
            <header className="flex flex-col gap-2 mb-2 px-1">
              <h3 className="text-white font-black text-lg">استلام البلاغات الواردة</h3>
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">تنبيهات الأمان والخصوصية</p>
            </header>

            {allReports.length === 0 ? (
              <div className="text-center py-24 opacity-20 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <i className="fas fa-shield-alt text-4xl"></i>
                </div>
                <p className="text-xs font-bold font-black tracking-widest opacity-60">لا توجد بلاغات حالياً</p>
                <p className="text-[10px] font-bold mt-1 opacity-40 uppercase">Safe Environment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allReports.map((report) => (
                  <div key={report.id} className="bg-black/40 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in duration-300">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                            <i className="fas fa-exclamation-triangle text-xl"></i>
                          </div>
                          <div>
                            <h4 className="text-white font-black text-sm">{report.roomName}</h4>
                            <p className="text-[9px] text-white/40 font-bold">Room ID: {report.roomId}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveReport(report.id)}
                          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 transition-colors active:scale-90"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-purple-400 uppercase tracking-widest block">صاحب الغرفة (ID)</label>
                          <div className="text-[11px] font-bold text-white bg-white/5 px-3 py-2 rounded-xl truncate max-w-[120px]">
                            {report.roomOwnerCustomId || (allUsers.find(u => u.id === report.roomOwnerUid)?.customId) || 'غير متوفر'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-purple-400 uppercase tracking-widest block">مقدم البلاغ (ID)</label>
                          <div className="text-[11px] font-bold text-white bg-white/5 px-3 py-2 rounded-xl truncate max-w-[120px]">
                            {report.reporterCustomId || (allUsers.find(u => u.id === report.reporterUid)?.customId) || 'غير متوفر'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">سبب البلاغ: {report.reason}</span>
                          </div>
                          <p className="text-xs font-bold text-white/60 leading-relaxed italic break-words">
                            "{report.details}"
                          </p>
                        </div>
                        
                        <div className="flex justify-end pt-2">
                           <span className="text-[8px] font-black text-white/20 uppercase">
                             تاريخ البلاغ: {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString('ar-EG-u-nu-latn', { numberingSystem: 'latn' }) : 'الآن'}
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {adminTab === 'users' && (
          <div className="space-y-4">
            <div className="relative mb-4">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300/30 text-xs"><i className="fas fa-search"></i></span>
              <input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="بحث بواسطة الاسم أو الـ ID..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-10 pl-4 text-xs text-white outline-none focus:border-purple-500/40 shadow-inner" />
            </div>
            {filteredUsers.map(u => (
              <div key={u.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 overflow-hidden rounded-full border border-white/10 bg-black/10">
                      {u.animatedAvatar ? (
                        isVideoUrl(u.animatedAvatar) ? (
                          <video src={u.animatedAvatar} autoPlay loop muted playsInline className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <img src={u.animatedAvatar} className="w-full h-full object-cover rounded-full" />
                        )
                      ) : (
                        <img src={u.photoURL || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231a0b2e'/><circle cx='50' cy='35' r='20' fill='%23ffffff' fill-opacity='0.3'/><path d='M25 80c0-15 10-25 25-25s25 10 25 25' fill='%23ffffff' fill-opacity='0.3'/></svg>"} className="w-full h-full object-cover rounded-full" />
                      )}
                    </div>
                    <div><p className="text-xs font-black">{u.displayName}</p><p className="text-[9px] text-purple-400">ID: {u.customId}</p></div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1">
                      <i className="fas fa-coins text-yellow-500 text-[9px]"></i>
                      <span className="text-xs font-bold">{u.coins || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded ${u.canBan ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/20'}`}>
                        {u.canBan ? t('سيستم الحظر نشط', 'Ban system active') : t('بدون نظام حظر', 'No ban system')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded ${u.isGM ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/20'}`}>
                        {u.isGM ? t('نظام المدير نشط', 'GM system active') : t('بدون نظام مدير', 'No GM system')}
                      </span>
                    </div>
                    {u.email && (
                      <p className="text-[8px] text-white/40 font-bold truncate max-w-[100px]" title={u.email}>
                        {u.email}
                      </p>
                    )}
                    <p className="text-[7px] text-white/40 font-bold bg-white/5 px-1 rounded">
                      {t('كلمة المرور:', 'Password:')} <span className="text-purple-400">{u.password || t('غير متوفرة بعد', 'Not available yet')}</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setShowChargePopup(u.id); setChargeAmount(''); }} className="bg-green-600/20 text-green-400 text-[10px] py-2 rounded-xl border border-green-600/30 font-black whitespace-nowrap">{t("شحن", "Charge")}</button>
                  <button onClick={() => { setShowDeductPopup(u.id); setDeductAmount(''); }} className="bg-orange-600/20 text-orange-400 text-[10px] py-2 rounded-xl border border-orange-600/30 font-black whitespace-nowrap">{t("خصم", "Deduct")}</button>
                  <button onClick={() => { 
                    setShowIdPopup(u.id); 
                    setNewCustomId(u.customId || ''); 
                    setNewCustomIdIcon(u.customIdIcon || null);
                    
                    const pX = u.profileIdOffsetX ?? u.idOffsetX ?? 28;
                    const pY = u.profileIdOffsetY ?? u.idOffsetY ?? 0.5;
                    const pS = u.profileIdFontSize ?? u.idFontSize ?? 11;
                    
                    const rX = u.roomIdOffsetX ?? u.idOffsetX ?? 28;
                    const rY = u.roomIdOffsetY ?? u.idOffsetY ?? 0.5;
                    const rS = u.roomIdFontSize ?? u.idFontSize ?? 11;

                    setIdOffsetX(pX);
                    setIdOffsetY(pY);
                    setIdFontSize(pS);

                    setProfileIdOffsetX(pX);
                    setProfileIdOffsetY(pY);
                    setProfileIdFontSize(pS);

                    setRoomIdOffsetX(rX);
                    setRoomIdOffsetY(rY);
                    setRoomIdFontSize(rS);

                    setActiveIdTab('profile');
                  }} className="bg-blue-600/20 text-blue-400 text-[10px] py-2 rounded-xl border border-blue-600/30 font-black">تعديل ID</button>
                  <button onClick={() => { setShowBadgesPopup(u.id); setBadgeUrl(''); }} className="bg-emerald-600/20 text-emerald-400 text-[10px] py-2 rounded-xl border border-emerald-600/30 font-black">شارات</button>
                  <button onClick={() => { setShowGrantPopup(u.id); }} className="bg-purple-600/20 text-purple-400 text-[10px] py-2 rounded-xl border border-purple-600/30 font-black">منح مخصص</button>
                  <button onClick={() => { setShowGrantAnimatedPopup(u.id); setAnimatedUrl(u.animatedAvatar || ''); }} className="bg-pink-600/20 text-pink-400 text-[10px] py-2 rounded-xl border border-pink-600/30 font-black">منح صورة متحركة</button>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleGrantBanSystem(u.id, u.displayName, !!u.canBan); }} 
                    className={`${u.canBan ? 'bg-orange-600/40 text-orange-400' : 'bg-orange-600/10 text-orange-500/60'} text-[10px] py-2 rounded-xl border border-orange-600/30 font-black`}
                  >
                    {u.canBan ? 'سحب سيستم الحظر' : 'منح سيستم الحظر'}
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleGrantGMSystem(u.id, u.displayName, !!u.isGM); }} 
                    className={`${u.isGM ? 'bg-purple-600/40 text-purple-400' : 'bg-purple-600/10 text-purple-500/60'} text-[10px] py-2 rounded-xl border border-purple-600/30 font-black`}
                  >
                    {u.isGM ? 'سحب نظام المدير' : 'منح نظام المدير'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {adminTab === 'rooms' && (
          <div className="space-y-4">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">إدارة الغرف النشطة ({allRooms.length})</p>
            {allRooms.length === 0 ? (
              <div className="text-center py-20 opacity-20"><i className="fas fa-door-closed text-4xl mb-2"></i><p className="text-xs font-bold">لا توجد غرف نشطة</p></div>
            ) : allRooms.map(room => (
              <div key={room.id} className="bg-white/5 rounded-2xl border border-white/10 flex items-stretch gap-4 animate-in fade-in duration-300 overflow-hidden h-24">
                <div className="w-24 h-full flex-shrink-0 bg-black/40">
                  {isVideoUrl(room.coverImage) ? (
                    <video src={room.coverImage} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={room.coverImage} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 py-3 flex flex-col justify-center min-w-0">
                  <p className="text-xs font-black text-white truncate">{room.title}</p>
                  <p className="text-[9px] text-purple-400 font-bold">ID: {room.roomIdDisplay || room.id.substring(0,8)}</p>
                  <p className="text-[8px] text-white/40 mt-1 truncate">بواسطة: {room.owner?.name}</p>
                </div>
                <div className="flex items-center gap-2 px-3">
                  <div className="bg-white/5 px-2 py-1 rounded-lg border border-white/5 flex items-center gap-1 flex-shrink-0">
                    <i className="fas fa-users text-[8px] text-purple-400"></i>
                    <span className="text-[10px] font-black text-white">{room.participantsCount || 0}</span>
                  </div>
                  <button 
                    onClick={() => { setShowRoomCoverPopup(room.id); setAnimatedRoomCoverUrl(room.coverImage || ''); }}
                    className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-600/30 flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
                    title="غلاف متحرك"
                  >
                    <i className="fas fa-magic text-xs"></i>
                  </button>
                  <button 
                    onClick={async () => {
                      if(confirm(`هل تريد حقاً حذف غرفة "${room.title}" نهائياً؟`)) {
                        try {
                          await deleteDoc(doc(db, "rooms", room.id));
                          alert("تم حذف الغرفة بنجاح.");
                        } catch (e: any) {
                          console.error("Error deleting room:", e);
                          alert("حدث خطأ أثناء حذف الغرفة: " + (e.message || e));
                        }
                      }
                    }} 
                    className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 border border-red-600/30 flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {adminTab === 'gifts' && (
          <div className="space-y-6">
            <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/10 space-y-4 shadow-2xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <i className="fas fa-gift text-purple-400"></i>
                إضافة هدية جديدة
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">اسم الهدية</label>
                  <input value={giftName} onChange={e => setGiftName(e.target.value)} placeholder="مثلاً: وردة، سيارة..." className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">سعر الهدية (كوينز)</label>
                  <input type="number" value={giftPrice} onChange={e => setGiftPrice(e.target.value)} placeholder="100" className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">رابط الأيقونة (PNG/Emoji)</label>
                  <input value={giftIcon} onChange={e => setGiftIcon(e.target.value)} placeholder="رابط صورة الهدية أو إيموجي..." className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-[10px] text-white outline-none focus:border-purple-500/40 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">رابط الأنيميشن (Gif/Mp4 - اختياري)</label>
                  <input value={giftAnimation} onChange={e => setGiftAnimation(e.target.value)} placeholder="رابط GIF أو فيديو الهدية..." className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-[10px] text-white outline-none focus:border-purple-500/40 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">القسم في صندوق الهدايا</label>
                  <select 
                    value={giftCategory} 
                    onChange={e => setGiftCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40"
                  >
                    <option value="normal">عادية</option>
                    <option value="cp">CP</option>
                    <option value="famous">مشاهير</option>
                    <option value="country">دولة</option>
                    <option value="vip">VIP</option>
                    <option value="birthday">ميلاد</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handlePublishGift}
                disabled={isPublishing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-2xl font-black text-xs text-white shadow-xl active:scale-95 transition-all border border-white/10"
              >
                {isPublishing ? <i className="fas fa-spinner animate-spin"></i> : <span>نشر الهدية الآن</span>}
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">الهدايا الحالية ({allGifts.length})</p>
              <div className="grid grid-cols-2 gap-3">
                {allGifts.map(gift => (
                  <div key={gift.id} className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center gap-2 relative group">
                    <div className="text-3xl mb-1">
                      {gift.icon.startsWith('http') ? (
                        <img src={gift.icon} className="w-10 h-10 object-contain" />
                      ) : gift.icon}
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-white truncate w-24">{gift.name}</p>
                      <p className="text-[8px] text-yellow-500 font-bold">{gift.price} كوينز</p>
                      <span className="text-[7px] text-white/30 uppercase">{gift.tab}</span>
                    </div>
                    <button 
                      onClick={async () => {
                        if(confirm("حذف هذه الهدية؟")) {
                          try {
                            await deleteDoc(doc(db, "gifts", gift.id));
                            alert("تم حذف الهدية بنجاح.");
                          } catch (e: any) {
                            console.error("Error deleting gift:", e);
                            alert("حدث خطأ أثناء حذف الهدية: " + (e.message || e));
                          }
                        }
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fas fa-trash-alt text-[10px]"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'emojis' && (
          <div className="space-y-6">
            <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/10 space-y-4 shadow-2xl">
              <h3 className="text-sm font-black text-white">إضافة GIF Emoji جديد</h3>
              <p className="text-[10px] text-purple-400/60 font-bold uppercase tracking-widest">ستظهر هذه الإيموجيات في قائمة الإيموجي داخل الغرف</p>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">رابط الإيموجي (URL)</label>
                <input 
                  type="text"
                  value={emojiUrl}
                  onChange={(e) => setEmojiUrl(e.target.value)}
                  placeholder="ضع رابط الـ GIF هنا (مثلاً: https://...)"
                  className="w-full bg-white/5 border border-white/10 py-4 px-6 rounded-2xl text-[10px] text-white outline-none focus:border-purple-500/40 transition-all shadow-inner font-mono" 
                />
              </div>

              {emojiUrl.trim() && (
                <div className="w-full aspect-square bg-black/40 rounded-3xl border border-white/10 flex flex-col items-center justify-center overflow-hidden">
                   <img 
                    src={emojiUrl} 
                    className="w-full h-full object-contain" 
                    alt="Emoji Preview" 
                   />
                   <p className="text-[8px] text-white/20 mt-2 font-black uppercase tracking-widest">معاينة الإيموجي</p>
                </div>
              )}

              <button 
                onClick={handlePublishEmoji}
                disabled={isPublishing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-2xl font-black text-xs text-white shadow-xl active:scale-95 transition-all border border-white/10 flex items-center justify-center gap-3"
              >
                {isPublishing ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-upload"></i><span>نشر الإيموجي الآن</span></>}
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">الإيموجيات الحالية ({allEmojis.length})</p>
              <div className="grid grid-cols-4 gap-3">
                {allEmojis.map(emoji => (
                  <div key={emoji.id} className="relative aspect-square bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center p-2 group overflow-hidden shadow-lg">
                    <img src={emoji.imageUrl} className="w-full h-full object-contain" />
                    <button 
                      onClick={async () => {
                        if(confirm("هل تريد حذف هذا الإيموجي؟")) {
                          try {
                            await deleteDoc(doc(db, "emojis", emoji.id));
                            alert("تم حذف الإيموجي بنجاح.");
                          } catch (e: any) {
                            console.error("Error deleting emoji:", e);
                            alert("حدث خطأ أثناء حذف الإيموجي: " + (e.message || e));
                          }
                        }
                      }}
                      className="absolute inset-0 bg-red-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]"
                    >
                      <i className="fas fa-trash text-white"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'store' && (
          <div className="space-y-6">
            <div className="bg-purple-600/10 p-5 rounded-[2rem] border border-purple-500/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
                <i className="fas fa-store text-xl"></i>
              </div>
              <div>
                <h3 className="text-sm font-black text-white">إدارة المتجر</h3>
                <p className="text-[10px] text-purple-300/60 font-bold">التحكم في محتوى المتجر العام</p>
              </div>
            </div>

            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
              {[
                {id: 'frames', label: 'الإطارات', icon: 'fa-id-badge'},
                {id: 'entries', label: 'الدخوليات', icon: 'fa-door-open'},
                {id: 'backgrounds', label: 'الخلفيات'}
              ].map(sec => (
                <button 
                  key={sec.id}
                  onClick={() => setStoreSection(sec.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black transition-all ${storeSection === sec.id ? 'bg-purple-600 text-white shadow-lg' : 'text-white/30'}`}
                >
                  <i className={`fas ${sec.icon}`}></i>
                  <span>{sec.label}</span>
                </button>
              ))}
            </div>

            {storeSection === 'frames' && (
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-5">
                   <h4 className="text-xs font-black text-white flex items-center gap-2 mb-2">
                     <i className="fas fa-plus-circle text-purple-400"></i>
                     إضافة إطار جديد للمتجر
                   </h4>
                   
                   <div className="flex flex-col items-center justify-center py-4 bg-black/20 rounded-3xl border border-white/5 relative overflow-hidden h-40">
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent"></div>
                      <div className="w-24 h-24 relative flex items-center justify-center z-10">
                        <div className="w-[70%] h-[70%] rounded-full overflow-hidden border-2 border-white/10 bg-purple-900/40">
                          <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231a0b2e'/><circle cx='50' cy='35' r='20' fill='%23ffffff' fill-opacity='0.3'/><path d='M25 80c0-15 10-25 25-25s25 10 25 25' fill='%23ffffff' fill-opacity='0.3'/></svg>" className="w-full h-full object-cover opacity-30 grayscale" alt="preview" />
                        </div>
                        {frameUrl && (
                          <img src={frameUrl} className="absolute inset-0 w-full h-full object-contain animate-pulse" alt="frame preview" />
                        )}
                      </div>
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mt-3">معاينة حية للإطار</p>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400/60 uppercase mr-2">اسم الإطار</label>
                        <input value={frameName} onChange={e => setFrameName(e.target.value)} placeholder="مثلاً: التاج الذهبي..." className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-purple-400/60 uppercase mr-2">رابط صورة العرض (PNG)</label>
                        <input value={frameUrl} onChange={e => setFrameUrl(e.target.value)} placeholder="https://..." className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-purple-400/60 uppercase mr-2">سعر الإطار</label>
                          <input type="number" value={framePrice} onChange={e => setFramePrice(e.target.value)} placeholder="5000" className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-purple-400/60 uppercase mr-2">المدة (بالأيام)</label>
                          <input type="number" value={frameDuration} onChange={e => setFrameDuration(e.target.value)} placeholder="7" className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40" />
                        </div>
                      </div>
                   </div>

                   <button 
                     onClick={handlePublishFrame}
                     disabled={isPublishing}
                     className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-2xl font-black text-xs text-white shadow-xl active:scale-95 transition-all border border-white/10 flex items-center justify-center gap-3"
                   >
                     {isPublishing ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-rocket"></i><span>نشر في المتجر الآن</span></>}
                   </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">الإطارات الحالية ({storeFrames.length})</p>
                  <div className="grid grid-cols-2 gap-3">
                    {storeFrames.map(f => (
                      <div key={f.id} className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center gap-3 relative group">
                        <div className="w-16 h-16 relative flex items-center justify-center">
                          <div className="w-[70%] h-[70%] rounded-full bg-white/5 border border-white/10"></div>
                          <img src={f.imageUrl} className="absolute inset-0 w-full h-full object-contain" />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black text-white truncate w-24">{f.name}</p>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[11px] font-bold text-yellow-500">{f.price}</span>
                            <i className="fas fa-coins text-[8px] text-yellow-500"></i>
                          </div>
                        </div>
                        <button 
                          onClick={async () => { 
                            if(confirm("حذف الإطار؟ سيتم حذفه من كافة حقائب المستخدمين أيضاً.")) {
                              try {
                                await cleanupInventoryAndUsers(f.id, 'frame', f.imageUrl);
                                await deleteDoc(doc(db, "storeFrames", f.id));
                                alert("تم الحذف بنجاح.");
                              } catch (e: any) {
                                console.error("Error deleting store frame:", e);
                                alert("حدث خطأ أثناء الحذف: " + (e.message || e));
                              }
                            } 
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <i className="fas fa-trash-alt text-[10px]"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {storeSection === 'entries' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl">
                   <h4 className="text-sm font-black text-white flex items-center gap-2 mb-2">
                     <i className="fas fa-plus-circle text-purple-400"></i>
                     إضافة دخولية جديدة للمتجر
                   </h4>
                   
                   <div className="flex flex-col items-center justify-center py-4 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden h-[240px] shadow-inner">
                      {entryVideoUrl ? (
                        <div className="w-full h-full relative group">
                          <video src={entryVideoUrl} autoPlay loop playsInline className="w-full h-full object-contain" />
                        </div>
                      ) : entryPreviewImage ? (
                        <img src={entryPreviewImage} className="w-full h-full object-cover" alt="preview" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-20">
                          <i className="fas fa-film text-4xl text-white"></i>
                          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">سيظهر الفيديو هنا عند وضع الرابط</p>
                        </div>
                      )}
                      
                      <button onClick={() => entryPreviewInputRef.current?.click()} className="absolute bottom-4 right-4 w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform z-20 border border-white/10">
                        <i className="fas fa-camera text-sm"></i>
                      </button>
                   </div>

                   <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">اسم الدخولية</label>
                        <input value={entryName} onChange={e => setEntryName(e.target.value)} placeholder="مثلاً: دخول الملك..." className="w-full bg-white/5 border border-white/10 py-4 px-6 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40 transition-all shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">رابط فيديو الدخولية (MP4)</label>
                        <input value={entryVideoUrl} onChange={e => setEntryVideoUrl(e.target.value)} placeholder="ضع رابط الفيديو هنا للمعاينة..." className="w-full bg-white/5 border border-white/10 py-4 px-6 rounded-2xl text-[10px] text-white outline-none focus:border-purple-500/40 transition-all shadow-inner font-mono" />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">سعر الدخولية</label>
                          <input type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="10000" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs text-white outline-none focus:border-purple-500/40 transition-all shadow-inner" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">المدة (بالأيام)</label>
                          <input type="number" value={entryDuration} onChange={e => setEntryDuration(e.target.value)} placeholder="7" className="w-full bg-white/5 border border-white/10 py-4 px-6 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40 transition-all shadow-inner" />
                        </div>
                      </div>
                   </div>

                   <button onClick={handlePublishEntry} disabled={isPublishing} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-5 rounded-2xl font-black text-xs text-white shadow-xl active:scale-95 transition-all border border-white/10 flex items-center justify-center gap-3 mt-4">
                     {isPublishing ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-rocket"></i><span>نشر الدخولية الآن</span></>}
                   </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">الدخوليات الحالية ({storeEntries.length})</p>
                  <div className="grid grid-cols-2 gap-4">
                    {storeEntries.map(e => (
                      <div key={e.id} className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center gap-3 relative group overflow-hidden shadow-xl">
                        <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/5 shadow-inner relative">
                          <img src={e.previewImage} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="preview" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <i className="fas fa-play text-white opacity-40 text-2xl"></i>
                          </div>
                        </div>
                        <div className="text-center w-full">
                          <p className="text-[11px] font-black text-white truncate w-full">{e.name}</p>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[11px] font-bold text-yellow-500">{e.price}</span>
                            <i className="fas fa-coins text-[8px] text-yellow-500"></i>
                          </div>
                        </div>
                        <button onClick={async () => { 
                            if(confirm("حذف الدخولية؟")) {
                              try {
                                await cleanupInventoryAndUsers(e.id, 'entry', e.videoUrl);
                                await deleteDoc(doc(db, "storeEntries", e.id));
                                alert("تم الحذف بنجاح.");
                              } catch (e: any) {
                                console.error("Error deleting store entry:", e);
                                alert("حدث خطأ أثناء الحذف: " + (e.message || e));
                              }
                            } 
                          }} className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90">
                          <i className="fas fa-trash-alt text-[10px]"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {storeSection === 'backgrounds' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl">
                   <h4 className="text-sm font-black text-white flex items-center gap-2 mb-2">
                     <i className="fas fa-plus-circle text-purple-400"></i>
                     إضافة خلفية جديدة للمتجر
                   </h4>
                   
                   <div className="flex flex-col items-center justify-center py-4 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden h-[450px] shadow-inner">
                      {storeBgImage ? (
                        <img src={storeBgImage} className="w-full h-full object-cover" alt="bg preview" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-20">
                          <i className="fas fa-image text-4xl text-white"></i>
                          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">اختر صورة الخلفية للمعاينة</p>
                        </div>
                      )}
                      
                      <button onClick={() => storeBgInputRef.current?.click()} className="absolute bottom-4 right-4 w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform z-20 border border-white/10">
                        <i className="fas fa-camera text-sm"></i>
                      </button>
                   </div>

                   <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">اسم الخلفية</label>
                        <input value={storeBgName} onChange={e => setStoreBgName(e.target.value)} placeholder="مثلاً: خلفية القمر..." className="w-full bg-white/5 border border-white/10 py-4 px-6 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40 transition-all shadow-inner" />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">سعر الخلفية</label>
                          <input type="number" value={storeBgPrice} onChange={e => setStoreBgPrice(e.target.value)} placeholder="20000" className="w-full bg-white/5 border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40 transition-all shadow-inner" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-purple-400/60 uppercase mr-2 tracking-widest">المدة (بالأيام)</label>
                          <input type="number" value={storeBgDuration} onChange={e => setStoreBgDuration(e.target.value)} placeholder="7" className="w-full bg-white/5 border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40 transition-all shadow-inner" />
                        </div>
                      </div>
                   </div>

                   <button onClick={handlePublishStoreBg} disabled={isPublishing} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 py-5 rounded-2xl font-black text-xs text-white shadow-xl active:scale-95 transition-all border border-white/10 flex items-center justify-center gap-3 mt-4">
                     {isPublishing ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-rocket"></i><span>نشر الخلفية الآن</span></>}
                   </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">خلفيات المتجر الحالية ({storeBackgrounds.length})</p>
                  <div className="grid grid-cols-2 gap-4">
                    {storeBackgrounds.map(bg => (
                      <div key={bg.id} className="bg-white/5 p-3 rounded-[2rem] border border-white/5 flex flex-col gap-3 relative group overflow-hidden shadow-xl">
                        <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black/40 border border-white/5 shadow-inner">
                          <img src={bg.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <p className="text-[12px] font-black text-white truncate w-full text-center">{bg.name}</p>
                          <div className="flex items-center justify-center gap-1.5 py-0.5">
                            <span className="text-[11px] font-black text-yellow-500">{(bg.price || 0).toLocaleString('en-US')}</span>
                            <i className="fas fa-coins text-[8px] text-yellow-500"></i>
                          </div>
                        </div>
                        <button onClick={async () => { 
                            if(confirm("هل تريد حذف هذه خلفية؟")) {
                              try {
                                await cleanupInventoryAndUsers(bg.id, 'background', bg.imageUrl);
                                await deleteDoc(doc(db, "storeBackgrounds", bg.id));
                                alert("تم الحذف بنجاح.");
                              } catch (e: any) {
                                console.error("Error deleting store background:", e);
                                alert("حدث خطأ أثناء الحذف: " + (e.message || e));
                              }
                            } 
                          }} className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90">
                          <i className="fas fa-trash-alt text-[10px]"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {adminTab === 'messages' && (
          <div className="space-y-6">
            <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/10 space-y-4 shadow-2xl">
              <h3 className="text-sm font-black text-white mb-2">إرسال رسالة رسمية جديدة</h3>
              <div className="space-y-1.5"><label className="text-[9px] font-black text-purple-400/60 uppercase mr-2">عنوان الرسالة</label><input value={msgTitle} onChange={e => setMsgTitle(e.target.value)} placeholder="مثلاً: صيانة طارئة..." className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40 shadow-inner" /></div>
              <div className="space-y-1.5"><label className="text-[9px] font-black text-purple-400/60 uppercase mr-2">محتوى الرسالة</label><textarea value={msgDesc} onChange={e => setMsgDesc(e.target.value)} placeholder="اكتب التفاصيل..." className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-white outline-none h-24 focus:border-purple-500/40 shadow-inner" /></div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-purple-400/60 uppercase mr-2">رابط صورة الرسالة (اختياري)</label>
                <input 
                  type="text" 
                  value={msgImage || ''} 
                  onChange={e => setMsgImage(e.target.value || null)} 
                  placeholder="https://example.com/image.png" 
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-white outline-none focus:border-purple-500/40 shadow-inner" 
                />
              </div>
              {msgImage && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400/60 uppercase mr-2">معاينة الصورة</label>
                  <div className="w-full aspect-video bg-white/5 rounded-[2rem] overflow-hidden border border-white/10 flex items-center justify-center relative group">
                    <img 
                      src={msgImage} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=رابط+غير+صالح"; }} 
                    />
                    <button 
                      onClick={() => setMsgImage(null)} 
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px]"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              )}
              <button onClick={async () => {
                  if (!msgTitle || !msgDesc) return alert("يرجى ملأ العنوان والوصف");
                  await addDoc(collection(db, "officialNotifications"), { title: msgTitle, desc: msgDesc, image: msgImage || null, icon: 'fa-bullhorn', createdAt: serverTimestamp() });
                  setMsgTitle(''); setMsgDesc(''); setMsgImage(null); alert("تم الإرسال");
                }} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-2xl font-black text-xs text-white shadow-xl active:scale-95 transition-all mt-4 border border-white/10">بث الرسالة الآن</button>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">الرسائل النشطة حالياً ({allOfficialMsgs.length})</p>
              {allOfficialMsgs.length === 0 ? (
                <div className="text-center py-20 opacity-20">
                  <i className="fas fa-bullhorn text-4xl mb-2"></i>
                  <p className="text-xs font-bold">لا توجد رسائل مرسلة حالياً</p>
                </div>
              ) : allOfficialMsgs.map(msg => (
                <div key={msg.id} className="bg-white/5 p-4 rounded-3xl border border-white/10 space-y-3 relative group animate-in fade-in transition-all overflow-hidden shadow-lg">
                  {msg.image && (
                    <div className="w-full h-32 rounded-2xl overflow-hidden mb-2">
                       <img src={msg.image} className="w-full h-full object-cover" alt="notification" />
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-white mb-1 line-clamp-1">{msg.title}</h4>
                      <p className="text-[10px] text-white/50 font-bold whitespace-pre-wrap line-clamp-2">{msg.desc}</p>
                    </div>
                    <button 
                      onClick={async () => {
                        if(confirm("هل تريد حقاً حذف هذه الرسالة من صندوق البريد لجميع التابعين؟")) {
                          await deleteDoc(doc(db, "officialNotifications", msg.id));
                        }
                      }}
                      className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 border border-red-600/30 flex items-center justify-center active:scale-90 transition-all ml-2"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                    <i className="far fa-clock text-[8px] text-white/20"></i>
                    <span className="text-[8px] font-bold text-white/20">
                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString('ar-EG-u-nu-latn', { numberingSystem: 'latn' }) : 'جاري التحميل...'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'news' && (
          <div className="space-y-6">
            <div className="bg-white/5 p-4 rounded-2xl space-y-3">
              <input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="العنوان" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs text-white outline-none" />
              <textarea value={newsDesc} onChange={e => setNewsDesc(e.target.value)} placeholder="الوصف" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs text-white outline-none h-20" />
              <button onClick={() => newsInputRef.current?.click()} className="w-full bg-white/10 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 text-white">{newsImage ? <i className="fas fa-check text-green-500"></i> : <i className="fas fa-image"></i>} اختر صورة</button>
              <button onClick={async () => {
                if (!newsTitle || !newsImage) return alert("أكمل البيانات");
                await addDoc(collection(db, "news"), { title: newsTitle, desc: newsDesc, image: newsImage, createdAt: serverTimestamp() });
                setNewsTitle(''); setNewsDesc(''); setNewsImage(null); alert("تم الإضافة");
              }} className="w-full bg-purple-600 py-3 rounded-xl text-xs font-black shadow-lg text-white">إضافة الخبر</button>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">الأخبار الحالية ({allNews.length})</p>
              <div className="grid grid-cols-1 gap-4">
                {allNews.map(item => (
                  <div key={item.id} className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/5 group shadow-xl flex gap-4 p-4 text-right">
                    {item.image && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/40 flex-shrink-0">
                        <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-start min-w-0">
                      <h4 className="text-xs font-black text-white truncate">{item.title}</h4>
                      {item.desc && <p className="text-[10px] font-bold text-white/60 mt-1 line-clamp-2 leading-relaxed">{item.desc}</p>}
                      <span className="text-[8px] font-bold text-white/30 mt-auto pt-2 block">
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('ar-EG-u-nu-latn', { numberingSystem: 'latn' }) : 'جاري التحميل...'}
                      </span>
                    </div>
                    <button 
                      onClick={async () => { 
                        if(confirm("هل أنت متأكد من حذف هذا الخبر؟")) {
                          try {
                            await deleteDoc(doc(db, "news", item.id));
                            alert("تم الحذف بنجاح.");
                          } catch (e: any) {
                            console.error("Error deleting news:", e);
                            alert("حدث خطأ أثناء حذف الخبر: " + (e.message || e));
                          }
                        }
                      }} 
                      className="absolute top-4 left-4 w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center lg:opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90"
                    >
                      <i className="fas fa-trash-alt text-[10px]"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'banners' && (
          <div className="space-y-6">
             <div className="bg-white/5 p-4 rounded-2xl space-y-3">
                <input value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} placeholder="عنوان البنر" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs text-white outline-none" />
                <button onClick={() => bannerInputRef.current?.click()} className="w-full aspect-video bg-white/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/10 overflow-hidden">{bannerImage ? <img src={bannerImage} className="w-full h-full object-cover" /> : <i className="fas fa-plus text-2xl opacity-20 text-white"></i>}</button>
                <button onClick={async () => {
                  if (!bannerImage) return alert("اختر صورة");
                  await addDoc(collection(db, "banners"), { title: bannerTitle, imageUrl: bannerImage, createdAt: serverTimestamp() });
                  setBannerTitle(''); setBannerImage(null); alert("تم الإضافة");
                }} className="w-full bg-purple-600 py-3 rounded-xl text-xs font-black shadow-lg text-white">إضافة البنر</button>
             </div>
             <div className="space-y-4">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">البنرات الحالية ({allBanners.length})</p>
              <div className="grid grid-cols-1 gap-4">{allBanners.map(banner => (
                  <div key={banner.id} className="relative aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/5 group shadow-xl"><img src={banner.imageUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end"><p className="text-xs font-black text-white">{banner.title}</p></div><button onClick={async () => { 
                    if(confirm("حذف؟")) {
                      try {
                        await deleteDoc(doc(db, "banners", banner.id));
                        alert("تم الحذف بنجاح.");
                      } catch (e: any) {
                        console.error("Error deleting banner:", e);
                        alert("حدث خطأ أثناء حذف البنر: " + (e.message || e));
                      }
                    }
                  }} className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90"><i className="fas fa-trash-alt text-[10px]"></i></button></div>
                ))}</div>
            </div>
          </div>
        )}

        {adminTab === 'bgs' && (
          <div className="space-y-8">
            <div className="bg-white/5 p-4 rounded-2xl space-y-3 border border-white/5 shadow-xl">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">إضافة خلفية غرفة مجانية</p>
              <button onClick={() => roomBgInputRef.current?.click()} className="w-full aspect-[9/16] bg-white/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/10 overflow-hidden group">{roomBgImage ? <img src={roomBgImage} className="w-full h-full object-cover" /> : <i className="fas fa-plus text-2xl opacity-20 text-white group-hover:opacity-40 transition-opacity"></i>}</button>
              <button onClick={async () => {
                if (!roomBgImage) return alert("اختر صورة");
                await addDoc(collection(db, "roomBackgrounds"), { imageUrl: roomBgImage, createdAt: serverTimestamp() });
                setRoomBgImage(null); alert("تم الإضافة");
              }} className="w-full bg-purple-600 py-3 rounded-xl text-xs font-black text-white shadow-lg active:scale-95 transition-transform">إضافة الخلفية للغرف</button>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-1">الخلفيات المجانية الحالية ({allRoomBgs.length})</p>
              <div className="grid grid-cols-3 gap-2">{allRoomBgs.map(bg => (
                  <div key={bg.id} className="relative aspect-[9/16] rounded-xl overflow-hidden bg-white/5 border border-white/5 group shadow-lg">{isVideoUrl(bg.imageUrl) ? <video src={bg.imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={bg.imageUrl} className="w-full h-full object-cover" />}<button onClick={async () => { 
                    if(confirm("حذف؟")) {
                      try {
                        await deleteDoc(doc(db, "roomBackgrounds", bg.id));
                        alert("تم الحذف بنجاح.");
                      } catch (e: any) {
                        console.error("Error deleting room background:", e);
                        alert("حدث خطأ أثناء حذف الخلفية: " + (e.message || e));
                      }
                    }
                  }} className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-lg active:scale-90"><i className="fas fa-trash-alt text-[10px]"></i></button></div>
                ))}</div>
            </div>
          </div>
        )}

        {adminTab === 'mainImages' && (
          <div className="space-y-8 animate-in fade-in pb-10">
            {/* Section 1: Default User Profile & Cover Images */}
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl">
              <h4 className="text-sm font-black text-white flex items-center gap-2 mb-2">
                <i className="fas fa-user-circle text-purple-400"></i>
                إعداد الصور الافتراضية للمستخدمين
              </h4>
              <p className="text-[10px] text-white/40 font-bold -mt-2 pr-2">
                هذه الصور ستوضع تلقائياً لأي مستخدم جديد لا يقوم باختيار صور خاصة به
              </p>

              <div className="grid grid-cols-1 gap-6">
                {/* Default Profile Image */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">الصورة الشخصية الافتراضية</label>
                  <div className="flex flex-col items-center gap-4">
                    <button onClick={() => profileImageInputRef.current?.click()} className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden bg-black/20 group hover:border-purple-500/40 transition-all">
                      {defaultProfileImage ? <img src={defaultProfileImage} className="w-full h-full object-cover" /> : <i className="fas fa-plus text-white/20"></i>}
                    </button>
                    <input 
                      type="text" 
                      value={defaultProfileImage || ''} 
                      onChange={e => setDefaultProfileImage(e.target.value)} 
                      placeholder="رابط الصورة الشخصية..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-[10px] text-white outline-none font-mono" 
                    />
                  </div>
                </div>

                {/* Default Cover Image */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">صورة الغلاف الافتراضية</label>
                  <div className="flex flex-col items-center gap-4">
                    <button onClick={() => coverImageInputRef.current?.click()} className="w-full h-32 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden bg-black/20 group hover:border-purple-500/40 transition-all">
                      {defaultCoverImage ? <img src={defaultCoverImage} className="w-full h-full object-cover" /> : <i className="fas fa-plus text-white/20"></i>}
                    </button>
                    <input 
                      type="text" 
                      value={defaultCoverImage || ''} 
                      onChange={e => setDefaultCoverImage(e.target.value)} 
                      placeholder="رابط صورة الغلاف..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-[10px] text-white outline-none font-mono" 
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveDefaultImages} 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-2xl font-black text-xs text-white shadow-xl active:scale-95 transition-transform border border-white/10 flex items-center justify-center gap-2"
              >
                <i className="fas fa-user-shield"></i>
                حفظ الصور الافتراضية فقط
              </button>
            </div>

            {/* Section 2: Login Page Theme, Logo and Wallpaper Design */}
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl">
              <h4 className="text-sm font-black text-white flex items-center gap-2 mb-2">
                <i className="fas fa-magic text-cyan-400"></i>
                مظهر وشعار صفحة تسجيل الدخول
              </h4>
              <p className="text-[10px] text-white/40 font-bold -mt-2 pr-2">
                هذه الإعدادات تتحكم بالشعار و الخلفية (صورة أو فيديو MP4 متحرك) لصفحة تسجيل الدخول للتطبيق
              </p>

              <div className="grid grid-cols-1 gap-6">
                {/* Login Logo Image */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mr-2">شعار صفحة تسجيل الدخول (فوق اسم البرنامج)</label>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center overflow-hidden bg-[#1a0b2e] shadow-xl p-0">
                      {loginLogoImage ? (
                        <img src={loginLogoImage} className="w-full h-full object-cover" alt="Login Logo" />
                      ) : (
                        <i className="fas fa-gamepad text-2xl text-white"></i>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={loginLogoImage || ''} 
                      onChange={e => setLoginLogoImage(e.target.value)} 
                      placeholder="رابط شعار صفحة تسجيل الدخول (مثال: PNG)..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-[10px] text-white outline-none font-mono" 
                    />
                  </div>
                </div>

                {/* Login Background Image/Video */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mr-2">خلفية صفحة تسجيل الدخول (صورة أو فيديو MP4 متحرك)</label>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-full h-32 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden bg-[#1a0b2e] relative shadow-inner">
                      {loginBgImage ? (
                        isVideoUrl(loginBgImage) ? (
                          <video src={loginBgImage} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={loginBgImage} className="w-full h-full object-cover" alt="Login Background" />
                        )
                      ) : (
                        <span className="text-[10px] text-white/20 font-bold">الخلفية الافتراضية للتطبيق</span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={loginBgImage || ''} 
                      onChange={e => setLoginBgImage(e.target.value)} 
                      placeholder="رابط خلفية صفحة تسجيل الدخول (صورة أو فيديو MP4)..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-[10px] text-white outline-none font-mono" 
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveLoginSettings} 
                className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 py-4 rounded-2xl font-black text-xs text-white shadow-xl active:scale-95 transition-transform border border-white/10 flex items-center justify-center gap-2"
              >
                <i className="fas fa-paint-brush"></i>
                حفظ مظهر وتسجيل الدخول فقط
              </button>
            </div>
          </div>
        )}

        {adminTab === 'design' && (
          <div className="space-y-6">
            <div className="bg-white/5 p-5 rounded-[2rem] border border-white/10 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center"><p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">تخصيص أيقونات الميكروفونات والكروت</p></div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2"><label className="text-[9px] font-bold text-white/40 mr-2 uppercase tracking-tighter">أيقونة المايك المفتوح</label><button onClick={() => micOpenInputRef.current?.click()} className="w-full h-16 bg-black/40 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center overflow-hidden transition-all hover:bg-black/60">{micOpenIcon ? <img src={micOpenIcon} className="h-10 w-10 object-contain" /> : <i className="fas fa-plus text-white/20"></i>}</button></div>
                <div className="space-y-2"><label className="text-[9px] font-bold text-white/40 mr-2 uppercase tracking-tighter">أيقونة المايك المغلق (Lock)</label><button onClick={() => micLockedInputRef.current?.click()} className="w-full h-16 bg-black/40 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center overflow-hidden transition-all hover:bg-black/60">{micLockedIcon ? <img src={micLockedIcon} className="h-10 w-10 object-contain" /> : <i className="fas fa-plus text-white/20"></i>}</button></div>
                
                {/* Wave Room Feature */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">Wave room (أيقونة الموجات الصوتية)</label>
                  <div className="space-y-3">
                    <button onClick={() => waveRoomInputRef.current?.click()} className="w-full h-16 bg-black/40 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center overflow-hidden transition-all hover:bg-black/60">
                      {waveRoomIcon ? <img src={waveRoomIcon} className="h-full object-contain" alt="wave" /> : <div className="flex flex-col items-center opacity-20"><i className="fas fa-wave-square mb-1"></i><span className="text-[8px] font-black uppercase">اختر الأيقونة</span></div>}
                    </button>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-white/20 ml-2 uppercase">أو ضع رابط الموجات هنا</label>
                      <input 
                        type="text" 
                        value={waveRoomIcon || ''} 
                        onChange={e => setWaveRoomIcon(e.target.value)} 
                        placeholder="https://..." 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[10px] text-white outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Gift Button Customization */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">أيقونة زر الهدايا</label>
                  <div className="space-y-3">
                    <button onClick={() => giftButtonInputRef.current?.click()} className="w-full h-16 bg-black/40 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center overflow-hidden transition-all hover:bg-black/60">
                      {giftButtonIcon ? <img src={giftButtonIcon} className="h-10 w-10 object-contain" alt="gift" /> : <div className="flex flex-col items-center opacity-20"><i className="fas fa-gift mb-1 text-xl"></i><span className="text-[8px] font-black uppercase">اختر الأيقونة</span></div>}
                    </button>
                    <input 
                      type="file" 
                      ref={giftButtonInputRef} 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageSelect(e, setGiftButtonIcon)} 
                    />
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-white/20 ml-2 uppercase">أو ضع رابط الأيقونة هنا</label>
                      <input 
                        type="text" 
                        value={giftButtonIcon || ''} 
                        onChange={e => setGiftButtonIcon(e.target.value)} 
                        placeholder="https://..." 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[10px] text-white outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>
              <button onClick={saveDesignSettings} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-2xl font-black text-xs text-white shadow-xl active:scale-95 transition-transform border border-white/10">حفظ التغييرات</button>
            </div>
          </div>
        )}
      </div>

      {showChargePopup && (
        <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"><div className="bg-[#1a0b2e] w-full max-w-[280px] rounded-[2rem] border border-white/10 p-6 shadow-2xl flex flex-col gap-4"><h4 className="text-sm font-black text-white text-center">شحن كوينز</h4><input type="number" value={chargeAmount} onChange={e => setChargeAmount(e.target.value)} placeholder="الكمية..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none text-center" /><div className="flex gap-2"><button onClick={handleChargeSubmit} className="flex-1 bg-green-600 py-3 rounded-xl text-[10px] font-black text-white">تأكيد</button><button onClick={() => setShowChargePopup(null)} className="flex-1 bg-white/5 py-3 rounded-xl text-[10px] font-black text-white border border-white/10">إلغاء</button></div></div></div>
      )}

      {showDeductPopup && (
        <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowDeductPopup(null)}>
          <div className="bg-[#1a0b2e] w-full max-w-[280px] rounded-[2.5rem] border border-white/10 p-6 shadow-2xl flex flex-col gap-5" onClick={e => e.stopPropagation()}>
            <h4 className="text-sm font-black text-white text-center">خصم كوينز</h4>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-orange-400/60 mr-2 uppercase tracking-widest">عدد الكوينز المراد خصمها</label>
              <input type="number" value={deductAmount} onChange={e => setDeductAmount(e.target.value)} placeholder="المبلغ..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-xs text-white outline-none text-center shadow-inner" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleDeductSubmit} className="flex-1 bg-orange-600 py-3.5 rounded-xl text-[11px] font-black text-white shadow-lg active:scale-95 transition-all">سحب الرصيد</button>
              <button onClick={() => { setShowDeductPopup(null); setDeductAmount(''); }} className="flex-1 bg-white/5 py-3.5 rounded-xl text-[11px] font-black text-white border border-white/10 active:scale-95 transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showIdPopup && (
        <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6" onClick={() => setShowIdPopup(null)}>
          <div className="bg-[#1a0b2e] w-full max-w-[350px] rounded-[2.5rem] border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col gap-5 overflow-y-auto max-h-[92vh] scrollbar-hide" onClick={e => e.stopPropagation()}>
            <h4 className="text-sm font-black text-white text-center font-['Cairo'] tracking-tight">تصميم وتعديل الـ ID المخصص</h4>
            
            <div className="bg-black/40 rounded-[2rem] border border-white/5 p-4 flex flex-col items-center justify-center gap-5 relative overflow-hidden min-h-[190px] py-6 select-none">
               <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent"></div>
               
               {/* Profile Page Preview */}
               <div 
                 onClick={() => setActiveIdTab('profile')}
                 className={`flex flex-col items-center gap-1.5 z-10 p-2.5 rounded-xl transition-all duration-300 w-full cursor-pointer ${activeIdTab === 'profile' ? 'bg-purple-500/10 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'opacity-40 border border-transparent hover:opacity-60'}`}
               >
                 <p className="text-[7.5px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
                   {activeIdTab === 'profile' && <span className="w-1 h-1 rounded-full bg-purple-500 animate-ping"></span>}
                   معاينة البروفايل (90 × 28)
                 </p>
                 {newCustomIdIcon ? (
                   <div className="relative w-[90px] h-[28px] flex items-center bg-contain bg-center bg-no-repeat transition-all" style={{ backgroundImage: `url(${newCustomIdIcon})` }}>
                       <span className="font-black text-white tracking-widest text-center w-full block drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" 
                             style={{ 
                               paddingLeft: `${profileIdOffsetX}px`, 
                               paddingTop: `${profileIdOffsetY}px`,
                               fontSize: `${profileIdFontSize}px`
                             }}>
                         {newCustomId || 'ID PREVIEW'}
                       </span>
                    </div>
                 ) : (
                   <span className="text-blue-400 font-black text-[9px] px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">{newCustomId || 'ID PREVIEW'}</span>
                 )}
               </div>

               {/* Voice Room Preview */}
               <div 
                 onClick={() => setActiveIdTab('room')}
                 className={`flex flex-col items-center gap-1.5 z-10 p-2.5 rounded-xl transition-all duration-300 w-full cursor-pointer ${activeIdTab === 'room' ? 'bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'opacity-40 border border-transparent hover:opacity-60'}`}
               >
                 <p className="text-[7.5px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                   {activeIdTab === 'room' && <span className="w-1 h-1 rounded-full bg-cyan-500 animate-ping"></span>}
                   معاينة الغرفة (70 × 22)
                 </p>
                 {newCustomIdIcon ? (
                   <div className="relative w-[70px] h-[22px] flex items-center bg-contain bg-center bg-no-repeat transition-all" style={{ backgroundImage: `url(${newCustomIdIcon})` }}>
                       <span className="font-black text-white tracking-widest text-center w-full block drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" 
                             style={{ 
                               paddingLeft: `${roomIdOffsetX}px`, 
                               paddingTop: `${roomIdOffsetY}px`,
                               fontSize: `${roomIdFontSize}px`
                             }}>
                         {newCustomId || 'ID PREVIEW'}
                       </span>
                    </div>
                 ) : (
                   <span className="text-blue-400 font-black text-[7.5px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/10">{newCustomId || 'ID PREVIEW'}</span>
                 )}
               </div>
            </div>

            <div className="space-y-4">
               {/* Inputs on separate rows to guarantee zero horizontal overflow */}
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400/60 mr-1 uppercase">الهوية النصية (ID)</label>
                  <input type="text" value={newCustomId} onChange={e => setNewCustomId(e.target.value)} placeholder="ادخل النص هنا..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none font-black shadow-inner" />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400/60 mr-1 uppercase">رابط أيقونة الـ ID (PNG)</label>
                  <div className="flex gap-2">
                    <input type="text" value={newCustomIdIcon || ''} onChange={e => setNewCustomIdIcon(e.target.value)} placeholder="رابط مباشر للصورة..." className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[10px] text-white outline-none font-mono" />
                    <button onClick={() => idIconInputRef.current?.click()} className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 active:scale-90"><i className="fas fa-camera"></i></button>
                  </div>
               </div>

               {/* Segmented Selection with visual premium icons */}
               <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 w-full">
                 <button 
                   type="button" 
                   onClick={() => setActiveIdTab('profile')} 
                   className={`flex-1 py-2 rounded-lg text-[9.5px] font-black transition-all duration-300 ${activeIdTab === 'profile' ? 'bg-purple-600 text-white shadow-md font-extrabold' : 'text-white/40 hover:text-white/60'}`}
                 >
                   <i className="fas fa-user-circle ml-1"></i> البروفايل
                 </button>
                 <button 
                   type="button" 
                   onClick={() => setActiveIdTab('room')} 
                   className={`flex-1 py-2 rounded-lg text-[9.5px] font-black transition-all duration-300 ${activeIdTab === 'room' ? 'bg-cyan-600 text-white shadow-md font-extrabold' : 'text-white/40 hover:text-white/60'}`}
                 >
                   <i className="fas fa-cube ml-1"></i> الغرفة
                 </button>
               </div>

               {/* Dedicated line for font-size to avoid any layout clamping and wrapping */}
               <div className="space-y-1.5">
                  <div className="flex justify-between items-center mr-1">
                    <label className="text-[9px] font-black text-purple-400/60 uppercase">حجم الخط</label>
                    <span className="text-[9px] font-bold text-white/40">
                      تعديل: <span className="text-purple-400 font-extrabold">{activeIdTab === 'profile' ? 'البروفايل' : 'الغرفة'}</span> ({activeIdTab === 'profile' ? profileIdFontSize : roomIdFontSize}px)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 h-[46px]">
                     <button 
                       type="button" 
                       onClick={() => {
                         if (activeIdTab === 'profile') {
                           setProfileIdFontSize(prev => Math.max(4, prev - 0.5));
                         } else {
                           setRoomIdFontSize(prev => Math.max(4, prev - 0.5));
                         }
                       }} 
                       className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 active:scale-90"
                     >
                       <i className="fas fa-minus text-[8px]"></i>
                     </button>
                     <input 
                       type="range" 
                       min="4" 
                       max="24" 
                       step="0.5" 
                       value={activeIdTab === 'profile' ? profileIdFontSize : roomIdFontSize} 
                       onChange={e => {
                         const val = parseFloat(e.target.value);
                         if (activeIdTab === 'profile') {
                           setProfileIdFontSize(val);
                         } else {
                           setRoomIdFontSize(val);
                         }
                       }} 
                       className="flex-1 accent-purple-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer" 
                     />
                     <button 
                       type="button" 
                       onClick={() => {
                         if (activeIdTab === 'profile') {
                           setProfileIdFontSize(prev => Math.min(24, prev + 0.5));
                         } else {
                           setRoomIdFontSize(prev => Math.min(24, prev + 0.5));
                         }
                       }} 
                       className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 active:scale-90"
                     >
                       <i className="fas fa-plus text-[8px]"></i>
                     </button>
                  </div>
               </div>

               {newCustomIdIcon && (
                 <div className="space-y-4 p-4 bg-black/50 rounded-2xl border border-white/5 flex flex-col items-center">
                    <label className="text-[9px] font-black text-white/30 uppercase block text-center mb-1">أزرار تحريك موضع النص</label>
                    <div className="flex flex-col items-center gap-2 relative p-4 bg-white/2 rounded-full border border-white/5">
                        {/* Up button */}
                        <button 
                          type="button"
                          onClick={() => {
                            if (activeIdTab === 'profile') {
                              setProfileIdOffsetY(prev => parseFloat((prev - 0.5).toFixed(1)));
                            } else {
                              setRoomIdOffsetY(prev => parseFloat((prev - 0.5).toFixed(1)));
                            }
                          }} 
                          className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center active:bg-purple-600 active:text-white transition-all transform active:scale-90 border border-white/10 shadow-lg"
                        >
                          <i className="fas fa-chevron-up text-xs"></i>
                        </button>
                        
                        {/* Middle row: Right, central indicator, Left */}
                        <div className="flex gap-10 items-center">
                           <button 
                             type="button"
                             onClick={() => {
                               if (activeIdTab === 'profile') {
                                 setProfileIdOffsetX(prev => parseFloat((prev - 0.5).toFixed(1)));
                               } else {
                                 setRoomIdOffsetX(prev => parseFloat((prev - 0.5).toFixed(1)));
                               }
                             }} 
                             className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center active:bg-purple-600 active:text-white transition-all transform active:scale-90 border border-white/10 shadow-lg"
                           >
                             <i className="fas fa-chevron-right text-xs"></i>
                           </button>
                           
                           {/* Decorative target center dot */}
                           <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex flex-col items-center justify-center text-[7.5px] font-black text-purple-400">
                             <span className="animate-pulse">{activeIdTab === 'profile' ? 'بروفايل' : 'غرفة'}</span>
                           </div>

                           <button 
                             type="button"
                             onClick={() => {
                               if (activeIdTab === 'profile') {
                                 setProfileIdOffsetX(prev => parseFloat((prev + 0.5).toFixed(1)));
                               } else {
                                 setRoomIdOffsetX(prev => parseFloat((prev + 0.5).toFixed(1)));
                               }
                             }} 
                             className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center active:bg-purple-600 active:text-white transition-all transform active:scale-90 border border-white/10 shadow-lg"
                           >
                             <i className="fas fa-chevron-left text-xs"></i>
                           </button>
                        </div>
                        
                        {/* Down button */}
                        <button 
                          type="button"
                          onClick={() => {
                            if (activeIdTab === 'profile') {
                              setProfileIdOffsetY(prev => parseFloat((prev + 0.5).toFixed(1)));
                            } else {
                              setRoomIdOffsetY(prev => parseFloat((prev + 0.5).toFixed(1)));
                            }
                          }} 
                          className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center active:bg-purple-600 active:text-white transition-all transform active:scale-90 border border-white/10 shadow-lg"
                        >
                          <i className="fas fa-chevron-down text-xs"></i>
                        </button>
                    </div>
                    <div className="flex justify-between w-full mt-2 px-4">
                       <span className="text-[9px] font-bold text-purple-400/60">
                         X: <span className="font-mono">{activeIdTab === 'profile' ? profileIdOffsetX : roomIdOffsetX}</span>
                       </span>
                       <span className="text-[9px] font-bold text-purple-400/60">
                         Y: <span className="font-mono">{activeIdTab === 'profile' ? profileIdOffsetY : roomIdOffsetY}</span>
                       </span>
                    </div>
                 </div>
               )}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleIdUpdateSubmit} className="flex-1 bg-purple-600 hover:bg-purple-700 py-3.5 rounded-2xl text-[11px] font-black text-white shadow-lg active:scale-95 transition-all font-['Cairo']">حفظ وتطبيق</button>
              <button onClick={() => { setShowIdPopup(null); setNewCustomIdIcon(null); }} className="flex-1 bg-white/5 py-4 rounded-2xl text-[11px] font-black text-white border border-white/10 active:scale-95 transition-all font-['Cairo']">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showGrantPopup && (
        <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowGrantPopup(null)}>
          <div className="bg-[#1a0b2e] w-full max-w-[340px] rounded-[2.5rem] border border-white/10 p-6 shadow-2xl flex flex-col gap-5 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <h4 className="text-sm font-black text-white text-center">منح عنصر مخصص للمستخدم</h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['frame', 'entry', 'background'].map((t) => (
                  <button key={t} onClick={() => setGrantType(t as any)} className={`py-2 rounded-xl text-[10px] font-black transition-all border ${grantType === t ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 text-white/30 border-white/10'}`}>
                    {t === 'frame' ? 'إطار' : t === 'entry' ? 'دخولية' : 'خلفية'}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-purple-400/60 uppercase mr-1">اسم العنصر</label>
                <input type="text" value={grantName} onChange={e => setGrantName(e.target.value)} placeholder="مثلاً: التاج الملكي..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none shadow-inner" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-purple-400/60 uppercase mr-1">رابط الملف (Gif/Mp4)</label>
                <input type="text" value={grantUrl} onChange={e => setGrantUrl(e.target.value)} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[10px] text-white outline-none font-mono shadow-inner" />
              </div>

              {grantType === 'entry' && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-purple-400/60 uppercase mr-1">صورة معاينة الدخولية</label>
                  <div className="flex gap-2">
                    <input type="text" value={grantPreview || ''} onChange={e => setGrantPreview(e.target.value)} placeholder="رابط صورة PNG..." className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[10px] text-white outline-none font-mono" />
                    <button onClick={() => grantPreviewInputRef.current?.click()} className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 active:scale-90"><i className="fas fa-camera"></i></button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-purple-400/60 uppercase mr-1">المدة (بالأيام)</label>
                <input type="number" value={grantDuration} onChange={e => setGrantDuration(e.target.value)} placeholder="7" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none shadow-inner" />
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2 border-t border-white/5 pt-4">
              <p className="text-[11px] font-black text-white/80 bg-white/5 p-2 rounded-xl text-center">حقيبة المستخدم (العناصر الحالية)</p>
              
              {/* قسم الإطارات - يظهر فقط عند اختيار إطار */}
              {grantType === 'frame' && (
                <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">الإطارات الحالية ({userInventory.filter(i => i.type === 'frame').length})</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1 scrollbar-hide">
                    {userInventory.filter(i => i.type === 'frame').map(item => (
                      <div key={item.id} className="relative aspect-square bg-white/5 rounded-xl border border-white/5 p-1 flex items-center justify-center group shadow-lg">
                        <div className="w-full h-full relative flex items-center justify-center">
                          <div className="w-2/3 h-2/3 rounded-full bg-white/5 border border-white/20"></div>
                          <img src={item.imageUrl} className="absolute inset-0 w-full h-full object-contain" />
                        </div>
                        <button 
                          onClick={() => handleRemoveInventoryItem(item.id, item.imageUrl, 'frame')}
                          className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-xl z-20"
                        >
                          <i className="fas fa-trash text-white text-xs"></i>
                        </button>
                      </div>
                    ))}
                    {userInventory.filter(i => i.type === 'frame').length === 0 && <div className="col-span-4 text-center py-2 opacity-20 text-[8px] font-bold text-white/50">لا توجد إطارات في حقيبة المستخدم</div>}
                  </div>
                </div>
              )}

              {/* قسم الدخوليات - يظهر فقط عند اختيار دخولية */}
              {grantType === 'entry' && (
                <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">الدخوليات الحالية ({userInventory.filter(i => i.type === 'entry').length})</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1 scrollbar-hide">
                    {userInventory.filter(i => i.type === 'entry').map(item => (
                      <div key={item.id} className="relative aspect-square bg-white/5 rounded-xl border border-white/5 p-1 flex items-center justify-center group shadow-lg overflow-hidden">
                        <img src={item.previewImage || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%232e1a4a'/><path d='M30 40l40 10-40 10z' fill='%23ffffff' fill-opacity='0.4'/></svg>"} className="w-full h-full object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <i className="fas fa-play text-[8px] text-white/50"></i>
                        </div>
                        <button 
                          onClick={() => handleRemoveInventoryItem(item.id, item.videoUrl || item.imageUrl, 'entry')}
                          className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-xl z-20"
                        >
                          <i className="fas fa-trash text-white text-xs"></i>
                        </button>
                      </div>
                    ))}
                    {userInventory.filter(i => i.type === 'entry').length === 0 && <div className="col-span-4 text-center py-2 opacity-20 text-[8px] font-bold text-white/50">لا توجد دخوليات في حقيبة المستخدم</div>}
                  </div>
                </div>
              )}

              {/* قسم الخلفيات - يظهر فقط عند اختيار خلفية */}
              {grantType === 'background' && (
                <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">خلفيات الغرفة الحالية ({userInventory.filter(i => i.type === 'background').length})</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1 scrollbar-hide">
                    {userInventory.filter(i => i.type === 'background').map(item => (
                      <div key={item.id} className="relative aspect-square bg-white/5 rounded-xl border border-white/5 p-1 flex items-center justify-center group shadow-lg overflow-hidden">
                        <img src={item.imageUrl} className="w-full h-full object-cover rounded-lg" />
                        <button 
                          onClick={() => handleRemoveInventoryItem(item.id, item.imageUrl, 'background')}
                          className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-xl z-20"
                        >
                          <i className="fas fa-trash text-white text-xs"></i>
                        </button>
                      </div>
                    ))}
                    {userInventory.filter(i => i.type === 'background').length === 0 && <div className="col-span-4 text-center py-2 opacity-20 text-[8px] font-bold text-white/50">لا توجد خلفيات في حقيبة المستخدم</div>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleGrantItem} 
                disabled={isPublishing}
                className="flex-1 bg-purple-600 py-4 rounded-2xl text-[11px] font-black text-white shadow-lg active:scale-95 transition-all"
              >
                {isPublishing ? <i className="fas fa-spinner animate-spin"></i> : 'منح العنصر الآن'}
              </button>
              <button onClick={() => setShowGrantPopup(null)} className="flex-1 bg-white/5 py-4 rounded-2xl text-[11px] font-black text-white border border-white/10 active:scale-95 transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showGrantAnimatedPopup && (
        <div className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowGrantAnimatedPopup(null)}>
          <div className="bg-[#1a0b2e] w-full max-w-[300px] rounded-[2rem] border border-white/10 p-5 shadow-2xl flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-500 mx-auto mb-2 border border-pink-500/20 shadow-lg"><i className="fas fa-image text-xl"></i></div>
              <h4 className="text-sm font-black text-white">إدارة الصورة المتحركة</h4>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">تظهر على المايك والبروفايل</p>
            </div>
            
            <div className="space-y-2">
              <div className="w-full h-32 rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex flex-col items-center justify-center relative">
                {animatedUrl.trim() ? (
                  isVideoUrl(animatedUrl) ? (
                    <video src={animatedUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={animatedUrl} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="opacity-20 flex flex-col items-center gap-1">
                    <i className="fas fa-image text-2xl"></i>
                    <p className="text-[8px] font-black uppercase">معاينة حية</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="text-[8px] font-black text-pink-400/60 mr-1 uppercase">رابط الصورة (GIF/MP4)</label>
                <input type="text" value={animatedUrl} onChange={e => setAnimatedUrl(e.target.value)} placeholder="ضع الرابط هنا..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-[10px] text-white outline-none font-mono shadow-inner" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <button onClick={handleGrantAnimatedAvatar} disabled={isPublishing} className="w-full bg-pink-600 py-3 rounded-xl text-[10px] font-black text-white shadow-lg active:scale-95 transition-all">
                {isPublishing ? <i className="fas fa-spinner animate-spin"></i> : (animatedUrl.trim() ? 'حفظ وتحديث' : 'منح الآن')}
              </button>
              {allUsers.find(u => u.id === showGrantAnimatedPopup)?.animatedAvatar && (
                <button 
                  onClick={() => { setAnimatedUrl(''); setTimeout(handleGrantAnimatedAvatar, 100); }} 
                  disabled={isPublishing} 
                  className="w-full bg-red-600/20 text-red-400 py-2.5 rounded-xl text-[10px] font-black border border-red-600/30 active:scale-95 transition-all"
                >
                  حذف الصورة الحالية
                </button>
              )}
              <button onClick={() => setShowGrantAnimatedPopup(null)} className="w-full bg-white/5 py-2 rounded-xl text-[10px] font-black text-white border border-white/10 active:scale-95 transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showRoomCoverPopup && (
        <div className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowRoomCoverPopup(null)}>
          <div className="bg-[#1a0b2e] w-full max-w-[300px] rounded-[2rem] border border-white/10 p-5 shadow-2xl flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500 mx-auto mb-2 border border-purple-500/20 shadow-lg"><i className="fas fa-magic text-xl"></i></div>
              <h4 className="text-sm font-black text-white">غلاف الغرفة المتحرك</h4>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">تغيير مظهر الغرفة العام</p>
            </div>
            
            <div className="space-y-2">
              <div className="w-full h-32 rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex flex-col items-center justify-center relative">
                {animatedRoomCoverUrl.trim() ? (
                  isVideoUrl(animatedRoomCoverUrl) ? (
                    <video src={animatedRoomCoverUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={animatedRoomCoverUrl} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="opacity-20 flex flex-col items-center gap-1">
                    <i className="fas fa-film text-2xl"></i>
                    <p className="text-[8px] font-black uppercase">معاينة الغلاف</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="text-[8px] font-black text-purple-400/60 mr-1 uppercase">رابط الغلاف (GIF/MP4)</label>
                <input type="text" value={animatedRoomCoverUrl} onChange={e => setAnimatedRoomCoverUrl(e.target.value)} placeholder="ضع رابط الغلاف هنا..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-[10px] text-white outline-none font-mono shadow-inner" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <button onClick={handleSetAnimatedRoomCover} disabled={isPublishing} className="w-full bg-purple-600 py-3 rounded-xl text-[10px] font-black text-white shadow-lg active:scale-95 transition-all">
                {isPublishing ? <i className="fas fa-spinner animate-spin"></i> : 'تحديث غلاف الغرفة'}
              </button>
              <button onClick={() => setShowRoomCoverPopup(null)} className="w-full bg-white/5 py-2 rounded-xl text-[10px] font-black text-white border border-white/10 active:scale-95 transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showBadgesPopup && (
        <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowBadgesPopup(null)}>
          <div className="bg-[#1a0b2e] w-full max-w-[380px] max-h-[80vh] rounded-[2.5rem] border border-white/10 p-6 shadow-2xl flex flex-col gap-6 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h4 className="text-sm font-black text-white">إدارة شارات المستخدم</h4>
              <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">تظهر في بروفايل المستخدم</p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={badgeUrl} 
                  onChange={e => setBadgeUrl(e.target.value)} 
                  placeholder="رابط الشارة (PNG)..." 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[10px] text-white outline-none font-mono"
                />
                <button 
                  onClick={handleGiveBadge}
                  disabled={isPublishing}
                  className="px-4 bg-emerald-600 rounded-xl text-[10px] font-black text-white shadow-lg disabled:opacity-50"
                >
                  {isPublishing ? <i className="fas fa-spinner animate-spin"></i> : 'منح'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-hide">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">الشارات الحالية ({userBadges.length})</p>
              <div className="grid grid-cols-4 gap-3">
                {userBadges.map(badge => (
                  <div key={badge.id} className="relative aspect-square bg-white/5 rounded-xl border border-white/5 p-2 flex items-center justify-center group overflow-hidden">
                    <img src={badge.imageUrl} className="w-full h-full object-contain" />
                    <button 
                      onClick={() => handleRemoveBadge(badge.id)}
                      className="absolute inset-0 bg-red-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                    >
                      <i className="fas fa-trash text-white text-xs"></i>
                    </button>
                  </div>
                ))}
                {userBadges.length === 0 && (
                  <div className="col-span-4 text-center py-6 opacity-20">
                    <p className="text-[10px] font-bold">لا توجد شارات لدى المستخدم</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => setShowBadgesPopup(null)} className="w-full py-3 bg-white/5 text-white/40 rounded-xl text-[10px] font-black border border-white/10">إغلاق</button>
          </div>
        </div>
      )}

      <style>{`
        .animate-pulse-slow { animation: pulse 2s infinite ease-in-out; }
        @keyframes pulse { 0%, 100% { transform: scale(1.1); } 50% { transform: scale(1.15); } }
      `}</style>
    </div>
  );
};
