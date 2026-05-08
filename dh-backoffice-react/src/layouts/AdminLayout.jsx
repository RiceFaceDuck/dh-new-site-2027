import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, Receipt, Undo2, 
  CheckSquare, History, Image as ImageIcon, 
  Boxes, Users, Settings, LogOut, Sun, Moon 
} from 'lucide-react';
import { auth } from '../firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth'; 
import { userService } from '../firebase/userService';
import { todoService } from '../firebase/todoService';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  
  const [profile, setProfile] = useState(null);
  const [todoCount, setTodoCount] = useState(0); 

  // --- States สำหรับระบบ Guard ---
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // จัดการ Dark Mode 
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(!isDark);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // --- 🛡️ useEffect 1: ระบบรักษาความปลอดภัย Gatekeeper ---
  useEffect(() => {
    let unsubscribeRole = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribeRole = userService.listenToUserRole(user, (roleData) => {
          // เช็คสิทธิ์แบบครอบคลุมข้อมูลเก่าและใหม่
          const roleStr = String(roleData?.role || roleData?.userType || '').toLowerCase();
          const isStaffMember = roleData?.isStaff || 
            ['admin', 'manager', 'staff', 'packer', 'developer', 'owner', 'ผู้จัดการ', 'เจ้าของ'].includes(roleStr) ||
            (user.email === 'dh1notebook@gmail.com' || user.email === 'zhoulinjuan1@gmail.com');

          if (isStaffMember && roleData?.isActive !== false) {
            setIsCheckingAuth(false);
            setAccessDenied(false);
            setProfile(prev => prev || {
              firstName: roleData.displayName || user.displayName || 'พนักงาน',
              nickname: '',
              role: roleData.roles ? roleData.roles[0] : (roleData.role || 'Staff')
            });
          } else {
            // แจ้งเตือนรออนุมัติ สำหรับคนที่สมัครใหม่แต่ยังไม่มียศ
            setIsCheckingAuth(false);
            setAccessDenied(true);
          }
        });
      } else {
        navigate('/login');
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRole();
    };
  }, [navigate]);

  // --- 📝 useEffect 2: โหลดข้อมูลเดิมของระบบ ---
  useEffect(() => {
    let unsubscribeGeneralTodo = null;

    // Subscribe จำนวนงานค้างทั้งหมดสำหรับแสดงที่เมนู To-do
    if (typeof todoService.subscribePendingTodos === 'function') {
      unsubscribeGeneralTodo = todoService.subscribePendingTodos((todos) => {
        setTodoCount(todos.length);
      });
    }

    if (currentUser) {
      if (userService && typeof userService.getUserProfile === 'function') {
        userService.getUserProfile(currentUser.uid)
          .then(data => {
            if(data) setProfile(data);
          })
          .catch(err => console.error(err));
      }
    }

    return () => {
      if (unsubscribeGeneralTodo) unsubscribeGeneralTodo();
    };
  }, [currentUser]);

  // --- โครงสร้างเมนู ---
  const navItems = [
    { path: '/overview', label: 'ภาพรวม', icon: LayoutDashboard },
    { path: '/search', label: 'ค้นหาสินค้า', icon: Search },
    { path: '/billing', label: 'ระบบบิล', icon: Receipt },
    { path: '/claims', label: 'รับเคลม/คืน', icon: Undo2 },
    { path: '/todo', label: 'To-do', icon: CheckSquare, badge: todoCount },
    { path: '/history', label: 'ประวัติ', icon: History },
    { path: '/gallery', label: 'คลังภาพ', icon: ImageIcon },
    { path: '/inventory', label: 'สต๊อกสินค้า', icon: Boxes },
    { path: '/customers', label: 'ลูกค้า/ทีมงาน', icon: Users },
    { path: '/managers', label: 'ตั้งค่า/จัดการ', icon: Settings }
  ];

  // --- UI: หน้าจอตอนถูกปฏิเสธการเข้าถึง (รอการอนุมัติ) ---
  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors p-4">
        <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl text-center max-w-md border-t-4 border-amber-500">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
            <Users className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">บัญชีรอการอนุมัติ</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed font-medium">
            คุณได้ลงทะเบียนเข้าสู่ระบบเรียบร้อยแล้ว แต่อยู่ในสถานะ <br/>
            <span className="inline-block mt-2 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-500/20">"รอการอนุมัติสิทธิ์ (Pending)"</span> <br/><br/>
            กรุณาแจ้งผู้จัดการเพื่อกำหนดสิทธิ์การเข้าใช้งานระบบให้กับบัญชีของคุณ
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm active:scale-95">
              ตรวจสอบสถานะอีกครั้ง
            </button>
            <button onClick={handleLogout} className="w-full px-4 py-3 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95">
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- UI: หน้าจอตอนกำลังโหลดเช็คข้อมูล (Checking Auth) ---
  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
        <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-600 dark:border-blue-500 mx-auto mb-6"></div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">กำลังตรวจสอบสิทธิ์...</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">DH System Security Gatekeeper</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-slate-900 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 transition-colors duration-200">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-slate-700">
          <img src="/dh-logo.png" alt="DH Logo" className="h-8 object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              {profile?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                {profile ? `${profile.firstName} ${profile.nickname ? `(${profile.nickname})` : ''}` : 'กำลังโหลด...'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mt-0.5 truncate">
                {profile?.role || 'Staff'}
              </p>
            </div>

            <button 
              onClick={toggleDarkMode}
              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-white transition-colors shrink-0 outline-none"
              title={isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          
          <button 
            onClick={handleLogout}
            className="group w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors outline-none"
          >
            <LogOut size={16} className="transition-transform group-hover:-translate-x-0.5" />
            <span>เลิกงาน (ออกจากระบบ)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Outlet />
      </main>
    </div>
  );
}