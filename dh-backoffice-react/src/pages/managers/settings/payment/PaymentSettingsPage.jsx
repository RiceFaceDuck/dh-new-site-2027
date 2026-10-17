import { usePaymentSettings } from './usePaymentSettings';
import PaymentForm from './PaymentForm';
import PaymentGuide from './PaymentGuide';
import { CreditCard } from 'lucide-react';

export default function PaymentSettingsPage() {
  const {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    saveSettings
  } = usePaymentSettings();

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-amber-600 via-amber-700 to-slate-900 p-8 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <CreditCard className="w-8 h-8 text-amber-300" />
            ตั้งค่าวิธีชำระเงินและบัญชีธนาคาร (Payment Settings)
          </h1>
          <p className="text-amber-100 mt-2 font-medium text-sm">
            จัดการข้อมูลบัญชีธนาคารและช่องทางรับเงินสำหรับลูกค้าหน้าเว็บไซต์
          </p>
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
