import React from 'react';
import { ShieldCheck } from 'lucide-react';

const BADGE_MAP = {
    b2bPartner: {
        image: '/badges/badge_b2b_partner.svg',
        fallbackLabel: 'VERIFIED B2B PARTNER',
        desc: 'พันธมิตรช่างซ่อมและร้านค้าทั่วประเทศ'
    },
    dbdRegistered: {
        image: '/badges/badge_dbd_registered.svg',
        fallbackLabel: 'DBD REGISTERED',
        desc: 'จดทะเบียนพาณิชย์อิเล็กทรอนิกส์ถูกต้อง'
    },
    genuineWarranty: {
        image: '/badges/badge_genuine_warranty.svg',
        fallbackLabel: 'รับประกันของแท้ 100%',
        desc: 'มั่นใจในคุณภาพสินค้าทุกชิ้น'
    },
    expressDelivery: {
        image: '/badges/badge_express_delivery.svg',
        fallbackLabel: 'จัดส่งด่วน 24 ชม.',
        desc: 'จัดส่งรวดเร็วทั่วไทย ถึงมือทันใจ'
    }
};

export default function TrustBadgesSection({ footerConfig, handleTrustBadgeToggle, handleTrustBadgesEnabled }) {
    const trustBadges = footerConfig?.trustBadges || { enabled: true, badges: [] };
    const isEnabled = trustBadges.enabled !== false;
    const badges = trustBadges.badges || [];

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
                {badges.map((b) => {
                    const meta = BADGE_MAP[b.id] || {
                        image: '/badges/badge_b2b_partner.svg',
                        fallbackLabel: b.label,
                        desc: b.description || ''
                    };
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
                            <div className="flex items-center justify-between gap-3">
                                <div className="h-11 flex items-center">
                                    <img
                                        src={meta.image}
                                        alt={b.label || meta.fallbackLabel}
                                        className="h-10 w-auto object-contain rounded-md shadow-xs drop-shadow-xs"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
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
                            <div className="pt-1 border-t border-slate-200/60">
                                <span className="text-[11px] font-bold text-slate-700 block">{b.label || meta.fallbackLabel}</span>
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{b.description || meta.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
