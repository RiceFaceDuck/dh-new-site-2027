import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BottomNav from '../components/navigation/BottomNav';
import { MessageCircle } from 'lucide-react';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 relative selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />
      
      {/* พื้นที่แสดงเนื้อหา 
        - เพิ่ม pb-28 ในมือถือเพื่อเว้นที่ให้ BottomNav และ Floating Button ไม่บังเนื้อหาด้านล่างสุด
        - บนหน้าจอ md ขึ้นไป คืนค่า pb-12 ปกติ
      */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 overflow-hidden pb-28 md:pb-12">
        {children}
      </main>
      
      <Footer />
      
      {/* เรียกใช้ BottomNav */}
      <BottomNav />

      {/* ปุ่มติดต่อลอยตัว (Floating Action Button) ปรับแต่งให้ดูมีมิติมากขึ้น */}
      <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 group">
        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300 animate-pulse"></div>
        <button className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-900/20 hover:shadow-2xl hover:scale-110 hover:-rotate-6 transition-all duration-300 border border-emerald-400/30">
          <MessageCircle size={28} className="md:w-8 md:h-8" />
        </button>
      </div>
    </div>
  );
};

export default MainLayout;