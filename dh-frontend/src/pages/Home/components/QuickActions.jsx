import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import partsToolboxImg from '../../../assets/parts-toolbox-3d.png';
import aiSparklesImg from '../../../assets/ai-sparkles-3d.png';
import serviceMapPinImg from '../../../assets/service-map-pin.png';

const QuickActions = () => {
  const { showToast } = useToast();
  const actions = [
    {
      id: 'shop-parts',
      title: 'ค้นหาอะไหล่ทั้งหมด',
      subtitle: 'ค้นหาหมวดหมู่อะไหล่ทั้งหมด',
      icon: (
        <img
          src={partsToolboxImg}
          alt="Parts Catalog"
          className="w-9 h-9 md:w-11 md:h-11 object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] filter transition-transform duration-300 group-hover:scale-105"
        />
      ),
      link: '/categories',
      comingSoon: false,
    },
    {
      id: 'book-service',
      title: 'AI Search & โปรแกรมเช็ค ID',
      subtitle: 'AI Intelligent Scan • สแกนและเทียบอะไหล่',
      titleClass: 'text-[16px] md:text-[17.5px] lg:text-[19.5px]',
      subtitleClass: 'text-[11px] md:text-xs',
      icon: (
        <img
          src={aiSparklesImg}
          alt="AI Sparkles"
          className="w-9 h-9 md:w-11 md:h-11 object-contain shrink-0 drop-shadow-[0_3px_5px_rgba(160,100,0,0.3)] filter transition-transform duration-300 group-hover:scale-105"
        />
      ),
      link: '/hardware-scanner',
      comingSoon: false,
    },
    {
      id: 'service-providers',
      title: 'ค้นหาบริการ ทั้งหมด',
      subtitle: 'ค้นหาช่าง ผู้ให้บริการ อื่นๆ ได้ที่นี่',
      icon: (
        <img
          src={serviceMapPinImg}
          alt="Service Providers"
          className="w-9 h-9 md:w-11 md:h-11 object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] filter transition-transform duration-300 group-hover:scale-105"
        />
      ),
      link: '/providers', 
      comingSoon: false,
    }
  ];

  return (
    <div className="w-full">
      {/* ซ่อนคำว่า Quick Actions ตามแบบ Reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mt-4 md:mt-0 items-stretch">
        {actions.map((action) => {
          if (action.comingSoon) {
            return (
              <div
                key={action.id}
                onClick={() => showToast('บริการนี้กำลังอยู่ระหว่างการพัฒนา', 'info')}
                className="relative flex flex-row items-center py-3.5 px-4 md:py-4 md:px-5 lg:py-4.5 lg:px-6 bg-[#C8EFD4]/50 rounded-xl border border-[#B3E1C1]/50 shadow-xs cursor-not-allowed group opacity-80 active:scale-95 transition-all duration-300 min-h-[72px] md:min-h-[80px] h-full overflow-hidden"
              >
                <div className="mr-4 md:mr-5 shrink-0 opacity-60">
                  {action.icon}
                </div>
                <div className="flex flex-col pr-8">
                  <span className="font-black text-slate-600 text-lg md:text-[19px] lg:text-[21px] tracking-tight leading-tight mb-0.5">
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
              className="relative flex flex-row items-center py-3.5 px-4 md:py-4 md:px-5 lg:py-4.5 lg:px-6 bg-gradient-to-br from-[#D8F6E0] via-[#C8EFD4] to-[#BDE9CB] rounded-xl border border-[#AEE2BE] shadow-[0_5px_18px_rgba(16,75,42,0.14),0_2px_4px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.85)] hover:shadow-[0_10px_26px_rgba(16,75,42,0.20),0_3px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-300 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 group min-h-[72px] md:min-h-[80px] h-full overflow-hidden"
            >
              {/* Texture ลายจุดเทคระดับความชัดพอดีตา (Sweet Spot) */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.10] group-hover:opacity-[0.15] transition-opacity duration-300"
                style={{
                  backgroundImage: 'radial-gradient(#064e3b 0.75px, transparent 0.75px)',
                  backgroundSize: '10px 10px',
                }}
              />

              {/* เลเยอร์แสงสะท้อนเหลือบแก้วมุมบนขวา (Glass Gleam Highlight) */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-transparent to-white/45" />

              <div className="relative z-10 mr-4 md:mr-5 shrink-0 opacity-95 group-hover:opacity-100 transition-opacity">
                {action.icon}
              </div>
              <div className="relative z-10 flex flex-col min-w-0 flex-1">
                <span className={`font-black text-slate-900 tracking-tight leading-tight mb-0.5 whitespace-nowrap ${action.titleClass || 'text-lg md:text-[19px] lg:text-[21px]'}`}>
                  {action.title}
                </span>
                <span className={`text-slate-600 leading-snug whitespace-nowrap ${action.subtitleClass || 'text-xs'}`}>
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
