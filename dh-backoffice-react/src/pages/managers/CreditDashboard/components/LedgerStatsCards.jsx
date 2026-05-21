import React from 'react';
import { Coins, Database, AlertTriangle, Users, TrendingUp, ShieldCheck } from 'lucide-react';

export default function LedgerStatsCards({
  isLoading = false,
  stats = {
    totalUserCredits: 1250000,
    systemLedgerBalance: 1250000,
    discrepancy: 0,
    totalPartnersWithCredit: 145,
    lastUpdated: new Date().toLocaleTimeString()
  }
}) {

  // Helper สำหรับจัดฟอร์แมตตัวเลข
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '---';
    return num.toLocaleString('th-TH');
  };

  // เช็คสถานะยอดเงินตรงกันหรือไม่
  const isDiscrepancyWarning = stats.discrepancy !== 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Total User Credits */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total User Credits</h4>
            <span className="text-[11px] text-slate-400">ยอดรวมเครดิตลูกค้าทั้งหมด</span>
          </div>
        </div>
        <div className="flex items-end gap-2">
          {isLoading ? (
            <div className="h-8 w-32 bg-slate-100 rounded animate-pulse"></div>
          ) : (
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              ฿{formatNumber(stats.totalUserCredits)}
            </h2>
          )}
        </div>
      </div>

      {/* 2. System Ledger Balance */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Database size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Ledger</h4>
            <span className="text-[11px] text-slate-400">ยอดอ้างอิงในระบบส่วนกลาง</span>
          </div>
        </div>
        <div className="flex items-end gap-2">
          {isLoading ? (
            <div className="h-8 w-32 bg-slate-100 rounded animate-pulse"></div>
          ) : (
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              ฿{formatNumber(stats.systemLedgerBalance)}
            </h2>
          )}
        </div>
      </div>

      {/* 3. Discrepancy (กล่องนี้จะ Alert อัตโนมัติถ้ายอดไม่ตรงกัน) */}
      <div className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 relative overflow-hidden group
        ${isDiscrepancyWarning 
          ? 'bg-rose-50 border-rose-300 hover:shadow-rose-100 shadow-md' 
          : 'bg-white border-slate-200 hover:shadow-md hover:border-emerald-200'}`}
      >
        {isDiscrepancyWarning && (
          <div className="absolute top-0 right-0 w-full h-1 bg-rose-500 animate-pulse"></div>
        )}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
            ${isDiscrepancyWarning ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}
          >
            {isDiscrepancyWarning ? <AlertTriangle size={20} strokeWidth={2.5} /> : <ShieldCheck size={20} strokeWidth={2.5} />}
          </div>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDiscrepancyWarning ? 'text-rose-700' : 'text-slate-500'}`}>
              Discrepancy Check
            </h4>
            <span className={`text-[11px] ${isDiscrepancyWarning ? 'text-rose-500' : 'text-slate-400'}`}>
              ส่วนต่างยอดเงิน (ต้องเป็น 0)
            </span>
          </div>
        </div>
        <div className="flex items-end gap-2">
          {isLoading ? (
            <div className="h-8 w-16 bg-slate-100 rounded animate-pulse"></div>
          ) : (
            <h2 className={`text-2xl font-black tracking-tight ${isDiscrepancyWarning ? 'text-rose-600' : 'text-emerald-600'}`}>
              {stats.discrepancy === 0 ? 'Match' : `฿${formatNumber(stats.discrepancy)}`}
            </h2>
          )}
        </div>
      </div>

      {/* 4. Total Partners with Credit */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Coins size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Accounts</h4>
            <span className="text-[11px] text-slate-400">จำนวนพาร์ทเนอร์ที่มีเครดิต</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {isLoading ? (
            <div className="h-8 w-16 bg-slate-100 rounded animate-pulse"></div>
          ) : (
            <>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {formatNumber(stats.totalPartnersWithCredit)} <span className="text-sm font-medium text-slate-500">บัญชี</span>
              </h2>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-md">
                <TrendingUp size={12} />
                Live
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}