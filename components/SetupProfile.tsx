
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

interface SetupProfileProps {
  onComplete: () => void;
}

export const SetupProfile: React.FC<SetupProfileProps> = ({ onComplete }) => {
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [region, setRegion] = useState<{name: string, code: string, flag: string} | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [defaultImages, setDefaultImages] = useState<{profileImage?: string, coverImage?: string} | null>(null);

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "default_images"), (snap) => {
      if (snap.exists()) {
        setDefaultImages(snap.data());
      }
    });
    return unsub;
  }, []);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

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

  const generateRandomID = () => Math.floor(10000000 + Math.random() * 90000000).toString();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("يرجى اختيار صورة أقل من 1 ميجابايت");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !gender || !birthDate.day || !birthDate.month || !birthDate.year || !region) {
      alert("يرجى إكمال جميع البيانات بما في ذلك البلد");
      return;
    }

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const randomID = generateRandomID();
        const userData = {
          uid: user.uid,
          customId: randomID,
          displayName,
          gender,
          region: region.name,
          regionCode: region.code,
          regionFlag: region.flag,
          birthDate: `${birthDate.year}-${birthDate.month}-${birthDate.day}`,
          photoURL: imagePreview || defaultImages?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomID}`,
          headerURL: defaultImages?.coverImage || `https://picsum.photos/600/300?random=${randomID}`,
          email: user.email,
          password: sessionStorage.getItem('pending_password') || null,
          level: 1,
          coins: 0,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", user.uid), userData);
        await updateProfile(user, {
          displayName: displayName,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomID}`
        });
        sessionStorage.removeItem('pending_password');
        onComplete();
      }
    } catch (error) {
      alert("حدث خطأ في حفظ البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#1a0b2e] text-purple-50 p-6 flex flex-col items-center justify-center overflow-hidden relative" dir="rtl">
      {/* عناصر تزيين الخلفية */}
      <div className="absolute top-[-5%] right-[-10%] w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-[-5%] left-[-10%] w-64 h-64 bg-pink-600/10 rounded-full blur-[80px]"></div>

      <div className="w-full space-y-8 relative z-10">
        <div className="flex justify-between items-center">
          <div className="w-10"></div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white drop-shadow-lg">إكمال البيانات</h2>
            <p className="text-purple-400/60 text-[10px] font-black mt-2 uppercase tracking-[0.3em]">عالم الترفيه ينتظرك</p>
          </div>
          <button 
            onClick={() => auth.signOut()} 
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-red-400 active:scale-90"
            title="تسجيل الخروج"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <label className="relative cursor-pointer group">
            <div className="w-28 h-28 rounded-full bg-white/5 border-4 border-white/10 shadow-2xl flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 group-hover:border-purple-500/50">
              {imagePreview ? (
                <img src={imagePreview} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-purple-300/30">
                  <i className="fas fa-camera text-3xl mb-1"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">صورة</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <div className="absolute bottom-1 right-1 bg-gradient-to-tr from-purple-600 to-pink-500 w-9 h-9 rounded-full flex items-center justify-center border-4 border-[#1a0b2e] text-white text-xs shadow-lg">
              <i className="fas fa-plus"></i>
            </div>
          </label>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">الاسم المستعار</label>
            <input 
              type="text" 
              value={displayName}
              maxLength={15}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white outline-none focus:border-purple-500/40 transition-all shadow-inner placeholder:text-white/20"
              placeholder="اكتب اسمك هنا..."
            />
          </div>


          <div className="space-y-2">
            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">البلد / المنطقة</label>
            <button
              type="button"
              onClick={() => setShowCountryPicker(true)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white flex items-center justify-between hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                {region ? (
                  <>
                    <span className="text-xl">{region.flag}</span>
                    <span className="font-bold">{region.name}</span>
                  </>
                ) : (
                  <span className="text-white/20">اختر بلدك...</span>
                )}
              </div>
              <i className="fas fa-chevron-left text-[10px] text-white/30"></i>
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <select 
                value={birthDate.day}
                onChange={(e) => setBirthDate({...birthDate, day: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl py-3.5 px-2 outline-none text-xs text-purple-100 shadow-sm appearance-none text-center cursor-pointer focus:border-purple-500/40"
              >
                <option value="" disabled className="bg-[#1a0b2e]">اليوم</option>
                {days.map(d => <option key={d} value={d} className="bg-[#1a0b2e]">{d}</option>)}
              </select>
              <select 
                value={birthDate.month}
                onChange={(e) => setBirthDate({...birthDate, month: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl py-3.5 px-2 outline-none text-xs text-purple-100 shadow-sm appearance-none text-center cursor-pointer focus:border-purple-500/40"
              >
                <option value="" disabled className="bg-[#1a0b2e]">الشهر</option>
                {months.map(m => <option key={m} value={m} className="bg-[#1a0b2e]">{m}</option>)}
              </select>
              <select 
                value={birthDate.year}
                onChange={(e) => setBirthDate({...birthDate, year: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-xl py-3.5 px-2 outline-none text-xs text-purple-100 shadow-sm appearance-none text-center cursor-pointer focus:border-purple-500/40"
              >
                <option value="" disabled className="bg-[#1a0b2e]">السنة</option>
                {years.map(y => <option key={y} value={y} className="bg-[#1a0b2e]">{y}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mr-2">الجنس</label>
            <div className="flex justify-center gap-12 pt-2 pb-2">
              <div className="flex flex-col items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setGender('male')}
                  className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${gender === 'male' ? 'bg-blue-600/30 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                >
                  <i className="fas fa-mars text-2xl"></i>
                </button>
                <span className={`text-[11px] font-black ${gender === 'male' ? 'text-blue-400' : 'text-white/40'}`}>ذكر</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setGender('female')}
                  className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${gender === 'female' ? 'bg-pink-600/30 border-pink-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                >
                  <i className="fas fa-venus text-2xl"></i>
                </button>
                <span className={`text-[11px] font-black ${gender === 'female' ? 'text-pink-400' : 'text-white/40'}`}>أنثى</span>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#8c52ff]/30 backdrop-blur-sm py-4 rounded-2xl font-black text-white shadow-[0_4px_20px_rgba(140,82,255,0.15)] active:scale-95 transition-all mt-4 border border-[#8c52ff]/40"
          >
            {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'دخول للتطبيق'}
          </button>
        </form>
      </div>

      {showCountryPicker && (
        <div className="fixed inset-0 z-[100] bg-[#1a0b2e] flex flex-col pt-12" dir="rtl">
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
                  setRegion(c);
                  setShowCountryPicker(false);
                }}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${region?.code === c.code ? 'bg-purple-600/20 border-purple-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{c.flag}</span>
                  <span className="font-bold text-sm text-white">{c.name}</span>
                </div>
                {region?.code === c.code && <i className="fas fa-check text-purple-400"></i>}
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="text-center py-12 text-white/40 text-xs">لا توجد نتائج للبحث</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
