import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BottomNav from '../components/navigation/BottomNav';
import FloatingMessenger from '../components/chat/FloatingMessenger';
import { useWebTrafficAllTime } from '../hooks/useWebTrafficAllTime';
import VisitorCounterBadge from '../components/common/VisitorCounterBadge';

// 🚀 นำเข้า Component ป้ายแบนเนอร์ผู้สนับสนุน

// 🚀 นำเข้า Loading Bar สำหรับเปลี่ยนหน้า
import TopLoadingBar from '../components/common/TopLoadingBar';

// 🎨 นำเข้า Theme Hook
import { useStorefrontTheme } from '../hooks/useStorefrontTheme';

/**
 * MainLayout - โครงสร้างหลักของหน้าเว็บหน้าบ้าน
 * ประกอบด้วย Navbar ด้านบน, พื้นที่เนื้อหาตรงกลาง, Footer และระบบแชทลอยตัว
 */
const MainLayout = ({ children }) => {
  const theme = useStorefrontTheme();
  const location = useLocation();
  const isProductDetail = location.pathname.startsWith('/product/');
  const { formattedCount, loading: trafficLoading } = useWebTrafficAllTime();

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
    <div className={`min-h-screen min-h-[100dvh] flex flex-col font-sans text-gray-800 relative selection:bg-brand-light selection:text-brand-dark ${theme.themeId || 'theme-tech-professional'}`}>
      
      {/* พื้นหลังเบลอแบบไล่ระดับความโปร่งแสง (Dynamic Gradient Frosted Glass) */}
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none hidden md:block"
        style={{
          backdropFilter: `blur(${theme.blurLevel}px)`,
          WebkitBackdropFilter: `blur(${theme.blurLevel}px)`, // For Safari support
          background: `linear-gradient(to bottom, rgba(255,255,255,${theme.opacityTop / 100}), rgba(255,255,255,${theme.opacityMid / 100}), rgba(255,255,255,${theme.opacityBottom / 100}))`
        }}
      ></div>
      {/* Mobile Fallback: Solid Tinted Background (Zero GPU Blur Load) */}
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none md:hidden"
        style={{
          background: 'linear-gradient(to bottom, rgba(248,250,252,0.92), rgba(241,245,249,0.95), rgba(248,250,252,0.98))'
        }}
      ></div>

      {/* 1. Header: ยึดติดด้านบน พร้อมเอฟเฟกต์กระจกพรีเมียม (จัดการ styles ภายใน Navbar.jsx) */}
      <Navbar />
      
      {/* 2. Main Content: พื้นที่แสดงเนื้อหาหลัก
          - เพิ่ม pb-28 ในมือถือเพื่อเว้นที่ให้ BottomNav และ Floating Messenger ไม่บังปุ่มสำคัญด้านล่าง
          - บนหน้าจอ md ขึ้นไป คืนค่า pb-12 ปกติ
      */}
      <main className="grow-0 md:grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1 md:pt-6 md:pb-12 overflow-hidden">
        {/* รองรับทั้งการส่งผ่าน children (จาก App.jsx) และการใช้ React Router (Outlet) */}
        <React.Suspense fallback={<TopLoadingBar />}>
          {children || <Outlet />}
        </React.Suspense>
      </main>
      
      {/* 3. Footer: ซ่อนในมือถือ (กันรก) และแสดงเฉพาะบน Desktop */}
      <div className="hidden lg:block mt-auto">
        <Footer />
      </div>
      {/* 3.1 Mobile Visitor Bar: แสดงยอดผู้เข้าชมเว็บ All-Time สั้นกระชับ กึ่งกลางหน้าจอ ไม่บังปุ่มแชทลอยตัว */}
      <div className={`lg:hidden flex justify-center w-full px-4 mt-2 sm:mt-3 ${isProductDetail ? 'pb-[145px]' : 'pb-[70px]'}`}>
        <VisitorCounterBadge 
          variant="mobile-card" 
          count={formattedCount} 
          loading={trafficLoading} 
        />
      </div>

      {/* 4. Navigation: BottomNav สำหรับมือถือ (ยึดติดด้านล่างสุด) */}
      <BottomNav />

      {/* 5. Smart Interaction: อัปเกรดระบบแชทลอยตัวอัจฉริยะ (สลับ DH / Partner) 
          ตำแหน่งจะลอยอยู่เหนือ BottomNav ในมือถือ และลอยขวาล่างใน Desktop
      */}
      <FloatingMessenger />

    </div>
  );
};

export default MainLayout;