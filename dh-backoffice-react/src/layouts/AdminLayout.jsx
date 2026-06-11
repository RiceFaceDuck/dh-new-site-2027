import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { todoService } from '../firebase/todoService';
import { userService } from '../firebase/userService';
import { useGmail } from '../pages/emails/hooks/useGmail';
import { RefreshCw } from 'lucide-react';

import Sidebar from './components/Sidebar';
import { GatekeeperChecking, GatekeeperDenied } from './components/GatekeeperUI';

export default function AdminLayout() {
  const { 
    isCheckingAuth, 
    accessDenied, 
    denyReason, 
    logout 
  } = useAuth();
  
  const [todoCount, setTodoCount] = useState(0); 
  const [pendingStaffCount, setPendingStaffCount] = useState(0);
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

    if (typeof todoService.subscribePendingTodos === 'function') {
      unsubscribeGeneralTodo = todoService.subscribePendingTodos((todos) => {
        setTodoCount(todos.length);
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
    };
  }, []);

  if (isCheckingAuth) {
    return <GatekeeperChecking />;
  }

  if (accessDenied) {
    return <GatekeeperDenied denyReason={denyReason} handleLogout={logout} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Sidebar 
        todoCount={todoCount}
        unreadCount={unreadCount}
        pendingStaffCount={pendingStaffCount}
        isDark={isDark}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden bg-slate-50/50 dark:bg-slate-900/50 transition-colors duration-200 relative scroll-smooth custom-scrollbar">
        {/* Background Gradients for Depth */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent pointer-events-none -z-10"></div>
        <Outlet />
      </main>
    </div>
  );
}