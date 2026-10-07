import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default class ModalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ModalErrorBoundary] Error caught in modal (${this.props.modalName || 'Modal'}):`, error, errorInfo);
  }

  handleClose = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-dh-surface rounded-2xl shadow-dh-elevated border border-dh-border w-full max-w-md overflow-hidden p-6 flex flex-col items-center text-center">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full mb-3">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-black text-dh-main mb-1">
              เกิดข้อผิดพลาดในหน้าต่าง {this.props.modalName || ''}
            </h3>
            <p className="text-xs text-dh-muted mb-4 leading-relaxed">
              ระบบตรวจพบข้อผิดพลาดในหน้าต่างนี้และได้แยกส่วนการทำงานเพื่อป้องกันไม่ให้กระทบตารางสินค้าหลัก
            </p>
            {this.state.error?.message && (
              <div className="w-full bg-dh-base p-2.5 rounded-lg border border-dh-border text-left mb-4 overflow-x-auto text-[11px] font-mono text-rose-400">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleClose}
              className="px-5 py-2 bg-dh-accent hover:bg-dh-accent-hover text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
