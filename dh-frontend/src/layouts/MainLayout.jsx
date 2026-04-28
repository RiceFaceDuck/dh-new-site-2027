import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BottomNav from '../components/navigation/BottomNav';
import { MessageCircle } from 'lucide-react';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 relative selection:bg-[#E6F0F9] selection:text-[#054D80]">
      {/* Header ยึดติดด้านบน พร้อมเอฟเฟกต์กระจกพรีเมียม (glass-header) */}
      <header className="sticky top-0 z-50 w-full glass-header">
        <Navbar />
      </header>
      
      {/* พื้นที่แสดงเนื้อหา (ใช้โครงสร้างที่สมบูรณ์จากของคุณ)
        - เพิ่ม pb-28 ในมือถือเพื่อเว้นที่ให้ BottomNav และ Floating Button ไม่บังเนื้อหาด้านล่างสุด
        - บนหน้าจอ md ขึ้นไป คืนค่า pb-12 ปกติ
      */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 overflow-hidden pb-28 md:pb-12">
        {/* รองรับทั้งการส่งผ่าน children และการใช้ React Router (Outlet) */}
        {children || <Outlet />}
      </main>
      
      {/* ซ่อน Footer ในมือถือ (กันรก) และแสดงเฉพาะจอกว้าง */}
      <div className="hidden lg:block mt-auto">
        <Footer />
      </div>
      
      {/* เรียกใช้ BottomNav (บังคับซ่อนบน Desktop และใส่เอฟเฟกต์กระจก) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-bottom-nav">
        <BottomNav />
      </div>

      {/* ปุ่มติดต่อลอยตัว (Floating Action Button) 
          ปรับแต่งให้ดูมีมิติมากขึ้น และใช้สี Brand (#0870B8) แทนสี Emerald เดิม
      */}
      <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 group">
        <div className="absolute inset-0 bg-[#0870B8] rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300 animate-pulse"></div>
        <button className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-tr from-[#054D80] to-[#0870B8] rounded-full flex items-center justify-center text-white shadow-xl shadow-[#0870B8]/20 hover:shadow-2xl hover:scale-110 hover:-rotate-6 transition-all duration-300 border border-white/30">
          <MessageCircle size={28} className="md:w-8 md:h-8" />
        </button>
      </div>
    </div>
  );
};

export default MainLayout;