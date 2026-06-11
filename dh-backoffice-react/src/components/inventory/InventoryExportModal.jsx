import React, { useState, useRef } from 'react';
import { X, Download, Loader2, FileSpreadsheet, Settings2, CheckCircle2, ListFilter, Search, UploadCloud, CheckSquare, Square } from 'lucide-react';
import { inventoryExportService } from '../../firebase/inventory/inventoryExportService';
import * as XLSX from 'xlsx';

const AVAILABLE_COLUMNS = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'ชื่อสินค้า' },
  { key: 'category', label: 'หมวดหมู่' },
  { key: 'brand', label: 'แบรนด์' },
  { key: 'Price', label: 'ราคาส่ง (ฐาน)' },
  { key: 'retailPrice', label: 'ราคาปลีก' },
  { key: 'stockQuantity', label: 'คงเหลือ' },
  { key: 'bufferStock', label: 'จุดสั่งซื้อ (Buffer)' },
  { key: 'warehouseLocation', label: 'ตำแหน่งจัดเก็บ' },
  { key: 'isActive', label: 'สถานะขาย (Active)' },
  { key: 'sales30d', label: 'ยอดขาย(30วัน)' },
  { key: 'claims30d', label: 'เคลม(30วัน)' },
  { key: 'stockin30d', label: 'เข้า(30วัน)' },
  { key: 'tags', label: 'Tags' },
];

export default function InventoryExportModal({ isOpen, onClose, availableCategories = [] }) {
  const [selectedColumns, setSelectedColumns] = useState(AVAILABLE_COLUMNS.map(c => c.key));
  const [sortOption, setSortOption] = useState('sku_asc');
  
  // Filters
  const [selectedCategories, setSelectedCategories] = useState([]); // Empty means all
  const [stockMin, setStockMin] = useState('');
  const [stockMax, setStockMax] = useState('');
  
  // Specific SKUs
  const [specificSkusInput, setSpecificSkusInput] = useState('');
  const [parsedSpecificSkus, setParsedSpecificSkus] = useState([]); // Holds array from file
  const fileInputRef = useRef(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportCount, setExportCount] = useState(0);

  const [activeTab, setActiveTab] = useState('filters'); // 'filters', 'skus', 'columns'

  if (!isOpen) return null;

  const handleToggleColumn = (key) => {
    setSelectedColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleToggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // Read as array of arrays
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        // Find SKU column. Assuming it might be the first column, or labeled 'SKU'
        let skuIndex = 0;
        if (data.length > 0) {
          const headerRow = data[0].map(h => String(h).toUpperCase());
          const foundIdx = headerRow.indexOf('SKU');
          if (foundIdx !== -1) skuIndex = foundIdx;
        }

        const skus = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (row[skuIndex]) {
            skus.push(String(row[skuIndex]).trim().toUpperCase());
          }
        }

        setParsedSpecificSkus(skus);
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบว่าเป็นไฟล์ Excel (.xlsx)');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      alert("กรุณาเลือกอย่างน้อย 1 คอลัมน์");
      return;
    }
    
    // Combine manual input SKUs and File SKUs
    const manualSkus = specificSkusInput.split(/[\n,]/).map(s => s.trim()).filter(s => s);
    const finalSpecificSkus = [...new Set([...manualSkus, ...parsedSpecificSkus])];

    setIsExporting(true);
    try {
      const columnsToExport = AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.key));
      const options = {
        categories: selectedCategories,
        stockRange: { min: stockMin, max: stockMax },
        specificSkus: finalSpecificSkus,
        sortOption
      };

      const result = await inventoryExportService.exportToExcel(columnsToExport, options);
      setExportCount(result.count);
      setExportComplete(true);
      
      setTimeout(() => {
        setExportComplete(false);
        onClose();
      }, 4000);
    } catch (error) {
      alert(error.message || "เกิดข้อผิดพลาดในการ Export ข้อมูล");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-dh-surface rounded-2xl shadow-dh-elevated border border-dh-border w-full max-w-3xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dh-border bg-dh-surface">
          <h2 className="text-xl font-black text-dh-main flex items-center gap-2">
            <FileSpreadsheet size={24} className="text-green-500" />
            ส่งออกข้อมูลสินค้า (Advanced Export)
          </h2>
          <button onClick={onClose} className="p-1.5 text-dh-muted hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors outline-none"><X size={20}/></button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          
          {exportComplete ? (
            <div className="w-full flex items-center justify-center p-6 text-center animate-in zoom-in duration-300">
              <div>
                <CheckCircle2 size={72} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-dh-main">ส่งออกสำเร็จ!</h3>
                <p className="text-dh-muted mt-2">จำนวนสินค้าทั้งหมด <span className="font-bold text-dh-main">{exportCount}</span> รายการ</p>
                <p className="text-dh-muted mt-1">ไฟล์ Excel ถูกดาวน์โหลดลงเครื่องเรียบร้อยแล้ว</p>
              </div>
            </div>
          ) : (
            <>
              {/* Sidebar Menu */}
              <div className="w-full md:w-48 bg-dh-base/50 border-r border-dh-border p-4 flex flex-col gap-2 shrink-0 overflow-x-auto md:overflow-y-auto flex-row md:flex-col">
                <button 
                  onClick={() => setActiveTab('filters')}
                  className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap md:whitespace-normal text-left ${activeTab === 'filters' ? 'bg-dh-accent text-white shadow-sm' : 'text-dh-muted hover:bg-dh-surface hover:text-dh-main'}`}
                >
                  <ListFilter size={16}/> กรองข้อมูล
                </button>
                <button 
                  onClick={() => setActiveTab('skus')}
                  className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap md:whitespace-normal text-left ${activeTab === 'skus' ? 'bg-dh-accent text-white shadow-sm' : 'text-dh-muted hover:bg-dh-surface hover:text-dh-main'}`}
                >
                  <Search size={16}/> ระบุ SKU เอง
                </button>
                <button 
                  onClick={() => setActiveTab('columns')}
                  className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap md:whitespace-normal text-left ${activeTab === 'columns' ? 'bg-dh-accent text-white shadow-sm' : 'text-dh-muted hover:bg-dh-surface hover:text-dh-main'}`}
                >
                  <Settings2 size={16}/> การจัดเรียง & คอลัมน์
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                
                {/* 1. Filters Tab */}
                {activeTab === 'filters' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <h3 className="font-bold text-lg border-b border-dh-border pb-2 mb-4">คัดกรองตามหมวดหมู่</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {availableCategories.map(cat => {
                          const isSelected = selectedCategories.includes(cat);
                          return (
                            <div 
                              key={cat} onClick={() => handleToggleCategory(cat)}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-dh-accent/10 border-dh-accent text-dh-accent' : 'bg-dh-surface border-dh-border text-dh-muted hover:border-dh-accent/50 hover:bg-dh-base'}`}
                            >
                              {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="opacity-50" />}
                              <span className="font-bold text-sm">{cat}</span>
                            </div>
                          )
                        })}
                        {availableCategories.length === 0 && <p className="text-sm text-dh-muted">ไม่พบข้อมูลหมวดหมู่ (โปรดรีเฟรชหน้าเว็บ)</p>}
                      </div>
                      <p className="text-xs text-dh-muted mt-2">* หากไม่เลือกเลย ระบบจะดึงข้อมูลมาทุกหมวดหมู่</p>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg border-b border-dh-border pb-2 mb-4">ช่วงจำนวนสินค้าคงเหลือ</h3>
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-dh-muted uppercase mb-1 block">ตั้งแต่ (Min)</label>
                          <input type="number" placeholder="0" value={stockMin} onChange={e => setStockMin(e.target.value)} className="w-24 p-2.5 bg-dh-base border border-dh-border rounded-xl outline-none focus:border-dh-accent text-sm font-bold text-center" />
                        </div>
                        <span className="text-dh-muted font-bold mt-4">-</span>
                        <div>
                          <label className="text-[10px] font-bold text-dh-muted uppercase mb-1 block">ถึง (Max)</label>
                          <input type="number" placeholder="10" value={stockMax} onChange={e => setStockMax(e.target.value)} className="w-24 p-2.5 bg-dh-base border border-dh-border rounded-xl outline-none focus:border-dh-accent text-sm font-bold text-center" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Specific SKUs Tab */}
                {activeTab === 'skus' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl text-orange-600 dark:text-orange-400">
                      <p className="text-sm font-bold">⚠️ หากมีการระบุ SKU ในหน้านี้ ระบบจะเพิกเฉยต่อตัวกรองหมวดหมู่และสต๊อก (จะดึงมาแค่ SKU ที่ระบุเท่านั้น)</p>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg border-b border-dh-border pb-2 mb-4 flex justify-between items-end">
                        <span>อัปโหลดไฟล์ Excel / CSV</span>
                        {parsedSpecificSkus.length > 0 && <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">พบ {parsedSpecificSkus.length} SKUs ในไฟล์</span>}
                      </h3>
                      <div className="border-2 border-dashed border-dh-border rounded-xl p-6 text-center hover:bg-dh-base hover:border-dh-accent/50 transition-colors relative cursor-pointer group">
                        <input type="file" accept=".xlsx, .csv" onChange={handleFileUpload} ref={fileInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <UploadCloud size={32} className="text-dh-muted mx-auto mb-2 group-hover:text-dh-accent group-hover:scale-110 transition-transform" />
                        <p className="font-bold text-sm text-dh-main">คลิกหรือลากไฟล์ Excel มาวางที่นี่</p>
                        <p className="text-xs text-dh-muted mt-1">คอลัมน์แรก หรือคอลัมน์ที่มีหัวข้อ 'SKU' จะถูกนำมาใช้</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg border-b border-dh-border pb-2 mb-4">หรือ พิมพ์ระบุ SKU แบบ Manual</h3>
                      <textarea 
                        value={specificSkusInput}
                        onChange={e => setSpecificSkusInput(e.target.value)}
                        placeholder="EXM-001&#10;KB-1234&#10;BAT-999&#10;(พิมพ์บรรทัดละรายการ หรือคั่นด้วยลูกน้ำ)"
                        className="w-full h-32 p-4 bg-dh-base border border-dh-border rounded-xl outline-none focus:border-dh-accent resize-none custom-scrollbar text-sm font-medium uppercase"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Sort & Columns Tab */}
                {activeTab === 'columns' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <h3 className="font-bold text-lg border-b border-dh-border pb-2 mb-4">รูปแบบการจัดเรียง</h3>
                      <select 
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="w-full p-3 bg-dh-surface border border-dh-border rounded-xl text-sm font-bold outline-none focus:border-dh-accent cursor-pointer"
                      >
                        <option value="sku_asc">SKU (A-Z)</option>
                        <option value="sku_desc">SKU (Z-A)</option>
                        <option value="stock_asc">คงเหลือ (น้อยไปมาก)</option>
                        <option value="stock_desc">คงเหลือ (มากไปน้อย)</option>
                        <option value="price_desc">ราคา (มากไปน้อย)</option>
                        <option value="price_asc">ราคา (น้อยไปมาก)</option>
                        <option value="sales_desc">ยอดขาย 30 วัน (มากไปน้อย)</option>
                        <option value="claims_desc">เคลม 30 วัน (มากไปน้อย)</option>
                        <option value="stockin_desc">สินค้าเข้า 30 วัน (มากไปน้อย)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-4 border-b border-dh-border pb-2">
                        <h3 className="font-bold text-lg">คอลัมน์ที่จะ Export</h3>
                        <button onClick={() => setSelectedColumns(AVAILABLE_COLUMNS.map(c => c.key))} className="text-xs text-dh-accent font-bold hover:underline">เลือกทั้งหมด</button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {AVAILABLE_COLUMNS.map((col) => {
                          const isSelected = selectedColumns.includes(col.key);
                          return (
                            <div 
                              key={col.key} onClick={() => handleToggleColumn(col.key)}
                              className={`p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all flex items-center gap-2 select-none ${isSelected ? 'bg-dh-accent/10 border-dh-accent text-dh-accent shadow-sm' : 'bg-dh-base border-dh-border text-dh-muted hover:border-dh-accent/50'}`}
                            >
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? 'bg-dh-accent border-dh-accent text-white' : 'border-dh-muted/50 bg-white'}`}>
                                {isSelected && <CheckCircle2 size={12} />}
                              </div>
                              {col.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        {!exportComplete && (
          <div className="px-6 py-4 border-t border-dh-border bg-dh-surface flex justify-end items-center shrink-0 gap-3">
            <button type="button" onClick={onClose} disabled={isExporting} className="px-6 py-2.5 text-dh-main font-bold rounded-xl bg-dh-base border border-dh-border hover:bg-dh-border transition-colors text-sm shadow-sm disabled:opacity-50">ยกเลิก</button>
            <button 
              onClick={handleExport} 
              disabled={isExporting || selectedColumns.length === 0}
              className="px-8 py-2.5 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 flex items-center gap-2 shadow-sm transition-transform active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16}/>}
              {isExporting ? 'กำลังดึงข้อมูลและสร้างไฟล์...' : 'ดาวน์โหลด Excel'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
