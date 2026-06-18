import React from 'react';
import { ShoppingBag, ShieldAlert } from 'lucide-react';

export default function HistoryInfo({ history, formatCurrency, formatDate }) {
  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      {/* รายการสั่งซื้อ (Orders) */}
      {history?.orders?.length > 0 ? (
        <div>
          <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-3">
            <ShoppingBag size={14} /> ประวัติสั่งซื้อล่าสุด
          </h4>
          {history.orders.slice(0, 3).map(order => (
            <div key={order.id} className="p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center mb-2 shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-700 block">#{order.id.substring(0,8).toUpperCase()}</span>
                <span className="text-[10px] text-slate-400">{formatDate(order.createdAt)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-600 block">฿{formatCurrency(order.totals?.netTotal)}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{order.status}</span>
              </div>
            </div>
          ))}
          {history.orders.length > 3 && (
            <button className="w-full text-center text-[11px] text-indigo-600 hover:text-indigo-800 font-bold py-2 bg-indigo-50/50 rounded-lg mt-1 transition-colors">
              ดูประวัติทั้งหมด ({history.orders.length})
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-xs font-medium text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          ยังไม่มีประวัติการสั่งซื้อ
        </div>
      )}

      {/* รายการเคลม (Claims) */}
      {history?.claims?.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-bold text-rose-500 flex items-center gap-1.5 mb-3">
            <ShieldAlert size={14} /> ประวัติการเคลมสินค้า
          </h4>
          {history.claims.slice(0, 2).map(claim => (
            <div key={claim.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex justify-between items-center text-xs mb-2">
              <span className="font-bold text-rose-700">เคลม #{claim.claimId || claim.id.substring(0,8)}</span>
              <span className="font-bold bg-white text-rose-600 px-2 py-0.5 rounded shadow-sm border border-rose-100/50">
                {claim.status || 'รอดำเนินการ'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
