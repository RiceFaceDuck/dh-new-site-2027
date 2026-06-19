import React from 'react';
import { MapPin, ExternalLink, ShieldCheck, CheckCircle2, XCircle, Loader2, User, Mail } from 'lucide-react';

export default function PartnerCard({ 
  partner, 
  togglePartnerStatus, 
  togglePartnerVerification, 
  actionLoading 
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-md ${
      partner.isActive ? 'border-[#0870B8]/30' : 'border-rose-200 opacity-80'
    }`}>
      
      {/* Header */}
      <div className={`px-5 py-4 border-b flex items-center justify-between ${partner.isActive ? 'bg-[#f8fbff] border-[#E6F0F9]' : 'bg-rose-50 border-rose-100'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${partner.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className={`text-xs font-bold uppercase tracking-widest ${partner.isActive ? 'text-[#0870B8]' : 'text-rose-600'}`}>
            {partner.isActive ? 'ONLINE' : 'SUSPENDED'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-tech">ID: {partner.id.substring(0, 8)}...</div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex gap-4 items-start mb-4">
            <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 p-1">
              <img src={partner.storeLogo || '/logo.png'} alt="logo" className="w-full h-full object-contain" onError={(e)=>{e.target.src='https://placehold.co/100x100?text=Logo'}} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{partner.storeName || 'ไม่ระบุชื่อร้าน'}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                <User size={12}/> {partner.contactName || 'ไม่ระบุชื่อผู้ติดต่อ'}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                <Mail size={12}/> {partner.contactEmail || 'ไม่มีอีเมล'}
              </p>
            </div>
        </div>

        {/* แผนที่และบริการ */}
        <div className="space-y-3 mt-auto">
            {partner.mapsUrl && (
              <button 
                onClick={() => window.open(partner.mapsUrl, '_blank')}
                className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 flex items-center justify-between transition-colors group-hover:border-[#0870B8]/30"
              >
                <span className="flex items-center gap-1.5 truncate"><MapPin size={14} className="text-[#0870B8]" /> ตรวจสอบพิกัดแผนที่</span>
                <ExternalLink size={14} className="text-slate-400" />
              </button>
            )}
            
            {partner.services && (
              <div className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-lg">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">รายละเอียดบริการ</p>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{partner.services}</p>
              </div>
            )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-end gap-2">
        <button 
          onClick={() => togglePartnerStatus(partner.id, partner.isActive)}
          disabled={actionLoading === partner.id}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            partner.isActive 
            ? 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50' 
            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md'
          }`}
        >
          {actionLoading === partner.id ? <Loader2 size={14} className="animate-spin" /> : (partner.isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />)}
          {partner.isActive ? 'ระงับพาร์ทเนอร์' : 'เปิดใช้งานอีกครั้ง'}
        </button>
        
        <button 
          onClick={() => togglePartnerVerification(partner.id, partner.isVerified)}
          disabled={actionLoading === `verify_${partner.id}`}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            partner.isVerified 
            ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}
        >
          {actionLoading === `verify_${partner.id}` ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          {partner.isVerified ? 'ยกเลิก Verification Badge' : 'มอบ Verification Badge'}
        </button>
      </div>
    </div>
  );
}
