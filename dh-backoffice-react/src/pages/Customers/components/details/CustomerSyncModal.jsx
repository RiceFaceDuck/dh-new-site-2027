import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { syncCustomerAccount } from '../../../../firebase/customerAdminService';

export default function CustomerSyncModal({ isOpen, onClose, customer, onSyncComplete }) {
  const [targetId, setTargetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !customer) return null;

  const handleSync = async (e) => {
    e.preventDefault();
    if (!targetId || targetId.length < 5) {
      setError('กรุณากรอก Account ID ปลายทางให้ถูกต้อง');
      return;
    }

    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการโอนย้ายข้อมูลทั้งหมดไปยังบัญชีปลายทาง? ข้อมูลคำสั่งซื้อและเครดิตจะถูกย้ายถาวร (โอนย้ายแล้วจะไม่สามารถคืนค่ากลับได้ง่ายๆ)')) {
      setLoading(true);
      setError(null);
      setSuccessMsg('');

      try {
        const res = await syncCustomerAccount(customer.id, targetId.trim().toUpperCase());
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSyncComplete(); // Close and refresh
        }, 3000);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const displayName = customer.storeName || customer.displayName || customer.accountName || 'ไม่ระบุชื่อ';

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
          <div className="flex items-center gap-3 text-indigo-700">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 className="font-bold">ควบรวมและโอนย้ายบัญชี (Sync Data)</h3>
              <p className="text-xs text-indigo-500 font-medium">นำข้อมูลจากบัญชีเก่า ไปผูกกับบัญชีหน้าเว็บ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors" disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSync} className="p-6">
          <div className="flex flex-col gap-4 mb-6">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center text-center">
              <span className="text-xs text-slate-500 font-bold mb-1">บัญชีต้นทาง (บัญชีนี้)</span>
              <span className="font-bold text-sm text-slate-800">{displayName}</span>
              <span className="text-xs font-mono text-slate-400 mt-1">ID: {customer.id.substring(0,8)}</span>
            </div>

            <div className="flex justify-center text-indigo-300">
              <ArrowRight size={24} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Account ID ปลายทาง (Target ID) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="เช่น 8RP6WHIM"
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl outline-none text-sm font-mono tracking-wider transition-all placeholder-slate-300"
                required
                disabled={loading}
              />
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                ให้ลูกค้าคัดลอกรหัส Account ID จากหน้า Profile บนหน้าเว็บไซต์ แล้วนำมากรอกที่นี่ ข้อมูลเงินและคำสั่งซื้อทั้งหมดของบัญชีต้นทาง จะถูกย้ายไปบัญชีปลายทาง
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading || successMsg}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'เริ่มโอนย้ายข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
