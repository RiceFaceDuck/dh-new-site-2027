import React, { useState } from 'react';
import { X, Printer, QrCode, ToggleLeft, ToggleRight, Loader2, Truck, Store, MapPin, Phone, User, Calendar } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

// 🛠️ นำเข้า Database และ Auth
import { db, auth } from '../../../firebase/config';

// 🎨 แมปปิ้งสีสำหรับ Note สินค้า
const noteColorStyles = {
    fuchsia: { text: '#c026d3', bg: '#fdf4ff', border: '#f0abfc' },
    blue: { text: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    emerald: { text: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    rose: { text: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
    amber: { text: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    slate: { text: '#475569', bg: '#f8fafc', border: '#cbd5e1' }
};

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
                    
                    {/* Header: Ultra-Compact */}
                    <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
                        <div className="flex gap-3 items-center">
                            <img src="/dh-logo.png" alt="Logo" className="h-7 w-auto object-contain" onError={(e)=>e.target.style.display='none'}/>
                            <div>
                                <h1 className="font-black text-sm leading-none">บริษัท ดีเอช โน๊ตบุ๊ค จำกัด</h1>
                                <p className="text-[9px] text-gray-600 font-medium">dhnotebook.com | Line: @dhnotebook | 087-5153122</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="font-black text-xs uppercase tracking-tighter bg-black text-white px-2 py-0.5 rounded">ใบเสร็จรับเงิน</h2>
                            <p className="font-black text-[10px] mt-1">{orderId || 'DRAFT'}</p>
                        </div>
                    </div>

                    {/* Info Grid: 2 Columns */}
                    <div className="grid grid-cols-2 gap-4 mb-2 bg-gray-50 p-2 rounded border border-gray-200">
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">ผู้รับสินค้า (Customer)</p>
                            <p className="font-black text-[12px] truncate">{displayName}</p>
                            <p className="font-bold text-blue-700 flex items-center gap-1 mt-0.5"><Phone size={10}/> {displayPhone}</p>
                            {format === 'full' && customer?.address && <p className="text-[9px] text-gray-600 leading-[1.1] mt-0.5 line-clamp-2">{customer.address}</p>}
                        </div>
                        <div className="text-right border-l pl-3 border-gray-300">
                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">ข้อมูลออเดอร์ (Order)</p>
                            <p className="font-bold flex items-center justify-end gap-1"><Calendar size={10}/> {orderData?.createdAt?.toDate ? orderData.createdAt.toDate().toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH')}</p>
                            <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-gray-300 rounded font-bold text-[9px] uppercase">
                                {fulfillmentType === 'Delivery' ? <><Truck size={10}/> {data.courier || 'Delivery'}</> : <><Store size={10}/> {fulfillmentType === 'ZeerBranch' ? 'ZEER' : 'หน้าร้าน'}</>}
                            </div>
                        </div>
                    </div>

                    {/* Items Table: Optimized for 5-7 items */}
                    <table className="w-full mb-2 border-collapse">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="py-1 text-center w-6 font-black">#</th>
                                <th className="py-1 text-left pl-1 font-black">รายการสินค้า</th>
                                <th className="py-1 text-center w-10 font-black">Qty</th>
                                <th className="py-1 text-right w-20 font-black pr-1">จำนวนเงิน</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length > 0 ? items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-200 border-dashed">
                                    <td className="py-1.5 text-center text-gray-400 font-bold">{idx + 1}</td>
                                    <td className="py-1.5 pl-1">
                                        <p className="font-black text-[11px] leading-none">{item.name || item.itemName}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[8px] font-mono text-gray-400 uppercase">{item.sku}</span>
                                            {item.note && (
                                                <span className="text-[8px] font-bold px-1 rounded border leading-none" 
                                                      style={{ color: (noteColorStyles[item.noteColor] || noteColorStyles.slate).text, backgroundColor: (noteColorStyles[item.noteColor] || noteColorStyles.slate).bg }}>
                                                    {item.note}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-1.5 text-center font-black text-[11px]">{item.qty}</td>
                                    <td className="py-1.5 text-right font-black pr-1 text-[11px]">{((item.price || 0) * item.qty).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                </tr>
                            )) : <tr><td colSpan="4" className="py-4 text-center text-gray-400">ไม่มีข้อมูลสินค้า</td></tr>}
                        </tbody>
                    </table>

                    {/* Summary: Compact & Clear */}
                    <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="flex-1">
                            <div className="bg-gray-50 border rounded p-1.5 text-center mb-1">
                                <span className="font-black text-[10px] italic">({_thaiBahtText || 'ศูนย์บาทถ้วน'})</span>
                            </div>
                            {billNote && <p className="text-[9px] font-bold text-gray-600 leading-none">หมายเหตุ: {billNote}</p>}
                        </div>
                        <div className="w-40">
                            <table className="w-full text-[10px]">
                                <tbody>
                                    <tr>
                                        <td className="text-gray-500">รวมเงิน</td>
                                        <td className="text-right font-bold">{_itemSubTotal.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                    </tr>
                                    {(_promoDiscount + _manualDiscount) > 0 && (
                                        <tr>
                                            <td className="text-rose-500 font-bold">ส่วนลด</td>
                                            <td className="text-right font-bold text-rose-600">- {(_promoDiscount + _manualDiscount).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                        </tr>
                                    )}
                                    {_shippingFee > 0 && (
                                        <tr>
                                            <td className="text-gray-500">ค่าส่ง</td>
                                            <td className="text-right font-bold">{_shippingFee.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                        </tr>
                                    )}
                                    <tr className="border-t-2 border-black">
                                        <td className="py-1 font-black text-xs uppercase">ยอดสุทธิ</td>
                                        <td className="py-1 text-right font-black text-sm text-orange-600">{_netTotal.toLocaleString('th-TH', {minimumFractionDigits: 2})} <span className="text-[10px]">บาท (THB)</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="border-t border-dashed border-gray-400 pt-1.5 mb-6">
                        <p className="text-[8px] leading-[1.1] text-gray-500 font-medium">
                            * คืนสินค้าได้ใน 7 วันหากไม่ผ่านการใช้งาน/ดัดแปลง สินค้าพร้อมกล่อง/บิลต้องอยู่ในสภาพสมบูรณ์ การโอนเงินผิดบัญชีบริษัทไม่รับผิดชอบทุกกรณี
                        </p>
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-between items-end px-4 mt-auto">
                        <div className="text-center w-28">
                            <div className="border-b border-black mb-1"></div>
                            <p className="text-[9px] font-black uppercase">ผู้รับเงิน / พนักงาน</p>
                            <p className="text-[9px] font-bold text-blue-700 mt-0.5 leading-none">{staffName}</p>
                        </div>
                        <div className="text-center w-28">
                            <div className="border-b border-black mb-1"></div>
                            <p className="text-[9px] font-black uppercase">ผู้รับสินค้า / ลูกค้า</p>
                            <p className="text-[8px] text-gray-400 mt-0.5">วันที่ ......../......../........</p>
                        </div>
                    </div>

                    {/* QR Internal */}
                    <div className="absolute bottom-4 right-4 opacity-10">
                        <QrCode size={30}/>
                    </div>

                </div>
            </div>
        </div>
    );
}