import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';

// 🚀 เพิ่มหน้าตะกร้าสินค้า และหน้าสั่งซื้อ (Checkout)
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { CartProvider } from './context/CartProvider';
import { OrderProvider } from './context/OrderContext';

// 🎯 นำเข้าระบบการตลาด เพื่อใช้งาน Smart Cache ประหยัด Reads
import { marketingService } from './firebase/marketingService';

// ==========================================
// 🌟 Smart UX Feature: Auto Scroll to Top
// ==========================================
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
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
        <ScrollToTop />
        
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/profile" element={<Profile />} />
            
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </MainLayout>
      </Router>
      </OrderProvider>
    </CartProvider>
  );
}

export default App;