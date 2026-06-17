import React from 'react';

const HistoryFilterBar = ({ filter, setFilter }) => {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto hide-scrollbar">
      {['all', 'pending', 'processing', 'completed'].map(f => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${filter === f ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          {f === 'all' ? 'ทั้งหมด' : f === 'pending' ? 'รอชำระเงิน' : f === 'processing' ? 'กำลังดำเนินการ' : 'สำเร็จแล้ว'}
        </button>
      ))}
    </div>
  );
};

export default HistoryFilterBar;
