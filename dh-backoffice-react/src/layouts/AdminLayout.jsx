import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, Receipt, Undo2, 
  CheckSquare, History, Image as ImageIcon, 
  Boxes, Users, Settings, LogOut, Sun, Moon 
} from 'lucide-react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { userService } from '../firebase/userService';
import { todoService } from '../firebase/todoService';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  
  const [profile, setProfile] = useState(null);
  const [managerTodoCount, setManagerTodoCount] = useState(0); 
  const [todoCount, setTodoCount] = useState(0); // ✨ เพิ่ม State สำหรับจำนวนงาน To-do ทั่วไป
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    let unsubscribeTodo = null;
    let unsubscribeGeneralTodo = null;

    // ✨ Subscribe จำนวนงานค้างทั้งหมดสำหรับแสดงที่เมนู To-do (Real-time)
    unsubscribeGeneralTodo = todoService.subscribePendingTodos((todos) => {
      setTodoCount(todos.length);
    });

    if (currentUser) {
      userService.getUserProfile(currentUser.uid).then(data => {
        if (data) {
          setProfile(data);
          // ระบบแจ้งเตือนเฉพาะระดับ Manager/Owner (เดิม)
          if (['Manager', 'Owner', 'ผู้จัดการ', 'เจ้าของ'].includes(data.role)) {
            unsubscribeTodo = todoService.subscribeManagerApprovals((todos) => {
              setManagerTodoCount(todos.length);
            });
          }
        }
      });
    }

    return () => {
      if (unsubscribeTodo) unsubscribeTodo();
      if (unsubscribeGeneralTodo) unsubscribeGeneralTodo();
    };
  }, [currentUser]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { path: '/', name: 'Overview', desc: 'หน้ากระดานสรุปภาพรวมและสถิติ', icon: <LayoutDashboard size={18} /> },
    { path: '/search', name: 'Product Search+', desc: 'ค้นหาสินค้าและเช็คสต็อกเร่งด่วน', icon: <Search size={18} /> },
    { path: '/billing', name: 'Billing', desc: 'จัดการบิลรายการขายและใบเสร็จ', icon: <Receipt size={18} /> },
    { path: '/claims', name: 'Claims', desc: 'ระบบจัดการงานเคลมและส่งซ่อม', icon: <Undo2 size={18} /> },
    { path: '/todo', name: 'To-do', desc: 'กระดานรายการสิ่งที่ต้องดำเนินการ', icon: <CheckSquare size={18} /> },
    { path: '/managers', name: 'Managers Office', desc: 'พื้นที่ตรวจสอบและอนุมัติ (สำหรับผู้จัดการ)', icon: <Users size={18} /> },
    { path: '/history', name: 'History', desc: 'ประวัติการทำรายการย้อนหลังทั้งหมด', icon: <History size={18} /> },
    { path: '/gallery', name: 'Gallery', desc: 'คลังรูปภาพสินค้าและสลิปการโอน', icon: <ImageIcon size={18} /> },
    { path: '/inventory', name: 'Inventory', desc: 'ระบบจัดการคลังสินค้าและอะไหล่', icon: <Boxes size={18} /> },
    { path: '/customers', name: 'Customers', desc: 'ฐานข้อมูลพาร์ทเนอร์และลูกค้า', icon: <Users size={18} /> },
    { path: '/config', name: 'Config', desc: 'ตั้งค่าระบบและสิทธิ์การใช้งาน', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-dh-bg-base text-dh-main font-sans overflow-hidden selection:bg-dh-accent-light selection:text-dh-accent transition-colors duration-200">
      
      {/* Sidebar Navigation - 🎨 ปรับพื้นหลังเป็นสีขาวขุ่น (Off-white) */}
      <aside className="w-[260px] bg-[#F8FAFB] dark:bg-[#3d3d3d] border-r border-dh-border flex flex-col z-20 transition-colors duration-200 shadow-sm">
        
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-dh-border shrink-0 bg-white dark:bg-dh-bg-surface">
          <h1 className="text-xl font-black text-dh-main tracking-tight flex items-center gap-1">
            DH<span className="text-dh-accent">Notebook</span>
          </h1>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar pb-10">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            // ✨ กำหนดตัวเลข Badge ตามประเภทเมนู
            let badgeCount = 0;
            if (item.path === '/todo') badgeCount = todoCount;
            if (item.path === '/managers') badgeCount = managerTodoCount;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 outline-none ${
                  isActive 
                    ? 'bg-dh-accent text-white font-semibold shadow-md' 
                    : 'text-dh-muted hover:bg-dh-accent/10 hover:text-dh-main font-medium'
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className={`${isActive ? 'text-white' : 'text-dh-muted group-hover:text-dh-accent'} transition-colors duration-200 flex-shrink-0 relative z-10`}>
                    {React.cloneElement(item.icon, { strokeWidth: isActive ? 2.5 : 2 })}
                  </span>
                  <span className="tracking-wide relative z-10">{item.name}</span>
                </div>
                
                {/* ✨ Badge แจ้งเตือนจำนวนงาน (รองรับทั้ง To-do และ Managers Office) */}
                {badgeCount > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm flex-shrink-0 relative z-10 animate-in zoom-in duration-300 ${
                    isActive ? 'bg-white text-dh-accent' : (item.path === '/todo' ? 'bg-dh-accent text-white' : 'bg-red-500 text-white')
                  }`}>
                    {badgeCount}
                  </span>
                )}

                <div className="absolute left-12 top-[90%] w-max max-w-[210px] bg-dh-main text-dh-base text-[11.5px] font-medium px-2.5 py-1.5 rounded-md shadow-dh-elevated 
                                opacity-0 translate-y-2 invisible group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 
                                transition-all duration-200 delay-100 z-50 pointer-events-none border border-dh-border/10">
                  {item.desc}
                  <div className="absolute -top-1 left-3 w-2 h-2 bg-dh-main rotate-45 rounded-sm"></div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Footer Area */}
        <div className="p-4 border-t border-dh-border bg-[#F8FAFB] dark:bg-[#3d3d3d] shrink-0">
          
          <div className="flex items-center gap-3 min-w-0 p-2 rounded-lg border border-transparent hover:border-dh-border hover:bg-white dark:hover:bg-dh-bg-surface transition-colors duration-200 mb-2">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-9 h-9 rounded-full object-cover shadow-sm shrink-0" />
            ) : (
              <div className="w-9 h-9 bg-dh-accent-light text-dh-accent rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {profile?.nickname?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-dh-main truncate leading-tight">
                {profile ? `${profile.firstName} (${profile.nickname})` : 'กำลังโหลด...'}
              </p>
              <p className="text-[10px] text-dh-muted font-medium uppercase tracking-wider mt-0.5 truncate">
                {profile?.role || 'Staff'}
              </p>
            </div>

            <button 
              onClick={toggleDarkMode}
              className="p-1.5 rounded-md text-dh-muted hover:bg-dh-border hover:text-dh-main transition-colors shrink-0 outline-none"
              title={isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          
          <button 
            onClick={handleLogout}
            className="group w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-dh-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors outline-none"
          >
            <LogOut size={16} className="transition-transform group-hover:-translate-x-0.5" />
            <span>เลิกงาน (ออกจากระบบ)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen relative bg-dh-bg-base">
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto custom-scrollbar">
          <Outlet />
        </div>
      </main>

    </div>
  );
}