import React, { useState, useRef } from 'react';
import { useClaimData } from './hooks/useClaimData';
import ClaimHeader from './components/ClaimHeader';
import ClaimStatsRow from './components/ClaimStatsRow';
import ClaimTable from './components/table/ClaimTable';
import ClaimDetailModal from './components/detail/ClaimDetailModal';
import ClaimPrintView from './components/ClaimPrintView';
import GuideModal from '../../components/common/GuideModal';
import { HelpCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const claimGuideConfig = {
  description: "ระบบนี้ใช้สำหรับ <b>จัดการการแจ้งเคลม (ซ่อม/เปลี่ยน) และ การคืนสินค้า (Refund)</b> เพื่อให้สามารถติดตามสถานะและประสานงานกับลูกค้าได้อย่างรวดเร็ว",
  howTo: [
    "<b>ตรวจสอบรายการ:</b> ดูรายการที่มีสถานะ 'รับเรื่อง' เพื่อตรวจสอบข้อมูลและหลักฐานที่ลูกค้าแนบมา",
    "<b>อนุมัติคำร้อง:</b> หากข้อมูลครบถ้วน ให้กด 'อนุมัติ' สถานะจะเปลี่ยนเป็น <b>รอรับของ</b>",
    "<b>บันทึกการรับสินค้า:</b> เมื่อลูกค้าส่งของมาถึงร้าน ให้กด 'ได้รับสินค้าจากลูกค้าแล้ว' สถานะจะเปลี่ยนเป็น <b>กำลังตรวจสอบ</b>",
    "<b>เสร็จสิ้นกระบวนการ:</b> เมื่อตรวจสอบสินค้าเสร็จ ให้กด 'เสร็จสิ้นกระบวนการ' ระบบจะจัดการเพิ่มสต๊อก/คืนเงิน หรือตัดสต๊อกของใหม่ให้อัตโนมัติ"
  ],
  tips: [
    "คุณสามารถใช้ช่องค้นหาเพื่อค้นหาจาก <b>รหัสบิล</b> หรือ <b>ชื่อลูกค้า</b> ได้ทันที",
    "การ Export เป็น CSV จะนำข้อมูลที่แสดงผลอยู่ปัจจุบันทั้งหมดไปสร้างเป็นไฟล์ Excel",
    "<b>หลอดสถานะประกัน (Warranty)</b> จะคำนวณแบบ <b>Real-time ถึงปัจจุบัน</b> เพื่อบอกให้รู้ว่า สินค้าชิ้นนี้ซื้อมาแล้วกี่วัน และเหลือเวลาแจ้งเคลมอีกกี่วัน (อ้างอิงระยะเวลาประกันรวมจากกติกาของระบบ)"
  ],
  expectedResults: "การทำงานที่สมบูรณ์จะช่วยให้สต๊อกสินค้าแม่นยำขึ้น และลดข้อผิดพลาดในการคืนเงินให้ลูกค้า"
};

export default function ClaimMain() {
  const [copiedText, setCopiedText] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const { 
    loading,
    searchTerm, setSearchTerm,
    activeTab, setActiveTab,
    startDate, setStartDate,
    endDate, setEndDate,
    selectedRequest, setSelectedRequest,
    filteredRequests,
    stats,
    warrantyConfig
  } = useClaimData();

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'pending_manager': return { label: 'รอรับเรื่อง', color: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' };
      case 'waiting_item': return { label: 'รอรับของ', color: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' };
      case 'processing': return { label: 'กำลังตรวจ', color: 'bg-blue-500/10 text-blue-600 border border-blue-500/20' };
      case 'completed': 
      case 'approved': return { label: 'เสร็จสิ้น', color: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' };
      case 'rejected': return { label: 'ไม่อนุมัติ', color: 'bg-red-500/10 text-red-600 border border-red-500/20' };
      case 'cancelled': return { label: 'ยกเลิก', color: 'bg-gray-500/10 text-gray-600 border border-gray-500/20' };
      default: return { label: status, color: 'bg-gray-500/10 text-gray-600 border border-gray-500/20' };
    }
  };

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Claim_${selectedRequest?.payload?.orderDocId || 'Doc'}`,
    onPrintError: (error) => {
      console.error('Print failed:', error);
      alert('เกิดข้อผิดพลาดในการพิมพ์: ' + error.message);
    }
  });

  const handleQuickCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleExportCSV = () => {
    if (filteredRequests.length === 0) return alert('ไม่มีข้อมูลสำหรับ Export');
    
    const headers = ['Ref ID', 'Type', 'Status', 'SKU', 'Qty', 'Customer Name', 'Tracking No', 'Created At'];
    const rows = filteredRequests.map(req => {
      return [
        req.payload.claimId || req.payload.returnId || '-',
        req.type.includes('CLAIM') ? 'Claim' : 'Return',
        req.status,
        req.payload.sku || '-',
        req.payload.qty || 1,
        req.payload.customerName || 'Walk-in',
        req.payload.trackingNo || '-',
        new Date(req.createdAt).toLocaleString('th-TH')
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(',') + '\n' 
      + rows.map(e => e.map(item => `"${item}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Claim_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-dh-base overflow-hidden">
      <ClaimHeader 
        startDate={startDate} setStartDate={setStartDate}
        endDate={endDate} setEndDate={setEndDate}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        onExport={handleExportCSV}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <div className="flex-1 p-3 md:p-4 pb-0 relative animate-in fade-in duration-300 flex flex-col overflow-hidden">
        <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col space-y-4 pb-4">
          <div>
            <ClaimStatsRow stats={stats} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          
          <div className="flex-1 overflow-hidden bg-dh-surface rounded-xl border border-dh-border shadow-sm flex flex-col">
            <ClaimTable 
              filteredRequests={filteredRequests}
              loading={loading}
              getStatusDisplay={getStatusDisplay}
              setSelectedRequest={setSelectedRequest}
              warrantyConfig={warrantyConfig}
            />
          </div>
        </div>
      </div>

      <ClaimDetailModal 
        selectedRequest={selectedRequest}
        setSelectedRequest={setSelectedRequest}
        handlePrint={handlePrint}
        handleQuickCopy={handleQuickCopy}
        copiedText={copiedText}
        getStatusDisplay={getStatusDisplay}
      />

      <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden h-0">
        <ClaimPrintView ref={printRef} req={selectedRequest} />
      </div>

      <GuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
        title="คู่มือจัดการเคลม/คืนสินค้า"
        config={claimGuideConfig}
      />
    </div>
  );
}