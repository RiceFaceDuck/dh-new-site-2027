import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, ArrowLeft, RefreshCw, Save, CheckCircle2, HelpCircle } from 'lucide-react';
import GuideModal from '../../components/common/GuideModal';
import { usePricingSettings } from './pricing/hooks/usePricingSettings';
import SmartRoundingPolicy from './pricing/SmartRoundingPolicy';
import PricingRulesTable from './pricing/PricingRulesTable';
import PricingHistoryLog from './pricing/PricingHistoryLog';
import PricingSimulation from './pricing/PricingSimulation';

export default function PricingSettings() {
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);

  const {
    loading, saving, config, isDirty,
    simMode, setSimMode,
    skuInput, setSkuInput,
    simProduct, searchingSku, skuError,
    simulateBySku, handleRandomSku,
    simCost, setSimCost,
    simCategory, setSimCategory,
    simResult, matchedRuleId,
    runSimulation,
    logs, loadingLogs, fetchPricingLogs,
    handleSave, handleRuleChange, moveRule, addRule, removeRule, handleRoundingChange,
    categories
  } = usePricingSettings();

  if (loading || !config) {
    return (
      <div className="flex justify-center items-center h-full bg-(--dh-bg-base)">
        <RefreshCw className="animate-spin text-(--dh-accent)" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-(--dh-bg-base) p-3 lg:p-4 overflow-hidden font-sans relative transition-colors duration-300 gap-3 lg:gap-4">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between px-5 py-4 bg-(--dh-bg-surface) rounded-2xl shadow-xs border border-(--dh-border) shrink-0 z-20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/managers')}
            className="p-2 hover:bg-(--dh-bg-base) rounded-lg text-(--dh-text-muted) hover:text-(--dh-text-main) transition-colors active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-(--dh-text-main) flex items-center gap-2 leading-none">
              <Calculator className="text-(--dh-accent)" size={24} strokeWidth={2.5} /> โครงสร้างราคาปลีก
            </h1>
            <p className="text-[11px] font-bold text-(--dh-text-muted) mt-1.5 uppercase tracking-wider">
              Retail Pricing Engine Configuration
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="ml-2 p-1.5 bg-(--dh-bg-base) hover:bg-slate-200 text-(--dh-text-muted) rounded-lg transition-colors border border-(--dh-border) shadow-xs cursor-pointer"
          >
            <HelpCircle size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Smart Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-300 flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer
            ${
              isDirty && !saving
                ? 'bg-(--dh-accent) hover:bg-(--dh-accent-hover) text-white shadow-[0_0_15px_var(--dh-accent-light)] animate-pulse border border-transparent'
                : 'bg-(--dh-bg-base) text-(--dh-text-muted) border border-(--dh-border) cursor-not-allowed opacity-60'
            }
          `}
        >
          {saving ? (
            <RefreshCw className="animate-spin" size={16} strokeWidth={2.5} />
          ) : isDirty ? (
            <Save size={16} strokeWidth={2.5} />
          ) : (
            <CheckCircle2 size={16} strokeWidth={2.5} />
          )}
          {saving ? 'กำลังบันทึก...' : isDirty ? 'บันทึกการตั้งค่า' : 'เป็นปัจจุบัน'}
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col xl:flex-row gap-3 lg:gap-4">
        
        {/* LEFT COLUMN: SmartRoundingPolicy (Top Horizontal Bar) + PricingRulesTable + Collapsible History Log */}
        <div className="flex-1 flex flex-col gap-3 lg:gap-4 min-w-0">
          <SmartRoundingPolicy
            config={config}
            handleRoundingChange={handleRoundingChange}
          />
          <PricingRulesTable
            config={config}
            addRule={addRule}
            removeRule={removeRule}
            handleRuleChange={handleRuleChange}
            moveRule={moveRule}
            categories={categories}
            matchedRuleId={matchedRuleId}
          />
          <PricingHistoryLog
            logs={logs}
            loadingLogs={loadingLogs}
            fetchPricingLogs={fetchPricingLogs}
          />
        </div>

        {/* RIGHT COLUMN: Pricing Simulation */}
        <div className="w-full xl:w-[38%] flex flex-col gap-3 lg:gap-4 shrink-0 min-w-[340px] min-h-[500px]">
          <PricingSimulation
            simMode={simMode}
            setSimMode={setSimMode}
            skuInput={skuInput}
            setSkuInput={setSkuInput}
            simProduct={simProduct}
            searchingSku={searchingSku}
            skuError={skuError}
            simulateBySku={simulateBySku}
            handleRandomSku={handleRandomSku}
            simCost={simCost}
            setSimCost={setSimCost}
            simCategory={simCategory}
            setSimCategory={setSimCategory}
            config={config}
            runSimulation={runSimulation}
            simResult={simResult}
            categories={categories}
          />
        </div>

      </div>

      <GuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        title="คู่มือตั้งราคาอัตโนมัติ (Pricing Engine)"
        manualText="หน้านี้ใช้สำหรับตั้งค่าสูตรคำนวณราคาขายปลีกแบบอัตโนมัติ เมื่อเรานำเข้าสินค้าใหม่และใส่ราคาทุน ระบบจะคำนวณราคาขายปลีกให้ทันทีตามกฎที่เราตั้งไว้"
        howTo={[
          "1. เลือกหมวดหมู่ (Category) ที่ต้องการตั้งกฎ",
          "2. กำหนดช่วงราคาทุน (Min - Max)",
          "3. เลือกรูปแบบการบวกกำไร (Percent % หรือ บวกเงินสดตรงๆ)",
          "4. ตรวจสอบการปัดเศษ (Rounding) เช่น ปัดเศษให้ลงท้ายด้วย 90",
          "5. ลองจำลองราคา (Simulation) ทางขวามือเพื่อความมั่นใจก่อนกด Save"
        ]}
        tips="การเปลี่ยนกฎตรงนี้ จะไม่มีผลกระทบกับสินค้าที่ตั้งราคาขายไปแล้ว (เพื่อป้องกันราคาเพี้ยนย้อนหลัง) จะมีผลเฉพาะกับสินค้าใหม่ หรือการอัปเดตราคาใหม่เท่านั้น"
        expectedResult="เมื่อตั้งค่าถูกต้อง ทุกครั้งที่มีการแก้ไขต้นทุนสินค้า ระบบจะเด้งแนะนำราคาขายปลีกใหม่ที่สวยงามและได้กำไรตามเป้าให้เราอัตโนมัติ"
      />
    </div>
  );
}