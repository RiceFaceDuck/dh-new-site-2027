import React from 'react';
import { MapPin, MessageCircle, User } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-24 md:pb-10 mt-12 md:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="col-span-1">
             <div className="flex flex-col items-start leading-none mb-6">
              <span className="text-4xl font-black text-emerald-600 tracking-tighter">DH</span>
              <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-sm mt-1 tracking-widest shadow-sm">NOTEBOOK</span>
            </div>
            <p className="text-sm text-gray-500 mb-6 pr-4 leading-relaxed">
              ผู้นำเข้าและจัดจำหน่ายอะไหล่โน๊ตบุ๊คครบวงจร พร้อมเครือข่ายช่างพันธมิตรทั่วประเทศ ที่พร้อมให้บริการคุณ
            </p>
            <div className="flex space-x-4">
               <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-emerald-100 flex items-center justify-center text-gray-600 hover:text-emerald-600 cursor-pointer transition-colors">FB</div>
               <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-emerald-100 flex items-center justify-center text-gray-600 hover:text-emerald-600 cursor-pointer transition-colors">LN</div>
               <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-emerald-100 flex items-center justify-center text-gray-600 hover:text-emerald-600 cursor-pointer transition-colors">TT</div>
            </div>
          </div>
          
          {/* Links Col 1 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6 text-lg">หมวดหมู่สินค้ายอดฮิต</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer">หน้าจอโน๊ตบุ๊ค (Screen)</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer">คีย์บอร์ด (Keyboard)</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer">แบตเตอรี่ (Battery)</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer">สายแพร & บานพับ</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer">อะแดปเตอร์ (Adapter)</li>
            </ul>
          </div>
          
          {/* Links Col 2 */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6 text-lg">Partner Program</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer font-medium text-emerald-600">สมัครเป็นพาร์ทเนอร์ 🚀</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer">เข้าสู่ระบบหลังบ้าน (Admin)</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer">ลงโฆษณากับเรา</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer">ตรวจสอบสถานะการเคลม</li>
            </ul>
          </div>
          
          {/* Contact Col */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6 text-lg">ติดต่อเรา</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li className="flex items-start">
                <MapPin size={18} className="mr-3 mt-0.5 text-emerald-600 flex-shrink-0"/> 
                <span>ศูนย์การค้าเซียร์รังสิต ชั้น 3 ห้อง xxx ถ.พหลโยธิน จ.ปทุมธานี 12130</span>
              </li>
              <li className="flex items-center">
                 <MessageCircle size={18} className="mr-3 text-emerald-600 flex-shrink-0"/>
                 <span>Line Official: <strong className="text-gray-800">@dhnotebook</strong></span>
              </li>
              <li className="flex items-center">
                 <User size={18} className="mr-3 text-emerald-600 flex-shrink-0"/>
                 <span>Tel: 02-xxx-xxxx, 08x-xxx-xxxx</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 space-y-4 md:space-y-0">
          <p className="font-medium text-gray-500">© 2026 DH Notebook. All rights reserved.</p>
          <div className="flex space-x-6">
            <span className="hover:text-emerald-600 cursor-pointer transition-colors">นโยบายความเป็นส่วนตัว (PDPA)</span>
            <span className="hover:text-emerald-600 cursor-pointer transition-colors">เงื่อนไขการให้บริการ</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;