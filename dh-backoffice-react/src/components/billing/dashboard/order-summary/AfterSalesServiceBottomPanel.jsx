import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Wrench, 
    RefreshCw, 
    ArrowLeftRight, 
    ExternalLink, 
    ChevronDown, 
    ChevronUp, 
    Clock, 
    ShieldAlert, 
    CheckCircle2,
    Calendar,
    Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * แปลงสถานะเคลมเป็นภาษาไทยและสีสไตล์ DH Design System
 */
const getStatusBadge = (status) => {
    switch (status) {
        case 'pending_manager':
            return { label: 'รอรับเรื่อง', bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400' };
        case 'waiting_item':
            return { label: 'รอรับของ', bg: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400' };
        case 'processing':
            return { label: 'กำลังตรวจสอบ', bg: 'bg-orange-500/10 text-orange-600 border-orange-500/30 dark:bg-orange-500/20 dark:text-orange-400' };
        case 'approved':
            return { label: 'อนุมัติแล้ว', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400' };
        case 'completed':
            return { label: 'เสร็จสิ้น', bg: 'bg-teal-500/10 text-teal-600 border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-400' };
        case 'rejected':
            return { label: 'ไม่อนุมัติ', bg: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400' };
        case 'cancelled':
            return { label: 'ยกเลิก', bg: 'bg-slate-500/10 text-slate-600 border-slate-500/30 dark:bg-slate-500/20 dark:text-slate-400' };
        default:
            return { label: status || 'รอดำเนินการ', bg: 'bg-slate-500/10 text-slate-600 border-slate-500/30' };
    }
};

/**
 * แผงบริการหลังการขายแถวด้านล่างของรายการสินค้า (ย่อ-ขยายได้ และแยกแถวตามแต่ละเคส)
 */
export default function AfterSalesServiceBottomPanel({ orderId, claims = [] }) {
    const navigate = useNavigate();
    const [isPanelExpanded, setIsPanelExpanded] = useState(true);
    const [expandedRowId, setExpandedRowId] = useState(null);

    if (!claims || claims.length === 0) return null;

    const toggleRow = (id) => {
        setExpandedRowId(prev => prev === id ? null : id);
    };

    const handleOpenClaimsPage = (e) => {
        e.stopPropagation();
        if (orderId) {
            navigate(`/claims?search=${encodeURIComponent(orderId)}`);
        } else {
            navigate('/claims');
        }
    };

    return (
        <div className="border-t-2 border-dashed border-sky-300 dark:border-sky-800 bg-linear-to-r from-sky-50/90 via-blue-50/60 to-indigo-50/90 dark:from-slate-900 dark:via-sky-950/40 dark:to-slate-900 shrink-0 transition-colors">
            {/* 🔷 Master Header Bar */}
            <div 
                onClick={() => setIsPanelExpanded(prev => !prev)}
                className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-sky-100/50 dark:hover:bg-sky-900/30 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {/* Animated Radar Pulse */}
                    <span className="flex h-2.5 w-2.5 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                    </span>
                    <h4 className="font-black text-xs text-sky-900 dark:text-sky-200 tracking-tight flex items-center gap-1.5">
                        บริการหลังการขาย
                        <span className="bg-white/90 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700 shadow-2xs">
                            {claims.length} รายการ
                        </span>
                    </h4>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleOpenClaimsPage}
                        className="text-[10px] font-black text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-white bg-white/90 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 px-2 py-1 rounded-xs border border-sky-300 dark:border-sky-700 shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                        title="เปิดดูรายการเคลม/คืนของบิลนี้ในหน้าหลัก"
                    >
                        <span>ดูในหน้าเคลม/คืน</span>
                        <ExternalLink size={11} strokeWidth={2.5} />
                    </button>

                    <button 
                        type="button"
                        aria-label="ย่อหรือขยายแถบ"
                        className="w-5 h-5 flex items-center justify-center text-sky-700 dark:text-sky-300 hover:bg-sky-200/50 dark:hover:bg-slate-800 rounded-xs transition-colors"
                    >
                        {isPanelExpanded ? <ChevronUp size={14} strokeWidth={2.5} /> : <ChevronDown size={14} strokeWidth={2.5} />}
                    </button>
                </div>
            </div>

            {/* 🔽 Expandable Items List */}
            <AnimatePresence>
                {isPanelExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-2.5 pt-0.5 space-y-1.5">
                            {claims.map((claim, idx) => {
                                const claimCode = String(claim.payload?.exchangeId || claim.payload?.returnId || claim.payload?.claimId || claim.id || `REQ-${idx + 1}`).toUpperCase();
                                const isSwap = claim.type === 'EXCHANGE_APPROVAL' || !!claim.payload?.isSwapSku || claimCode.startsWith('EXC-');
                                const isReturn = claim.type === 'RETURN_APPROVAL' || claimCode.startsWith('RTN-');
                                const typeLabel = isSwap ? 'เปลี่ยน' : isReturn ? 'คืน' : 'เคลม';
                                
                                const targetSku = claim.payload?.sku || '-';
                                const targetQty = claim.payload?.qty || claim.payload?.quantity || 1;
                                const statusInfo = getStatusBadge(claim.status);
                                const isRowExpanded = expandedRowId === claim.id;

                                // วันที่
                                let formattedDate = '-';
                                const dateSrc = claim.createdAt || claim.updatedAt;
                                if (dateSrc) {
                                    if (typeof dateSrc.toDate === 'function') {
                                        formattedDate = dateSrc.toDate().toLocaleDateString('th-TH');
                                    } else if (dateSrc.seconds) {
                                        formattedDate = new Date(dateSrc.seconds * 1000).toLocaleDateString('th-TH');
                                    } else {
                                        const d = new Date(dateSrc);
                                        if (!isNaN(d.getTime())) formattedDate = d.toLocaleDateString('th-TH');
                                    }
                                }

                                return (
                                    <div 
                                        key={claim.id || idx}
                                        className="bg-white/95 dark:bg-slate-900/90 rounded-xs border border-sky-200 dark:border-sky-800 shadow-2xs overflow-hidden transition-all duration-150"
                                    >
                                        {/* แถวสรุป 1 เคส */}
                                        <div 
                                            onClick={() => toggleRow(claim.id)}
                                            className="px-2.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-sky-50/60 dark:hover:bg-slate-800/80 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                {/* Type Icon & Tag - Calm UI นิ่งๆ ไม่หมุน */}
                                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-black border ${
                                                    isSwap ? 'bg-sky-500/10 text-sky-600 border-sky-500/20' :
                                                    isReturn ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                                                    'bg-orange-500/10 text-orange-600 border-orange-500/20'
                                                }`}>
                                                    {isSwap ? <RefreshCw size={11} className="text-sky-600" /> :
                                                     isReturn ? <ArrowLeftRight size={11} /> :
                                                     <Wrench size={11} />}
                                                    <span>{typeLabel}</span>
                                                </div>

                                                {/* Document ID */}
                                                <span className="font-mono font-black text-[11px] text-slate-800 dark:text-slate-200">
                                                    {claimCode}
                                                </span>

                                                {/* SKU & Quantity */}
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                    <Package size={10} />
                                                    <span className="font-mono text-slate-700 dark:text-slate-300">{targetSku}</span>
                                                    <span>(x{targetQty})</span>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Status Pill */}
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusInfo.bg}`}>
                                                    {statusInfo.label}
                                                </span>

                                                <span className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                                    {isRowExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                </span>
                                            </div>
                                        </div>

                                        {/* แถวกางดูรายละเอียดเพิ่มเติม (เมื่อกดขยาย) */}
                                        {isRowExpanded && (
                                            <div className="px-3 py-2 bg-slate-50/80 dark:bg-slate-950/60 border-t border-sky-100 dark:border-sky-900/60 text-[11px] space-y-1 text-slate-600 dark:text-slate-300 animate-in fade-in duration-150">
                                                {claim.payload?.reasonCode && (
                                                    <div className="flex items-start gap-1.5">
                                                        <span className="font-bold text-slate-400 shrink-0">อาการ/สาเหตุ:</span>
                                                        <span className="font-medium text-slate-800 dark:text-slate-200">{claim.payload.reasonCode}</span>
                                                    </div>
                                                )}

                                                {isSwap && claim.payload?.swapSku && (
                                                    <div className="flex items-start gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                                                        <span className="shrink-0">เปลี่ยนเป็นรุ่น:</span>
                                                        <span>{claim.payload.swapProductName || claim.payload.swapSku} (SKU: {claim.payload.swapSku})</span>
                                                        {claim.payload.newWarrantyDays && (
                                                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.2 rounded-xs ml-1">
                                                                ประกัน {claim.payload.newWarrantyDays} วัน
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={10} /> ยื่นเรื่องเมื่อ: {formattedDate}
                                                    </span>
                                                    {claim.creatorName && (
                                                        <span>ผู้ทำรายการ: {claim.creatorName}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
