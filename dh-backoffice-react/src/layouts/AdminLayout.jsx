import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { todoService } from '../firebase/todoService';
import { managerTodoService, CLAIM_TASK_TYPES } from '../firebase/managerTodoService';
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
    logout,
    isManagerOrOwner 
  } = useAuth();
  
  const hasManagerAccess = typeof isManagerOrOwner === 'function' ? isManagerOrOwner() : false;
  
  useGlobalShortcuts();

  const [todoCount, setTodoCount] = useState(0); 
  const [pendingClaimCount, setPendingClaimCount] = useState(0);
  const [managerApprovalCount, setManagerApprovalCount] = useState(0);
  const { unreadCount } = useGmail();
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('dh_theme_mode');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return document.documentElement.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dh_theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dh_theme_mode', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(!isDark);

  // --- โหลดข้อมูลแจ้งเตือน (Todo / Pending Staff) ---
  useEffect(() => {
    if (isCheckingAuth || accessDenied) return;

    let unsubscribeGeneralTodo = null;
    let unsubscribeManagerTodo = null;

    if (typeof todoService.subscribePendingTodos === 'function') {
      unsubscribeGeneralTodo = todoService.subscribePendingTodos((todos) => {
        setTodoCount(todos.length);
      });
    }

    if (hasManagerAccess && typeof managerTodoService.subscribeManagerApprovals === 'function') {
      unsubscribeManagerTodo = managerTodoService.subscribeManagerApprovals((managerTodos) => {
        setManagerApprovalCount(managerTodos.length);
        const claims = managerTodos.filter(todo => {
          const typeToCheck = todo.type || todo.taskType;
          const isClaim = CLAIM_TASK_TYPES ? CLAIM_TASK_TYPES.includes(typeToCheck) : 
            ['CLAIM_APPROVAL', 'RETURN_APPROVAL', 'EXCHANGE_APPROVAL', 'CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL', 'CANCEL_EXCHANGE_APPROVAL'].includes(typeToCheck);
          return isClaim && ['pending_manager', 'waiting_item', 'processing'].includes(todo.status);
        });
        setPendingClaimCount(claims.length);
      });
    }

    return () => {
      if (unsubscribeGeneralTodo) unsubscribeGeneralTodo();
      if (unsubscribeManagerTodo) unsubscribeManagerTodo();
    };
  }, [isCheckingAuth, accessDenied, hasManagerAccess]);

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