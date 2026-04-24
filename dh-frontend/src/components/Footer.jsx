import React from 'react';
import { MapPin, MessageCircle, Phone, ChevronRight, ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative bg-slate-900 border-t border-slate-800 pt-16 pb-24 md:pb-12 mt-12 md:mt-24 overflow-hidden text-slate-300">
      
      {/* Tech Background Layer */}
      <div className="absolute inset-0 bg-tech-grid-dark opacity-20 pointer-events-none z-0"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12">
          
          {/* 1. Brand & Corporate Col */}
          <div className="col-span-1">
             <div className="flex flex-col items-start leading-none mb-6">
               {/* Logo in Corporate Badge Style */}
               <div className="bg-white p-2.5 rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-4 inline-block">
                 <img src="/logo.png" alt="DH Notebook Logo" className="h-7 md:h-9 object-contain" />
               </div>
            </div>
            <p className="text-sm text-slate-400 mb-6 pr-4 leading-relaxed font-medium">
              ผู้นำเข้าและจัดจำหน่ายอะไหล่โน๊ตบุ๊คครบวงจร พร้อมเครือข่ายช่างพันธมิตรทั่วประเทศ ที่พร้อมให้บริการคุณด้วยระบบปฏิบัติการอัจฉริยะ
            </p>
            <div className="flex items-center space-x-2 text-cyber-emerald text-xs font-tech font-bold tracking-widest uppercase bg-emerald-900/20 px-3 py-2 rounded-sm border border-emerald-500/20 inline-flex">
               <ShieldCheck size={16} />
               <span>Verified B2B Partner</span>
            </div>
          </div>

          {/* 2. Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-5 md:mb-6 flex items-center text-sm md:text-base tracking-wide">
              <span className="w-1.5 h-4 bg-cyber-blue rounded-sm mr-2.5 shadow-[0_0_8px_rgba(14,165,233,0.5)]"></span>
              หมวดหมู่สินค้า
            </h3>
            <ul className="space-y-3.5 text-sm">
              {['อะไหล่ภายใน', 'อุปกรณ์ภายนอก', 'เครื่องมือช่าง', 'โปรโมชั่นพาร์ทเนอร์'].map(item => (
                <li key={item}>
                  <button className="flex items-center text-slate-400 hover:text-cyber-blue hover:translate-x-1.5 transition-all group">
                    <ChevronRight size={14} className="mr-1.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Support Links */}
          <div>
            <h3 className="text-white font-bold mb-5 md:mb-6 flex items-center text-sm md:text-base tracking-wide">
              <span className="w-1.5 h-4 bg-amber-500 rounded-sm mr-2.5 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
              ศูนย์ช่วยเหลือ
            </h3>
            <ul className="space-y-3.5 text-sm">
              {['คู่มือการใช้งานระบบ', 'เงื่อนไขการรับประกัน (Claim)', 'สมัครตัวแทนจำหน่าย', 'ติดตามสถานะคำสั่งซื้อ'].map(item => (
                <li key={item}>
                  <button className="flex items-center text-slate-400 hover:text-amber-400 hover:translate-x-1.5 transition-all group">
                    <ChevronRight size={14} className="mr-1.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Contact HQ */}
          <div>
            <h3 className="text-white font-bold mb-5 md:mb-6 flex items-center text-sm md:text-base tracking-wide">
              <span className="w-1.5 h-4 bg-cyber-emerald rounded-sm mr-2.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              สำนักงานใหญ่ (HQ)
            </h3>
            <ul className="space-y-3 text-xs md:text-sm">
              <li className="flex items-start bg-slate-800/60 p-3 rounded-sm border border-slate-700/50 hover:border-slate-500 transition-colors group">
                <MapPin size={18} className="mr-3 text-slate-400 group-hover:text-cyber-blue flex-shrink-0 mt-0.5 transition-colors"/>
                <span className="leading-relaxed text-slate-400 group-hover:text-slate-200 transition-colors">
                  ศูนย์การค้าเซียร์รังสิต ชั้น 3 ห้อง xxx ถ.พหลโยธิน จ.ปทุมธานี 12130
                </span>
              </li>
              <li className="flex items-center bg-slate-800/60 p-3 rounded-sm border border-slate-700/50 hover:border-cyber-emerald hover:shadow-[0_0_10px_rgba(16,185,129,0.1)] transition-all group">
                 <MessageCircle size={18} className="mr-3 text-slate-400 group-hover:text-cyber-emerald flex-shrink-0 transition-colors"/>
                 <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
                   Line ID: <strong className="text-white font-tech tracking-wider">@dhnotebook</strong>
                 </span>
              </li>
              <li className="flex items-center bg-slate-800/60 p-3 rounded-sm border border-slate-700/50 hover:border-cyber-blue hover:shadow-[0_0_10px_rgba(14,165,233,0.1)] transition-all group">
                 <Phone size={18} className="mr-3 text-slate-400 group-hover:text-cyber-blue flex-shrink-0 transition-colors"/>
                 <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
                   Tel: <strong className="text-white font-tech tracking-wider">02-xxx-xxxx</strong>
                 </span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs text-slate-500 space-y-4 md:space-y-0">
          <p className="font-tech tracking-widest uppercase">
            © 2027 DH NOTEBOOK SYSTEM. ALL RIGHTS RESERVED.
          </p>
          <div className="flex space-x-6 font-medium">
            <span className="hover:text-cyber-emerald cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-cyber-emerald cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;