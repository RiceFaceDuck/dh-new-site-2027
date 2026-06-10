import React, { useState } from 'react';
import { Calculator, Eye } from 'lucide-react';

export default function BillSummary({
    itemSubTotal, manualDiscount, promoDiscount, otherFeeAmount, shippingFee, 
    vatAmount, walletUsed, remainingToPay, earnedPoints, activeTab, 
    setShowPreview, convertToThaiBahtText
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
                <h3 className="text-[var(--dh-primary)] font-black text-sm flex items-center gap-1.5"><Calculator size={16}/> สรุปบิล</h3>
                <button onClick={() => setShowPreview(true)} className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 rounded-sm text-xs font-semibold text-gray-600 hover:text-[var(--dh-primary)] hover:border-[var(--dh-primary)] transition-colors shadow-sm">
                    <Eye size={12}/> พรีวิว
                </button>
            </div>
            
            <div className="space-y-1.5 mb-3 text-xs font-medium">
                <div className="flex justify-between text-[#2A305A]/80"><span>รวมค่าสินค้า</span><span className="text-[#2A305A] font-bold">฿{(itemSubTotal || 0).toLocaleString()}</span></div>
                <div className={`flex justify-between ${manualDiscount > 0 ? 'text-[#F55050] font-bold' : 'text-[#2A305A]/50'}`}><span>ส่วนลดท้ายบิล</span><span>{manualDiscount > 0 ? '-' : ''} ฿{(manualDiscount || 0).toLocaleString()}</span></div>
                <div className={`flex justify-between ${promoDiscount > 0 ? 'text-[var(--dh-accent)] font-bold' : 'text-[#2A305A]/50'}`}><span>โปรโมชัน</span><span>{promoDiscount > 0 ? '-' : ''} ฿{(promoDiscount || 0).toLocaleString()}</span></div>
                <div className={`flex justify-between ${otherFeeAmount !== 0 ? 'text-[#2A305A]' : 'text-[#2A305A]/50'}`}><span>{activeTab.otherFeeName || 'ยอดอื่นๆ'}</span><span>{otherFeeAmount > 0 ? '+' : ''} ฿{(otherFeeAmount || 0).toLocaleString()}</span></div>
                <div className={`flex justify-between ${shippingFee > 0 ? 'text-[#2A305A]' : 'text-[#2A305A]/50'}`}><span>ค่าจัดส่ง {shippingFee > 0 && activeTab.vatOnShipping && '(VAT)'}</span><span>{shippingFee > 0 ? '+' : ''} ฿{(shippingFee || 0).toLocaleString()}</span></div>
                <div className={`flex justify-between ${vatAmount > 0 ? 'text-[#2A305A]' : 'text-[#2A305A]/50'}`}><span>VAT 7% ({activeTab.vatType || '-'})</span><span>{vatAmount > 0 ? '+' : ''} ฿{(vatAmount || 0).toLocaleString()}</span></div>
                <div className={`flex justify-between pt-1.5 border-t border-[#D3DCEB] mt-1.5 ${walletUsed > 0 ? 'text-blue-600 font-bold' : 'text-[#2A305A]/50'}`}><span>หักจาก DH ค้างยอด</span><span>{walletUsed > 0 ? '-' : ''} ฿{(walletUsed || 0).toLocaleString()}</span></div>
            </div>
            
            <div className="flex justify-between items-end pt-3 border-t border-[#D3DCEB] mt-auto">
                <div className="flex flex-col">
                    <span className="text-[#2A305A] text-xs mb-1 font-bold">ยอดชำระสุทธิ</span>
                    <span className="text-xs text-[#2A305A] font-black bg-white/80 border border-[#D3DCEB] px-2 py-0.5 rounded-sm truncate max-w-[120px] shadow-sm">{convertToThaiBahtText(remainingToPay) || 'ศูนย์บาทถ้วน'}</span>
                </div>
                <div className="text-right group cursor-pointer" onClick={handleCopyAmount} title="คลิกเพื่อคัดลอกยอดเงิน">
                    <div className="inline-block border-b border-transparent group-hover:border-[#2A305A]/40 border-dashed transition-colors">
                        <span className="text-3xl font-black text-[#2A305A] leading-none drop-shadow-sm">฿{(remainingToPay || 0).toLocaleString()}</span>
                    </div>
                    {copied && <span className="absolute -translate-y-8 -translate-x-4 text-[10px] bg-[#2A305A] text-white px-2 py-1 rounded shadow animate-in fade-in">คัดลอกแล้ว!</span>}
                    {earnedPoints > 0 && <div className="text-[10px] text-[#2A305A]/70 mt-1 font-semibold">+ ได้รับ {earnedPoints} Points</div>}
                </div>
            </div>
        </div>
    );
}
