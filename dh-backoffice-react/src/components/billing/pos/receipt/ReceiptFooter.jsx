import { QrCode } from 'lucide-react';
import { convertToThaiBahtText } from 'dh-shared/src/utils/formatters';

export default function ReceiptFooter({
    _thaiBahtText,
    billNote,
    _itemSubTotal = 0,
    _promoDiscount = 0,
    _manualDiscount = 0,
    _otherFeeAmount = 0,
    _otherFeeName = '',
    _shippingFee = 0,
    _walletUsed = 0,
    _netTotal = 0,
    vatBreakdown = null,
    staffName,
    appliedPromoDetails,
    totalItemsCount = 0,
    totalQtyCount = 0,
    _vatOnShipping = false,
    bankAccountDisplay = ''
}) {
    const thaiBaht = _thaiBahtText && _thaiBahtText !== 'ศูนย์บาทถ้วน' 
        ? _thaiBahtText 
        : convertToThaiBahtText(_netTotal);

    const isVatIncluded = vatBreakdown?.vatType === 'included' || vatBreakdown?.vatType === 'รวม VAT';
    const vatRate = vatBreakdown?.vatRate || 7;
    const vatMultiplier = 1 + vatRate / 100;
    const round2 = (val) => Math.round(Number(val || 0) * 100) / 100;

    const displaySubTotal = isVatIncluded ? round2(_itemSubTotal / vatMultiplier) : _itemSubTotal;
    const displayPromoDiscount = isVatIncluded && _promoDiscount > 0 ? round2(_promoDiscount / vatMultiplier) : _promoDiscount;
    const displayManualDiscount = isVatIncluded && _manualDiscount > 0 ? round2(_manualDiscount / vatMultiplier) : _manualDiscount;

    let displayShipping = _shippingFee;
    if (_vatOnShipping && _shippingFee > 0 && vatRate > 0) {
        displayShipping = round2(_shippingFee * vatMultiplier);
    }

    const vatAmount = vatBreakdown?.vatAmount || 0;

    let promoLabel = 'ส่วนลด (โปรโมชั่น)';
    if (appliedPromoDetails) {
        const title = appliedPromoDetails.title || appliedPromoDetails.name || '';
        const promoType = String(appliedPromoDetails.type || appliedPromoDetails.discountType || '').toUpperCase();
        const promoVal = Number(appliedPromoDetails.value || appliedPromoDetails.discountValue || appliedPromoDetails.amount || 0);
        let tag = '';
        if (promoType.includes('PERCENT') || (promoVal > 0 && promoVal <= 100 && (!promoType || promoType.includes('PERCENT')))) {
            tag = `(-${promoVal}%)`;
        } else if (promoVal > 0) {
            tag = `(-${promoVal}฿)`;
        }
        if (title) {
            promoLabel = `ส่วนลด ${title} ${tag}`.trim();
        } else if (tag) {
            promoLabel = `ส่วนลด (โปรโมชั่น) ${tag}`.trim();
        }
    }

    return (
        <>
            {/* Summary: Compact & Clear */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-md p-3 mb-3 shadow-2xs">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 flex flex-col justify-between h-full min-h-[55px]">
                        <div className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-center shadow-2xs">
                            <span className="font-extrabold text-[11.5px] text-slate-800 leading-none">
                                ({thaiBaht})
                            </span>
                        </div>
                        {bankAccountDisplay && (
                            <div className="mt-2 bg-blue-50/80 border border-blue-200/80 rounded-md px-2.5 py-1 text-[9.5px] font-medium text-blue-900 leading-tight">
                                <span className="font-bold text-blue-950">รับโอนเข้าบัญชี:</span>{' '}
                                {bankAccountDisplay}
                            </div>
                        )}
                        {billNote && (
                            <div className="mt-2 bg-amber-50/80 border border-amber-200/80 rounded-md px-2.5 py-1 text-[9.5px] font-medium text-amber-900 leading-tight">
                                <span className="font-bold text-amber-800">หมายเหตุ:</span>{' '}
                                {billNote}
                            </div>
                        )}
                    </div>

                    <div className="w-[275px] shrink-0">
                        <table className="w-full text-[11px]">
                            <tbody>
                                <tr className="h-5">
                                    <td className="text-slate-700 font-bold whitespace-nowrap">
                                        รวมเงินสินค้า{' '}
                                        <span className="text-[9.5px] text-slate-500 font-medium">
                                            ({totalItemsCount} รายการ {totalQtyCount} ชิ้น)
                                        </span>
                                    </td>
                                    <td className="text-right font-black text-slate-950">
                                        {displaySubTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr className="h-5">
                                    <td className="text-rose-600 font-bold">{promoLabel}</td>
                                    <td className="text-right font-black text-rose-600">
                                        {displayPromoDiscount > 0 ? `- ${displayPromoDiscount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '0.00'}
                                    </td>
                                </tr>
                                <tr className="h-5">
                                    <td className="text-rose-600 font-bold">ส่วนลด ท้ายบิล</td>
                                    <td className="text-right font-black text-rose-600">
                                        {displayManualDiscount > 0 ? `- ${displayManualDiscount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '0.00'}
                                    </td>
                                </tr>
                                <tr className="h-5">
                                    <td className="text-slate-700 font-bold">{_otherFeeName || 'ยอดอื่นๆ'}</td>
                                    <td className="text-right font-black text-slate-950">
                                        {_otherFeeAmount > 0 ? `+ ${_otherFeeAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '0.00'}
                                    </td>
                                </tr>
                                <tr className="h-5">
                                    <td className="text-slate-700 font-bold">หักยอดค้าง</td>
                                    <td className="text-right font-black text-slate-950">
                                        {_walletUsed > 0 ? `- ${_walletUsed.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '0.00'}
                                    </td>
                                </tr>
                                <tr className="h-5">
                                    <td className="text-slate-700 font-bold">
                                        ค่าส่ง {_vatOnShipping ? '(รวม VAT)' : ''}
                                    </td>
                                    <td className="text-right font-black text-slate-950">
                                        {displayShipping > 0 ? displayShipping.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'}
                                    </td>
                                </tr>
                                <tr className="h-5.5 text-slate-900 bg-blue-50/80 border-y border-blue-200/60">
                                    <td className="font-black text-blue-950 pl-1">
                                        ภาษี VAT {vatRate}% รวม
                                    </td>
                                    <td className="text-right font-black text-blue-950 pr-1 text-[11.5px]">
                                        {vatAmount > 0 ? `+ ${vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '0.00'}
                                    </td>
                                </tr>
                                <tr className="border-t-2 border-slate-900 bg-emerald-100/90 border-b border-emerald-300">
                                    <td className="py-1.5 pl-1.5 font-black text-[11.5px] uppercase text-slate-950 whitespace-nowrap">
                                        ยอดสุทธิ (ต้องจ่ายชำระ)
                                    </td>
                                    <td className="py-1.5 pr-1.5 text-right font-black text-slate-950 whitespace-nowrap">
                                        <span className="text-[15px] text-orange-600 font-black">
                                            {_netTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-900 ml-1">บาท</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Terms */}
            <div className="border-t border-dashed border-slate-400 pt-2 pb-1 mb-2">
                <p className="text-[9.5px] leading-snug text-slate-800 font-bold">
                    * คืนสินค้าได้ใน 7 วันหากไม่ผ่านการใช้งาน/ดัดแปลง สินค้าพร้อมกล่อง/บิลต้องอยู่ในสภาพสมบูรณ์ การโอนเงินผิดบัญชีบริษัทไม่รับผิดชอบทุกกรณี
                </p>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end px-4 mt-auto pt-6">
                <div className="text-center w-36">
                    <div className="border-b border-slate-800 mb-1"></div>
                    <p className="text-[9.5px] font-black uppercase text-slate-700">ผู้รับเงิน / พนักงาน</p>
                    <p className="text-[9px] font-bold text-blue-700 mt-0.5 leading-none">{staffName}</p>
                </div>
                <div className="text-center w-36">
                    <div className="border-b border-slate-800 mb-1"></div>
                    <p className="text-[9.5px] font-black uppercase text-slate-700">ผู้รับสินค้า / ลูกค้า</p>
                    <p className="text-[8.5px] text-slate-400 mt-0.5">วันที่ ......../......../........</p>
                </div>
            </div>

            {/* QR Internal */}
            <div className="absolute bottom-4 right-4 opacity-10 pointer-events-none">
                <QrCode size={30}/>
            </div>
        </>
    );
}
