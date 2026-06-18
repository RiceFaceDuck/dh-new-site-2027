import React, { useRef } from 'react';
import { X, UploadCloud, Database, CheckCircle, Loader2 } from 'lucide-react';
import { useExcelImport } from './hooks/useExcelImport';

// Subcomponents
import ImportResultSummary from './import/ImportResultSummary';
import ImportUploader from './import/ImportUploader';
import ImportConfig from './import/ImportConfig';
import ImportPreviewTable from './import/ImportPreviewTable';

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
            <ImportResultSummary importResult={importResult} onClose={onClose} />
          ) : (
            <>
              {/* Step 1: Upload or Download Template */}
              {!file && (
                <ImportUploader 
                  handleDownloadTemplate={handleDownloadTemplate}
                  handleFileUpload={handleFileUpload}
                  fileInputRef={fileInputRef}
                />
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
                    <button 
                      onClick={() => { 
                        handleReset(); 
                        if (fileInputRef.current) fileInputRef.current.value = ''; 
                      }} 
                      className="text-sm font-bold text-red-500 hover:text-red-600 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      เปลี่ยนไฟล์
                    </button>
                  </div>

                  {/* Settings */}
                  <ImportConfig 
                    conflictStrategy={conflictStrategy}
                    setConflictStrategy={setConflictStrategy}
                  />

                  {/* Preview Table */}
                  <ImportPreviewTable 
                    headers={headers}
                    parsedData={parsedData}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importResult && (
          <div className="px-6 py-4 border-t border-dh-border bg-dh-surface flex justify-end items-center shrink-0 gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isProcessing} 
              className="px-6 py-2.5 text-dh-main font-bold rounded-xl bg-dh-base border border-dh-border hover:bg-dh-border transition-colors text-sm shadow-sm disabled:opacity-50"
            >
              ยกเลิก
            </button>
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
