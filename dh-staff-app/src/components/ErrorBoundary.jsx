import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-800 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center border-t-4 border-red-500">
            <h1 className="text-xl font-bold mb-4 text-red-600">ระบบพบข้อผิดพลาด</h1>
            <p className="text-slate-600 mb-6">
              ขออภัย เกิดข้อผิดพลาดในการแสดงผล กรุณารีเฟรชหน้าต่างใหม่ หากปัญหายังคงอยู่กรุณาติดต่อผู้ดูแลระบบ
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-medium"
            >
              รีเฟรชระบบ
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 text-left p-4 bg-slate-50 rounded overflow-auto text-xs text-slate-500 max-h-48 border border-slate-200">
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
