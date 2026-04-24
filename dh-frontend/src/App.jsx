import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';

// 🚀 เพิ่มหน้าตะกร้าสินค้า และหน้าสั่งซื้อ (Checkout)
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { CartProvider } from './context/CartProvider';

function App() {
  return (
    <CartProvider>
      <Router>
        <MainLayout>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* 🚀 ลงทะเบียน Route สำหรับ E-Commerce Core */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </MainLayout>
      </Router>
    </CartProvider>
  );
}

export default App;