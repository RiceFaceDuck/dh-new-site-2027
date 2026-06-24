import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, CalendarCheck, MapPin } from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      id: 'shop-parts',
      title: 'SHOP PART CATEGORIES',
      subtitle: 'ค้นหาหมวดหมู่อะไหล่ทั้งหมด',
      icon: <LayoutGrid className="w-8 h-8 md:w-10 md:h-10 text-slate-700" strokeWidth={1.5} />,
      link: '/categories',
      comingSoon: false,
    },
    {
      id: 'book-service',
      title: 'CHECK PARTS ID',
      subtitle: 'เช็ค ID อะไหล่ (ไม่ต้องแกะเครื่อง)',
      icon: <CalendarCheck className="w-8 h-8 md:w-10 md:h-10 text-slate-700" strokeWidth={1.5} />,
      link: '/hardware-scanner',
      comingSoon: false,
    },
    {
      id: 'service-providers',
      title: 'SERVICE PROVIDERS',
      subtitle: 'ค้นหาช่างผู้ให้บริการใกล้คุณ',
      icon: <MapPin className="w-8 h-8 md:w-10 md:h-10 text-slate-700" strokeWidth={1.5} />,
      link: '/providers', 
      comingSoon: false,
    }
  ];

  return (
    <div className="w-full">
      {/* ซ่อนคำว่า Quick Actions ตามแบบ Reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mt-4 md:mt-0">
        {actions.map((action) => {
          if (action.comingSoon) {
            return (
              <div
                key={action.id}
                onClick={() => alert('บริการนี้กำลังอยู่ระหว่างการพัฒนา')}
                className="relative flex flex-row items-center p-4 md:p-5 lg:p-6 bg-[#C8EFD4]/50 rounded-xl border border-[#B3E1C1]/50 shadow-sm cursor-not-allowed group opacity-80"
              >
                <div className="mr-4 md:mr-5 shrink-0 opacity-60">
                  {action.icon}
                </div>
                <div className="flex flex-col pr-8">
                  <span className="font-bold text-slate-600 text-sm md:text-[15px] leading-tight mb-1">
                    {action.title}
                  </span>
                  <span className="text-xs text-slate-500 leading-snug">
                    {action.subtitle}
                  </span>
                </div>
                {/* Badge รอการพัฒนา */}
                <div className="absolute top-2 right-2 md:top-3 md:right-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] md:text-xs font-bold bg-white text-amber-600 shadow-sm border border-amber-200 whitespace-nowrap">
                    รอการพัฒนา
                  </span>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={action.id}
              to={action.link}
              className="flex flex-row items-center p-4 md:p-5 lg:p-6 bg-[#C8EFD4] rounded-xl border border-[#B3E1C1] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="mr-4 md:mr-5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                {action.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 text-sm md:text-[15px] leading-tight mb-1">
                  {action.title}
                </span>
                <span className="text-xs text-slate-600 leading-snug">
                  {action.subtitle}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
