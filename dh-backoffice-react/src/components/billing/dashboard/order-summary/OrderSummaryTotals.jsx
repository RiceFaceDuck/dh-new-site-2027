import React from 'react';
import { Ban, Wallet, Tag } from 'lucide-react';

export default function OrderSummaryTotals({
    subTotal,
    discount,
    shipping,
    paymentFee,
    otherFees,
    vat,
    walletUsed,
    netTotal,
    isCancelled,
    paymentStat,
    orderStat
}) {
    console.log("OrderSummaryTotals rendered with:", { paymentStat, orderStat });
    return (
        <div className="w-full md:w-[280px] lg:w-[320px] bg-[var(--dh-bg-base)] shrink-0 flex flex-col h-full">
            <div className="bg-[var(--dh-bg-surface)] px-3 py-2 border-b border-[var(--dh-border)] shrink-0">
                <h3 className="font-black text-[13px] text-[var(--dh-text-main)]">สรุปยอดชำระ</h3>
            </div>
            
            <div className="p-4 flex-1 flex flex-col justify-end space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-[11px] text-[var(--dh-text-muted)] font-bold">
                        <span>มูลค่าสินค้ารวม</span>
                        <span>฿{subTotal.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-[11px] text-rose-500 font-bold items-center">
                            <span className="flex items-center gap-1"><Tag size={12}/> ส่วนลดรวม</span>
                            <span>-฿{discount.toLocaleString()}</span>
                        </div>
                    )}
                    {shipping > 0 && (
                        <div className="flex justify-between text-[11px] text-[var(--dh-text-muted)] font-bold">
                            <span>ค่าจัดส่ง</span>
                            <span>฿{shipping.toLocaleString()}</span>
                        </div>
                    )}
                    {paymentFee > 0 && (
                        <div className="flex justify-between text-[11px] text-[var(--dh-text-muted)] font-bold">
                            <span>ค่าธรรมเนียมชำระเงิน</span>
                            <span>฿{paymentFee.toLocaleString()}</span>
                        </div>
                    )}
                    {otherFees > 0 && (
                        <div className="flex justify-between text-[11px] text-[var(--dh-text-muted)] font-bold">
                            <span>ค่าใช้จ่ายอื่นๆ</span>
                            <span>฿{otherFees.toLocaleString()}</span>
                        </div>
                    )}
                    {vat > 0 && (
                        <div className="flex justify-between text-[11px] text-[var(--dh-text-muted)] font-bold">
                            <span>ภาษีมูลค่าเพิ่ม (VAT)</span>
                            <span>฿{vat.toLocaleString()}</span>
                        </div>
                    )}
                    {walletUsed > 0 && (
                        <div className="flex justify-between text-[11px] text-purple-500 font-bold items-center">
                            <span className="flex items-center gap-1"><Wallet size={12}/> ใช้ Wallet ชำระ</span>
                            <span>-฿{walletUsed.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <div className="pt-3 border-t-2 border-[var(--dh-border)] border-dashed">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-[12px] font-black text-[var(--dh-text-muted)] uppercase tracking-wider">ยอดชำระสุทธิ</div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[var(--dh-text-muted)] font-bold text-[10px]">THB</span>
                            <span className="font-black text-2xl tracking-tight text-[var(--dh-text-main)]">
                                ฿{(netTotal - walletUsed).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    {isCancelled ? (
                        <div className="text-center text-rose-600 font-black text-[11px] border border-rose-500/30 bg-rose-500/10 py-1.5 rounded-sm flex items-center justify-center gap-1 dh-glow">
                            <Ban size={12}/> บิลยกเลิก (VOIDED)
                        </div>
                    ) : orderStat === 'completed' ? (
                        <div className="text-center text-blue-600 font-black text-[11px] border border-blue-500/30 bg-blue-500/10 py-1.5 rounded-sm flex items-center justify-center gap-1 dh-glow">
                            เสร็จสิ้น
                        </div>
                    ) : orderStat === 'approved' ? (
                        <div className="text-center text-emerald-600 font-black text-[11px] border border-emerald-500/30 bg-emerald-500/10 py-1.5 rounded-sm flex items-center justify-center gap-1 dh-glow">
                            อนุมัติ / หักสต็อกแล้ว
                        </div>
                    ) : paymentStat === 'paid' || orderStat === 'paid' ? (
                        <div className="text-center text-teal-600 font-black text-[11px] border border-teal-500/30 bg-teal-500/10 py-1.5 rounded-sm flex items-center justify-center gap-1">
                            ชำระเงินเรียบร้อย
                        </div>
                    ) : (
                        <div className="text-center text-orange-600 font-black text-[11px] border border-orange-500/30 bg-orange-500/10 py-1.5 rounded-sm flex items-center justify-center gap-1">
                            รอการชำระเงิน
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
