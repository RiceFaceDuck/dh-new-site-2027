import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Lock, Unlock, Receipt } from 'lucide-react';
import BillSummary from './payment/BillSummary';
import PaymentMethods from './payment/PaymentMethods';
import PaymentActions from './payment/PaymentActions';

export default function PaymentPanel({
    itemSubTotal, manualDiscount, promoDiscount, otherFeeAmount, shippingFee, vatOnShipping, vatAmount, vatType, walletUsed, remainingToPay, earnedPoints,
    activeTab, updateActiveTab, changeAmount, handleFileUpload, setPreviewSlip, handleCheckout, isProcessing, hasOutOfStock, setShowPreview, convertToThaiBahtText,
    isUploadingSlip,
    isCollapsed, setIsCollapsed, isLocked, setIsLocked
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

    const handleQuickCash = (amount) => {
        let newCash = amount === 'exact' ? remainingToPay : (parseFloat(localCash) || 0) + amount;
        setLocalCash(newCash);
        updateActiveTab({ cashReceived: newCash }); 
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

    const toggleCollapse = () => {
        if (!isCollapsed) setIsLocked(false); // If we manually collapse, unlock it
        setIsCollapsed(!isCollapsed);
    };

    const toggleLock = (e) => {
        e.stopPropagation();
        setIsLocked(!isLocked);
        if (isCollapsed) setIsCollapsed(false); // If we lock it while collapsed, open it
    };

    // Calculate total items (qty sum)
    const totalItems = activeTab.items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);

    if (isCollapsed) {
        return (
            <div className="shrink-0 bg-[#2A305A] text-white border-t border-[#1C2040] flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#32396B] transition-colors" onClick={toggleCollapse}>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">สินค้าทั้งหมด</span>
                        <span className="font-bold text-sm">{totalItems} <span className="text-white/60 font-normal">รายการ</span></span>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">ยอดชำระสุทธิ</span>
                        <span className="font-black text-xl text-[#4ade80]">฿{(remainingToPay || 0).toLocaleString()}</span>
                    </div>
                    
                    <button className="flex items-center gap-2 bg-[#F55050] hover:bg-[#D51C39] px-4 py-1.5 rounded-sm font-bold text-sm transition-colors shadow-sm" onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}>
                        <Receipt size={16}/> ชำระเงิน
                    </button>
                    
                    <div className="flex flex-col items-center justify-center gap-1 border-l border-white/10 pl-4 ml-2">
                        <button onClick={toggleLock} className={`p-1.5 rounded-md transition-colors ${isLocked ? 'text-white bg-white/20' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`} title="ล็อคแผง">
                            {isLocked ? <Lock size={14}/> : <Unlock size={14}/>}
                        </button>
                        <ChevronUp size={16} className="text-white/40"/>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="shrink-0 bg-white border-t border-gray-200 flex flex-col font-sans relative">
            
            {/* Toolbar ด้านบนสำหรับเปิด/ปิด (ยื่นออกมาด้านบน) */}
            <div className="absolute -top-10 right-4 flex items-center bg-white border border-gray-200 border-b-0 rounded-t-xl px-2 py-1 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
                <button onClick={toggleLock} className={`p-1.5 rounded-md transition-colors ${isLocked ? 'text-[#D51C39] bg-red-50' : 'text-gray-500 hover:bg-gray-100'}`} title="ล็อคแผง">
                    {isLocked ? <Lock size={16}/> : <Unlock size={16}/>}
                </button>
                <div className="w-px h-5 bg-gray-200 mx-1"></div>
                <button onClick={toggleCollapse} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors" title="ยุบแผง">
                    <ChevronDown size={18}/>
                </button>
            </div>

            <div className="flex flex-col lg:flex-row w-full h-full">
                <BillSummary 
                    itemSubTotal={itemSubTotal} manualDiscount={manualDiscount} promoDiscount={promoDiscount} 
                    otherFeeAmount={otherFeeAmount} shippingFee={shippingFee} vatAmount={vatAmount} 
                    walletUsed={walletUsed} remainingToPay={remainingToPay} earnedPoints={earnedPoints} 
                    activeTab={activeTab} setShowPreview={setShowPreview} convertToThaiBahtText={convertToThaiBahtText} 
                />
                
                <div className="w-full lg:w-[60%] p-4 flex flex-col justify-between bg-white relative">
                    <PaymentMethods 
                        activeTab={activeTab} updateActiveTab={updateActiveTab}
                        localCash={localCash} setLocalCash={setLocalCash}
                        localTxRef={localTxRef} setLocalTxRef={setLocalTxRef}
                        localTxDate={localTxDate} setLocalTxDate={setLocalTxDate}
                        localTxNote={localTxNote} setLocalTxNote={setLocalTxNote}
                        isCashShort={isCashShort} displayChange={displayChange} 
                        remainingToPay={remainingToPay} currentCashFloat={currentCashFloat} 
                        handleQuickCash={handleQuickCash} isScanning={isScanning} 
                        ocrStatus={ocrStatus} setOcrStatus={setOcrStatus} 
                        handleFileWithOCR={handleFileWithOCR} setPreviewSlip={setPreviewSlip} 
                        isUploadingSlip={isUploadingSlip}
                    />
                    
                    <PaymentActions 
                        handleCheckout={handleCheckout} isProcessing={isProcessing} 
                        isCashShort={isCashShort} hasOutOfStock={hasOutOfStock}
                    />
                </div>
            </div>
        </div>
    );
}