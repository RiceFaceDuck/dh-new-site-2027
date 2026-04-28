import React, { useState, useEffect } from 'react';
import { User, MapPin, Store, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
// 🛠️ แก้ไขบรรทัด Import Auth ให้เรียกตรงจาก firebase/auth แทน
import { getAuth } from 'firebase/auth'; 
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { updatePartnerProfile, extractCoordsFromUrl } from '../../../firebase/partnerService';

// กำหนด App ID สำหรับดึงข้อมูล
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const TabOverview = () => {
  // State สำหรับข้อมูลผู้ใช้ทั่วไป
  const [userInfo, setUserInfo] = useState({
    displayName: 'กำลังโหลด...',
    email: 'กำลังโหลด...',
    phoneNumber: 'ยังไม่ได้ระบุ'
  });

  // State สำหรับระบบ Partner
  const [isPartnerActive, setIsPartnerActive] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [services, setServices] = useState('');
  
  // State สำหรับ UI & UX
  const [isValidMap, setIsValidMap] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // 1. ดึงข้อมูล Profile และ Partner ข้อมูลเริ่มต้น
  useEffect(() => {
    const fetchUserData = async () => {
      // 🛠️ ตรวจสอบ Auth แบบปลอดภัยขึ้น
      const auth = getAuth();
      const user = auth?.currentUser;
      
      if (user) {
        setUserInfo({
          displayName: user.displayName || 'ผู้ใช้งาน DH',
          email: user.email || 'ไม่มีอีเมล',
          phoneNumber: user.phoneNumber || 'ยังไม่ได้ระบุ'
        });

        // ดึงข้อมูล Partner เดิมที่เคยบันทึกไว้ (ถ้ามี)
        try {
          const partnerRef = doc(db, 'artifacts', appId, 'users', user.uid, 'partner_profile', 'data');
          const snap = await getDoc(partnerRef);
          if (snap.exists()) {
            const data = snap.data();
            setIsPartnerActive(data.isActive || false);
            setStoreName(data.storeName || '');
            setMapsUrl(data.mapsUrl || '');
            setServices(data.services || '');
          }
        } catch (error) {
          console.error("Error fetching partner data:", error);
        }
      }
      setLoadingInitial(false);
    };

    fetchUserData();
  }, []);

  // 2. Live Validation: ตรวจสอบความถูกต้องของ Google Maps URL แบบ Real-time
  useEffect(() => {
    if (mapsUrl) {
      const coords = extractCoordsFromUrl(mapsUrl);
      setIsValidMap(!!coords); // เป็น true ถ้าสกัดพิกัดได้สำเร็จ
    } else {
      setIsValidMap(false);
    }
  }, [mapsUrl]);

  // 3. ฟังก์ชันบันทึกข้อมูล Partner
  const handleSavePartnerSettings = async () => {
    const auth = getAuth();
    const user = auth?.currentUser;
    
    // 🛠️ เปลี่ยน alert เป็น UI ที่พรีเมียมขึ้นถ้าไม่ได้ล็อกอิน
    if (!user) {
      console.error("Not authenticated");
      return; 
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updatePartnerProfile(user.uid, {
        storeName,
        mapsUrl,
        services,
        // ส่งข้อมูลเบสิกไปเผื่อดึงไปแสดงผลด้วย
        contactName: userInfo.displayName,
        contactEmail: userInfo.email
      }, isPartnerActive);

      setSaveSuccess(true);
      // ซ่อนข้อความ Success หลังผ่านไป 3 วินาที
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex justify-center items-center h-48 text-gray-400">
        <Loader2 className="animate-spin w-8 h-8 mr-2" /> กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ==========================================
          ส่วนที่ 1: ข้อมูลส่วนตัวพื้นฐาน (รักษาโครงสร้างเดิม)
          ========================================== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <User className="text-[#0870B8] w-5 h-5" /> ข้อมูลบัญชีผู้ใช้
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">ชื่อ-นามสกุล</div>
            <div className="font-medium text-gray-800">{userInfo.displayName}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">อีเมล</div>
            <div className="font-medium text-gray-800">{userInfo.email}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 md:col-span-2">
            <div className="text-xs text-gray-500 mb-1">เบอร์โทรศัพท์</div>
            <div className="font-medium text-gray-800">{userInfo.phoneNumber}</div>
          </div>
        </div>
      </div>

      {/* ==========================================
          ส่วนที่ 2: ระบบ Partner (รับการสนับสนุน) - อัปเกรดใหม่!
          ========================================== */}
      <div className={`rounded-2xl border transition-all duration-500 shadow-sm overflow-hidden ${
        isPartnerActive ? 'border-[#0870B8] bg-[#f8fbff]' : 'border-gray-200 bg-white'
      }`}>
        
        {/* Header & Toggle Switch */}
        <div className="p-6 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 border-b border-gray-100/50">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <ShieldCheck className={isPartnerActive ? "text-[#0870B8]" : "text-gray-400"} />
              ร่วมเป็น Partner รับการสนับสนุน
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              เปิดการรับการสนับสนุน เพื่อให้ร้านค้าของคุณแสดงบนเว็บ DH เมื่อมีลูกค้าอยู่ในบริเวณใกล้เคียง
            </p>
          </div>
          
          {/* Animated Toggle Switch */}
          <button 
            type="button"
            onClick={() => setIsPartnerActive(!isPartnerActive)}
            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
              isPartnerActive ? 'bg-[#0870B8]' : 'bg-gray-300'
            }`}
          >
            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
              isPartnerActive ? 'translate-x-7' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Form Details (Expandable) */}
        <div className={`transition-all duration-500 ease-in-out origin-top ${
          isPartnerActive ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="p-6 space-y-5">
            
            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-gray-400" /> ชื่อร้านค้า / สถานประกอบการ
              </label>
              <input 
                type="text" 
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="เช่น DH Service สาขาเชียงใหม่..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0870B8] focus:border-[#0870B8] outline-none transition-all"
              />
            </div>

            {/* Google Maps URL with Live Validation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" /> ลิงก์ Google Maps (เพื่อหาพิกัด)
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="วางลิงก์ Google Maps ที่นี่..."
                  className={`w-full px-4 py-2.5 pr-10 rounded-xl border outline-none transition-all ${
                    mapsUrl ? (isValidMap ? 'border-emerald-500 focus:ring-emerald-200' : 'border-amber-500 focus:ring-amber-200') : 'border-gray-300 focus:ring-[#0870B8]'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {mapsUrl && (
                    isValidMap 
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in" />
                    : <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" title="ระบบยังตรวจไม่พบพิกัดในลิงก์นี้" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {isValidMap ? <span className="text-emerald-600">✓ ตรวจพบพิกัดแผนที่สำเร็จ</span> : "คัดลอกลิงก์จากแอป Google Maps แล้วนำมาวางได้เลย"}
              </p>
            </div>

            {/* Services Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                รายละเอียดบริการเพิ่มเติม (ไม่บังคับ)
              </label>
              <textarea 
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="อธิบายบริการที่รับรอง หรือเวลาเปิด-ปิดทำการ..."
                rows="3"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0870B8] focus:border-[#0870B8] outline-none transition-all resize-none"
              />
            </div>

          </div>
        </div>

        {/* Action Footer (แสดงตลอดเพื่อใช้เซฟการปิดด้วย) */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
          {saveSuccess && (
            <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5 animate-in slide-in-from-right-4">
              <CheckCircle2 className="w-4 h-4" /> บันทึกสำเร็จ
            </span>
          )}
          <button
            onClick={handleSavePartnerSettings}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-xl font-medium text-white transition-all flex items-center gap-2 ${
              isSaving ? 'bg-[#0870B8]/70 cursor-not-allowed' : 'bg-[#0870B8] hover:bg-[#054D80] hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าพาร์ทเนอร์'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default TabOverview;