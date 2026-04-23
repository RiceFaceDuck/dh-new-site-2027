import React, { useState, useEffect } from 'react';
import { Calculator, Eye, Landmark, Banknote, UploadCloud, Trash2, FileEdit, Receipt, CreditCard, ScanLine, AlertCircle } from 'lucide-react';

export default function PaymentPanel({
    itemSubTotal, manualDiscount, promoDiscount, otherFeeAmount, shippingFee, vatOnShipping, vatAmount, vatType, walletUsed, remainingToPay, earnedPoints,
    activeTab, updateActiveTab, changeAmount, handleFileUpload, setPreviewSlip, handleCheckout, isProcessing, hasOutOfStock, setShowPreview, convertToThaiBahtText,
    isUploadingSlip
}) {
    // ✨ PERFORMANCE: Local State รับค่าระหว่างพิมพ์
    const [localCash, setLocalCash] = useState(activeTab.cashReceived || '');
    const [localTxRef, setLocalTxRef] = useState(activeTab.transactionRef || '');
    const [localTxDate, setLocalTxDate] = useState(activeTab.transferDateTime || '');
    const [localTxNote, setLocalTxNote] = useState(activeTab.transferNote || '');

    useEffect(() => { setLocalCash(activeTab.cashReceived || ''); }, [activeTab.cashReceived]);
    useEffect(() => { setLocalTxRef(activeTab.transactionRef || ''); }, [activeTab.transactionRef]);
    useEffect(() => { setLocalTxDate(activeTab.transferDateTime || ''); }, [activeTab.transferDateTime]);
    useEffect(() => { setLocalTxNote(activeTab.transferNote || ''); }, [activeTab.transferNote]);

    const [copied, setCopied] = useState(false);
    const handleCopyAmount = () => {
        navigator.clipboard.writeText(remainingToPay.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleQuickCash = (amount) => {
        let newCash = amount === 'exact' ? remainingToPay : (parseFloat(localCash) || 0) + amount;
        setLocalCash(newCash);
        updateActiveTab({ cashReceived: newCash }); // อัปเดต Parent ด้วย
    };

    const currentCashFloat = parseFloat(localCash) || 0;
    const isCashShort = activeTab.paymentMethod === 'Cash' && currentCashFloat > 0 && currentCashFloat < remainingToPay;
    const displayChange = (activeTab.paymentMethod === 'Cash' && localCash) ? (currentCashFloat - remainingToPay) : 0;

    const [isScanning, setIsScanning] = useState(false);
    const [ocrStatus, setOcrStatus] = useState('idle');

    const triggerRealOCRCheck = () => {
        setIsScanning(true); setOcrStatus('scanning');
        setTimeout(() => { setIsScanning(false); setOcrStatus('error'); }, 1800);
    };

    const handleFileWithOCR = (e) => {
        handleFileUpload(e);
        if (e.target.files && e.target.files.length > 0) triggerRealOCRCheck();
    };

    useEffect(() => {
        const handleGlobalKeydown = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (!isProcessing && !isCashShort) handleCheckout('Paid');
            }
        };
        window.addEventListener('keydown', handleGlobalKeydown);
        return () => window.removeEventListener('keydown', handleGlobalKeydown);
    }, [isProcessing, isCashShort, handleCheckout]);

    const inputClass = "w-full bg-white border border-gray-300 rounded-sm px-2.5 text-sm font-medium text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] transition-all";

    return (
        <div className="shrink-0 bg-white border-t border-gray-200 flex flex-col lg:flex-row overflow-hidden font-sans">
            
            {/* ซ้าย: สรุปบิล */}
            <div className="w-full lg:w-[40%] p-4 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col justify-between bg-gray-50/50">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-gray-700 font-bold text-sm flex items-center gap-1.5"><Calculator size={14}/> สรุปบิล</h3>
                    <button onClick={() => setShowPreview(true)} className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-sm text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        <Eye size={12}/> พรีวิว
                    </button>
                </div>
                
                <div className="space-y-1.5 mb-3 text-xs font-medium">
                    <div className="flex justify-between text-gray-500"><span>รวมค่าสินค้า</span><span className="text-gray-800">฿{(itemSubTotal || 0).toLocaleString()}</span></div>
                    <div className={`flex justify-between ${manualDiscount > 0 ? 'text-red-500' : 'text-gray-400'}`}><span>ส่วนลดท้ายบิล</span><span>{manualDiscount > 0 ? '-' : ''} ฿{(manualDiscount || 0).toLocaleString()}</span></div>
                    <div className={`flex justify-between ${promoDiscount > 0 ? 'text-[var(--dh-accent)]' : 'text-gray-400'}`}><span>โปรโมชัน</span><span>{promoDiscount > 0 ? '-' : ''} ฿{(promoDiscount || 0).toLocaleString()}</span></div>
                    <div className={`flex justify-between ${otherFeeAmount !== 0 ? 'text-gray-700' : 'text-gray-400'}`}><span>{activeTab.otherFeeName || 'ยอดอื่นๆ'}</span><span>{otherFeeAmount > 0 ? '+' : ''} ฿{(otherFeeAmount || 0).toLocaleString()}</span></div>
                    <div className={`flex justify-between ${shippingFee > 0 ? 'text-gray-700' : 'text-gray-400'}`}><span>ค่าจัดส่ง {shippingFee > 0 && activeTab.vatOnShipping && '(VAT)'}</span><span>{shippingFee > 0 ? '+' : ''} ฿{(shippingFee || 0).toLocaleString()}</span></div>
                    <div className={`flex justify-between ${vatAmount > 0 ? 'text-gray-700' : 'text-gray-400'}`}><span>VAT 7% ({activeTab.vatType || '-'})</span><span>{vatAmount > 0 ? '+' : ''} ฿{(vatAmount || 0).toLocaleString()}</span></div>
                    <div className={`flex justify-between pt-1.5 border-t border-gray-200 mt-1.5 ${walletUsed > 0 ? 'text-blue-600' : 'text-gray-400'}`}><span>หักจ่าย Wallet</span><span>{walletUsed > 0 ? '-' : ''} ฿{(walletUsed || 0).toLocaleString()}</span></div>
                </div>
                
                <div className="flex justify-between items-end pt-3 border-t border-gray-200 mt-auto">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-0.5">ยอดชำระสุทธิ</span>
                        <span className="text-xs text-gray-800 font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded-sm truncate max-w-[120px]">{convertToThaiBahtText(remainingToPay) || 'ศูนย์บาทถ้วน'}</span>
                    </div>
                    <div className="text-right group cursor-pointer" onClick={handleCopyAmount} title="คลิกเพื่อคัดลอกยอดเงิน">
                        <div className="inline-block border-b border-transparent group-hover:border-gray-400 border-dashed transition-colors">
                            <span className="text-2xl font-bold text-gray-800 leading-none">฿{(remainingToPay || 0).toLocaleString()}</span>
                        </div>
                        {copied && <span className="absolute -translate-y-8 -translate-x-4 text-[10px] bg-gray-800 text-white px-2 py-1 rounded shadow animate-in fade-in">คัดลอกแล้ว!</span>}
                        {earnedPoints > 0 && <div className="text-[10px] text-gray-500 mt-1">+ ได้รับ {earnedPoints} Points</div>}
                    </div>
                </div>
            </div>

            {/* ขวา: การชำระเงิน */}
            <div className="w-full lg:w-[60%] p-4 flex flex-col justify-between bg-white">
                <div className="mb-4">
                    {/* แท็บเลือกวิธีจ่าย */}
                    <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-sm border border-gray-200">
                        <button onClick={() => updateActiveTab({ paymentMethod: 'Transfer' })} className={`flex-1 py-1.5 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-1.5 ${activeTab.paymentMethod === 'Transfer' ? 'bg-white text-gray-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}><Landmark size={14}/> โอนเงิน</button>
                        <button onClick={() => updateActiveTab({ paymentMethod: 'Cash' })} className={`flex-1 py-1.5 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-1.5 ${activeTab.paymentMethod === 'Cash' ? 'bg-white text-gray-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}><Banknote size={14}/> เงินสด</button>
                        <button disabled className="flex-1 py-1.5 text-xs font-semibold rounded-sm text-gray-400 flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed"><CreditCard size={14}/> เครดิต</button>
                    </div>
                    
                    <div className="flex flex-col min-h-[140px] justify-center">
                        {/* โหมดเงินสด */}
                        {activeTab.paymentMethod === 'Cash' && (
                            <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                                <div className={`w-full flex items-center gap-3 p-3 rounded-sm border bg-gray-50 transition-colors ${isCashShort ? 'border-red-300' : 'border-gray-200'}`}>
                                    <span className={`text-sm font-semibold whitespace-nowrap ${isCashShort ? 'text-red-600' : 'text-gray-600'}`}>รับเงินสด:</span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">฿</span>
                                        <input 
                                            type="number" placeholder={`ยอด ${(remainingToPay || 0).toLocaleString()}`} 
                                            value={localCash} onFocus={(e) => e.target.select()} 
                                            onChange={(e) => setLocalCash(e.target.value)} 
                                            onBlur={() => updateActiveTab({ cashReceived: localCash })}
                                            onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ cashReceived: localCash }); }}
                                            className={`w-full h-10 bg-white border rounded-sm pl-8 pr-3 text-right font-bold text-base outline-none transition-all ${isCashShort ? 'border-red-400 focus:border-red-500 text-red-600' : 'border-gray-300 focus:border-blue-500 text-gray-800'}`}
                                        />
                                    </div>
                                    {isCashShort ? (
                                        <span className="text-xs text-red-600 font-bold bg-red-50 px-2.5 h-10 flex items-center gap-1 rounded-sm border border-red-200 shrink-0"><AlertCircle size={14}/> ขาด ฿{(remainingToPay - currentCashFloat).toLocaleString()}</span>
                                    ) : displayChange >= 0 && currentCashFloat > 0 ? (
                                        <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2.5 h-10 flex items-center rounded-sm border border-blue-200 shrink-0">ทอน ฿{displayChange.toLocaleString()}</span>
                                    ) : null}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleQuickCash('exact')} className="flex-1 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-sm border border-gray-300 transition-colors">พอดี</button>
                                    <button onClick={() => handleQuickCash(100)} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-sm border border-gray-200 transition-colors">+ 100</button>
                                    <button onClick={() => handleQuickCash(500)} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-sm border border-gray-200 transition-colors">+ 500</button>
                                    <button onClick={() => handleQuickCash(1000)} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-sm border border-gray-200 transition-colors">+ 1K</button>
                                </div>
                            </div>
                        )}

                        {/* โหมดโอนเงิน */}
                        {activeTab.paymentMethod === 'Transfer' && (
                            <div className="flex justify-between items-stretch animate-in fade-in duration-200 h-full gap-3">
                                <div className="flex-1 flex flex-col gap-2.5">
                                    <select value={activeTab.bankAccount || 'KBANK'} onChange={(e) => updateActiveTab({ bankAccount: e.target.value })} className={`${inputClass} h-8 text-xs cursor-pointer`}>
                                        <option value="KBANK">เข้าบัญชี: กสิกรไทย</option><option value="SCB">เข้าบัญชี: ไทยพาณิชย์</option><option value="BBL">เข้าบัญชี: กรุงเทพ</option><option value="KTB">เข้าบัญชี: กรุงไทย</option>
                                    </select>
                                    <div className="relative h-8 group">
                                        <input type="text" placeholder="หมายเลขธุรกรรม (ถ้ามี)" value={localTxRef} onChange={(e) => setLocalTxRef(e.target.value)} onBlur={() => updateActiveTab({ transactionRef: localTxRef })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ transactionRef: localTxRef }); }} className={`${inputClass} h-full ${ocrStatus === 'error' ? 'border-red-300 focus:border-red-500' : ''}`} />
                                        {isScanning && <ScanLine size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin-slow" />}
                                    </div>
                                    <div className="relative h-8 group">
                                        <input type="text" placeholder="วันที่ และ เวลาโอน" value={localTxDate} onChange={(e) => setLocalTxDate(e.target.value)} onBlur={() => updateActiveTab({ transferDateTime: localTxDate })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ transferDateTime: localTxDate }); }} className={`${inputClass} h-full ${ocrStatus === 'error' ? 'border-red-300 focus:border-red-500' : ''}`} />
                                    </div>
                                    <input type="text" placeholder="ชื่อผู้โอน / หมายเหตุ" value={localTxNote} onChange={(e) => setLocalTxNote(e.target.value)} onBlur={() => updateActiveTab({ transferNote: localTxNote })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ transferNote: localTxNote }); }} className={`${inputClass} h-8`} />
                                </div>

                                {/* สลิปอัปโหลด */}
                                <div 
                                    className={`w-28 shrink-0 border border-dashed rounded-sm flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all duration-300 ${activeTab.slipImage ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50'}`} 
                                    onClick={(e) => { if (activeTab.slipImage) { e.preventDefault(); setPreviewSlip(activeTab.slipImage); } }}
                                >
                                    {isUploadingSlip && <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"><div className="w-5 h-5 border-[2px] border-gray-400 border-t-transparent rounded-full animate-spin mb-1"></div><span className="text-[9px] font-medium text-gray-500">UPLOADING...</span></div>}
                                    {!activeTab.slipImage && !isUploadingSlip && <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" onChange={handleFileWithOCR} />}
                                    
                                    {activeTab.slipImage && (
                                        <>
                                            <img src={activeTab.slipImage} alt="Slip" className="absolute inset-0 w-full h-full object-contain z-10 p-1" />
                                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                <button onClick={(e) => { e.stopPropagation(); updateActiveTab({slipImage:null, transactionRef: '', transferDateTime: '', transferNote: ''}); setOcrStatus('idle'); }} className="p-1.5 bg-red-500 hover:bg-red-600 rounded-sm text-white shadow-sm transition-all scale-90 hover:scale-100"><Trash2 size={14}/></button>
                                            </div>
                                        </>
                                    )}
                                    {!activeTab.slipImage && !isUploadingSlip && (
                                        <div className="flex flex-col items-center gap-1.5 text-center p-2 text-gray-400 group-hover:text-gray-600 transition-colors">
                                            <UploadCloud size={20} strokeWidth={1.5} /> 
                                            <span className="text-[10px] font-medium leading-tight">แนบสลิป<br/><span className="text-[9px] opacity-70">(Ctrl+V)</span></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ปุ่ม Action */}
                <div className="grid grid-cols-4 gap-2 mt-auto">
                    <button onClick={() => handleCheckout('Draft')} disabled={isProcessing} className={`py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 border text-xs ${hasOutOfStock ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-300'}`}>
                        <FileEdit size={14}/> {hasOutOfStock ? 'Draft (สต๊อก)' : 'บันทึกร่าง'}
                    </button>
                    <button onClick={() => handleCheckout('OnAccount')} disabled={isProcessing} className="py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-sm font-semibold transition-colors flex items-center justify-center gap-1.5 border border-gray-300 text-xs">
                        เครดิต (On Acc)
                    </button>
                    <button onClick={() => handleCheckout('Paid')} disabled={isProcessing || isCashShort} title="สามารถกดปุ่มลัด Ctrl + Enter เพื่อยืนยันได้"
                        className={`col-span-2 py-2.5 rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-2
                            ${isCashShort ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-70 border border-blue-600'}
                        `}
                    >
                        {isProcessing ? <span className="animate-spin text-sm">⏳</span> : <Receipt size={16}/>} 
                        {isProcessing ? 'กำลังบันทึก...' : 'รับชำระเงิน (Paid)'}
                    </button>
                </div>
            </div>
        </div>
    );
}