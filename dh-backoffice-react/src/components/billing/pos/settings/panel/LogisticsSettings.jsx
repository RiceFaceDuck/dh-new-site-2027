import React from 'react';
import { Truck, Calculator, Tag, Receipt } from 'lucide-react';
import ToggleGroup from './ToggleGroup';

export default function LogisticsSettings({
    activeTab, updateActiveTab, handlePriceModeChange, isProcessing,
    localShipping, setLocalShipping, terminalConfig, sectionClass, labelClass, inputClass
}) {
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
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 mb-1 block">ขนส่ง</label>
                                <select disabled={isProcessing} value={activeTab.courier || ''} onChange={(e) => updateActiveTab({ courier: e.target.value })} className={inputClass}>
                                    <option value="KEX">KEX</option><option value="Flash">Flash</option><option value="J&T">J&T</option><option value="SPX">SPX</option><option value="ThaiPost">ไปรษณีย์</option><option value="Other">อื่นๆ</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-[#2A305A] mb-1 block uppercase tracking-wide">ค่าส่ง (฿)</label>
                                <input disabled={isProcessing} type="number" min="0" placeholder="0" value={localShipping} onChange={(e) => setLocalShipping(e.target.value)} onBlur={() => updateActiveTab({ shippingFee: parseFloat(localShipping) || 0 })} onKeyDown={(e) => { if (e.key === 'Enter') updateActiveTab({ shippingFee: parseFloat(localShipping) || 0 }); }} className={`${inputClass} text-right font-black text-[#2A305A]`} />
                                {/* ✨ คีย์ลัดค่าจัดส่ง 40, 60, 120 */}
                                <div className="flex gap-1 mt-1.5 justify-end">
                                    <button onClick={() => { setLocalShipping(0); updateActiveTab({ shippingFee: 0 }); }} disabled={isProcessing} className="text-[9px] bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded transition-colors shadow-sm active:scale-95">ส่งฟรี</button>
                                    {(terminalConfig.quickShippingFees || [40, 60, 120]).map(val => (
                                        <button key={val} onClick={() => { setLocalShipping(val); updateActiveTab({ shippingFee: val }); }} disabled={isProcessing} className="text-[9px] bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded transition-colors shadow-sm active:scale-95">
                                            +{val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {activeTab.vatType !== 'exempt' && (
                                <div className="col-span-2 flex justify-end pt-1 border-t border-gray-200">
                                    <label className="text-[9px] font-bold text-gray-500 flex items-center gap-1.5 cursor-pointer hover:text-gray-700">
                                        <input disabled={isProcessing} type="checkbox" checked={activeTab.vatOnShipping} onChange={(e) => updateActiveTab({ vatOnShipping: e.target.checked })} className="w-3 h-3 rounded text-[#2A305A] border-gray-300 bg-white" /> คิด VAT รวมกับค่าส่ง
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
