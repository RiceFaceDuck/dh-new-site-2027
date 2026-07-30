import { useState } from 'react';
import { PackageSearch, Download, FileSpreadsheet, HelpCircle, RotateCcw, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSourcingRequests } from './hooks/useSourcingRequests';

export default function NonExistingProducts() {
  const { requests, loading, resetAllRequests } = useSourcingRequests();
  const [showMiniGuide, setShowMiniGuide] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toMillis) return '-';
    return new Date(timestamp.toMillis()).toLocaleDateString('th-TH', { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDownloadExcel = () => {
    if (!requests || requests.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออกเป็นไฟล์ Excel");
      return;
    }

    const exportData = requests.map((req, index) => ({
      'ลำดับ': index + 1,
      'คำค้นหา (Keyword)': req.keyword || '-',
      'หมวดหมู่ (Category)': req.category || '-',
      'ชื่อลูกค้า (Customer)': req.customerName || '-',
      'ค้นหาล่าสุด': formatDate(req.lastRequestedAt),
      'ลิงก์อ้างอิง (Link)': req.referenceLink || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set Column Widths for Excel Sheet
    ws['!cols'] = [
      { wch: 8 },  // ลำดับ
      { wch: 30 }, // Keyword
      { wch: 20 }, // Category
      { wch: 20 }, // Customer
      { wch: 25 }, // Last Requested
      { wch: 40 }  // Reference Link
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sourcing_Demand");
    const fileName = `Sourcing_Demand_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleBackupAndReset = async () => {
    if (!requests || requests.length === 0) {
      alert("ไม่มีข้อมูลสำหรับ Back up & Reset");
      return;
    }

    const confirmReset = window.confirm(
      `คุณต้องการสำรองข้อมูลเป็นไฟล์ Excel (.xlsx) และเคลียร์ตารางทั้งหมด (${requests.length} รายการ) เป็นค่าเริ่มต้นใช่หรือไม่?`
    );

    if (!confirmReset) return;

    setIsResetting(true);
    try {
      // 1. Download Backup File first
      handleDownloadExcel();

      // 2. Clear collection
      const success = await resetAllRequests();
      if (success) {
        alert("สำรองข้อมูลเป็นไฟล์ Excel และเคลียร์ตารางเริ่มต้นใหม่เรียบร้อยแล้ว!");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการ Reset");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-3">

      {/* Mini Guide Tooltip Banner (Compact) */}
      {showMiniGuide && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-3 text-xs text-emerald-900 dark:text-emerald-200 space-y-1 animate-in fade-in duration-200">
          <div className="font-extrabold flex items-center justify-between">
            <span>💡 คำแนะนำการใช้งานตาราง Sourcing Demand</span>
            <button onClick={() => setShowMiniGuide(false)} className="text-emerald-600 hover:text-emerald-800 text-[10px] font-bold">✕ ปิด</button>
          </div>
          <p className="text-[11px] leading-relaxed">
            - ดูรายชื่อสินค้าที่มีการค้นหาจากหน้าร้านเรียงตามเวลาล่าสุด <br/>
            - กดปุ่ม <b>'ดาวน์โหลด .xlsx'</b> เพื่อนำไปเปิดใน Microsoft Excel / Google Sheets <br/>
            - กดปุ่ม <b>'Back up & Reset'</b> เพื่อดาวน์โหลดสำรองข้อมูลและเคลียร์ตารางล้างค่าเริ่มต้นใหม่
          </p>
        </div>
      )}

      {/* Excel Sheet Container */}
      <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-900/60 rounded-xl shadow-md overflow-hidden">
        
        {/* Excel Header Bar */}
        <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-800 p-1.5 rounded-md border border-emerald-600 shadow-inner">
              <FileSpreadsheet size={18} className="text-emerald-200" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide flex items-center gap-2">
                <span>Sourcing_Demand_Report.xlsx</span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">
                  {loading ? 'กำลังโหลด...' : `${requests.length} แถว`}
                </span>
                <button 
                  type="button"
                  onClick={() => setShowMiniGuide(!showMiniGuide)}
                  className="text-emerald-200 hover:text-white transition-colors ml-1"
                  title="ดูคำแนะนำ"
                >
                  <HelpCircle size={15} />
                </button>
              </h3>
              <p className="text-[11px] text-emerald-200">
                ตารางบันทึกข้อมูลสินค้ายังไม่มีจำหน่าย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={requests.length === 0 || isResetting}
              onClick={handleBackupAndReset}
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 font-black text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition-all border border-amber-300 cursor-pointer"
              title="สำรองข้อมูลเป็นไฟล์ Excel แล้วล้างตารางเริ่มต้นใหม่"
            >
              <RotateCcw size={14} className={`stroke-[2.5] ${isResetting ? 'animate-spin' : ''}`} />
              <span>Back up & Reset</span>
            </button>

            <button
              type="button"
              disabled={requests.length === 0}
              onClick={handleDownloadExcel}
              className="bg-white text-emerald-800 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 font-black text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all border border-emerald-200 cursor-pointer"
            >
              <Download size={15} className="text-emerald-700 stroke-[2.5]" />
              <span>ดาวน์โหลด .xlsx</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase font-mono text-[11px]">
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-12 text-center bg-slate-200/60 dark:bg-slate-800 font-bold">#</th>
                <th className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700 font-extrabold">คำค้นหา (Keyword)</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 font-extrabold">หมวดหมู่</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 font-extrabold">ชื่อลูกค้า</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 font-extrabold">ค้นหาล่าสุด</th>
                <th className="py-2.5 px-3 font-extrabold">ลิงก์อ้างอิง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                [1, 2, 3].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-slate-400 bg-slate-50 dark:bg-slate-800/40">{n}</td>
                    <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-800"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4"></div></td>
                    <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-800"><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded-md w-1/2"></div></td>
                    <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-800"><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded-md w-1/2"></div></td>
                    <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-800"><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded-md w-24"></div></td>
                    <td className="py-3 px-3"><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded-md w-16"></div></td>
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <>
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
                      <PackageSearch size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                      <p className="font-bold text-sm text-slate-600 dark:text-slate-300">ตารางว่างเปล่า (ยังไม่มีบันทึกข้อมูลสินค้ายังไม่มีจำหน่าย)</p>
                      <p className="text-xs text-slate-400 mt-1">เมื่อพนักงานค้นหาสินค้าที่หน้าร้านแล้วไม่พบ รายการจะถูกบันทึกลงในตารางนี้โดยอัตโนมัติ</p>
                    </td>
                  </tr>
                  {[1, 2, 3].map((rowNum) => (
                    <tr key={rowNum} className="border-t border-slate-100 dark:border-slate-800/40 text-slate-300 dark:text-slate-700 italic">
                      <td className="py-2 px-3 text-center border-r border-slate-200/50 dark:border-slate-800/50 font-mono text-[10px] bg-slate-50/30 dark:bg-slate-800/20">{rowNum}</td>
                      <td className="py-2 px-4 border-r border-slate-200/50 dark:border-slate-800/50 text-[11px]">-</td>
                      <td className="py-2 px-3 border-r border-slate-200/50 dark:border-slate-800/50 text-[11px]">-</td>
                      <td className="py-2 px-3 border-r border-slate-200/50 dark:border-slate-800/50 text-[11px]">-</td>
                      <td className="py-2 px-3 border-r border-slate-200/50 dark:border-slate-800/50 text-[11px]">-</td>
                      <td className="py-2 px-3 text-[11px]">-</td>
                    </tr>
                  ))}
                </>
              ) : (
                requests.map((req, idx) => (
                  <tr 
                    key={req.id} 
                    className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
                  >
                    {/* Row Index */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-slate-400 bg-slate-50/50 dark:bg-slate-800/40 font-bold">
                      {idx + 1}
                    </td>
                    
                    {/* Keyword */}
                    <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100">
                      {req.keyword}
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      {req.category || '-'}
                    </td>

                    {/* Customer Name */}
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      {req.customerName || '-'}
                    </td>

                    {/* Last Requested Date */}
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px]">
                      {formatDate(req.lastRequestedAt)}
                    </td>

                    {/* Reference Link */}
                    <td className="py-2.5 px-3">
                      {req.referenceLink ? (
                        req.referenceLink.startsWith('http') ? (
                          <a 
                            href={req.referenceLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold text-[11px] truncate max-w-[200px]" 
                            title={req.referenceLink}
                          >
                            <ExternalLink size={12} className="shrink-0" />
                            <span className="truncate">{req.referenceLink.replace(/^https?:\/\/(www\.)?/, '')}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-300 text-[11px] truncate max-w-[200px] block" title={req.referenceLink}>
                            {req.referenceLink}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}