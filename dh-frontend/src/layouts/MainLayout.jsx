import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BottomNav from '../components/navigation/BottomNav';
import { MessageCircle } from 'lucide-react';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-800 relative">
      <Navbar />
      
      {/* พื้นที่แสดงเนื้อหา 
        - เพิ่ม pb-24 ในมือถือเพื่อเว้นที่ให้ BottomNav ไม่บังเนื้อหาด้านล่างสุด
        - บนหน้าจอ md ขึ้นไป คืนค่า pb-8 ปกติ
      */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 overflow-hidden pb-24 md:pb-8">
        {children}
      </main>
      
      <Footer />
      
      {/* เรียกใช้ BottomNav 
        ตัว Component เองตั้งค่า md:hidden ไว้แล้ว จึงแสดงแค่บนมือถือ 
      */}
      <BottomNav />

      {/* ปุ่มติดต่อลอยตัว (Floating Action Button) 
        - ปรับ bottom-20 ในมือถือ เพื่อให้ลอยอยู่เหนือ BottomNav
        - ปรับ bottom-6 ใน PC ให้กลับมาอยู่มุมขวาล่างปกติ
      */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40">
        <button className="w-12 h-12 md:w-16 md:h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgb(52,211,153,0.5)] hover:bg-emerald-500 hover:scale-110 hover:rotate-3 transition-all duration-300">
          <MessageCircle size={24} className="md:w-7 md:h-7" />
        </button>
      </div>
    </div>
  );
};

export default MainLayout;