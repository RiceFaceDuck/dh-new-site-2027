import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* 🌟 Global Toast Notification */}
      {toast.show && (
        <div className={`fixed top-20 right-4 md:right-8 z-[9999] px-6 py-3 rounded-md shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 duration-300 border ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
};
