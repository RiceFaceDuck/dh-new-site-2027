import React from 'react';
import MigrationButton from './MigrationButton';

export default function HistoryHeader({
  dateFilter, setDateFilter,
  moduleFilter, setModuleFilter,
  actionFilter, setActionFilter,
  searchTerm, setSearchTerm,
  onExport,
  onGuideOpen
}) {
  return (
    <div className="bg-[#001e26] border border-[#003642] p-4 rounded font-mono text-[#839496] shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        <div className="flex flex-col">
          <span className="text-[#2aa198] font-bold tracking-widest text-lg">~/logs/system_history.log</span>
          <span className="text-[#586e75] text-xs">Daemon active. Awaiting queries...</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-[13px]">
          
          <div className="flex items-center">
            <span className="text-[#b58900] mr-2">--date=</span>
            <input 
              type="date"
              className="bg-[#002b36] border border-[#003642] text-[#839496] outline-none p-1 rounded focus:border-[#2aa198]"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center">
            <span className="text-[#b58900] mr-2">--module=</span>
            <select 
              className="bg-[#002b36] border border-[#003642] text-[#839496] outline-none p-1 rounded focus:border-[#2aa198]"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="all">*</option>
              <option value="Customer">Customer</option>
              <option value="Staff">Staff</option>
              <option value="Inventory">Inventory</option>
              <option value="Order">Billing</option>
              <option value="Claim">Claims</option>
            </select>
          </div>

          <div className="flex items-center hidden sm:flex">
            <span className="text-[#b58900] mr-2">--level=</span>
            <select 
              className="bg-[#002b36] border border-[#003642] text-[#839496] outline-none p-1 rounded focus:border-[#2aa198]"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">*</option>
              <option value="Create">INFO (Create)</option>
              <option value="Update">DBUG (Update)</option>
              <option value="Delete">ERRR (Delete)</option>
            </select>
          </div>

          <div className="flex items-center flex-1 md:flex-none">
            <span className="text-[#b58900] mr-2">| grep</span>
            <input
              type="text"
              className="bg-[#002b36] border border-[#003642] text-[#839496] outline-none p-1 px-2 rounded w-full md:w-48 focus:border-[#2aa198] placeholder-[#586e75]"
              placeholder='"keyword"'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {onExport && (
            <button 
              onClick={onExport}
              className="ml-auto md:ml-2 text-[#2aa198] hover:text-[#fff] hover:bg-[#2aa198] border border-[#2aa198] px-2 py-1 rounded transition-colors"
              title="Export to CSV"
            >
              &gt; export.csv
            </button>
          )}
          <button 
            onClick={onGuideOpen}
            className="text-[#b58900] hover:text-[#fff] hover:bg-[#b58900] border border-[#b58900] px-2 py-1 rounded transition-colors"
            title="คู่มือการใช้งาน"
          >
            &gt; help
          </button>
          <MigrationButton />
        </div>
      </div>
    </div>
  );
}
