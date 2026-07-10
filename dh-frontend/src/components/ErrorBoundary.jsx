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
        action: 'frontend_crash',
        category: 'ERROR',
        details: {
          errorMessage: error.toString(),
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent
        },
        userUid: user?.uid || 'anonymous',
        userRole: 'customer',
        createdAt: serverTimestamp()
      });
    } catch (logError) {
      console.error("Failed to log error to Firestore:", logError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-slate-100">
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">ขออภัย เกิดข้อผิดพลาด</h1>
            <p className="text-slate-500 mb-6 text-sm">
              ระบบกำลังประสบปัญหาขัดข้องชั่วคราว กรุณารีเฟรชหน้าเว็บหรือลองใหม่อีกครั้งในภายหลัง
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors font-medium"
            >
              รีเฟรชหน้าเว็บ
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 text-left p-4 bg-slate-100 rounded-lg overflow-auto text-xs text-slate-600 max-h-48">
                <p className="font-mono font-bold mb-1">{this.state.error && this.state.error.toString()}</p>
                <pre className="font-mono">{this.state.error && this.state.error.stack}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
