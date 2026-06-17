import React from 'react';
import { PlusCircle, X, Send, RefreshCw, Info } from 'lucide-react';

export default function ReportModal({ isReportModalOpen, setIsReportModalOpen, reportForm, setReportForm, isReporting, handleSubmitReport }) {
  if (!isReportModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200">
      <div className="bg-dh-surface rounded-xl shadow-dh-elevated w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-dh-border">
        <div className="bg-dh-surface px-5 py-3 border-b border-dh-border flex justify-between items-center">
          <h3 className="font-bold text-dh-main flex items-center gap-2 text-sm">
            <PlusCircle size={16} className="text-dh-accent"/>
            แจ้งเพิ่มสินค้า ยังไม่มีขาย
          </h3>
          <button onClick={() => setIsReportModalOpen(false)} className="text-dh-muted hover:text-dh-main p-1 rounded-md hover:bg-dh-base transition-colors">
            <X size={16}/>
          </button>
        </div>
        
        <form onSubmit={handleSubmitReport} className="p-5 space-y-3 bg-dh-base/50">
          
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-dh-muted uppercase tracking-wide flex items-center gap-1">
              คำค้นหาที่ลูกค้าต้องการ <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" required 
              value={reportForm.keyword} 
              onChange={e => setReportForm({...reportForm, keyword: e.target.value})} 
              className="w-full p-2 bg-dh-surface border border-dh-border rounded-md outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 text-dh-main text-xs transition-all" 
              placeholder="เช่น Adapter Swift 7520" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wide">หมวดหมู่โดยประมาณ</label>
              <input 
                type="text" 
                value={reportForm.category} 
                onChange={e => setReportForm({...reportForm, category: e.target.value})} 
                className="w-full p-2 bg-dh-surface border border-dh-border rounded-md outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 text-dh-main text-xs transition-all"
                placeholder="เช่น Adapter" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wide">ชื่อลูกค้า (ถ้ามี)</label>
              <input 
                type="text" 
                value={reportForm.customerName} 
                onChange={e => setReportForm({...reportForm, customerName: e.target.value})} 
                className="w-full p-2 bg-dh-surface border border-dh-border rounded-md outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 text-dh-main text-xs transition-all"
                placeholder="เช่น คุณสมชาย" 
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wide flex items-center justify-between">
              ลิงก์อ้างอิง <span className="text-[9px] font-normal normal-case">(Shopee, Web ฯลฯ)</span>
            </label>
            <input 
              type="url" 
              value={reportForm.referenceLink} 
              onChange={e => setReportForm({...reportForm, referenceLink: e.target.value})} 
              className="w-full p-2 bg-dh-surface border border-dh-border rounded-md outline-none focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/20 text-dh-main text-xs transition-all"
              placeholder="https://..." 
            />
          </div>

          <div className="bg-blue-50/50 p-2.5 rounded-md border border-blue-100 flex items-start gap-1.5 mt-1">
            <Info size={12} className="text-blue-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-dh-muted leading-relaxed">
              ส่งเรื่องเข้า <span className="text-blue-600 font-semibold">To-do ของผู้จัดการและฝ่ายจัดซื้อ</span>
            </p>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isReporting} 
              className="w-full py-2 bg-dh-accent hover:bg-dh-accent-hover text-white font-bold rounded-md shadow-sm transition-all flex justify-center items-center gap-2 text-xs disabled:opacity-70"
            >
              {isReporting ? <RefreshCw size={14} className="animate-spin"/> : <Send size={14}/>} 
              {isReporting ? 'กำลังส่งข้อมูล...' : 'ยืนยันส่งเรื่อง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
