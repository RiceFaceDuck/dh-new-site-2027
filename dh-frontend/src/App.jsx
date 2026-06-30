import React, { Suspense, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home/Home';
import CategoryPage from './pages/CategoryPage';
import CategoriesMain from './pages/Categories/CategoriesMain';
import SearchPage from './pages/SearchPage';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import StoreProfilePage from './pages/StoreProfile/StoreProfilePage';

import { CartProvider } from './context/CartProvider';
import { OrderProvider } from './context/OrderContext';
import { ToastProvider } from './context/ToastContext';
import { FavoritesProvider } from './context/FavoritesProvider';

// 🚀 Code Splitting: โหลดเฉพาะหน้าที่จำเป็นเมื่อผู้ใช้เรียกใช้ เพื่อลด Bundle Size และเพิ่มความเร็วหน้าแรก
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const SquadLayout = React.lazy(() => import('./layouts/SquadLayout'));
const Squad = React.lazy(() => import('./pages/Squad/Squad'));
const HardwareScanner = React.lazy(() => import('./pages/HardwareScanner/HardwareScanner'));
const ProvidersPage = React.lazy(() => import('./pages/Providers/ProvidersPage'));

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
  
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

const GlobalLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {

  return (
    <ToastProvider>
    <FavoritesProvider>
    <CartProvider>
      <OrderProvider>
      <Router>
        {/* ฝังลูกเล่น ScrollToTop ทำงานเงียบๆ ทุกครั้งที่ Route เปลี่ยน */}
        <ScrollToTop />
        
        <Suspense fallback={<GlobalLoader />}>
          <Routes>
            {/* Routes ที่ใช้โครงสร้างหลัก (มี Header, Footer) */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/categories" element={<CategoriesMain />} />
              <Route path="/category/:type" element={<CategoryPage />} />
              <Route path="/search" element={<SearchPage />} />
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
        </Suspense>
        
        {/* 🛡️ แบนเนอร์ยอมรับคุกกี้ (แสดงทุกหน้า) */}
        <CookieConsentBanner />
      </Router>
      </OrderProvider>
    </CartProvider>
    </FavoritesProvider>
    </ToastProvider>
  );
}

export default App;