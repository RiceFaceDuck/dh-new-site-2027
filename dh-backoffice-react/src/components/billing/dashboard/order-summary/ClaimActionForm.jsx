import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimService } from '../../../../firebase/claimService';
import { userService } from '../../../../firebase/userService';
import { auth } from '../../../../firebase/config';
import { Wrench, ArrowLeftRight, RefreshCw, Check, X, Loader2, Search, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

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
    
    const [step, setStep] = useState('action'); // 'action' | 'qty' | 'swap_search' | 'warranty_config' | 'reason'
    const [selectedAction, setSelectedAction] = useState(null);
    const [qty, setQty] = useState(1);
    const [reasonCode, setReasonCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Swap SKU States
    const [searchSku, setSearchQuerySku] = useState('');
    const [isSearchingProduct, setIsSearchingProduct] = useState(false);
    const [swapProduct, setSwapProduct] = useState(null);
    const [swapProductError, setSwapProductError] = useState('');
    const [newWarrantyDays, setNewWarrantyDays] = useState(0);
    const [freebiePenaltyAmount, setFreebiePenaltyAmount] = useState(0);
    const [freebiesStatus, setFreebiesStatus] = useState('no_freebies');
    const [freebiesWarning, setFreebiesWarning] = useState('');

    const handleActionClick = (actionStr) => {
        if (actionStr !== 'เคลม' && actionStr !== 'คืน' && actionStr !== 'เปลี่ยน') return;
        setSelectedAction(actionStr);
        if (maxQty > 1) {
            setStep('qty');
        } else {
            if (actionStr === 'เปลี่ยน') {
                setStep('swap_search');
            } else {
                setStep('reason');
            }
        }
    };

    const handleQtyConfirm = () => {
        if (selectedAction === 'เปลี่ยน') {
            setStep('swap_search');
        } else {
            setStep('reason');
        }
    };

    const handleSearchSwapSku = async () => {
        if (!searchSku.trim()) return;
        setIsSearchingProduct(true);
        setSwapProductError('');
        setSwapProduct(null);
        setFreebiesWarning('');

        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('../../../../firebase/config');
            const { getCollectionPath } = await import('dh-shared/src/firebase/pathUtils');
            
            const productRef = doc(db, getCollectionPath('products'), searchSku.trim().toUpperCase());
            const productSnap = await getDoc(productRef);

            if (!productSnap.exists()) {
                setSwapProductError('ไม่พบ SKU สินค้าตัวนี้ในคลัง');
            } else {
                const prodData = productSnap.data();
                if ((prodData.stockQuantity || 0) <= 0) {
                    setSwapProductError(`สินค้าหมดในคลัง (คงเหลือ: ${prodData.stockQuantity || 0} ชิ้น)`);
                    return;
                }
                setSwapProduct(prodData);

                // ตรวจสอบของแถม (Freebies Checking)
                const oldCategory = (item.category || item.category1 || '').toLowerCase();
                const newCategory = (prodData.category || prodData.category1 || '').toLowerCase();
                
                const hasFreebies = selectedOrder.items?.some(i => i.isFreebie) || selectedOrder.appliedFreebies?.length > 0;
                
                if (hasFreebies) {
                    let isCompatible = true;
                    const mainCategories = ['panel', 'keyboard', 'battery', 'adapter'];
                    const oldMainCat = mainCategories.find(c => oldCategory.includes(c));
                    const newMainCat = mainCategories.find(c => newCategory.includes(c));
                    
                    if (oldMainCat && newMainCat && oldMainCat !== newMainCat) {
                        isCompatible = false;
                    }

                    if (!isCompatible) {
                        setFreebiesWarning(`⚠️ ชนิดสินค้าต่างกัน (${oldMainCat?.toUpperCase()} ➔ ${newMainCat?.toUpperCase()}) ของแถมเดิมอาจไม่สอดคล้อง โปรดเช็คการคืนของแถม/ระบุค่าปรับ`);
                        setFreebiesStatus('penalty');
                    } else {
                        setFreebiesStatus('no_freebies_action');
                    }
                } else {
                    setFreebiesStatus('no_freebies');
                }

                // คำนวณประกันคงเหลือเดิม (Default)
                const { warrantyService } = await import('../../../../firebase/warrantyService');
                const { calculateItemWarranty } = await import('dh-shared/src/utils/warrantyUtils');
                const warrantyConfig = await warrantyService.getWarrantySettings();
                
                const wStatus = calculateItemWarranty(item, selectedOrder.createdAt, warrantyConfig);
                const remainingDays = Math.max(0, wStatus?.remainingDays ?? 0);
                setNewWarrantyDays(remainingDays);
            }
        } catch (err) {
            console.error(err);
            setSwapProductError('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า');
        } finally {
            setIsSearchingProduct(false);
        }
    };

    const handleSwapSearchConfirm = () => {
        if (!swapProduct) return;
        setStep('warranty_config');
    };

    const handleWarrantyConfigConfirm = () => {
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

            const isReturn = selectedAction === 'คืน';
            const isSwap = selectedAction === 'เปลี่ยน';
            const prefix = isReturn ? 'RTN' : (isSwap ? 'EXC' : 'CLM');
            const transactionId = `${prefix}-${Date.now().toString().slice(-6)}`;
            
            const isWholesale = selectedOrder.priceMode === 'wholesale';
            const swapPrice = isSwap && swapProduct
                ? (isWholesale ? (swapProduct.Price || swapProduct.retailPrice || 0) : (swapProduct.retailPrice || swapProduct.Price || 0))
                : 0;

            const claimForm = {
                transactionId,
                warrantyDate: selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toISOString() : null,
                reasonCode: selectedReason,
                details: isSwap ? `เปลี่ยนสินค้าเป็นรุ่น: ${swapProduct?.name} (${swapProduct?.sku})` : "",
                qty: qty,
                currentStatus: 'pending_manager',
                actionType: isReturn ? 'คืนเงิน/คืนสินค้า' : (isSwap ? 'เปลี่ยนสินค้า (EXC)' : 'เคลม/ซ่อม'),
                inspectorName: null,
                images: [],

                // Swap SKU details
                isSwapSku: isSwap,
                swapSku: isSwap ? swapProduct?.sku : null,
                swapProductName: isSwap ? swapProduct?.name : null,
                swapPricePerUnit: swapPrice,
                newWarrantyDays: isSwap ? newWarrantyDays : null,
                freebiePenaltyAmount: isSwap ? freebiePenaltyAmount : 0,
                freebiesStatus: isSwap ? freebiesStatus : null
            };

            if (isReturn) {
                await claimService.requestReturn(selectedOrder, item, claimForm, userUid, userName);
            } else {
                await claimService.requestClaim(selectedOrder, item, claimForm, userUid, userName);
            }
            toast.success(isReturn ? 'สร้างคำร้องขอคืนเงินเรียบร้อยแล้ว' : isSwap ? 'สร้างคำร้องขอเปลี่ยนสินค้าเรียบร้อยแล้ว' : 'สร้างคำร้องขอเคลมสินค้าเรียบร้อยแล้ว');
            navigate('/claims');
        } catch (error) {
            console.error("Error processing request:", error);
            toast.error("เกิดข้อผิดพลาดในการสร้างคำร้อง: " + error.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 py-2 px-3 bg-orange-50/80 border-t border-dashed border-orange-500/30 animate-in fade-in slide-in-from-top-1 duration-200 w-full h-full min-h-[38px]">
            {isSubmitting ? (
                <div className="flex items-center gap-2 text-[11px] font-bold text-orange-600 w-full justify-center py-1">
                    <Loader2 size={12} className="animate-spin" /> กำลังส่งข้อมูลขออนุมัติ...
                </div>
            ) : step === 'action' ? (
                <div className="flex items-center gap-2 w-full justify-end">
                    <span className="text-[10px] font-bold text-(--dh-text-muted) mr-2">ทำรายการ:</span>
                    <button onClick={() => handleActionClick('เคลม')} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-sm transition-colors shadow-xs">
                        <Wrench size={12}/> เคลมสินค้า
                    </button>
                    <button onClick={() => handleActionClick('เปลี่ยน')} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-sm transition-colors shadow-xs">
                        <RefreshCw size={12}/> เปลี่ยนรุ่นอื่น
                    </button>
                    <button onClick={() => handleActionClick('คืน')} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-purple-600 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-sm transition-colors shadow-xs">
                        <ArrowLeftRight size={12}/> คืนเงิน
                    </button>
                    <button onClick={onCancel} className="ml-2 text-(--dh-text-muted) hover:text-red-500 p-1"><X size={14}/></button>
                </div>
            ) : step === 'qty' ? (
                <div className="flex items-center gap-2 w-full justify-end">
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${selectedAction === 'คืน' ? 'text-purple-600' : (selectedAction === 'เปลี่ยน' ? 'text-blue-600' : 'text-orange-600')}`}>
                        {selectedAction === 'คืน' ? <ArrowLeftRight size={10}/> : (selectedAction === 'เปลี่ยน' ? <RefreshCw size={10}/> : <Wrench size={10}/>)} {selectedAction}:
                    </span>
                    <span className="text-[10px] font-bold text-(--dh-text-muted)">ระบุจำนวน (สูงสุด {maxQty})</span>
                    <input 
                        type="number" min="1" max={maxQty} value={qty} 
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-16 h-6 px-1.5 text-[11px] font-bold bg-white border border-(--dh-border) rounded-sm focus:border-orange-500 outline-hidden"
                    />
                    <button onClick={() => { setQty(maxQty); handleQtyConfirm(); }} className="px-2 h-6 text-[10px] font-bold text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 rounded-sm border border-orange-500/20 transition-colors">
                        ทั้งหมด
                    </button>
                    <button onClick={handleQtyConfirm} className="px-2 h-6 text-[10px] font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-sm shadow-xs flex items-center gap-1 transition-colors">
                        ต่อไป <Check size={10}/>
                    </button>
                    <button onClick={onCancel} className="ml-2 text-(--dh-text-muted) hover:text-red-500 p-1"><X size={14}/></button>
                </div>
            ) : step === 'swap_search' ? (
                <div className="flex flex-col gap-1 w-full animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-orange-200 pb-1 mb-1">
                        <span className="text-[10px] font-black text-blue-600 flex items-center gap-1"><RefreshCw size={10}/> ค้นหาสินค้าตัวใหม่ที่จะเปลี่ยน (Swap SKU)</span>
                        <button onClick={onCancel} className="text-(--dh-text-muted) hover:text-red-500 p-0.5"><X size={12}/></button>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <input 
                            type="text" 
                            placeholder="พิมพ์รหัส SKU ตรงตัว เช่น PANEL-B..." 
                            value={searchSku} 
                            onChange={(e) => setSearchQuerySku(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSwapSku()}
                            className="flex-1 max-w-[240px] h-7 px-2 text-[11px] font-bold bg-white border border-(--dh-border) rounded-sm uppercase outline-hidden focus:border-blue-500"
                        />
                        <button 
                            type="button" 
                            onClick={handleSearchSwapSku}
                            disabled={isSearchingProduct || !searchSku}
                            className="px-3 h-7 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-[10px] font-black rounded-sm flex items-center gap-1 transition-colors"
                        >
                            {isSearchingProduct ? <Loader2 size={10} className="animate-spin" /> : <Search size={10}/>} ค้นหา
                        </button>
                    </div>

                    {swapProductError && <p className="text-red-500 text-[10px] font-black mt-1 text-right">⚠️ {swapProductError}</p>}

                    {swapProduct && (
                        <div className="bg-white border border-blue-200 p-2 rounded-sm mt-1 flex justify-between items-center animate-in slide-in-from-top-1">
                            <div>
                                <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{swapProduct.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">SKU: {swapProduct.sku} | คลังดี: {swapProduct.stockQuantity}</p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <span className="text-[11px] font-black text-emerald-600">
                                    ฿{(selectedOrder.priceMode === 'wholesale' ? (swapProduct.Price || swapProduct.retailPrice || 0) : (swapProduct.retailPrice || swapProduct.Price || 0)).toLocaleString()}
                                </span>
                                <button onClick={handleSwapSearchConfirm} className="px-2.5 h-6 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-sm transition-colors flex items-center gap-0.5">
                                    เลือก <Check size={10}/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : step === 'warranty_config' ? (
                <div className="flex flex-col gap-1 w-full animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-orange-200 pb-1 mb-1">
                        <span className="text-[10px] font-black text-blue-600 flex items-center gap-1"><Shield size={10}/> ตั้งค่ารับประกันและตรวจสอบของแถม</span>
                        <button onClick={onCancel} className="text-(--dh-text-muted) hover:text-red-500 p-0.5"><X size={12}/></button>
                    </div>

                    {freebiesWarning && (
                        <div className="bg-orange-50 border border-orange-200 p-2 rounded-sm mb-2 text-[10px] font-bold text-orange-700 flex flex-col gap-1.5">
                            <p>{freebiesWarning}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-500">ค่าปรับของแถม (ถ้ามี):</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={freebiePenaltyAmount}
                                    onChange={(e) => setFreebiePenaltyAmount(Number(e.target.value))}
                                    className="w-20 h-5 px-1 bg-white border border-slate-300 rounded-xs text-[10px] font-bold"
                                    placeholder="ใส่ยอดปรับ..."
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 justify-end text-[10px]">
                        <span className="font-bold text-slate-600">ตั้งวันประกันสินค้าใหม่ (วัน):</span>
                        <input 
                            type="number" 
                            min="0"
                            value={newWarrantyDays}
                            onChange={(e) => setNewWarrantyDays(Number(e.target.value))}
                            className="w-16 h-6 px-1.5 text-[11px] font-bold bg-white border border-(--dh-border) rounded-sm outline-hidden focus:border-blue-500"
                        />
                        <button onClick={handleWarrantyConfigConfirm} className="px-3 h-6 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-sm shadow-xs flex items-center gap-1 transition-colors">
                            ยืนยันประกัน <Check size={10}/>
                        </button>
                    </div>
                </div>
            ) : step === 'reason' ? (
                <div className="flex items-center gap-2 w-full justify-end">
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${selectedAction === 'คืน' ? 'text-purple-600' : (selectedAction === 'เปลี่ยน' ? 'text-blue-600' : 'text-orange-600')}`}>
                        {selectedAction === 'คืน' ? <ArrowLeftRight size={10}/> : (selectedAction === 'เปลี่ยน' ? <RefreshCw size={10}/> : <Wrench size={10}/>)} {qty} ชิ้น:
                    </span>
                    <span className="text-[10px] font-bold text-(--dh-text-muted)">สาเหตุ/อาการ</span>
                    <select 
                        value={reasonCode}
                        onChange={handleReasonChange}
                        className="w-48 sm:w-64 h-6 px-1.5 text-[10px] font-bold bg-white border border-(--dh-border) rounded-sm focus:border-orange-500 outline-hidden text-(--dh-text-main)"
                    >
                        <option value="" disabled>-- เลือกสาเหตุ --</option>
                        {REASON_OPTIONS.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                    <button onClick={onCancel} className="ml-2 text-(--dh-text-muted) hover:text-red-500 p-1"><X size={14}/></button>
                </div>
            ) : null}
        </div>
    );
}
