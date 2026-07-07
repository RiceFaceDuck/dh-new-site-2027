import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, RefreshCw, FileSpreadsheet, X, HelpCircle, Settings2, ChevronDown, ChevronUp, History } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import GlobalSchemaSettings from './GlobalSchemaSettings';
import GuidePanel from '../../../components/common/GuidePanel';
import RecentImportsModal from './RecentImportsModal';
import { useUploadTransactionsLogic } from '../hooks/useUploadTransactionsLogic';

export default function UploadTransactions({ onUploadComplete, latestSnapshot }) {
  const { currentUser } = useAuth();
  
  const {
    parsedData, status, message, actionType, currentMapping,
    setActionType, handleFileChange, handleMappingChange, handleUpload, resetState,
    fileInputRef
  } = useUploadTransactionsLogic(currentUser, onUploadComplete);

  const [showMappingConfig, setShowMappingConfig] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 w-full relative overflow-hidden group min-h-[300px]">
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
      
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        {(status === 'idle' || status === 'error') && (
          <button
            onClick={() => setShowHistoryModal(true)}
            title="ดูประวัติการนำเข้าไฟล์ล่าสุด และสามารถกดย้อนกลับ (Undo) เพื่อคืนค่าสต็อกได้"
            className={`p-2 rounded-xl transition-all border shadow-xs flex items-center justify-center gap-2 px-3 text-sm font-bold
              ${showHistoryModal 
                ? 'bg-rose-50 text-rose-600 border-rose-200' 
                : 'bg-white text-slate-500 border-slate-200 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'}`}
          >
            <History size={18} />
            <span className="hidden sm:inline">ประวัติ (Undo)</span>
          </button>
        )}

        {(status === 'idle' || status === 'error') && (
          <button 
            onClick={() => setShowGlobalSettings(!showGlobalSettings)}
            title="ตั้งค่าคำค้นหาหัวคอลัมน์เริ่มต้น"
            className={`p-2 rounded-xl transition-all border shadow-xs flex items-center justify-center 
              ${showGlobalSettings 
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                : 'bg-white text-slate-400 border-slate-200 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200'}`}
          >
            <Settings2 size={20} />
          </button>
        )}
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        
        {status === 'idle' || status === 'error' ? (
          <>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-xs transition-all duration-500 ${
                status === 'error' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-700 group-hover:scale-105'
            }`}>
              {status === 'error' ? <AlertCircle size={28} /> : <FileSpreadsheet size={28} />}
            </div>
            
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 text-center">
              นำเข้าข้อมูลอัปเดตสต็อก (Excel/CSV)
            </h3>
            
            <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl mb-6 w-full max-w-sm">
              <button
                onClick={() => setActionType('deduct')}
                title="คลิกเพื่อนำเข้าไฟล์ที่ต้องการตัด/ลดจำนวนสต็อก (เช่น ยอดขาย, ของชำรุด)"
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  actionType === 'deduct' ? 'bg-white dark:bg-slate-600 text-rose-600 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                หักสต็อก (-)
              </button>
              <button
                onClick={() => setActionType('add')}
                title="คลิกเพื่อนำเข้าไฟล์ที่ต้องการเพิ่มจำนวนสต็อก (เช่น รับของเข้า, ลูกค้าคืนของ)"
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  actionType === 'add' ? 'bg-white dark:bg-slate-600 text-emerald-600 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                เพิ่มสต็อก (+)
              </button>
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-center mb-6 text-sm max-w-sm">
              รองรับไฟล์จากภายนอก นำเข้าเพื่อ{actionType === 'deduct' ? 'หักยอดขายหรือของชำรุด' : 'รับของเข้าหรือคืนสินค้า'}
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
              className="w-full py-3 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 shadow-xs bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white hover:shadow-emerald-500/25"
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
                  <FileSpreadsheet className={actionType === 'deduct' ? 'text-rose-500' : 'text-emerald-500'} size={20} />
                  พรีวิวข้อมูล ({parsedData?.items.length} รายการ)
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ml-2 ${actionType === 'deduct' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    โหมด: {actionType === 'deduct' ? 'หักสต็อก (-)' : 'เพิ่มสต็อก (+)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">{message}</p>
              </div>
              <button onClick={resetState} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">รหัสสินค้า (SKU) <span className="text-rose-500">*</span></label>
                      <select 
                        value={currentMapping.skuKey}
                        onChange={(e) => handleMappingChange('skuKey', e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        {parsedData?.headers.map(h => <option key={`sku-${h}`} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">จำนวน (Qty) <span className="text-rose-500">*</span></label>
                      <select 
                        value={currentMapping.qtyKey}
                        onChange={(e) => handleMappingChange('qtyKey', e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        {parsedData?.headers.map(h => <option key={`qty-${h}`} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">ราคา (ไม่บังคับ)</label>
                      <select 
                        value={currentMapping.priceKey || ''}
                        onChange={(e) => handleMappingChange('priceKey', e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- ไม่ใช้ --</option>
                        {parsedData?.headers.map(h => <option key={`price-${h}`} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

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

      {showGlobalSettings && (status === 'idle' || status === 'error') && (
        <div className="w-full mt-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-4 relative z-10">
          <GlobalSchemaSettings embedded={true} />
        </div>
      )}

      <div className="w-full mt-6 relative z-10 text-left">
        <GuidePanel 
          title="การนำเข้าข้อมูล Excel / CSV"
          description="ใช้สำหรับอัปเดตสต็อกจำนวนมากๆ ผ่านไฟล์ Excel โดยไม่ต้องทำทีละรายการ"
          howTo={[
            "เลือกโหมด 'หักสต็อก (-)' สำหรับรายการขาย หรือโหมด 'เพิ่มสต็อก (+)' สำหรับรับของเข้า",
            "คลิกปุ่ม 'เลือกไฟล์ข้อมูล' และอัปโหลดไฟล์ .xlsx หรือ .csv",
            "ระบบจะพยายามจับคู่ชื่อคอลัมน์ให้อัตโนมัติ (หากจับคู่ผิด สามารถกดไอคอน ⚙️ ในหน้าพรีวิวเพื่อตั้งค่าเองได้)",
            "ตรวจสอบข้อมูลพรีวิว และกด 'ยืนยันการอัปเดต' ระบบจะบันทึกประวัติให้โดยอัตโนมัติ"
          ]}
          tips={[
            "คุณสามารถเพิ่มคำค้นหาหัวคอลัมน์อัตโนมัติ (Schema Aliases) แบบถาวรได้ที่ปุ่ม ⚙️ มุมขวาบนของการ์ดนี้",
            "หากคุณอัปโหลดผิด สามารถกดปุ่ม 'ประวัติ (Undo)' ด้านบนขวา เพื่อคืนค่าสต็อกได้ (ต้องทำก่อนที่จะบันทึกสร้าง TX ในกล่องด้านขวาเท่านั้น)"
          ]}
          expectedResult="ยอดสต็อกจะถูกอัปเดตทันที และประวัติการเปลี่ยนแปลงทั้งหมดจะถูกบันทึกไว้ในส่วน History ครับ"
        />
      </div>

      <RecentImportsModal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)}
        latestSnapshot={latestSnapshot}
        onUploadComplete={onUploadComplete}
      />
    </div>
  );
}
