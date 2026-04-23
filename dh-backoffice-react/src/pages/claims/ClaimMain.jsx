import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { 
  ShieldAlert, Search, Clock, CheckCircle, XCircle, 
  Package, ArrowLeftRight, Wrench, FileText, Receipt, 
  Printer, Ban, Eye, AlertTriangle, User, X, Calendar, Image as ImageIcon, Copy, Check, RefreshCw,
  Flame, Zap, Timer // ✨ นำเข้าไอคอนใหม่สำหรับระบบ SLA Gimmick
} from 'lucide-react';
import { claimService } from '../../firebase/claimService';
import { userService } from '../../firebase/userService';

// ==========================================
// 🖨️ Component: Print Form (คงเดิม 100%)
// ==========================================
const ClaimPrintView = ({ req }) => {
  if (!req || !req.payload) return null;
  const { payload } = req;
  const isClaim = req.originalType === 'CLAIM_APPROVAL' || req.type === 'CLAIM_APPROVAL';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(payload.claimId || payload.returnId)}`;

  return (
    <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[99999] w-[148mm] mx-auto text-black font-sans bg-white px-2 py-4">
      <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
        <div className="flex items-center gap-3">
          <img src="/DH Notebook Logo ดีเอช โน๊ตบุ๊ค_โลโก้.png" alt="DH Logo" className="h-12 w-auto object-contain" />
          <div>
            <h1 className="text-[16px] font-black text-gray-900 leading-tight">DH NOTE BOOK CO.,LTD</h1>
            <p className="text-[11px] text-gray-600 font-medium">เอกสารแจ้ง{isClaim ? 'เคลม/ซ่อมสินค้า' : 'คืนสินค้า/คืนเงิน'}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-[18px] font-black uppercase tracking-widest text-gray-900">{isClaim ? 'CLAIM FORM' : 'RETURN FORM'}</h2>
          <p className="text-[12px] font-bold text-gray-800 mt-1">{payload.claimId || payload.returnId}</p>
        </div>
      </div>

      <div className="flex justify-between text-[12px] mb-6">
        <div className="w-1/2 pr-4 space-y-1.5">
          <p><span className="text-gray-500">ลูกค้า:</span> <strong className="text-gray-900">{payload.customerName}</strong></p>
          <p><span className="text-gray-500">บิลอ้างอิง:</span> <strong className="text-gray-900">{payload.orderId}</strong></p>
          <p><span className="text-gray-500">วันที่แจ้ง:</span> <strong className="text-gray-900">{req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString('th-TH') : '-'}</strong></p>
          <p><span className="text-gray-500">วันที่ซื้อ(ประกัน):</span> <strong className="text-gray-900">{payload.purchaseDate ? new Date(payload.purchaseDate).toLocaleDateString('th-TH') : '-'}</strong></p>
        </div>
        <div className="w-1/2 pl-4 border-l border-gray-300 space-y-1.5">
          <p><span className="text-gray-500">ผู้รับเรื่อง:</span> <strong className="text-gray-900">{payload.requestedByName}</strong></p>
          <p><span className="text-gray-500">ผู้ตรวจสอบ:</span> <strong className="text-gray-900">{payload.inspectorName || '-'}</strong></p>
          <p><span className="text-gray-500">สถานะ:</span> <strong className="text-gray-900">{payload.status || req.status}</strong></p>
          {payload.trackingNo && <p><span className="text-gray-500">Tracking:</span> <strong className="text-gray-900">{payload.trackingNo}</strong></p>}
        </div>
      </div>

      <table className="w-full text-[12px] mb-6 border-collapse">
        <thead>
          <tr className="border-y border-black text-left font-bold text-gray-900">
            <th className="py-2.5 w-3/5">รหัสและชื่อสินค้า (Product)</th>
            <th className="py-2.5 text-center w-1/5">จำนวน (Qty)</th>
            <th className="py-2.5 text-right w-1/5">{isClaim ? '' : 'มูลค่า (Value)'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          <tr>
            <td className="py-3">
              <p className="font-bold text-gray-900">{payload.productName}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{payload.sku}</p>
            </td>
            <td className="py-3 text-center font-bold text-gray-900">{payload.qty || 1}</td>
            <td className="py-3 text-right font-bold text-gray-900">{isClaim ? '-' : `฿${((payload.purchasePrice || 0) * (payload.qty || 1)).toLocaleString()}`}</td>
          </tr>
        </tbody>
      </table>

      <div className="p-3 bg-gray-50 border border-gray-300 rounded text-[11px] min-h-[100px]">
        <p className="font-bold text-gray-900 mb-1 border-b border-gray-200 pb-1">รายละเอียดอาการเสีย / การกระทำ:</p>
        <p className="text-gray-800 font-bold mb-1">การกระทำ: {payload.actionType}</p>
        <p className="text-gray-800 font-bold mb-1">อาการ: {isClaim ? payload.symptomCode : payload.returnReason}</p>
        <p className="text-gray-700 whitespace-pre-wrap">{isClaim ? payload.symptomDetails : payload.returnDetails}</p>
      </div>

      <div className="mt-12 flex justify-between items-end">
        <img src={qrCodeUrl} alt="QR" className="w-[60px] h-[60px]" crossOrigin="anonymous" />
        <div className="text-center w-40 text-[11px] text-gray-800">
          <p className="border-b border-black mb-1.5"></p>
          <p className="font-bold truncate mt-1">{req.status === 'approved' ? (req.handledBy || 'ผู้จัดการ') : 'ผู้จัดการสาขา'}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">ผู้อนุมัติรายการ</p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 📊 Component: Claim Dashboard Main
// ==========================================
export default function ClaimMain() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedText, setCopiedText] = useState(null);

  const handleQuickCopy = (e, text) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  useEffect(() => {
    const q = query(
      collection(db, 'todos'),
      where('type', 'in', ['CLAIM_APPROVAL', 'RETURN_APPROVAL', 'CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL']),
      limit(300)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch = 
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.payload?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.payload?.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.payload?.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const isCancelRequest = r.type.startsWith('CANCEL_');
      const matchesTab = 
        activeTab === 'all' ? true :
        activeTab === 'pending' ? (r.status === 'pending_manager' && !isCancelRequest) :
        activeTab === 'approved' ? r.status === 'approved' :
        activeTab === 'rejected' ? r.status === 'rejected' : 
        activeTab === 'cancelled' ? (r.status === 'cancelled' || isCancelRequest) : true;

      let matchesDate = true;
      if (startDate || endDate) {
        const reqDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date();
        reqDate.setHours(0, 0, 0, 0); 

        if (startDate) {
          const sDate = new Date(startDate);
          sDate.setHours(0, 0, 0, 0);
          if (reqDate < sDate) matchesDate = false;
        }
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(23, 59, 59, 999);
          if (reqDate > eDate) matchesDate = false;
        }
      }

      return matchesSearch && matchesTab && matchesDate;
    });
  }, [requests, searchTerm, activeTab, startDate, endDate]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending_manager' && !r.type.startsWith('CANCEL_')).length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    cancelled: requests.filter(r => r.status === 'cancelled' || r.type.startsWith('CANCEL_')).length,
  }), [requests]);

  const handleRequestCancel = async (task) => {
    const reason = window.prompt('กรุณาระบุเหตุผลที่ต้องการขอยกเลิกรายการนี้:');
    if (!reason) return;
    
    setIsProcessing(true);
    try {
      const profile = await userService.getUserProfile(auth.currentUser.uid);
      const userName = profile ? `${profile.firstName} (${profile.nickname})` : auth.currentUser.email;

      await claimService.requestCancelTodo(task, reason, auth.currentUser.uid, userName);
      alert('ส่งคำร้องขอยกเลิกไปยังผู้จัดการสำเร็จ\n\nสถานะจะเปลี่ยนเป็น "ยกเลิกสมบูรณ์" เมื่อผู้จัดการอนุมัติ (ระบบจะดึงสต๊อกกลับคืนให้อัตโนมัติ)');
      setSelectedRequest(null);
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => window.print();

  // ✨ อัปเกรดลูกเล่นที่ 1: ระบบคำนวณหลอดประกัน (Warranty Progress)
  const getWarrantyInfo = (purchaseDateStr, createdAt) => {
    if (!purchaseDateStr) return null;
    const pDate = new Date(purchaseDateStr);
    if (isNaN(pDate)) return null;
    
    const cDate = createdAt?.toDate ? new Date(createdAt.toDate()) : new Date();
    const diffTime = cDate - pDate;
    const usedDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const warrantyPeriod = 365; // สันนิษฐานประกัน 1 ปี (ปรับเปลี่ยนได้)
    const remainingDays = warrantyPeriod - usedDays;
    const percentUsed = Math.min((usedDays / warrantyPeriod) * 100, 100);

    let color = 'bg-dh-accent'; let textColor = 'text-dh-accent'; let label = `เหลือ ${remainingDays} วัน`;

    if (remainingDays <= 0) {
      color = 'bg-rose-500'; textColor = 'text-rose-500'; label = 'หมดประกัน';
    } else if (remainingDays <= 30) {
      color = 'bg-rose-400'; textColor = 'text-rose-500'; label = `ใกล้หมด (${remainingDays} วัน)`;
    } else if (usedDays <= 30) {
      color = 'bg-emerald-400'; textColor = 'text-emerald-500'; label = `ใหม่มาก (${usedDays} วัน)`;
    } else {
      color = 'bg-amber-400'; textColor = 'text-amber-500';
    }

    return { percentUsed, label, color, textColor };
  };

  // ✨ อัปเกรดลูกเล่นที่ 2: ระบบตรวจจับความล่าช้า (SLA Tracker Gimmick)
  const getSLAIndicator = (createdAt, status) => {
    if (status !== 'pending_manager') return null;
    const cDate = createdAt?.toDate ? new Date(createdAt.toDate()) : new Date();
    const hoursDiff = (new Date() - cDate) / (1000 * 60 * 60);

    if (hoursDiff > 48) return <div className="flex items-center gap-1 mt-1.5 text-[9px] font-black text-rose-500 animate-pulse bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/50"><Flame className="w-3 h-3"/> ล่าช้า!</div>;
    if (hoursDiff > 24) return <div className="flex items-center gap-1 mt-1.5 text-[9px] font-black text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800/50"><Zap className="w-3 h-3"/> เร่งด่วน</div>;
    return <div className="flex items-center gap-1 mt-1.5 text-[9px] font-black text-dh-muted bg-dh-base px-1.5 py-0.5 rounded"><Timer className="w-3 h-3"/> ปกติ</div>;
  };

  const getStatusDisplay = (req) => {
    if (req.type.startsWith('CANCEL_') && req.status === 'pending_manager') {
      return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-red-100/80 text-red-700 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400 whitespace-nowrap"><Clock className="w-3.5 h-3.5" /> รออนุมัติยกเลิก</span>;
    }
    switch(req.status) {
      case 'pending_manager': return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-amber-100/80 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400 whitespace-nowrap"><Clock className="w-3.5 h-3.5" /> รอตรวจสอบ</span>;
      case 'approved': return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 whitespace-nowrap"><CheckCircle className="w-3.5 h-3.5" /> อนุมัติแล้ว</span>;
      case 'rejected': return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-rose-100/80 text-rose-800 border border-rose-300 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400 whitespace-nowrap"><XCircle className="w-3.5 h-3.5" /> ไม่อนุมัติ</span>;
      case 'cancelled': return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-dh-base text-dh-muted border border-dh-border whitespace-nowrap"><Ban className="w-3.5 h-3.5" /> ยกเลิกรายการ</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-dh-base text-dh-muted border border-dh-border whitespace-nowrap">{req.status}</span>;
    }
  };

  return (
    <div className="animate-in fade-in duration-300 pb-10 bg-dh-base min-h-full">
      
      {/* --- Header --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-black text-dh-main flex items-center gap-2 tracking-tight">
            <ShieldAlert className="w-6 h-6 text-dh-accent" /> Refund & Claim Dashboard
          </h2>
          <p className="text-[12px] text-dh-muted font-medium mt-1 ml-8 flex items-center gap-2">
            ติดตามสถานะการแจ้งเคลม และ คืนสินค้า
            <span className="bg-dh-surface border border-dh-border px-1.5 py-0.5 rounded text-[9px] uppercase font-black text-dh-main shadow-sm">View Only</span>
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          {/* Calendar */}
          <div className="bg-dh-surface h-9 px-3 rounded-lg border border-dh-border flex items-center gap-2 focus-within:border-dh-accent transition-colors shrink-0">
            <Calendar className="w-4 h-4 text-dh-muted" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent outline-none text-[12px] font-bold text-dh-main dark:[color-scheme:dark]" />
            <span className="text-dh-muted text-[10px]">-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent outline-none text-[12px] font-bold text-dh-main dark:[color-scheme:dark]" />
            {(startDate || endDate) && <button onClick={() => {setStartDate(''); setEndDate('')}} className="ml-1 text-dh-muted hover:text-red-500"><X className="w-3.5 h-3.5"/></button>}
          </div>

          {/* Search */}
          <div className="bg-dh-surface h-9 px-3 rounded-lg border border-dh-border flex items-center gap-2 focus-within:border-dh-accent transition-colors w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-dh-muted" />
            <input 
              type="text" placeholder="ค้นหาบิล, SKU, ลูกค้า..." 
              className="bg-transparent outline-none text-[12px] font-bold text-dh-main w-full placeholder:text-dh-muted/50"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="text-dh-muted hover:text-red-500"><X className="w-3.5 h-3.5"/></button>}
          </div>
        </div>
      </div>

      {/* --- Stats Cards (Minimal & Compact) --- */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: 'all', label: 'ทั้งหมด', count: stats.total, color: 'text-dh-main', bg: 'bg-dh-surface hover:bg-dh-base' },
          { id: 'pending', label: 'รอตรวจ', count: stats.pending, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50 hover:bg-amber-100/50 border-amber-200/50 dark:bg-amber-900/10 dark:border-amber-700/30' },
          { id: 'approved', label: 'อนุมัติแล้ว', count: stats.approved, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 hover:bg-emerald-100/50 border-emerald-200/50 dark:bg-emerald-900/10 dark:border-emerald-700/30' },
          { id: 'rejected', label: 'ไม่อนุมัติ', count: stats.rejected, icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50 hover:bg-rose-100/50 border-rose-200/50 dark:bg-rose-900/10 dark:border-rose-700/30' },
          { id: 'cancelled', label: 'ยกเลิก', count: stats.cancelled, icon: Ban, color: 'text-dh-muted', bg: 'bg-dh-surface hover:bg-dh-base' },
        ].map(tab => (
          <div 
            key={tab.id} onClick={() => setActiveTab(tab.id)} 
            className={`flex-1 min-w-[120px] p-2.5 rounded-xl border cursor-pointer transition-all active:scale-95 flex items-center justify-between ${activeTab === tab.id ? 'border-dh-accent shadow-sm ring-1 ring-dh-accent/10' : `border-dh-border ${tab.bg}`}`}
          >
            <div className="flex items-center gap-1.5">
              {tab.icon && <tab.icon className={`w-3.5 h-3.5 ${tab.color}`} />}
              <span className="text-[11px] font-black uppercase text-dh-muted">{tab.label}</span>
            </div>
            <span className={`text-[15px] font-black ${activeTab === tab.id ? 'text-dh-main' : tab.color}`}>{tab.count}</span>
          </div>
        ))}
      </div>

      {/* --- Data Table --- */}
      <div className="bg-dh-surface rounded-xl shadow-sm border border-dh-border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-dh-accent"/></div>
        ) : (
          <div className="overflow-x-auto min-h-[50vh] max-h-[65vh] custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              
              <thead className="bg-dh-base/90 sticky top-0 z-10 backdrop-blur-sm border-b border-dh-border">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider font-mono">วันที่/เวลา ยื่นธุรกรรม</th>
                  <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider">Ref / Type</th>
                  <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider">Customer / Order</th>
                  
                  {/* ✨ คอลัมน์ใหม่: วันที่สั่งซื้อ */}
                  <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider">วันที่สั่งซื้อสินค้านี้</th>
                  
                  {/* ✨ คอลัมน์ใหม่: ประกัน */}
                  <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider w-32">Warranty</th>
                  
                  {/* ✨ อัปเกรด: ขยายความกว้าง Product & Reason เป็น 35% และตั้ง min-width */}
                  <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider w-[35%] min-w-[350px]">Product & Reason</th>
                  
                  <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 w-full"></th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-dh-border">
                {filteredRequests.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-16 text-dh-muted text-[13px] font-medium"><FileText className="w-8 h-8 opacity-20 mx-auto mb-2"/>ไม่พบข้อมูล</td></tr>
                ) : (
                  filteredRequests.map(req => {
                    const isClaim = req.originalType === 'CLAIM_APPROVAL' || req.type === 'CLAIM_APPROVAL';
                    const payload = req.payload || {};
                    const dateObj = req.createdAt?.toDate ? new Date(req.createdAt.toDate()) : null;
                    const indicatorColor = isClaim ? 'bg-[#FF9B51]' : 'bg-[#A78BFA]';
                    
                    // เรียกใช้ระบบคำนวณประกัน
                    const warranty = getWarrantyInfo(payload.purchaseDate, req.createdAt);

                    return (
                      <tr 
                        key={req.id} 
                        onClick={() => setSelectedRequest(req)} 
                        className="group hover:bg-dh-base/60 transition-colors cursor-pointer relative"
                      >
                        {/* 1. Date */}
                        <td className="px-4 py-3 align-middle relative">
                          <div className={`absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity ${indicatorColor}`}></div>
                          {dateObj ? (
                            <div className="flex flex-col">
                              <span className="text-[12px] font-bold text-dh-main">{dateObj.toLocaleDateString('th-TH')}</span>
                              <span className="text-[10px] text-dh-muted">{dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ) : '-'}
                        </td>

                        {/* 2. Type & Ref */}
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${isClaim ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'}`}>
                              {isClaim ? <Wrench className="w-2.5 h-2.5"/> : <ArrowLeftRight className="w-2.5 h-2.5"/>}
                              {payload.actionType || (isClaim ? 'เคลม/ซ่อม' : 'คืนสินค้า')}
                            </span>
                            <div className="group/copy flex items-center gap-1 font-mono text-[11px] font-bold text-dh-muted">
                              {payload.claimId || payload.returnId}
                              <button onClick={(e) => handleQuickCopy(e, payload.claimId || payload.returnId)} className="opacity-0 group-hover/copy:opacity-100 hover:text-dh-accent transition-all p-0.5 rounded bg-dh-base">
                                {copiedText === (payload.claimId || payload.returnId) ? <Check className="w-3 h-3 text-emerald-500"/> : <Copy className="w-3 h-3"/>}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* 3. Customer */}
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-bold text-dh-main truncate max-w-[150px]">{payload.customerName || 'ทั่วไป'}</span>
                            <div className="group/copy flex items-center gap-1 text-[11px] text-dh-muted">
                              <Receipt className="w-3 h-3" /> 
                              <span className="font-mono group-hover/copy:text-dh-accent transition-colors">{payload.orderId}</span>
                              <button onClick={(e) => handleQuickCopy(e, payload.orderId)} className="opacity-0 group-hover/copy:opacity-100 hover:text-dh-accent transition-all p-0.5 rounded bg-dh-base">
                                {copiedText === payload.orderId ? <Check className="w-3 h-3 text-emerald-500"/> : <Copy className="w-3 h-3"/>}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* ✨ คอลัมน์ใหม่: วันที่สั่งซื้อ */}
                        <td className="px-4 py-3 align-middle">
                          {payload.purchaseDate ? (
                            <span className="text-[12px] font-bold text-dh-main">
                              {new Date(payload.purchaseDate).toLocaleDateString('th-TH')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-dh-muted italic bg-dh-base px-2 py-0.5 rounded">ไม่ระบุ</span>
                          )}
                        </td>

                        {/* ✨ 4. Warranty (คอลัมน์ใหม่ โชว์หลอด Progress) */}
                        <td className="px-4 py-3 align-middle">
                          {warranty ? (
                            <div className="flex flex-col gap-1 w-28" title={`อ้างอิงจากวันที่ซื้อ: ${new Date(payload.purchaseDate).toLocaleDateString('th-TH')}`}>
                              <div className="flex justify-between items-end">
                                <span className={`text-[9px] font-black ${warranty.textColor}`}>{warranty.label}</span>
                              </div>
                              <div className="w-full bg-dh-base rounded-full h-1.5 overflow-hidden border border-dh-border">
                                <div className={`h-full ${warranty.color} transition-all duration-500`} style={{ width: `${warranty.percentUsed}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-dh-muted italic bg-dh-base px-2 py-0.5 rounded">ไม่ระบุวันที่</span>
                          )}
                        </td>

                        {/* ✨ 5. Product & Reason (ขยายความกว้างเต็มตา) */}
                        <td className="px-4 py-3 align-middle whitespace-normal w-[35%] min-w-[350px]">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-start gap-1.5">
                              <span className="text-[12px] font-black text-dh-main line-clamp-1 flex-1">{payload.sku}</span>
                              <span className="text-[10px] bg-dh-base border border-dh-border px-1 rounded font-bold shrink-0 mt-0.5">x{payload.qty || 1}</span>
                            </div>
                            <span className="text-[11px] text-dh-muted line-clamp-2 leading-snug" title={isClaim ? payload.symptomCode : payload.returnReason}>
                              {isClaim ? payload.symptomCode : payload.returnReason}
                            </span>
                          </div>
                        </td>

                        {/* ✨ 6. Status (เพิ่มระบบ SLA Tracker) */}
                        <td className="px-4 py-3 align-middle text-center">
                          <div className="flex flex-col items-center">
                            {getStatusDisplay(req)}
                            {getSLAIndicator(req.createdAt, req.status)}
                          </div>
                        </td>

                        {/* 7. Action */}
                        <td className="px-4 py-3 align-middle text-right">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-dh-muted group-hover:bg-dh-base group-hover:text-dh-accent transition-colors ml-auto border border-transparent group-hover:border-dh-border shadow-sm group-hover:shadow-none">
                            <Eye className="w-4 h-4" />
                          </div>
                        </td>

                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Detail Modal (Grid Card Design - สะอาด อ่านง่าย) --- */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-dh-base w-full max-w-4xl rounded-2xl shadow-dh-elevated overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className={`px-6 py-4 bg-dh-surface border-b border-dh-border flex justify-between items-center shrink-0`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(selectedRequest.originalType === 'CLAIM_APPROVAL' || selectedRequest.type === 'CLAIM_APPROVAL') ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'}`}>
                  {(selectedRequest.originalType === 'CLAIM_APPROVAL' || selectedRequest.type === 'CLAIM_APPROVAL') ? <Wrench className="w-4 h-4"/> : <ArrowLeftRight className="w-4 h-4"/>}
                </div>
                <div>
                  <h2 className="text-[15px] font-black text-dh-main tracking-wide">
                    รายละเอียด{(selectedRequest.originalType === 'CLAIM_APPROVAL' || selectedRequest.type === 'CLAIM_APPROVAL') ? 'การแจ้งเคลม/ซ่อม' : 'การคืนสินค้า'}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono font-bold text-dh-muted bg-dh-base px-1.5 py-0.5 rounded border border-dh-border">Ref: {selectedRequest.payload?.claimId || selectedRequest.payload?.returnId}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="p-2 bg-dh-surface hover:bg-dh-base border border-dh-border text-dh-main rounded-lg shadow-sm transition-colors active:scale-95"><Printer className="w-4 h-4" /></button>
                <button onClick={() => setSelectedRequest(null)} className="p-2 text-dh-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Modal Body (Grid 2 Columns) */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Customer & Status */}
                <div className="space-y-4">
                  <div className="bg-dh-surface p-4 rounded-xl border border-dh-border shadow-sm">
                    <h3 className="text-[10px] font-black text-dh-muted uppercase tracking-widest mb-3 border-b border-dh-border pb-2 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> ข้อมูลลูกค้าและบิล</h3>
                    <div className="space-y-2 text-[12px]">
                      <div className="flex justify-between"><span className="text-dh-muted">ชื่อลูกค้า:</span> <span className="font-black text-dh-main">{selectedRequest.payload.customerName}</span></div>
                      <div className="flex justify-between items-center group/copy">
                        <span className="text-dh-muted">บิลอ้างอิง:</span> 
                        <span className="font-mono font-bold text-dh-accent flex items-center gap-1 cursor-pointer" onClick={(e) => handleQuickCopy(e, selectedRequest.payload.orderId)}>
                          {selectedRequest.payload.orderId}
                          {copiedText === selectedRequest.payload.orderId ? <Check className="w-3.5 h-3.5 text-emerald-500"/> : <Copy className="w-3.5 h-3.5 opacity-0 group-hover/copy:opacity-100 transition-opacity"/>}
                        </span>
                      </div>
                      <div className="flex justify-between"><span className="text-dh-muted">วันที่ซื้อ:</span> <span className="font-bold text-dh-main">{selectedRequest.payload.purchaseDate ? new Date(selectedRequest.payload.purchaseDate).toLocaleDateString('th-TH') : '-'}</span></div>
                      <div className="flex justify-between"><span className="text-dh-muted">พนักงานแจ้ง:</span> <span className="font-bold text-dh-main">{selectedRequest.payload.requestedByName}</span></div>
                    </div>
                  </div>

                  <div className="bg-dh-surface p-4 rounded-xl border border-dh-border shadow-sm flex flex-col items-center justify-center min-h-[120px] text-center relative overflow-hidden">
                    <p className="text-[10px] font-black text-dh-muted uppercase tracking-widest mb-2">สถานะการตรวจสอบ</p>
                    {getStatusDisplay(selectedRequest)}
                    <span className="text-[10px] font-bold text-dh-main mt-3 bg-dh-base px-3 py-1 rounded-full border border-dh-border">{selectedRequest.payload.status || 'รอตรวจสอบ'}</span>
                    
                    {selectedRequest.status === 'rejected' && <p className="text-[11px] text-rose-600 mt-2 font-bold w-full text-center">เหตุผล: {selectedRequest.rejectReason}</p>}
                    {selectedRequest.type.startsWith('CANCEL_') && selectedRequest.rejectCancelReason && <p className="text-[11px] text-red-600 mt-2 font-bold w-full text-center">ปฏิเสธยกเลิก: {selectedRequest.rejectCancelReason}</p>}
                  </div>
                </div>

                {/* 2. Product & Reason */}
                <div className="bg-dh-surface p-4 rounded-xl border border-dh-border shadow-sm flex flex-col">
                  <h3 className="text-[10px] font-black text-dh-muted uppercase tracking-widest mb-3 border-b border-dh-border pb-2 flex items-center gap-1.5"><Package className="w-3.5 h-3.5"/> ข้อมูลสินค้าและสาเหตุ</h3>
                  
                  <div className="bg-dh-base p-3 rounded-lg border border-dh-border mb-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[9px] font-black text-dh-surface bg-dh-muted px-1.5 py-0.5 rounded uppercase">{selectedRequest.payload.actionType}</span>
                        <p className="font-black text-dh-main text-[13px] mt-1.5 leading-snug">{selectedRequest.payload.productName}</p>
                        <p className="font-mono text-[11px] text-dh-muted font-bold mt-0.5">{selectedRequest.payload.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-dh-muted block mb-0.5">จำนวน</span>
                        <span className="text-xl font-black text-dh-main">{selectedRequest.payload.qty || 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div>
                      <p className="text-[10px] font-bold text-dh-muted mb-1">{(selectedRequest.originalType === 'CLAIM_APPROVAL' || selectedRequest.type === 'CLAIM_APPROVAL') ? 'อาการเสียเบื้องต้น' : 'เหตุผลการคืน'}</p>
                      <p className="text-[12px] text-dh-main font-bold">{selectedRequest.payload.symptomCode || selectedRequest.payload.returnReason}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-dh-muted mb-1">รายละเอียดเพิ่มเติม</p>
                      <p className="text-[12px] text-dh-main whitespace-pre-wrap bg-dh-base/50 p-2 rounded-md border border-dh-border/50">{selectedRequest.payload.symptomDetails || selectedRequest.payload.returnDetails || '-'}</p>
                    </div>
                    {selectedRequest.payload.trackingNo && (
                      <div className="group/track w-fit">
                        <p className="text-[10px] font-bold text-dh-muted mb-1">Tracking Number</p>
                        <span className="font-mono text-[13px] font-black text-dh-accent bg-dh-accent-light px-2 py-1 rounded border border-dh-accent/20 cursor-copy flex items-center gap-1.5" onClick={(e) => handleQuickCopy(e, selectedRequest.payload.trackingNo)}>
                          {selectedRequest.payload.trackingNo}
                          {copiedText === selectedRequest.payload.trackingNo ? <Check className="w-3.5 h-3.5 text-emerald-500"/> : <Copy className="w-3.5 h-3.5 opacity-0 group-hover/track:opacity-100 transition-opacity"/>}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* 3. Images (ถ้ามี) */}
              {selectedRequest.payload.images && selectedRequest.payload.images.length > 0 && (
                <div className="mt-4 bg-dh-surface p-4 rounded-xl border border-dh-border shadow-sm">
                  <p className="text-[10px] font-black text-dh-muted uppercase tracking-widest flex items-center gap-1.5 mb-3"><ImageIcon className="w-3.5 h-3.5"/> ภาพประกอบ ({selectedRequest.payload.images.length})</p>
                  <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
                    {selectedRequest.payload.images.map((img, i) => (
                      <a key={i} href={img.replace('&sz=w1000', '')} target="_blank" rel="noopener noreferrer" className="shrink-0 group relative cursor-pointer block w-24 h-24 rounded-lg overflow-hidden border border-dh-border">
                         <img src={img} alt="Attached" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Eye className="text-white w-5 h-5"/>
                         </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-dh-surface border-t border-dh-border flex justify-between items-center shrink-0">
              {(!selectedRequest.type.startsWith('CANCEL_') && (selectedRequest.status === 'pending_manager' || selectedRequest.status === 'approved')) ? (
                <button disabled={isProcessing} onClick={() => handleRequestCancel(selectedRequest)} className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  <Ban className="w-3.5 h-3.5" /> ขอยกเลิก
                </button>
              ) : <div></div>}
              <button onClick={() => setSelectedRequest(null)} className="px-6 py-2 bg-dh-main hover:bg-dh-muted text-dh-surface font-black text-[12px] rounded-lg transition-colors shadow-sm active:scale-95">
                ปิด
              </button>
            </div>

          </div>
        </div>
      )}

      <ClaimPrintView req={selectedRequest} />

    </div>
  );
}