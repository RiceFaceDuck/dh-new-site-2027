import React, { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { Heart, Info, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SupportSettings({ user, initialData, onRefresh }) {
  // ใช้ local state เพื่อความรวดเร็วในการแสดงผล (Optimistic UI)
  const [isSupported, setIsSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Sync ค่าจากฐานข้อมูลเมื่อโหลดครั้งแรก
  useEffect(() => {
    if (initialData) {
      setIsSupported(!!initialData.isSupportEnabled);
    }
  }, [initialData]);

  const handleToggle = async () => {
    if (!user || isProcessing) return;

    const newValue = !isSupported;
    const oldValue = isSupported;

    // 1. Update UI ทันทีเพื่อให้ผู้ใช้รู้สึกว่าระบบตอบสนองเร็ว
    setIsSupported(newValue);
    setIsProcessing(true);
    setError(null);

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);

      // 2. ส่งข้อมูลไปที่ Firestore
      await updateDoc(userRef, {
        isSupportEnabled: newValue,
        lastStatusUpdate: new Date().toISOString()
      });

      // 3. แจ้งหน้าหลักให้รีเฟรชข้อมูล (ถ้าจำเป็น)
      if (onRefresh) onRefresh();

    } catch (err) {
      console.error("Error updating support status:", err);
      // 4. หากเกิดข้อผิดพลาด ให้ Rollback กลับเป็นค่าเดิม
      setIsSupported(oldValue);
      setError("ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${isSupported ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-400'}`}>
              <Heart className={`w-5 h-5 ${isSupported ? 'fill-current' : ''}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">การรับการสนับสนุน</h3>
              <p className="text-xs text-gray-500">เปิดโหมดรับงานและการสนับสนุนจากระบบ</p>
            </div>
          </div>

          {/* สวิตช์เปิด-ปิด (Custom Switch) */}
          <button
            onClick={handleToggle}
            disabled={isProcessing}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 focus:ring-offset-2 ${
              isSupported ? 'bg-[#0870B8]' : 'bg-gray-200'
            } ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                isSupported ? 'translate-x-6' : 'translate-x-1'
              } flex items-center justify-center`}
            >
              {isProcessing && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            </span>
          </button>
        </div>

        {/* ส่วนคำอธิบายเพิ่มเติม */}
        <div className="bg-blue-50/50 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-[#0870B8] shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600 leading-relaxed">
            <p className="font-bold text-[#0870B8] mb-1">สิ่งที่จะเกิดขึ้นเมื่อเปิดการสนับสนุน:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>โปรไฟล์ของคุณจะปรากฏในรายชื่อพาร์ทเนอร์</li>
              <li>ระบบจะส่งงานสนับสนุนเข้าสู่หน้า Dashboard ของคุณ</li>
              <li>ผู้ใช้ทั่วไปสามารถติดต่อขอสนับสนุนผ่านช่องทาง Social ของคุณได้</li>
            </ul>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Success Indicator (แสดงสั้นๆ เมื่อประมวลผลเสร็จและสำเร็จ) */}
        {!isProcessing && !error && initialData && isSupported === !!initialData.isSupportEnabled && (
          <div className="mt-4 flex justify-end">
            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              สถานะปัจจุบันอัปเดตแล้ว
            </span>
          </div>
        )}
      </div>
    </div>
  );
}