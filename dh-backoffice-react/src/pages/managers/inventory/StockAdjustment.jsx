import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, Package, ShieldAlert, History, Loader2, Info, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useStockAdjustment } from './hooks/useStockAdjustment';

export const REASON_OPTIONS = [
  { value: '', label: '-- กรุณาเลือกเหตุผล --' },
  { value: 'สต๊อคสูญหาย/หาของไม่พบ', label: 'สต๊อคสูญหาย / หาของไม่พบ' },
  { value: 'สินค้ายกยอดมาคลาดเคลื่อน', label: 'สินค้ายกยอดมาคลาดเคลื่อน (Mismatch)' },
  { value: 'นับสต๊อคประจำเดือน', label: 'ปรับปรุงจากการนับสต๊อคประจำเดือน' },
  { value: 'สินค้าชำรุดเสียหาย (นอกระบบเคลม)', label: 'สินค้าชำรุดเสียหาย (นอกระบบเคลม)' },
  { value: 'อื่นๆ', label: 'อื่นๆ (ระบุในหมายเหตุ)' }
];

export default function StockAdjustment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    skuInput, setSkuInput,
    isSearching,
    product,
    searchError,
    newStock, setNewStock,
    reason, setReason,
    note, setNote,
    isSubmitting,
    successMessage,
    submitError,
    handleSearch,
    handleSubmit
  } = useStockAdjustment(user);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dh-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-dh-main tracking-tight">จัดการสต๊อคกรณีพิเศษ (Stock Adjustment)</h1>
            <p className="text-sm text-dh-muted mt-1">เครื่องมือสำหรับผู้จัดการเพื่อแก้ไขปัญหาสต๊อคคลาดเคลื่อน หรือสต๊อคติดลบ</p>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/managers')}
          className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-orange-600 transition-all shadow-sm active:scale-95 w-fit"
        >
          <ArrowLeft size={18} /> ย้อนกลับ (Overview)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form & Search */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Search Box */}
          <div className="bg-dh-surface rounded-2xl shadow-sm border border-dh-border p-6">
            <h2 className="text-lg font-bold text-dh-main mb-4 flex items-center gap-2">
              <Search size={20} className="text-dh-accent" />
              ค้นหาสินค้าที่ต้องการปรับปรุง
            </h2>
            <form onSubmit={handleSearch} className="flex gap-3">
              <input 
                type="text" 
                value={skuInput}
                onChange={(e) => setSkuInput(e.target.value)}
                placeholder="กรอก SKU สินค้า (เช่น RAM-001)"
                className="flex-1 bg-dh-base border border-dh-border rounded-xl px-4 py-3 text-dh-main focus:outline-none focus:ring-2 focus:ring-dh-accent font-mono text-lg"
              />
              <button 
                type="submit"
                disabled={isSearching || !skuInput.trim()}
                className="px-6 py-3 bg-dh-main text-dh-surface font-bold rounded-xl hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSearching ? <Loader2 size={20} className="animate-spin" /> : 'ค้นหา'}
              </button>
            </form>
            {searchError && <p className="text-red-500 mt-3 font-medium flex items-center gap-2"><AlertTriangle size={16}/> {searchError}</p>}
          </div>

          {/* Adjustment Form */}
          {product && (
            <div className="bg-dh-surface rounded-2xl shadow-dh-elevated border border-orange-500/30 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-orange-500/10 px-6 py-4 border-b border-orange-500/20">
                <h2 className="text-lg font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                  <Package size={20} />
                  สินค้า: {product.name}
                </h2>
                <div className="text-sm text-dh-muted mt-1 flex gap-4">
                  <span>SKU: <span className="font-mono font-bold text-dh-main">{product.sku}</span></span>
                  <span>หมวดหมู่: <span className="font-bold text-dh-main">{product.category}</span></span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* Stock Stats */}
                <div className="flex items-center gap-6 p-4 bg-dh-base rounded-xl border border-dh-border">
                  <div className="flex-1">
                    <p className="text-sm text-dh-muted font-medium">สต๊อคในระบบปัจจุบัน (System)</p>
                    <p className="text-3xl font-black text-dh-main mt-1">{product.stockQuantity || 0}</p>
                  </div>
                  <div className="w-px h-12 bg-dh-border"></div>
                  <div className="flex-1">
                    <p className="text-sm text-orange-600 font-bold mb-2">ระบุสต๊อคที่ถูกต้อง (Actual)</p>
                    <input 
                      type="number" 
                      min="0"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full sm:w-32 bg-dh-surface border-2 border-orange-500 rounded-xl px-4 py-2 text-2xl font-black text-dh-main focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                {/* Warning if stock drops */}
                {newStock !== '' && parseInt(newStock) < (product.stockQuantity || 0) && (
                  <div className="p-3 bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm font-bold flex items-center gap-2">
                    <AlertTriangle size={16}/> ระวัง! คุณกำลัง "ลดยอดสต๊อค" ระบบจะบันทึก Log แจ้งเตือนผู้บริหาร
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-bold text-dh-main mb-2">เหตุผลการปรับปรุง <span className="text-red-500">*</span></label>
                  <select 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-dh-base border border-dh-border rounded-xl px-4 py-3 text-dh-main focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  >
                    {REASON_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-bold text-dh-main mb-2">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="อธิบายรายละเอียดเพิ่มเติม เพื่อให้ตรวจสอบย้อนหลังได้ง่าย..."
                    className="w-full bg-dh-base border border-dh-border rounded-xl px-4 py-3 text-dh-main focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none h-24 custom-scrollbar"
                  ></textarea>
                </div>

                {submitError && <p className="text-red-500 font-bold flex items-center gap-2"><X size={16}/> {submitError}</p>}
                {successMessage && <p className="text-green-500 font-bold flex items-center gap-2"><CheckCircle size={16}/> {successMessage}</p>}

                <div className="pt-4 border-t border-dh-border flex justify-end">
                  <button 
                    type="submit"
                    disabled={isSubmitting || newStock === ''}
                    className="px-8 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <ShieldAlert size={20} />}
                    {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการปรับปรุงสต๊อค'}
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>

        {/* Right Column: Instructions & Examples */}
        <div className="space-y-6">
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-black text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
              <Info size={20} />
              คู่มือการใช้งาน (Manual)
            </h3>
            
            <div className="space-y-4 text-sm text-dh-main">
              {/* ตำรา / คำอธิบาย */}
              <p className="font-bold border-l-2 border-blue-500 pl-3">ฟีเจอร์นี้คืออะไร?</p>
              <p className="opacity-90 pl-3.5">
                เครื่องมือนี้ถูกสร้างมาเพื่อแก้ปัญหา <b>"สต๊อคคลาดเคลื่อน"</b> (เช่น ของหาย, นับผิด, หรือของพังนอกระบบเคลม) 
                โดยช่วยให้ผู้จัดการสามารถปรับเลขสต๊อคให้ตรงกับความเป็นจริงได้ทันที โดยไม่ต้องทำการซื้อขายปลอมในระบบ
              </p>

              <hr className="border-blue-500/20" />

              {/* วิธีการใช้งาน */}
              <p className="font-bold border-l-2 border-blue-500 pl-3">วิธีการใช้งาน (How-to)</p>
              <ul className="list-decimal pl-8 opacity-90 space-y-1">
                <li>กรอก <b>SKU</b> ของสินค้าที่ต้องการแก้ แล้วกดค้นหา</li>
                <li>ดูเลขในช่อง <b>สต๊อคในระบบปัจจุบัน</b> และกรอกเลขใหม่ที่ถูกต้องลงในช่อง <b>ระบุสต๊อคที่ถูกต้อง</b></li>
                <li>เลือก <b>เหตุผล</b> ที่ต้องปรับ และเขียนหมายเหตุ (ถ้ามี)</li>
                <li>กด <b>ยืนยันการปรับปรุงสต๊อค</b></li>
              </ul>

              <hr className="border-blue-500/20" />

              {/* เทคนิคการใช้งาน */}
              <p className="font-bold border-l-2 border-blue-500 pl-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500"/> เทคนิคและข้อควรระวัง (Tips)
              </p>
              <p className="opacity-90 pl-3.5">
                <b>Tip:</b> คุณสามารถนำเครื่องสแกนบาร์โค้ด (Barcode Scanner) ยิงเข้าช่อง SKU ได้เลย ระบบจะพิมพ์และกด Enter ค้นหาให้อัตโนมัติ<br/><br/>
                <b>ข้อควรระวัง:</b> การปรับลดสต๊อค ระบบจะบันทึกสถานะเป็น <span className="text-red-500 font-bold">WARN</span> ทันที เพื่อป้องกันทุจริต
              </p>

              <hr className="border-blue-500/20" />

              {/* ตัวอย่างผลลัพธ์ */}
              <p className="font-bold border-l-2 border-blue-500 pl-3 flex items-center gap-2">
                <History size={16} /> ตัวอย่างผลลัพธ์ (Expected Results)
              </p>
              
              <div className="space-y-3 pl-3.5 mt-2">
                <div className="bg-dh-surface p-3 rounded-xl border border-dh-border">
                  <p className="font-bold text-orange-500 text-xs">สถานการณ์: ของหาย 2 ชิ้น</p>
                  <p className="opacity-80 text-xs mt-1">
                    <b>การกระทำ:</b> กรอกสต๊อคใหม่จาก 10 ให้เหลือ 8 และเลือกเหตุผล "ของหาย"<br/>
                    <b>ผลลัพธ์:</b> ระบบจะหักสต๊อคทันที, บันทึกลง <b>History Log ส่วนกลาง</b> อย่างถาวร และแจ้งเตือนให้บริหารทราบ
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
