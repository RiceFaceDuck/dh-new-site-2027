import React from 'react';
import { formatCredit } from '../../../firebase/creditService';
import FreebieDisplayName from './FreebieDisplayName';

const CheckoutSummaryDetails = ({
  cartItems,
  subtotal,
  shippingCost,
  insuranceCost,
  appliedPromotions,
  usedWallet,
  extraDiscountAmount,
  qualifiedFreebies,
  calculatedNetTotal,
}) => {
  return (
    <>
      <div className="space-y-3.5 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <span>1. ยอดรวมสินค้า ({cartItems?.length || 0} รายการ)</span>
          <span className="font-semibold text-gray-900">฿{subtotal.toLocaleString()}</span>
        </div>

        <div className="flex justify-between items-start">
          <span>2. โปรโมชั่น</span>
          <div className="text-right">
            {appliedPromotions.length > 0 ? (
              <div className="flex flex-col gap-1">
                {appliedPromotions.map((promo, idx) => (
                  <span key={idx} className="text-green-600 font-medium flex items-center justify-end gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    {promo.name} (-฿{(promo.discountValue || 0).toLocaleString()})
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400">฿0</span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span>3. ค่าจัดส่ง</span>
          <span className="font-medium text-gray-900">
            ฿{shippingCost.toLocaleString()}
          </span>
        </div>

        {insuranceCost > 0 && (
          <div className="flex justify-between items-center text-amber-600 font-medium animate-in fade-in duration-200">
            <span className="flex items-center gap-1">🛡️ 3.1 ค่าประกันภัยจัดส่ง</span>
            <span>฿{insuranceCost.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span>4. ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
          <span className="text-gray-400 text-xs">รวมในยอดสุทธิแล้ว</span>
        </div>

        <div className="flex justify-between items-center mt-2">
          <span>5. ใช้ยอดเงินคงเหลือ (Wallet)</span>
          <span className={usedWallet > 0 ? "text-indigo-600 font-medium" : "text-gray-400"}>
            {usedWallet > 0 ? `- ฿${formatCredit(usedWallet)}` : '฿0'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span>6. ส่วนลดอื่นๆ</span>
          <span className={extraDiscountAmount > 0 ? "text-green-600 font-medium" : "text-gray-400"}>
            {extraDiscountAmount > 0 ? `- ฿${extraDiscountAmount.toLocaleString()}` : '฿0'}
          </span>
        </div>

        <div className="flex justify-between items-start pt-2 border-t border-dashed border-gray-200 mt-2 gap-2">
          <span className="whitespace-nowrap shrink-0">7. ของแถมที่ได้รับ</span>
          <div className="text-right flex flex-col items-end gap-1 min-w-0">
            {qualifiedFreebies.length > 0 ? (
              qualifiedFreebies.map((freebie, idx) => {
                const qty = freebie.quantity || Math.min(freebie.qty, freebie.maxPerBill || freebie.qty) || 1;
                return (
                  <span key={idx} className="text-emerald-600 font-medium flex items-center justify-end gap-1 max-w-[130px] sm:max-w-[180px]">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    <FreebieDisplayName freebie={freebie} className="truncate" />
                    <span className="shrink-0 ml-0.5">x{qty}</span>
                  </span>
                );
              })
            ) : (
              <span className="text-gray-400">ไม่มีของแถม</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-gray-200 my-5"></div>

      <div className="flex justify-between items-end mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
        <span className="text-base font-bold text-indigo-950">ยอดชำระสุทธิ</span>
        <div className="text-right">
          <span className="text-3xl font-black text-indigo-700">฿{formatCredit(calculatedNetTotal)}</span>
        </div>
      </div>
    </>
  );
};

export default CheckoutSummaryDetails;
