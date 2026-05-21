import React from 'react';

export default function LedgerStatsCards({
  isLoading = false,
  stats = {
    totalUserCredits: 0,
    systemLedgerBalance: 0,
    discrepancy: 0,
    totalPartnersWithCredit: 0
  }
}) {
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('th-TH');
  };

  const isDiscrepancyWarning = stats.discrepancy !== 0;

  return (
    // ปรับให้เป็นการ์ดทรงเหลี่ยมชิด ขอบบาง ไม่มีเงาเยอะๆ
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      
      <div className="bg-white border border-slate-300 rounded-sm p-4">
        <h4 className="text-xs font-semibold text-slate-500 mb-1">Total User Credits</h4>
        {isLoading ? <div className="h-6 w-24 bg-slate-200 animate-pulse"></div> : (
          <h2 className="text-xl font-bold text-slate-800">฿ {formatNumber(stats.totalUserCredits)}</h2>
        )}
      </div>

      <div className="bg-white border border-slate-300 rounded-sm p-4">
        <h4 className="text-xs font-semibold text-slate-500 mb-1">System Ledger</h4>
        {isLoading ? <div className="h-6 w-24 bg-slate-200 animate-pulse"></div> : (
          <h2 className="text-xl font-bold text-slate-800">฿ {formatNumber(stats.systemLedgerBalance)}</h2>
        )}
      </div>

      <div className={`border rounded-sm p-4 ${isDiscrepancyWarning ? 'bg-red-50 border-red-300' : 'bg-white border-slate-300'}`}>
        <h4 className={`text-xs font-semibold mb-1 ${isDiscrepancyWarning ? 'text-red-600' : 'text-slate-500'}`}>Discrepancy</h4>
        {isLoading ? <div className="h-6 w-24 bg-slate-200 animate-pulse"></div> : (
          <h2 className={`text-xl font-bold ${isDiscrepancyWarning ? 'text-red-600' : 'text-emerald-600'}`}>
            {stats.discrepancy === 0 ? 'Match' : `฿ ${formatNumber(stats.discrepancy)}`}
          </h2>
        )}
      </div>

      <div className="bg-white border border-slate-300 rounded-sm p-4">
        <h4 className="text-xs font-semibold text-slate-500 mb-1">Active Accounts</h4>
        {isLoading ? <div className="h-6 w-16 bg-slate-200 animate-pulse"></div> : (
          <h2 className="text-xl font-bold text-slate-800">{formatNumber(stats.totalPartnersWithCredit)}</h2>
        )}
      </div>

    </div>
  );
}