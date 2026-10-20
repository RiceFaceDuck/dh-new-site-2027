import React, { useState, useEffect } from 'react';
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
  FileCheck,
  RefreshCw,
  Send,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { driveService } from '../../firebase/driveService';
import { todoService } from '../../firebase/todoService';
import { billingQueryService } from '../../firebase/billingQueryService';

const TaxInvoiceCard = ({ task, currentUser, onSuccess, urgencyLevel }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [orderData, setOrderData] = useState(null);

  // ตรวจสอบว่ามีข้อมูล task และ taxInvoice หรือไม่
  if (!task || !task.payload?.taxInvoice) return null;

  const { taxInvoice } = task.payload;
  const rawOrderId = task.orderId || task.payload?.orderId || '';

  // 🔍 ดึงข้อมูลบิลจริง เพื่อดูเลขที่บิลทางการ (เช่น DH-26-XXXX) หรือดูว่าถูก superseded หรือยัง
  useEffect(() => {
    let isMounted = true;
    const fetchOrderDetails = async () => {
      if (!rawOrderId) return;
      try {
        let docData = await billingQueryService.getOrderById(rawOrderId);
        if (!docData) {
          try {
            docData = await billingQueryService.getOrderByOrderId(rawOrderId);
          } catch (_) {}
        }
        
        // ถ้าถูกแทนที่ด้วยบิลทางการ (supersededBy) ให้ตามไปดึงบิลทางการ
        if (docData && docData.supersededBy) {
          const officialDoc = await billingQueryService.getOrderById(docData.supersededBy);
          if (officialDoc && isMounted) {
            setOrderData(officialDoc);
            return;
          }
        }

        if (docData && isMounted) {
          setOrderData(docData);
        }
      } catch (err) {
        console.warn("Could not fetch order data in TaxInvoiceCard:", err);
      }
    };

    fetchOrderDetails();
    return () => { isMounted = false; };
  }, [rawOrderId]);

  // ฟังก์ชันช่วยจัดรูปแบบรหัสออเดอร์ให้สวยงาม ไม่ตัดทอนผิดพลาด
  const formatDisplayOrderId = () => {
    const effectiveId = orderData?.orderId || rawOrderId;
    if (!effectiveId) return 'N/A';
    
    // ถ้าเป็นบิลทางการ เช่น DH-26-0052
    if (/^DH-\d{2}-\d+/.test(effectiveId)) {
      return effectiveId;
    }
    // ถ้าเป็นรหัสบิลร่างแบบยาว DH-TEMP-YYMMDD-HHMMSS-RAND4 ให้ย่อเป็น DH-TEMP-RAND4
    if (/^DH-TEMP-\d{6}-\d{6}-(\d{4})$/.test(effectiveId)) {
      return effectiveId.replace(/^DH-TEMP-\d{6}-\d{6}-(\d{4})$/, 'DH-TEMP-$1');
    }
    return effectiveId;
  };

  const displayOrderId = formatDisplayOrderId();
  const customerName = taxInvoice.companyName || taxInvoice.name || task.customerName || 'ลูกค้าทั่วไป';
  const isCorporate = taxInvoice.type === 'company' || taxInvoice.type === 'corporate';
  const branchText = taxInvoice.branch || (taxInvoice.isHeadOffice ? 'สำนักงานใหญ่' : (taxInvoice.branchCode ? `สาขา ${taxInvoice.branchCode}` : ''));

  // ตรวจสอบสถานะคำขอข้อมูลลูกค้า
  const isWaitingCustomerInfo = orderData?.taxInvoiceStatus === 'need_customer_info' || task.taxInvoiceStatus === 'need_customer_info';
  const isInvoiceIssued = orderData?.taxInvoiceStatus === 'issued' || task.taxInvoiceStatus === 'issued' || Boolean(orderData?.taxInvoiceUrl);

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
    const targetOrderId = orderData?.orderId || orderData?.id || rawOrderId;
    if (!targetOrderId) {
      toast.error('ไม่พบรหัสออเดอร์');
      return;
    }
    toast.success('กำลังนำไปยังหน้าบิลเพื่อจัดการงาน...');
    navigate('/billing', { 
      state: { 
        orderId: targetOrderId, 
        draftOrderId: orderData?.draftOrderId || orderData?.originalDraftId || rawOrderId,
        selectOrder: true 
      } 
    });
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

  // 1. จัดการอัปโหลดใบกำกับภาษี (จาก Document Visual Box ด้านซ้าย)
  const handleUploadTaxInvoice = async () => {
    if (!file) {
      setErrorMsg('กรุณาเลือกไฟล์ใบกำกับภาษี (PDF หรือรูปภาพ)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let fileUrl = '';
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

      await todoService.completeTaxInvoiceTask(task, fileUrl, currentUser, orderData);
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

  // 2. จัดการส่งคำขอข้อมูลใบกำกับภาษีกับลูกค้าใหม่อีกครั้ง
  const handleSendRequestCustomerInfo = async () => {
    setIsSubmitting(true);
    try {
      await todoService.requestCustomerTaxInfo(task, requestReason, currentUser, orderData);
      toast.success('ส่งคำขอข้อมูลใบกำกับภาษีใหม่ไปยังลูกค้าเรียบร้อยแล้ว');
      setIsRequestModalOpen(false);
      setRequestReason('');
      
      // อัปเดตสถานะใน local state ทันที
      setOrderData(prev => prev ? ({ ...prev, taxInvoiceStatus: 'need_customer_info' }) : null);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Handle Request Customer Info Error:", error);
      toast.error('ไม่สามารถส่งคำขอได้: ' + (error.message || 'เกิดข้อผิดพลาด'));
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
            <span className="text-xs font-black text-gray-800 truncate" title={`เลขออเดอร์: ${displayOrderId}`}>
              #{displayOrderId}
            </span>
            {isInvoiceIssued ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem] shrink-0">
                ออกเอกสารแล้ว
              </span>
            ) : isWaitingCustomerInfo ? (
              <span className="bg-amber-50 text-amber-700 border border-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem] shrink-0 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                รอข้อมูลจากลูกค้า
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-[0.2rem] shrink-0">
                รออัปโหลดเอกสาร
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-400 font-medium shrink-0">
            {timeFormatted}
          </span>
        </div>

        {/* 2. Body: Document Icon Thumbnail + Tax Info & Details */}
        <div className="flex items-start gap-3.5">
          {/* Document Visual Box (จุดสำหรับคลิกอัปโหลดใบกำกับภาษี PDF/รูปภาพ) */}
          <div 
            onClick={() => setIsUploadModalOpen(true)}
            className="w-16 min-h-[5.5rem] shrink-0 rounded-[0.2rem] border-2 border-teal-200 border-dashed bg-teal-50/60 flex flex-col items-center justify-center relative cursor-pointer hover:border-teal-400 transition-colors shadow-inner group"
            title="คลิกเพื่ออัปโหลดใบกำกับภาษี (PDF หรือรูปภาพ)"
          >
            <FileText className="w-6 h-6 text-teal-600 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black tracking-wider text-teal-700 mt-1 uppercase text-center leading-tight">
              TAX INVOICE
            </span>
            <div className="absolute inset-0 bg-teal-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[0.2rem]">
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
            {task.customerNote && (
              <p className="text-[11px] text-amber-700 border-t border-amber-200/60 pt-1 font-medium">
                หมายเหตุขอข้อมูลล่าสุด: {task.customerNote}
              </p>
            )}
          </div>
        )}

        {/* 3. Footer: Action Buttons (ไปที่งาน + ขอข้อมูลกับลูกค้าใหม่อีกครั้ง) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          <button 
            type="button"
            onClick={handleGoToTask}
            disabled={isSubmitting}
            className="py-1.5 px-3 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-200 rounded-[0.2rem] shadow-2xs transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            title="เปิดหน้ารายละเอียดคำสั่งซื้อในระบบบิล"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
            <span>ไปที่งาน</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            disabled={isSubmitting}
            className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-[0.2rem] shadow-2xs transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer truncate"
            title="ขอให้ลูกค้าอัปเดตข้อมูลใบกำกับภาษีใหม่ที่หน้าเว็บ"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">ขอข้อมูลกับลูกค้าใหม่อีกครั้ง</span>
          </button>
        </div>
      </div>

      {/* 🔴 4. Modal: ขอข้อมูลกับลูกค้าใหม่อีกครั้ง (แสดง Pop-up ให้พนักงานระบุหมายเหตุ) */}
      {isRequestModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => { if (!isSubmitting) setIsRequestModalOpen(false); }}
        >
          <div 
            className="bg-white rounded-[0.2rem] shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-[0.2rem]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">ขอข้อมูลใบกำกับภาษีกับลูกค้าใหม่อีกครั้ง</h3>
                  <p className="text-[11px] text-gray-500 truncate max-w-[320px]">
                    ออเดอร์ #{displayOrderId} — {customerName}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { if (!isSubmitting) setIsRequestModalOpen(false); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-[0.2rem] hover:bg-gray-200/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-[0.2rem] text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  การทำงานของระบบ:
                </p>
                <p className="text-gray-600 pl-5 leading-relaxed">
                  ระบบจะเปลี่ยนสถานะเป็น <b>"ขอข้อมูลใบกำกับภาษีใหม่"</b> และแสดง Pop-up แจ้งเตือนลูกค้าทันทีที่หน้าประวัติคำสั่งซื้อ (<span className="text-amber-800 font-mono">dh-servicehub.com/profile?tab=history</span>) เพื่อให้ลูกค้ากดแก้ไขและส่งข้อมูลที่ถูกต้องกลับมา
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  ระบุเหตุผล หรือข้อมูลที่ต้องการให้ลูกค้าแก้ไข (ทางเลือก):
                </label>
                <textarea
                  rows={3}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="เช่น เลขประจำตัวผู้เสียภาษีไม่ครบ 13 หลัก, ที่อยู่ไม่สมบูรณ์ หรือชื่อบริษัทไม่ตรงกับ ภ.พ.20"
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-[0.2rem] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-sans"
                />
              </div>

              {/* ข้อความสำเร็จรูปให้กดเลือกไวๆ */}
              <div>
                <span className="text-[11px] text-gray-500 font-medium block mb-1.5">ข้อความสำเร็จรูป (คลิกเพื่อเลือก):</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'เลขประจำตัวผู้เสียภาษีไม่ถูกต้อง / ไม่ครบ 13 หลัก',
                    'ที่อยู่ออกใบกำกับภาษีไม่ครบถ้วน หรือไม่มีรหัสไปรษณีย์',
                    'โปรดระบุสาขา หรือระบุให้ชัดเจนว่าเป็นสำนักงานใหญ่',
                    'ชื่อบริษัทหรือชื่อผู้เสียภาษีไม่ตรงกับเอกสาร ภ.พ.20'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRequestReason(preset)}
                      className="px-2 py-1 bg-gray-100 hover:bg-amber-100 hover:text-amber-800 text-[10.5px] rounded-[0.2rem] text-gray-700 transition-colors border border-gray-200 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <button 
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs border border-gray-200 rounded-[0.2rem] transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button 
                type="button"
                onClick={handleSendRequestCustomerInfo}
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-[0.2rem] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งคำขอให้ลูกค้า</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 🔴 5. Upload Modal Dialog (คลิกจาก Document Visual Box ด้านซ้าย) */}
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
                    ออเดอร์ #{displayOrderId} — {customerName}
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
