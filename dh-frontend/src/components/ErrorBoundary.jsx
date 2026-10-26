import React from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const MAX_AUTO_RETRIES = 3;
const RETRY_KEY = 'dh_eb_retry_count';
const RETRY_PATH_KEY = 'dh_eb_retry_path';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isAutoReloading: false,
      retryCount: 0
    };
    this.clearTimer = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidMount() {
    // หากหน้าเว็บเรนเดอร์สำเร็จและทำงานได้ปกติเกิน 4 วินาที ให้เคลียร์ตัวนับรอบ
    this.clearTimer = setTimeout(() => {
      try {
        sessionStorage.removeItem(RETRY_KEY);
        sessionStorage.removeItem(RETRY_PATH_KEY);
      } catch {
        // ป้องกันกรณีเว็บบราวเซอร์ปิดการใช้งาน storage
      }
    }, 4000);
  }

  componentWillUnmount() {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }
  }

  async componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);

    let currentRetries = 0;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    try {
      const savedPath = sessionStorage.getItem(RETRY_PATH_KEY);
      if (savedPath === currentPath) {
        currentRetries = parseInt(sessionStorage.getItem(RETRY_KEY) || '0', 10);
      } else {
        sessionStorage.setItem(RETRY_PATH_KEY, currentPath);
        sessionStorage.setItem(RETRY_KEY, '0');
        currentRetries = 0;
      }
    } catch (storageErr) {
      console.warn("Storage access warning:", storageErr);
    }

    const shouldAutoRetry = currentRetries < MAX_AUTO_RETRIES;
    const nextRetries = currentRetries + 1;

    if (shouldAutoRetry) {
      try {
        sessionStorage.setItem(RETRY_KEY, nextRetries.toString());
        sessionStorage.setItem(RETRY_PATH_KEY, currentPath);
      } catch {}

      this.setState({
        isAutoReloading: true,
        retryCount: nextRetries
      });

      // หน่วงเวลาสั้นๆ 600ms เพื่อให้ส่ง Firestore error log ทัน และ reload อย่างนุ่มนวล
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 600);
    }

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
          userAgent: navigator.userAgent,
          autoRetried: shouldAutoRetry,
          retryAttempt: shouldAutoRetry ? nextRetries : currentRetries,
          maxRetries: MAX_AUTO_RETRIES
        },
        userUid: user?.uid || 'anonymous',
        userRole: 'customer',
        createdAt: serverTimestamp()
      });
    } catch (logError) {
      console.error("Failed to log error to Firestore:", logError);
    }
  }

  handleManualRefresh = () => {
    try {
      sessionStorage.removeItem(RETRY_KEY);
      sessionStorage.removeItem(RETRY_PATH_KEY);
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // กรณีอยู่ในระหว่างพยายาม Auto-Refresh (ไม่เกิน 3 รอบ)
      if (this.state.isAutoReloading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center border border-slate-100 flex flex-col items-center">
              <div className="w-12 h-12 mb-4 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">กำลังเชื่อมต่อและโหลดข้อมูลใหม่...</h2>
              <p className="text-slate-500 text-xs">
                ระบบกำลังปรับปรุงการเชื่อมต่ออัตโนมัติ (ครั้งที่ {this.state.retryCount}/{MAX_AUTO_RETRIES})
              </p>
            </div>
          </div>
        );
      }

      // กรณีพยายามครบ 3 รอบแล้วยังพบปัญหา ให้แสดงหน้าจอปกติพร้อมปุ่มรีเซ็ต
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
              onClick={this.handleManualRefresh}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors font-medium cursor-pointer"
            >
              รีเฟรชหน้าเว็บ
            </button>
            {import.meta.env.DEV && (
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
