import { useState } from 'react';
import { X, Printer, ToggleLeft, ToggleRight } from 'lucide-react';
import { userService } from '../../../firebase/userService';
import { auth } from '../../../firebase/config';

import ReceiptHeader from './receipt/ReceiptHeader';
import ReceiptItems from './receipt/ReceiptItems';
import ReceiptFooter from './receipt/ReceiptFooter';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';

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
    orderData = null,
    eligibleFreebies = []
}) {
    // 🛑 [ส่วนที่ห้ามแตะต้อง] - ตรรกะการดึงข้อมูลและการคำนวณเดิม (ได้รับการอัปเกรดเพื่อป้องกันข้อมูลว่าง/ผิดพลาด)
    const data = orderData || activeTab || {};
    const { customer, items = [], fulfillmentType, paymentMethod, billNote, orderId } = data;
    const appliedPromoDetails = data.appliedPromoDetails || data.appliedPromotion || null;
    
    // 🟢 [FALLBACK CALCULATION] Calculate true subtotal from non-freebie items if zero
    let calculatedSubTotal = 0;
    if (data.items && data.items.length > 0) {
        calculatedSubTotal = data.items.reduce((sum, item) => {
            if (item.isFreebie) return sum;
            const price = Number(item.price || item.priceAtPurchase || 0);
            const qty = Number(item.qty || item.quantity || 1);
            return sum + (price * qty);
        }, 0);
    }

    const _itemSubTotal = orderData ? (orderData.subTotal || calculatedSubTotal || 0) : itemSubTotal;
    const _manualDiscount = orderData ? (orderData.overallDiscount || 0) : manualDiscount;
    let _promoDiscount = orderData ? (orderData.promoDiscount || 0) : promoDiscount;
    const _otherFeeAmount = orderData ? (orderData.otherFeeAmount || 0) : otherFeeAmount;
    const _shippingFee = orderData ? (orderData.shippingFee || 0) : shippingFee;
    const _vatAmount = orderData ? (orderData.vatAmount || 0) : vatAmount;
    const _vatType = orderData ? (orderData.vatType || 'exempt') : vatType;
    const _walletUsed = orderData ? (orderData.walletUsed || 0) : walletUsed;
    const _remainingToPay = orderData ? (orderData.remainingToPay || 0) : remainingToPay;
    let _netTotal = orderData 
        ? Number(orderData.netTotal || orderData.summary?.finalTotal || orderData.finalTotal || orderData.finalPayable || orderData.totalPrice || orderData.totalAmount || 0) 
        : (_itemSubTotal - _manualDiscount - _promoDiscount + _otherFeeAmount + _shippingFee + _vatAmount);

    // 🔥 ULTIMATE FALLBACK: If _netTotal is 0, calculate it from the items array
    if (_netTotal === 0 && data.items && data.items.length > 0) {
        _netTotal = data.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || item.quantity || 1)), 0);
    }

    // 🟢 [FALLBACK CALCULATION] If discount is 0 but subTotal > netTotal, calculate actual discount
    if (orderData && _promoDiscount === 0 && _manualDiscount === 0 && _itemSubTotal > _netTotal) {
        const calculatedDiff = _itemSubTotal + _shippingFee + _otherFeeAmount + _vatAmount - _netTotal;
        if (calculatedDiff > 0) {
            _promoDiscount = calculatedDiff;
        }
    }
    const _paymentStatus = orderData ? orderData.paymentStatus : data.paymentStatus;
    const _thaiBahtText = orderData ? (orderData.thaiBahtText || '') : (convertToThaiBahtText ? convertToThaiBahtText(_remainingToPay) : '');
    
    // Combine items and freebies if this is a draft bill (orderData is null)
    let finalItems = items ? [...items] : [];
    if (!orderData && eligibleFreebies?.length > 0) {
        const previewFreebies = eligibleFreebies.map(f => {
            let conditionText = [];
            if (f.minSpend > 0) conditionText.push(`ยอด${f.minSpend}฿`);
            if (f.minQty > 0) conditionText.push(`ครบ${f.minQty}ชิ้น`);
            if (f.applicableSkus?.length > 0) conditionText.push(`เฉพาะรุ่น`);
            const reasonStr = conditionText.length > 0 ? ` (${conditionText.join(', ')})` : '';
            return {
                sku: f.itemName, 
                name: `[แถมฟรี] ${f.productName || f.itemName}`, 
                qty: Math.min(Number(f.qty) || 1, Number(f.maxPerBill) || Number(f.qty) || 1), 
                price: 0, discount: 0, total: 0, isFreebie: true, note: f.title, conditions: conditionText, noteColor: 'rose'
            };
        });
        finalItems = [...finalItems, ...previewFreebies];
    } else if (orderData && orderData.appliedFreebies?.length > 0) {
        // Merge appliedFreebies from frontend orders that aren't directly in items array
        orderData.appliedFreebies.forEach(f => {
            if (!finalItems.some(i => (i.sku === f.itemName || i.id === f.itemName) && i.isFreebie)) {
                finalItems.push({
                    sku: f.itemName,
                    name: `[แถมฟรี] ${f.productName || f.title || f.itemName}`,
                    qty: f.qty || 1,
                    price: 0, discount: 0, total: 0, isFreebie: true, note: f.title, noteColor: 'rose'
                });
            }
        });
    }

    const staffName = orderData?.creatorName || orderData?.actorName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'พนักงาน';

    // 🟢 [PAGE CHUNKING] Split finalItems into chunks of maximum 8 items per page
    const getPageChunks = (itemsList) => {
        if (itemsList.length <= 8) {
            return [itemsList];
        }
        const chunks = [];
        for (let i = 0; i < itemsList.length; i += 8) {
            chunks.push(itemsList.slice(i, i + 8));
        }
        return chunks;
    };

    const pageChunks = getPageChunks(finalItems);

    const [format, setFormat] = useState(data.receiptFormat || 'short');
    const [isSavingPref, setIsSavingPref] = useState(false);

    const toggleFormat = async () => {
        const newFormat = format === 'short' ? 'full' : 'short';
        setFormat(newFormat);
        if (updateActiveTab) updateActiveTab({ receiptFormat: newFormat }); 
        if (customer?.id || customer?.uid) {
            setIsSavingPref(true);
            try {
                await userService.updateUserPreferences(customer.id || customer.uid, { receiptFormat: newFormat });
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
                    #printable-receipt { 
                        width: 100% !important; 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        box-shadow: none !important; 
                        border: none !important; 
                        display: block !important;
                    }
                    .receipt-page-container { 
                        page-break-after: always !important; 
                        display: block !important; 
                        position: relative !important; 
                        margin-bottom: 0 !important; 
                    }
                    .copy-page .receipt-page-container::before {
                        content: 'สำเนา';
                        position: absolute; 
                        top: 40%; 
                        left: 50%; 
                        transform: translate(-50%, -50%) rotate(-45deg);
                        font-size: 80px; 
                        color: rgba(0, 0, 0, 0.04); 
                        font-weight: 900; 
                        z-index: 9999; 
                        pointer-events: none; 
                        white-space: nowrap;
                    }
                    tr { page-break-inside: avoid; }
                </style>
            </head>
            <body>
                <div class="print-page">${printContent.outerHTML}</div>
                <div class="print-page copy-page">${printContent.outerHTML}</div>
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
    const displayName = customer ? (getCustomerDisplayName(customer, 'ลูกค้าทั่วไป')) : (data.walkInName || 'ลูกค้าทั่วไป');

    return (
        <div className="fixed inset-0 z-9999 bg-black/60 flex flex-col items-center justify-center p-4 backdrop-blur-xs">
            
            {/* Toolbar */}
            <div className="w-full max-w-[155mm] flex justify-between items-center bg-white p-3 rounded-t-xl border-b shadow-xs">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg"><X size={20}/></button>
                    <span className="font-bold text-gray-700">บิลขนาด A5 (กระชับ)</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 border px-2.5 py-1 rounded-lg bg-gray-50 text-[11px] font-black text-gray-600">
                        <span>ฉบับย่อ</span>
                        <button onClick={toggleFormat} disabled={isSavingPref} className="focus:outline-hidden disabled:opacity-50">
                            {format === 'short' ? <ToggleLeft className="text-gray-400" size={24}/> : <ToggleRight className="text-orange-500" size={24}/>}
                        </button>
                        <span>ฉบับเต็ม</span>
                    </div>

                    <button onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2">
                        <Printer size={16}/> พิมพ์บิล
                    </button>
                </div>
            </div>

            {/* A5 Viewer */}
            <div className="w-full max-w-[155mm] flex-1 overflow-y-auto bg-gray-200/50 p-4 flex justify-center">
                
                {/* 📝 A5 Paper Container Wrapper */}
                <div id="printable-receipt" className="flex flex-col gap-6 items-center w-full">
                    {pageChunks.map((chunk, pageIdx) => {
                        // Pad chunk to at least 5 rows if it's less than 5
                        const paddedChunk = [...chunk];
                        while (paddedChunk.length < 5) {
                            paddedChunk.push({ isEmptyRow: true });
                        }

                        // Calculate totals proportionally
                        const chunkSubTotal = chunk.reduce((sum, item) => {
                            if (item.isFreebie) return sum;
                            return sum + (Number(item.price || 0) * Number(item.qty || 1));
                        }, 0);

                        const factor = _itemSubTotal > 0 ? (chunkSubTotal / _itemSubTotal) : (1 / pageChunks.length);
                        
                        const pageSubTotal = chunkSubTotal;
                        const pagePromoDiscount = _promoDiscount * factor;
                        const pageManualDiscount = _manualDiscount * factor;
                        const pageShippingFee = _shippingFee * factor;
                        const pageNetTotal = _netTotal * factor;

                        // Append #pageIdx to Order ID if multi-page
                        const displayOrderId = pageChunks.length === 1 ? orderId : `${orderId || 'Draft'}#${pageIdx + 1}`;

                        return (
                            <div 
                                key={pageIdx} 
                                className="bg-white p-6 shadow-lg text-black relative leading-tight receipt-page-container shrink-0" 
                                style={{ width: '148mm', minHeight: '210mm', fontSize: '11px', boxSizing: 'border-box' }}
                            >
                                <ReceiptHeader 
                                    orderId={displayOrderId}
                                    displayName={displayName}
                                    displayPhone={displayPhone}
                                    customer={customer}
                                    format={format}
                                    orderData={orderData}
                                    fulfillmentType={fulfillmentType}
                                    data={data}
                                />

                                <ReceiptItems items={paddedChunk} startIndex={pageIdx * 8} />

                                <ReceiptFooter 
                                    _thaiBahtText={convertToThaiBahtText ? convertToThaiBahtText(pageNetTotal) : ''}
                                    billNote={pageIdx === pageChunks.length - 1 ? billNote : 'อ่านต่อแผ่นถัดไป'}
                                    _itemSubTotal={pageSubTotal}
                                    _promoDiscount={pagePromoDiscount}
                                    _manualDiscount={pageManualDiscount}
                                    _shippingFee={pageShippingFee}
                                    _netTotal={pageNetTotal}
                                    staffName={staffName}
                                    appliedPromoDetails={appliedPromoDetails}
                                />
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}