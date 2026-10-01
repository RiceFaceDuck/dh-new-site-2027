export default function LedgerStatsCards({
  isLoading = false,
  stats = {
    totalUserCredits: 0,
    systemLedgerBalance: 0,
    systemPoolMax: 10000000,
    remainingPool: 10000000,
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      
      {/* 1. Total Credits */}
      <div className="bg-white border border-slate-300 rounded-xs p-4 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-500 mb-1">เครดิตทั้งหมดที่ลูกค้าถือ (Total Credits)</h4>
          {isLoading ? (
            <div className="h-6 w-24 bg-slate-200 animate-pulse"></div>
          ) : (
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-bold text-slate-800">{formatNumber(stats.totalUserCredits)} Pts</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                {formatNumber(stats.totalPartnersWithCredit)} Active
              </span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-2 font-medium">ยอดภาระหนี้สินรวมในระบบ</p>
      </div>

      {/* 2. Remaining Pool */}
      <div className="bg-white border border-slate-300 rounded-xs p-4 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-500 mb-1">เครดิตที่เหลืออยู่ (Remaining Pool)</h4>
          {isLoading ? (
            <div className="h-6 w-24 bg-slate-200 animate-pulse"></div>
          ) : (
            <h2 className="text-xl font-bold text-emerald-600">{formatNumber(stats.remainingPool)} Pts</h2>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-2 font-medium">งบกองกลางคงเหลือพร้อมแจก</p>
      </div>

      {/* 3. Total System Pool */}
      <div className="bg-white border border-slate-300 rounded-xs p-4 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-500 mb-1">เครดิตทั้งสิ้น (Total System Pool)</h4>
          {isLoading ? (
            <div className="h-6 w-24 bg-slate-200 animate-pulse"></div>
          ) : (
            <h2 className="text-xl font-bold text-slate-800">{formatNumber(stats.systemPoolMax)} Pts</h2>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-2 font-medium">เพดานความปลอดภัยกองกลาง</p>
      </div>

      {/* 4. Discrepancy Status */}
      <div className={`border rounded-xs p-4 flex flex-col justify-between ${isDiscrepancyWarning ? 'bg-red-50 border-red-300' : 'bg-white border-slate-300'}`}>
        <div>
          <h4 className={`text-xs font-semibold mb-1 ${isDiscrepancyWarning ? 'text-red-600' : 'text-slate-500'}`}>
            สถานะผลต่างทางบัญชี (Discrepancy)
          </h4>
          {isLoading ? (
            <div className="h-6 w-24 bg-slate-200 animate-pulse"></div>
          ) : (
            <h2 className={`text-xl font-bold ${isDiscrepancyWarning ? 'text-red-600' : 'text-emerald-600'}`}>
              {stats.discrepancy === 0 ? 'ตรงกัน (Match)' : `${formatNumber(stats.discrepancy)} Pts`}
            </h2>
          )}
        </div>
        <p className={`text-[11px] mt-2 font-medium ${isDiscrepancyWarning ? 'text-red-500' : 'text-emerald-600'}`}>
          {stats.discrepancy === 0 ? '✓ ตรวจสอบความถูกต้องสมบูรณ์' : '⚠ พบยอดคลาดเคลื่อนในระบบ'}
        </p>
      </div>

    </div>
  );
}