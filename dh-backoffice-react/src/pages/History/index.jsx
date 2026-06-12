import React from 'react';
import { Loader2 } from 'lucide-react';
import { useHistoryLogs } from './hooks/useHistoryLogs';
import HistoryHeader from './components/HistoryHeader';
import HistoryTable from './components/HistoryTable';
import { exportToCSV } from './utils/historyFormatters';

export default function History() {
  const {
    filteredLogs,
    loading,
    loadingMore,
    searchTerm,
    setSearchTerm,
    moduleFilter,
    setModuleFilter,
    actionFilter,
    setActionFilter,
    dateFilter,
    setDateFilter,
    hasMore,
    loadMore
  } = useHistoryLogs();

  if (loading && filteredLogs.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] font-mono bg-[#002b36] m-2 rounded border border-[#003642]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2aa198] mb-4" />
        <p className="text-[#839496] tracking-widest text-sm">System.init()...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col font-mono bg-[#002b36] p-4 sm:p-6 overflow-hidden z-10">
      
      <HistoryHeader 
        dateFilter={dateFilter} setDateFilter={setDateFilter}
        moduleFilter={moduleFilter} setModuleFilter={setModuleFilter}
        actionFilter={actionFilter} setActionFilter={setActionFilter}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        onExport={() => exportToCSV(filteredLogs)}
      />

      <div className="flex-1 min-h-0 mt-4">
        <HistoryTable 
          filteredLogs={filteredLogs}
          hasMore={hasMore}
          loadMore={loadMore}
          loadingMore={loadingMore}
          searchTerm={searchTerm}
          moduleFilter={moduleFilter}
          actionFilter={actionFilter}
        />
      </div>

    </div>
  );
}
