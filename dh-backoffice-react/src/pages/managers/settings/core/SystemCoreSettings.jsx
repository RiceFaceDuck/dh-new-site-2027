import React from 'react';
import { useCoreSettings } from './useCoreSettings';
import CoreForm from './CoreForm';
import CoreGuide from './CoreGuide';

export default function SystemCoreSettings() {
  const {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    saveSettings
  } = useCoreSettings();

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-700 to-slate-900 p-8 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            ตั้งค่าระบบหลักและคอขวด (System Core)
          </h1>
          <p className="text-slate-300 mt-2 font-medium text-sm">
            จัดการ Distributed Counters และตั้งค่าการกระจายโหลดฐานข้อมูล
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Configuration Form */}
        <div className="w-full lg:w-2/3">
          {isLoading ? (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xs text-center">
              <p className="text-slate-500">กำลังโหลดข้อมูลการตั้งค่า...</p>
            </div>
          ) : (
            <CoreForm 
              settings={settings}
              updateSettings={updateSettings}
              saveSettings={saveSettings}
              isSaving={isSaving}
            />
          )}
        </div>

        {/* Right Side: In-App Documentation */}
        <div className="w-full lg:w-1/3">
          <CoreGuide />
        </div>
      </div>
    </div>
  );
}
