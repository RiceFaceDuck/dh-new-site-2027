import React from 'react';
import { ArrowRightLeft, Clock, UserCheck, Settings } from 'lucide-react';

export default function DashboardTabs({ activeTab = 'adjust', onTabChange }) {
  // โครงสร้างข้อมูล Tabs ทำให้จัดการและเพิ่มเมนูได้ง่ายในอนาคต
  const TABS = [
    {
      id: 'adjust',
      label: 'เติม/ลด เครดิต',
      icon: ArrowRightLeft,
      description: 'จัดการเครดิตรายบุคคล',
      badge: null // ไม่มีแจ้งเตือน
    },
    {
      id: 'history',
      label: 'ประวัติทำรายการ',
      icon: Clock,
      description: 'ตรวจสอบ Audit Trail',
      badge: 'New' // ตัวอย่าง Badge แบบ Text
    },
    {
      id: 'partners',
      label: 'ยอดพาร์ทเนอร์',
      icon: UserCheck,
      description: 'สรุปยอดแต่ละบุคคล',
      badge: null
    },
    {
      id: 'settings',
      label: 'ตั้งค่าระบบ',
      icon: Settings,
      description: 'จัดการลิมิต & สิทธิ์',
      badge: 2 // ตัวอย่าง Badge แบบตัวเลข
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Scrollable Container สำหรับมือถือ */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex items-center p-2 min-w-max gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange && onTabChange(tab.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                  }
                `}
              >
                {/* Icon พร้อม Animation ตอน Active */}
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>

                {/* Label & Description */}
                <div className="text-left">
                  <div className={`text-sm font-bold leading-none ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                    {tab.label}
                  </div>
                  {/* ซ่อน Description ในจอมือถือเล็กๆ เพื่อประหยัดพื้นที่ */}
                  <div className={`text-[10px] mt-1 hidden sm:block ${isActive ? 'text-blue-500/80' : 'text-slate-400'}`}>
                    {tab.description}
                  </div>
                </div>

                {/* Badge Alerts (ถ้ามี) */}
                {tab.badge && (
                  <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider leading-none shadow-sm
                    ${isActive ? 'bg-blue-600 text-white' : 'bg-rose-500 text-white'}
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Custom CSS สำหรับซ่อน Scrollbar แต่ยังเลื่อนได้ (ฉีดเข้าแบบ Inline หรือไปใส่ใน index.css ก็ได้) */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}