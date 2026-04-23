import React, { useState, useEffect } from 'react';
import { Megaphone, ShieldCheck, Image as ImageIcon, Edit3, Upload, Info, Loader2, CheckCircle2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, runTransaction, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getAuth } from 'firebase/auth';

const TabAdManager = ({ userProfile }) => {
  const [isSupportActive, setIsSupportActive] = useState(userProfile?.isSupportActive ?? true);
  const [introText, setIntroText] = useState(userProfile?.shopInfo?.intro || '');
  const [adEnabled, setAdEnabled] = useState(userProfile?.settings?.adEnabled || false);
  
  const [isUpdatingIntro, setIsUpdatingIntro] = useState(false);
  const [isUpdatingSupport, setIsUpdatingSupport] = useState(false);

  // 1. อัปเดตสถานะเปิดรับงาน (สวิตช์หลัก ไม่เสียเครดิต)
  const handleToggleSupport = async () => {
    if (!userProfile?.uid) return;
    const newState = !isSupportActive;
    setIsSupportActive(newState);
    setIsUpdatingSupport(true);
    
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        isSupportActive: newState,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating support status:", error);
      setIsSupportActive(!newState); // Revert UI
    } finally {
      setIsUpdatingSupport(false);
    }
  };

  // 2. 🚀 อัปเดตข้อความแนะนำตัว (ใช้ 50 Credit - ต้องใช้ Transaction ป้องกันการโกง)
  const handleUpdateIntro = async () => {
    if (!userProfile?.uid) return;
    if (introText === userProfile?.shopInfo?.intro) return alert("ข้อมูลไม่มีการเปลี่ยนแปลง");
    
    if (!window.confirm("ยืนยันการใช้ 50 Credit เพื่ออัปเดตข้อมูลแนะนำตัว?")) return;

    setIsUpdatingIntro(true);
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("ไม่พบข้อมูลผู้ใช้");

        const currentPoints = userDoc.data().stats?.rewardPoints || 0;
        if (currentPoints < 50) throw new Error("Credit Point ของคุณไม่เพียงพอ (ต้องการ 50 Pts)");

        const newPoints = currentPoints - 50;

        // อัปเดตแต้มและข้อความใน Profile
        transaction.update(userRef, {
          'stats.rewardPoints': newPoints,
          'shopInfo.intro': introText,
          updatedAt: serverTimestamp()
        });

        // บันทึกประวัติการใช้แต้ม (Audit Log ทางการเงิน)
        const txRef = doc(collection(db, 'point_transactions'));
        transaction.set(txRef, {
          transactionId: `USE-${Date.now()}`,
          uid: userProfile.uid,
          type: 'spend',
          points: 50,
          balanceAfter: newPoints,
          referenceId: 'UPDATE_INTRO',
          note: 'ใช้เพื่ออัปเดตข้อความแนะนำตัวร้านค้า',
          recordedBy: userProfile.uid,
          timestamp: serverTimestamp()
        });

        // แจ้งประวัติรวม
        const logRef = doc(collection(db, 'history_logs'));
        transaction.set(logRef, {
          module: 'AdManager',
          action: 'Update',
          targetId: userProfile.uid,
          details: `อัปเดตข้อความแนะนำตัวร้านค้า (หัก 50 Pts)`,
          actionBy: userProfile.uid,
          actorName: userProfile.accountName || 'Partner',
          timestamp: serverTimestamp()
        });
      });

      alert("อัปเดตข้อมูลแนะนำตัวเรียบร้อยแล้ว");
    } catch (error) {
      console.error("🔥 Intro Update Error:", error);
      alert(error.message || "เกิดข้อผิดพลาดในการทำรายการ");
    } finally {
      setIsUpdatingIntro(false);
    }
  };

  const currentPoints = userProfile?.stats?.rewardPoints || 0;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Megaphone size={22} className="text-emerald-600" /> พื้นที่โฆษณา & การสนับสนุน
      </h2>

      {/* 1. สวิตช์การสนับสนุน */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500 opacity-10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-base font-bold flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-emerald-400" /> สถานะรับงานสนับสนุน
          </h3>
          <p className="text-xs text-gray-300 max-w-lg leading-relaxed">
            เมื่อเปิดสถานะนี้ โปรไฟล์และร้านค้าของคุณจะแสดงในระบบ <b>"Smart Partner Matching"</b> เพื่อให้ลูกค้าทั่วไปค้นหาช่างใกล้บ้านเจอ
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl border border-white/20 backdrop-blur-sm relative z-10">
          <span className={`text-sm font-bold flex items-center gap-2 ${isSupportActive ? 'text-emerald-400' : 'text-gray-400'}`}>
            {isUpdatingSupport && <Loader2 size={14} className="animate-spin" />}
            {isSupportActive ? 'เปิดรับลูกค้า' : 'ปิดรับชั่วคราว'}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={isSupportActive} onChange={handleToggleSupport} disabled={isUpdatingSupport} />
            <div className="w-12 h-7 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. จัดการข้อมูลแนะนำตัว (ใช้ Credit + Transaction) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Edit3 size={16} className="text-emerald-600"/> ข้อมูลแนะนำตัว (Profile Intro)</h3>
            <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1">ใช้ 50 Credit / ครั้ง</span>
          </div>
          <p className="text-[11px] text-gray-500 mb-3 flex items-center justify-between">
            <span>ข้อความที่จะแสดงให้ลูกค้าเห็นเมื่อค้นหาร้านคุณ</span>
            <span className="font-bold text-amber-600">ยอดคงเหลือ: {currentPoints} Pts</span>
          </p>
          <textarea 
            rows="4" 
            value={introText}
            onChange={(e) => setIntroText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-1 focus:ring-emerald-500 outline-none resize-none" 
            placeholder="แนะนำร้านของคุณให้ลูกค้ารู้จัก..."
          ></textarea>
          
          <button 
            onClick={handleUpdateIntro}
            disabled={isUpdatingIntro || currentPoints < 50}
            className="mt-auto w-full bg-gray-800 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingIntro ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {currentPoints < 50 ? 'Credit ไม่พอ (ต้องการ 50 Pts)' : 'อัปเดตข้อมูล (หัก 50 Pts)'}
          </button>
        </div>

        {/* 3. จัดการป้ายโฆษณา (จำลอง UI ไว้รอเชื่อม Google Drive Service) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col opacity-80 relative group">
          {/* ป้าย Coming Soon ปิดทับ */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl transition-all group-hover:bg-white/40">
             <span className="bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">กำลังพัฒนาระบบอัปโหลดภาพโฆษณา</span>
          </div>

          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><ImageIcon size={16} className="text-emerald-600"/> แผ่นป้ายโฆษณาร้านค้า (Ads)</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={adEnabled} readOnly />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
          
          <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 mb-3 flex items-start gap-2">
            <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 leading-tight">การเปิดแสดงป้ายโฆษณา จะใช้ <strong className="text-amber-600">100 Credit / วัน</strong> โฆษณาจะแสดงในหน้า Partner Matching</p>
          </div>

          <div className="flex-1 relative w-full min-h-[100px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden mb-3">
            <Upload size={24} className="text-gray-400 mb-1" />
            <span className="text-[10px] font-bold text-gray-500">อัปโหลดแบนเนอร์ (1200x400px)</span>
          </div>
          <button className="w-full bg-amber-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-sm cursor-not-allowed">
            ยืนยันการลงโฆษณา
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabAdManager;