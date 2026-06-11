import React, { useRef } from 'react';
import { X, UploadCloud, Download, Loader2, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { useExcelImport } from './hooks/useExcelImport';

export default function InventoryImportModal({ isOpen, onClose, onSuccess }) {
  const {
    file, headers, parsedData, conflictStrategy, isProcessing, importResult,
    setConflictStrategy, handleDownloadTemplate, handleFileUpload, handleReset, handleConfirmImport
  } = useExcelImport(onSuccess);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-dh-surface rounded-2xl shadow-dh-elevated border border-dh-border w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dh-border bg-dh-surface">
          <h2 className="text-xl font-black text-dh-main flex items-center gap-2">
            <Database size={24} className="text-dh-accent" />
            นำเข้าสินค้าด้วย Excel
          </h2>
          <button onClick={onClose} className="p-1.5 text-dh-muted hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors outline-none"><X size={20}/></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-dh-base/50 custom-scrollbar flex-1 text-dh-main space-y-6">
          {importResult ? (
            <div className="text-center py-10 space-y-4">
              <CheckCircle size={64} className="text-green-500 mx-auto" />
              <h3 className="text-2xl font-bold">นำเข้าข้อมูลเสร็จสิ้น!</h3>
              <div className="bg-dh-surface p-6 rounded-xl border border-dh-border max-w-sm mx-auto space-y-3 shadow-sm">
                <div className="flex justify-between font-medium">
                  <span className="text-dh-muted">นำเข้าสำเร็จ (เพิ่ม/อัพเดท):</span>
                  <span className="text-green-500 font-bold">{importResult.successCount}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-dh-muted">ข้าม (ไม่แก้ไข):</span>
                  <span className="text-orange-500 font-bold">{importResult.skippedCount}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-dh-muted">ส่งไปรออนุมัติ (To-do):</span>
                  <span className="text-blue-500 font-bold">{importResult.todoCount}</span>
                </div>
              </div>
              <button onClick={onClose} className="mt-6 px-8 py-3 bg-dh-accent text-white rounded-xl font-bold hover:bg-dh-accent-hover shadow-sm transition-transform active:scale-95">
                ปิดหน้าต่าง
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Upload or Download Template */}
              {!file && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-dh-surface p-6 rounded-2xl border border-dh-border flex flex-col items-center justify-center text-center gap-4 hover:border-dh-accent/50 transition-colors shadow-sm">
                    <div className="w-16 h-16 bg-dh-accent/10 rounded-full flex items-center justify-center text-dh-accent">
                      <Download size={32} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">1. โหลด Template</h3>
                      <p className="text-xs text-dh-muted mt-1">ไฟล์ Excel ที่มีการจัดเรียงคอลัมน์มาตรฐาน<br/>พร้อมตัวอย่างการกรอกข้อมูลที่ถูกต้อง</p>
                    </div>
                    <button onClick={handleDownloadTemplate} className="px-6 py-2 bg-dh-base border border-dh-border rounded-xl font-bold hover:bg-dh-border transition-colors text-sm">
                      ดาวน์โหลด .xlsx
                    </button>
                  </div>

                  <div className="bg-dh-surface p-6 rounded-2xl border-2 border-dashed border-dh-border flex flex-col items-center justify-center text-center gap-4 hover:border-dh-accent/50 hover:bg-dh-accent/5 transition-colors relative cursor-pointer group">
                    <input 
                      type="file" accept=".xlsx, .xls, .csv" 
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                      ref={fileInputRef}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                      <UploadCloud size={32} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">2. อัพโหลดไฟล์ Excel</h3>
                      <p className="text-xs text-dh-muted mt-1">รองรับไฟล์ .xlsx หรือ .csv<br/>ที่ปรับแต่งข้อมูลเรียบร้อยแล้ว</p>
                    </div>
                    <span className="text-sm font-bold text-blue-500">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</span>
                  </div>
                </div>
              )}

              {/* Step 2: Preview & Settings */}
              {file && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center bg-dh-surface p-4 rounded-xl border border-dh-border shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold">{file.name}</h4>
                        <p className="text-xs text-dh-muted">พบข้อมูลทั้งหมด {parsedData.length} แถว</p>
                      </div>
                    </div>
                    <button onClick={() => { handleReset(); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-sm font-bold text-red-500 hover:text-red-600 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors">
                      เปลี่ยนไฟล์
                    </button>
                  </div>

                  {/* Settings */}
                  <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-xl space-y-3">
                    <div className="flex items-start gap-3 text-orange-600 dark:text-orange-400">
                      <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold">การจัดการข้อมูลซ้ำซ้อน (SKU Conflict)</h4>
                        <p className="text-sm opacity-90 mt-1">กรุณาเลือกว่าจะทำอย่างไร หากระบบพบว่ามี SKU ในไฟล์ที่ตรงกับสินค้าเดิมที่มีอยู่ในฐานข้อมูลแล้ว</p>
                      </div>
                    </div>
                    <div className="ml-8">
                      <select 
                        value={conflictStrategy}
                        onChange={(e) => setConflictStrategy(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 bg-dh-surface border border-orange-500/30 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold"
                      >
                        <option value="todo">ส่งงานไปพักรอที่ To-do (เพื่อรอตรวจสอบทีละรายการ)</option>
                        <option value="overwrite">อัพเดทข้อมูลทับข้อมูลเก่าทันที</option>
                        <option value="skip">ข้ามรายการนั้นไป (ไม่แก้ไขของเดิม)</option>
                      </select>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="space-y-2">
                    <h4 className="font-bold flex justify-between items-end">
                      <span>ตัวอย่างข้อมูล (Preview)</span>
                      {!headers.includes('SKU') && <span className="text-red-500 text-xs">⚠️ ไม่พบคอลัมน์ SKU (จำเป็น)</span>}
                    </h4>
                    <div className="overflow-x-auto border border-dh-border rounded-xl shadow-sm custom-scrollbar bg-dh-surface max-h-[300px]">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-dh-base sticky top-0 shadow-sm z-10">
                          <tr>
                            {headers.slice(0, 10).map(h => (
                              <th key={h} className="px-4 py-3 font-bold text-dh-muted">{h}</th>
                            ))}
                            {headers.length > 10 && <th className="px-4 py-3 font-bold text-dh-muted">... ({headers.length - 10} more)</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dh-border">
                          {parsedData.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-dh-base/50 transition-colors">
                              {headers.slice(0, 10).map(h => (
                                <td key={h} className="px-4 py-2">{String(row[h] || '').substring(0, 30)}{String(row[h] || '').length > 30 ? '...' : ''}</td>
                              ))}
                              {headers.length > 10 && <td className="px-4 py-2 text-dh-muted">...</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-dh-muted text-right">แสดงตัวอย่าง 5 แถวแรก</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importResult && (
          <div className="px-6 py-4 border-t border-dh-border bg-dh-surface flex justify-end items-center shrink-0 gap-3">
            <button type="button" onClick={onClose} disabled={isProcessing} className="px-6 py-2.5 text-dh-main font-bold rounded-xl bg-dh-base border border-dh-border hover:bg-dh-border transition-colors text-sm shadow-sm disabled:opacity-50">ยกเลิก</button>
            <button 
              onClick={handleConfirmImport} 
              disabled={!file || isProcessing || !headers.includes('SKU')}
              className="px-8 py-2.5 bg-dh-accent text-white rounded-xl font-bold hover:bg-dh-accent-hover flex items-center gap-2 shadow-sm transition-transform active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16}/>}
              {isProcessing ? 'กำลังประมวลผล...' : 'ยืนยันนำเข้าข้อมูล'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
