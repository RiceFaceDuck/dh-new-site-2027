import React from 'react';
import { ShieldCheck } from 'lucide-react';

const FooterBrand = ({ companyConfig }) => {
  return (
    <div className="col-span-1">
      <div className="flex flex-col items-start leading-none mb-6">
        {/* Logo in Corporate Badge Style */}
        <div className="bg-white p-2.5 rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-4 inline-block transform hover:scale-105 transition-transform duration-300">
          <img src={companyConfig?.logoUrl || "/logo.png"} alt="Brand Logo" className="h-7 md:h-9 object-contain" />
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-6 pr-4 leading-relaxed font-medium">
        {companyConfig?.description || "ผู้นำเข้าและจัดจำหน่ายอะไหล่โน๊ตบุ๊คครบวงจร"}
      </p>
      <div className="flex items-center space-x-2 text-cyber-emerald text-xs font-tech font-bold tracking-widest uppercase bg-emerald-900/20 px-3 py-2 rounded-sm border border-emerald-500/20 inline-flex shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-shadow">
        <ShieldCheck size={16} />
        <span>Verified B2B Partner</span>
      </div>
    </div>
  );
};

export default FooterBrand;
