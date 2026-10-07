
const HistoryFilterBar = ({ filter, setFilter }) => {
  return (
    <div className="flex bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/90 w-full sm:w-auto overflow-x-auto hide-scrollbar shadow-inner">
      {['all', 'pending', 'processing', 'completed'].map(f => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filter === f ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/90' : 'text-slate-600 hover:text-slate-900'}`}
        >
          {f === 'all' ? 'ทั้งหมด' : f === 'pending' ? 'รอชำระเงิน' : f === 'processing' ? 'กำลังดำเนินการ' : 'สำเร็จแล้ว'}
        </button>
      ))}
    </div>
  );
};

export default HistoryFilterBar;
