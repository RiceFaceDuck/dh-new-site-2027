import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, Receipt, Undo2, 
  CheckSquare, History, Image as ImageIcon, 
  Boxes, Users, Settings, LogOut, Sun, Moon,
  UserCog, Megaphone, CreditCard, ShieldCheck // ✨ เพิ่ม ShieldCheck เข้ามาเพื่อแก้ Error
} from 'lucide-react';
import { auth } from '../firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth'; 
import { userService, SUPER_ADMINS } from '../firebase/userService'; 
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
  const [denyReason, setDenyReason] = useState('pending'); // 'pending' | 'blocked' | 'error'
  
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

  // --- 🛡️ useEffect 1: ระบบรักษาความปลอดภัย Gatekeeper [Enterprise Upgrade] ---
  useEffect(() => {
    let unsubscribeRole = () => {};
    let timeoutId;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 🚀 1. ระบบ Fail-safe (Timeout 10 วินาที)
        timeoutId = setTimeout(() => {
          console.warn("⚠️ [Gatekeeper] Connection timeout. Forcing access denied.");
          setIsCheckingAuth(false);
          setAccessDenied(true);
          setDenyReason('error');
        }, 10000);

        const userEmail = (user.email || '').toLowerCase();
        
        // 👑 2. Hardcode Bypass สำหรับผู้บริหารสูงสุด (Owner & VP 1)
        const isExecutive = SUPER_ADMINS.includes(userEmail);

        // 🔧 3. แก้ไขบั๊กส่ง user.uid แทน user แบบเดิม และรับพารามิเตอร์ error
        unsubscribeRole = userService.listenToUserRole(user.uid, (roleStr, roleData, error) => {
          clearTimeout(timeoutId); // ปลดชนวน Timeout ทันทีที่ข้อมูลมาถึง

          // ดัก Error จาก Firestore
          if (error) {
            console.error("🔥 [Gatekeeper] Error fetching role:", error);
            setIsCheckingAuth(false);
            setAccessDenied(true);
            setDenyReason('error');
            return;
          }

          const currentRoleStr = String(roleStr || roleData?.userType || '').toLowerCase();
          
          // เช็คสิทธิ์พนักงาน (รวม Legacy Account ที่มีแค่ isStaff: true)
          const isStaffMember = roleData?.isStaff || 
            ['admin', 'manager', 'staff', 'packer', 'developer', 'owner', 'ผู้จัดการ', 'เจ้าของ'].includes(currentRoleStr);
          
          const isPending = currentRoleStr === 'pending_approval' || currentRoleStr === 'pending';
          const isSuspended = roleData?.isActive === false || roleData?.status === 'suspended';

          // ✅ อนุมัติการเข้าถึงถ้าเป็นผู้บริหาร หรือ พนักงานที่ Active และไม่ได้อยู่ในสถานะ Pending
          if (isExecutive || (isStaffMember && !isSuspended && !isPending)) {
            setIsCheckingAuth(false);
            setAccessDenied(false);
            
            // กำหนดยศแสดงผลให้สวยงาม
            let displayRole = roleData?.roles ? roleData.roles[0] : (roleData?.role || 'Staff');
            if (isExecutive && userEmail === 'zhoulinjuan1@gmail.com') displayRole = 'Owner (เจ้าของ)';
            if (isExecutive && userEmail === 'dh1notebook@gmail.com') displayRole = 'VP 1 (รองประธาน)';

            setProfile(prev => prev || {
              firstName: roleData?.displayName || user.displayName || 'พนักงาน',
              nickname: '',
              role: displayRole
            });
          } else {
            // ❌ ปฏิเสธการเข้าถึง พร้อมแยกสาเหตุ
            setIsCheckingAuth(false);
            setAccessDenied(true);
            setDenyReason(isSuspended ? 'blocked' : 'pending');
          }
        });
      } else {
        clearTimeout(timeoutId);
        navigate('/login');
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribeAuth();
      unsubscribeRole();
    };
  }, [navigate]);

  // --- 📝 useEffect 2: โหลดข้อมูลเดิมของระบบ ---
  useEffect(() => {
    let unsubscribeGeneralTodo = null;

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

  // --- 🚀 โครงสร้างเมนูแบบจัดกลุ่มหมวดหมู่ ---
  const navItems = [
    { category: 'ส่วนงานหลัก' },
    { path: '/overview', label: 'ภาพรวม', icon: LayoutDashboard },
    { path: '/todo', label: 'To-do', icon: CheckSquare, badge: todoCount },
    { path: '/billing', label: 'ระบบบิล', icon: Receipt },
    { path: '/claims', label: 'รับเคลม/คืน', icon: Undo2 },
    
    { category: 'คลังข้อมูล' },
    { path: '/search', label: 'ค้นหาสินค้า', icon: Search },
    { path: '/inventory', label: 'สต๊อกสินค้า', icon: Boxes },
    { path: '/gallery', label: 'คลังภาพ', icon: ImageIcon },
    { path: '/history', label: 'ประวัติ', icon: History },
    { path: '/customers', label: 'ลูกค้า/ทีมงาน', icon: Users },
    
    { category: 'ส่วนงานผู้จัดการ' },
    { path: '/managers/ads', label: 'จัดการโฆษณา', icon: Megaphone },
    { path: '/managers/credit', label: 'Credit Point', icon: CreditCard },
    { path: '/managers', label: 'ตั้งค่า/จัดการรวม', icon: Settings }
  ];

  // --- UI: หน้าจอตอนกำลังโหลดเช็คข้อมูล (Checking Auth) ---
  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl text-center border border-slate-100 dark:border-slate-700 animate-in zoom-in duration-300">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            <ShieldCheck className="absolute inset-0 m-auto text-blue-600 dark:text-blue-500" size={24} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">กำลังตรวจสอบสิทธิ์...</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">DH System Security Gatekeeper</p>
        </div>
      </div>
    );
  }

  // --- UI: หน้าจอตอนถูกปฏิเสธการเข้าถึง (รอการอนุมัติ หรือ มีปัญหา) ---
  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors p-4">
        <div className={`p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl text-center max-w-md border-t-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
          denyReason === 'error' ? 'border-red-500' : 'border-amber-500'
        }`}>
          <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-6 ${
            denyReason === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
          }`}>
            <Users className="h-10 w-10" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            {denyReason === 'error' ? 'การเชื่อมต่อขัดข้อง' : denyReason === 'blocked' ? 'บัญชีถูกระงับ' : 'บัญชีรอการอนุมัติ'}
          </h2>
          
          <div className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed font-medium text-sm">
            {denyReason === 'error' ? (
              <p>ระบบไม่สามารถตรวจสอบสิทธิ์ของคุณได้ในขณะนี้ อาจเกิดจากปัญหาอินเทอร์เน็ตหรือเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง</p>
            ) : denyReason === 'blocked' ? (
              <p>บัญชีของคุณถูกระงับการเข้าถึงชั่วคราว กรุณาติดต่อผู้จัดการหรือผู้ดูแลระบบ</p>
            ) : (
              <p>
                คุณได้ลงทะเบียนเข้าสู่ระบบเรียบร้อยแล้ว แต่อยู่ในสถานะ <br/>
                <span className="inline-block mt-3 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-500/20 font-bold shadow-sm">"รอการอนุมัติสิทธิ์ (Pending)"</span> <br/><br/>
                กรุณาแจ้งผู้จัดการเพื่อเปิดสิทธิ์การเข้าใช้งานระบบ
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20 active:scale-95">
              โหลดข้อมูลใหม่
            </button>
            <button onClick={handleLogout} className="w-full px-4 py-3 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95">
              กลับไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- UI: หน้าหลัก (ผ่าน Gatekeeper) ---
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 transition-colors duration-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Logo */}
        <div className="h-[72px] flex items-center justify-center border-b border-slate-100 dark:border-slate-700/50 shrink-0">
          <img src="/dh-logo.png" alt="DH Logo" className="h-9 object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 custom-scrollbar">
          {navItems.map((item, index) => {
            if (item.category) {
              return (
                <div key={`cat-${index}`} className="px-3 pt-5 pb-2 first:pt-0">
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {item.category}
                  </p>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = item.path === '/managers' 
              ? location.pathname === '/managers' 
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400 transition-colors'} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black shadow-sm ${
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
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
          
          {/* User Info Block */}
          <div className="relative group flex items-start gap-3 p-2.5 -mx-2 mb-4 rounded-2xl hover:bg-white dark:hover:bg-slate-700/50 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm">
            
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Profile" 
                className="w-11 h-11 rounded-[14px] object-cover shrink-0 border border-slate-200 dark:border-slate-600 shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm border border-indigo-400 dark:border-indigo-500">
                {profile?.firstName?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            
            <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">
                {profile ? `${profile.firstName} ${profile.nickname ? `(${profile.nickname})` : ''}` : (currentUser?.displayName || 'กำลังโหลด...')}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5" title={currentUser?.email}>
                {currentUser?.email || 'ไม่มีอีเมล'}
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
              onClick={handleLogout}
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 transition-colors duration-200 relative">
        {/* Background Gradients for Depth */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent pointer-events-none -z-10"></div>
        <Outlet />
      </main>
    </div>
  );
}