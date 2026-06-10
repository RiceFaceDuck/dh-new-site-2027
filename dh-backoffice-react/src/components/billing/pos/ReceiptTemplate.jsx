import React, { useState } from 'react';
import { X, Printer, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase/config';

import ReceiptHeader from './receipt/ReceiptHeader';
import ReceiptItems from './receipt/ReceiptItems';
import ReceiptFooter from './receipt/ReceiptFooter';

export default function ReceiptTemplate({
    activeTab,
    updateActiveTab, 
    onClose,
    convertToThaiBahtText,
    itemSubTotal = 0,
    manualDiscount = 0,
    promoDiscount = 0,
    otherFeeAmount = 0,
    shippingFee = 0,
    vatAmount = 0,
    vatType = 'exempt',
    walletUsed = 0,
    remainingToPay = 0,
    orderData = null 
}) {
    // 🛑 [ส่วนที่ห้ามแตะต้อง] - ตรรกะการดึงข้อมูลและการคำนวณเดิม
    const data = orderData || activeTab || {};
    const { customer, items = [], fulfillmentType, paymentMethod, billNote, orderId, appliedPromoDetails } = data;
    
    const _itemSubTotal = orderData ? (orderData.subTotal || 0) : itemSubTotal;
    const _manualDiscount = orderData ? (orderData.overallDiscount || 0) : manualDiscount;
    const _promoDiscount = orderData ? (orderData.promoDiscount || 0) : promoDiscount;
    const _otherFeeAmount = orderData ? (orderData.otherFeeAmount || 0) : otherFeeAmount;
    const _shippingFee = orderData ? (orderData.shippingFee || 0) : shippingFee;
    const _vatAmount = orderData ? (orderData.vatAmount || 0) : vatAmount;
    const _vatType = orderData ? (orderData.vatType || 'exempt') : vatType;
    const _walletUsed = orderData ? (orderData.walletUsed || 0) : walletUsed;
    const _remainingToPay = orderData ? (orderData.remainingToPay || 0) : remainingToPay;
    const _netTotal = orderData ? (orderData.netTotal || 0) : (_itemSubTotal - _manualDiscount - _promoDiscount + _otherFeeAmount + _shippingFee + _vatAmount);
    
    const _paymentStatus = orderData ? orderData.paymentStatus : data.paymentStatus;
    const _thaiBahtText = orderData ? (orderData.thaiBahtText || '') : (convertToThaiBahtText ? convertToThaiBahtText(_remainingToPay) : '');
    
    const staffName = orderData?.actorName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'พนักงาน';

    const [format, setFormat] = useState(data.receiptFormat || 'short');
    const [isSavingPref, setIsSavingPref] = useState(false);

    const toggleFormat = async () => {
        const newFormat = format === 'short' ? 'full' : 'short';
        setFormat(newFormat);
        if (updateActiveTab) updateActiveTab({ receiptFormat: newFormat }); 
        if (customer?.id || customer?.uid) {
            setIsSavingPref(true);
            try {
                const custRef = doc(db, 'users', customer.id || customer.uid);
                await updateDoc(custRef, { 'preferences.receiptFormat': newFormat });
            } catch (error) { console.error(error); } finally { setIsSavingPref(false); }
        }
    };

    // 🚀 A5 PRINT LOGIC (แก้หน้าขาว 100%)
    const handlePrint = () => {
        const printContent = document.getElementById('printable-receipt');
        if (!printContent) return;

        const oldIframe = document.getElementById('dh-print-iframe-a5');
        if (oldIframe) oldIframe.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'dh-print-iframe-a5';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(style => style.outerHTML)
            .join('\n');

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html lang="th">
            <head>
                <meta charset="utf-8">
                <title>A5 Receipt - ${orderId || 'Draft'}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                ${styles}
                <style>
                    @page { size: A5 portrait; margin: 5mm; }
                    body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .print-page { page-break-after: always; position: relative; padding: 5px; }
                    .copy-page { filter: grayscale(100%); }
                    .watermark-text {
                        position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
                        font-size: 80px; color: rgba(0, 0, 0, 0.05); font-weight: 900; z-index: 0; pointer-events: none; white-space: nowrap;
                    }
                    #printable-receipt { width: 100% !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
                    tr { page-break-inside: avoid; }
                </style>
            </head>
            <body>
                <div class="print-page">${printContent.outerHTML}</div>
                <div class="print-page copy-page"><div class="watermark-text">สำเนา</div>${printContent.outerHTML}</div>
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.focus(); window.print(); }, 800);
                    };
                </script>
            </body>
            </html>
        `);
        iframeDoc.close();
    };

    const rawPhone = customer ? customer.phone : data.walkInPhone;
    const isPickup = fulfillmentType === 'StorePickup' || fulfillmentType === 'ZeerBranch';
    const displayPhone = ((isPickup || !data.hidePhone) && rawPhone) ? rawPhone : '-';
    const displayName = customer ? (customer.accountName || customer.firstName || customer.displayName || 'ลูกค้าทั่วไป') : (data.walkInName || 'ลูกค้าทั่วไป');

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            
            {/* Toolbar */}
            <div className="w-full max-w-[155mm] flex justify-between items-center bg-white p-3 rounded-t-xl border-b shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg"><X size={20}/></button>
                    <span className="font-bold text-gray-700">บิลขนาด A5 (กระชับ)</span>
                </div>
                <div className="flex gap-2">
                    {customer && (
                        <button onClick={toggleFormat} className="text-xs font-bold flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border">
                            {isSavingPref ? <Loader2 size={14} className="animate-spin"/> : (format === 'short' ? <ToggleLeft size={16}/> : <ToggleRight size={16} className="text-orange-500"/>)}
                            {format === 'short' ? 'แบบย่อ' : 'แบบเต็ม'}
                        </button>
                    )}
                    <button onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2">
                        <Printer size={16}/> พิมพ์บิล
                    </button>
                </div>
            </div>

            {/* A5 Viewer */}
            <div className="w-full max-w-[155mm] flex-1 overflow-y-auto bg-gray-200/50 p-4 flex justify-center">
                
                {/* 📝 A5 Paper (148mm x 210mm) */}
                <div id="printable-receipt" className="bg-white p-6 shadow-lg text-black relative leading-tight" style={{ width: '148mm', minHeight: '210mm', fontSize: '11px' }}>
                    
                    <ReceiptHeader 
                        orderId={orderId}
                        displayName={displayName}
                        displayPhone={displayPhone}
                        customer={customer}
                        format={format}
                        orderData={orderData}
                        fulfillmentType={fulfillmentType}
                        data={data}
                    />

                    <ReceiptItems items={items} />

                    <ReceiptFooter 
                        _thaiBahtText={_thaiBahtText}
                        billNote={billNote}
                        _itemSubTotal={_itemSubTotal}
                        _promoDiscount={_promoDiscount}
                        _manualDiscount={_manualDiscount}
                        _shippingFee={_shippingFee}
                        _netTotal={_netTotal}
                        staffName={staffName}
                    />

                </div>
            </div>
        </div>
    );
}