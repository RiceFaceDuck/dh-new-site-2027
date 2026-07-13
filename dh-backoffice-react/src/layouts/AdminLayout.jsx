import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { todoService } from '../firebase/todoService';
import { managerTodoService } from '../firebase/managerTodoService';
import { userService } from '../firebase/userService';
import { useGmail } from '../pages/emails/hooks/useGmail';
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts';

import Sidebar from './components/Sidebar';
import { GatekeeperChecking, GatekeeperDenied } from './components/GatekeeperUI';
import FloatingMiniCart from '../components/billing/FloatingMiniCart';

export default function AdminLayout() {
  const { 
    isCheckingAuth, 
    accessDenied, 
    denyReason, 
    logout 
  } = useAuth();
  
  useGlobalShortcuts();

  const [todoCount, setTodoCount] = useState(0); 
  const [pendingStaffCount, setPendingStaffCount] = useState(0);
  const [pendingClaimCount, setPendingClaimCount] = useState(0);
  const [managerApprovalCount, setManagerApprovalCount] = useState(0);
  const { unreadCount } = useGmail();
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(!isDark);

  // --- โหลดข้อมูลแจ้งเตือน (Todo / Pending Staff) ---
  useEffect(() => {
    let unsubscribeGeneralTodo = null;
    let unsubscribeManagerTodo = null;

    if (typeof todoService.subscribePendingTodos === 'function') {
      unsubscribeGeneralTodo = todoService.subscribePendingTodos((todos) => {
        setTodoCount(todos.length);
      });
    }

    if (typeof managerTodoService.subscribeManagerApprovals === 'function') {
      unsubscribeManagerTodo = managerTodoService.subscribeManagerApprovals((managerTodos) => {
        setManagerApprovalCount(managerTodos.length);
        const claims = managerTodos.filter(todo => 
          (todo.type === 'CLAIM_APPROVAL' || todo.type === 'RETURN_APPROVAL' || todo.type === 'CANCEL_CLAIM_APPROVAL' || todo.type === 'CANCEL_RETURN_APPROVAL') &&
          ['pending_manager', 'waiting_item', 'processing'].includes(todo.status)
        );
        setPendingClaimCount(claims.length);
      });
    }

    const fetchPendingStaffCount = async () => {
        try {
            const pendingStaff = await userService.getPendingStaff();
            setPendingStaffCount(pendingStaff.length);
        } catch (err) {
            console.error("Error fetching pending staff count", err);
        }
    };
    fetchPendingStaffCount();

    return () => {
      if (unsubscribeGeneralTodo) unsubscribeGeneralTodo();
      if (unsubscribeManagerTodo) unsubscribeManagerTodo();
    };
  }, []);

  if (isCheckingAuth) {
    return <GatekeeperChecking />;
  }

  if (accessDenied) {
    return <GatekeeperDenied denyReason={denyReason} handleLogout={logout} />;
  }

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-200 relative">

      
      <Sidebar 
        todoCount={todoCount}
        unreadCount={unreadCount}
        pendingStaffCount={pendingStaffCount}
        pendingClaimCount={pendingClaimCount}
        managerApprovalCount={managerApprovalCount}
        isDark={isDark}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden bg-transparent transition-colors duration-200 relative scroll-smooth custom-scrollbar dh-glass">
        {/* Background Gradients for Depth */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-linear-to-b from-blue-50/30 to-transparent dark:from-blue-900/20 dark:to-transparent pointer-events-none -z-10"></div>
        <Outlet />
      </main>

      <FloatingMiniCart />
    </div>
  );
}