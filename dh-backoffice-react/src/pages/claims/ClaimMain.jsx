import { useState, useRef, lazy, Suspense } from 'react';
import { useClaimData } from './hooks/useClaimData';
import ClaimHeader from './components/ClaimHeader';
import ClaimStatsRow from './components/ClaimStatsRow';
import ClaimTable from './components/table/ClaimTable';
import ClaimPrintView from './components/ClaimPrintView';
import { useReactToPrint } from 'react-to-print';

// ⚡ Lazy Loading Heavy Modals
const ClaimDetailModal = lazy(() => import('./components/detail/ClaimDetailModal'));
const GuideModal = lazy(() => import('../../components/common/GuideModal'));

const claimGuideConfig = {
  description: "ระบบนี้ใช้สำหรับ <b>จัดการคำร้องแจ้งเคลม (Claim), เปลี่ยนสินค้า (Exchange) และ คืนสินค้า (Return)</b> เพื่อให้สามารถติดตามสถานะและประสานงานกับลูกค้าได้อย่างรวดเร็ว",
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
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { 
    loading,
    searchTerm, setSearchTerm,
    activeTab, setActiveTab,
    startDate, setStartDate,
    endDate, setEndDate,
    filteredRequests,
    paginatedRequests,
    currentPage, setCurrentPage,
    totalPages,
    pageSize, setPageSize,
    stats,
    warrantyConfig,
    customerProfiles
  } = useClaimData();


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
      const p = req.payload || {};
      const refId = p.claimId || p.exchangeId || p.returnId || req.id || '-';
      
      const rawRef = String(refId).toUpperCase();
      const isClaim = rawRef.startsWith('CLM') || req.type === 'CLAIM_APPROVAL';
      const isExchange = rawRef.startsWith('EXC') || req.type === 'EXCHANGE_APPROVAL' || !!p.isSwapSku;
      const typeLabel = isExchange ? 'Exchange' : isClaim ? 'Claim' : 'Return';

      let dateStr = '-';
      if (req.createdAt) {
        if (typeof req.createdAt.toDate === 'function') {
          dateStr = req.createdAt.toDate().toLocaleString('th-TH');
        } else {
          const d = new Date(req.createdAt);
          dateStr = !isNaN(d.getTime()) ? d.toLocaleString('th-TH') : '-';
        }
      }

      return [
        refId,
        typeLabel,
        req.status || '-',
        p.sku || '-',
        p.qty || 1,
        p.customerName || 'ลูกค้าทั่วไป',
        p.trackingNo || '-',
        dateStr
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(',') + '\n' 
      + rows.map(e => e.map(item => `"${String(item ?? '').replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Claim_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-dh-base overflow-hidden">
      <ClaimHeader 
        startDate={startDate} setStartDate={setStartDate}
        endDate={endDate} setEndDate={setEndDate}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        onExport={handleExportCSV}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <div className="flex-1 min-h-0 p-3 md:p-4 pb-2 relative animate-in fade-in duration-300 flex flex-col overflow-hidden">
        <div className="max-w-[1600px] mx-auto w-full flex-1 min-h-0 flex flex-col gap-3">
          <div>
            <ClaimStatsRow stats={stats} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          
          <div className="flex-1 min-h-0 overflow-hidden bg-dh-surface rounded-xl border border-dh-border shadow-xs flex flex-col">
            <ClaimTable 
              filteredRequests={paginatedRequests}
              loading={loading}
              setSelectedRequest={setSelectedRequest}
              warrantyConfig={warrantyConfig}
              customerProfiles={customerProfiles}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRequests.length}
              pageSize={pageSize}
              setPageSize={setPageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {selectedRequest && (
          <ClaimDetailModal 
            selectedRequest={selectedRequest}
            setSelectedRequest={setSelectedRequest}
            handlePrint={handlePrint}
            handleQuickCopy={handleQuickCopy}
            copiedText={copiedText}
            customerProfile={selectedRequest?.payload?.customerUid ? customerProfiles?.[selectedRequest.payload.customerUid] : null}
            warrantyConfig={warrantyConfig}
          />
        )}

        {isGuideOpen && (
          <GuideModal 
            isOpen={isGuideOpen} 
            onClose={() => setIsGuideOpen(false)} 
            title="คู่มือจัดการเคลม/คืนสินค้า"
            config={claimGuideConfig}
          />
        )}
      </Suspense>

      <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden h-0">
        <ClaimPrintView 
          ref={printRef} 
          req={selectedRequest} 
          preloadedCustomerProfile={selectedRequest?.payload?.customerUid ? customerProfiles?.[selectedRequest.payload.customerUid] : null}
        />
      </div>
    </div>
  );
}