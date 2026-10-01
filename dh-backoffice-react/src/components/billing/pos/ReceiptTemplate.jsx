import { useState } from 'react';
import { X, Printer, ToggleLeft, ToggleRight } from 'lucide-react';
import { userService } from '../../../firebase/userService';
import { auth } from '../../../firebase/config';

import ReceiptHeader from './receipt/ReceiptHeader';
import ReceiptItems from './receipt/ReceiptItems';
import ReceiptFooter from './receipt/ReceiptFooter';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
import { calculateCanonicalTotals } from 'dh-shared/src/priceEngine';
import { calculateDetailedVat } from 'dh-shared/src/taxEngine';
import { getBankLabel } from '../../../constants/bankConstants';

function ReceiptToolbar({ onClose, format, toggleFormat, isSavingPref, handlePrint }) {
    return (
        <div className="w-full max-w-[155mm] flex justify-between items-center bg-white p-3 rounded-t-xl border-b shadow-xs">
            <div className="flex items-center gap-3">
                <button 
                    onClick={onClose} 
                    className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors cursor-pointer"
                    title="ปิดหน้าต่าง"
                >
                    <X size={20}/>
                </button>
                <span className="font-bold text-gray-700">
                    บิลขนาด A5 ({format === 'full' ? 'ฉบับเต็ม' : 'กระชับ'})
                </span>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={toggleFormat} 
                    disabled={isSavingPref} 
                    className="flex items-center gap-1.5 border px-2.5 py-1 rounded-lg bg-gray-50 text-[11px] font-black hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer focus:outline-hidden"
                    title="สลับรูปแบบบิล (ฉบับย่อ / ฉบับเต็ม)"
                >
                    <span className={format === 'short' ? 'text-orange-600 font-bold' : 'text-gray-400'}>ฉบับย่อ</span>
                    {format === 'short' ? <ToggleLeft className="text-gray-400" size={24}/> : <ToggleRight className="text-orange-500" size={24}/>}
                    <span className={format === 'full' ? 'text-orange-600 font-bold' : 'text-gray-400'}>ฉบับเต็ม</span>
                </button>

                <button 
                    onClick={handlePrint} 
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                    <Printer size={16}/> พิมพ์บิล
                </button>
            </div>
        </div>
    );
}

function processReceiptData(props) {
    const {
        activeTab,
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
    } = props;

    const data = orderData || activeTab || {};
    const { customer, items = [], fulfillmentType, billNote, orderId } = data;
    const appliedPromoDetails = data.appliedPromoDetails || data.appliedPromotion || null;

    // Use calculateCanonicalTotals if orderData is provided
    const canonical = orderData ? calculateCanonicalTotals(orderData) : null;
    const _itemSubTotal = canonical ? canonical.itemsSubTotal : itemSubTotal;
    const _manualDiscount = canonical ? canonical.manualDiscount : manualDiscount;
    const _promoDiscount = canonical ? canonical.promoDiscount : promoDiscount;
    const _otherFeeAmount = canonical ? canonical.otherFees : otherFeeAmount;
    const _otherFeeName = data.otherFeeName || orderData?.otherFeeName || activeTab?.otherFeeName || '';
    const _shippingFee = canonical ? canonical.shippingFee : shippingFee;

    const _vatType = data.vatType || vatType || 'exempt';
    const _vatOnShipping = !!data.vatOnShipping;
    const _vatRate = Number(data.vatRate || 7);
    const _baseTotal = Math.max(0, _itemSubTotal - _manualDiscount - _promoDiscount + _otherFeeAmount);

    const vatBreakdown = canonical 
        ? canonical.vatBreakdown 
        : calculateDetailedVat({
            productNet: _baseTotal,
            shippingFee: _shippingFee,
            vatType: _vatType,
            vatOnShipping: _vatOnShipping,
            vatRate: _vatRate
        });

    const _vatAmount = vatBreakdown.vatAmount;
    // Canonical calculation or fallback draft preview: (_vatType === 'excluded' ? _vatAmount : 0)
    const _netTotal = canonical ? canonical.netTotal : vatBreakdown.netTotal;

    // Freebies handling
    let finalItems = items ? [...items] : [];
    if (!orderData && eligibleFreebies?.length > 0) {
        const previewFreebies = eligibleFreebies.map(f => {
            const conditionText = [];
            if (f.minSpend > 0) conditionText.push(`ยอด${f.minSpend}฿`);
            if (f.minQty > 0) conditionText.push(`ครบ${f.minQty}ชิ้น`);
            if (f.applicableSkus?.length > 0) conditionText.push('เฉพาะรุ่น');
            return {
                sku: f.itemName,
                name: `[แถมฟรี] ${f.productName || f.itemName}`,
                qty: Number(f.calculatedQty) || Math.min(Number(f.qty) || 1, Number(f.maxPerBill) || Number(f.qty) || 1),
                price: 0,
                discount: 0,
                total: 0,
                isFreebie: true,
                note: f.title,
                conditions: conditionText,
                noteColor: 'rose'
            };
        });
        finalItems = [...finalItems, ...previewFreebies];
    } else if (orderData && orderData.appliedFreebies?.length > 0) {
        orderData.appliedFreebies.forEach(f => {
            if (!finalItems.some(i => (i.sku === f.itemName || i.id === f.itemName) && i.isFreebie)) {
                finalItems.push({
                    sku: f.itemName,
                    name: `[แถมฟรี] ${f.productName || f.title || f.itemName}`,
                    qty: f.calculatedQty || f.qty || 1,
                    price: 0,
                    discount: 0,
                    total: 0,
                    isFreebie: true,
                    note: f.title,
                    noteColor: 'rose'
                });
            }
        });
    }

    // Staff name resolution
    const rawStaffName = orderData?.staffName || orderData?.createdByName || orderData?.sellerName || orderData?.actorName || orderData?.creatorName;
    const isInvalidStaff = !rawStaffName || ['POS', 'SYSTEM', 'FRONTEND', 'WEB'].includes(String(rawStaffName).trim().toUpperCase());
    let staffName = isInvalidStaff ? null : rawStaffName;
    staffName ||= auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || 'พนักงาน POS';

    // Page chunks (8 items per page)
    const pageChunks = [];
    if (finalItems.length <= 8) {
        pageChunks.push(finalItems);
    } else {
        for (let i = 0; i < finalItems.length; i += 8) {
            pageChunks.push(finalItems.slice(i, i + 8));
        }
    }

    // Total counts excluding freebies
    const nonFreebies = (items || []).filter(item => !item.isFreebie);
    const totalItemsCount = nonFreebies.length;
    const totalQtyCount = nonFreebies.reduce((sum, item) => sum + Number(item.qty ?? item.quantity ?? item.count ?? 1), 0);

    const _walletUsed = Number(orderData ? (orderData.walletUsed || orderData.creditUsed || 0) : (walletUsed || 0));

    // Bank account label
    const paymentMethod = data.paymentMethod || data.paymentType || 'Transfer';
    const bankAccount = data.bankAccount || data.paymentDetails?.bankAccount || 'BAY';
    const customBankAccount = data.customBankAccount || data.paymentDetails?.customBankAccount || '';
    let bankAccountDisplay = '';

    if (paymentMethod === 'Transfer' || paymentMethod === 'โอนเงิน' || bankAccount) {
        if (bankAccount === 'CUSTOM' && customBankAccount) {
            bankAccountDisplay = customBankAccount;
        } else {
            const rawBank = String(bankAccount || '').trim();
            bankAccountDisplay = getBankLabel(rawBank);
            if (bankAccountDisplay.startsWith('เข้าบัญชี: ')) {
                bankAccountDisplay = bankAccountDisplay.replace('เข้าบัญชี: ', '').replace(' (default)', '');
            }
        }
    }

    return {
        data,
        customer,
        fulfillmentType,
        billNote,
        orderId,
        appliedPromoDetails,
        _itemSubTotal,
        _manualDiscount,
        _promoDiscount,
        _otherFeeAmount,
        _otherFeeName,
        _shippingFee,
        _walletUsed,
        _vatAmount: vatBreakdown.vatAmount,
        vatBreakdown,
        _netTotal,
        staffName,
        pageChunks,
        totalItemsCount,
        totalQtyCount,
        _vatOnShipping,
        bankAccountDisplay
    };
}

export default function ReceiptTemplate(props) {
    const {
        activeTab,
        updateActiveTab,
        onClose,
        convertToThaiBahtText,
        orderData = null
    } = props;

    const {
        data,
        customer,
        fulfillmentType,
        billNote,
        orderId,
        appliedPromoDetails,
        _itemSubTotal,
        _manualDiscount,
        _promoDiscount,
        _otherFeeAmount,
        _otherFeeName,
        _shippingFee,
        _walletUsed,
        vatBreakdown,
        _netTotal,
        staffName,
        pageChunks,
        totalItemsCount,
        totalQtyCount,
        _vatOnShipping,
        bankAccountDisplay
    } = processReceiptData(props);

    const [format, setFormat] = useState(data.receiptFormat || 'short');
    const [isSavingPref, setIsSavingPref] = useState(false);

    const toggleFormat = async () => {
        const newFormat = format === 'short' ? 'full' : 'short';
        setFormat(newFormat);
        if (updateActiveTab) updateActiveTab({ receiptFormat: newFormat });
        const targetId = customer?.id || customer?.uid;
        if (targetId && typeof targetId === 'string' && !targetId.startsWith('WALKIN')) {
            setIsSavingPref(true);
            try {
                await userService.updateUserPreferences(targetId, { receiptFormat: newFormat });
            } catch (err) {
                console.error('Receipt preference save error:', err);
            } finally {
                setIsSavingPref(false);
            }
        }
    };

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

    const rawPhone = customer?.phone || data.customerInfo?.phone || data.walkInPhone;
    const isPickup = fulfillmentType === 'StorePickup' || fulfillmentType === 'ZeerBranch';
    const displayPhone = ((isPickup || !data.hidePhone) && rawPhone) ? rawPhone : '-';

    const displayName = getCustomerDisplayName(customer) === 'ลูกค้าทั่วไป'
        ? (getCustomerDisplayName(data.customerInfo) === 'ลูกค้าทั่วไป'
            ? getCustomerDisplayName(data, 'ลูกค้าทั่วไป')
            : getCustomerDisplayName(data.customerInfo))
        : getCustomerDisplayName(customer);

    return (
        <div className="fixed inset-0 z-9999 bg-black/60 flex flex-col items-center justify-center p-4 backdrop-blur-xs">
            {/* Toolbar */}
            <ReceiptToolbar 
                onClose={onClose} 
                format={format} 
                toggleFormat={toggleFormat} 
                isSavingPref={isSavingPref} 
                handlePrint={handlePrint} 
            />

            {/* A5 Viewer */}
            <div className="w-full max-w-[155mm] flex-1 overflow-y-auto bg-gray-200/50 p-4 flex justify-center">
                {/* 📝 A5 Paper Container Wrapper */}
                <div id="printable-receipt" className="flex flex-col gap-6 items-center w-full">
                    {pageChunks.map((chunk, pageIdx) => {
                        const paddedChunk = [...chunk];
                        while (paddedChunk.length < 5) {
                            paddedChunk.push({ isEmptyRow: true });
                        }

                        const chunkSubTotal = chunk.reduce((sum, item) => {
                            if (item.isFreebie) return sum;
                            const price = Number(item.price ?? item.priceAtPurchase ?? item.pricePerUnit ?? item.unitPrice ?? 0);
                            const qty = Number(item.qty ?? item.quantity ?? item.count ?? 1);
                            return sum + (price * qty);
                        }, 0);

                        const numChunks = Math.max(1, pageChunks.length);
                        const factor = pageChunks.length <= 1 ? 1 : (_itemSubTotal > 0 ? (chunkSubTotal / _itemSubTotal) : (1 / numChunks));
                        const round2 = (val) => Math.round(Number(val || 0) * 100) / 100;

                        const pageSubTotal = pageChunks.length === 1 ? _itemSubTotal : round2(chunkSubTotal);
                        const pagePromoDiscount = round2(_promoDiscount * factor);
                        const pageManualDiscount = round2(_manualDiscount * factor);
                        const pageShippingFee = round2(_shippingFee * factor);
                        const pageNetTotal = pageChunks.length === 1 ? _netTotal : round2(_netTotal * factor);
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

                                <ReceiptItems 
                                    items={paddedChunk} 
                                    startIndex={pageIdx * 8} 
                                    format={format}
                                    vatType={vatBreakdown?.vatType}
                                    vatRate={vatBreakdown?.vatRate}
                                />

                                <ReceiptFooter 
                                    _thaiBahtText={convertToThaiBahtText ? convertToThaiBahtText(pageNetTotal) : ''}
                                    billNote={pageIdx === pageChunks.length - 1 ? billNote : 'อ่านต่อแผ่นถัดไป'}
                                    _itemSubTotal={pageSubTotal}
                                    _promoDiscount={pagePromoDiscount}
                                    _manualDiscount={pageManualDiscount}
                                    _otherFeeAmount={_otherFeeAmount}
                                    _otherFeeName={_otherFeeName}
                                    _shippingFee={pageShippingFee}
                                    _walletUsed={_walletUsed}
                                    _netTotal={pageNetTotal}
                                    vatBreakdown={vatBreakdown}
                                    staffName={staffName}
                                    appliedPromoDetails={appliedPromoDetails}
                                    totalItemsCount={totalItemsCount}
                                    totalQtyCount={totalQtyCount}
                                    _vatOnShipping={_vatOnShipping}
                                    bankAccountDisplay={bankAccountDisplay}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}