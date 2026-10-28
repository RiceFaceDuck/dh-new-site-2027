import React from 'react';
import { User, Phone, MapPin, Mail, MessageSquare, Truck, Shield } from 'lucide-react';

/**
 * NewCustomerPreviewSheet Component
 * 
 * Clean presentation sheet when no matching existing customer is detected (0-Match)
 * or when cashier explicitly builds a new customer record.
 * Follows rounded-[0.1rem] styling and clear left-aligned rows.
 */
export default function NewCustomerPreviewSheet({
    parsedData,
    handleFieldChange,
    selectedRole,
    setSelectedRole,
    dynamicRoles = [],
    isTaxRequested,
    setIsTaxRequested
}) {
    return (
        <div className="border border-slate-200 rounded-[0.1rem] p-5 bg-white space-y-4 text-xs shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-800 tracking-tight">
                        📋 สรุปข้อมูลลูกค้าใหม่ (พร้อมบันทึกลงระบบ)
                    </span>
                    <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-[0.1rem] border border-emerald-300">
                        จัดสรรข้อมูลอัตโนมัติ
                    </span>
                </div>
            </div>

            {/* Role / Rank Selector */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-[0.1rem] flex items-center justify-between gap-3">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                    <Shield size={14} className="text-indigo-600" />
                    ระดับสิทธิ์บัญชี:
                </label>
                <select 
                    value={selectedRole} 
                    onChange={e => setSelectedRole(e.target.value)} 
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-[0.1rem] text-xs font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer flex-1 max-w-xs"
                >
                    {dynamicRoles && dynamicRoles.length > 0 ? (
                        dynamicRoles.map(role => (
                            <option key={role.id || role.name} value={role.name || role.id}>
                                {role.name} {role.description ? `(${role.description})` : ''}
                            </option>
                        ))
                    ) : (
                        <>
                            <option value="Member / General">Member / General (ลูกค้าทั่วไป)</option>
                            <option value="Wholesale / Mechanic">Wholesale / Mechanic (ช่างซ่อม / ราคาส่ง)</option>
                            <option value="VIP / Retail Partner">VIP / Retail Partner (ร้านค้าพันธมิตร)</option>
                            <option value="Enterprise Partner">Enterprise Partner (คู่ค้าใหญ่ระดับองค์กร)</option>
                        </>
                    )}
                </select>
            </div>

            {/* Editable Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-[0.1rem] border border-slate-200 shadow-2xs">
                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <User size={12} className="text-indigo-500" />
                        ชื่อลูกค้า / ชื่อร้านค้า <span className="text-rose-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        value={parsedData.accountName} 
                        onChange={e => handleFieldChange('accountName', e.target.value)} 
                        placeholder="ระบุชื่อลูกค้า หรือ ชื่อร้าน" 
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-[0.1rem] text-xs font-bold text-slate-900 bg-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <User size={12} className="text-blue-500" />
                        ชื่อผู้รับ / ผู้ติดต่อ
                    </label>
                    <input 
                        type="text" 
                        value={parsedData.contactName || ''} 
                        onChange={e => handleFieldChange('contactName', e.target.value)} 
                        placeholder="ระบุชื่อผู้ติดต่อ (ถ้ามี)" 
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-[0.1rem] text-xs font-medium text-slate-900 bg-white focus:ring-1 focus:ring-blue-500 outline-none" 
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Phone size={12} className="text-emerald-500" />
                        เบอร์โทรศัพท์
                    </label>
                    <input 
                        type="text" 
                        value={parsedData.phone} 
                        onChange={e => handleFieldChange('phone', e.target.value)} 
                        placeholder="0812345678" 
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-[0.1rem] text-xs font-mono font-bold text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500 outline-none" 
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Mail size={12} className="text-violet-500" />
                        อีเมล (Email)
                    </label>
                    <input 
                        type="email" 
                        value={parsedData.email || ''} 
                        onChange={e => handleFieldChange('email', e.target.value)} 
                        placeholder="example@mail.com" 
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-[0.1rem] text-xs text-slate-900 bg-white focus:ring-1 focus:ring-violet-500 outline-none" 
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <MessageSquare size={12} className="text-emerald-500" />
                        Line ID
                    </label>
                    <input 
                        type="text" 
                        value={parsedData.lineId || ''} 
                        onChange={e => handleFieldChange('lineId', e.target.value)} 
                        placeholder="@lineid หรือ id" 
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-[0.1rem] text-xs text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500 outline-none" 
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Truck size={12} className="text-amber-500" />
                        ขนส่งที่ต้องการ (Courier)
                    </label>
                    <input 
                        type="text" 
                        value={parsedData.preferredCourier || parsedData.logisticProvider || ''} 
                        onChange={e => handleFieldChange('preferredCourier', e.target.value)} 
                        placeholder="เช่น Flash, Kerry" 
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-[0.1rem] text-xs text-slate-900 bg-white focus:ring-1 focus:ring-amber-500 outline-none" 
                    />
                </div>

                <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <MapPin size={12} className="text-rose-500" />
                        ที่อยู่จัดส่งสินค้า
                    </label>
                    <input 
                        type="text" 
                        value={parsedData.addressLine} 
                        onChange={e => handleFieldChange('addressLine', e.target.value)} 
                        placeholder="บ้านเลขที่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์" 
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-[0.1rem] text-xs text-slate-900 bg-white focus:ring-1 focus:ring-rose-500 outline-none" 
                    />
                </div>
            </div>

            {/* Tax Request Selector */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-[0.1rem]">
                <span className="text-slate-600 font-medium text-xs">ขอใบกำกับภาษีเต็มรูป (Tax 7%):</span>
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
        </div>
    );
}
