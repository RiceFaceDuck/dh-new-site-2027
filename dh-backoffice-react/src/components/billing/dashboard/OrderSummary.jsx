import React from 'react';
import { Ban, CreditCard, Wallet, Tag } from 'lucide-react';

export default function OrderSummary({ selectedOrder, isCancelled, paymentStat, orderStat }) {
    if (!selectedOrder) return null;

    const netTotal = selectedOrder.netTotal || 0;
    const subTotal = selectedOrder.subTotal || netTotal;
    const discount = (selectedOrder.overallDiscount || 0) + (selectedOrder.promoDiscount || 0) + (selectedOrder.discountAmount || 0);
    const shipping = selectedOrder.shippingFee || selectedOrder.shippingCost || 0;
    const walletUsed = selectedOrder.walletUsed || selectedOrder.walletUsedAmount || 0;
    const vat = selectedOrder.vat || selectedOrder.vatAmount || selectedOrder.taxAmount || 0;
    const paymentFee = selectedOrder.paymentFee || selectedOrder.chargeAmount || selectedOrder.feeAmount || 0;
    const otherFees = selectedOrder.otherFees || selectedOrder.extraFee || 0;

    return (
        <div className="flex flex-col md:flex-row h-full bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] rounded-sm shadow-sm overflow-hidden">
            
            {/* Left Side: Order Items */}
            <div className="flex-1 flex flex-col min-w-0 md:border-r border-[var(--dh-border)] bg-white">
                <div className="bg-[var(--dh-bg-base)] px-3 py-2 border-b border-[var(--dh-border)] flex justify-between items-center shrink-0">
                    <h3 className="font-black text-[13px] text-[var(--dh-text-main)]">รายการสินค้า</h3>
                    <span className="text-[10px] font-bold text-[var(--dh-text-muted)] bg-[var(--dh-bg-surface)] px-2 py-0.5 rounded border border-[var(--dh-border)]">
                        {selectedOrder.items?.length || 0} รายการ
                    </span>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--dh-bg-surface)] sticky top-0 border-b border-[var(--dh-border)] z-10">
                            <tr>
                                <th className="px-3 py-1.5 text-[10px] font-bold text-[var(--dh-text-muted)] uppercase w-16">SKU</th>
                                <th className="px-3 py-1.5 text-[10px] font-bold text-[var(--dh-text-muted)] uppercase">สินค้า</th>
                                <th className="px-3 py-1.5 text-[10px] font-bold text-[var(--dh-text-muted)] uppercase text-right w-16">ราคา</th>
                                <th className="px-3 py-1.5 text-[10px] font-bold text-[var(--dh-text-muted)] uppercase text-center w-12">จำนวน</th>
                                <th className="px-3 py-1.5 text-[10px] font-bold text-[var(--dh-text-muted)] uppercase text-right w-20">รวม</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--dh-border)]/50">
                        {selectedOrder.items?.map((item, idx) => {
                            const qty = item.qty || item.quantity || 1;
                            const price = item.price || 0;
                            const isFreebie = price === 0 || item.isFreebie;
                            
                            return (
                                <tr key={idx} className="hover:bg-[var(--dh-bg-base)] transition-colors group">
                                    <td className="px-3 py-1.5 align-middle">
                                        <span className="font-mono text-[9px] text-[var(--dh-text-muted)]">{item.sku || '-'}</span>
                                    </td>
                                    <td className="px-3 py-1.5 align-middle">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-[11px] text-[var(--dh-text-main)] group-hover:text-[var(--dh-accent)] truncate max-w-[150px] lg:max-w-xs" title={item.name}>
                                                {item.name}
                                            </span>
                                            {isFreebie && (
                                                <span className="bg-emerald-500/10 text-emerald-600 px-1 py-0.5 rounded text-[8px] font-black border border-emerald-500/20 shrink-0">ของแถม</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-1.5 align-middle text-right text-[10px] text-[var(--dh-text-muted)]">
                                        {isFreebie ? '-' : `฿${price.toLocaleString()}`}
                                    </td>
                                    <td className="px-3 py-1.5 align-middle text-center text-[10px] font-bold text-[var(--dh-text-main)]">
                                        {qty}
                                    </td>
                                    <td className="px-3 py-1.5 align-middle text-right">
                                        <span className={`font-black text-[11px] ${isFreebie ? 'text-emerald-500' : 'text-[var(--dh-text-main)]'}`}>
                                            {isFreebie ? 'ฟรี' : `฿${(price * qty).toLocaleString()}`}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right Side: Summary Details */}
            <div className="w-full md:w-[280px] lg:w-[320px] bg-[var(--dh-bg-base)] shrink-0 flex flex-col">
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
                        ) : paymentStat === 'paid' || orderStat === 'paid' ? (
                            <div className="text-center text-emerald-600 font-black text-[11px] border border-emerald-500/30 bg-emerald-500/10 py-1.5 rounded-sm flex items-center justify-center gap-1">
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
        </div>
    );
}
