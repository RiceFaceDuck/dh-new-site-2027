import { useState } from 'react';
import { Calculator, Eye, HelpCircle } from 'lucide-react';

export default function BillSummary({
    itemSubTotal, manualDiscount, promoDiscount, otherFeeAmount, shippingFee, 
    vatAmount, walletUsed, remainingToPay, earnedPoints, activeTab, 
    setShowPreview, convertToThaiBahtText, onOpenShippingModal, onOpenVatModal
}) {
    const [copied, setCopied] = useState(false);
    
    const handleCopyAmount = () => {
        navigator.clipboard.writeText(remainingToPay.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full lg:w-[40%] p-4 border-b lg:border-b-0 lg:border-r border-[#D3DCEB] flex flex-col justify-between bg-[#EFF2F9] shadow-[inset_-1px_0_10px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-[#2A305A] font-black text-sm flex items-center gap-1.5">
                    <Calculator size={16}/> สรุปบิล
                </h3>
                <button 
                    type="button"
                    onClick={() => setShowPreview(true)} 
                    className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:text-[#2A305A] hover:border-[#2A305A] transition-colors shadow-2xs cursor-pointer"
                >
                    <Eye size={12}/> พรีวิว
                </button>
            </div>
            
            <div className="space-y-1.5 mb-3 text-xs font-medium">
                <div className="flex justify-between items-center text-[#2A305A]/80">
                    <span>รวมค่าสินค้า</span>
                    <span className="text-[#2A305A] font-bold">฿{(itemSubTotal || 0).toLocaleString()}</span>
                </div>
                <div className={`flex justify-between items-center ${manualDiscount > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                    <span>ส่วนลดท้ายบิล</span>
                    <span>{manualDiscount > 0 ? '-' : ''} ฿{(manualDiscount || 0).toLocaleString()}</span>
                </div>
                <div className={`flex justify-between items-center ${promoDiscount > 0 ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                    <span>โปรโมชัน</span>
                    <span>{promoDiscount > 0 ? '-' : ''} ฿{(promoDiscount || 0).toLocaleString()}</span>
                </div>
                <div className={`flex justify-between items-center ${otherFeeAmount === 0 ? 'text-slate-500' : 'text-slate-800 font-semibold'}`}>
                    <span>{activeTab?.otherFeeName || 'ยอดอื่นๆ'}</span>
                    <span>{otherFeeAmount > 0 ? '+' : ''} ฿{(otherFeeAmount || 0).toLocaleString()}</span>
                </div>
                <div className={`flex justify-between items-center ${shippingFee > 0 ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span>ค่าจัดส่ง {shippingFee > 0 && activeTab?.vatOnShipping && '(VAT)'}</span>
                        {onOpenShippingModal ? (
                            <button 
                                type="button" 
                                onClick={onOpenShippingModal} 
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md text-[10px] font-extrabold border border-emerald-300/80 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95" 
                                title="คลิกเพื่อดูหลักการคิดค่าจัดส่ง"
                            >
                                <HelpCircle size={10} className="text-emerald-700"/>
                                <span>หลักการคิดค่าจัดส่ง</span>
                            </button>
                        ) : (
                            <span 
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-extrabold border border-emerald-300/80 shadow-2xs" 
                                title="หลักการคิดค่าจัดส่ง"
                            >
                                <HelpCircle size={10} className="text-emerald-700"/>
                                <span>หลักการคิดค่าจัดส่ง</span>
                            </span>
                        )}
                    </div>
                    <span>{shippingFee > 0 ? '+' : ''} ฿{(shippingFee || 0).toLocaleString()}</span>
                </div>
                <div className={`flex justify-between items-center ${vatAmount > 0 ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span>VAT {activeTab?.vatRate || 7}% ({activeTab?.vatType || '-'})</span>
                        {onOpenVatModal && (
                            <button 
                                type="button" 
                                onClick={onOpenVatModal} 
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md text-[10px] font-extrabold border border-blue-300/80 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95" 
                                title="คลิกเพื่อดูหลักการคิดภาษี"
                            >
                                <HelpCircle size={10} className="text-blue-700"/>
                                <span>หลักการคิดภาษี</span>
                            </button>
                        )}
                    </div>
                    <span>{vatAmount > 0 ? '+' : ''} ฿{(vatAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className={`flex justify-between items-center pt-2 border-t border-slate-300/80 ${walletUsed > 0 ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                    <span>หักจาก DH ค้างยอด</span>
                    <span>{walletUsed > 0 ? '-' : ''} ฿{(walletUsed || 0).toLocaleString()}</span>
                </div>
            </div>
            
            <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs flex flex-col gap-2.5 mt-auto">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">ยอดชำระสุทธิ</span>
                        {earnedPoints > 0 && (
                            <div className="mt-1">
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-950 text-[11px] font-black px-2 py-0.5 rounded-full border border-amber-300/80 shadow-2xs">
                                    🌟 + ได้รับ {earnedPoints.toLocaleString()} Points
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="text-right group cursor-pointer relative" onClick={handleCopyAmount} title="คลิกเพื่อคัดลอกยอดเงิน">
                        <div className="inline-block border-b border-dashed border-slate-300 group-hover:border-slate-800 transition-colors">
                            <span className="text-3xl font-black text-slate-900 leading-none drop-shadow-2xs">
                                ฿{(remainingToPay || 0).toLocaleString()}
                            </span>
                        </div>
                        {copied && (
                            <span className="absolute -top-7 right-0 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow-md animate-in fade-in z-30 whitespace-nowrap">
                                คัดลอกแล้ว!
                            </span>
                        )}
                    </div>
                </div>
                <div className="bg-slate-100/90 border border-slate-300/80 rounded-md px-2.5 py-1 text-center shadow-2xs">
                    <span className="text-xs text-slate-800 font-bold leading-normal block">
                        ({convertToThaiBahtText ? convertToThaiBahtText(remainingToPay) : 'ศูนย์บาทถ้วน'})
                    </span>
                </div>
            </div>
        </div>
    );
}
