
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Room } from '../types';
import { db } from '../firebase';
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

interface RoomCardProps {
  room: Room;
  design: any;
  onClick: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, design, onClick }) => {
  const [ownerData, setOwnerData] = useState<any>(room.owner);

  useEffect(() => {
    // Listen to real-time updates for the owner profile
    const ownerId = room.owner?.id || (room.owner as any)?.uid;
    if (!ownerId) return;

    const unsub = onSnapshot(doc(db, "users", ownerId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setOwnerData({
          id: snapshot.id,
          name: data.displayName || data.name || room.owner.name,
          avatar: data.photoURL || data.avatar || room.owner.avatar,
        });
      }
    });

    return () => unsub();
  }, [room.owner?.id, (room.owner as any)?.uid]);

  return (
    <div 
      onClick={() => onClick(room)}
      className="relative rounded-3xl overflow-hidden cursor-pointer transform transition-all active:scale-[0.97] border border-white/5 group shadow-2xl bg-[#0d051a] aspect-[1/1.1] hover:shadow-purple-500/10"
    >
      {/* صورة الروم تملأ المربع بالكامل */}
      <img src={room.coverImage} alt={room.title} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${room.isLocked ? 'blur-[0.6px] scale-105' : ''}`} />
      
      {/* Lock Overlay */}
      {room.isLocked && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-[39px] h-[39px] rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-2xl -translate-y-2.5">
            <i className="fas fa-lock text-[15px]"></i>
          </div>
        </div>
      )}

      {/* تدرج لوني لجعل النصوص واضحة */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent ${room.isLocked ? 'backdrop-blur-[0.5px]' : ''}`}></div>
      
      {/* بيانات الغرفة في الأسفل */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1.5 z-10">
        <h3 className="font-black text-[13px] text-white leading-tight truncate drop-shadow-xl">
          {room.title}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full border border-white/20 overflow-hidden shadow-lg bg-black/20">
              <img src={ownerData.avatar} className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] text-white/90 font-bold truncate opacity-95">
              {ownerData.name}
            </span>
          </div>
          {/* عرض أيقونة الموجات مباشرة بدون تأخير */}
          <div className="flex items-center justify-center p-1 rounded-lg bg-black/20 backdrop-blur-sm">
            {design?.waveRoomIcon ? (
              <motion.img 
                src={design.waveRoomIcon} 
                className="w-4 h-4 object-contain" 
                alt="wave" 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              />
            ) : (
              <i className="fas fa-volume-up text-[10px] text-purple-400"></i>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SafeImage: React.FC<{ src: string; className?: string; alt?: string; fallback: React.ReactNode }> = ({ src, className, alt, fallback }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  if (error) return <>{fallback}</>;

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 shadow-xl`}
        alt={alt}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />
    </div>
  );
};
