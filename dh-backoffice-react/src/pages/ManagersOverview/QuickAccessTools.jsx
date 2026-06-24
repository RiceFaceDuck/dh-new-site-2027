import React, { useState, useEffect } from 'react';
import { 
  Settings, History, Users, Calculator, Mail, Crown, 
  Megaphone, Search, Code, ShieldCheck, AlertTriangle, 
  ArrowRightLeft, HardHat, Code2, ShieldBan, CreditCard, CloudUpload,
  Box, LayoutTemplate, LinkIcon, ImageIcon, LayoutGrid, LayoutPanelTop, BookOpen, Tags, Gift
} from 'lucide-react';
import { menuConfigService } from '../../firebase/menuConfigService';

// --- Icon Mapping ---
const iconMap = {
  Settings, History, Users, Calculator, Mail, Crown, 
  Megaphone, Search, Code, ShieldCheck, AlertTriangle, 
  ArrowRightLeft, HardHat, Code2, ShieldBan, CreditCard, CloudUpload,
  Box, LayoutTemplate, LinkIcon, ImageIcon, LayoutPanelTop, BookOpen, Tags, Gift
};

/**
 * 🎨 Component ปุ่มกดแบบฉบับย่อ (สกัดออกมาจากไฟล์หลัก)
 */
const ToolCard = ({ title, subtitle, iconName, colorTheme, onClick, badge, isComingSoon }) => {
  const Icon = iconMap[iconName] || Settings;

  const themes = {
    indigo: 'text-indigo-600 bg-indigo-500/10 group-hover:bg-indigo-500/20 border-indigo-200',
    orange: 'text-orange-600 bg-orange-500/10 group-hover:bg-orange-500/20 border-orange-200',
    rose: 'text-rose-600 bg-rose-500/10 group-hover:bg-rose-500/20 border-rose-200',
    emerald: 'text-emerald-600 bg-emerald-500/10 group-hover:bg-emerald-500/20 border-emerald-200',
    blue: 'text-blue-600 bg-blue-500/10 group-hover:bg-blue-500/20 border-blue-200',
    purple: 'text-purple-600 bg-purple-500/10 group-hover:bg-purple-500/20 border-purple-200',
    amber: 'text-amber-600 bg-amber-500/10 group-hover:bg-amber-500/20 border-amber-200',
    cyan: 'text-cyan-600 bg-cyan-500/10 group-hover:bg-cyan-500/20 border-cyan-200',
    red: 'text-red-600 bg-red-500/10 group-hover:bg-red-500/20 border-red-200',
    slate: 'text-slate-600 bg-slate-500/10 group-hover:bg-slate-500/20 border-slate-200',
    sky: 'text-sky-600 bg-sky-500/10 group-hover:bg-sky-500/20 border-sky-200',
    fuchsia: 'text-fuchsia-600 bg-fuchsia-500/10 group-hover:bg-fuchsia-500/20 border-fuchsia-200',
  };

  return (
    <button
      onClick={isComingSoon ? undefined : onClick}
      disabled={isComingSoon}
      className={`relative flex flex-col items-center justify-start p-5 bg-[var(--dh-bg-surface)] rounded-2xl border-2 border-[var(--dh-border)] transition-all duration-300 text-center overflow-hidden h-full shadow-sm
        ${isComingSoon ? 'opacity-60 cursor-not-allowed grayscale-[30%]' : 'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl hover:-translate-y-1 group'}
      `}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 border-2 ${themes[colorTheme] || themes.slate} ${!isComingSoon && 'group-hover:scale-110 group-hover:-rotate-3 shadow-md'}`}>
        <Icon size={24} />
      </div>
      <h3 className={`text-[14px] font-black text-[var(--dh-text-main)] mb-1.5 transition-colors leading-tight ${!isComingSoon && 'group-hover:text-[var(--dh-accent)]'}`}>{title}</h3>
      <p className="text-[11px] font-semibold text-[var(--dh-text-muted)] line-clamp-2 leading-tight px-1">{subtitle}</p>

      {badge > 0 && !isComingSoon && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full animate-bounce shadow-md">
          {badge}
        </div>
      )}

      {isComingSoon && (
        <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-bl-xl rounded-tr-2xl shadow-sm">
          รอพัฒนา
        </div>
      )}
    </button>
  );
};

// --- Definitions (same as Layout Manager) ---
import { AVAILABLE_MENUS } from './components/MenuLayoutManager';
import { useNavigate } from 'react-router-dom';

/**
 * 🛠️ ส่วนแผงเครื่องมือควบคุม (Quick Access Tools) แบบ Dynamic Layout
 */
const QuickAccessTools = ({ 
  onNavigatePricing, 
  onNavigateStaff, 
  onNavigateHistory, 
  onOpenEmailSetup, 
  onOpenDrivePanel,
  onOpenVipModal,
  onNavigateAds,
  onNavigateCredit,
  onOpenLayoutManager,
  pendingStaffCount,
  vipCount,
  refreshTrigger // ใช้สำหรับสั่งโหลดใหม่หลังจากเซฟ Layout
}) => {
  const [layout, setLayout] = useState({ zones: [] });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLayout = async () => {
      setIsLoading(true);
      const data = await menuConfigService.getMenuLayout();
      setLayout(data);
      setIsLoading(false);
    };
    fetchLayout();
  }, [refreshTrigger]);

  const getClickHandler = (menuId) => {
    switch (menuId) {
      case 'vip': return onOpenVipModal;
      case 'staff': return onNavigateStaff;
      case 'pricing': return onNavigatePricing;
      case 'history': return onNavigateHistory;
      case 'email': return onOpenEmailSetup;
      case 'drive': return onOpenDrivePanel;
      case 'ads': return onNavigateAds;
      case 'credit': return onNavigateCredit;
      case 'promotions': return () => navigate('/managers/promotions');
      case 'freebie': return () => navigate('/managers/freebie');
      case 'inventory_adjustment': return () => navigate('/managers/inventory-adjustment');
      // เมนูย่อยจากนโยบายกลาง (จะเปิด Global Settings Panel โดยระบุ Tab)
      case 'buffer': return () => navigate('/managers/buffer');
      case 'category': return () => navigate('/managers/category');
      case 'regex': return () => navigate('/managers/regex');
      case 'warranty': return () => navigate('/managers/warranty');
      case 'ads_config': return () => navigate('/managers/ads-config');
      case 'theme': return () => navigate('/managers/theme');
      case 'knowledge': return () => navigate('/managers/knowledge');
      case 'footer': return () => navigate('/managers/footer-settings');
      case 'privacy': return () => navigate('/managers/privacy-cookies');
      default: return undefined;
    }
  };

  const getBadge = (menuId) => {
    if (menuId === 'staff') return pendingStaffCount;
    // if (menuId === 'vip') return vipCount; // Optional: show VIP count
    return 0;
  };

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center font-bold text-slate-400">กำลังโหลดแผงเมนู...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end mb-[-1rem] z-10 relative">
        <button 
          onClick={onOpenLayoutManager}
          className="text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <LayoutGrid size={14} /> ตั้งค่าแผงเมนู
        </button>
      </div>

      {layout.zones.map(zone => {
        if (!zone.menuIds || zone.menuIds.length === 0) return null;
        
        return (
          <div key={zone.id} className="space-y-3">
            <h3 className="text-[15px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest pl-2 border-l-4 border-blue-500 mb-2">
              {zone.title}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {zone.menuIds.map(menuId => {
                const menuDef = AVAILABLE_MENUS[menuId];
                if (!menuDef) return null;
                return (
                  <ToolCard 
                    key={menuId}
                    title={menuDef.title} 
                    subtitle={menuDef.subtitle}
                    iconName={menuDef.iconName} 
                    colorTheme={menuDef.colorTheme}
                    isComingSoon={menuDef.isComingSoon}
                    badge={getBadge(menuId)}
                    onClick={getClickHandler(menuId)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuickAccessTools;