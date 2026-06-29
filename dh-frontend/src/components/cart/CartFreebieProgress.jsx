import React from 'react';
import { Gift } from 'lucide-react';

const CartFreebieProgress = ({ freebies, subTotal, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 md:p-5 mb-8 shadow-sm flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-32"></div>
            <div className="h-3 bg-slate-200 rounded w-24"></div>
          </div>
        </div>
        <div className="w-20 h-6 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

  if (!freebies || freebies.length === 0) return null;

  const nextFreebie = freebies.find(f => f.minSpend > subTotal); 
  const currentFreebie = [...freebies].reverse().find(f => f.minSpend <= subTotal); 

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 md:p-5 mb-8 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 opacity-20 rounded-full -translate-y-1/2 translate-x-1/4"></div>
      
      {nextFreebie ? (
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift className="text-emerald-500 animate-pulse" size={20} />
              <span className="text-xs md:text-sm font-bold text-emerald-800">
                ซื้อเพิ่มอีก <span className="text-emerald-600">฿{(nextFreebie.minSpend - subTotal).toLocaleString()}</span>
              </span>
            </div>
            <span className="text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1.5 rounded-lg shadow-sm border border-emerald-200 transition-colors hover:bg-emerald-200">
              รับฟรี: {nextFreebie.title}
            </span>
          </div>
          <div className="w-full bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000 ease-out relative" 
              style={{ width: `${Math.min((subTotal / nextFreebie.minSpend) * 100, 100)}%` }}
            >
               <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      ) : currentFreebie ? (
        <div className="relative z-10 flex items-center gap-3 animate-fade-in">
           <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
             <Gift className="text-white animate-bounce" size={20} />
           </div>
           <div>
             <p className="text-sm font-bold text-emerald-800">ยินดีด้วย! ยอดสั่งซื้อถึงเกณฑ์รับของแถมแล้ว</p>
             <p className="text-xs text-emerald-600 font-medium mt-0.5">คุณได้รับ: {currentFreebie.title}</p>
           </div>
        </div>
      ) : null}
    </div>
  );
};

export default CartFreebieProgress;
