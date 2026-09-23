import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, RefreshCw, Loader2 } from 'lucide-react';
import useTransactionDetailsData from './hooks/useTransactionDetailsData';
import TransactionMetricsHeader from './components/details/TransactionMetricsHeader';
import TransactionFilterBar from './components/details/TransactionFilterBar';
import TransactionItemizedTable from './components/details/TransactionItemizedTable';
import TransactionGroupedList from './components/details/TransactionGroupedList';

export default function GenerateSyncDetails() {
  const navigate = useNavigate();
  
  const {
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    selectedEventType,
    setSelectedEventType,
    selectedCustomer,
    setSelectedCustomer,
    timeFilter,
    setTimeFilter,
    viewMode,
    setViewMode,
    expandedBills,
    toggleExpandBill,
    filteredTransactions,
    groupedByBill,
    metrics,
    uniqueCustomers,
    isCalculating,
    isInitialReady,
    fetchChanges,
    handleExportCSV
  } = useTransactionDetailsData();

  // 🚀 Navigation handler for transaction IDs
  const handleNavigateToTransaction = (eventCategory, txId) => {
    if (!txId) return;
    const cleanId = String(txId).trim();

    if (eventCategory === 'sale' || cleanId.startsWith('BILL-') || cleanId.startsWith('ORD-') || cleanId.startsWith('BS-') || cleanId.startsWith('DH-')) {
      navigate(`/billing?search=${encodeURIComponent(cleanId)}`);
    } else if (eventCategory === 'claim' || cleanId.startsWith('CLM-') || cleanId.startsWith('TIC-')) {
      navigate(`/claims?search=${encodeURIComponent(cleanId)}`);
    } else if (eventCategory === 'adjust' || cleanId.startsWith('STK-')) {
      navigate(`/managers/inventory-adjustment`);
    } else if (eventCategory === 'price' || cleanId.startsWith('PRC-')) {
      navigate(`/managers/pricing`);
    } else {
      navigate(`/billing?search=${encodeURIComponent(cleanId)}`);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto min-h-screen">
      
      {/* 🔝 Top Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/generate')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all font-semibold flex items-center gap-1.5 text-xs cursor-pointer"
            title="ย้อนกลับ"
          >
            <ArrowLeft size={16} />
            <span>กลับ</span>
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="text-indigo-600 dark:text-indigo-400" size={20} />
              รายละเอียดรายการธุรกรรม (ขาย / เคลม / คืน / ปรับสต็อก)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              จำแนกเลขบิล รายชื่อลูกค้า และความเคลื่อนไหวสต็อกรายชิ้น (Strict Data Gate Engine)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={fetchChanges}
            disabled={isCalculating}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <RefreshCw size={13} className={isCalculating ? 'animate-spin' : ''} />
            <span>รีเฟรช</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download size={13} />
            <span>ดาวน์โหลด CSV</span>
          </button>
        </div>
      </div>

      {/* 📊 Metric Summary Cards */}
      <TransactionMetricsHeader
        metrics={metrics}
        selectedEventType={selectedEventType}
        setSelectedEventType={setSelectedEventType}
        isInitialReady={isInitialReady}
      />

      {/* 🔍 Search & Filters Bar (Single-Line Compact Bar) */}
      <TransactionFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedEventType={selectedEventType}
        setSelectedEventType={setSelectedEventType}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        uniqueCustomers={uniqueCustomers}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* 🛡️ Readiness Guard: Show Skeleton Loading until Gated Data is 100% Ready */}
      {!isInitialReady ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
          <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" size={28} />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            กำลังคัดกรองข้อมูลธุรกรรมตามเงื่อนไขรอบซิงค์...
          </p>
          <p className="text-[11px] text-slate-400">
            Strict Firestore Query Gate active: ดึงเฉพาะข้อมูลที่ถูกต้องจากคลังข้อมูล
          </p>
        </div>
      ) : viewMode === 'itemized' ? (
        <TransactionItemizedTable
          filteredTransactions={filteredTransactions}
          onNavigateToTransaction={handleNavigateToTransaction}
        />
      ) : (
        <TransactionGroupedList
          groupedByBill={groupedByBill}
          expandedBills={expandedBills}
          onToggleExpandBill={toggleExpandBill}
          onNavigateToTransaction={handleNavigateToTransaction}
        />
      )}

    </div>
  );
}
