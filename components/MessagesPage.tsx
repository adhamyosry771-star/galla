
import React from 'react';

export const MessagesPage: React.FC = () => {
  const chats = [
    { id: 1, name: "يوسف الصديق", msg: "تعال نلعب لودو الحين!", time: "10:30 ص", unread: 2, avatar: "https://picsum.photos/100?random=31" },
    { id: 2, name: "نور الشمس", msg: "شكراً على الهدية الرائعة ❤️", time: "أمس", unread: 0, avatar: "https://picsum.photos/100?random=32" },
    { id: 3, name: "خالد الحربي", msg: "موجود في الروم؟", time: "أمس", unread: 0, avatar: "https://picsum.photos/100?random=33" },
    { id: 4, name: "فريق يلا جيمز", msg: "أهلاً بك في عالمنا الجديد", time: "22/10", unread: 0, avatar: "https://picsum.photos/100?random=34" }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#1a0b2e]">
      <div className="p-6 pb-2">
        <h2 className="text-2xl font-black text-white tracking-tight">الرسائل</h2>
        <div className="flex gap-5 mt-8 overflow-x-auto pb-6 scrollbar-hide">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 bg-white/5 shadow-xl active:scale-90 transition-all">
              <i className="fas fa-plus text-lg"></i>
            </div>
            <span className="text-[10px] font-black text-purple-400/40 uppercase tracking-widest">قصة</span>
          </div>
          {chats.map(chat => (
            <div key={chat.id} className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full border-2 border-purple-500/50 p-1 bg-white/5 shadow-2xl active:scale-90 transition-all">
                <img src={chat.avatar} className="w-full h-full rounded-full object-cover" alt="" />
              </div>
              <span className="text-[10px] font-bold text-purple-100 truncate max-w-[60px]">{chat.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 px-6 space-y-3 pb-10">
        {chats.map(chat => (
          <div key={chat.id} className="flex items-center gap-4 py-3 px-4 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer shadow-xl active:scale-[0.98]">
            <img src={chat.avatar} className="w-14 h-14 rounded-full object-cover shadow-2xl border border-white/5" alt="" />
            <div className="flex-1 pr-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-[14px] text-white tracking-tight">{chat.name}</span>
                <span className="text-[8px] font-black text-purple-400/40 uppercase tracking-tighter">{chat.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-purple-300/40 truncate max-w-[170px]">{chat.msg}</p>
                {chat.unread > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
