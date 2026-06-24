import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, RefreshCw, FileSpreadsheet, X, HelpCircle, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { transactionImportService } from '../../../firebase/transactionImportService';
import { useAuth } from '../../../contexts/AuthContext';

export default function UploadTransactions({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, parsing, preview, uploading, success, error
  const [message, setMessage] = useState('');
  const [actionType, setActionType] = useState('deduct'); // deduct or add
  const [currentMapping, setCurrentMapping] = useState({ skuKey: '', qtyKey: '', priceKey: '' });
  const [showMappingConfig, setShowMappingConfig] = useState(false);
  
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      setStatus('error');
      setMessage('กรุณาอัปโหลดไฟล์ Excel (.xlsx, .xls) หรือ .csv');
      return;
    }

    setFile(selectedFile);
    setStatus('parsing');
    setMessage('กำลังอ่านไฟล์...');

    try {
      const result = await transactionImportService.parseFile(selectedFile);
      
      let finalMatchedKeys = result.matchedKeys;
      try {
        const savedStr = localStorage.getItem('import_schema_mapping');
        if (savedStr) {
          const parsed = JSON.parse(savedStr);
          if (result.headers.includes(parsed.skuKey) && result.headers.includes(parsed.qtyKey)) {
             finalMatchedKeys = parsed;
             result.items = transactionImportService.applyMapping(result.rawJson, finalMatchedKeys);
          }
        }
      } catch (e) {
        console.warn('Failed to load saved mapping', e);
      }

      setParsedData({ ...result, matchedKeys: finalMatchedKeys });
      setCurrentMapping(finalMatchedKeys);
      setStatus('preview');
      setMessage(`พบข้อมูล ${result.items.length} รายการ (อ้างอิงจากคอลัมน์: ${finalMatchedKeys.skuKey}, ${finalMatchedKeys.qtyKey})`);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage('เกิดข้อผิดพลาดในการอ่านไฟล์ โปรดตรวจสอบโครงสร้างคอลัมน์');
      setFile(null);
    }
    
    // รีเซ็ต input เผื่อผู้ใช้เลือกไฟล์เดิมใหม่
    e.target.value = null;
  };

  const handleMappingChange = (key, value) => {
    const newMapping = { ...currentMapping, [key]: value };
    setCurrentMapping(newMapping);
    
    // Re-apply mapping
    const newItems = transactionImportService.applyMapping(parsedData.rawJson, newMapping);
    
    // Update parsedData
    setParsedData(prev => ({
      ...prev,
      items: newItems,
      matchedKeys: newMapping
    }));
    
    // Save to local storage
    localStorage.setItem('import_schema_mapping', JSON.stringify(newMapping));
    
    setMessage(`พบข้อมูล ${newItems.length} รายการ (อ้างอิงจากคอลัมน์: ${newMapping.skuKey}, ${newMapping.qtyKey})`);
  };

  const handleUpload = async () => {
    if (!parsedData || !parsedData.items) return;

    setStatus('uploading');
    setMessage('กำลังประมวลผลการปรับสต็อก...');

    try {
      const result = await transactionImportService.processTransactions(
        parsedData.items, 
        actionType,
        currentUser
      );
      
      setStatus('success');
      setMessage(result.message);
      
      // แจ้งให้ Component หลักรับทราบ เพื่อสั่งให้ ChangeSummaryPanel รีเฟรช
      if (onUploadComplete) {
        setTimeout(() => {
          onUploadComplete();
        }, 1000);
      }

      // รีเซ็ตหลัง 5 วินาที
      setTimeout(() => {
        resetState();
      }, 5000);

    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage(error.message || 'เกิดข้อผิดพลาดในการประมวลผลสต็อก');
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedData(null);
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 w-full relative overflow-hidden group">
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
      
      <div className="relative z-10 w-full flex flex-col items-center">
        
        {status === 'idle' || status === 'error' ? (
          <>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm transition-all duration-500 ${
                status === 'error' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-700 group-hover:scale-105'
            }`}>
              {status === 'error' ? <AlertCircle size={28} /> : <FileSpreadsheet size={28} />}
            </div>
            
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 text-center">
              อัปโหลดข้อมูลธุรกรรม
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-6 text-sm max-w-sm">
              รองรับไฟล์ Excel (.xlsx) นำเข้าเพื่อปรับปรุงยอดสต็อกอัตโนมัติ
            </p>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden" 
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 shadow-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white hover:shadow-emerald-500/25"
            >
              <UploadCloud strokeWidth={3} size={20} />
              เลือกไฟล์ข้อมูล
            </button>
            
            {status === 'error' && (
              <div className="mt-4 text-sm font-medium text-red-500 text-center">
                {message}
              </div>
            )}
          </>
        ) : status === 'parsing' || status === 'uploading' ? (
          <div className="flex flex-col items-center justify-center py-10">
            <RefreshCw size={48} className="animate-spin text-emerald-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">{message}</h3>
          </div>
        ) : status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CheckCircle size={56} className="text-emerald-500 mb-4 animate-bounce" />
            <h3 className="text-xl font-black text-emerald-600 mb-2">{message}</h3>
            <p className="text-sm text-slate-500">ระบบกำลังรีเฟรชยอดสต็อก...</p>
          </div>
        ) : status === 'preview' ? (
          <div className="w-full animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-500" size={20} />
                  พรีวิวข้อมูล ({parsedData?.items.length} รายการ)
                </h3>
                <p className="text-xs text-slate-500 mt-1">{message}</p>
              </div>
              <button onClick={resetState} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Schema Mapping & Documentation */}
            <div className="mb-4">
              <button 
                onClick={() => setShowMappingConfig(!showMappingConfig)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings2 size={18} className="text-indigo-500" />
                  <span className="font-bold text-sm text-slate-700">ตั้งค่าโครงสร้างคอลัมน์ (Schema Mapping)</span>
                </div>
                {showMappingConfig ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>

              {showMappingConfig && (
                <div className="p-4 border border-t-0 border-slate-200 rounded-b-xl -mt-2 pt-4 bg-white animate-in slide-in-from-top-2 relative z-0">
                  {/* Documentation */}
                  <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 mb-4 flex gap-3 text-sm">
                    <HelpCircle size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div className="text-indigo-900/80 text-left">
                      <strong className="block text-indigo-900 mb-1">คำแนะนำการใช้งาน</strong>
                      <ul className="list-disc ml-4 space-y-1">
                        <li><strong>SKU:</strong> เลือกรหัสสินค้าให้ตรงกับระบบ</li>
                        <li><strong>จำนวน:</strong> จำนวนสต็อกที่ต้องการอัปเดต</li>
                        <li><strong>ราคา:</strong> (ทางเลือก) หากต้องการเปลี่ยนราคาพร้อมกัน</li>
                      </ul>
                      <p className="mt-2 text-xs italic text-indigo-700/60">* ระบบจะจำการตั้งค่าล่าสุดนี้ไว้สำหรับการอัปโหลดครั้งต่อไป</p>
                    </div>
                  </div>

                  {/* Mapping Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">รหัสสินค้า (SKU) <span className="text-rose-500">*</span></label>
                      <select 
                        value={currentMapping.skuKey}
                        onChange={(e) => handleMappingChange('skuKey', e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {parsedData?.headers.map(h => <option key={`sku-${h}`} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">จำนวน (Qty) <span className="text-rose-500">*</span></label>
                      <select 
                        value={currentMapping.qtyKey}
                        onChange={(e) => handleMappingChange('qtyKey', e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {parsedData?.headers.map(h => <option key={`qty-${h}`} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">ราคา (ไม่บังคับ)</label>
                      <select 
                        value={currentMapping.priceKey || ''}
                        onChange={(e) => handleMappingChange('priceKey', e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- ไม่ใช้ --</option>
                        {parsedData?.headers.map(h => <option key={`price-${h}`} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* โหมดปรับสต็อก */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
              <button
                onClick={() => setActionType('deduct')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  actionType === 'deduct' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                หักสต็อก (ขายออก)
              </button>
              <button
                onClick={() => setActionType('add')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  actionType === 'add' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                เพิ่มสต็อก (รับเข้า)
              </button>
            </div>

            {/* พรีวิวตาราง */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto mb-6">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-slate-600 text-xs">SKU</th>
                    <th className="px-3 py-2 font-semibold text-slate-600 text-xs text-right">จำนวน</th>
                    {parsedData?.matchedKeys.priceKey && <th className="px-3 py-2 font-semibold text-slate-600 text-xs text-right">ราคาใหม่</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedData?.items.slice(0, 50).map((item, idx) => (
                    <tr key={idx} className="hover:bg-white transition-colors">
                      <td className="px-3 py-2 font-medium text-slate-700">{item.sku}</td>
                      <td className={`px-3 py-2 font-bold text-right ${actionType === 'deduct' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {actionType === 'deduct' ? '-' : '+'}{item.quantity}
                      </td>
                      {parsedData?.matchedKeys.priceKey && (
                        <td className="px-3 py-2 font-medium text-right text-slate-600">
                          {item.price !== undefined ? item.price : '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                  {parsedData?.items.length > 50 && (
                    <tr>
                      <td colSpan={parsedData?.matchedKeys.priceKey ? 3 : 2} className="px-3 py-2 text-center text-xs text-slate-500 italic">
                        ...และอื่นๆ อีก {parsedData.items.length - 50} รายการ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleUpload}
              className={`w-full py-3 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 shadow-lg text-white ${
                actionType === 'deduct' 
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25' 
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
              }`}
            >
              <CheckCircle size={20} />
              ยืนยันการ{actionType === 'deduct' ? 'หัก' : 'เพิ่ม'}สต็อก
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
