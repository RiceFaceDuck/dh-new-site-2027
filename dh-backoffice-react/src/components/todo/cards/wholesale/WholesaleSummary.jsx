import React from 'react';

export default function WholesaleSummary({ 
  calculations, 
  extraManualDiscount, 
  setExtraManualDiscount, 
  totals, 
  shippingCost, 
  appliedPromotions, 
  qualifiedFreebies, 
  totalWebDiscount, 
  usedPoints, 
  usedWallet, 
  isProcessing 
}) {
  
  const {
    retailSubtotal,
    wholesaleSubtotal,
    itemLevelDiscount,
    originalNetTotal,
    newNetTotal
  } = calculations;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {/* ฝั่งซ้าย: ข้อมูล Promotion เดิมที่ลูกค้ากดมา */}
      <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50 text-sm flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-orange-800 dark:text-orange-400 mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
            🛒 ข้อมูลบิลเดิม (Retail)
          </h4>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
            <li className="flex justify-between">
              <span>ราคาสินค้ารวม (Retail)</span>
              <span className="font-medium">฿{retailSubtotal.toLocaleString()}</span>
            </li>
            
            {appliedPromotions.length > 0 && (
              <li className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>คูปอง ({appliedPromotions.map(p => p.code).join(', ')})</span>
                <span>-฿{appliedPromotions.reduce((sum, p) => sum + (p.discountValue || 0), 0).toLocaleString()}</span>
              </li>
            )}

            {totals?.discountAmount > 0 && appliedPromotions.length === 0 && (
              <li className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>ส่วนลดแคมเปญ</span>
                <span>-฿{totals.discountAmount.toLocaleString()}</span>
              </li>
            )}
            
            {shippingCost > 0 ? (
              <li className="flex justify-between text-slate-500">
                <span>ค่าจัดส่ง</span>
                <span>+฿{shippingCost.toLocaleString()}</span>
              </li>
            ) : (
              <li className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>ค่าจัดส่ง (ส่งฟรี)</span>
                <span>฿0</span>
              </li>
            )}

            {(usedPoints > 0 || usedWallet > 0) && (
              <li className="flex justify-between text-purple-600 dark:text-purple-400 pt-1 border-t border-orange-200/50">
                <span>ใช้ DH Point / Wallet</span>
                <span>-฿{(usedPoints + usedWallet).toLocaleString()}</span>
              </li>
            )}
          </ul>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-orange-200 dark:border-orange-800/50">
          <span className="font-bold text-slate-700 dark:text-slate-200">ยอดสุทธิเดิม</span>
          <span className="font-black text-lg text-slate-800 dark:text-white">฿{originalNetTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* ฝั่งขวา: สรุปราคาส่งใหม่ */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div>
          <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5 relative z-10">
            ✨ สรุปยอดใหม่ (Wholesale)
          </h4>
          <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 relative z-10 text-sm">
            <li className="flex justify-between">
              <span>ราคาสินค้ารวม (Wholesale)</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">฿{wholesaleSubtotal.toLocaleString()}</span>
            </li>

            <li className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs">
              <span>ประหยัดจากราคาปลีกไปแล้ว</span>
              <span className="font-bold">-฿{itemLevelDiscount.toLocaleString()}</span>
            </li>

            <li className="flex justify-between text-rose-500">
              <span>หักส่วนลดเว็บออกทั้งหมด</span>
              <span>-฿{totalWebDiscount.toLocaleString()}</span>
            </li>

            <li className="flex justify-between items-center bg-white/60 dark:bg-slate-800/60 p-1.5 rounded-lg border border-blue-100 dark:border-blue-800/50 mt-1">
              <span className="text-blue-800 dark:text-blue-300 font-bold text-xs">ลดเพิ่มพิเศษ (บาท)</span>
              <div className="flex items-center relative">
                <span className="absolute left-2 text-blue-500 font-bold text-xs opacity-50">-฿</span>
                <input 
                  type="number" 
                  min="0"
                  value={extraManualDiscount || ''}
                  onChange={(e) => setExtraManualDiscount(e.target.value)}
                  disabled={isProcessing}
                  placeholder="0"
                  className="w-20 text-right p-1 pl-5 border border-blue-200 dark:border-blue-700 rounded bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 font-bold text-xs focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                />
              </div>
            </li>

            {(usedPoints > 0 || usedWallet > 0) && (
              <li className="flex justify-between text-purple-600 dark:text-purple-400 text-xs">
                <span>ลูกค้าใช้แต้ม/กระเป๋าเงินลดไป</span>
                <span>-฿{(usedPoints + usedWallet).toLocaleString()}</span>
              </li>
            )}

            <li className="flex justify-between text-slate-500 text-xs">
              <span>บวกค่าจัดส่งเดิม</span>
              <span>+฿{shippingCost.toLocaleString()}</span>
            </li>
          </ul>
        </div>
        
        <div className="flex justify-between items-end mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 relative z-10">
          <div className="flex flex-col">
            <span className="font-bold text-blue-900 dark:text-blue-300">ยอดชำระใหม่สุทธิ</span>
            {newNetTotal < originalNetTotal && (
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                ลดลง ฿{(originalNetTotal - newNetTotal).toLocaleString()}
              </span>
            )}
            {newNetTotal > originalNetTotal && (
              <span className="text-[10px] text-rose-600 font-bold bg-rose-100 dark:bg-rose-900/30 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                แพงขึ้น ฿{(newNetTotal - originalNetTotal).toLocaleString()} ⚠️
              </span>
            )}
          </div>
          <span className="font-black text-2xl text-blue-600 dark:text-blue-400 tracking-tight">
            ฿{newNetTotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
