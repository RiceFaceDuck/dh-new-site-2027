import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ExternalLink, 
  Upload, 
  Copy, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  User, 
  MapPin, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { driveService } from '../../firebase/driveService';
import { todoService } from '../../firebase/todoService';

const TaxInvoiceCard = ({ task, currentUser, onSuccess, urgencyLevel }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // ตรวจสอบว่ามีข้อมูล task และ taxInvoice หรือไม่
  if (!task || !task.payload?.taxInvoice) return null;

  const { taxInvoice } = task.payload;
  const orderId = task.orderId || task.payload?.orderId || '';
  const customerName = taxInvoice.companyName || taxInvoice.name || task.customerName || 'ลูกค้าทั่วไป';
  const isCorporate = taxInvoice.type === 'company' || taxInvoice.type === 'corporate';
  const branchText = taxInvoice.branch || (taxInvoice.isHeadOffice ? 'สำนักงานใหญ่' : (taxInvoice.branchCode ? `สาขา ${taxInvoice.branchCode}` : ''));

  // ประกอบที่อยู่ออกใบกำกับภาษีให้สมบูรณ์
  const formattedAddress = [
    taxInvoice.address,
    taxInvoice.subdistrict ? `ต.${taxInvoice.subdistrict}` : '',
    taxInvoice.district ? `อ.${taxInvoice.district}` : '',
    taxInvoice.province ? `จ.${taxInvoice.province}` : '',
    taxInvoice.zipcode || ''
  ].filter(Boolean).join(' ');

  const handleCopyTaxId = (e) => {
    e.stopPropagation();
    if (!taxInvoice.taxId) return;
    navigator.clipboard.writeText(taxInvoice.taxId);
    setIsCopied(true);
    toast.success('คัดลอกเลขประจำตัวผู้เสียภาษีแล้ว');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyAddress = (e) => {
    e.stopPropagation();
    if (!formattedAddress) return;
    navigator.clipboard.writeText(formattedAddress);
    toast.success('คัดลอกที่อยู่ออกใบกำกับภาษีแล้ว');
  };

  const handleGoToTask = (e) => {
    e.stopPropagation();
    if (!orderId) {
      toast.error('ไม่พบรหัสออเดอร์');
      return;
    }
    toast.success('กำลังนำไปยังหน้าบิลเพื่อจัดการงาน...');
    navigate('/billing', { state: { orderId: orderId, selectOrder: true } });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // จำกัด 5MB
        setErrorMsg('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setErrorMsg('');
    }
  };

  const handleUploadTaxInvoice = async () => {
    if (!file) {
      setErrorMsg('กรุณาเลือกไฟล์ใบกำกับภาษี (PDF หรือรูปภาพ)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let fileUrl = '';
      
      // อัปโหลดไฟล์ผ่าน driveService
      try {
        const uploadFn = driveService.uploadSlip || driveService.uploadImage;
        if (typeof uploadFn === 'function') {
          fileUrl = await uploadFn(file);
        } else {
          throw new Error("driveService.uploadFile is not a function");
        }
      } catch (uploadError) {
        console.error("Upload Tax Invoice Failed:", uploadError);
        throw new Error("ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง");
      }

      if (!fileUrl) {
        throw new Error("ไม่ได้รับ URL หลังจากอัปโหลด");
      }

      await todoService.completeTaxInvoiceTask(task, fileUrl, currentUser);
      toast.success('ส่งใบกำกับภาษีให้ลูกค้าเรียบร้อยแล้ว');
      setIsUploadModalOpen(false);
      setFile(null);

      if (onSuccess) onSuccess();

    } catch (error) {
      console.error("Handle Upload Error:", error);
      setErrorMsg(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyStyles = (level) => {
    switch (level) {
      case 'high': 
        return 'bg-gradient-to-br from-rose-50/70 via-white to-pink-50/40 border border-rose-200/80 shadow-xs hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5';
      case 'medium': 
        return 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border border-amber-200/80 shadow-xs hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5';
      default: 
        return 'bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40 border border-teal-200/80 shadow-xs hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5';
    }
  };

  const timeFormatted = task.requestedAt?.toDate 
    ? task.requestedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : (task.createdAt?.toDate 
      ? task.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : (task.createdAt ? new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'));

  return (
    <div className={`rounded-[0.2rem] transition-all duration-200 overflow-hidden relative flex flex-col h-full ${getUrgencyStyles(urgencyLevel)} ${isSubmitting ? 'opacity-75 pointer-events-none' : ''}`}>
      
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-xs z-10 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      <div className="p-4 flex flex-col justify-between h-full gap-3">
        {/* 1. Header: Badge + Order ID + Status + Short Timestamp */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5 select-none">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-[0.2rem] shadow-xs uppercase tracking-wider flex items-center gap-1 shrink-0">
              <FileText className="w-3 h-3" />
              ขอใบกำกับภาษี
            </span>
            <span className="text-xs font-black text-gray-800 truncate">
              #{orderId ? orderId.slice(-8).toUpperCase() : 'N/A'}
            </span>
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem] shrink-0">
              รออัปโหลดเอกสาร
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium shrink-0">
            {timeFormatted}
          </span>
        </div>

        {/* 2. Body: Document Icon Thumbnail + Tax Info & Details */}
        <div className="flex items-start gap-3.5">
          {/* Document Visual Box */}
          <div 
            onClick={() => setIsUploadModalOpen(true)}
            className="w-16 min-h-[5.5rem] shrink-0 rounded-[0.2rem] border-2 border-teal-200 border-dashed bg-teal-50/60 flex flex-col items-center justify-center relative cursor-pointer hover:border-teal-400 transition-colors shadow-inner group"
            title="คลิกเพื่ออัปโหลดใบกำกับภาษี"
          >
            <FileText className="w-6 h-6 text-teal-600 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black tracking-wider text-teal-700 mt-1 uppercase">
              TAX INVOICE
            </span>
            <div className="absolute inset-0 bg-teal-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-4 h-4 text-teal-800" />
            </div>
          </div>

          {/* Details & Actions */}
          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
            <div>
              <p className="text-xs text-gray-900 font-bold truncate flex items-center gap-1" title={customerName}>
                {isCorporate ? <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" /> : <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                <span className="truncate">{customerName}</span>
              </p>
              
              {/* เลขผู้เสียภาษี พร้อมปุ่มคัดลอก */}
              {taxInvoice.taxId && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-gray-500 font-medium">เลขภาษี:</span>
                  <span className="font-mono text-xs font-bold text-teal-800 tracking-wide">
                    {taxInvoice.taxId}
                  </span>
                  <button 
                    type="button"
                    onClick={handleCopyTaxId}
                    title="คัดลอกเลขประจำตัวผู้เสียภาษี"
                    className="p-0.5 text-gray-400 hover:text-teal-700 rounded-[0.2rem] transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}

              {/* ประเภทและสาขา */}
              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                {isCorporate ? 'นิติบุคคล' : 'บุคคลธรรมดา'} {branchText ? `• ${branchText}` : ''}
              </p>
            </div>

            {/* Toggle ดูรายละเอียด */}
            <div className="flex items-center justify-between gap-2 mt-2">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
                className="text-[11px] text-teal-700 hover:text-teal-900 underline flex items-center gap-1 font-semibold bg-teal-50/80 hover:bg-teal-100 px-2 py-0.5 rounded-[0.2rem] transition-colors cursor-pointer"
              >
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {isExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียด'}
              </button>
            </div>
          </div>
        </div>

        {/* 2.1 Expanded Detailed Information (Single Column, Clean Spacing) */}
        {isExpanded && (
          <div className="bg-teal-50/30 border border-teal-100 rounded-[0.2rem] p-3 text-xs text-gray-700 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-[11px] text-gray-500 font-medium">ที่อยู่ออกใบกำกับภาษี:</p>
                <p className="text-xs text-gray-900 font-medium leading-relaxed break-words">
                  {formattedAddress || 'ไม่ระบุที่อยู่'}
                </p>
              </div>
              {formattedAddress && (
                <button 
                  type="button"
                  onClick={handleCopyAddress}
                  className="px-2 py-1 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 rounded-[0.2rem] text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> คัดลอกที่อยู่
                </button>
              )}
            </div>

            {taxInvoice.email && (
              <p className="text-[11px] text-gray-600 truncate border-t border-teal-100/60 pt-1">
                อีเมล: <span className="text-gray-900 font-medium">{taxInvoice.email}</span>
              </p>
            )}
            {taxInvoice.phone && (
              <p className="text-[11px] text-gray-600 truncate">
                เบอร์โทร: <span className="text-gray-900 font-medium">{taxInvoice.phone}</span>
              </p>
            )}
          </div>
        )}

        {/* 3. Footer: Action Buttons (ไปที่งาน + อัปโหลดเอกสาร) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          <button 
            type="button"
            onClick={handleGoToTask}
            disabled={isSubmitting}
            className="py-1.5 px-3 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-200 rounded-[0.2rem] shadow-2xs transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
            <span>ไปที่งาน</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            disabled={isSubmitting}
            className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-[0.2rem] shadow-2xs transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>อัปโหลดเอกสาร</span>
          </button>
        </div>
      </div>

      {/* 🔴 4. Upload Modal Dialog (เรนเดอร์ผ่าน createPortal ป้องกัน CSS Clipping) */}
      {isUploadModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => { if (!isSubmitting) setIsUploadModalOpen(false); }}
        >
          <div 
            className="bg-white rounded-[0.2rem] shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 text-teal-700 rounded-[0.2rem]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">อัปโหลดใบกำกับภาษี</h3>
                  <p className="text-[11px] text-gray-500 truncate max-w-[280px]">
                    ออเดอร์ #{orderId.slice(-8).toUpperCase()} — {customerName}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { if (!isSubmitting) setIsUploadModalOpen(false); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-[0.2rem] hover:bg-gray-200/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <label className={`flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed rounded-[0.2rem] cursor-pointer transition-all ${file ? 'border-teal-500 bg-teal-50/40' : 'border-gray-300 hover:border-teal-400 bg-gray-50 hover:bg-teal-50/20'}`}>
                <div className="text-center w-full">
                  {file ? (
                    <div className="text-teal-700 flex flex-col items-center">
                      <FileCheck className="w-12 h-12 text-teal-600 mb-2" />
                      <span className="font-bold text-sm text-gray-900 line-clamp-1">{file.name}</span>
                      <span className="text-xs text-teal-600 font-semibold mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span className="text-[11px] text-gray-400 mt-2 underline">คลิกเพื่อเปลี่ยนไฟล์</span>
                    </div>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                      <span className="text-sm font-bold text-teal-600">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง</span>
                      <p className="text-xs text-gray-500 mt-1">รองรับ PDF, JPG, PNG ขนาดไม่เกิน 5MB</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="sr-only" 
                    accept=".pdf, image/jpeg, image/png, image/jpg" 
                    onChange={handleFileChange} 
                    disabled={isSubmitting} 
                  />
                </div>
              </label>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[0.2rem] flex items-center gap-2 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <button 
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs border border-gray-200 rounded-[0.2rem] transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button 
                type="button"
                onClick={handleUploadTaxInvoice}
                disabled={isSubmitting || !file}
                className={`px-4 py-2 text-white font-bold text-xs rounded-[0.2rem] transition-all flex items-center gap-2 cursor-pointer shadow-xs ${isSubmitting || !file ? 'bg-teal-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 active:scale-95'}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                    กำลังอัปโหลดและส่งให้ลูกค้า...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    ส่งเอกสารให้ลูกค้า
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default TaxInvoiceCard;