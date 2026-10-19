import React from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    
    // Log to Firestore system_logs
    try {
      const user = auth?.currentUser;
      await addDoc(collection(db, getCollectionPath('system_logs')), {
        action: 'backoffice_crash',
        category: 'ERROR',
        details: {
          errorMessage: error.toString(),
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent
        },
        userUid: user?.uid || 'anonymous',
        userRole: 'manager',
        createdAt: serverTimestamp()
      });
    } catch (logError) {
      console.error("Failed to log error to Firestore:", logError);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function' 
          ? this.props.fallback(this.state.error, () => this.setState({ hasError: false, error: null }))
          : this.props.fallback;
      }
      return (
        <div className="min-h-[400px] h-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-500 mx-auto flex items-center justify-center mb-4 text-2xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              เกิดข้อผิดพลาดในการแสดงผลหน้าจอ
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 font-mono text-xs bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
              {this.state.error?.message || 'ระบบเกิดข้อผิดพลาดชั่วคราว ข้อมูลบิลและดราฟต์ของคุณถูกบันทึกไว้อย่างปลอดภัย'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-900 font-semibold rounded-xl text-sm transition-colors shadow-sm"
            >
              🔄 รีโหลดหน้านี้ใหม่
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
