import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { auth, db } from '../firebase';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

interface CarnivalEventPageProps {
  onBack: () => void;
  userData: any;
  carnivalSettings?: any;
}

export const CarnivalEventPage: React.FC<CarnivalEventPageProps> = ({ onBack, userData, carnivalSettings }) => {
  const { language, t } = useLanguage();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  
  // Parse last claim time robustly
  const getLastClaimTime = () => {
    if (!userData || !userData.lastCarnivalClaim) return 0;
    const lcc = userData.lastCarnivalClaim;
    if (typeof lcc.toDate === 'function') {
      return lcc.toDate().getTime();
    }
    if (lcc instanceof Date) {
      return lcc.getTime();
    }
    if (typeof lcc === 'number') {
      return lcc;
    }
    if (typeof lcc === 'string') {
      return new Date(lcc).getTime();
    }
    if (lcc.seconds) {
      return lcc.seconds * 1000;
    }
    return 0;
  };

  const lastClaim = getLastClaimTime();
  const timeSinceLastClaim = Date.now() - lastClaim;
  const canClaim = !lastClaim || timeSinceLastClaim >= 86400000;

  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (canClaim) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const diff = 86400000 - (Date.now() - getLastClaimTime());
      if (diff <= 0) {
        setTimeLeft(0);
      } else {
        setTimeLeft(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [userData, canClaim]);

  const formatCountdown = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Calculate remaining time for the 60-day carnival event
  const getEventTimeLeft = () => {
    let target = new Date("2026-08-07T12:00:00Z").getTime();
    if (carnivalSettings?.endTime) {
      const et = carnivalSettings.endTime;
      if (typeof et.toDate === 'function') target = et.toDate().getTime();
      else if (et instanceof Date) target = et.getTime();
      else if (typeof et === 'number') target = et;
      else if (typeof et === 'string') target = new Date(et).getTime();
      else if (et.seconds) target = et.seconds * 1000;
    }
    const diff = target - Date.now();
    return diff > 0 ? diff : 0;
  };

  const [eventTimeLeft, setEventTimeLeft] = useState<number>(getEventTimeLeft());

  useEffect(() => {
    const updateEventTimer = () => {
      setEventTimeLeft(getEventTimeLeft());
    };
    updateEventTimer();
    const interval = setInterval(updateEventTimer, 1000);
    return () => clearInterval(interval);
  }, [carnivalSettings]);

  const formatEventCountdown = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return { days, hours, minutes, seconds };
  };

  const handleClaim = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert(t("رجاء تسجيل الدخول أولاً", "Please sign in first"));
      return;
    }

    if (!canClaim) return;

    setIsClaiming(true);
    try {
      const userRef = doc(db, "users", user.uid);
      
      const bonusCoins = 10000000; // 10,000,000 coins
      const updatedCoins = (userData?.coins || 0) + bonusCoins;

      await updateDoc(userRef, {
        coins: updatedCoins,
        lastCarnivalClaim: serverTimestamp()
      });

      // Add a system notification
      await addDoc(collection(db, "users", user.uid, "systemNotifications"), {
        title: t("مهرجان الافتتاح 🎉", "Opening Carnival 🎉"),
        desc: language === 'ar' 
          ? "لقد حصلت على مكافأة ترحيبية بقيمة 10 مليون عملة ذهبية مجاناً! استمتع بوقتك في يلا بارتي."
          : "You received a free welcome bonus of 10,000,000 Gold Coins! Enjoy your time in Yalla Party.",
        createdAt: serverTimestamp()
      });

      setClaimSuccess(true);
    } catch (error) {
      console.error("Error claiming carnival reward:", error);
      alert(t("حدث خطأ أثناء استلام المكافأة، حاول مجدداً", "Error claiming reward, please try again"));
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div 
      className="absolute inset-0 z-50 bg-[#0d041a] flex flex-col text-slate-200 overflow-hidden" 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {carnivalSettings?.isStopped && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div 
            className="bg-[#1a0b2e]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 w-full max-w-[300px] text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-4 animate-pulse">
              <i className="fas fa-ban text-2xl"></i>
            </div>
            <h4 className="text-white font-black text-sm mb-2">
              {t("تنبيه", "Warning")}
            </h4>
            <p className="text-white/60 text-[11px] leading-relaxed mb-6 font-bold">
              {t("عذراً تم ايقاف الحدث", "Sorry, the event has been stopped.")}
            </p>
            <button 
              onClick={onBack}
              className="w-full py-3 bg-purple-600 text-white text-xs font-black rounded-xl active:scale-95 transition-transform cursor-pointer"
            >
              {t("فهمت", "I understand")}
            </button>
          </div>
        </div>
      )}

      {/* Background layer with static slight zoom to ensure it fits completely and leaves no black edges */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat" 
          style={carnivalSettings?.backgroundUrl ? { 
            backgroundImage: `url(${carnivalSettings.backgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1.04)'
          } : {}}
        />
      </div>

      {/* Header - Transparent and integrated seamlessly into the background */}
      <header className="px-5 py-5 flex items-center gap-4 sticky top-0 bg-transparent z-20">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-white/10 text-white/90 active:scale-90 transition-transform backdrop-blur-sm shadow-lg cursor-pointer"
        >
          <i className={`fas ${language === 'ar' ? 'fa-chevron-right' : 'fa-chevron-left'} text-sm`}></i>
        </button>
        <div>
          <h2 className="text-sm font-black text-white drop-shadow-sm">{t("كرنفال الافتتاح الكبير", "Grand Opening Carnival")}</h2>
          <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest drop-shadow-sm">{t("مهرجان ترحيب خاص", "Special Welcome Event")}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 z-20 animate-in fade-in duration-500 pb-16">
        {/* Main Event Card - Less transparent (exactly 77% opacity), absolutely NO backdrop blur or smoke */}
        <div 
          className="border border-purple-500/15 rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col items-center text-center space-y-6"
          style={{ backgroundColor: 'rgba(24, 8, 41, 0.77)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/20 via-transparent to-transparent pointer-events-none" />

          <div className="space-y-2 mt-4">
            <h1 className="text-xl font-black text-white leading-tight">
              {t("مرحباً بك في يلا بارتي", "Welcome to Yalla Party")}
            </h1>
            <p className="text-[11px] text-white/50 leading-relaxed max-w-[280px]">
              {t(
                "احتفالاً بافتتاح التطبيق، نمنح جميع الأعضاء واللاعبين مكافأة تشجيعية ضخمة لدعم تواجدكم ومشاركتكم في الغرف الصوتية والمجتمع الراقية.",
                "To celebrate our grand opening, we present a generous welcome reward to all active members to support your interaction in rooms and games."
              )}
            </p>
          </div>

          {/* Event Master Countdown */}
          <div className="w-full space-y-2 mt-2">
            <p className="text-[10px] text-purple-300/80 font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
              {t("ينتهي الكرنفال الافتتاحي خلال", "GRAND CARNIVAL ENDS IN")}
            </p>
            <div className="flex items-center justify-center gap-1.5" dir="ltr">
              {(() => {
                const { days, hours, minutes, seconds } = formatEventCountdown(eventTimeLeft);
                const pad = (num: number) => String(num).padStart(2, '0');
                
                const timeUnits = [
                  { label: language === 'ar' ? 'يوم' : 'Days', val: days },
                  { label: language === 'ar' ? 'ساعة' : 'Hours', val: hours },
                  { label: language === 'ar' ? 'دقيقة' : 'Mins', val: minutes },
                  { label: language === 'ar' ? 'ثانية' : 'Secs', val: seconds },
                ];

                return timeUnits.map((unit, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="flex flex-col items-center justify-center bg-black/45 hover:bg-black/55 border border-purple-500/15 rounded-xl w-14 py-2 shadow-inner transition-colors">
                      <span className="text-lg font-black font-mono text-purple-200 tracking-tight leading-none">
                        {pad(unit.val)}
                      </span>
                      <span className="text-[8px] font-black text-purple-300/50 uppercase scale-90 tracking-widest mt-1">
                        {unit.label}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          <hr className="w-full border-white/5" />

          {/* Reward Amount Display */}
          <div className="space-y-1.5 w-full">
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
              {t("قيمة المكافأة الحالية", "CURRENT REWARD VALUE")}
            </p>
            <div className="bg-black/35 rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center space-y-1">
              <div className="flex items-center gap-3">
                <i className="fas fa-coins text-3xl text-yellow-500/85"></i>
                <span className="text-2xl font-black text-slate-200">
                  10,000,000
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">
                {t("عملة ذهبية مجانية كل 24 ساعة", "Free Gold Coins every 24 hours")}
              </p>
            </div>
          </div>

          {/* Timer Display above Claim Button */}
          {!canClaim && timeLeft > 0 && (
            <div className="space-y-1.5 w-full">
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                {t("الوقت المتبقي للمطالبة التالية", "TIME REMAINING UNTIL NEXT CLAIM")}
              </p>
              <div className="bg-black/30 rounded-xl py-2.5 px-5 flex items-center justify-center gap-2 font-mono text-sm font-black text-purple-300 border border-purple-500/10 inline-flex">
                <i className="fas fa-hourglass-half text-[11px]"></i>
                <span>{formatCountdown(timeLeft)}</span>
              </div>
            </div>
          )}

          {/* Action / Claim Area */}
          {claimSuccess ? (
            <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <i className="fas fa-check-circle text-lg"></i>
                <span className="text-xs font-black">{t("تم استلام 10,000,000 عملة بنجاح!", "10,000,000 Coins Claimed Successfully!")}</span>
              </div>
              <p className="text-[10px] text-white/50 leading-tight">
                {t("تمت إضافة الذهب إلى محفظتك وإرسال إشعار للنظام.", "Gold added to wallet. Please check your notification logs.")}
              </p>
            </div>
          ) : (
            <div className="w-full">
              {canClaim ? (
                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="w-full bg-purple-900/40 hover:bg-purple-900/50 text-purple-200 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-purple-500/10"
                >
                  {isClaiming ? (
                    <>
                      <i className="fas fa-spinner animate-spin text-xs"></i>
                      <span>{t("جاري معالجة طلبك...", "Processing claim...")}</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-gift text-sm opacity-85"></i>
                      <span>{t("احصل على الهدية الآن", "CLAIM THE GIFT NOW")}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full space-y-2">
                  <button
                    disabled
                    className="w-full bg-white/5 text-white/20 py-4 rounded-2xl font-black text-sm border border-white/5 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-lock text-xs"></i>
                    <span>{t("تم استلام مكافأة اليوم", "Today\'s reward already claimed")}</span>
                  </button>
                  <p className="text-[9px] text-purple-300/60 font-medium font-bold">
                    {t("* يرجى المتابعة اليومية للاستفادة الكاملة من الكرنفال", "* Track daily to fully benefit from the carnival prizes")}
                  </p>
                </div>
              )}
            </div>
          )}

          <hr className="w-full border-white/5" />

          {/* Event Rules / Extra info */}
          <div className="w-full text-start space-y-3">
            <h4 className="text-xs font-black text-white/95 flex items-center gap-2">
              <i className="fas fa-book-open text-purple-400 text-[10px]"></i>
              {t("شروط وقواعد المهرجان", "Carnival Event Rules")}
            </h4>
            <div className="text-[10px] text-white/40 space-y-2 leading-relaxed">
              <div className="flex gap-2 items-start">
                <span className="text-purple-500 font-bold">•</span>
                <p>{t("يمكن لجميع المستخدمين المسجلين الجدد والمخضرمين المطالبة بالمكافأة في أي وقت.", "All registered new and existing users are fully eligible to claim.")}</p>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-purple-500 font-bold">•</span>
                <p>{t("يتم تجديد الصلاحية تماماً كل 24 ساعة من تاريخ آخر عملية مطالبة للمستخدم.", "Eligibility resets exactly 24 hours after your last coin claim.")}</p>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-purple-500 font-bold">•</span>
                <p>{t("تطبيق يلا بارتي يحتفظ بالحق في إنهاء أو تمديد هذا الكرنفال الافتتاحي في أي وقت.", "Yalla Party reserve the rights to terminate or extend this opening carnival event anytime.")}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
