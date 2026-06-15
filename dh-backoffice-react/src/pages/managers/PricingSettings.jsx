import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Save, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { usePricingSettings } from './pricing/hooks/usePricingSettings';
import PricingRulesTable from './pricing/PricingRulesTable';
import PricingHistoryLog from './pricing/PricingHistoryLog';
import SmartRoundingPolicy from './pricing/SmartRoundingPolicy';
import PricingSimulation from './pricing/PricingSimulation';

export default function PricingSettings() {
  const navigate = useNavigate();
  
  const {
    loading, saving, config, isDirty,
    simCost, setSimCost, simCategory, setSimCategory, simResult,
    logs, loadingLogs, fetchPricingLogs,
    handleSave, handleRuleChange, addRule, removeRule, handleRoundingChange, runSimulation
  } = usePricingSettings();

  if (loading || !config) return <div className="flex justify-center items-center h-full bg-[var(--dh-bg-base)]"><RefreshCw className="animate-spin text-[var(--dh-accent)]" size={40} /></div>;

  return (
    <div className="flex flex-col h-full bg-[var(--dh-bg-base)] p-3 lg:p-4 overflow-hidden font-sans relative transition-colors duration-300 gap-3 lg:gap-4">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between px-5 py-4 bg-[var(--dh-bg-surface)] rounded-2xl shadow-sm border border-[var(--dh-border)] shrink-0 z-20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/managers')} className="p-2 hover:bg-[var(--dh-bg-base)] rounded-lg text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] transition-colors active:scale-95">
            <ArrowLeft size={22} strokeWidth={2.5}/>
          </button>
          <div>
            <h1 className="text-xl font-black text-[var(--dh-text-main)] flex items-center gap-2 leading-none">
              <Calculator className="text-[var(--dh-accent)]" size={24} strokeWidth={2.5} /> โครงสร้างราคาปลีก
            </h1>
            <p className="text-[11px] font-bold text-[var(--dh-text-muted)] mt-1.5 uppercase tracking-wider">Retail Pricing Engine Configuration</p>
          </div>
        </div>
        
        {/* Smart Save Button */}
        <button 
          onClick={handleSave} 
          disabled={saving || !isDirty}
          className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-300 flex items-center gap-2 shadow-sm active:scale-95
            ${isDirty && !saving 
              ? 'bg-[var(--dh-accent)] hover:bg-[var(--dh-accent-hover)] text-white shadow-[0_0_15px_var(--dh-accent-light)] animate-pulse border border-transparent' 
              : 'bg-[var(--dh-bg-base)] text-[var(--dh-text-muted)] border border-[var(--dh-border)] cursor-not-allowed opacity-60'}
          `}
        >
          {saving ? <RefreshCw className="animate-spin" size={16} strokeWidth={2.5} /> : (isDirty ? <Save size={16} strokeWidth={2.5} /> : <CheckCircle2 size={16} strokeWidth={2.5} />)}
          {saving ? 'กำลังบันทึก...' : isDirty ? 'บันทึกการตั้งค่า' : 'เป็นปัจจุบัน'}
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col xl:flex-row gap-3 lg:gap-4">
        
        {/* LEFT: Rules & Logs */}
        <div className="flex-1 flex flex-col gap-3 lg:gap-4 min-w-0">
          <PricingRulesTable 
            config={config} 
            addRule={addRule} 
            removeRule={removeRule} 
            handleRuleChange={handleRuleChange} 
          />
          <PricingHistoryLog 
            logs={logs} 
            loadingLogs={loadingLogs} 
            fetchPricingLogs={fetchPricingLogs} 
          />
        </div>

        {/* RIGHT: Rounding Policy & Simulation Tool */}
        <div className="w-full xl:w-[35%] flex flex-col gap-3 lg:gap-4 shrink-0 min-w-[320px]">
          <SmartRoundingPolicy 
            config={config} 
            handleRoundingChange={handleRoundingChange} 
          />
          <PricingSimulation 
            simCost={simCost} setSimCost={setSimCost}
            simCategory={simCategory} setSimCategory={setSimCategory}
            config={config} runSimulation={runSimulation} simResult={simResult}
          />
        </div>

      </div>
    </div>
  );
}