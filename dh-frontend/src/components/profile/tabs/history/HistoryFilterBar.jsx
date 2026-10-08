
const HistoryFilterBar = ({ filter, setFilter }) => {
  return (
    <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-700/80 shadow-inner w-full sm:w-auto overflow-x-auto hide-scrollbar gap-1.5">
      {[
        { key: 'all', label: 'ทั้งหมด' },
        { key: 'pending', label: 'รอชำระเงิน' },
        { key: 'processing', label: 'กำลังดำเนินการ' },
        { key: 'completed', label: 'สำเร็จแล้ว' }
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setFilter(key)}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer ${
            filter === key
              ? 'bg-amber-400 text-slate-950 shadow-md font-black hover:bg-amber-300 active:scale-95'
              : 'text-slate-300 bg-slate-800/80 border border-slate-700/60 hover:text-white hover:bg-slate-700 hover:border-slate-600 active:scale-95'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default HistoryFilterBar;
