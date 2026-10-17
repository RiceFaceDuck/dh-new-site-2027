import { useNavigate } from 'react-router-dom';
import { usePaymentSettings } from './usePaymentSettings';
import PaymentForm from './PaymentForm';
import PaymentGuide from './PaymentGuide';
import { CreditCard, ArrowLeft } from 'lucide-react';

export default function PaymentSettingsPage() {
  const navigate = useNavigate();
  const {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    saveSettings
  } = usePaymentSettings();

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb Back Action */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/managers')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <ArrowLeft size={16} className="text-blue-600" />
          <span>กลับหน้าผู้จัดการระบบ (Managers)</span>
        </button>
      </div>

      {/* Header Banner - Matching Backoffice Corporate Blue (#1e3a8a) */}
      <div className="bg-[#1e3a8a] p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden border border-blue-900">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <CreditCard className="w-8 h-8 text-blue-300" />
            ตั้งค่าวิธีชำระเงินและบัญชีธนาคาร (Payment Settings)
          </h1>
          <p className="text-blue-100 mt-2 font-medium text-sm">
            จัดการข้อมูลบัญชีธนาคารและช่องทางรับเงินสำหรับลูกค้าหน้าเว็บไซต์
          </p>
        </div>

        {/* Prominent High-Visibility Back Button */}
        <div className="relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/managers')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#1e3a8a] hover:bg-blue-50 active:bg-blue-100 font-black text-sm rounded-xl shadow-lg border border-white/80 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
            <span>ย้อนกลับ</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Form */}
        <div className="w-full lg:w-2/3">
          {isLoading ? (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xs text-center border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลการตั้งค่าบัญชี...</p>
            </div>
          ) : (
            <PaymentForm 
              settings={settings}
              updateSettings={updateSettings}
              saveSettings={saveSettings}
              isSaving={isSaving}
            />
          )}
        </div>

        {/* Right Side: Guide */}
        <div className="w-full lg:w-1/3">
          <PaymentGuide />
        </div>
      </div>
    </div>
  );
}
