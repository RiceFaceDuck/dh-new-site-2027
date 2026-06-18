import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, Package, ShieldAlert, History, Loader2, Info, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { inventoryAdjustmentService } from '../../../firebase/inventory/inventoryAdjustmentService';
import { inventoryQueryService } from '../../../firebase/inventory/inventoryQueryService';
import { useNavigate } from 'react-router-dom';

export default function StockAdjustment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [skuInput, setSkuInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [product, setProduct] = useState(null);
  const [searchError, setSearchError] = useState('');

  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const REASON_OPTIONS = [
    { value: '', label: '-- กรุณาเลือกเหตุผล --' },
    { value: 'สต๊อคสูญหาย/หาของไม่พบ', label: 'สต๊อคสูญหาย / หาของไม่พบ' },
    { value: 'สินค้ายกยอดมาคลาดเคลื่อน', label: 'สินค้ายกยอดมาคลาดเคลื่อน (Mismatch)' },
    { value: 'นับสต๊อคประจำเดือน', label: 'ปรับปรุงจากการนับสต๊อคประจำเดือน' },
    { value: 'สินค้าชำรุดเสียหาย (นอกระบบเคลม)', label: 'สินค้าชำรุดเสียหาย (นอกระบบเคลม)' },
    { value: 'อื่นๆ', label: 'อื่นๆ (ระบุในหมายเหตุ)' }
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!skuInput.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setProduct(null);
    setSuccessMessage('');
    setSubmitError('');

    try {
      // ดึงข้อมูลสินค้าโดยตรงด้วย SKU (ใช้ query service หรือ getDoc ก็ได้)
      const foundProduct = await inventoryQueryService.getProductBySku(skuInput.trim());
      if (foundProduct) {
        setProduct(foundProduct);
        setNewStock(foundProduct.stockQuantity || 0);
      } else {
        setSearchError(`ไม่พบสินค้า SKU: ${skuInput}`);
      }
    } catch (error) {
      setSearchError('เกิดข้อผิดพลาดในการค้นหา: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;

    if (newStock === '') {
      setSubmitError('กรุณาระบุจำนวนสต๊อคใหม่');
      return;
    }

    const numericNewStock = parseInt(newStock, 10);
    
    if (isNaN(numericNewStock) || numericNewStock < 0) {
      setSubmitError('จำนวนสต๊อคไม่สามารถติดลบได้');
      return;
    }

    if (numericNewStock === (product.stockQuantity || 0)) {
      setSubmitError('สต๊อคใหม่มีค่าเท่ากับสต๊อคเดิม ไม่มีการเปลี่ยนแปลง');
      return;
    }

    if (!reason) {
      setSubmitError('กรุณาเลือกเหตุผลในการปรับปรุงสต๊อค');
      return;
    }

    if (reason === 'อื่นๆ' && !note.trim()) {
      setSubmitError('กรุณาระบุหมายเหตุเมื่อเลือกเหตุผล "อื่นๆ"');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await inventoryAdjustmentService.adjustStock(
        product.sku,
        numericNewStock,
        reason,
        note,
        user
      );

      setSuccessMessage(`ปรับปรุงสต๊อค SKU: ${product.sku} เป็น ${numericNewStock} สำเร็จแล้ว`);
      
      // Update local state to reflect new stock
      setProduct(prev => ({ ...prev, stockQuantity: numericNewStock }));
      setReason('');
      setNote('');
      
    } catch (error) {
      setSubmitError(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              คำแนะนำการใช้งาน
            </h3>
            
            <div className="space-y-4 text-sm text-dh-main">
              <p className="font-bold border-l-2 border-blue-500 pl-3">ทำไมถึงต้องมีหน้านี้?</p>
              <p className="opacity-90 pl-3.5">
                ในระบบการขายปกติ สต๊อคจะถูกตัด/เพิ่ม อัตโนมัติและ <b>"ห้ามติดลบ"</b> เด็ดขาด เพราะบริษัทไม่ได้เป็นหนี้สินค้า 
                แต่ในความเป็นจริง อาจเกิดกรณี <i>"นับของผิดพลาด"</i> หรือ <i>"ของหาย"</i> 
                เครื่องมือนี้ถูกสร้างมาเพื่อแก้ปัญหาเฉพาะหน้า โดยไม่ต้องไปปลอมการซื้อขายในระบบ
              </p>

              <hr className="border-blue-500/20" />

              <p className="font-bold border-l-2 border-blue-500 pl-3">ตัวอย่างการใช้งาน และผลลัพธ์</p>
              
              <div className="space-y-3 pl-3.5">
                <div className="bg-dh-surface p-3 rounded-xl border border-dh-border">
                  <p className="font-bold text-orange-500 text-xs">สถานการณ์ที่ 1: สต๊อคในระบบติดลบ</p>
                  <p className="opacity-80 text-xs mt-1">
                    <b>ปัญหา:</b> ระบบโชว์สต๊อค -2 แต่ของจริงมี 5 ชิ้น<br/>
                    <b>วิธีแก้:</b> กรอกสต๊อคที่ถูกต้องคือ "5" เลือกเหตุผล "สินค้ายกยอดมาคลาดเคลื่อน"<br/>
                    <b>ผลลัพธ์:</b> สินค้ากลับมาขายได้ปกติ ระบบจะบันทึก Log การเปลี่ยนจาก -2 → 5
                  </p>
                </div>

                <div className="bg-dh-surface p-3 rounded-xl border border-dh-border">
                  <p className="font-bold text-red-500 text-xs">สถานการณ์ที่ 2: ของหาย</p>
                  <p className="opacity-80 text-xs mt-1">
                    <b>ปัญหา:</b> ระบบโชว์สต๊อค 10 แต่เดินไปนับของจริงมีแค่ 8 ชิ้น<br/>
                    <b>วิธีแก้:</b> กรอกสต๊อคที่ถูกต้องคือ "8" เลือกเหตุผล "สต๊อคสูญหาย"<br/>
                    <b>ผลลัพธ์:</b> ป้องกันลูกค้ากดซื้อของที่ไม่มีอยู่จริง ระบบบันทึกพฤติกรรมการปรับลดยอดเป็น WARN
                  </p>
                </div>
              </div>

              <hr className="border-blue-500/20" />

              <p className="font-bold border-l-2 border-blue-500 pl-3 flex items-center gap-2">
                <History size={16} /> การติดตาม (Audit)
              </p>
              <p className="opacity-90 pl-3.5">
                ทุกครั้งที่กด <b>"ยืนยันการปรับปรุง"</b> ระบบจะส่งข้อมูลทั้งหมด (ผู้แก้ไข, สินค้า, จำนวนเดิม, จำนวนใหม่, และเหตุผล) ไปเก็บใน <b>History Log</b> ส่วนกลางอย่างถาวร เพื่อให้ฝ่ายบริหารตรวจสอบได้เสมอ
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
