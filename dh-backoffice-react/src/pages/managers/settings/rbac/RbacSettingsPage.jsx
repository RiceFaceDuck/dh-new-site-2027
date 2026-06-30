import React, { useState } from 'react';
import { useRbacSettings } from './useRbacSettings';
import RbacForm from './RbacForm';
import RbacGuide from './RbacGuide';

export default function RbacSettingsPage() {
  const { settings, loading, saveSettings } = useRbacSettings();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="flex-1 bg-dh-bg p-4 sm:p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-dh-main">การจัดการสิทธิ์พนักงาน (RBAC Settings)</h1>
            <p className="text-sm text-dh-muted">ตั้งค่าการเข้าถึงเมนูและการดำเนินการต่างๆ แยกตามตำแหน่ง (Role)</p>
          </div>
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-dh-primary text-white rounded hover:bg-dh-primary-hover shadow-sm"
          >
            คู่มือการใช้งาน (Guide)
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-dh-border rounded-lg p-4 sm:p-6 shadow-sm">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
              <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
            </div>
          ) : (
            <RbacForm initialSettings={settings} onSave={saveSettings} />
          )}
        </div>
      </div>

      <RbacGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
