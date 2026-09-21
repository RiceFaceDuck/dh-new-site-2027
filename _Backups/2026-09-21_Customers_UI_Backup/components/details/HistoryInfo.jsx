import { useState } from 'react';
import { ShoppingBag, ShieldAlert, Loader2, PackageCheck, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

export default function HistoryInfo({ history, formatCurrency, formatDate }) {
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  if (history?.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
        <p className="text-xs font-bold tracking-wide">กำลังดึงประวัติการสั่งซื้อล่าสุด...</p>
      </div>
    );
  }

  const orders = history?.orders || [];
  const claims = history?.claims || [];
  const visibleOrders = showAllOrders ? orders : orders.slice(0, 4);

  const handleCopyOrderId = (e, code) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedOrderId(code);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || '').toLowerCase();
    if (s === 'paid' || s === 'completed' || s === 'success') {
      return { label: 'ชำระแล้ว', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (s === 'approved') {
      return { label: 'อนุมัติแล้ว', class: 'bg-teal-50 text-teal-700 border-teal-200' };
    }
    if (s === 'pending' || s === 'draft') {
      return { label: 'รอดำเนินการ', class: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (s === 'cancelled' || s === 'void' || s === 'deleted') {
      return { label: 'ยกเลิก', class: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    return { label: statusStr || 'ปกติ', class: 'bg-slate-50 text-slate-600 border-slate-200' };
  };

  return (
    <div className="space-y-4 pt-3 border-t border-slate-100">
      {/* รายการสั่งซื้อ (Orders) */}
      {orders.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-indigo-600" /> ประวัติสั่งซื้อล่าสุด ({orders.length} บิล)
            </h4>
          </div>

          <div className="space-y-2">
            {visibleOrders.map(order => {
              const orderCode = order.orderId || order.receiptNumber || order.id;
              const orderDate = order.createdAt || order.timestamp || order.orderDate || order.updatedAt;
              const orderAmount = Number(order.summary?.finalTotal ?? order.finalTotal ?? order.netTotal ?? order.summary?.netTotal ?? order.totals?.netTotal ?? order.totalAmount ?? 0);
              const badge = getStatusBadge(order.status);
              const items = order.items || order.cartItems || [];

              return (
                <div key={order.id} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-all shadow-xs group">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-indigo-700 group-hover:text-indigo-900">
                        #{orderCode}
                      </span>
                      <button
                        onClick={(e) => handleCopyOrderId(e, orderCode)}
                        className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="คัดลอกเลขบิล"
                      >
                        {copiedOrderId === orderCode ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      </button>
                    </div>

                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.class}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* แสดงรายการสินค้าตัวอย่าง */}
                  {items.length > 0 && (
                    <div className="text-[11px] text-slate-600 mb-2 bg-slate-50 p-2 rounded-lg border border-slate-100/80 space-y-0.5">
                      {items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="truncate flex justify-between">
                          <span className="truncate">{item.name || item.sku || 'สินค้า'}</span>
                          <span className="font-mono font-medium text-slate-500 shrink-0 ml-2">x{item.qty || item.quantity || 1}</span>
                        </div>
                      ))}
                      {items.length > 2 && (
                        <p className="text-[10px] text-slate-400 font-medium pt-0.5">
                          + อีก {items.length - 2} รายการ
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-end text-xs border-t border-slate-100 pt-2 mt-1">
                    <span className="text-[11px] text-slate-400">{formatDate(orderDate)}</span>
                    <span className="font-mono font-bold text-indigo-600 text-sm">
                      ฿{formatCurrency(orderAmount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {orders.length > 4 && (
            <button 
              onClick={() => setShowAllOrders(prev => !prev)}
              className="w-full text-center text-[11px] text-indigo-600 hover:text-indigo-800 font-bold py-2 bg-indigo-50/60 hover:bg-indigo-100/60 rounded-xl mt-2 transition-all flex items-center justify-center gap-1 shadow-xs"
            >
              <span>{showAllOrders ? 'ย่อซ่อนประวัติ' : `ดูประวัติทั้งหมด (${orders.length} บิล)`}</span>
              {showAllOrders ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-xs font-medium text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center space-y-1">
          <PackageCheck size={24} className="text-slate-300 mb-1" />
          <p className="font-bold text-slate-600">ยังไม่มีประวัติการสั่งซื้อ</p>
          <p className="text-[11px] text-slate-400">เมื่อมีบิลในระบบ ข้อมูลสั่งซื้อจะแสดงที่นี่อัตโนมัติ</p>
        </div>
      )}

      {/* รายการเคลม (Claims) */}
      {claims.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <h4 className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mb-3">
            <ShieldAlert size={14} /> ประวัติการเคลมสินค้า ({claims.length} รายการ)
          </h4>
          {claims.map(claim => (
            <div key={claim.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex justify-between items-center text-xs mb-2">
              <div>
                <span className="font-bold text-rose-800 block">เคลม #{claim.claimId || claim.id.substring(0,8)}</span>
                <span className="text-[10px] text-rose-500">{formatDate(claim.createdAt)}</span>
              </div>
              <span className="font-bold bg-white text-rose-600 px-2 py-0.5 rounded-md shadow-xs border border-rose-100">
                {claim.status || 'รอดำเนินการ'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
