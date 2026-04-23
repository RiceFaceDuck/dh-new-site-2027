import React from 'react';
import { MapPin, MessageCircle, User } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-24 md:pb-12 mt-12 md:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Col */}
          <div className="col-span-1">
             <div className="flex flex-col items-start leading-none mb-6">
              <span className="text-2xl font-black text-emerald-700 tracking-tighter">DH</span>
              <span className="text-[9px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-sm mt-1 tracking-widest shadow-sm">NOTEBOOK</span>
            </div>
            <p className="text-sm text-slate-500 mb-6 pr-4 leading-relaxed font-medium">
              ผู้นำเข้าและจัดจำหน่ายอะไหล่โน๊ตบุ๊คครบวงจร พร้อมเครือข่ายช่างพันธมิตรทั่วประเทศ ที่พร้อมให้บริการคุณ
            </p>
            <div className="flex space-x-3">
               <div className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 flex items-center justify-center text-slate-600 hover:text-emerald-600 cursor-pointer transition-all shadow-sm">FB</div>
               <div className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 flex items-center justify-center text-slate-600 hover:text-emerald-600 cursor-pointer transition-all shadow-sm">LN</div>
               <div className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 flex items-center justify-center text-slate-600 hover:text-emerald-600 cursor-pointer transition-all shadow-sm">TT</div>
            </div>
          </div>
          
          {/* Links Col 1 */}
          <div>
            <h4 className="font-bold text-slate-800 mb-6 text-lg tracking-tight">หมวดหมู่สินค้ายอดฮิต</h4>
            <ul className="space-y-4 text-sm text-slate-600 font-medium">
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>หน้าจอโน๊ตบุ๊ค (Screen)</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>คีย์บอร์ด (Keyboard)</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>แบตเตอรี่ (Battery)</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>สายแพร & บานพับ</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>อะแดปเตอร์ (Adapter)</li>
            </ul>
          </div>
          
          {/* Links Col 2 */}
          <div>
            <h4 className="font-bold text-slate-800 mb-6 text-lg tracking-tight">Partner Program</h4>
            <ul className="space-y-4 text-sm text-slate-600 font-medium">
              <li className="hover:text-emerald-700 hover:translate-x-1 transition-all cursor-pointer font-bold text-emerald-600 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>สมัครเป็นพาร์ทเนอร์ 🚀</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>เข้าสู่ระบบหลังบ้าน (Admin)</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>ลงโฆษณากับเรา</li>
              <li className="hover:text-emerald-600 hover:translate-x-1 transition-all cursor-pointer flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>ตรวจสอบสถานะการเคลม</li>
            </ul>
          </div>
          
          {/* Contact Col */}
          <div>
            <h4 className="font-bold text-slate-800 mb-6 text-lg tracking-tight">ติดต่อเรา</h4>
            <ul className="space-y-4 text-sm text-slate-600 font-medium">
              <li className="flex items-start bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <MapPin size={18} className="mr-3 mt-0.5 text-emerald-600 flex-shrink-0"/> 
                <span className="leading-relaxed">ศูนย์การค้าเซียร์รังสิต ชั้น 3 ห้อง xxx ถ.พหลโยธิน จ.ปทุมธานี 12130</span>
              </li>
              <li className="flex items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                 <MessageCircle size={18} className="mr-3 text-emerald-600 flex-shrink-0"/>
                 <span>Line Official: <strong className="text-slate-800">@dhnotebook</strong></span>
              </li>
              <li className="flex items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                 <User size={18} className="mr-3 text-emerald-600 flex-shrink-0"/>
                 <span>Tel: <strong className="text-slate-800">02-xxx-xxxx</strong></span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 space-y-4 md:space-y-0">
          <p className="font-semibold text-slate-600">© 2026 DH Notebook. All rights reserved.</p>
          <div className="flex space-x-6 font-medium">
            <span className="hover:text-emerald-600 cursor-pointer transition-colors">นโยบายความเป็นส่วนตัว (PDPA)</span>
            <span className="hover:text-emerald-600 cursor-pointer transition-colors">เงื่อนไขการให้บริการ</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;