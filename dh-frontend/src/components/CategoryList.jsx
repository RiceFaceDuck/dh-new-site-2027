import React from 'react';
import { Cpu, MonitorSmartphone, PenTool, Wrench } from 'lucide-react';

const categories = [
  { id: 1, name: 'อะไหล่ภายใน', icon: <Cpu size={24} strokeWidth={1.5} />, color: 'text-blue-600 bg-blue-50/50 hover:bg-blue-50 border-blue-100/50' },
  { id: 2, name: 'อุปกรณ์ภายนอก', icon: <MonitorSmartphone size={24} strokeWidth={1.5} />, color: 'text-purple-600 bg-purple-50/50 hover:bg-purple-50 border-purple-100/50' },
  { id: 3, name: 'เครื่องมือช่าง', icon: <PenTool size={24} strokeWidth={1.5} />, color: 'text-amber-600 bg-amber-50/50 hover:bg-amber-50 border-amber-100/50' },
  { id: 4, name: 'บริการรับซ่อม', icon: <Wrench size={24} strokeWidth={1.5} />, color: 'text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100/50' },
];

const CategoryList = () => {
  return (
    <div className="mb-10 md:mb-16">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mb-6 px-1 drop-shadow-sm flex items-center">
        <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3 inline-block"></span>
        หมวดหมู่หลัก
      </h2>
      <div className="grid grid-cols-4 gap-3 sm:gap-5 md:gap-8">
        {categories.map((cat) => (
          <div key={cat.id} className="flex flex-col items-center cursor-pointer group">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-[20px] md:rounded-[24px] flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 group-hover:-translate-y-2 shadow-sm group-hover:shadow-lg border ${cat.color}`}>
              {React.cloneElement(cat.icon, { className: 'w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10' })}
            </div>
            <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-600 group-hover:text-emerald-700 text-center tracking-wide transition-colors">
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;