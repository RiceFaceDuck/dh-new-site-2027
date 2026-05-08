import React from 'react';
import { 
  Settings, Receipt, History, Users, Calculator, ShieldCheck
} from 'lucide-react';

/**
 * 🎨 Component ปุ่มกดแบบฉบับย่อ (สกัดออกมาจากไฟล์หลัก)
 */
const ToolCard = ({ title, subtitle, icon: Icon, colorTheme, onClick, badge }) => {
  const themes = {
    indigo: 'text-indigo-600 bg-indigo-500/10 group-hover:bg-indigo-500/20 border-indigo-200',
    orange: 'text-orange-600 bg-orange-500/10 group-hover:bg-orange-500/20 border-orange-200',
    rose: 'text-rose-600 bg-rose-500/10 group-hover:bg-rose-500/20 border-rose-200',
    emerald: 'text-emerald-600 bg-emerald-500/10 group-hover:bg-emerald-500/20 border-emerald-200',
    blue: 'text-blue-600 bg-blue-500/10 group-hover:bg-blue-500/20 border-blue-200',
    purple: 'text-purple-600 bg-purple-500/10 group-hover:bg-purple-500/20 border-purple-200',
    amber: 'text-amber-600 bg-amber-500/10 group-hover:bg-amber-500/20 border-amber-200',
  };

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center p-6 bg-[var(--dh-bg-surface)] rounded-2xl border border-[var(--dh-border)] hover:border-transparent hover:shadow-lg transition-all duration-300 group text-center overflow-hidden"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 border ${themes[colorTheme]}`}>
        <Icon size={28} />
      </div>
      <h3 className="text-[15px] font-black text-[var(--dh-text-main)] mb-1 group-hover:text-[var(--dh-accent)] transition-colors">{title}</h3>
      <p className="text-[12px] font-medium text-[var(--dh-text-muted)] line-clamp-2">{subtitle}</p>

      {badge > 0 && (
        <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-bounce shadow-sm">
          {badge}
        </div>
      )}
    </button>
  );
};

/**
 * 🛠️ ส่วนแผงเครื่องมือควบคุม (Quick Access Tools)
 */
const QuickAccessTools = ({ onOpenGlobalSettings, onNavigatePricing, onNavigateStaff, onNavigateTodo, onNavigateHistory, pendingStaffCount, pendingTasksCount }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <ToolCard 
          title="ตั้งค่านโยบายกลาง" 
          subtitle="Inventory, สต็อกกันชน, การรับประกัน, ลิงก์ร้านค้า"
          icon={Settings} 
          colorTheme="indigo"
          onClick={onOpenGlobalSettings}
        />
        
        <ToolCard 
          title="นโยบายราคา (Pricing)" 
          subtitle="ตั้งค่าการคำนวณกำไร และ ปัดเศษราคาขาย"
          icon={Calculator} 
          colorTheme="emerald"
          onClick={onNavigatePricing}
        />

        <ToolCard 
          title="จัดการพนักงาน" 
          subtitle="อนุมัติพนักงานใหม่, ตั้งค่าตำแหน่งงาน"
          icon={Users} 
          colorTheme="orange"
          onClick={onNavigateStaff}
          badge={pendingStaffCount}
        />

        <ToolCard 
          title="ตรวจสอบคำร้อง (Todo)" 
          subtitle="อนุมัติราคาส่ง, อนุมัติลบสินค้า"
          icon={ShieldCheck} 
          colorTheme="rose"
          onClick={onNavigateTodo}
          badge={pendingTasksCount}
        />

        <ToolCard 
          title="ประวัติกิจกรรมระบบ" 
          subtitle="ตรวจสอบ History Log ใครทำอะไร เมื่อไหร่"
          icon={History} 
          colorTheme="purple"
          onClick={onNavigateHistory}
        />
    </div>
  );
};

export default QuickAccessTools;