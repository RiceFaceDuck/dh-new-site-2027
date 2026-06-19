import React from 'react';
import { Loader2 } from 'lucide-react';
import { useManagerAds } from './hooks/useManagerAds';
import AdsHeader from './components/ads/AdsHeader';
import AdsList from './components/ads/AdsList';
import GuideModal from '../../components/common/GuideModal';

export default function ManagerAds() {
  const {
    ads,
    loading,
    activeTab,
    setActiveTab,
    processingId,
    handleAction,
    pendingCount
  } = useManagerAds();

  const [isGuideOpen, setIsGuideOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">กำลังเชื่อมต่อฐานข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <AdsHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        pendingCount={pendingCount} 
        setIsGuideOpen={setIsGuideOpen}
      />
      
      <AdsList 
        ads={ads} 
        activeTab={activeTab} 
        processingId={processingId} 
        handleAction={handleAction} 
      />

      <GuideModal 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="คู่มือ: จัดการพื้นที่โฆษณา (Manager Ads)"
        config={{
          description: "ระบบสำหรับตรวจสอบ อนุมัติ และจัดการคำขอโฆษณาสินค้าหรือแบนเนอร์จาก Partner ก่อนนำไปแสดงผลบนหน้าร้านค้าออนไลน์",
          howTo: [
            "<strong>ตรวจสอบคำขอ:</strong> ในแท็บ <code>รอตรวจสอบ</code> คุณจะเห็นรายการโฆษณาที่รอการอนุมัติ สามารถดูรูปภาพและรายละเอียดแคมเปญได้",
            "<strong>การพิจารณา:</strong> กดปุ่ม <code>อนุมัติ</code> เพื่อให้โฆษณาแสดงผล หรือปุ่ม <code>ปฏิเสธ</code> พร้อมระบุเหตุผล หากโฆษณาไม่เหมาะสมหรือไม่ตรงตามกฎเกณฑ์",
            "<strong>ติดตามผล:</strong> ในแท็บ <code>กำลังแสดงผล</code> สามารถดูโฆษณาที่อนุมัติแล้ว และสามารถกด <code>ระงับ</code> หากพบปัญหาในภายหลัง"
          ],
          tips: [
            "โฆษณาที่ถูกอนุมัติ ระบบจะบันทึกลงใน History Log เพื่อตรวจสอบย้อนหลัง",
            "การให้เหตุผลที่ชัดเจนเมื่อปฏิเสธโฆษณา จะช่วยให้ Partner สามารถแก้ไขและส่งมาใหม่ได้ถูกต้องยิ่งขึ้น"
          ],
          expectedResults: "การอนุมัติจะทำให้แบนเนอร์ไปแสดงผลบนเว็บไซต์อัตโนมัติ การปฏิเสธจะส่งแจ้งเตือนกลับไปยัง Partner"
        }}
      />
    </div>
  );
}