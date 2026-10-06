import { useEffect } from 'react';
import { MapPin, Wallet, Sparkles, X, Phone, ShieldCheck, Check } from 'lucide-react';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
import { getUserProfile } from '../../../../../firebase/userProfileService';

/**
 * Helper to safely extract full address text from customer object
 */
const getDisplayAddress = (customer) => {
    if (!customer) return '';
    const rawAddr = customer.address || customer.shippingAddress || customer.legacyAddress || customer.rawAddress;
    if (!rawAddr) return '';
    if (typeof rawAddr === 'string') return rawAddr.trim();
    if (typeof rawAddr === 'object') {
        if (rawAddr.fullAddress && typeof rawAddr.fullAddress === 'string') {
            return rawAddr.fullAddress.trim();
        }
        const parts = [
            rawAddr.addressLine || rawAddr.address,
            rawAddr.subDistrict ? (rawAddr.subDistrict.startsWith('ต.') || rawAddr.subDistrict.startsWith('แขวง') ? rawAddr.subDistrict : `ต.${rawAddr.subDistrict}`) : (rawAddr.subdistrict ? `ต.${rawAddr.subdistrict}` : ''),
            rawAddr.district ? (rawAddr.district.startsWith('อ.') || rawAddr.district.startsWith('เขต') ? rawAddr.district : `อ.${rawAddr.district}`) : (rawAddr.amphur ? `อ.${rawAddr.amphur}` : ''),
            rawAddr.province ? (rawAddr.province.startsWith('จ.') ? rawAddr.province : `จ.${rawAddr.province}`) : (rawAddr.changwat ? `จ.${rawAddr.changwat}` : ''),
            rawAddr.postalCode || rawAddr.postcode || rawAddr.zipCode || rawAddr.zipcode
        ].filter(Boolean);
        return parts.join(' ').trim();
    }
    return '';
};

export default function ActiveCustomerCard({
    activeTab,
    updateActiveTab,
    isEditingCustomerPhone,
    setIsEditingCustomerPhone,
    tempCustomerPhone,
    setTempCustomerPhone,
    formatPhoneNumber,
    isProcessing,
    netTotal,
    onDeselectCustomer,
    onClearCustomer
}) {
    if (!activeTab.customer) return null;

    const handleDeselect = onDeselectCustomer || onClearCustomer;
    const custId = activeTab.customer?.uid || activeTab.customer?.id;
    const hasAddress = Boolean(activeTab.customer?.address || activeTab.customer?.legacyAddress || activeTab.customer?.shippingAddress || activeTab.customer?.rawAddress);

    // ⚡ On-Demand Profile Hydration (ดึงที่อยู่จริงจาก users/{uid} เมื่อแคตตาล็อกไม่มีที่อยู่)
    useEffect(() => {
        if (!custId || hasAddress || !updateActiveTab) return;
        let isMounted = true;

        getUserProfile(custId).then(profile => {
            if (isMounted && profile && (profile.address || profile.legacyAddress || profile.shippingAddress || profile.taxId)) {
                updateActiveTab(tab => {
                    const currentId = tab.customer?.uid || tab.customer?.id;
                    if (currentId !== custId) return tab;
                    return {
                        ...tab,
                        customer: {
                            ...tab.customer,
                            ...profile,
                            address: profile.address || tab.customer.address,
                            legacyAddress: profile.legacyAddress || tab.customer.legacyAddress,
                            shippingAddress: profile.shippingAddress || tab.customer.shippingAddress,
                            taxId: profile.taxId || tab.customer.taxId,
                            taxNumber: profile.taxNumber || tab.customer.taxNumber,
                            logisticProvider: profile.logisticProvider || tab.customer.logisticProvider,
                            preferredCourier: profile.preferredCourier || tab.customer.preferredCourier,
                            logisticNote: profile.logisticNote || tab.customer.logisticNote,
                            shippingNotes: profile.shippingNotes || tab.customer.shippingNotes,
                            contactName: profile.contactName || tab.customer.contactName,
                            branch: profile.branch || profile.branchName || tab.customer.branch
                        }
                    };
                });
            }
        }).catch(err => console.warn('[ActiveCustomerCard] On-demand profile hydration warning:', err));

        return () => { isMounted = false; };
    }, [custId, hasAddress, updateActiveTab]);

    const displayName = getCustomerDisplayName(activeTab.customer, '-');
    const displayAddress = getDisplayAddress(activeTab.customer);
    const courier = activeTab.customer.logisticProvider || activeTab.customer.preferredCourier;
    const shippingNotes = activeTab.customer.logisticNote || activeTab.customer.shippingNotes;
    const contactName = activeTab.customer.contactName;
    const taxId = typeof activeTab.customer.taxId === 'object' ? activeTab.customer.taxId?.number : (activeTab.customer.taxId || activeTab.customer.taxNumber);
    const branch = activeTab.customer.branch || activeTab.customer.branchName;

    const details = [];
    if (displayAddress) details.push(displayAddress);
    if (courier) details.push(`ขนส่ง: ${courier}`);
    if (shippingNotes) details.push(`(${shippingNotes})`);
    if (contactName) details.push(`ผู้ติดต่อ: ${contactName}`);
    if (taxId) details.push(`TAX ID: ${taxId}${branch ? ` (${branch})` : ''}`);
    const detailSummary = details.length > 0 ? details.join(' • ') : (displayAddress || 'ไม่มีข้อมูลที่อยู่');

    const walletBal = Number(activeTab.customer.walletBalance ?? activeTab.customer.dhWallet ?? 0);
    const pointsBal = Number(activeTab.customer.creditPoints ?? activeTab.customer.totalAccumulatedPoints ?? activeTab.customer.points ?? 0);

    const custPhone = activeTab.customer?.phone || activeTab.customer?.phoneNumber || '';

    return (
        <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200/80 animate-in fade-in duration-150">
            {/* 1. Customer Name Row (First Element - 1:1 Production Parity) */}
            <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-bold text-[13px] text-slate-800 leading-snug truncate" title={displayName}>
                        {displayName}
                    </h3>
                    {custPhone && (
                        <span className="text-[10px] text-blue-600 font-mono font-bold shrink-0 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded-xs">
                            {custPhone}
                        </span>
                    )}
                </div>
                {handleDeselect && (
                    <button 
                        type="button" 
                        onClick={handleDeselect} 
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded-md transition-colors cursor-pointer shrink-0" 
                        title="ยกเลิกเลือกลูกค้า"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* 1.1 Phone Input / Right Reservation (Only shown if phone missing or editing) */}
            {!custPhone && !activeTab.hidePhone && !isEditingCustomerPhone && (
                <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-2 mb-2 flex items-center justify-between text-[11px] animate-in fade-in">
                    <span className="text-amber-800 font-bold flex items-center gap-1.5">
                        <Phone size={11} className="text-amber-600" /> ระบุเบอร์ หรือสงวนสิทธิ์
                    </span>
                    <div className="flex gap-1">
                        <button 
                            type="button" 
                            onClick={() => {
                                if (setTempCustomerPhone) setTempCustomerPhone('');
                                if (setIsEditingCustomerPhone) setIsEditingCustomerPhone(true);
                            }} 
                            className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-xs"
                        >
                            ใส่เบอร์
                        </button>
                        <button 
                            type="button" 
                            onClick={() => updateActiveTab({ hidePhone: true })} 
                            className="px-2 py-0.5 bg-white border border-slate-300 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-50 transition-colors"
                        >
                            สงวนสิทธิ์
                        </button>
                    </div>
                </div>
            )}

            {!custPhone && activeTab.hidePhone && !isEditingCustomerPhone && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 mb-2 flex items-center justify-between text-[11px] animate-in fade-in">
                    <span className="text-slate-600 font-bold flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-emerald-600" /> สงวนสิทธิ์เบอร์โทร
                    </span>
                    <button 
                        type="button" 
                        onClick={() => {
                            updateActiveTab({ hidePhone: false });
                            if (setTempCustomerPhone) setTempCustomerPhone('');
                            if (setIsEditingCustomerPhone) setIsEditingCustomerPhone(true);
                        }} 
                        className="text-[10px] text-blue-600 font-bold underline hover:text-blue-800"
                    >
                        ใส่เบอร์
                    </button>
                </div>
            )}

            {isEditingCustomerPhone && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-2 mb-2 animate-in fade-in space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-blue-600 shrink-0" />
                        <input 
                            type="text" 
                            placeholder="(+66)XX-XXX-XXXX" 
                            value={tempCustomerPhone || ''} 
                            onChange={(e) => {
                                const formatted = formatPhoneNumber ? formatPhoneNumber(e.target.value) : e.target.value;
                                if (setTempCustomerPhone) setTempCustomerPhone(formatted);
                            }}
                            autoFocus
                            className="w-full px-2 py-1 text-[11px] border border-blue-300 bg-white rounded-md font-mono font-bold outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-blue-900"
                        />
                    </div>
                    <div className="flex justify-end gap-1">
                        <button 
                            type="button" 
                            onClick={() => {
                                if (tempCustomerPhone && tempCustomerPhone.trim()) {
                                    updateActiveTab({ 
                                        customer: { ...activeTab.customer, phone: tempCustomerPhone.trim() },
                                        hidePhone: false 
                                    });
                                    if (setIsEditingCustomerPhone) setIsEditingCustomerPhone(false);
                                }
                            }}
                            className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1"
                        >
                            <Check size={10} /> บันทึกเบอร์
                        </button>
                        <button 
                            type="button" 
                            onClick={() => {
                                updateActiveTab({ hidePhone: true });
                                if (setIsEditingCustomerPhone) setIsEditingCustomerPhone(false);
                            }} 
                            className="px-2 py-0.5 bg-white border border-slate-300 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-50 transition-colors"
                        >
                            สงวนสิทธิ์
                        </button>
                        <button 
                            type="button" 
                            onClick={() => {
                                if (setIsEditingCustomerPhone) setIsEditingCustomerPhone(false);
                            }} 
                            className="px-1.5 py-0.5 text-slate-400 hover:text-slate-600 text-[10px]"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Inset Address Box with MapPin */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-2.5 mb-2.5 flex items-start gap-1.5">
                <MapPin size={13} className="text-blue-500 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-600 leading-relaxed font-sans select-all line-clamp-2" title={detailSummary}>
                    {detailSummary}
                </span>
            </div>

            {/* 3. Subtle Divider Line */}
            <div className="border-t border-slate-100 my-2" />

            {/* 4. Bottom Row: Wallet (Left) & Points (Right) */}
            <div className="flex items-center justify-between">
                {/* Left: DH ค้างยอด + ใช้หัก checkbox */}
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Wallet size={12} className="text-blue-500" />
                        <span>DH ค้างยอด:</span>
                        <span className="font-bold text-slate-900 font-mono">
                            ฿{walletBal.toLocaleString(undefined, { minimumFractionDigits: walletBal % 1 !== 0 ? 1 : 0, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-1.5 py-0.5 mt-1 bg-blue-50/70 border border-blue-200 rounded text-[10px] text-blue-700 font-bold cursor-pointer hover:bg-blue-100 transition-colors select-none">
                        <input 
                            type="checkbox" 
                            disabled={isProcessing || walletBal <= 0}
                            checked={activeTab.useWallet || activeTab.walletUsed > 0}
                            onChange={(e) => {
                                updateActiveTab({ 
                                    useWallet: e.target.checked, 
                                    walletUsed: e.target.checked ? Math.min(walletBal, netTotal) : 0 
                                });
                            }}
                            className="w-3 h-3 text-blue-600 rounded border-blue-300 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span>ใช้หัก</span>
                    </label>
                </div>

                {/* Right: Solid Blue POINTS Badge */}
                <div className="bg-[#1D68E2] text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
                    <Sparkles size={12} className="text-amber-300" />
                    <span>POINTS:</span>
                    <span className="text-amber-300">★</span>
                    <span className="font-mono">{pointsBal.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
