import React from 'react';
import { Cpu, MonitorSmartphone, PenTool, Wrench } from 'lucide-react';

// อัปเกรดสีและเอฟเฟกต์ Hover ให้เป็นสไตล์ Tech Dashboard
const categories = [
  { 
    id: 1, 
    name: 'อะไหล่ภายใน', 
    icon: <Cpu size={26} strokeWidth={1.5} />, 
    color: 'text-cyber-blue group-hover:text-white', 
    bg: 'bg-white border-slate-200 group-hover:bg-cyber-blue group-hover:border-cyber-blue group-hover:shadow-[0_0_15px_rgba(14,165,233,0.4)]' 
  },
  { 
    id: 2, 
    name: 'อุปกรณ์ภายนอก', 
    icon: <MonitorSmartphone size={26} strokeWidth={1.5} />, 
    color: 'text-purple-500 group-hover:text-white', 
    bg: 'bg-white border-slate-200 group-hover:bg-purple-500 group-hover:border-purple-500 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
  },
  { 
    id: 3, 
    name: 'เครื่องมือช่าง', 
    icon: <PenTool size={26} strokeWidth={1.5} />, 
    color: 'text-amber-500 group-hover:text-white', 
    bg: 'bg-white border-slate-200 group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
  },
  { 
    id: 4, 
    name: 'บริการรับซ่อม', 
    icon: <Wrench size={26} strokeWidth={1.5} />, 
    color: 'text-cyber-emerald group-hover:text-white', 
    bg: 'bg-white border-slate-200 group-hover:bg-cyber-emerald group-hover:border-cyber-emerald group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
  },
];

const CategoryList = () => {
  return (
    <div className="mb-10 md:mb-16">
      
      {/* Tech Heading */}
      <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight mb-4 px-1 flex items-center">
        <span className="w-1.5 h-5 bg-cyber-emerald rounded-sm mr-3 inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
        หมวดหมู่หลัก
      </h2>
      
      {/* Mobile: แสดงแบบแนวนอนปัดซ้ายขวาได้ (Swipe) พร้อมซ่อน Scrollbar
        Desktop: แสดงผลแบบ Grid 4 ช่อง
      */}
      <div className="flex overflow-x-auto hide-scrollbar md:grid md:grid-cols-4 gap-4 pb-2 md:pb-0 px-1 pt-1">
        {categories.map((cat) => (
          <div key={cat.id} className="flex flex-col items-center cursor-pointer group min-w-[85px] sm:min-w-[100px] md:min-w-0 flex-shrink-0">
            
            {/* Tech Button Box */}
            <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-md border flex items-center justify-center mb-3 shadow-sm transition-all duration-300 ${cat.bg}`}>
              <div className={`transition-colors duration-300 ${cat.color}`}>
                {cat.icon}
              </div>
            </div>
            
            {/* Label */}
            <span className="text-xs sm:text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
              {cat.name}
            </span>
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default CategoryList;