import React from 'react';
import { PackageCheck, ShoppingCart, RotateCcw, Wrench, Loader2 } from 'lucide-react';

export default function TransactionMetricsHeader({ metrics, selectedEventType, setSelectedEventType, isInitialReady = true }) {
  const isSaleSelected = selectedEventType === 'sale' || selectedEventType === 'order';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. All & Orders */}
      <button
        onClick={() => setSelectedEventType('all')}
        disabled={!isInitialReady}
        className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
          selectedEventType === 'all'
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-slate-300'
        } ${!isInitialReady ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs font-semibold ${selectedEventType === 'all' ? 'text-indigo-100' : 'text-slate-500'}`}>
            📦 รวมความเคลื่อนไหว
          </span>
          <PackageCheck size={16} className={selectedEventType === 'all' ? 'text-white' : 'text-indigo-500'} />
        </div>
        <p className="text-xl font-black">
          {!isInitialReady ? <Loader2 size={16} className="animate-spin inline-block text-indigo-400" /> : (metrics?.totalCount ?? metrics?.total ?? 0)}{' '}
          <span className="text-xs font-normal">รายการ</span>
        </p>
      </button>

      {/* 2. Sales Orders */}
      <button
        onClick={() => setSelectedEventType('sale')}
        disabled={!isInitialReady}
        className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
          isSaleSelected
            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-slate-300'
        } ${!isInitialReady ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs font-semibold ${isSaleSelected ? 'text-blue-100' : 'text-slate-500'}`}>
            🛒 ออเดอร์ขาย
          </span>
          <ShoppingCart size={16} className={isSaleSelected ? 'text-white' : 'text-blue-500'} />
        </div>
        <p className="text-xl font-black">
          {!isInitialReady ? <Loader2 size={16} className="animate-spin inline-block text-blue-400" /> : (metrics?.orders ?? metrics?.sales ?? 0)}{' '}
          <span className="text-xs font-normal">รายการ</span>
        </p>
      </button>

      {/* 3. Claims & Exchanges */}
      <button
        onClick={() => setSelectedEventType('claim')}
        disabled={!isInitialReady}
        className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
          selectedEventType === 'claim'
            ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/10'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-slate-300'
        } ${!isInitialReady ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs font-semibold ${selectedEventType === 'claim' ? 'text-purple-100' : 'text-slate-500'}`}>
            🔄 เคลม & สลับสินค้า
          </span>
          <RotateCcw size={16} className={selectedEventType === 'claim' ? 'text-white' : 'text-purple-500'} />
        </div>
        <p className="text-xl font-black">
          {!isInitialReady ? <Loader2 size={16} className="animate-spin inline-block text-purple-400" /> : (metrics?.claims ?? 0)}{' '}
          <span className="text-xs font-normal">รายการ</span>
        </p>
      </button>

      {/* 4. Inventory Adjustments */}
      <button
        onClick={() => setSelectedEventType('adjust')}
        disabled={!isInitialReady}
        className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
          selectedEventType === 'adjust'
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/10'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-slate-300'
        } ${!isInitialReady ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs font-semibold ${selectedEventType === 'adjust' ? 'text-emerald-100' : 'text-slate-500'}`}>
            🛠️ ปรับปรุงสต็อก
          </span>
          <Wrench size={16} className={selectedEventType === 'adjust' ? 'text-white' : 'text-emerald-500'} />
        </div>
        <p className="text-xl font-black">
          {!isInitialReady ? <Loader2 size={16} className="animate-spin inline-block text-emerald-400" /> : (metrics?.adjusts ?? metrics?.adjust ?? 0)}{' '}
          <span className="text-xs font-normal">รายการ</span>
        </p>
      </button>
    </div>
  );
}
