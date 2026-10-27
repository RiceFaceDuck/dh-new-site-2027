import React from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const MAX_AUTO_RETRIES = 3;
const RETRY_KEY = 'dh_bo_retry_count';
const RETRY_PATH_KEY = 'dh_bo_retry_path';

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
        action: 'backoffice_crash',
        category: 'ERROR',
        details: {
          errorMessage: error?.toString() || '',
          componentStack: errorInfo?.componentStack || '',
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          autoRetried: shouldAutoRetry,
          retryAttempt: shouldAutoRetry ? nextRetries : currentRetries,
          maxRetries: MAX_AUTO_RETRIES
        },
        userUid: user?.uid || 'anonymous',
        userRole: 'manager',
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
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // 1. กรณีอยู่ในระหว่าง Auto-Refresh (ไม่เกิน 3 รอบ)
      if (this.state.isAutoReloading) {
        return (
          <div className="min-h-[400px] h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center flex flex-col items-center">
              <div className="w-12 h-12 mb-4 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                กำลังเชื่อมต่อและโหลดข้อมูลใหม่...
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                ระบบกำลังปรับปรุงการเชื่อมต่ออัตโนมัติ (ครั้งที่ {this.state.retryCount}/{MAX_AUTO_RETRIES})
              </p>
            </div>
          </div>
        );
      }

      // 2. Custom fallback ถ้ามีส่งเข้ามา
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function' 
          ? this.props.fallback(this.state.error, () => {
              this.setState({ hasError: false, error: null, isAutoReloading: false });
            })
          : this.props.fallback;
      }

      // 3. กรณีพยายามครบ 3 รอบแล้วยังพบปัญหา ให้แสดงหน้าจอปกติพร้อมปุ่มรีเซ็ต
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
              onClick={this.handleManualRefresh}
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
