import { useNavigate } from 'react-router-dom';
import { Calculator, Search, Shuffle, RefreshCw, AlertCircle, ExternalLink, Package, Sparkles } from 'lucide-react';

// กล่องแจกแจงรายละเอียดขั้นตอนการคิดราคา (2 ขั้นตอนชัดเจน)
function PricingSimulationDetails({ simResult }) {
  if (!simResult) return null;

  return (
    <div className="bg-(--dh-bg-base) p-3 rounded-2xl border border-(--dh-border) space-y-2 text-xs">
      <div className="flex items-center justify-between border-b border-(--dh-border) pb-2">
        <span className="text-[11px] font-black text-(--dh-text-main) uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-500" /> ขั้นตอนคำนวณราคาแบบละเอียด
        </span>
        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30 shadow-xs">
          กำไรสุทธิ +฿{simResult.margin.toLocaleString()} (+{simResult.marginPercent.toFixed(1)}%)
        </span>
      </div>

      {/* ขั้นที่ 1: เงื่อนไขราคาทุน */}
      <div className="p-2.5 bg-blue-500/5 rounded-xl border border-blue-500/25 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-[10px] flex items-center justify-center shrink-0">
              1
            </span>
            <span className="text-(--dh-text-main) font-bold text-xs">สูตรเงื่อนไขที่ตรง</span>
          </div>
          <span className="font-mono font-black text-base text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/30">
            = ฿{simResult.rawPrice.toFixed(2)}
          </span>
        </div>

        <div className="pl-7 font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 flex-wrap">
          {simResult.appliedRule ? (
            <>
              <span className="bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                หมวดหมู่: {simResult.appliedRule.category}
              </span>
              <span>➔</span>
              <span className="bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                เงื่อนไข: {simResult.appliedRule.operator} {simResult.appliedRule.threshold}
              </span>
              <span>➔</span>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md font-black">
                สูตร: {simResult.appliedRule.action} {simResult.appliedRule.value}
              </span>
            </>
          ) : (
            <span className="text-(--dh-text-muted)">ไม่มีกฎเฉพาะหมวดหมู่ (ใช้ราคาทุนตั้งต้น)</span>
          )}
        </div>
      </div>

      {/* ขั้นที่ 2: ระบบปัดเศษจิตวิทยา */}
      <div className="p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/25 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-[10px] flex items-center justify-center shrink-0">
              2
            </span>
            <span className="text-(--dh-text-main) font-bold text-xs">การปัดเศษอัตโนมัติ</span>
          </div>
          <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-3 py-0.5 rounded-lg border border-emerald-500/30 drop-shadow-xs">
            = ฿{simResult.calculatedPrice.toLocaleString()}
          </span>
        </div>

        <div className="pl-7 font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
          <span>ราคาดิบ ฿{simResult.rawPrice.toFixed(2)}</span>
          <span>➔</span>
          <span className="bg-amber-500/20 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-md font-black">
            {simResult.appliedRoundingType}
          </span>
        </div>
      </div>
    </div>
  );
}

// กล่องค้นหา / สุ่ม SKU
function SkuSearchArea({
  skuInput,
  setSkuInput,
  searchingSku,
  skuError,
  simulateBySku,
  handleRandomSku
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={skuInput}
            onChange={(e) => setSkuInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && simulateBySku && simulateBySku(skuInput)}
            placeholder="พิมพ์ SKU แล้วกด Enter..."
            className="w-full bg-(--dh-bg-base) border border-(--dh-border) rounded-xl pl-3 pr-9 py-2 text-xs font-bold text-(--dh-text-main) outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner uppercase tracking-wider"
          />
          <button
            type="button"
            onClick={() => simulateBySku && simulateBySku(skuInput)}
            disabled={searchingSku}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-(--dh-text-muted) hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {searchingSku ? <RefreshCw size={14} className="animate-spin text-indigo-500" /> : <Search size={14} />}
          </button>
        </div>

        <button
          type="button"
          onClick={handleRandomSku}
          disabled={searchingSku}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
          title="สุ่ม SKU สินค้าในคลังขึ้นมาทดสอบทันที"
        >
          <Shuffle size={15} className={searchingSku ? "animate-spin" : ""} />
          <span>สุ่ม SKU</span>
        </button>
      </div>

      {skuError && (
        <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle size={13} className="shrink-0" />
          <span>{skuError}</span>
        </div>
      )}
    </div>
  );
}

export default function PricingSimulation({
  simMode = 'sku',
  setSimMode,
  skuInput = '',
  setSkuInput,
  simProduct = null,
  searchingSku = false,
  skuError = null,
  simulateBySku,
  handleRandomSku,
  simCost,
  setSimCost,
  simCategory,
  setSimCategory,
  config,
  runSimulation,
  simResult,
  categories = []
}) {
  const navigate = useNavigate();

  if (!config) return null;

  return (
    <div className="bg-(--dh-bg-surface) p-4 rounded-2xl shadow-xs border border-(--dh-border) relative overflow-hidden transition-all shrink-0">
      
      {/* Watermark Logo */}
      <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none">
        <Calculator size={140} />
      </div>

      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <h2 className="font-black text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <Calculator size={15} /> จำลองคำนวณราคา (Simulation)
        </h2>

        <div className="flex bg-(--dh-bg-base) p-0.5 rounded-xl border border-(--dh-border) text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setSimMode && setSimMode('sku')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              simMode === 'sku' 
                ? 'bg-indigo-600 text-white shadow-xs font-black' 
                : 'text-(--dh-text-muted) hover:text-(--dh-text-main)'
            }`}
          >
            ค้นหา SKU
          </button>
          <button
            type="button"
            onClick={() => setSimMode && setSimMode('manual')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              simMode === 'manual' 
                ? 'bg-indigo-600 text-white shadow-xs font-black' 
                : 'text-(--dh-text-muted) hover:text-(--dh-text-main)'
            }`}
          >
            ใส่ทุนเอง
          </button>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {simMode === 'sku' ? (
          <SkuSearchArea
            skuInput={skuInput}
            setSkuInput={setSkuInput}
            searchingSku={searchingSku}
            skuError={skuError}
            simulateBySku={simulateBySku}
            handleRandomSku={handleRandomSku}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-(--dh-text-muted) uppercase tracking-widest block mb-1">
                ราคาทุน (Cost)
              </label>
              <input
                type="number"
                value={simCost}
                onChange={(e) => setSimCost(e.target.value)}
                placeholder="เช่น 1500"
                className="w-full bg-(--dh-bg-base) border border-(--dh-border) rounded-xl px-3 py-1.5 text-xs font-black text-(--dh-text-main) outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-(--dh-text-muted) uppercase tracking-widest block mb-1">
                หมวดหมู่
              </label>
              <select
                value={simCategory}
                onChange={(e) => setSimCategory(e.target.value)}
                className="w-full bg-(--dh-bg-base) border border-(--dh-border) rounded-xl px-2.5 py-1.5 text-xs font-bold text-(--dh-text-main) outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner cursor-pointer appearance-none"
              >
                {categories.map((cat) => {
                  const val = cat.type || cat.name;
                  return (
                    <option key={cat.id || val} value={val}>
                      {cat.name} {cat.type && cat.name !== cat.type ? `(${cat.type})` : ''}
                    </option>
                  );
                })}
                <option value="Other">อื่นๆ (ไม่มีกฎ)</option>
              </select>
            </div>
          </div>
        )}

        {simMode === 'manual' && (
          <button
            type="button"
            onClick={runSimulation}
            className="w-full bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 dark:text-indigo-400 hover:text-white border border-indigo-500/30 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            ทดสอบคำนวณราคา
          </button>
        )}

        {/* ผลการคำนวณราคา */}
        {simResult ? (
          <div className="pt-2.5 border-t border-(--dh-border) flex flex-col gap-2.5 animate-in zoom-in-95 duration-200">
            
            {/* กล่องข้อมูลสินค้าจริง (กรณีใช้โหมด SKU) */}
            {simProduct && (
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-2.5 flex items-start gap-2.5">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0 mt-0.5">
                  <Package size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="font-mono font-black text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded-sm border border-indigo-500/20">
                      {simProduct.sku}
                    </span>
                    <span className="text-[9px] font-bold text-(--dh-text-muted) bg-(--dh-bg-base) px-1.5 py-0.2 rounded-md border border-(--dh-border)">
                      {simProduct.category || simProduct.category_lower || simProduct.type || 'หมวดหมู่ทั่วไป'}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-(--dh-text-main) line-clamp-1 truncate">
                    {simProduct.name || simProduct.title || simProduct.sku}
                  </h3>
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ราคาส่ง/ทุน: ฿{(simResult?.cost || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* การ์ด KPI คู่ (ราคาทุน vs ราคาขายปลีกสุทธิ) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-(--dh-bg-base) rounded-2xl p-3 border border-(--dh-border) shadow-xs flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-500/50"></div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-200 font-black text-[10px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span className="text-[10px] font-black text-(--dh-text-muted) uppercase tracking-wider">
                      ราคาทุนตั้งต้น
                    </span>
                  </div>
                  <p className="text-2xl font-black text-(--dh-text-main) mt-1 tabular-nums tracking-tight">
                    ฿{simResult.cost.toLocaleString()}
                  </p>
                </div>
                <p className="text-[9px] font-bold text-(--dh-text-muted) mt-2 pt-1 border-t border-(--dh-border)/50">
                  ต้นทุนตั้งต้นก่อนคำนวณ
                </p>
              </div>

              <div className="bg-(--dh-bg-base) rounded-2xl p-3 border border-emerald-500/30 shadow-xs flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      ราคาขายปลีกสุทธิ
                    </span>
                  </div>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums tracking-tighter drop-shadow-xs">
                    ฿{simResult.calculatedPrice.toLocaleString()}
                  </p>
                </div>
                <p className="text-[9px] font-bold text-(--dh-text-muted) mt-2 pt-1 border-t border-(--dh-border)/50">
                  ราคาดิบก่อนปัด: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">฿{simResult.rawPrice.toFixed(2)}</span>
                </p>
              </div>
            </div>

            {/* กล่องแจกแจงขั้นตอนละเอียด */}
            <PricingSimulationDetails simResult={simResult} />

            {/* ปุ่มเปิดดูสินค้าใน Inventory Modal */}
            {simProduct && simProduct.sku && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/inventory?sku=${encodeURIComponent(simProduct.sku)}&modal=true`, {
                      state: { sku: simProduct.sku, openModal: true }
                    });
                  }}
                  className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-(--dh-bg-base) hover:bg-(--dh-bg-surface) text-(--dh-text-muted) hover:text-(--dh-text-main) font-semibold text-[10px] rounded-lg border border-(--dh-border) transition-all cursor-pointer opacity-70 hover:opacity-100"
                >
                  <ExternalLink size={11} className="shrink-0" />
                  ดูรายละเอียดในคลังสินค้า ({simProduct.sku})
                </button>
              </div>
            )}

          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center opacity-50 text-(--dh-text-muted)">
            <Calculator size={32} className="mb-1.5" strokeWidth={1.5} />
            <span className="text-[11px] font-bold">พิมพ์ SKU หรือกดสุ่ม SKU เพื่อคำนวณราคา</span>
          </div>
        )}

      </div>
    </div>
  );
}
