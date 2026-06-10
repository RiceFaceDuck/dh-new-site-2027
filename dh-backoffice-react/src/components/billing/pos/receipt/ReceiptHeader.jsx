import React from 'react';
import { Calendar, Truck, Store, Phone } from 'lucide-react';

export default function ReceiptHeader({ 
    orderId, 
    displayName, 
    displayPhone, 
    customer, 
    format, 
    orderData, 
    fulfillmentType, 
    data 
}) {
    return (
        <>
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
        </>
    );
}
