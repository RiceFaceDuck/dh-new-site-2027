import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, 
  AlertCircle, 
  Check, 
  X, 
  Building2, 
  User, 
  Send, 
  Loader2,
  HelpCircle
} from 'lucide-react';
import { doc, collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { useToast } from '../../../../context/ToastContext';

export default function CustomerTaxInfoModal({ order, isOpen, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const rawTax = order?.taxInvoice || order?.taxData || {};

  const [formData, setFormData] = useState({
    type: 'company',
    name: '',
    taxId: '',
    isHeadOffice: true,
    branchCode: '',
    address: '',
    subdistrict: '',
    district: '',
    province: '',
    zipcode: '',
    phone: '',
    email: ''
  });

  // Pre-fill existing data from order or profile
  useEffect(() => {
    if (order) {
      const tax = order.taxInvoice || order.taxData || {};
      const ship = order.shippingAddress || {};
      setFormData({
        type: tax.type || 'company',
        name: tax.name || tax.companyName || ship.fullName || '',
        taxId: tax.taxId || '',
        isHeadOffice: tax.isHeadOffice ?? (tax.branchCode ? false : true),
        branchCode: tax.branchCode || '',
        address: tax.address || ship.address || '',
        subdistrict: tax.subdistrict || ship.subdistrict || '',
        district: tax.district || ship.district || '',
        province: tax.province || ship.province || '',
        zipcode: tax.zipcode || ship.zipcode || '',
        phone: tax.phone || ship.phone || '',
        email: tax.email || ''
      });
      setErrorMsg('');
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const displayOrderId = order.orderId && order.orderId.startsWith('DH-')
    ? order.orderId
    : `#${(order.orderId || order.id)?.slice(-8).toUpperCase()}`;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Strict numeric formatting for taxId (13 digits) and branchCode (5 digits)
    if (name === 'taxId' && value && !/^\d{0,13}$/.test(value)) return;
    if (name === 'branchCode' && value && !/^\d{0,5}$/.test(value)) return;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!formData.name || formData.name.trim().length < 3) {
      setErrorMsg('กรุณากรอกชื่อผู้เสียภาษี หรือชื่อบริษัทให้ถูกต้อง');
      return;
    }
    if (!formData.taxId || formData.taxId.length !== 13) {
      setErrorMsg('กรุณากรอกเลขประจำตัวผู้เสียภาษีให้ครบ 13 หลัก');
      return;
    }
    if (formData.type === 'company' && !formData.isHeadOffice && (!formData.branchCode || formData.branchCode.length < 4)) {
      setErrorMsg('กรุณากรอกรหัสสาขา 4-5 หลัก หรือเลือกเป็นสำนักงานใหญ่');
      return;
    }
    if (!formData.address || formData.address.trim().length < 5) {
      setErrorMsg('กรุณากรอกที่อยู่ออกใบกำกับภาษีให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedTaxData = {
        ...formData,
        companyName: formData.name,
        branch: formData.isHeadOffice ? 'สำนักงานใหญ่' : `สาขา ${formData.branchCode}`
      };

      const batch = writeBatch(db);

      // 1. อัปเดตเอกสารออเดอร์
      const orderRef = doc(db, getCollectionPath('orders'), order.id);
      batch.set(orderRef, {
        taxInvoice: updatedTaxData,
        taxData: updatedTaxData,
        taxInvoiceStatus: 'pending',
        taxInvoiceNeedInfo: false,
        customerUpdatedTaxAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // ถ้ามี draftOrderId หรือ originalDraftId ให้ซิงก์ด้วย
      const altOrderId = order.draftOrderId || order.originalDraftId;
      if (altOrderId && altOrderId !== order.id) {
        const altRef = doc(db, getCollectionPath('orders'), altOrderId);
        batch.set(altRef, {
          taxInvoice: updatedTaxData,
          taxData: updatedTaxData,
          taxInvoiceStatus: 'pending',
          taxInvoiceNeedInfo: false,
          customerUpdatedTaxAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // 2. ค้นหาและอัปเดตงานใน todos ให้เจ้าหน้าที่เห็น
      try {
        const todosRef = collection(db, getCollectionPath('todos'));
        const q0 = query(todosRef, where('orderId', '==', order.orderId || order.id));
        const q1 = query(todosRef, where('orderId', '==', order.id));
        const [snap0, snap1] = await Promise.all([getDocs(q0), getDocs(q1)]);
        
        const seenTodoIds = new Set();
        [snap0, snap1].forEach(snap => {
          snap.forEach(docSnap => {
            if (!seenTodoIds.has(docSnap.id)) {
              seenTodoIds.add(docSnap.id);
              const tData = docSnap.data();
              if (tData.type === 'issue_tax_invoice') {
                batch.update(docSnap.ref, {
                  status: 'pending',
                  taxInvoiceStatus: 'pending',
                  'payload.taxInvoice': updatedTaxData,
                  title: `ออกใบกำกับภาษี: ออเดอร์ #${displayOrderId} (ลูกค้าส่งข้อมูลใหม่แล้ว)`,
                  customerNote: 'ลูกค้าแก้ไขข้อมูลแล้ว',
                  updatedAt: serverTimestamp()
                });
              }
            }
          });
        });
      } catch (todoErr) {
        console.warn("Could not query todos in customer modal:", todoErr);
      }

      await batch.commit();

      showToast('ส่งข้อมูลใบกำกับภาษีเรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการออกเอกสารให้โดยเร็ว', 'success');
      if (onSuccess) onSuccess(updatedTaxData);
      onClose();

    } catch (err) {
      console.error("🔥 Error submitting tax info:", err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={() => { if (!isSubmitting) onClose(); }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">กรุณาระบุข้อมูลใบกำกับภาษีใหม่อีกครั้ง</h3>
              <p className="text-xs text-gray-500 font-medium">
                คำสั่งซื้อ {displayOrderId}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => { if (!isSubmitting) onClose(); }}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm text-gray-700 custom-scrollbar">
          
          {/* Note from staff */}
          {order.taxInvoiceRequestReason && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2.5 shadow-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold block text-amber-800 mb-0.5">ข้อความจากเจ้าหน้าที่:</span>
                {order.taxInvoiceRequestReason}
              </div>
            </div>
          )}

          {/* Type Selector (นิติบุคคล / บุคคลธรรมดา) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">ประเภทผู้เสียภาษี</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'company' }))}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${formData.type === 'company' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-xs' : 'border-slate-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                <Building2 className="w-4 h-4" />
                นิติบุคคล (บริษัท / หจก.)
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'personal', isHeadOffice: true, branchCode: '' }))}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${formData.type === 'personal' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-xs' : 'border-slate-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                <User className="w-4 h-4" />
                บุคคลธรรมดา
              </button>
            </div>
          </div>

          {/* Name & Tax ID */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {formData.type === 'company' ? 'ชื่อบริษัท / นิติบุคคล' : 'ชื่อ-นามสกุล ผู้เสียภาษี'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={formData.type === 'company' ? 'เช่น บริษัท ดีเอช โน้ตบุ๊ค จำกัด' : 'เช่น นายสมชาย ใจดี'}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                เลขประจำตัวผู้เสียภาษี (13 หลัก) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                maxLength={13}
                placeholder="ระบุเลข 13 หลัก (เฉพาะตัวเลข)"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 tracking-wider"
                required
              />
            </div>
          </div>

          {/* Branch (Company Only) */}
          {formData.type === 'company' && (
            <div className="p-3 bg-gray-50 rounded-lg border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-gray-700">สาขา</label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="headOfficeRadio"
                    checked={formData.isHeadOffice}
                    onChange={() => setFormData(prev => ({ ...prev, isHeadOffice: true, branchCode: '' }))}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>สำนักงานใหญ่</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="headOfficeRadio"
                    checked={!formData.isHeadOffice}
                    onChange={() => setFormData(prev => ({ ...prev, isHeadOffice: false }))}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>สาขา (ระบุรหัส)</span>
                </label>
              </div>

              {!formData.isHeadOffice && (
                <div className="mt-2">
                  <input
                    type="text"
                    name="branchCode"
                    value={formData.branchCode}
                    onChange={handleChange}
                    maxLength={5}
                    placeholder="รหัสสาขา 5 หลัก เช่น 00001"
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Address Details */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              ที่อยู่ออกใบกำกับภาษี <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="เลขที่, อาคาร, ถนน, ซอย"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">ตำบล / แขวง</label>
              <input
                type="text"
                name="subdistrict"
                value={formData.subdistrict}
                onChange={handleChange}
                placeholder="ตำบล/แขวง"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">อำเภอ / เขต</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="อำเภอ/เขต"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">จังหวัด</label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="จังหวัด"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">รหัสไปรษณีย์</label>
              <input
                type="text"
                name="zipcode"
                value={formData.zipcode}
                onChange={handleChange}
                maxLength={5}
                placeholder="รหัสไปรษณีย์ 5 หลัก"
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Contact (Phone / Email) */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">เบอร์โทรติดต่อ</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="เบอร์โทรศัพท์"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">อีเมลรับเอกสาร (PDF)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@mail.com"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => { if (!isSubmitting) onClose(); }}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังส่งข้อมูล...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  บันทึกและส่งข้อมูลให้เจ้าหน้าที่
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
