import { useEffect } from 'react';
import { X, Gift, Check, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PosFreebieModal({
    isOpen = true,
    onClose,
    setIsFreebieModalOpen,
    activeFreebies = [],
    eligibleFreebies = [],
    itemSubTotal = 0,
    activeTab,
    updateActiveTab
}) {
    const handleClose = () => {
        if (onClose) onClose();
        if (setIsFreebieModalOpen) setIsFreebieModalOpen(false);
    };

    // Handle ESC key to close modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const autoFreebieEnabled = activeTab?.autoFreebieEnabled !== false;
    const disabledFreebieIds = activeTab?.disabledFreebieIds || [];
    const manualFreebieIds = activeTab?.manualFreebieIds || [];

    const isFreebieActive = (freebieId) => {
        if (autoFreebieEnabled) {
            return !disabledFreebieIds.includes(freebieId);
        }
        return manualFreebieIds.includes(freebieId);
    };

    const evaluateFreebieEligibility = (freebie) => {
        const now = new Date();
        if (freebie.startDate && new Date(freebie.startDate) > now) {
            return { eligible: false, reason: 'ยังไม่เริ่มโปร' };
        }
        if (freebie.endDate && new Date(freebie.endDate) < now) {
            return { eligible: false, reason: 'หมดอายุแล้ว', hardBlock: true };
        }
        if (freebie.quotaLimit && freebie.quotaLimit > 0 && (freebie.quotaUsed || 0) >= freebie.quotaLimit) {
            return { eligible: false, reason: 'สิทธิ์เต็มแล้ว', hardBlock: true };
        }

        const cartItems = activeTab?.items || [];
        const hasSkus = Array.isArray(freebie.applicableSkus) && freebie.applicableSkus.length > 0;
        const hasTypes = Array.isArray(freebie.applicableTypes) && freebie.applicableTypes.length > 0;

        let targetSubtotal = itemSubTotal;
        let targetQty = cartItems.reduce((s, i) => s + Math.max(1, Number(i.qty) || 1), 0);
        if (hasSkus || hasTypes) {
            targetSubtotal = 0;
            targetQty = 0;
            cartItems.forEach((item) => {
                const sku = String(item.sku || '').toUpperCase();
                const type = String(item.type || item.category || '').toUpperCase();
                const matchSku = hasSkus && freebie.applicableSkus.some((s) => String(s).toUpperCase() === sku);
                const matchType = hasTypes && freebie.applicableTypes.some((t) => String(t).toUpperCase() === type);
                if (matchSku || matchType) {
                    const unit = Math.max(0, (Number(item.price) || 0) - Math.max(0, Number(item.discount) || 0));
                    const qty = Math.max(1, Number(item.qty) || 1);
                    targetSubtotal += unit * qty;
                    targetQty += qty;
                }
            });
            if (targetQty <= 0) {
                return { eligible: false, reason: 'ไม่มีสินค้าที่ร่วมรายการ' };
            }
        }
        if (freebie.minSpend > 0 && targetSubtotal < freebie.minSpend) {
            return { eligible: false, reason: 'ยอดไม่ถึง' };
        }
        if (freebie.minQty > 0 && targetQty < freebie.minQty) {
            return { eligible: false, reason: 'จำนวนไม่ถึง' };
        }
        return { eligible: true, reason: '' };
    };

    const handleToggleFreebie = (freebie) => {
        const currentlyActive = isFreebieActive(freebie.id);
        const status = evaluateFreebieEligibility(freebie);

        if (!currentlyActive && status.hardBlock) {
            toast.error(`ไม่สามารถเลือกของแถมนี้ได้ (${status.reason})`);
            return;
        }

        if (currentlyActive) {
            // Deactivate
            if (autoFreebieEnabled) {
                const currentDisabled = activeTab?.disabledFreebieIds || [];
                if (!currentDisabled.includes(freebie.id)) {
                    updateActiveTab({ disabledFreebieIds: [...currentDisabled, freebie.id] });
                }
            } else {
                const currentManual = activeTab?.manualFreebieIds || [];
                updateActiveTab({ manualFreebieIds: currentManual.filter(id => id !== freebie.id) });
            }
            toast.success(`ยกเลิกของแถม ${freebie.productName || freebie.itemName || freebie.title}`);
        } else {
            // Activate (Single Source of Truth: manage strictly via eligibleFreebies without pushing duplicate rows into items)
            if (autoFreebieEnabled && status.eligible) {
                const currentDisabled = activeTab?.disabledFreebieIds || [];
                updateActiveTab({ disabledFreebieIds: currentDisabled.filter(id => id !== freebie.id) });
            } else {
                // Switch to manual mode while preserving existing eligible freebies + adding selected one
                const existingEligibleIds = (eligibleFreebies || []).map(f => f.id).filter(Boolean);
                const currentManual = activeTab?.manualFreebieIds || [];
                const nextManual = Array.from(new Set([...existingEligibleIds, ...currentManual, freebie.id]));
                updateActiveTab({
                    autoFreebieEnabled: false,
                    manualFreebieIds: nextManual
                });
            }
            toast.success(`เลือกของแถม ${freebie.productName || freebie.itemName || freebie.title}`);
        }
    };

    const handleAddDirectItemToCart = (freebie) => {
        const status = evaluateFreebieEligibility(freebie);
        if (status.hardBlock) {
            toast.error(`ไม่สามารถเพิ่มของแถมนี้ได้ (${status.reason})`);
            return;
        }

        // Single Source of Truth: never push into activeTab.items (prevents 2x duplicate row & 2x stock deduction)
        const existingEligibleIds = (eligibleFreebies || []).map(f => f.id).filter(Boolean);
        const currentManual = activeTab?.manualFreebieIds || [];
        const nextManual = Array.from(new Set([...existingEligibleIds, ...currentManual, freebie.id]));

        updateActiveTab({
            autoFreebieEnabled: false,
            manualFreebieIds: nextManual
        });

        toast.success(`เพิ่มของแถมลงในบิลแล้ว: ${freebie.productName || freebie.itemName || freebie.title}`);
        handleClose();
    };

    return (
        <div className="fixed inset-0 z-100 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                            <Gift size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-800">เลือกของแถม (POS Freebie Selection)</h2>
                            <p className="text-[11px] text-slate-500 font-semibold">
                                ยอดซื้อสินค้าปัจจุบัน: <span className="text-emerald-600 font-bold">฿{itemSubTotal.toLocaleString()}</span>
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose} 
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="ปิด (ESC)"
                    >
                        <X size={18}/>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
                    {(!activeFreebies || activeFreebies.length === 0) ? (
                        <div className="text-center py-10">
                            <Gift size={40} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-sm font-bold">ไม่มีรายการของแถมที่เปิดใช้งานในระบบ</p>
                            <p className="text-slate-400 text-xs mt-1">สามารถตั้งค่าของแถมได้ที่เมนู ผู้จัดการ &gt; ของแถม</p>
                        </div>
                    ) : (
                        activeFreebies.map(freebie => {
                            const eligStatus = evaluateFreebieEligibility(freebie);
                            const isEligible = eligStatus.eligible;
                            const isActive = isFreebieActive(freebie.id) && (autoFreebieEnabled ? isEligible : true);

                            return (
                                <div 
                                    key={freebie.id}
                                    className={`p-3.5 rounded-xl border-2 transition-all ${
                                        isActive 
                                            ? 'border-rose-400 bg-rose-50/50 shadow-xs' 
                                            : isEligible 
                                                ? 'border-slate-200 hover:border-slate-400 bg-white' 
                                                : 'border-slate-100 bg-slate-50/60 opacity-60'
                                    }`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-black text-sm ${isActive ? 'text-rose-700' : 'text-slate-800'}`}>
                                                    {freebie.productName || freebie.itemName || freebie.title}
                                                </h3>
                                                {isActive && (
                                                    <span className="flex items-center gap-1 text-[10px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                                                        <Check size={11} strokeWidth={3} /> เลือกอยู่
                                                    </span>
                                                )}
                                                {!isEligible && (
                                                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                                        <AlertCircle size={11} /> {eligStatus.reason || 'ไม่เข้าเกณฑ์'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                {freebie.title !== freebie.itemName ? freebie.title : ''}
                                            </p>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="font-black text-xs text-rose-600 bg-rose-100 px-2 py-1 rounded-md">
                                                แถม {freebie.qty || 1} ชิ้น
                                            </span>
                                        </div>
                                    </div>

                                    {/* Criteria tags */}
                                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                                        {freebie.minSpend > 0 && (
                                            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">
                                                ยอดซื้อขั้นต่ำ: ฿{freebie.minSpend.toLocaleString()}
                                            </span>
                                        )}
                                        {freebie.minQty > 0 && (
                                            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">
                                                ซื้อขั้นต่ำ: {freebie.minQty} ชิ้น
                                            </span>
                                        )}
                                        {freebie.applicableSkus?.length > 0 && (
                                            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">
                                                เฉพาะ SKU: {freebie.applicableSkus.slice(0, 3).join(', ')}{freebie.applicableSkus.length > 3 ? '...' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-3 flex justify-end items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleAddDirectItemToCart(freebie)}
                                            className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                            title="เพิ่มเป็นรายการสินค้าฟรี 1 แถวในตารางตะกร้า"
                                        >
                                            <Plus size={13} /> เพิ่มเป็นแถวสินค้าฟรี
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleFreebie(freebie)}
                                            className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                                isActive
                                                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs active:scale-95'
                                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 active:scale-95'
                                            }`}
                                        >
                                            {isActive ? <><Check size={13} /> เลือกอยู่ (คลิกเพื่อยกเลิก)</> : 'เลือกของแถมนี้'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
                    <span className="text-[11px] text-slate-500">
                        {autoFreebieEnabled ? 'โหมด: คำนวณของแถมอัตโนมัติตามเกณฑ์' : 'โหมด: พนักงานเลือกของแถมด้วยตนเอง'}
                    </span>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
    );
}
