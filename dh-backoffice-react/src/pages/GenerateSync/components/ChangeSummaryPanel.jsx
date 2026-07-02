import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Settings, Clock, RefreshCw, Info, Save, FileText, Loader2, CheckCircle } from 'lucide-react';
import { syncSnapshotService } from '../../../firebase/bigseller/syncSnapshotService';
import { useAuth } from '../../../contexts/AuthContext';

export default function ChangeSummaryPanel({ changes, latestSnapshot, onManualReset, onSnapshotSaved }) {
  const [viewMode, setViewMode] = useState('live'); // 'live' or 'saved'
  const { currentUser } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedTxId, setSavedTxId] = useState(null);

  // Determine which data to display
  const displayChanges = viewMode === 'saved' && latestSnapshot?.changes ? latestSnapshot.changes : changes;
  if (!displayChanges) return null;

  const { increased = [], decreased = [], priceChanged = [], otherChanged = [], lastResetDate } = displayChanges;

  const handleSaveSnapshot = async () => {
    setIsSaving(true);
    try {
      const txId = await syncSnapshotService.saveSnapshot(
        changes, 
        currentUser?.uid, 
        currentUser?.displayName || currentUser?.email
      );
      setSavedTxId(txId);
      if (onSnapshotSaved) onSnapshotSaved();
      
      // สลับไปหน้าจอ Saved View เพื่อให้ผู้ใช้สามารถดาวน์โหลด CSV ได้
      setViewMode('saved');
      
      // รีเซ็ต Baseline ทันทีเพื่อให้หน้า Live View ว่างเปล่า พร้อมรับเหตุการณ์ใหม่!
      if (onManualReset) await onManualReset();
      
    } catch (error) {
      console.error("Error saving snapshot", error);
      alert("ไม่สามารถบันทึกธุรกรรมได้");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCSV = () => {
    // Generate CSV Content
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for Thai support
    csvContent += "SKU,Product Name,Type,Old Value,New Value,Details\n";

    increased.forEach(item => {
      csvContent += `"${item.sku}","${item.name || ''}","Stock Increased","${item.oldStock}","${item.newStock}",""\n`;
    });
    decreased.forEach(item => {
      csvContent += `"${item.sku}","${item.name || ''}","Stock Decreased","${item.oldStock}","${item.newStock}",""\n`;
    });
    priceChanged.forEach(item => {
      csvContent += `"${item.sku}","${item.name || ''}","Price Changed","${item.oldPrice}","${item.newPrice}",""\n`;
    });
    otherChanged.forEach(item => {
      csvContent += `"${item.sku}","${item.name || ''}","Other Changes","","","${item.details || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const exportId = viewMode === 'saved' ? latestSnapshot?.transactionId : (savedTxId || dateStr);
    link.setAttribute("download", `DH_Inventory_Detect_${exportId}.csv`);
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
  };

  const isSavedView = viewMode === 'saved';

  return (
    <div className={`w-full h-full flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left relative z-10 p-2 rounded-2xl transition-all ${isSavedView ? 'bg-indigo-50/30 border-2 border-indigo-100 ring-4 ring-indigo-50/50' : ''}`}>
      <div className="flex justify-between items-center px-2 pb-2 border-b border-slate-100 gap-3">
        
        <h4 className={`text-base font-black uppercase tracking-wider ${isSavedView ? 'text-indigo-700' : 'text-slate-800'}`}>
          {isSavedView ? 'บันทึก' : 'รายการเปลี่ยนแปลง ยังไม่ถูกส่งออก (Realtime)'}
        </h4>
        
        <div className="relative flex items-center gap-2">
          {latestSnapshot && latestSnapshot.changes && (
            <button 
              onClick={() => setViewMode(prev => prev === 'live' ? 'saved' : 'live')}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-sm border ${
                isSavedView 
                  ? 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:shadow-md'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:shadow-md'
              }`}
            >
              <RefreshCw size={12} className={isSavedView ? '' : 'rotate-180 transition-transform'} />
              {isSavedView ? 'กลับไปที่ ข้อมูล ล่าสุด' : `ย้อนดู (${latestSnapshot.transactionId})`}
            </button>
          )}
        </div>
      </div>
      
      {/* 1. สต็อกเพิ่ม */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl overflow-hidden">
        <div className="bg-emerald-100/50 px-4 py-2 flex items-center justify-between text-emerald-800 font-bold text-sm border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} /> สต็อกเพิ่มขึ้น
          </div>
          <span className="bg-emerald-200/50 px-2 py-0.5 rounded-full text-xs">{increased.length} รายการ</span>
        </div>
        <div className="max-h-40 overflow-y-auto p-2">
          {increased.length === 0 ? (
            <div className="text-center text-xs text-emerald-600/60 py-2 font-medium">ไม่มีรายการสต็อกเพิ่มขึ้น</div>
          ) : (
            increased.map(item => (
              <div key={item.sku} className="flex justify-between items-center text-xs p-2 hover:bg-emerald-100/30 rounded-lg">
                <span className="font-medium text-slate-700 truncate mr-2" title={item.name}>{item.sku}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 line-through">{item.oldStock}</span>
                  <span className="text-emerald-600 font-black">→ {item.newStock}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. สต็อกลด */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl overflow-hidden">
        <div className="bg-blue-100/50 px-4 py-2 flex items-center justify-between text-blue-800 font-bold text-sm border-b border-blue-100">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} /> สต็อกลดลง
          </div>
          <span className="bg-blue-200/50 px-2 py-0.5 rounded-full text-xs">{decreased.length} รายการ</span>
        </div>
        <div className="max-h-40 overflow-y-auto p-2">
          {decreased.length === 0 ? (
            <div className="text-center text-xs text-blue-600/60 py-2 font-medium">ไม่มีรายการสต็อกลดลง (ขายออก)</div>
          ) : (
            decreased.map(item => (
              <div key={item.sku} className="flex justify-between items-center text-xs p-2 hover:bg-blue-100/30 rounded-lg">
                <div className="flex items-center min-w-0 mr-2 gap-2">
                  <span className="font-medium text-slate-700 shrink-0" title={item.name}>{item.sku}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 line-through">{item.oldStock}</span>
                  <span className="text-blue-600 font-black">→ {item.newStock}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. ราคาเปลี่ยน */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl overflow-hidden shrink-0">
        <div className="bg-amber-100/50 px-4 py-2 flex items-center justify-between text-amber-800 font-bold text-sm border-b border-amber-100">
          <div className="flex items-center gap-2">
            <DollarSign size={16} /> ราคาเปลี่ยนแปลง
          </div>
          <span className="bg-amber-200/50 px-2 py-0.5 rounded-full text-xs">{priceChanged.length} รายการ</span>
        </div>
        <div className="max-h-32 overflow-y-auto p-2 custom-scrollbar">
          {priceChanged.length === 0 ? (
            <div className="text-center text-xs text-amber-600/60 py-2 font-medium">ไม่มีการปรับเปลี่ยนราคาสินค้า</div>
          ) : (
            priceChanged.map(item => (
              <div key={item.sku} className="flex justify-between items-center text-xs p-2 hover:bg-amber-100/30 rounded-lg">
                <span className="font-medium text-slate-700 truncate mr-2" title={item.name}>{item.sku}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 line-through">฿{item.oldPrice}</span>
                  <span className="text-amber-600 font-black">→ ฿{item.newPrice}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. ข้อมูลทั่วไปเปลี่ยน */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl overflow-hidden shrink-0">
        <div className="bg-purple-100/50 px-4 py-2 flex items-center justify-between text-purple-800 font-bold text-sm border-b border-purple-100">
          <div className="flex items-center gap-2">
            <Info size={16} /> ข้อมูลทั่วไปเปลี่ยนแปลง
          </div>
          <span className="bg-purple-200/50 px-2 py-0.5 rounded-full text-xs">{otherChanged.length} รายการ</span>
        </div>
        <div className="max-h-32 overflow-y-auto p-2 custom-scrollbar">
          {otherChanged.length === 0 ? (
            <div className="text-center text-xs text-purple-600/60 py-2 font-medium">ไม่มีการเปลี่ยนแปลงข้อมูลพื้นฐาน</div>
          ) : (
            otherChanged.map(item => (
              <div key={item.sku} className="flex justify-between items-center text-xs p-2 hover:bg-purple-100/30 rounded-lg">
                <span className="font-medium text-slate-700 truncate mr-2" title={item.name}>{item.sku}</span>
                <div className="flex items-center gap-2 shrink-0 text-purple-600 font-medium">
                  {item.details}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-100 mt-auto shrink-0 pb-2">
        {!isSavedView && (
          <button
            onClick={handleSaveSnapshot}
            disabled={isSaving || (increased.length === 0 && decreased.length === 0 && priceChanged.length === 0 && otherChanged.length === 0)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm ${
              savedTxId 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed'
            }`}
          >
            {isSaving ? (
               <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</>
            ) : savedTxId ? (
               <><CheckCircle size={16} /> บันทึกแล้ว ({savedTxId})</>
            ) : (
               <><Save size={16} /> บันทึกการดักจับ (สร้าง TX)</>
            )}
          </button>
        )}

        <button
          onClick={handleDownloadCSV}
          disabled={!isSavedView && !savedTxId && increased.length === 0 && decreased.length === 0 && priceChanged.length === 0 && otherChanged.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText size={16} className="text-blue-500" /> 
          {isSavedView ? `ดาวน์โหลด CSV (${latestSnapshot?.transactionId})` : 'ดาวน์โหลด (.csv)'}
        </button>
      </div>
    </div>
  );
}
