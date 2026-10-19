import React from 'react';
import { ShieldCheck, Award, CheckCircle2, Truck } from 'lucide-react';

const BADGE_ICONS = {
    b2bPartner: ShieldCheck,
    dbdRegistered: Award,
    genuineWarranty: CheckCircle2,
    expressDelivery: Truck
};

const CANONICAL_FALLBACK_BADGES = [
    { id: 'b2bPartner', label: 'VERIFIED B2B PARTNER', icon: 'ShieldCheck', active: true, description: 'พันธมิตรช่างซ่อมและร้านค้าทั่วประเทศ' },
    { id: 'dbdRegistered', label: 'DBD REGISTERED', icon: 'Award', active: true, description: 'จดทะเบียนพาณิชย์อิเล็กทรอนิกส์ถูกต้อง' },
    { id: 'genuineWarranty', label: 'สินค้ามีการรับประกัน', icon: 'CheckCircle2', active: true, description: 'มั่นใจในคุณภาพสินค้าทุกชิ้น' },
    { id: 'expressDelivery', label: 'ส่งออกภายในวันทันที', icon: 'Truck', active: true, description: 'จัดส่งรวดเร็วทั่วไทย ถึงมือทันใจ' }
];

export default function TrustBadgesSection({ 
    footerConfig, 
    handleTrustBadgeToggle, 
    handleTrustBadgeChange, 
    handleTrustBadgesEnabled 
}) {
    const trustBadges = footerConfig?.trustBadges || { enabled: true, badges: [] };
    const isEnabled = trustBadges.enabled !== false;
    const rawBadges = Array.isArray(trustBadges.badges) && trustBadges.badges.length > 0 
        ? trustBadges.badges 
        : CANONICAL_FALLBACK_BADGES;

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 tracking-wide">ตราสัญลักษณ์ความเชื่อมั่น (TRUST BADGES)</h3>
                        <p className="text-xs text-slate-500 mt-0.5">ตราความเชื่อมั่นจะถูกจัดแสดงใต้ข้อมูลแบรนด์ใน Footer เพื่อตอกย้ำความน่าเชื่อถือระดับ B2B</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <span className="text-xs font-semibold text-slate-600">เปิดใช้งานทั้งหมด</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => handleTrustBadgesEnabled && handleTrustBadgesEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                    </label>
                </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${isEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                {rawBadges.map((b) => {
                    const IconComponent = BADGE_ICONS[b.id] || ShieldCheck;
                    const isActive = b.active !== false;

                    return (
                        <div
                            key={b.id}
                            className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                                isActive
                                    ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-xs'
                                    : 'bg-slate-100/40 border-slate-200/60 opacity-60'
                            }`}
                        >
                            {/* Header row with Icon and Toggle */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs shrink-0">
                                        <IconComponent size={18} />
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{b.id}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleTrustBadgeToggle && handleTrustBadgeToggle(b.id)}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                                        isActive
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
                                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300 border border-slate-300'
                                    }`}
                                >
                                    {isActive ? 'แสดง' : 'ซ่อน'}
                                </button>
                            </div>

                            {/* Editable Fields */}
                            <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ชื่อป้าย (Label)</label>
                                    <input
                                        type="text"
                                        value={b.label || ''}
                                        onChange={(e) => handleTrustBadgeChange && handleTrustBadgeChange(b.id, 'label', e.target.value)}
                                        placeholder="ชื่อตราสัญลักษณ์"
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 block mb-1">คำอธิบาย (Description)</label>
                                    <input
                                        type="text"
                                        value={b.description || ''}
                                        onChange={(e) => handleTrustBadgeChange && handleTrustBadgeChange(b.id, 'description', e.target.value)}
                                        placeholder="คำอธิบายใต้ป้าย"
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
