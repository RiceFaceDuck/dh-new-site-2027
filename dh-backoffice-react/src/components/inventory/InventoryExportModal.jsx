import React, { useState, useRef } from 'react';
import { X, Download, Loader2, FileSpreadsheet, Settings2, CheckCircle2, ListFilter, Search } from 'lucide-react';
import { inventoryExportService } from '../../firebase/inventory/inventoryExportService';
import * as XLSX from 'xlsx';

import ExportFiltersTab from './export/ExportFiltersTab';
import ExportSkusTab from './export/ExportSkusTab';
import ExportColumnsTab from './export/ExportColumnsTab';

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
                  <ExportFiltersTab 
                    availableCategories={availableCategories}
                    selectedCategories={selectedCategories}
                    handleToggleCategory={handleToggleCategory}
                    stockMin={stockMin}
                    setStockMin={setStockMin}
                    stockMax={stockMax}
                    setStockMax={setStockMax}
                  />
                )}

                {/* 2. Specific SKUs Tab */}
                {activeTab === 'skus' && (
                  <ExportSkusTab 
                    parsedSpecificSkus={parsedSpecificSkus}
                    handleFileUpload={handleFileUpload}
                    fileInputRef={fileInputRef}
                    specificSkusInput={specificSkusInput}
                    setSpecificSkusInput={setSpecificSkusInput}
                  />
                )}

                {/* 3. Sort & Columns Tab */}
                {activeTab === 'columns' && (
                  <ExportColumnsTab 
                    sortOption={sortOption}
                    setSortOption={setSortOption}
                    selectedColumns={selectedColumns}
                    setSelectedColumns={setSelectedColumns}
                    AVAILABLE_COLUMNS={AVAILABLE_COLUMNS}
                    handleToggleColumn={handleToggleColumn}
                  />
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
