import { useState } from 'react';
import { Settings, Bell } from 'lucide-react';
import { useCreditSettingsState } from './useCreditSettingsState';
import CreditSettingsForm from './CreditSettingsForm';
import CreditSettingsGuide from './CreditSettingsGuide';

export default function CreditSettingsTab() {
  const [showGuide, setShowGuide] = useState(false);

  const {
    settings,
    setSettings,
    isLoading,
    isSaving,
    saveSuccess,
    handleToggle,
    handleChange,
    handleSaveSettings
  } = useCreditSettingsState();

  return (
    <div className="flex flex-col bg-white border border-slate-300 rounded-xs min-h-[500px]">
      
      <div className="p-3 border-b border-slate-300 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-slate-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">System Configuration</h3>
            <p className="text-xs text-slate-500">Core Engine rules & operational limits</p>
          </div>
        </div>
        <button 
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-sm border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
        >
          <Bell size={14} /> คู่มือการตั้งค่า (Guide)
        </button>
      </div>

      <CreditSettingsForm 
        settings={settings}
        setSettings={setSettings}
        isLoading={isLoading}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        handleToggle={handleToggle}
        handleChange={handleChange}
        handleSaveSettings={handleSaveSettings}
      />

      {showGuide && <CreditSettingsGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}