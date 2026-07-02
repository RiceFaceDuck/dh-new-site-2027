import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimService } from '../../../../firebase/claimService';
import { userService } from '../../../../firebase/userService';
import { auth } from '../../../../firebase/config';
import { Wrench, ArrowLeftRight, RefreshCw, Ban, Check, X, Loader2 } from 'lucide-react';

const REASON_OPTIONS = [
    "(E) สินค้า ไม่ตรงปก / ผิดสเป็ค / การผลิตผิดพลาด",
    "(S1) Screen : จอกระพริบ /ภาพสั่น",
    "(S2) Screen : เปิดไม่ติด / ไม่มีสัญญาณภาพ / ไม่มีแสงอะไรเลย",
    "(S3) Screen : มีตำหนิ / เป็นดอท / เป็นด่าง / แสงลอด",
    "(S4) Screen : สี, ภาพ ผิดเพี้ยน / แสงมืด *ไฮโวน มีปัญหา*",
    "(S5) Screen : จอเป็นเส้น",
    "(S6) Screen : รอยแตก / รอยร้าว / โครงสร้างชำรุด",
    "(A1) AD : ไฟไม่เข้า",
    "(A2) AD : ไฟไม่เสถียร / ไฟกระชาก",
    "(K1) KB : เสียบไม่ติด / ใช้งานไม่ได้",
    "(K2) KB : ปุ่มค้าง / อักษรไม่ตรงกับการพิมพ์",
    "(K3) KB : มีปุ่มกดไม่ติด",
    "(K4) KB : ปุ่มหลุด / ชำรุด",
    "สาเหตุอื่นๆ"
];

export default function ClaimActionForm({ item, selectedOrder, onCancel }) {
    const navigate = useNavigate();
    const pastActions = selectedOrder.refundsAndClaims?.filter(rc => rc.sku === item.sku) || [];
    const usedQty = pastActions.reduce((sum, action) => sum + (Number(action.qty) || 1), 0);
    const maxQty = Math.max(1, (item.qty || item.quantity || 1) - usedQty);
    
    const [step, setStep] = useState('action'); // 'action' | 'qty' | 'reason'
    const [selectedAction, setSelectedAction] = useState(null);
    const [qty, setQty] = useState(1);
    const [reasonCode, setReasonCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleActionClick = (actionStr) => {
        if (actionStr !== 'เคลม') return; // For now only Claim is implemented
        setSelectedAction(actionStr);
        if (maxQty > 1) {
            setStep('qty');
        } else {
            setStep('reason');
        }
    };

    const handleQtyConfirm = () => {
        setStep('reason');
    };

    const handleReasonChange = async (e) => {
        const val = e.target.value;
        setReasonCode(val);
        if (val) {
            submitClaim(val);
        }
    };

    const submitClaim = async (selectedReason) => {
        setIsSubmitting(true);
        try {
            const userUid = auth.currentUser.uid;
            let userName = auth.currentUser.email;
            try {
                const profile = await userService.getUserProfile(userUid);
                if (profile) {
                    userName = `${profile.firstName || ''} ${profile.nickname ? `(${profile.nickname})` : ''}`.trim() || userName;
                }
            } catch (err) {
                console.warn("Could not fetch user profile", err);
            }

            const transactionId = `CLM-${Date.now().toString().slice(-6)}`;
            
            const claimForm = {
                transactionId,
                warrantyDate: selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toISOString() : null,
                reasonCode: selectedReason,
                details: "", // Omitted to keep UI minimal
                qty: qty,
                currentStatus: 'pending_manager',
                actionType: 'เคลม/ซ่อม',
                inspectorName: null,
                images: []
            };

            await claimService.requestClaim(selectedOrder, item, claimForm, userUid, userName);
            navigate('/claims');
        } catch (error) {
            console.error("Error creating claim:", error);
            alert("เกิดข้อผิดพลาดในการสร้างคำร้อง: " + error.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center gap-2 py-1.5 px-3 bg-orange-50/80 border-t border-dashed border-orange-500/30 animate-in fade-in slide-in-from-top-1 duration-200 w-full h-full min-h-[38px]">
            {isSubmitting ? (
                <div className="flex items-center gap-2 text-[11px] font-bold text-orange-600 w-full justify-center">
                    <Loader2 size={12} className="animate-spin" /> กำลังส่งข้อมูล...
                </div>
            ) : step === 'action' ? (
                <div className="flex items-center gap-2 w-full justify-end">
                    <span className="text-[10px] font-bold text-[var(--dh-text-muted)] mr-2">ทำรายการ:</span>
                    <button onClick={() => handleActionClick('เคลม')} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded transition-colors shadow-sm">
                        <Wrench size={12}/> เคลม
                    </button>
                    <button disabled className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-purple-600 bg-purple-500/10 opacity-50 cursor-not-allowed border border-purple-500/20 rounded transition-colors shadow-sm">
                        <ArrowLeftRight size={12}/> คืน
                    </button>
                    <button disabled className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-600 bg-blue-500/10 opacity-50 cursor-not-allowed border border-blue-500/20 rounded transition-colors shadow-sm">
                        <RefreshCw size={12}/> เปลี่ยน
                    </button>
                    <button disabled className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-rose-600 bg-rose-500/10 opacity-50 cursor-not-allowed border border-rose-500/20 rounded transition-colors shadow-sm">
                        <Ban size={12}/> ยกเลิก
                    </button>
                    <button onClick={onCancel} className="ml-2 text-[var(--dh-text-muted)] hover:text-red-500 p-1"><X size={14}/></button>
                </div>
            ) : step === 'qty' ? (
                <div className="flex items-center gap-2 w-full justify-end">
                    <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1"><Wrench size={10}/> เคลม:</span>
                    <span className="text-[10px] font-bold text-[var(--dh-text-muted)]">ระบุจำนวน (สูงสุด {maxQty})</span>
                    <input 
                        type="number" min="1" max={maxQty} value={qty} 
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-16 h-6 px-1.5 text-[11px] font-bold bg-white border border-[var(--dh-border)] rounded focus:border-orange-500 outline-none"
                    />
                    <button onClick={() => { setQty(maxQty); handleQtyConfirm(); }} className="px-2 h-6 text-[10px] font-bold text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 rounded border border-orange-500/20 transition-colors">
                        ทั้งหมด
                    </button>
                    <button onClick={handleQtyConfirm} className="px-2 h-6 text-[10px] font-bold text-white bg-orange-500 hover:bg-orange-600 rounded shadow-sm flex items-center gap-1 transition-colors">
                        ต่อไป <Check size={10}/>
                    </button>
                    <button onClick={onCancel} className="ml-2 text-[var(--dh-text-muted)] hover:text-red-500 p-1"><X size={14}/></button>
                </div>
            ) : step === 'reason' ? (
                <div className="flex items-center gap-2 w-full justify-end">
                    <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1"><Wrench size={10}/> {qty} ชิ้น:</span>
                    <span className="text-[10px] font-bold text-[var(--dh-text-muted)]">สาเหตุ/อาการ</span>
                    <select 
                        value={reasonCode}
                        onChange={handleReasonChange}
                        className="w-48 sm:w-64 h-6 px-1.5 text-[10px] font-bold bg-white border border-[var(--dh-border)] rounded focus:border-orange-500 outline-none text-[var(--dh-text-main)]"
                    >
                        <option value="" disabled>-- เลือกสาเหตุ --</option>
                        {REASON_OPTIONS.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                    <button onClick={onCancel} className="ml-2 text-[var(--dh-text-muted)] hover:text-red-500 p-1"><X size={14}/></button>
                </div>
            ) : null}
        </div>
    );
}
