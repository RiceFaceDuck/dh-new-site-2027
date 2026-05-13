/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Phone, Star, Wrench, Navigation, AlertCircle } from 'lucide-react';
// 🚀 นำเข้า Service ตัวเก่งของเรา (หาตำแหน่งที่ใกล้ที่สุด)
import { findNearestPartner, getUserCurrentLocation } from '../../firebase/partnerLocationService';

const PartnerSupportBox = () => {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ทำงานทันทีที่ Component ถูกแสดงในหน้าจอ (เช่น เข้าหน้า Detail สินค้า)
  useEffect(() => {
    const fetchPartner = async () => {
      try {
        setLoading(true);
        // 1. แอบขอพิกัดผู้ใช้อย่างเงียบๆ
        const location = await getUserCurrentLocation();
        
        // 2. ส่งไปคำนวณหาร้านซ่อมที่อยู่ในรัศมี (สมมติ 30 กม.)
        const nearest = await findNearestPartner(location.latitude, location.longitude, 30);
        
        if (nearest) {
          setPartner(nearest);
        } else {
          // ถ้าหาไม่เจอ ให้ซ่อนตัวไปเงียบๆ (ไม่ต้องแสดง Error น่าเกลียด)
          setError("No partners nearby"); 
        }
      } catch (err) {
        console.error("Partner Box - Location Error:", err);
        setError("Location permission denied or unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, []);

  // ฟังก์ชันกดโทรติดต่อ (จุดนี้เตรียมไว้หัก Credit Point)
  const handleContactClick = () => {
    if (!partner) return;
    
    // โตไปเราจะเพิ่มโค้ดเรียก deductCredit() ตรงนี้
    console.log(`[Action] ลูกค้าหน้า Detail กดติดต่อร้าน: ${partner.storeName} (รอเชื่อมระบบหัก Credit Point)`);
    
    // สั่งเปิดเบอร์โทรศัพท์
    window.location.href = `tel:${partner.phone}`;
  };

  // ================= RENDER =================

  // 1. สถานะกำลังโหลด: แสดงโครงร่าง (Skeleton) สวยๆ เพื่อไม่ให้ UI กระโดด
  if (loading) {
    return (
      <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 bg-slate-200 rounded"></div>
            <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // 2. สถานะเกิด Error หรือ ไม่มีร้านใกล้เคียง: (ซ่อนตัวไปเลย ไม่ต้องแสดงให้เกะกะสายตา)
  if (error || !partner) {
    return null; 
  }

  // 3. เจอร้านที่ใกล้ที่สุดแล้ว! แสดงผลให้สวยงาม
  return (
    <div className="w-full bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
      
      {/* ลวดลายตกแต่งพื้นหลัง */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 opacity-5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
      
      <div className="relative z-10 flex flex-col gap-3">
        
        {/* ส่วนหัว: โลโก้ และ ชื่อร้าน */}
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 border border-emerald-200 shadow-inner">
              <Wrench size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase bg-emerald-100 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                  <ShieldCheck size={10} /> DH Verified
                </span>
                <span className="text-[10px] text-slate-400 font-medium">ร้านซ่อมใกล้คุณ</span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-1">
                {partner.storeName}
              </h4>
            </div>
          </div>
        </div>

        {/* ส่วนข้อมูล: ระยะทาง และ บริการ */}
        <div className="bg-white/60 p-2.5 rounded-xl border border-white space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Navigation size={12} className="text-emerald-500" /> ระยะทาง
            </div>
            <span className="font-bold text-[#0870B8]">{partner.formattedDistance}</span>
          </div>
          
          {partner.services && (
            <div className="flex justify-between items-start text-xs pt-1.5 border-t border-emerald-100/50">
              <div className="flex items-start gap-1.5 text-slate-600 shrink-0">
                <Star size={12} className="text-amber-400 mt-0.5" /> บริการ
              </div>
              <span className="text-slate-500 font-medium text-right line-clamp-1">{partner.services}</span>
            </div>
          )}
        </div>

        {/* ส่วนปุ่มกดติดต่อ */}
        <button 
          onClick={handleContactClick}
          className="w-full mt-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Phone size={14} className="animate-pulse" /> โทรให้ช่างประกอบให้ (ติดต่อร้าน)
        </button>

      </div>
    </div>
  );
};

export default PartnerSupportBox;