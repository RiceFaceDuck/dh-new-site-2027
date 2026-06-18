import React from 'react';
import { MapPin, CheckCircle2, Copy } from 'lucide-react';

export default function ShippingInfo({ getFormattedAddress, handleCopy, copiedField }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ข้อมูลจัดส่งสินค้า
      </h3>
      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 relative group">
        <p className="text-[10px] text-emerald-600 font-bold mb-1.5 flex items-center gap-1.5">
          <MapPin size={12}/> ที่อยู่เริ่มต้น
        </p>
        <p className="text-sm text-slate-700 leading-relaxed pr-8">{getFormattedAddress()}</p>
        
        <button 
          onClick={() => handleCopy(getFormattedAddress(), 'address')}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-emerald-600 bg-white shadow-sm border border-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          title="คัดลอกที่อยู่"
        >
          {copiedField === 'address' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
