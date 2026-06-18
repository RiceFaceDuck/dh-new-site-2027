import React from 'react';
import { TrendingUp, ShoppingBag } from 'lucide-react';
import WalletDisplay from '../displays/WalletDisplay';
import PointDisplay from '../displays/PointDisplay';

export default function StatsInfo({ customer, formatCurrency }) {
  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      <div className="grid grid-cols-2 gap-4">
        {/* ยอดเงินค้างชำระ (แสดงผล Real-time) */}
        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex flex-col justify-between min-h-[72px]">
          <p className="text-[10px] text-emerald-600 font-bold mb-1 flex items-center gap-1.5">
            <TrendingUp size={12}/> DH ค้างยอด
          </p>
          <div className="text-lg font-black font-mono text-emerald-600">
            <WalletDisplay customerId={customer.id} />
          </div>
        </div>

        {/* เครดิตพอยต์ (แสดงผล Real-time) */}
        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 flex flex-col justify-between min-h-[72px]">
          <p className="text-[10px] text-amber-600 font-bold mb-1 flex items-center gap-1.5">
            <TrendingUp size={12}/> เครดิตพอยต์ (Point)
          </p>
          <div className="text-lg font-black font-mono text-amber-600">
            <PointDisplay customerId={customer.id} />
          </div>
        </div>

        {/* ยอดสั่งซื้อรวม */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
          <p className="text-[10px] text-slate-500 font-bold mb-1 flex items-center gap-1.5">
            <ShoppingBag size={12}/> ยอดสั่งซื้อรวม
          </p>
          <p className="text-lg font-black font-mono text-slate-700">
            {formatCurrency(customer.stats?.totalOrders || 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
