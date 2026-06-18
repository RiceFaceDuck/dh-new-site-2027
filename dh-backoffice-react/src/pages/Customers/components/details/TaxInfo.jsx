import React from 'react';
import { Building2, User, CheckCircle2, Copy, FileText, Loader2 } from 'lucide-react';

export default function TaxInfo({ isLoadingTax, secureTaxInfo, handleCopy, copiedField }) {
  return (
    <div className="space-y-3 pt-4 border-t border-slate-100">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> ข้อมูลภาษี (Tax Info)
      </h3>
      
      {isLoadingTax ? (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
          <span className="text-xs font-medium">กำลังดึงข้อมูลความปลอดภัย...</span>
        </div>
      ) : secureTaxInfo ? (
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3 relative group">
          <div>
            <p className="text-[10px] text-indigo-600 font-bold mb-1 flex items-center gap-1.5">
              {secureTaxInfo.type === 'company' ? <Building2 size={12}/> : <User size={12}/>} 
              {secureTaxInfo.type === 'company' ? 'นิติบุคคล' : 'บุคคลธรรมดา'}
            </p>
            <p className="text-sm font-bold text-slate-800 pr-8">{secureTaxInfo.name}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-semibold mb-0.5">เลขประจำตัวผู้เสียภาษี</p>
              <p className="text-sm font-mono font-bold text-slate-700 tracking-widest">{secureTaxInfo.taxId}</p>
            </div>
            {secureTaxInfo.type === 'company' && (
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-semibold mb-0.5">สาขา</p>
                <p className="text-xs font-bold text-slate-700 bg-white border border-indigo-100 px-2 py-0.5 rounded">
                  {secureTaxInfo.isHeadOffice ? 'สำนักงานใหญ่' : `สาขา ${secureTaxInfo.branchCode}`}
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-indigo-100/50">
            <p className="text-[10px] text-slate-500 font-semibold mb-0.5">ที่อยู่ออกใบกำกับภาษี</p>
            <p className="text-xs text-slate-600 leading-relaxed pr-8">{secureTaxInfo.address}</p>
          </div>

          <button 
            onClick={() => handleCopy(`${secureTaxInfo.name} | เลขผู้เสียภาษี: ${secureTaxInfo.taxId} | ${secureTaxInfo.isHeadOffice ? 'สำนักงานใหญ่' : `สาขา ${secureTaxInfo.branchCode}`} | ที่อยู่: ${secureTaxInfo.address}`, 'tax')}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-indigo-600 bg-white shadow-sm border border-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            title="คัดลอกข้อมูลภาษีทั้งหมด"
          >
            {copiedField === 'tax' ? <CheckCircle2 size={16} className="text-indigo-500" /> : <Copy size={16} />}
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 border-dashed flex flex-col items-center justify-center text-slate-400">
          <FileText className="w-6 h-6 mb-2 opacity-50" />
          <span className="text-xs font-medium">ลูกค้ายังไม่ได้ระบุข้อมูลภาษี</span>
        </div>
      )}
    </div>
  );
}
