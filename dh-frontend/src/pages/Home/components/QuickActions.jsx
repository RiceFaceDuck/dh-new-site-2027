import { Link } from 'react-router-dom';
import partsToolboxImg from '../../../assets/parts-toolbox-3d.png';
import aiSparklesImg from '../../../assets/ai-sparkles-3d.png';
import serviceMapPinImg from '../../../assets/service-map-pin.png';

const QuickActions = () => {
  const actions = [
    {
      id: 'shop-parts',
      title: 'ค้นหาอะไหล่ทั้งหมด',
      subtitle: 'เลือกดูตามหมวดหมู่อะไหล่ทั้งหมด',
      icon: (
        <img
          src={partsToolboxImg}
          alt="Parts Catalog"
          className="w-9 h-9 md:w-[42px] md:h-[42px] object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
        />
      ),
      link: '/categories',
    },
    {
      id: 'book-service',
      title: 'Model No. Checker (AI)',
      subtitle: 'AI Intelligent Scan • สแกนและเทียบอะไหล่',
      icon: (
        <img
          src={aiSparklesImg}
          alt="AI Sparkles"
          className="w-9 h-9 md:w-[42px] md:h-[42px] object-contain shrink-0"
        />
      ),
      link: '#',
      badge: 'กำลังพัฒนา',
      disabled: true,
    },
    {
      id: 'service-providers',
      title: 'ค้นหาบริการ ทั้งหมด',
      subtitle: 'ค้นหาช่างและผู้ให้บริการใกล้คุณ',
      icon: (
        <img
          src={serviceMapPinImg}
          alt="Service Providers"
          className="w-9 h-9 md:w-[42px] md:h-[42px] object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
        />
      ),
      link: '/providers',
    }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-3.5 items-stretch">
        {actions.map((action) => {
          const CardContent = (
            <>
              <div className="shrink-0">{action.icon}</div>
              <div className={`flex flex-col min-w-0 flex-1 ${action.badge ? 'pr-14' : ''}`}>
                <span className="font-heading text-[14.5px] lg:text-[15.5px] font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors truncate">
                  {action.title}
                </span>
                <span className="text-xs text-slate-500 font-light leading-snug mt-0.5 truncate">
                  {action.subtitle}
                </span>
              </div>

              {action.badge && (
                <span className="absolute top-2 right-2.5 inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] whitespace-nowrap">
                  {action.badge}
                </span>
              )}
            </>
          );

          const baseClasses =
            'relative flex items-center gap-3 md:gap-3.5 px-3.5 py-3 md:px-4 md:py-3.5 bg-white border border-slate-200 border-l-4 rounded-md text-left shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-all duration-150 h-full';

          if (action.disabled) {
            return (
              <div
                key={action.id}
                className={`${baseClasses} border-l-amber-500 opacity-95 cursor-default`}
                onClick={(e) => e.preventDefault()}
              >
                {CardContent}
              </div>
            );
          }

          return (
            <Link
              key={action.id}
              to={action.link}
              className={`${baseClasses} group border-l-brand hover:border-[#93C5FD] hover:border-l-brand hover:shadow-[0_8px_20px_-6px_rgba(8,112,184,0.16)] hover:-translate-y-0.5 active:scale-[0.99]`}
            >
              {CardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
