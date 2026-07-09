import React, { useEffect } from 'react';
import { Truck, Calculator, Tag, Receipt, ShieldAlert } from 'lucide-react';
import ToggleGroup from './ToggleGroup';
import { evaluateShippingRules } from 'dh-shared';

export default function LogisticsSettings({
    activeTab, updateActiveTab, handlePriceModeChange, isProcessing,
    localShipping, setLocalShipping, terminalConfig, sectionClass, labelClass, inputClass,
    shippingRules = []
}) {
    // 🧮 ประเมินราคาจัดส่ง/ค่าประกันตามกฎอัตโนมัติจากสินค้าในตะกร้า
    const evaluatedShipping = evaluateShippingRules(activeTab.items || [], shippingRules);

    // ⚡ [EFFECT] จัดการนำเงื่อนไขไปประเมินและตั้งค่าแบบอัตโนมัติ (Auto-apply by default)
    useEffect(() => {
        if (activeTab.autoShippingEnabled && activeTab.fulfillmentType === 'Delivery') {
            const opt = evaluatedShipping.shippingOptions[0];
            const calculatedCost = opt ? opt.cost : 0;
            const calculatedCourier = opt ? (
                opt.company.includes('Kerry') ? 'KEX' 
                : opt.company.includes('Flash') ? 'Flash' 
                : opt.company.includes('J&T') ? 'J&T' 
                : opt.company.includes('SPX') ? 'SPX' 
                : opt.company.includes('EMS') || opt.company.includes('ไปรษณีย์') ? 'ThaiPost' 
                : 'Other'
            ) : 'KEX';
            
            const calculatedInsurance = evaluatedShipping.insuranceFee || 0;

            const hasShippingDiff = activeTab.shippingFee !== calculatedCost || activeTab.courier !== calculatedCourier;
            const hasInsuranceDiff = calculatedInsurance > 0
                ? (activeTab.otherFeeAmount !== calculatedInsurance || activeTab.otherFeeName !== 'ค่าประกันภัยจัดส่ง')
                : (activeTab.otherFeeName === 'ค่าประกันภัยจัดส่ง' && activeTab.otherFeeAmount !== 0);

            if (hasShippingDiff || hasInsuranceDiff) {
                const updates = {};
                if (hasShippingDiff) {
                    updates.shippingFee = calculatedCost;
                    updates.courier = calculatedCourier;
                    setLocalShipping(calculatedCost);
                }
                if (hasInsuranceDiff) {
                    if (calculatedInsurance > 0) {
                        updates.otherFeeName = 'ค่าประกันภัยจัดส่ง';
                        updates.otherFeeAmount = calculatedInsurance;
                    } else {
                        updates.otherFeeName = '';
                        updates.otherFeeAmount = 0;
                    }
                }
                updateActiveTab(updates);
            }
        }
    }, [
        activeTab.autoShippingEnabled,
        activeTab.fulfillmentType,
        evaluatedShipping.shippingOptions,
        evaluatedShipping.insuranceFee,
        activeTab.shippingFee,
        activeTab.courier,
        activeTab.otherFeeAmount,
        activeTab.otherFeeName,
        updateActiveTab,
        setLocalShipping
    ]);

    const isAutoMode = Boolean(activeTab.autoShippingEnabled);

    return (
        <>
            {/* 2. FORMAT & VAT */}
            <div className={`${sectionClass} grid grid-cols-2 gap-4`}>
                <div>
                    <label className={labelClass}><Tag size={12}/> ระดับราคา</label>
                    <ToggleGroup 
                        options={[{ value: 'wholesale', label: 'B2B' }, { value: 'retail', label: 'ปลีก' }]}
                        activeValue={activeTab.priceMode} onChange={handlePriceModeChange} disabled={isProcessing}
                    />
                </div>
                <div>
                    <label className={labelClass}><Receipt size={12}/> รูปแบบบิล</label>
                    <ToggleGroup 
                        options={[{ value: 'short', label: 'ย่อ' }, { value: 'full', label: 'เต็ม' }]}
                        activeValue={activeTab.receiptFormat} onChange={(val) => updateActiveTab({ receiptFormat: val })} disabled={isProcessing}
                    />
                </div>
            </div>

            {/* 3. LOGISTICS & VAT */}
            <div className={sectionClass}>
                <div className="mb-3.5">
                    <label className={labelClass}><Calculator size={12}/> ภาษีมูลค่าเพิ่ม (VAT 7%)</label>
                    <ToggleGroup 
                        options={[{ value: 'exempt', label: 'ไม่มี VAT' }, { value: 'included', label: 'รวม VAT' }, { value: 'excluded', label: 'แยก VAT' }]}
                        activeValue={activeTab.vatType} onChange={(val) => updateActiveTab({ vatType: val })} disabled={isProcessing}
                    />
                </div>

                <div>
                    <label className={labelClass}><Truck size={12}/> การรับสินค้า</label>
                    <div className="mb-2.5">
                        <ToggleGroup 
                            options={[{ value: 'Delivery', label: 'พัสดุ' }, { value: 'StorePickup', label: 'หน้าร้าน' }, { value: 'ZeerBranch', label: 'เซียร์' }]}
                            activeValue={activeTab.fulfillmentType} onChange={(val) => updateActiveTab({ fulfillmentType: val })} disabled={isProcessing}
                        />
                    </div>

                    {activeTab.fulfillmentType === 'Delivery' && (
                        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 animate-in fade-in">
                            
                            {/* ⚙️ สวิตช์เปิด/ปิดระบบคิดอัตโนมัติ */}
                            <div className="col-span-2 flex items-center justify-between pb-2 border-b border-gray-200 mb-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">ระบบคำนวณอัตโนมัติ</span>
                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={isAutoMode} 
                                        onChange={(e) => updateActiveTab({ autoShippingEnabled: e.target.checked })}
                                        className="sr-only peer"
                                        disabled={isProcessing}
                                    />
                                    <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    <span className="ml-2 text-[10px] font-bold text-slate-700">
                                        {isAutoMode ? 'เปิดอัตโนมัติ' : 'ปิดอัตโนมัติ'}
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 mb-1 block">ขนส่ง</label>
                                <select 
                                    disabled={isProcessing || isAutoMode} 
                                    value={activeTab.courier || ''} 
                                    onChange={(e) => updateActiveTab({ courier: e.target.value })} 
                                    className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                                >
                                    <option value="KEX">KEX</option><option value="Flash">Flash</option><option value="J&T">J&T</option><option value="SPX">SPX</option><option value="ThaiPost">ไปรษณีย์</option><option value="Other">อื่นๆ</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-[#2A305A] mb-1 block uppercase tracking-wide">ค่าส่ง (฿)</label>
                                <input 
                                    disabled={isProcessing || isAutoMode} 
                                    type="number" min="0" placeholder="0" 
                                    value={localShipping} 
                                    onChange={(e) => setLocalShipping(e.target.value)} 
                                    onBlur={() => updateActiveTab({ shippingFee: parseFloat(localShipping) || 0 })} 
                                    onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ shippingFee: parseFloat(localShipping) || 0 }); }} 
                                    className={`${inputClass} text-right font-black text-[#2A305A] disabled:bg-slate-100 disabled:text-slate-400`} 
                                />
                                {/* ✨ คีย์ลัดค่าจัดส่ง 40, 60, 120 (ซ่อนหรือ Disable เมื่ออยู่ในโหมด Auto) */}
                                <div className="flex gap-1 mt-1.5 justify-end">
                                    <button 
                                        onClick={() => { setLocalShipping(0); updateActiveTab({ shippingFee: 0 }); }} 
                                        disabled={isProcessing || isAutoMode} 
                                        className="text-[9px] bg-white hover:bg-gray-100 disabled:hover:bg-white disabled:opacity-50 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-sm transition-colors shadow-xs active:scale-95"
                                    >
                                        ส่งฟรี
                                    </button>
                                    {(terminalConfig.quickShippingFees || [40, 60, 120]).map(val => (
                                        <button 
                                            key={val} 
                                            onClick={() => { setLocalShipping(val); updateActiveTab({ shippingFee: val }); }} 
                                            disabled={isProcessing || isAutoMode} 
                                            className="text-[9px] bg-white hover:bg-gray-100 disabled:hover:bg-white disabled:opacity-50 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-sm transition-colors shadow-xs active:scale-95"
                                        >
                                            +{val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {activeTab.vatType !== 'exempt' && (
                                <div className="col-span-2 flex justify-end pt-1 border-t border-gray-200">
                                    <label className="text-[9px] font-bold text-gray-500 flex items-center gap-1.5 cursor-pointer hover:text-gray-700">
                                        <input disabled={isProcessing} type="checkbox" checked={activeTab.vatOnShipping} onChange={(e) => updateActiveTab({ vatOnShipping: e.target.checked })} className="w-3 h-3 rounded-sm text-[#2A305A] border-gray-300 bg-white" /> คิด VAT รวมกับค่าส่ง
                                    </label>
                                </div>
                            )}

                            {/* 💡 นำราคาไปใช้จริงแล้ว (โหมดอัตโนมัติ) */}
                            {isAutoMode && (evaluatedShipping.shippingOptions.length > 0 || evaluatedShipping.insuranceFee > 0) && (
                                <div className="col-span-2 mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-xs text-emerald-800 animate-in slide-in-from-top-2 duration-200 space-y-1.5">
                                    <div className="font-bold flex items-center gap-1 text-emerald-950">
                                        🟢 นำไปใช้งานอัตโนมัติแล้ว:
                                    </div>
                                    <div className="space-y-1 font-medium text-slate-700">
                                        {evaluatedShipping.shippingOptions.map(opt => (
                                            <div key={opt.company} className="text-[11px] text-emerald-900">
                                                🚚 จัดส่งโดย {opt.company}: ค่าส่ง <strong>฿{opt.cost}</strong>
                                            </div>
                                        ))}
                                        {evaluatedShipping.insuranceFee > 0 && (
                                            <div className="text-[11px] text-amber-800 border-t border-emerald-200/50 pt-1 mt-1 flex items-center gap-1">
                                                <ShieldAlert size={12}/> บวกประกันสินค้า: <strong>฿{evaluatedShipping.insuranceFee}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 💡 ตรวจสอบและให้กดเลือกแมนนวลได้ (โหมดปิดระบบอัตโนมัติ) */}
                            {!isAutoMode && (evaluatedShipping.shippingOptions.length > 0 || evaluatedShipping.insuranceFee > 0) && (
                                <div className="col-span-2 mt-2 bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 text-xs text-indigo-800 animate-in slide-in-from-top-2 duration-200 space-y-2">
                                    <div className="font-bold flex items-center gap-1 text-indigo-900">
                                        💡 แนะนำตามเงื่อนไข (กดเลือกใช้ได้):
                                    </div>
                                    <div className="space-y-1.5 font-medium text-gray-700">
                                        {evaluatedShipping.shippingOptions.map(opt => {
                                            const courierValue = opt.company.includes('Kerry') ? 'KEX' 
                                                : opt.company.includes('Flash') ? 'Flash' 
                                                : opt.company.includes('J&T') ? 'J&T' 
                                                : opt.company.includes('SPX') ? 'SPX' 
                                                : opt.company.includes('EMS') || opt.company.includes('ไปรษณีย์') ? 'ThaiPost' 
                                                : 'Other';

                                            return (
                                                <div key={opt.company} className="flex justify-between items-center gap-2">
                                                    <span className="text-[11px] text-slate-700">🚚 {opt.company}: <strong>฿{opt.cost}</strong></span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            updateActiveTab({ 
                                                                courier: courierValue, 
                                                                shippingFee: opt.cost 
                                                            });
                                                            setLocalShipping(opt.cost);
                                                        }}
                                                        className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded-md font-bold transition-all shadow-xs active:scale-95"
                                                    >
                                                        ใช้ค่าส่ง
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {evaluatedShipping.insuranceFee > 0 && (
                                            <div className="flex justify-between items-center gap-2 border-t border-indigo-100/50 pt-1.5 mt-1.5 text-amber-700 font-bold">
                                                <span className="flex items-center gap-1 text-[11px] text-amber-800"><ShieldAlert size={12}/> ประกันสินค้า: <strong>฿{evaluatedShipping.insuranceFee}</strong></span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        updateActiveTab({ 
                                                            otherFeeName: "ค่าประกันภัยจัดส่ง", 
                                                            otherFeeAmount: evaluatedShipping.insuranceFee 
                                                        });
                                                    }}
                                                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] rounded-md font-bold transition-all shadow-xs active:scale-95"
                                                    disabled={activeTab.otherFeeAmount === evaluatedShipping.insuranceFee}
                                                >
                                                    ใช้ค่าประกัน
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 🔍 หากไม่มีเงื่อนไขใดๆ ตรงเกณฑ์เลย */}
                            {evaluatedShipping.shippingOptions.length === 0 && evaluatedShipping.insuranceFee === 0 && (
                                <div className="col-span-2 mt-1 px-1 text-[9px] text-slate-400 font-bold flex items-center justify-end gap-1 select-none opacity-80">
                                    <span>🔍 ตรวจกฎส่งสินค้าอัตโนมัติแล้ว: ยังไม่ตรงเงื่อนไข</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
