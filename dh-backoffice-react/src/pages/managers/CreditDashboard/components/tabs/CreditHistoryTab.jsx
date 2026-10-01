import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Loader2, RefreshCw } from 'lucide-react';
import { creditHistoryService } from '../../../../../firebase/creditHistoryService';
import { formatDate } from 'dh-shared/src/utils/formatters/dateFormatter';

export default function CreditHistoryTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ==========================================================
  // ดึงข้อมูลประวัติการทำรายการ (Cursor-Paginated Audit Trail)
  // ==========================================================
  const fetchTransactions = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const data = await creditHistoryService.getCachedCreditTransactions({
        limitCount: 50,
        forceRefresh: force
      });
      setTransactions(data);
      setLastDoc(data.lastDoc || null);
      setHasMore(!!data.hasMore);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreTransactions = async () => {
    if (!lastDoc || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextData = await creditHistoryService.getCachedCreditTransactions({
        limitCount: 50,
        cursor: lastDoc
      });
      setTransactions(prev => [...prev, ...nextData]);
      setLastDoc(nextData.lastDoc || null);
      setHasMore(!!nextData.hasMore);
    } catch (err) {
      console.error('Failed to load more audit records:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTransactions(false);
  }, [fetchTransactions]);

  const isPositiveType = (type) => ['add', 'earn', 'deposit', 'refund'].includes((type || '').toLowerCase());

  // ลอจิกการกรองข้อมูล
  const filteredTransactions = transactions.filter(tx => {
    const q = searchTerm.toLowerCase();
    const matchSearch = (tx.partnerId || tx.uid || '').toLowerCase().includes(q) || 
                        (tx.partnerName || tx.customerName || '').toLowerCase().includes(q) ||
                        (tx.id || tx.transactionId || '').toLowerCase().includes(q) ||
                        (tx.remark || tx.note || '').toLowerCase().includes(q);
    
    let matchType = true;
    if (filterType === 'positive' || filterType === 'add') {
      matchType = isPositiveType(tx.type);
    } else if (filterType === 'negative' || filterType === 'deduct') {
      matchType = !isPositiveType(tx.type);
    }
    return matchSearch && matchType;
  });

  return (
    <div className="flex flex-col h-full bg-white border border-slate-300 rounded-xs">
      
      {/* 🚀 Header & Toolbar: ทรงเหลี่ยม กระชับพื้นที่ */}
      <div className="p-3 border-b border-slate-300 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Transaction Log</h3>
          <p className="text-[11px] text-slate-500">Cached immutable audit trail (Last 100 records)</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search size={14} className="text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search ID, Name, Ref..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xs text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden w-full sm:w-56"
            />
          </div>

          {/* Filter Types */}
          <div className="flex bg-white border border-slate-300 rounded-xs p-0.5">
            <button 
              onClick={() => setFilterType('all')} 
              className={`px-3 py-1 text-xs font-bold rounded-xs transition-none ${
                filterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterType('positive')} 
              className={`px-3 py-1 text-xs font-bold rounded-xs transition-none ${
                filterType === 'positive' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Added (+)
            </button>
            <button 
              onClick={() => setFilterType('negative')} 
              className={`px-3 py-1 text-xs font-bold rounded-xs transition-none ${
                filterType === 'negative' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Deducted (-)
            </button>
          </div>

          {/* Refresh Button */}
          <button 
            onClick={() => fetchTransactions(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xs transition-none disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh Audit Trail"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {/* CSV Export */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xs transition-none ml-auto md:ml-0">
            <Download size={14} />
            CSV
          </button>
        </div>
      </div>

      {/* 🚀 Data Table: แบบดั้งเดิม จัดเต็มพื้นที่ ดูง่าย ระดับองค์กร */}
      <div className="flex-1 overflow-auto max-h-[500px]">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky top-0 bg-slate-100 border-b border-slate-300 z-10">
            <tr className="text-[10px] uppercase tracking-wider text-slate-600">
              <th className="px-4 py-2 font-bold whitespace-nowrap">Date / Time</th>
              <th className="px-4 py-2 font-bold whitespace-nowrap">TX Reference</th>
              <th className="px-4 py-2 font-bold">Target Account</th>
              <th className="px-4 py-2 font-bold whitespace-nowrap">Type</th>
              <th className="px-4 py-2 font-bold text-right whitespace-nowrap">Amount (Pts)</th>
              <th className="px-4 py-2 font-bold text-right whitespace-nowrap">Balance After</th>
              <th className="px-4 py-2 font-bold">Operator</th>
              <th className="px-4 py-2 font-bold">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center text-slate-500">
                  <Loader2 size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                  Fetching Audit Trail...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center text-slate-500 font-medium">
                  No transaction records found.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-none">
                  {/* Date Time */}
                  <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                    {formatDate(tx.timestamp)}
                  </td>
                  
                  {/* TX Ref */}
                  <td className="px-4 py-2.5 font-mono text-slate-400 text-[10px]">
                    {tx.id.substring(0, 10)}...
                  </td>
                  
                  {/* Target Account */}
                  <td className="px-4 py-2.5">
                    <div className="font-bold text-slate-800">
                      {tx.partnerName || tx.customerName || (tx.uid ? `พาร์ทเนอร์ (${tx.uid.substring(0, 8)})` : 'System')}
                    </div>
                    <div className="font-mono text-slate-500 text-[10px]">{tx.partnerId || tx.uid || '-'}</div>
                  </td>
                  
                  {/* Type */}
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-xs border
                      ${isPositiveType(tx.type) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
                    >
                      {(tx.type || 'UNKNOWN').toUpperCase()}
                    </span>
                  </td>
                  
                  {/* Amount */}
                  <td className={`px-4 py-2.5 text-right font-bold whitespace-nowrap ${isPositiveType(tx.type) ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isPositiveType(tx.type) ? '+' : '-'} {Number(Math.abs(tx.amount || 0)).toLocaleString('th-TH')}
                  </td>
                  
                  {/* Balance After */}
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {Number(tx.balanceAfter || 0).toLocaleString('th-TH')}
                  </td>
                  
                  {/* Operator */}
                  <td className="px-4 py-2.5 text-[11px] text-slate-600">
                    {tx.operatorUid || tx.recordedBy || 'System'}
                  </td>
                  
                  {/* Remark */}
                  <td className="px-4 py-2.5 text-[11px] text-slate-500 truncate max-w-[150px]" title={tx.remark || tx.note}>
                    {tx.remark || tx.note || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🚀 Pagination Controls */}
      {hasMore && (
        <div className="p-2.5 border-t border-slate-300 bg-slate-50 text-center">
          <button
            type="button"
            onClick={loadMoreTransactions}
            disabled={isLoadingMore}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {isLoadingMore ? <Loader2 size={13} className="animate-spin text-blue-600" /> : null}
            {isLoadingMore ? 'กำลังโหลดประวัติ...' : 'โหลดประวัติเพิ่มเติม (Load Next 50)'}
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-2 border-t border-slate-300 bg-slate-50 text-[10px] text-slate-500 font-mono text-right uppercase">
        Showing {filteredTransactions.length} of {transactions.length} loaded records {hasMore ? '(More available)' : '// End of Records'}
      </div>
    </div>
  );
}