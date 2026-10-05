import { Ban, Wallet, Tag } from 'lucide-react';

const formatCurrency = (amount) => {
    const num = Number(amount || 0);
    const rounded = Math.round(num * 100) / 100;
    return rounded.toLocaleString('th-TH', { 
        minimumFractionDigits: rounded % 1 !== 0 ? 1 : 0, 
        maximumFractionDigits: 2 
    });
};

export default function OrderSummaryTotals({
    subTotal,
    discount,
    shipping,
    paymentFee,
    otherFees,
    otherFeeName = '',
    vat,
    walletUsed = 0,
    pointsUsed = 0,
    netTotal,
    isCancelled,
    paymentStat,
    orderStat
}) {
    const totalDeducted = (Number(walletUsed) || 0) + (Number(pointsUsed) || 0);
    const payableAmount = Math.max(0, (Number(netTotal) || 0) - totalDeducted);

    return (
        <div className="w-full md:w-[280px] lg:w-[320px] bg-(--dh-bg-base) shrink-0 flex flex-col h-full">
            <div className="bg-(--dh-bg-surface) px-3 py-2 border-b border-(--dh-border) shrink-0">
                <h3 className="font-black text-[13px] text-(--dh-text-main)">สรุปยอดชำระ</h3>
            </div>
            
            <div className="p-4 flex-1 flex flex-col justify-end space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-[11px] text-(--dh-text-muted) font-bold">
                        <span>มูลค่าสินค้ารวม</span>
                        <span>฿{formatCurrency(subTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-rose-500 font-bold items-center">
                        <span className="flex items-center gap-1" title="รวมส่วนลดทั้งหมด (โปรโมชั่น, คูปอง)"><Tag size={12}/> ส่วนลดรวม <span className="cursor-help text-gray-300">?</span></span>
                        <span>-฿{formatCurrency(discount)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-(--dh-text-muted) font-bold">
                        <span className="flex items-center gap-1" title="ค่าบริการจัดส่งสินค้า">ค่าจัดส่ง</span>
                        <span>฿{formatCurrency(shipping)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-(--dh-text-muted) font-bold">
                        <span className="flex items-center gap-1" title="ค่าธรรมเนียมจากการรูดบัตร หรือบริการชำระเงินอื่นๆ">ค่าธรรมเนียมชำระเงิน</span>
                        <span>฿{formatCurrency(paymentFee)}</span>
                    </div>
                    {otherFees > 0 && (
                        <div className="flex justify-between text-[11px] text-(--dh-text-muted) font-bold">
                            <span className="flex items-center gap-1" title={otherFeeName || "ยอดเรียกเก็บเพิ่มเติม (ถ้ามี)"}>
                                {otherFeeName.includes('ประกัน') ? '🛡️ ' : ''}{otherFeeName || 'ค่าใช้จ่ายอื่นๆ'}
                            </span>
                            <span>฿{formatCurrency(otherFees)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-[11px] text-(--dh-text-muted) font-bold">
                        <span className="flex items-center gap-1" title="ภาษีมูลค่าเพิ่ม 7% (คำนวณจากยอดสินค้าหักส่วนลด)">ภาษีมูลค่าเพิ่ม (VAT) <span className="cursor-help text-gray-300">?</span></span>
                        <span>฿{formatCurrency(vat)}</span>
                    </div>
                    {walletUsed > 0 && (
                        <div className="flex justify-between text-[11px] text-purple-500 font-bold items-center">
                            <span className="flex items-center gap-1" title="ยอดเงินคงเหลือจากกระเป๋าเงินลูกค้า"><Wallet size={12}/> ใช้ Wallet ชำระ</span>
                            <span>-฿{formatCurrency(walletUsed)}</span>
                        </div>
                    )}
                    {(pointsUsed > 0 || walletUsed === 0) && (
                        <div className="flex justify-between text-[11px] text-purple-500 font-bold items-center">
                            <span className="flex items-center gap-1" title="ยอดส่วนลดจากการใช้คะแนนสะสม"><Wallet size={12}/> ใช้ พ้อยท์ ชำระ</span>
                            <span>-฿{formatCurrency(pointsUsed)}</span>
                        </div>
                    )}
                </div>

                <div className="pt-3 border-t-2 border-(--dh-border) border-dashed space-y-1.5">
                    {/* แถวยอดรวมมูลค่าบิล (Order Value) */}
                    <div className="flex items-center justify-between text-xs font-bold text-(--dh-text-muted)">
                        <span>ยอดรวมมูลค่าบิล (Order Value)</span>
                        <span className="font-black text-(--dh-text-main)">฿{formatCurrency(netTotal)}</span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <div className="text-[12px] font-black text-(--dh-text-main) uppercase tracking-wider">
                            {totalDeducted > 0 && payableAmount > 0 ? 'เงินสดต้องชำระเพิ่ม' : 'ยอดชำระสุทธิ'}
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-(--dh-text-muted) font-bold text-[10px]">THB</span>
                            <span className={`font-black text-2xl tracking-tight ${totalDeducted > 0 && payableAmount === 0 ? 'text-teal-600' : 'text-(--dh-text-main)'}`}>
                                ฿{formatCurrency(payableAmount)}
                            </span>
                        </div>
                    </div>

                    {isCancelled ? (
                        <div className="text-center text-rose-600 font-black text-[11px] border border-rose-500/30 bg-rose-500/10 py-1.5 rounded-xs flex items-center justify-center gap-1 dh-glow">
                            <Ban size={12}/> บิลยกเลิก (VOIDED)
                        </div>
                    ) : orderStat === 'completed' ? (
                        <div className="text-center text-blue-600 font-black text-[11px] border border-blue-500/30 bg-blue-500/10 py-1.5 rounded-xs flex items-center justify-center gap-1 dh-glow">
                            เสร็จสิ้น
                        </div>
                    ) : orderStat === 'approved' ? (
                        <div className="text-center text-emerald-600 font-black text-[11px] border border-emerald-500/30 bg-emerald-500/10 py-1.5 rounded-xs flex items-center justify-center gap-1 dh-glow">
                            อนุมัติ / หักสต็อกแล้ว
                        </div>
                    ) : paymentStat === 'paid' || orderStat === 'paid' ? (
                        <div className="text-center text-teal-600 font-black text-[11px] border border-teal-500/30 bg-teal-500/10 py-1.5 rounded-xs flex items-center justify-center gap-1">
                            โอนแล้ว / หักสต็อกแล้ว
                        </div>
                    ) : (
                        <div className="text-center text-orange-600 font-black text-[11px] border border-orange-500/30 bg-orange-500/10 py-1.5 rounded-xs flex items-center justify-center gap-1">
                            รอการชำระเงิน
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
