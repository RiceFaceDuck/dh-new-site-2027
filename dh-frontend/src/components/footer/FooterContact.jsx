import React from 'react';
import { MapPin, MessageCircle, Phone } from 'lucide-react';

const FooterContact = ({ companyConfig }) => {
  return (
    <div>
      <h3 className="text-white font-bold mb-5 md:mb-6 flex items-center text-sm md:text-base tracking-wide group">
        <span className="w-1.5 h-4 bg-cyber-emerald rounded-sm mr-2.5 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-transform group-hover:scale-y-125 duration-300"></span>
        <span className="group-hover:text-slate-200 transition-colors">สำนักงานใหญ่ (HQ)</span>
      </h3>
      <ul className="space-y-3 text-xs md:text-sm">
        <li className="flex items-start bg-slate-800/60 p-3 rounded-md border border-slate-700/50 hover:border-slate-500 hover:bg-slate-800 transition-all duration-300 group shadow-sm hover:shadow-md">
          <MapPin size={18} className="mr-3 text-slate-400 group-hover:text-cyber-blue flex-shrink-0 mt-0.5 transition-colors"/>
          <span className="leading-relaxed text-slate-400 group-hover:text-slate-200 transition-colors">
            {companyConfig?.address || "ศูนย์การค้าเซียร์รังสิต ชั้น 3 ห้อง xxx ถ.พหลโยธิน จ.ปทุมธานี 12130"}
          </span>
        </li>
        <li className="flex items-center bg-slate-800/60 p-3 rounded-md border border-slate-700/50 hover:border-cyber-emerald hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:bg-emerald-900/10 transition-all duration-300 group">
           <MessageCircle size={18} className="mr-3 text-slate-400 group-hover:text-cyber-emerald flex-shrink-0 transition-colors"/>
           <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
             Line ID: <strong className="text-white font-tech tracking-wider group-hover:text-cyber-emerald transition-colors">{companyConfig?.lineId || "@dhnotebook"}</strong>
           </span>
        </li>
        <li className="flex items-center bg-slate-800/60 p-3 rounded-md border border-slate-700/50 hover:border-cyber-blue hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] hover:bg-sky-900/10 transition-all duration-300 group">
           <Phone size={18} className="mr-3 text-slate-400 group-hover:text-cyber-blue flex-shrink-0 transition-colors"/>
           <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
             Tel: <strong className="text-white font-tech tracking-wider group-hover:text-cyber-blue transition-colors">{companyConfig?.phone || "02-xxx-xxxx"}</strong>
           </span>
        </li>
      </ul>
    </div>
  );
};

export default FooterContact;
