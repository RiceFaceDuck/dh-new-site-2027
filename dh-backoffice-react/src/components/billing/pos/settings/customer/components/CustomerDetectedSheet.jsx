import React, { useState } from 'react';
import { CheckCircle2, Globe, Sparkles, Edit2 } from 'lucide-react';

/**
 * CustomerDetectedSheet Component
 * 
 * Single-Sheet Document rendering for detected customer candidate.
 * Follows modal_preview.html spec 100%:
 * - Border radius: rounded-[0.1rem]
 * - Left-aligned 1-line-per-field with fixed w-36 label
 * - Generous py-2.5 vertical spacing
 * - Inline edit for Line ID and Tax toggle
 */
export default function CustomerDetectedSheet({
    matchedCustomer,
    parsedData,
    isTaxRequested,
    setIsTaxRequested,
    stagedLineId,
    setStagedLineId,
    isEditingLine,
    setIsEditingLine,
    autoFillMissing,
    setAutoFillMissing
}) {
    if (!matchedCustomer) return null;

    const { candidate, score, matchReasons = [] } = matchedCustomer;
    const isStorefront = Boolean(
        candidate.email || 
        candidate.isWebRegistered || 
        candidate.source === 'storefront' || 
        (candidate.tier && String(candidate.tier).toUpperCase() !== 'MEMBER') ||
        (candidate.creditPoints || candidate.totalAccumulatedPoints || 0) > 0 ||
        (candidate.role && candidate.role.toLowerCase().includes('partner'))
    );

    // Business / Store Name takes HIGHEST precedence for DH B2B workflow
    const storeName = (parsedData.storeName && parsedData.storeName !== 'ลูกค้าใหม่')
        ? parsedData.storeName 
        : (candidate.storeName || candidate.accountName || candidate.displayName || '-');

    // Contact Person Name
    const candidatePerson = candidate.displayName || candidate.firstName || candidate.contactName || '';
    const parsedPerson = parsedData.contactName && parsedData.contactName !== storeName ? parsedData.contactName : '';
    let contactName = candidatePerson || parsedPerson || storeName;
    if (candidatePerson && parsedPerson && candidatePerson.toLowerCase() !== parsedPerson.toLowerCase()) {
        contactName = `${candidatePerson} (${parsedPerson.startsWith('คุณ') ? parsedPerson : `คุณ ${parsedPerson}`})`;
    }
    const accountId = candidate.accountId || candidate.customerCode || candidate.id?.substring(0, 8)?.toUpperCase() || 'TRJEHNHG';
    const points = candidate.creditPoints ?? candidate.totalAccumulatedPoints ?? 0;
    const primaryPhone = candidate.phone || candidate.phoneNumber || parsedData.phone || '-';
    const email = candidate.email || parsedData.email || '-';
    const currentLine = stagedLineId || candidate.lineId || parsedData.lineId || '';
    const fb = candidate.facebook || candidate.facebookUrl || parsedData.facebook || '';
    const adStoreTitle = candidate.adStoreTitle || '';
    const roleDesc = candidate.role || candidate.rank || 'Customer (MEMBER)';
    const debt = Number(candidate.walletBalance || 0);

    // Format last order date
    let lastOrderDisplay = '-';
    if (candidate.lastOrderDate) {
        try {
            const dateObj = new Date(candidate.lastOrderDate);
            lastOrderDisplay = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            lastOrderDisplay = String(candidate.lastOrderDate);
        }
    }

    const originalAddress = candidate.address?.fullAddress || candidate.legacyAddress || (
        candidate.address?.province ? `จ.${candidate.address.province}` : ''
    );

    const newAddressDisplay = [
        parsedData.addressLine,
        parsedData.subDistrict ? (parsedData.province?.includes('กรุงเทพ') ? `แขวง${parsedData.subDistrict}` : `ต.${parsedData.subDistrict}`) : '',
        parsedData.district ? (parsedData.province?.includes('กรุงเทพ') ? `เขต${parsedData.district}` : `อ.${parsedData.district}`) : '',
        parsedData.province ? (parsedData.province.startsWith('จ.') ? parsedData.province : `จ.${parsedData.province}`) : '',
        parsedData.postalCode || parsedData.zipCode || ''
    ].filter(Boolean).join(' ');

    return (
        <div className="border border-slate-200 rounded-[0.1rem] p-5 bg-white space-y-3.5 text-xs shadow-xs">
            {/* Header: ⚠️ ใช่ลูกค้าคนนี้หรือไม่? */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <span className="text-base font-bold text-amber-600 tracking-tight">
                        ใช่ลูกค้าคนนี้หรือไม่?
                    </span>
                    <span className="text-[11px] text-amber-900 font-semibold bg-amber-50 px-2 py-0.5 rounded-[0.1rem] border border-amber-300">
                        {matchReasons[0] || 'เบอร์โทรศัพท์ตรงกัน 100%'}
                    </span>
                </div>
                {isStorefront && (
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        สมาชิก Partner หน้าเว็บ
                    </span>
                )}
            </div>

            {/* 12 Rows: 1 บรรทัด ต่อ 1 ข้อมูล (Left Aligned) */}
            <div className="divide-y divide-slate-100 text-xs">
                {/* 1. ชื่อร้านค้า */}
                <div className="py-2.5 flex items-center">
                    <span className="text-slate-400 font-medium w-36 shrink-0">ชื่อร้านค้า:</span>
                    <span className="font-bold text-slate-900">
                        {storeName}
                    </span>
                </div>

                {/* 2. ชื่อผู้ติดต่อ */}
                <div className="py-2.5 flex items-center">
                    <span className="text-slate-400 font-medium w-36 shrink-0">ชื่อผู้ติดต่อ:</span>
                    <span className="font-medium text-slate-800">
                        {contactName}
                    </span>
                </div>

                {/* 3. รหัสลูกค้า & แต้มสะสม */}
                <div className="py-2.5 flex items-center">
                    <span className="text-slate-400 font-medium w-36 shrink-0">รหัสลูกค้า / แต้ม:</span>
                    <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            ID: {accountId}
                        </span>
                        <span className="text-amber-800 font-semibold">
                            🪙 {points.toLocaleString()} แต้มสะสม
                        </span>
                    </div>
                </div>

                {/* 4. เบอร์โทรศัพท์ */}
                <div className="py-2.5 flex items-center">
                    <span className="text-slate-400 font-medium w-36 shrink-0">เบอร์โทรศัพท์:</span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                            {primaryPhone}
                        </span>
                        <span className="text-emerald-700 font-medium text-[11px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            ✓ ตรงกับระบบเดิม
                        </span>
                        {Array.isArray(candidate.phones) && candidate.phones.length > 1 && (
                            <span className="text-slate-400 text-[10px]">
                                (+{candidate.phones.length - 1} เบอร์สำรอง)
                            </span>
                        )}
                    </div>
                </div>

                {/* 5. Email */}
                <div className="py-2.5 flex items-center">
                    <span className="text-slate-400 font-medium w-36 shrink-0">Email:</span>
                    <span className="font-mono text-slate-800">
                        {email}
                    </span>
                </div>

                {/* 6. Line ID (Inline Edit) */}
                <div className="py-2.5 flex items-center">
                    <span className="text-slate-400 font-medium w-36 shrink-0">Line ID:</span>
                    {isEditingLine ? (
                        <div className="flex items-center gap-1.5">
                            <input 
                                type="text"
                                value={stagedLineId}
                                onChange={(e) => setStagedLineId(e.target.value)}
                                placeholder="พิมพ์ Line ID..."
                                className="px-2 py-0.5 border border-blue-400 rounded text-xs font-bold text-slate-800 outline-none w-40 bg-white shadow-xs"
                                autoFocus
                            />
                            <button 
                                type="button"
                                onClick={() => setIsEditingLine(false)}
                                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                                บันทึก
                            </button>
                        </div>
                    ) : (
                        <div onClick={() => setIsEditingLine(true)} className="cursor-pointer">
                            {currentLine ? (
                                <span className="font-bold text-emerald-700 text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                    ✓ {currentLine} ✏️
                                </span>
                            ) : (
                                <span className="text-slate-400 italic text-[11px] bg-slate-50 hover:bg-amber-50 hover:text-amber-900 px-2 py-0.5 rounded border border-dashed border-slate-300 transition-colors">
                                    (ไม่มีข้อมูล ✏️ คลิกเพื่อเพิ่ม)
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* 7. Facebook (Partner Ads Integration) */}
                <div className="py-2.5 flex items-center">
                    <span className="text-slate-400 font-medium w-36 shrink-0">Facebook:</span>
                    {fb ? (
                        <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-medium hover:underline">
                                {fb}
                            </span>
                            {adStoreTitle && (
                                <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 font-semibold" title="ดึงจากโฆษณา Partner หน้าเว็บ">
                                    โฆษณา Partner
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-slate-400 italic text-[11px]">(ไม่มีข้อมูล)</span>
                    )}
                </div>

                {/* 8. ระดับสิทธิ์บัญชี */}
                <div className="py-2.5 flex items-center">
                    <span className="text-slate-400 font-medium w-36 shrink-0">ระดับสิทธิ์บัญชี:</span>
                    <span className="font-medium text-slate-800">
                        {roleDesc}
                    </span>
                </div>

                {/* 9. บิลล่าสุด */}
                <div className="py-2.5 flex items-center">
                    <span className="text-slate-400 font-medium w-36 shrink-0">บิลล่าสุด:</span>
                    <span className="text-slate-700">
                        {lastOrderDisplay !== '-' ? (
                            <>
                                <span className="font-mono font-bold text-slate-800">
                                    {candidate.lastOrderId ? `#${candidate.lastOrderId}` : 'มีประวัติการซื้อ'}
                                </span> 
                                <span className="text-slate-400 text-[11px] ml-1">({lastOrderDisplay})</span>
                            </>
                        ) : (
                            <span className="text-slate-400 italic text-[11px]">(ยังไม่เคยมีประวัติการซื้อ)</span>
                        )}
                    </span>
                </div>

                {/* 10. DH ค้างยอด (สถานะหนี้) */}
                <div className="py-2.5 flex items-center">
                    <span className="text-slate-400 font-medium w-36 shrink-0">DH ค้างยอด:</span>
                    {debt <= 0 ? (
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded text-[11px] border border-emerald-300">
                            0.00 ฿ (ไม่มีค้างชำระ)
                        </span>
                    ) : (
                        <span className="font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded text-[11px] border border-rose-300">
                            ค้างชำระ {debt.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                        </span>
                    )}
                </div>

                {/* 11. ขอใบกำกับ (Tax) */}
                <div className="py-2.5 flex items-center">
                    <span className="text-slate-400 font-medium w-36 shrink-0">ขอใบกำกับ (Tax):</span>
                    <div onClick={() => setIsTaxRequested(!isTaxRequested)} className="cursor-pointer">
                        {isTaxRequested ? (
                            <span className="font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded text-[11px] border border-blue-300 transition-colors">
                                ใช่ [YES] ภาษี 7% 🔄
                            </span>
                        ) : (
                            <span className="font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-0.5 rounded text-[11px] border border-slate-300 transition-colors">
                                ไม่ใช่ [NO] 🔄 คลิกเปลี่ยน
                            </span>
                        )}
                    </div>
                </div>

                {/* 12. ที่อยู่จัดส่งเดิม */}
                <div className="py-2.5 flex items-center">
                    <span className="text-slate-400 font-medium w-36 shrink-0">ที่อยู่จัดส่งเดิม:</span>
                    <span className={originalAddress ? "text-slate-700" : "text-slate-400 italic text-[11px]"}>
                        {originalAddress || '(ยังไม่มีที่อยู่จัดส่งในระบบ)'}
                    </span>
                </div>
            </div>

            {/* แถวที่อยู่ใหม่จากแชท (พร้อมเติมเต็ม) */}
            {newAddressDisplay && (
                <div className="mt-3 flex items-start justify-between gap-3 bg-blue-50/50 p-3 rounded-[0.1rem] border border-blue-200">
                    <div>
                        <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                            <span>📥</span> ที่อยู่ใหม่จากแชท (พร้อมเติมเต็ม):
                        </div>
                        <div className="text-slate-800 text-xs font-medium mt-1 leading-relaxed">
                            {newAddressDisplay}
                        </div>
                    </div>
                    <span className="shrink-0 text-[10px] text-blue-700 bg-white px-2 py-1 rounded border border-blue-200 font-semibold self-center shadow-2xs">
                        พร้อมบันทึก
                    </span>
                </div>
            )}

            {/* Checkbox ติ๊กบันทึกอัตโนมัติ */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 pt-1">
                <input 
                    type="checkbox" 
                    checked={autoFillMissing} 
                    onChange={(e) => setAutoFillMissing(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded-[0.1rem] border-slate-300"
                />
                <span>
                    บันทึกเบอร์โทรและที่อยู่ใหม่ลงในบัญชีนี้โดยอัตโนมัติ <span className="text-slate-400 text-[11px]">(ไม่ทับข้อมูลเดิม)</span>
                </span>
            </label>
        </div>
    );
}
