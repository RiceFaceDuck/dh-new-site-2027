import React from 'react';
import { 
  Settings, History, Users, Calculator, Mail, Crown, 
  Megaphone, Search, Code, ShieldCheck, AlertTriangle, 
  ArrowRightLeft, HardHat, Code2, ShieldBan, CreditCard
} from 'lucide-react';

/**
 * 🎨 Component ปุ่มกดแบบฉบับย่อ (สกัดออกมาจากไฟล์หลัก)
 */
const ToolCard = ({ title, subtitle, icon: Icon, colorTheme, onClick, badge, isComingSoon }) => {
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
  };

  return (
    <button
      onClick={isComingSoon ? undefined : onClick}
      disabled={isComingSoon}
      className={`relative flex flex-col items-center justify-start p-4 bg-[var(--dh-bg-surface)] rounded-xl border border-[var(--dh-border)] transition-all duration-300 text-center overflow-hidden h-full
        ${isComingSoon ? 'opacity-60 cursor-not-allowed grayscale-[30%]' : 'hover:border-transparent hover:shadow-md group'}
      `}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 border ${themes[colorTheme]} ${!isComingSoon && 'group-hover:scale-110 group-hover:-rotate-3'}`}>
        <Icon size={20} />
      </div>
      <h3 className={`text-[13px] font-bold text-[var(--dh-text-main)] mb-1 transition-colors leading-tight ${!isComingSoon && 'group-hover:text-[var(--dh-accent)]'}`}>{title}</h3>
      <p className="text-[10px] font-medium text-[var(--dh-text-muted)] line-clamp-2 leading-tight">{subtitle}</p>

      {badge > 0 && !isComingSoon && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-bounce shadow-sm">
          {badge}
        </div>
      )}

      {isComingSoon && (
        <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-bl-xl rounded-tr-xl">
          รอพัฒนา
        </div>
      )}
    </button>
  );
};

/**
 * 🛠️ ส่วนแผงเครื่องมือควบคุม (Quick Access Tools)
 */
const QuickAccessTools = ({ 
  onOpenGlobalSettings, 
  onNavigatePricing, 
  onNavigateStaff, 
  onNavigateHistory, 
  onOpenEmailSetup, 
  onOpenVipModal,
  onNavigateAds,
  onNavigateCredit,
  pendingStaffCount,
  vipCount
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 h-full">
        
        {/* === หมวดหมู่ผู้ใช้งาน === */}
        <ToolCard 
          title="ลูกค้า VIP" 
          subtitle="ข้อมูลและออเดอร์คนสำคัญ"
          icon={Crown} 
          colorTheme="amber"
          onClick={onOpenVipModal}
        />

        <ToolCard 
          title="จัดการพนักงาน" 
          subtitle="อนุมัติและตั้งค่าตำแหน่ง"
          icon={Users} 
          colorTheme="orange"
          onClick={onNavigateStaff}
          badge={pendingStaffCount}
        />

        {/* === หมวดหมู่ตั้งค่าหลัก === */}
        <ToolCard 
          title="นโยบายกลาง" 
          subtitle="สต็อกกันชน, รับประกัน, ร้านค้า"
          icon={Settings} 
          colorTheme="indigo"
          onClick={onOpenGlobalSettings}
        />
        
        <ToolCard 
          title="นโยบายราคาปลีก" 
          subtitle="ตั้งค่าคำนวณกำไรและราคา"
          icon={Calculator} 
          colorTheme="emerald"
          onClick={onNavigatePricing}
        />

        <ToolCard 
          title="ประวัติระบบ" 
          subtitle="ตรวจสอบ History Log"
          icon={History} 
          colorTheme="purple"
          onClick={onNavigateHistory}
        />

        {/* === หมวดหมู่ใหม่ (เตรียมพร้อม) === */}
        <ToolCard 
          title="แบนเนอร์โฆษณา" 
          subtitle="จัดการป้ายโฆษณาหน้าเว็บ"
          icon={Megaphone} 
          colorTheme="rose"
          isComingSoon={true}
        />

        <ToolCard 
          title="SEO & ค้นหา" 
          subtitle="ปรับแต่ง SEO และ SGE"
          icon={Search} 
          colorTheme="blue"
          isComingSoon={true}
        />

        <ToolCard 
          title="API Keys" 
          subtitle="ตั้งค่าเชื่อมต่อระบบภายนอก"
          icon={Code} 
          colorTheme="cyan"
          isComingSoon={true}
        />

        <ToolCard 
          title="อีเมลบริษัท" 
          subtitle="ตั้งค่าตอบอีเมลทีมงาน"
          icon={Mail} 
          colorTheme="blue"
          onClick={onOpenEmailSetup}
        />

        <ToolCard 
          title="Privacy & Cookies" 
          subtitle="นโยบายข้อมูลและคุกกี้"
          icon={ShieldCheck} 
          colorTheme="emerald"
          isComingSoon={true}
        />

        <ToolCard 
          title="หน้า 404 Error" 
          subtitle="ปรับแต่งหน้าไม่พบข้อมูล"
          icon={AlertTriangle} 
          colorTheme="amber"
          isComingSoon={true}
        />

        <ToolCard 
          title="Redirect URLs" 
          subtitle="จัดการการเปลี่ยนเส้นทางลิงก์"
          icon={ArrowRightLeft} 
          colorTheme="indigo"
          isComingSoon={true}
        />

        <ToolCard 
          title="Custom Scripts" 
          subtitle="จัดการโค้ดหน้าบ้าน (Head/Body)"
          icon={Code2} 
          colorTheme="slate"
          isComingSoon={true}
        />

        <ToolCard 
          title="Security & Block" 
          subtitle="บล็อค IP และอีเมลอันตราย"
          icon={ShieldBan} 
          colorTheme="red"
          isComingSoon={true}
        />

        <ToolCard 
          title="ปิดปรับปรุง" 
          subtitle="เปิด/ปิดโหมด Maintenance"
          icon={HardHat} 
          colorTheme="orange"
          isComingSoon={true}
        />

        <ToolCard 
          title="Ads Manager" 
          subtitle="จัดการโฆษณาหน้าเว็บ"
          icon={Megaphone} 
          colorTheme="rose"
          onClick={onNavigateAds}
        />

        <ToolCard 
          title="Credit Point" 
          subtitle="จัดการเครดิตของลูกค้า"
          icon={CreditCard} 
          colorTheme="indigo"
          onClick={onNavigateCredit}
        />

    </div>
  );
};

export default QuickAccessTools;