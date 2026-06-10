import React from 'react';
import { QrCode } from 'lucide-react';

export default function ReceiptFooter({
    _thaiBahtText,
    billNote,
    _itemSubTotal,
    _promoDiscount,
    _manualDiscount,
    _shippingFee,
    _netTotal,
    staffName
}) {
    return (
        <>
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
        </>
    );
}
