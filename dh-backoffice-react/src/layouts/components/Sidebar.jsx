import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, Receipt, Undo2, 
  CheckSquare, History, Image as ImageIcon, 
  Boxes, Users, LogOut, Sun, Moon,
  UserCog, Mail, Calendar, Lock, RefreshCw, Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NetworkHealthIndicator from '../../components/common/NetworkHealthIndicator';
import UserProfileModal from '../../components/profile/UserProfileModal';
import toast from 'react-hot-toast';

export default function Sidebar({ 
  todoCount, 
  unreadCount, 
  pendingClaimCount, 
  managerApprovalCount, 
  isDark, 
  toggleDarkMode 
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout, isManagerOrOwner } = useAuth();
  const hasManagerAccess = isManagerOrOwner();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleCreateNewBill = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('dh_open_new_bill'));
    if (location.pathname !== '/billing') {
      navigate('/billing', { state: { newBill: true } });
    }
  };

  const navItems = [
    { category: 'Main Menu', categoryThai: 'ส่วนงานหลัก' },
    { path: '/overview', label: 'Overview', labelThai: 'ภาพรวม', icon: LayoutDashboard },
    { path: '/todo', label: 'To-do', labelThai: 'งานที่ต้องทำ', icon: CheckSquare, badge: todoCount },
    { path: '/billing', label: 'Billing', labelThai: 'ระบบบิล', icon: Receipt },
    { path: '/claims', label: 'Claims/Returns', labelThai: 'รับเคลม/คืน', icon: Undo2, badge: pendingClaimCount > 0 ? pendingClaimCount : null },
    
    { category: 'Database', categoryThai: 'คลังข้อมูล' },
    { path: '/search', label: 'Search', labelThai: 'ค้นหาสินค้า', icon: Search },
    { path: '/inventory', label: 'Inventory', labelThai: 'สต๊อกสินค้า', icon: Boxes },
    { path: '/generate', label: 'Generate', labelThai: 'การซิงค์ข้อมูลสต๊อก', icon: RefreshCw },
    { path: '/gallery', label: 'Gallery', labelThai: 'คลังภาพ', icon: ImageIcon },
    { path: '/history', label: 'History', labelThai: 'ประวัติ', icon: History },
    { path: '/customers', label: 'Customers', labelThai: 'ลูกค้า', icon: Users },
    { path: '/emails', label: 'Emails', labelThai: 'อีเมล', icon: Mail, badge: unreadCount > 0 ? unreadCount : null },
    { path: '/calendar', label: 'Calendar', labelThai: 'ปฏิทิน', icon: Calendar },
    
    { category: 'Management', categoryThai: 'ส่วนงานผู้จัดการ' },
    { 
      path: '/managers', 
      label: 'Manager', 
      labelThai: 'ผู้จัดการ', 
      icon: Lock, 
      badge: hasManagerAccess && managerApprovalCount > 0 ? managerApprovalCount : null,
      requiresManager: true
    }
  ];

  const handleManagerClick = (e, requiresManager) => {
    if (requiresManager && !hasManagerAccess) {
      e.preventDefault();
      toast.error("คุณไม่มีอำนาจเข้าใช้งาน กรุณาติดต่อผู้จัดการ");
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 transition-colors duration-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Logo */}
      <div className="h-[72px] flex items-center justify-start px-5 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-3 bg-white dark:bg-slate-800">
        <img src="/dh-logo.png" alt="DH Logo" className="h-9 object-contain drop-shadow-xs"  loading="lazy" />
        <div className="flex flex-col">
          <span className="text-[15px] font-black leading-tight text-slate-800 dark:text-white tracking-tight">DH Notebook</span>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">System Command v1.0</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 custom-scrollbar">
        {navItems.map((item, index) => {
          if (item.category) {
            return (
              <div key={`cat-${index}`} className="px-3 pt-3 pb-1 first:pt-1 group/cat cursor-default">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover/cat:hidden">
                  {item.category}
                </p>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden group-hover/cat:block">
                  {item.categoryThai}
                </p>
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));

          const isLocked = item.requiresManager && !hasManagerAccess;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => handleManagerClick(e, item.requiresManager)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-bold group transition-all duration-200 ${
                isLocked
                  ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-70 bg-slate-50 dark:bg-slate-800/50'
                  : isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon 
                  size={17} 
                  className={
                    isLocked 
                      ? 'text-slate-400 dark:text-slate-600 shrink-0'
                      : isActive 
                        ? 'text-white shrink-0' 
                        : 'text-slate-400 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400 transition-colors shrink-0'
                  } 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                <span className="block group-hover:hidden truncate whitespace-nowrap">
                  {item.label} {isLocked && ' (Locked)'}
                </span>
                <span className="hidden group-hover:block truncate whitespace-nowrap">
                  {item.labelThai} {isLocked && ' (ล็อค)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.path === '/billing' && (
                  <button
                    type="button"
                    title="สร้างบิลใหม่ (POS)"
                    onClick={handleCreateNewBill}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-xs border border-blue-400/40'
                        : 'bg-slate-100 hover:bg-blue-600 text-slate-500 hover:text-white dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-blue-600 dark:hover:text-white border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                )}

                {item.badge > 0 && !isLocked && (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black shadow-xs ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Profile & Settings Area */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-700/50 shrink-0 bg-slate-50/50 dark:bg-slate-800/50 space-y-2.5">
        
        {/* User Info Block */}
        <div 
          onClick={() => setIsProfileModalOpen(true)}
          className="relative group flex items-start gap-2.5 p-2 -mx-1 rounded-2xl hover:bg-white dark:hover:bg-slate-700/50 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-xs"
        >
          
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-600 shadow-xs"
             loading="lazy" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs border border-indigo-400 dark:border-indigo-500">
              {profile?.firstName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          
          <div className="flex-1 min-w-0 flex flex-col justify-center py-0">
            <p className="text-[13px] font-black text-slate-900 dark:text-white truncate tracking-tight">
              {profile ? `${profile.firstName} ${profile.nickname ? `(${profile.nickname})` : ''}` : (user?.displayName || 'กำลังโหลด...')}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5" title={user?.email}>
              {user?.email || 'ไม่มีอีเมล'}
            </p>
          </div>

          <div 
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-indigo-50 dark:bg-slate-800 shadow-xs border border-indigo-100 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
            title="ตั้งค่าข้อมูลบัญชีส่วนตัว"
            onClick={(e) => {
              e.stopPropagation();
              setIsProfileModalOpen(true);
            }}
          >
            <UserCog size={16} />
          </div>
        </div>
        
        {/* ⚡ Network Health Status Bar (Ultra Compact) */}
        <div className="flex items-center justify-between gap-1 px-1 py-0.5 whitespace-nowrap">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0 uppercase tracking-wider">ระบบเชื่อมต่อ</span>
          <NetworkHealthIndicator compact />
        </div>

        {/* Action Buttons */}
        {showLogoutConfirm ? (
          <div className="flex items-center gap-1.5 p-1.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs">
            <span className="text-[11px] font-bold text-red-600 dark:text-red-400 flex-1 pl-1">ยืนยันเลิกงาน?</span>
            <button
              type="button"
              onClick={logout}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] shadow-xs active:scale-95 transition-all"
            >
              ยืนยัน
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-[11px] transition-all"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex-1 group flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-xl transition-all outline-hidden border border-slate-200 dark:border-slate-700 shadow-2xs bg-white dark:bg-slate-800 active:scale-98"
            >
              <LogOut size={15} className="transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
              <span>เลิกงาน</span>
            </button>
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all outline-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs bg-white dark:bg-slate-800 active:scale-98"
              title={isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
            >
              {isDark ? <Sun size={17} strokeWidth={2.5} /> : <Moon size={17} strokeWidth={2.5} />}
            </button>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={user} 
        profile={profile} 
      />
    </aside>
  );
}
