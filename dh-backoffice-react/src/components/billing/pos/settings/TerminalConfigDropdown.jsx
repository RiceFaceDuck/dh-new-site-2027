import React from 'react';
import { X, SlidersHorizontal, Printer, Volume2, Phone } from 'lucide-react';

export default function TerminalConfigDropdown({
    terminalConfig,
    updateTerminalConfig,
    isTerminalConfigOpen,
    setIsTerminalConfigOpen,
    inputClass,
    isProcessing
}) {
    if (!isTerminalConfigOpen) return null;

    return (
        <div className="absolute top-14 right-4 w-80 bg-[var(--dh-bg-surface)] rounded-xl shadow-2xl border border-[var(--dh-border)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="bg-[var(--dh-bg-base)] px-4 py-3 border-b border-[var(--dh-border)] flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-[var(--dh-text-main)] text-sm flex items-center gap-1.5 uppercase"><SlidersHorizontal size={14}/> Terminal Settings</h3>
                </div>
                <button onClick={() => setIsTerminalConfigOpen(false)} className="text-[var(--dh-text-muted)] hover:text-red-500 p-1.5 hover:bg-red-50 rounded-md transition-colors dh-active-press"><X size={14}/></button>
            </div>
            <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[var(--dh-bg-surface)]">
                <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[var(--dh-text-muted)] border-b border-[var(--dh-border)] pb-1 mb-2">ฟังก์ชันเครื่อง POS</h4>
                    <label className="flex items-center justify-between p-2 hover:bg-[var(--dh-bg-base)] rounded-md cursor-pointer transition-colors group border border-transparent hover:border-[var(--dh-border)]">
                        <span className="text-sm font-medium text-[var(--dh-text-main)] flex items-center gap-2"><Printer size={14} className="text-[var(--dh-text-muted)] group-hover:text-[var(--dh-accent)]"/> พิมพ์ใบเสร็จอัตโนมัติ</span>
                        <input type="checkbox" disabled={isProcessing} checked={terminalConfig.autoPrint} onChange={(e) => updateTerminalConfig('autoPrint', e.target.checked)} className="w-4 h-4 rounded text-[var(--dh-accent)] focus:ring-[var(--dh-accent)] cursor-pointer border-[var(--dh-border)]"/>
                    </label>
                    <label className="flex items-center justify-between p-2 hover:bg-[var(--dh-bg-base)] rounded-md cursor-pointer transition-colors group border border-transparent hover:border-[var(--dh-border)]">
                        <span className="text-sm font-medium text-[var(--dh-text-main)] flex items-center gap-2"><Volume2 size={14} className="text-[var(--dh-text-muted)] group-hover:text-[var(--dh-accent)]"/> เสียงแจ้งเตือน</span>
                        <input type="checkbox" disabled={isProcessing} checked={terminalConfig.sound} onChange={(e) => updateTerminalConfig('sound', e.target.checked)} className="w-4 h-4 rounded text-[var(--dh-accent)] focus:ring-[var(--dh-accent)] cursor-pointer border-[var(--dh-border)]"/>
                    </label>
                    <label className="flex items-center justify-between p-2 hover:bg-[var(--dh-bg-base)] rounded-md cursor-pointer transition-colors group border border-transparent hover:border-[var(--dh-border)]">
                        <span className="text-sm font-medium text-[var(--dh-text-main)] flex items-center gap-2"><Phone size={14} className="text-[var(--dh-text-muted)] group-hover:text-[var(--dh-accent)]"/> บังคับกรอกเบอร์ (หน้าร้าน)</span>
                        <input type="checkbox" disabled={isProcessing} checked={terminalConfig.requireWalkinPhone} onChange={(e) => updateTerminalConfig('requireWalkinPhone', e.target.checked)} className="w-4 h-4 rounded text-[var(--dh-accent)] focus:ring-[var(--dh-accent)] cursor-pointer border-[var(--dh-border)]"/>
                    </label>
                </div>
                <div className="space-y-3 pt-3">
                    <h4 className="text-xs font-bold text-[var(--dh-text-muted)] border-b border-[var(--dh-border)] pb-1 mb-2">ค่าเริ่มต้นเปิดบิล (Defaults)</h4>
                    <div>
                        <label className="text-xs font-medium text-[var(--dh-text-muted)] mb-1.5 block">ราคาเริ่มต้น</label>
                        <select disabled={isProcessing} value={terminalConfig.defaultPriceMode} onChange={(e) => updateTerminalConfig('defaultPriceMode', e.target.value)} className={inputClass}>
                            <option value="wholesale">B2B (ราคาส่ง)</option><option value="retail">ราคาปลีก</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--dh-text-muted)] mb-1.5 block">ภาษีเริ่มต้น</label>
                        <select disabled={isProcessing} value={terminalConfig.defaultVatType} onChange={(e) => updateTerminalConfig('defaultVatType', e.target.value)} className={inputClass}>
                            <option value="exempt">ยกเว้น (EXEMPT)</option><option value="included">รวมในราคา (INCLUDED)</option><option value="excluded">บวกเพิ่ม (EXCLUDED)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--dh-text-muted)] mb-1.5 block">การจัดส่งเริ่มต้น</label>
                        <select disabled={isProcessing} value={terminalConfig.defaultFulfillment} onChange={(e) => updateTerminalConfig('defaultFulfillment', e.target.value)} className={inputClass}>
                            <option value="Delivery">ส่งพัสดุ</option><option value="StorePickup">หน้าร้าน</option><option value="ZeerBranch">เซียร์</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[var(--dh-text-muted)] mb-1.5 block">ขนส่งเริ่มต้น</label>
                            <select disabled={isProcessing} value={terminalConfig.defaultCourier} onChange={(e) => updateTerminalConfig('defaultCourier', e.target.value)} className={inputClass}>
                                <option value="KEX">KEX</option><option value="Flash">Flash</option><option value="J&T">J&T</option><option value="SPX">SPX</option><option value="ThaiPost">ไปรษณีย์ไทย</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--dh-text-muted)] mb-1.5 block">คีย์ลัดค่าส่ง (คั่นด้วย ,)</label>
                            <input disabled={isProcessing} type="text" value={terminalConfig.quickShippingFees?.join(',')} onChange={(e) => updateTerminalConfig('quickShippingFees', e.target.value.split(',').map(n => Number(n.trim())||0))} className={inputClass} placeholder="40,60,120" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
