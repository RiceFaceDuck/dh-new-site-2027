import React from 'react';
import { Package, HelpCircle } from 'lucide-react';

export default function WholesaleTable({ cartItems, fetchedData, editedPrices, handlePriceChange, isProcessing }) {
  
  const getWholesalePriceToDisplay = (item, idx) => {
    if (editedPrices[idx] !== undefined && editedPrices[idx] !== '') {
      return Number(editedPrices[idx]);
    }
    if (fetchedData && fetchedData[item.productId] !== undefined) {
      return fetchedData[item.productId];
    }
    if (item.wholesalePrice && item.wholesalePrice < item.price) {
      return item.wholesalePrice;
    }
    return Math.floor(item.price * 0.95);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-4 py-3 border-b dark:border-slate-700">สินค้า (SKU)</th>
              <th className="px-4 py-3 border-b dark:border-slate-700 text-center">จำนวน</th>
              <th className="px-4 py-3 border-b dark:border-slate-700 text-right">ราคาปลีก</th>
              <th className="px-4 py-3 border-b dark:border-slate-700 text-right bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300">
                <div className="flex items-center justify-end gap-1">
                  ราคาส่ง/ชิ้น
                  <span className="group relative cursor-help">
                    <HelpCircle size={14} className="text-blue-400 hover:text-blue-600" />
                    <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg z-10 font-medium normal-case">
                      ราคาที่ดึงจากฐานข้อมูล หากไม่มีจะลดให้ 5% เบื้องต้น (สามารถแก้ไขได้)
                    </span>
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {cartItems.map((item, idx) => {
              const currentPrice = getWholesalePriceToDisplay(item, idx);
              return (
                <tr key={idx} className="hover:bg-white dark:hover:bg-slate-800 transition-colors group">
                  <td className="px-4 py-3 max-w-[200px] truncate">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        {item.image ? <img src={item.image} alt="SKU" className="w-full h-full object-cover rounded-lg" /> : <Package size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{item.sku}</p>
                        <p className="text-[10px] text-slate-500 truncate" title={item.name}>{item.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    x{item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-500 line-through">
                    ฿{item.price?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right bg-blue-50/20 dark:bg-blue-900/5 group-hover:bg-blue-50/50">
                    <div className="flex justify-end items-center relative">
                      <span className="absolute left-2 text-blue-500 font-bold opacity-50">฿</span>
                      <input 
                        type="number" 
                        min="0"
                        value={editedPrices[idx] !== undefined ? editedPrices[idx] : currentPrice}
                        onChange={(e) => handlePriceChange(idx, e.target.value)}
                        disabled={isProcessing}
                        className="w-24 text-right p-1.5 pl-6 border border-blue-200 dark:border-blue-800 rounded bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner disabled:opacity-50"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
