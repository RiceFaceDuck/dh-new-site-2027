import React from 'react';
import { Trophy, TrendingUp, ArrowUpRight } from 'lucide-react';

export const BestSellersPanel = () => {
  // Mocked data for Best Selling Products
  const bestSellers = [
    { id: 1, name: 'Swift 7520 ADAPTER', category: 'Adapter', sales: 124, trend: '+12%' },
    { id: 2, name: 'Predator Neo 16 Screen', category: 'Screen', sales: 98, trend: '+5%' },
    { id: 3, name: 'ASUS ROG Battery', category: 'Battery', sales: 85, trend: '+8%' },
    { id: 4, name: 'Lenovo Legion Keyboard', category: 'Keyboard', sales: 62, trend: '+2%' },
    { id: 5, name: 'Dell XPS 13 Charger', category: 'Adapter', sales: 41, trend: '-1%' },
  ];

  return (
    <div className="bg-dh-surface rounded-md shadow-dh-card border border-dh-border p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-dh-border">
        <div>
          <h3 className="text-xl font-black text-dh-main flex items-center gap-2">
            <Trophy className="text-yellow-500" size={24} strokeWidth={2.5} />
            สินค้าขายดี (Top Sellers)
          </h3>
          <p className="text-xs text-dh-muted mt-1 font-medium">อันดับสินค้าขายดีที่สุดในสัปดาห์นี้</p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 print:hidden">
          <TrendingUp size={20} />
        </div>
      </div>

      <div className="space-y-3">
        {bestSellers.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between p-3.5 rounded-md bg-dh-base border border-dh-border hover:border-yellow-500/50 hover:shadow-md transition-all group cursor-default">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center font-black text-sm shadow-sm ${index === 0 ? 'bg-gradient-to-br from-[#FF9B51] to-yellow-500 text-white border-none' : index === 1 ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-none' : index === 2 ? 'bg-amber-700 text-amber-100 border-none' : 'bg-dh-surface/50 text-dh-muted border border-dh-border'}`}>
                #{index + 1}
              </div>
              <div>
                <h4 className="text-sm font-black text-dh-main group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{item.name}</h4>
                <p className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mt-0.5">{item.category}</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-dh-main">{item.sales}</span>
                <span className="text-[9px] font-bold text-dh-muted uppercase tracking-wider bg-dh-surface px-1.5 py-0.5 rounded border border-dh-border mt-0.5">ชิ้น</span>
              </div>
              <div className={`px-2 py-1 rounded-sm ${item.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} border border-transparent transition-colors`}>
                <span className="text-[10px] font-bold">{item.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
