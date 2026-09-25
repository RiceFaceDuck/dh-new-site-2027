import React, { Suspense, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home/Home';

import { CartProvider } from './context/CartProvider';
import { ToastProvider } from './context/ToastContext';
import { FavoritesProvider } from './context/FavoritesProvider';
import { HelmetProvider } from 'react-helmet-async';

// 🚀 Code Splitting: โหลดเฉพาะหน้าที่จำเป็นเมื่อผู้ใช้เรียกใช้ เพื่อลด Bundle Size และเพิ่มความเร็วหน้าแรก
const CategoryPage = React.lazy(() => import('./pages/CategoryPage'));
const CategoriesMain = React.lazy(() => import('./pages/Categories/CategoriesMain'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Profile = React.lazy(() => import('./pages/Profile'));
const StoreProfilePage = React.lazy(() => import('./pages/StoreProfile/StoreProfilePage'));
const AdProductDetail = React.lazy(() => import('./pages/AdProductDetail/AdProductDetail'));

const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const HardwareScanner = React.lazy(() => import('./pages/HardwareScanner/HardwareScanner'));
const ProvidersPage = React.lazy(() => import('./pages/Providers/ProvidersPage'));

// 📜 นำเข้าระบบจัดการ PDPA และ Legal Pages แบบ Lazy เพื่อเร่งการเปิดหน้าแรก
const PrivacyPolicy = React.lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/legal/TermsOfService'));
const CookiePolicy = React.lazy(() => import('./pages/legal/CookiePolicy'));

import CookieConsentBanner from './components/common/CookieConsentBanner';
import LineBrowserWarning from './components/common/LineBrowserWarning';
import TopLoadingBar from './components/common/TopLoadingBar';


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


function App() {

  return (
    <ToastProvider>
    <FavoritesProvider>
    <CartProvider>
      <HelmetProvider>
        <Router>
          <LineBrowserWarning />
          {/* ฝังลูกเล่น ScrollToTop ทำงานเงียบๆ ทุกครั้งที่ Route เปลี่ยน */}
          <ScrollToTop />
          
          <Suspense fallback={<TopLoadingBar />}>
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
                
                <Route path="/ad/product/:id" element={<AdProductDetail />} />
                
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
            </Routes>
          </Suspense>
          
          {/* 🛡️ แบนเนอร์ยอมรับคุกกี้ (แสดงทุกหน้า) */}
          <CookieConsentBanner />
        </Router>
      </HelmetProvider>
    </CartProvider>
    </FavoritesProvider>
    </ToastProvider>
  );
}

export default App;