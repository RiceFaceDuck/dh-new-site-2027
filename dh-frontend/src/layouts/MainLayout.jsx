import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BottomNav from '../components/navigation/BottomNav';
import FloatingMessenger from '../components/chat/FloatingMessenger';

// 🚀 นำเข้า Component ป้ายแบนเนอร์ผู้สนับสนุน
import TopPartnerBanner from '../components/partner/TopPartnerBanner';

// 🎨 นำเข้า Theme Hook
import { useStorefrontTheme } from '../hooks/useStorefrontTheme';

/**
 * MainLayout - โครงสร้างหลักของหน้าเว็บหน้าบ้าน
 * ประกอบด้วย Navbar ด้านบน, พื้นที่เนื้อหาตรงกลาง, Footer และระบบแชทลอยตัว
 */
const MainLayout = ({ children }) => {
  const theme = useStorefrontTheme();

  // จัดการ Background ภาพแบบ Dynamic
  useEffect(() => {
    if (theme.backgroundUrl) {
      document.body.style.backgroundImage = `url('${theme.backgroundUrl}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundPosition = 'center';
    }
    return () => {
      document.body.style.backgroundImage = '';
    };
  }, [theme.backgroundUrl]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800 relative selection:bg-[#E6F0F9] selection:text-[#054D80]">
      
      {/* พื้นหลังเบลอแบบไล่ระดับความโปร่งแสง (Dynamic Gradient Frosted Glass) */}
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none"
        style={{
          backdropFilter: `blur(${theme.blurLevel}px)`,
          WebkitBackdropFilter: `blur(${theme.blurLevel}px)`, // For Safari support
          background: `linear-gradient(to bottom, rgba(255,255,255,${theme.opacityTop / 100}), rgba(255,255,255,${theme.opacityMid / 100}), rgba(255,255,255,${theme.opacityBottom / 100}))`
        }}
      ></div>

      {/* 🚀 0. Top Banner: พื้นที่โปรโมทพาร์ทเนอร์ด้านบนสุด (อยู่เหนือ Navbar) */}
      <TopPartnerBanner />

      {/* 1. Header: ยึดติดด้านบน พร้อมเอฟเฟกต์กระจกพรีเมียม (จัดการ styles ภายใน Navbar.jsx) */}
      <Navbar />
      
      {/* 2. Main Content: พื้นที่แสดงเนื้อหาหลัก
          - เพิ่ม pb-28 ในมือถือเพื่อเว้นที่ให้ BottomNav และ Floating Messenger ไม่บังปุ่มสำคัญด้านล่าง
          - บนหน้าจอ md ขึ้นไป คืนค่า pb-12 ปกติ
      */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 overflow-hidden pb-32 md:pb-12">
        {/* รองรับทั้งการส่งผ่าน children (จาก App.jsx) และการใช้ React Router (Outlet) */}
        {children || <Outlet />}
      </main>
      
      {/* 3. Footer: ซ่อนในมือถือ (กันรก) และแสดงเฉพาะบน Desktop */}
      <div className="hidden lg:block mt-auto border-t border-gray-100">
        <Footer />
      </div>
      
      {/* 4. Navigation: BottomNav สำหรับมือถือ (ยึดติดด้านล่างสุด) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-bottom-nav">
        <BottomNav />
      </div>

      {/* 5. Smart Interaction: อัปเกรดระบบแชทลอยตัวอัจฉริยะ (สลับ DH / Partner) 
          ตำแหน่งจะลอยอยู่เหนือ BottomNav ในมือถือ และลอยขวาล่างใน Desktop
      */}
      <FloatingMessenger />

    </div>
  );
};

export default MainLayout;