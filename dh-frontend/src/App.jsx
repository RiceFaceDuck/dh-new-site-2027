import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home/Home';
import CategoryPage from './pages/CategoryPage';
import CategoriesMain from './pages/Categories/CategoriesMain';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import StoreProfilePage from './pages/StoreProfile/StoreProfilePage';

// 🚀 เพิ่มหน้าตะกร้าสินค้า และหน้าสั่งซื้อ (Checkout)
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { CartProvider } from './context/CartProvider';
import { OrderProvider } from './context/OrderContext';

// 🚀 นำเข้าระบบ Squad Selection (ใหม่ล่าสุด)
import SquadLayout from './layouts/SquadLayout';
import Squad from './pages/Squad/Squad';

// 🚀 นำเข้าระบบ Hardware Scanner
import HardwareScanner from './pages/HardwareScanner/HardwareScanner';

// 🚀 นำเข้าระบบรวมผู้ให้บริการ (Service Providers)
import ProvidersPage from './pages/Providers/ProvidersPage';

// 📜 นำเข้าระบบจัดการ PDPA และ Legal Pages
import CookieConsentBanner from './components/common/CookieConsentBanner';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import CookiePolicy from './pages/legal/CookiePolicy';

// 🎯 นำเข้าระบบการตลาด เพื่อใช้งาน Smart Cache ประหยัด Reads
import { marketingService } from './firebase/marketingService';

// ==========================================
// 🌟 Smart UX Feature: Auto Scroll to Top
// ==========================================
// ฮุกอัจฉริยะสำหรับ React Router: เมื่อลูกค้าคลิกเปลี่ยนหน้าต่าง 
// ระบบจะทำการสมูทหน้าจอเลื่อนกลับขึ้นบนสุดอัตโนมัติ (ลดอาการงงหน้าจอค้างด้านล่าง)
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    // หน่วงเวลาเล็กน้อยเพื่อให้ DOM เรนเดอร์เฟรมแรกเสร็จสมบูรณ์ก่อนเลื่อน
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

function App() {

  // ==========================================
  // 🧠 Performance Optimization: Background Fetch
  // ==========================================
  useEffect(() => {
    // 🚀 ระบบจะแอบดึงข้อมูลการตลาดแบบ Unified Ads ไปเก็บไว้ใน Memory ของลูกค้า
    // หน่วงเวลา 2 วินาทีเพื่อให้คอนเทนต์หลักโหลดเสร็จ 100% ก่อนค่อยดึงข้อมูล (Zero UI Blocking)
    const prefetchMarketingData = setTimeout(async () => {
      try {
        console.log("⚡ [Smart System] Pre-fetching Ads & Banners quietly...");
        
        // 🛠️ HOTFIX: ใช้ Promise.all ดึงข้อมูล Unified Ads ทั้ง 3 ประเภททีเดียวแบบขนาน
        // แก้บั๊ก TypeError: marketingService.getActiveBanners is not a function
        await Promise.all([
          marketingService.getActivePartnerAds('BUSINESS_CARD'),
          marketingService.getActivePartnerAds('PRODUCT_LINK'),
          marketingService.getActivePartnerAds('BILLBOARD')
        ]);
        
        console.log("✅ [Smart System] Marketing Cache Ready! Enjoy zero-delay ad loading.");
      } catch (error) {
        console.error("❌ [Smart System] Prefetch failed (Silent Error):", error);
      }
    }, 2000);

    return () => clearTimeout(prefetchMarketingData);
  }, []);

  return (
    <CartProvider>
      <OrderProvider>
      <Router>
        {/* ฝังลูกเล่น ScrollToTop ทำงานเงียบๆ ทุกครั้งที่ Route เปลี่ยน */}
        <ScrollToTop />
        
        <Routes>
          {/* Routes ที่ใช้โครงสร้างหลัก (มี Header, Footer) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/categories" element={<CategoriesMain />} />
            <Route path="/category/:type" element={<CategoryPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/store/:id" element={<StoreProfilePage />} />
            
            {/* 🚀 ลงทะเบียน Route สำหรับ E-Commerce Core */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            
            {/* 🚀 ลงทะเบียน Route สำหรับ Hardware Scanner */}
            <Route path="/hardware-scanner" element={<HardwareScanner />} />
            
            {/* 🚀 ลงทะเบียน Route สำหรับ Service Providers */}
            <Route path="/providers" element={<ProvidersPage />} />
            
            {/* 📜 ลงทะเบียน Route สำหรับหน้า PDPA / Legal */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
          </Route>
          
          {/* 🚀 ระบบหน้าแยกพิเศษสำหรับช่าง (ไม่มี Header/Footer ปกติ) */}
          <Route path="/squad" element={<SquadLayout><Squad /></SquadLayout>} />
        </Routes>
        
        {/* 🛡️ แบนเนอร์ยอมรับคุกกี้ (แสดงทุกหน้า) */}
        <CookieConsentBanner />
      </Router>
      </OrderProvider>
    </CartProvider>
  );
}

export default App;