import React from 'react';

const MAX_AUTO_RETRIES = 3;
const RETRY_KEY = 'dh_staff_retry_count';
const RETRY_PATH_KEY = 'dh_staff_retry_path';

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

  componentDidCatch(error, errorInfo) {
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

      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 600);
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
          <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-800 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center border border-slate-200 flex flex-col items-center">
              <div className="w-12 h-12 mb-4 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">กำลังเชื่อมต่อและโหลดข้อมูลใหม่...</h2>
              <p className="text-slate-500 text-xs">
                ระบบกำลังปรับปรุงการเชื่อมต่ออัตโนมัติ (ครั้งที่ {this.state.retryCount}/{MAX_AUTO_RETRIES})
              </p>
            </div>
          </div>
        );
      }

      // 2. กรณีพยายามครบ 3 รอบแล้วยังพบปัญหา ให้แสดงหน้าจอปกติพร้อมปุ่มรีเซ็ต
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-800 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center border-t-4 border-red-500">
            <h1 className="text-xl font-bold mb-4 text-red-600">ระบบพบข้อผิดพลาด</h1>
            <p className="text-slate-600 mb-6 text-sm">
              ขออภัย เกิดข้อผิดพลาดในการแสดงผล กรุณารีเฟรชหน้าต่างใหม่ หากปัญหายังคงอยู่กรุณาติดต่อผู้ดูแลระบบ
            </p>
            <button 
              onClick={this.handleManualRefresh}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold cursor-pointer"
            >
              รีเฟรชระบบ
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 text-left p-4 bg-slate-50 rounded-sm overflow-auto text-xs text-slate-500 max-h-48 border border-slate-200">
                <p className="font-mono font-bold">{this.state.error && this.state.error.toString()}</p>
                <pre className="font-mono mt-2">{this.state.error && this.state.error.stack}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
