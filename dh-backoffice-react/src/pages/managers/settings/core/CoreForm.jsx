import { Save, Layers, Server } from 'lucide-react';

export default function CoreForm({ settings, updateSettings, saveSettings, isSaving }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 p-6 space-y-6">
      
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
        <Server className="text-blue-500" size={24} />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          การจัดการ Distributed Counters
        </h2>
      </div>

      <div className="space-y-6">
        
        {/* Enable Sharding */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">เปิดใช้งาน Sharded Counters</h3>
            <p className="text-sm text-slate-500 mt-1">
              กระจายภาระการเขียน Document เพื่อลดปัญหาคอขวด (Firestore limits)
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={settings.enableSharding || false}
              onChange={(e) => updateSettings('enableSharding', e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-500"></div>
          </label>
        </div>

        {/* Max Shards */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Layers size={16} className="text-slate-400" />
            จำนวน Shards สูงสุด (Max Shards)
          </label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="1"
              value={settings.maxShards || 5}
              onChange={(e) => updateSettings('maxShards', parseInt(e.target.value))}
              disabled={!settings.enableSharding}
              className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 ${!settings.enableSharding && 'opacity-50'}`}
            />
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 min-w-8 text-center">
              {settings.maxShards || 5}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            ค่าเริ่มต้นคือ 5 (รองรับได้ประมาณ 5 writes/second ต่อ Counter) หากมีออเดอร์พร้อมกันจำนวนมากให้ปรับเพิ่มขึ้น
          </p>
        </div>

      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save size={18} />
          )}
          บันทึกการตั้งค่าระบบ
        </button>
      </div>

    </div>
  );
}
