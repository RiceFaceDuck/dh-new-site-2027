import { Calendar, Truck, Store, Phone } from 'lucide-react';

export default function ReceiptHeader({ 
    orderId, 
    displayName, 
    displayPhone, 
    customer, 
    format, 
    orderData, 
    fulfillmentType, 
    data,
    pageIndex = 1,
    totalPages = 1
}) {
    const rawVatType = data?.vatType || orderData?.vatType || customer?.vatType || '';
    const isTaxInvoice = rawVatType === 'included' || rawVatType === 'excluded' || !!(data?.isTaxInvoice || orderData?.isTaxInvoice || customer?.taxInvoiceNeeded || customer?.taxId);
    const trackingNumber = data?.trackingNumber || data?.trackingNo || data?.shippingTracking || data?.shippingDetails?.trackingNumber || orderData?.trackingNumber || orderData?.trackingNo || orderData?.shippingTracking || orderData?.shippingDetails?.trackingNumber;
    const courierName = data?.courier || data?.shippingMethod || orderData?.courier || orderData?.shippingMethod;
    const customerTaxId = customer?.taxId || data?.taxId || orderData?.customer?.taxId || orderData?.taxId || '';
    const customerBranch = customer?.branch || data?.branch || orderData?.customer?.branch || '';

    return (
        <>
            {/* Header: Ultra-Compact */}
            <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
                <div className="flex gap-3 items-center">
                    <img src="/dh-logo.png" alt="Logo" className="h-7 w-auto object-contain" onError={(e)=>e.target.style.display='none'} loading="lazy" />
                    <div>
                        <h1 className="font-black text-sm leading-none">บริษัท ดีเอช โน๊ตบุ๊ค จำกัด</h1>
                        <p className="text-[9px] text-gray-600 font-medium">
                            {isTaxInvoice && <span className="font-bold text-slate-800">เลขประจำตัวผู้เสียภาษี: 0105558000000 (สำนักงานใหญ่) | </span>}
                            dhnotebook.com | Line: @dhnotebook | 087-5153122
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="font-black text-xs uppercase tracking-tighter bg-black text-white px-2 py-0.5 rounded-sm">
                        {isTaxInvoice ? 'ใบเสร็จรับเงิน / ใบกำกับภาษี' : 'ใบเสร็จรับเงิน'}
                    </h2>
                    <p className="font-black text-[10px] mt-1">
                        {orderId || 'DRAFT'}
                        {totalPages > 1 && (
                            <span className="text-[9px] font-normal text-gray-500 ml-1">
                                (แผ่นที่ {pageIndex}/{totalPages})
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Info Grid: 2 Columns */}
            <div className="grid grid-cols-2 gap-4 mb-2 bg-gray-50 p-2 rounded-sm border border-gray-200">
                <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">ผู้รับสินค้า (Customer)</p>
                    <p className="font-black text-[12px] truncate">{displayName}</p>
                    <p className="font-bold text-blue-700 flex items-center gap-1 mt-0.5"><Phone size={10}/> {displayPhone}</p>
                    {customerTaxId && (
                        <p className="text-[9px] text-slate-700 font-bold mt-0.5">
                            TAX ID: <span className="font-mono">{customerTaxId}</span> {customerBranch ? `(${customerBranch})` : ''}
                        </p>
                    )}
                    {format === 'full' && (() => {
                        const addr = customer?.address || customer?.fullAddress || data?.customerAddress || data?.shippingAddress || data?.address || orderData?.customerAddress || orderData?.shippingAddress || orderData?.address;
                        if (!addr) return null;
                        let text = '';
                        if (typeof addr === 'string') {
                            text = addr;
                        } else if (typeof addr === 'object') {
                            text = addr.fullAddress || [
                                addr.addressLine || addr.address,
                                addr.subDistrict ? `ต.${addr.subDistrict}` : '',
                                addr.district ? `อ.${addr.district}` : '',
                                addr.province ? `จ.${addr.province}` : '',
                                addr.postalCode || addr.zipCode
                            ].filter(Boolean).join(' ');
                        }
                        return text ? <p className="text-[9px] text-gray-600 leading-[1.1] mt-0.5 line-clamp-2">{text}</p> : null;
                    })()}
                </div>
                <div className="text-right border-l pl-3 border-gray-300">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">ข้อมูลออเดอร์ (Order)</p>
                    <p className="font-bold flex items-center justify-end gap-1"><Calendar size={10}/> {orderData?.createdAt?.toDate ? orderData.createdAt.toDate().toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH')}</p>
                    <div className="mt-1 flex items-center justify-end gap-1.5 flex-wrap">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-gray-300 rounded-sm font-bold text-[9px] uppercase">
                            {fulfillmentType === 'Delivery' ? (
                                <><Truck size={10}/> {courierName || 'Delivery'}</>
                            ) : (
                                <><Store size={10}/> {fulfillmentType === 'ZeerBranch' ? 'ZEER' : 'หน้าร้าน'}</>
                            )}
                        </div>
                        {isTaxInvoice && (
                            <span className="px-1.5 py-0.5 bg-purple-700 text-white font-black text-[9px] rounded-sm uppercase tracking-tight">
                                📄 TAX ใบกำกับภาษี
                            </span>
                        )}
                    </div>
                    {trackingNumber && (
                        <div className="mt-1 flex items-center justify-end text-[9px] font-bold text-gray-700">
                            <span className="text-gray-500 mr-1">เลขพัสดุ:</span>
                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded-sm border border-gray-300 tracking-wider font-black text-gray-900">{trackingNumber}</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
