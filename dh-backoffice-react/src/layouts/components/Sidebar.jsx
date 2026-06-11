import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Search, Receipt, Undo2, 
  CheckSquare, History, Image as ImageIcon, 
  Boxes, Users, LogOut, Sun, Moon,
  UserCog, Mail, Calendar, Lock, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar({ 
  todoCount, 
  unreadCount, 
  pendingStaffCount, 
  isDark, 
  toggleDarkMode 
}) {
  const location = useLocation();
  const { user, profile, logout, isManagerOrOwner } = useAuth();
  const hasManagerAccess = isManagerOrOwner();

  const navItems = [
    { category: 'Main Menu', categoryThai: 'ส่วนงานหลัก' },
    { path: '/overview', label: 'Overview', labelThai: 'ภาพรวม', icon: LayoutDashboard },
    { path: '/todo', label: 'To-do', labelThai: 'งานที่ต้องทำ', icon: CheckSquare, badge: todoCount },
    { path: '/billing', label: 'Billing', labelThai: 'ระบบบิล', icon: Receipt },
    { path: '/claims', label: 'Claims/Returns', labelThai: 'รับเคลม/คืน', icon: Undo2 },
    
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
      badge: hasManagerAccess && pendingStaffCount > 0 ? pendingStaffCount : null,
      requiresManager: true
    }
  ];

  const handleManagerClick = (e, requiresManager) => {
    if (requiresManager && !hasManagerAccess) {
      e.preventDefault();
      alert("คุณไม่มีอำนาจเข้าใช้งาน\nกรุณาติดต่อผู้จัดการ");
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 transition-colors duration-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Logo */}
      <div className="h-[72px] flex items-center justify-start px-5 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-3 bg-white dark:bg-slate-800">
        <img src="/dh-logo.png" alt="DH Logo" className="h-9 object-contain drop-shadow-sm" />
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
          const isActive = item.path === '/managers' 
            ? location.pathname === '/managers' 
            : location.pathname.startsWith(item.path);

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
              <div className="flex items-center gap-2.5">
                <Icon 
                  size={17} 
                  className={
                    isLocked 
                      ? 'text-slate-400 dark:text-slate-600'
                      : isActive 
                        ? 'text-white' 
                        : 'text-slate-400 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400 transition-colors'
                  } 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                <span className="block group-hover:hidden">
                  {item.label} {isLocked && ' (Locked)'}
                </span>
                <span className="hidden group-hover:block">
                  {item.labelThai} {isLocked && ' (ล็อค)'}
                </span>
              </div>
              {item.badge > 0 && !isLocked && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black shadow-sm ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile & Settings Area */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-700/50 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
        
        {/* User Info Block */}
        <div className="relative group flex items-start gap-2.5 p-2 -mx-1 mb-3 rounded-2xl hover:bg-white dark:hover:bg-slate-700/50 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm">
          
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-600 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm border border-indigo-400 dark:border-indigo-500">
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
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-indigo-50 dark:bg-slate-800 shadow-sm border border-indigo-100 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
            title="ตั้งค่าข้อมูลบัญชี (Coming Soon)"
            onClick={() => alert('ส่วนตั้งค่าบัญชีส่วนตัว จะเปิดใช้งานในระบบ KPI เร็วๆ นี้ครับ')}
          >
            <UserCog size={16} />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={logout}
            className="flex-1 group flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-xl transition-colors outline-none border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800"
          >
            <LogOut size={16} className="transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
            <span>เลิกงาน</span>
          </button>
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors outline-none border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm bg-white dark:bg-slate-800"
            title={isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
          >
            {isDark ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
