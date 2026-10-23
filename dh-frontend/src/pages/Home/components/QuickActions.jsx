import { Link } from 'react-router-dom';
import { LayoutGrid, CalendarCheck, MapPin } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const QuickActions = () => {
  const { showToast } = useToast();
  const actions = [
    {
      id: 'shop-parts',
      title: 'ค้นหาอะไหล่ทั้งหมด',
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
      title: 'ค้นหาบริการช่าง',
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
                onClick={() => showToast('บริการนี้กำลังอยู่ระหว่างการพัฒนา', 'info')}
                className="relative flex flex-row items-center py-3.5 px-4 md:py-4 md:px-5 lg:py-4.5 lg:px-6 bg-[#C8EFD4]/50 rounded-xl border border-[#B3E1C1]/50 shadow-xs cursor-not-allowed group opacity-80 active:scale-95 transition-all duration-300 min-h-[72px] md:min-h-[80px]"
              >
                <div className="mr-4 md:mr-5 shrink-0 opacity-60">
                  {action.icon}
                </div>
                <div className="flex flex-col pr-8">
                  <span className="font-black text-slate-600 text-base md:text-lg lg:text-[19px] tracking-tight leading-tight mb-0.5">
                    {action.title}
                  </span>
                  <span className="text-xs text-slate-500 leading-snug">
                    {action.subtitle}
                  </span>
                </div>
                {/* Badge รอการพัฒนา */}
                <div className="absolute top-2 right-2 md:top-3 md:right-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] md:text-xs font-bold bg-white text-amber-600 shadow-xs border border-amber-200 whitespace-nowrap">
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
              className="flex flex-row items-center py-3.5 px-4 md:py-4 md:px-5 lg:py-4.5 lg:px-6 bg-[#C8EFD4] rounded-xl border border-[#B3E1C1] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-300 group min-h-[72px] md:min-h-[80px]"
            >
              <div className="mr-4 md:mr-5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                {action.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-900 text-base md:text-lg lg:text-[19px] tracking-tight leading-tight mb-0.5">
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
