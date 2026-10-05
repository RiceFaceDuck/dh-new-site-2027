import React, { useState, useEffect } from 'react';
import { 
    X, Sparkles, User, Phone, MapPin, Save, ArrowRight, ArrowLeft, 
    Check, CheckCircle2, Shield, AlertCircle, Loader2, Mail, Users,
    Truck, UserCheck, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import { getCollectionPath, parseCustomerAddress } from 'dh-shared';
import { userService } from '../../../../../firebase/userService';
import { settingsService } from '../../../../../firebase/settingsService';
import CustomerDuplicateComparisonModal, { checkPotentialDuplicates } from '../../../../../pages/Customers/components/forms/CustomerDuplicateComparisonModal';

/**
 * 📦 Quick Customer Helper Services
 */
const quickCustomerService = {
    buildCustomerPayload: (parsedData, selectedRole) => {
        const zip = (parsedData.postalCode || parsedData.zipCode || '').trim();
        const fullAddress = [
            parsedData.addressLine,
            parsedData.subDistrict ? `ต.${parsedData.subDistrict}` : '',
            parsedData.district ? `อ.${parsedData.district}` : '',
            parsedData.province ? `จ.${parsedData.province}` : '',
            zip
        ].filter(Boolean).join(' ');

        const name = (parsedData.accountName || '').trim();
        const contact = (parsedData.contactName || '').trim();
        const courier = (parsedData.preferredCourier || parsedData.logisticProvider || '').trim();
        const notes = (parsedData.shippingNotes || parsedData.logisticNote || '').trim();
        const fb = (parsedData.facebookUrl || parsedData.facebook || '').trim();

        return {
            accountName: name,
            displayName: name,
            storeName: name,
            name: name,
            contactName: contact || name,
            firstName: contact || name,
            phone: parsedData.phone || '',
            phoneNumber: parsedData.phone || '',
            email: parsedData.email || '',
            lineId: parsedData.lineId || '',
            facebook: fb,
            facebookUrl: fb,
            role: selectedRole,
            rank: selectedRole,
            address: {
                addressLine: parsedData.addressLine || '',
                subDistrict: parsedData.subDistrict || '',
                district: parsedData.district || '',
                province: parsedData.province || '',
                postalCode: zip,
                zipCode: zip,
                fullAddress: fullAddress
            },
            legacyAddress: fullAddress,
            preferredCourier: courier,
            logisticProvider: courier,
            shippingNotes: notes,
            logisticNote: notes,
            customerType: 'ทั่วไป',
            source: 'POS Quick Smart Add'
        };
    },

    executeCreateCustomer: async (payload) => {
        const createdId = await userService.createManualCustomer(payload);
        const uid = typeof createdId === 'string' ? createdId : (createdId?.uid || createdId?.id || `cust_${Date.now()}`);
        return {
            uid,
            id: uid,
            ...payload,
            storeName: payload.accountName
        };
    },

    checkDuplicateAndCreate: async (parsedData, selectedRole) => {
        const payload = quickCustomerService.buildCustomerPayload(parsedData, selectedRole);
        let duplicates = [];
        try {
            duplicates = await checkPotentialDuplicates(payload);
        } catch (err) {
            console.warn('[QuickAddCustomerModal] checkPotentialDuplicates warning:', err);
        }

        if (duplicates && duplicates.length > 0) {
            return { isDuplicate: true, duplicates, payload };
        }

        const newCust = await quickCustomerService.executeCreateCustomer(payload);
        return { isDuplicate: false, newCust, payload };
    },

    overwriteExistingCustomer: async (existingCustomer, newFields) => {
        const uid = existingCustomer.uid || existingCustomer.id;
        await userService.updateCustomerProfile(uid, newFields);
        return { ...existingCustomer, ...newFields };
    },

    fetchRoleTierConfig: async () => {
        try {
            const config = await settingsService.getRoleTierConfig();
            if (config && config.roles?.length > 0) {
                return config.roles;
            }
        } catch (e) {
            console.warn('[QuickAddCustomerModal] Could not fetch role_tier_config:', e);
        }
        return [
            { id: 'wholesale', name: 'ร้านช่าง', description: 'ช่างซ่อม / ราคาส่งทั่วไป' },
            { id: 'member', name: 'Member / General', description: 'ลูกค้าทั่วไป / สมาชิกเริ่มต้น' },
            { id: 'partner', name: 'VIP / Retail Partner', description: 'ร้านค้าพันธมิตร / VIP' },
            { id: 'enterprise', name: 'Enterprise Partner', description: 'คู่ค้าใหญ่ระดับองค์กร / สัญญารายปี' }
        ];
    },

    lookupWebAccountByEmail: async (email) => {
        if (!email || !email.includes('@')) return null;
        try {
            const usersRef = collection(db, getCollectionPath('users'));
            const q = query(usersRef, where('email', '==', email.trim().toLowerCase()), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const docSnap = snap.docs[0];
                return { uid: docSnap.id, id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (e) {
            console.error('[QuickAddCustomerModal] Error looking up web account by email:', e);
            throw e;
        }
    }
};

/**
 * 🪄 Step 1 Component: Smart Quick Paste & Real-time Field Mapping
 */
function QuickAddStep1({
    rawInputText, handleTextChange, selectedRole, setSelectedRole, 
    dynamicRoles, parsedData, handleFieldChange, onClose, isSaving, handleStep1SaveDB
}) {
    return (
        <>
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {/* Textarea Paste Area */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-yellow-500" />
                        วางข้อมูลลูกค้าชุดเดียวที่นี่ (ก๊อปปี้จาก Chat / Line / FB)
                    </label>
                    <textarea 
                        rows={3} 
                        value={rawInputText} 
                        onChange={e => handleTextChange(e.target.value)} 
                        placeholder="ตัวอย่าง: คุณ ภวัต บุญมา 065-4428822 91/364 ม.2 พฤกษา14บี ต.บางคูรัด อ.บางบัวทอง จ.นนทบุรี 11110" 
                        className="w-full p-3 border border-yellow-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400/30 rounded-xl text-xs bg-yellow-50/40 text-slate-900 placeholder:text-slate-400 outline-hidden transition-all resize-none font-sans" 
                        autoFocus
                    />
                </div>

                {/* Role / Rank Selector */}
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5">
                    <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <Shield size={14} className="text-indigo-600" />
                        ระดับสิทธิ์บัญชี (Role / Rank)
                    </label>
                    <select 
                        value={selectedRole} 
                        onChange={e => setSelectedRole(e.target.value)} 
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
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

                {/* Real-time Parsed Fields Grid */}
                <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            ผลลัพธ์การจัดสรรข้อมูลอัตโนมัติ (แก้ไขได้)
                        </span>
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                            Real-time Parser
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
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
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden" 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                <UserCheck size={12} className="text-blue-500" />
                                ชื่อผู้รับ / ผู้ติดต่อ (Contact Person)
                            </label>
                            <input 
                                type="text" 
                                value={parsedData.contactName || ''} 
                                onChange={e => handleFieldChange('contactName', e.target.value)} 
                                placeholder="ระบุชื่อผู้รับ หรือ ผู้ติดต่อ (ถ้ามี)" 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-1 focus:ring-blue-500 outline-hidden" 
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
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden" 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                <MapPin size={12} className="text-rose-500" />
                                รหัสไปรษณีย์
                            </label>
                            <input 
                                type="text" 
                                value={parsedData.postalCode} 
                                onChange={e => handleFieldChange('postalCode', e.target.value)} 
                                placeholder="50200" 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden" 
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
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:ring-1 focus:ring-violet-500 outline-hidden" 
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
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500 outline-hidden" 
                            />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                <MapPin size={12} className="text-slate-500" />
                                บ้านเลขที่ / ถนน / อาคาร
                            </label>
                            <input 
                                type="text" 
                                value={parsedData.addressLine} 
                                onChange={e => handleFieldChange('addressLine', e.target.value)} 
                                placeholder="เลขที่ห้อง, ชั้น, ชื่อตึก, ซอย, ถนน" 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden" 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">ตำบล / แขวง</label>
                            <input 
                                type="text" 
                                value={parsedData.subDistrict} 
                                onChange={e => handleFieldChange('subDistrict', e.target.value)} 
                                placeholder="สุเทพ" 
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white" 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">อำเภอ / เขต</label>
                            <input 
                                type="text" 
                                value={parsedData.district} 
                                onChange={e => handleFieldChange('district', e.target.value)} 
                                placeholder="เมือง" 
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white" 
                            />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500">จังหวัด</label>
                            <input 
                                type="text" 
                                value={parsedData.province} 
                                onChange={e => handleFieldChange('province', e.target.value)} 
                                placeholder="เชียงใหม่" 
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white" 
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
                                placeholder="เช่น Flash, Kerry, ไปรษณีย์ไทย" 
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:ring-1 focus:ring-amber-500 outline-hidden" 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                <Shield size={12} className="text-slate-400" />
                                หมายเหตุจัดส่ง (Shipping Notes)
                            </label>
                            <input 
                                type="text" 
                                value={parsedData.shippingNotes || parsedData.logisticNote || ''} 
                                onChange={e => handleFieldChange('shippingNotes', e.target.value)} 
                                placeholder="เช่น โทรแจ้งก่อนส่ง, ฝากป้อมยาม" 
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:ring-1 focus:ring-slate-400 outline-hidden" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button 
                    type="button" 
                    onClick={onClose} 
                    disabled={isSaving} 
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                    ยกเลิก
                </button>
                <button 
                    type="button" 
                    onClick={handleStep1SaveDB} 
                    disabled={isSaving || !parsedData.accountName.trim()} 
                    className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-slate-900 font-black text-xs rounded-xl shadow-md border border-yellow-500/40 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={16} className="animate-spin text-slate-900" />
                            <span>กำลังบันทึกลง DB...</span>
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            <span>บันทึกเข้า DB และถัดไป</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </>
    );
}

/**
 * 🌐 Step 2 Component: Web Account Linking & Loyalty Points
 */
function QuickAddStep2({
    createdCustomerObj, hasWebAccountChoice, setHasWebAccountChoice,
    syncEmail, setSyncEmail, isCheckingAccount, matchedWebAccount,
    setModalStep, handleStep2Finalize
}) {
    return (
        <>
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 animate-in fade-in duration-300">
                {/* Success Banner */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900">
                    <div className="p-2 bg-emerald-500 text-white rounded-lg shrink-0">
                        <CheckCircle2 size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-xs">บันทึกรายชื่อลูกค้าลงฐานข้อมูล DB สำเร็จ!</p>
                        <p className="text-[10px] text-emerald-700">
                            ชื่อ: {createdCustomerObj?.accountName} (ID: {createdCustomerObj?.accountId || createdCustomerObj?.customerCode || createdCustomerObj?.uid})
                        </p>
                    </div>
                </div>

                {/* Question Header */}
                <div className="text-center space-y-1.5 py-2">
                    <h3 className="text-sm font-black text-slate-900 flex items-center justify-center gap-2">
                        <Users size={18} className="text-blue-600" />
                        ลูกค้าท่านนี้สมัครสมาชิก หรือมี Account หน้าเว็บแล้วหรือยัง?
                    </h3>
                    <p className="text-xs text-slate-500">
                        ผูกธุรกรรมกับบัญชีหน้าเว็บเพื่อให้ลูกค้าได้รับสะสมคะแนน Points
                    </p>
                </div>

                {/* Option 1: Yes, has web account */}
                <div className="grid grid-cols-1 gap-3">
                    <div 
                        onClick={() => setHasWebAccountChoice('yes')} 
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            hasWebAccountChoice === 'yes' 
                                ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-400/20' 
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                hasWebAccountChoice === 'yes' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                            }`}>
                                {hasWebAccountChoice === 'yes' && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div>
                                <p className="font-bold text-xs text-slate-900">มี Account หน้าเว็บ (ต้องการผูกเพื่อรับ Point)</p>
                                <p className="text-[10px] text-slate-500">กรอกอีเมลเพื่อค้นหาและเชื่อมโยงคะแนน Points</p>
                            </div>
                        </div>

                        {hasWebAccountChoice === 'yes' && (
                            <div className="mt-3.5 pt-3 border-t border-blue-200/60 space-y-2 animate-in fade-in slide-in-from-top-1">
                                <label className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                                    <Mail size={12} className="text-blue-600" /> ระบุอีเมลสมัครหน้าเว็บของลูกค้า
                                </label>
                                <div className="relative">
                                    <input 
                                        type="email" 
                                        value={syncEmail} 
                                        onChange={e => setSyncEmail(e.target.value)} 
                                        placeholder="เช่น customer@example.com" 
                                        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-400 outline-hidden" 
                                        autoFocus
                                    />
                                    {isCheckingAccount && (
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                            <Loader2 size={14} className="animate-spin text-blue-500" />
                                        </div>
                                    )}
                                </div>

                                {syncEmail && syncEmail.includes('@') && !isCheckingAccount && (
                                    <div>
                                        {matchedWebAccount ? (
                                            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                                <div>
                                                    <p className="font-bold">พบบัญชีเว็บสมบูรณ์: {matchedWebAccount.displayName || matchedWebAccount.accountName}</p>
                                                    <p className="text-[10px] text-emerald-700 font-mono">ID: {matchedWebAccount.accountId || matchedWebAccount.customerCode || matchedWebAccount.uid}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                                                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                                                <p className="text-[10px] leading-relaxed">
                                                    ยังไม่พบบัญชีด้วยอีเมลนี้ ระบบจะลงทะเบียนอีเมลนี้ไว้ใน DB เพื่อให้ผูก Point อัตโนมัติเมื่อลูกค้าสมัครสมาชิก
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Option 2: No, skip */}
                    <div 
                        onClick={() => setHasWebAccountChoice('no')} 
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            hasWebAccountChoice === 'no' 
                                ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-400/20' 
                                : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                hasWebAccountChoice === 'no' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                            }`}>
                                {hasWebAccountChoice === 'no' && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div>
                                <p className="font-bold text-xs text-slate-900">ยังไม่มี Account / ข้ามขั้นตอนและเปิดบิลต่อทันที</p>
                                <p className="text-[10px] text-slate-500">เสร็จสิ้นขั้นตอน ดำเนินการออกบิลต่อทันที</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button 
                    type="button" 
                    onClick={() => setModalStep(1)} 
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                    <ArrowLeft size={14} /> ย้อนกลับ
                </button>
                <button 
                    type="button" 
                    onClick={handleStep2Finalize} 
                    disabled={!hasWebAccountChoice} 
                    className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-slate-900 font-black text-xs rounded-xl shadow-md border border-yellow-500/40 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <CheckCircle2 size={16} />
                    <span>
                        {hasWebAccountChoice === 'yes' && matchedWebAccount ? 'ยืนยันผูกบัญชี และใช้ในบิลนี้ทันที' : 'เปิดบิลต่อทันที (เสร็จสิ้น)'}
                    </span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </>
    );
}

/**
 * 🌟 Main QuickAddCustomerModal Component
 * Full 2-Step Wizard with Real-time Parser, Duplicate Check, and Points Integration
 */
export default function QuickAddCustomerModal({ isOpen, onClose, initialText = '', onCustomerCreated }) {
    const [modalStep, setModalStep] = useState(1);
    const [createdCustomerObj, setCreatedCustomerObj] = useState(null);
    const [rawInputText, setRawInputText] = useState('');
    const [selectedRole, setSelectedRole] = useState('Member / General');
    const [dynamicRoles, setDynamicRoles] = useState([]);
    const [hasWebAccountChoice, setHasWebAccountChoice] = useState(null);
    const [syncEmail, setSyncEmail] = useState('');
    const [isCheckingAccount, setIsCheckingAccount] = useState(false);
    const [matchedWebAccount, setMatchedWebAccount] = useState(null);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [duplicateCandidates, setDuplicateCandidates] = useState([]);
    const [pendingNewCustPayload, setPendingNewCustPayload] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [parsedData, setParsedData] = useState({
        accountName: '',
        contactName: '',
        phone: '',
        formattedPhone: '',
        email: '',
        lineId: '',
        facebook: '',
        addressLine: '',
        subDistrict: '',
        district: '',
        province: '',
        postalCode: '',
        preferredCourier: '',
        shippingNotes: ''
    });

    // Reset or initialize state when opening modal
    useEffect(() => {
        if (isOpen) {
            setModalStep(1);
            setCreatedCustomerObj(null);
            setRawInputText(initialText || '');
            setHasWebAccountChoice(null);
            setSyncEmail('');
            setMatchedWebAccount(null);
            setIsDuplicateModalOpen(false);
            setDuplicateCandidates([]);
            setPendingNewCustPayload(null);

            if (initialText) {
                const parsed = parseCustomerAddress(initialText);
                setParsedData(parsed);
                if (parsed.email) setSyncEmail(parsed.email);
            } else {
                setParsedData({
                    accountName: '',
                    contactName: '',
                    phone: '',
                    formattedPhone: '',
                    email: '',
                    lineId: '',
                    facebook: '',
                    addressLine: '',
                    subDistrict: '',
                    district: '',
                    province: '',
                    postalCode: '',
                    preferredCourier: '',
                    shippingNotes: ''
                });
            }
        }
    }, [isOpen, initialText]);

    // Load Dynamic Roles from settings/role_tier_config
    useEffect(() => {
        if (!isOpen) return;
        quickCustomerService.fetchRoleTierConfig().then(roles => {
            if (roles && roles.length > 0) {
                setDynamicRoles(roles);
                // Prefer 'ร้านช่าง' (wholesale) as default
                const defaultRole = roles.find(r => 
                    (r.name && (r.name.includes('ร้านช่าง') || r.name.toLowerCase().includes('wholesale') || r.name.toLowerCase().includes('mechanic'))) ||
                    (r.id && (r.id === 'wholesale' || r.id.includes('ช่าง'))) ||
                    (r.description && r.description.includes('ช่าง'))
                ) || roles[0];
                setSelectedRole(defaultRole ? defaultRole.name || defaultRole.id : roles[0]?.name);
            }
        });
    }, [isOpen]);

    // Lookup Web Account by Email when on Step 2
    useEffect(() => {
        if (modalStep !== 2 || hasWebAccountChoice !== 'yes' || !syncEmail || !syncEmail.includes('@')) {
            setMatchedWebAccount(null);
            setIsCheckingAccount(false);
            return;
        }

        let isSubscribed = true;
        setIsCheckingAccount(true);
        const timer = setTimeout(async () => {
            try {
                const match = await quickCustomerService.lookupWebAccountByEmail(syncEmail);
                if (isSubscribed) {
                    setMatchedWebAccount(match);
                }
            } catch (e) {
                console.warn('[QuickAddCustomerModal] lookup error:', e);
            } finally {
                if (isSubscribed) setIsCheckingAccount(false);
            }
        }, 400);

        return () => {
            isSubscribed = false;
            clearTimeout(timer);
        };
    }, [modalStep, hasWebAccountChoice, syncEmail]);

    // Real-time Text Parsing Handler
    const handleTextChange = (text) => {
        setRawInputText(text);
        const parsed = parseCustomerAddress(text);
        setParsedData(parsed);
        if (parsed.email && !syncEmail) {
            setSyncEmail(parsed.email);
        }
    };

    const handleFieldChange = (field, value) => {
        setParsedData(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'postalCode') next.zipCode = value;
            if (field === 'zipCode') next.postalCode = value;
            if (field === 'preferredCourier') next.logisticProvider = value;
            if (field === 'logisticProvider') next.preferredCourier = value;
            if (field === 'shippingNotes') next.logisticNote = value;
            if (field === 'logisticNote') next.shippingNotes = value;
            if (field === 'facebook') next.facebookUrl = value;
            if (field === 'facebookUrl') next.facebook = value;
            if (field === 'contactName') next.firstName = value;
            if (field === 'firstName') next.contactName = value;
            return next;
        });
    };

    // Step 1: Save to DB with Duplicate Check
    const handleStep1SaveDB = async () => {
        if (isSaving) return;
        if (!parsedData.accountName || !parsedData.accountName.trim()) {
            toast.error('⚠️ กรุณาระบุชื่อลูกค้าหรือชื่อร้านค้า');
            return;
        }

        setIsSaving(true);
        try {
            const checkRes = await quickCustomerService.checkDuplicateAndCreate(parsedData, selectedRole);
            if (checkRes.isDuplicate) {
                setDuplicateCandidates(checkRes.duplicates);
                setPendingNewCustPayload(checkRes.payload);
                setIsDuplicateModalOpen(true);
            } else if (checkRes.newCust) {
                setCreatedCustomerObj(checkRes.newCust);
                if (onCustomerCreated) onCustomerCreated(checkRes.newCust);
                setHasWebAccountChoice('no');
                setModalStep(2);
                setIsDuplicateModalOpen(false);
            }
        } catch (err) {
            console.error('🔥 Error checking quick customer:', err);
            toast.error('ไม่สามารถบันทึกลูกค้าได้ กรุณาตรวจสอบข้อมูลและลองใหม่');
        } finally {
            setIsSaving(false);
        }
    };

    // Duplicate Handling Handlers
    const handleSelectExistingCustomer = (existing) => {
        if (onCustomerCreated && existing) onCustomerCreated(existing);
        setIsDuplicateModalOpen(false);
        onClose();
    };

    const handleOverwriteExistingCustomer = async (existing, newPayload) => {
        setIsSaving(true);
        try {
            const updated = await quickCustomerService.overwriteExistingCustomer(existing, newPayload);
            if (onCustomerCreated) onCustomerCreated(updated);
            toast.success('✅ อัปเดตและเขียนทับข้อมูลลูกค้าเดิมเรียบร้อยแล้ว');
            setIsDuplicateModalOpen(false);
            onClose();
        } catch (err) {
            console.error('Error overwriting customer:', err);
            toast.error('ไม่สามารถรวมข้อมูลลูกค้าได้');
        } finally {
            setIsSaving(false);
        }
    };

    const handleForceCreateNewCustomer = async () => {
        if (!pendingNewCustPayload) return;
        setIsSaving(true);
        try {
            const newCust = await quickCustomerService.executeCreateCustomer(pendingNewCustPayload);
            setCreatedCustomerObj(newCust);
            if (onCustomerCreated) onCustomerCreated(newCust);
            setHasWebAccountChoice('no');
            setModalStep(2);
            setIsDuplicateModalOpen(false);
        } catch (err) {
            console.error('🔥 Error creating customer:', err);
            toast.error('ไม่สามารถบันทึกลูกค้าได้');
        } finally {
            setIsSaving(false);
        }
    };

    // Step 2: Finalize
    const handleStep2Finalize = () => {
        let finalCust = createdCustomerObj;
        if (hasWebAccountChoice === 'yes' && matchedWebAccount) {
            finalCust = {
                ...matchedWebAccount,
                uid: matchedWebAccount.uid || matchedWebAccount.id,
                id: matchedWebAccount.uid || matchedWebAccount.id,
                accountName: matchedWebAccount.accountName || matchedWebAccount.displayName || createdCustomerObj?.accountName,
                storeName: matchedWebAccount.storeName || matchedWebAccount.accountName || createdCustomerObj?.accountName,
                phone: matchedWebAccount.phone || matchedWebAccount.phoneNumber || createdCustomerObj?.phone || '',
                role: selectedRole,
                rank: selectedRole
            };
            toast.success(`✅ ผูกธุรกรรมกับบัญชีหน้าเว็บสำเร็จ!\nบัญชี: ${finalCust.accountName}`);
        }
        if (onCustomerCreated && finalCust) onCustomerCreated(finalCust);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
                    {/* Header */}
                    <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-yellow-400 text-slate-900 rounded-xl font-bold shadow-sm">
                                <Sparkles size={18} className="animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                                    {modalStep === 1 ? 'เพิ่มลูกค้าใหม่ (Smart Quick Paste)' : 'ขั้นตอนที่ 2: ผูกบัญชีหน้าเว็บ (Points)'}
                                </h2>
                                <p className="text-xs text-slate-300">
                                    {modalStep === 1 ? 'วางข้อความชุดเดียว ระบบจัดสรรข้อมูลลงช่องให้อัตโนมัติ' : 'สอบถามการผูกบัญชีสมาชิกหน้าเว็บหลักเพื่อสะสม Points'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Step 1 or Step 2 */}
                    {modalStep === 1 && (
                        <QuickAddStep1 
                            rawInputText={rawInputText}
                            handleTextChange={handleTextChange}
                            selectedRole={selectedRole}
                            setSelectedRole={setSelectedRole}
                            dynamicRoles={dynamicRoles}
                            parsedData={parsedData}
                            handleFieldChange={handleFieldChange}
                            onClose={onClose}
                            isSaving={isSaving}
                            handleStep1SaveDB={handleStep1SaveDB}
                        />
                    )}

                    {modalStep === 2 && (
                        <QuickAddStep2 
                            createdCustomerObj={createdCustomerObj}
                            hasWebAccountChoice={hasWebAccountChoice}
                            setHasWebAccountChoice={setHasWebAccountChoice}
                            syncEmail={syncEmail}
                            setSyncEmail={setSyncEmail}
                            isCheckingAccount={isCheckingAccount}
                            matchedWebAccount={matchedWebAccount}
                            setModalStep={setModalStep}
                            handleStep2Finalize={handleStep2Finalize}
                        />
                    )}
                </div>
            </div>

            {/* Duplicate Comparison Modal */}
            <CustomerDuplicateComparisonModal 
                isOpen={isDuplicateModalOpen}
                onClose={() => setIsDuplicateModalOpen(false)}
                newCustomerData={pendingNewCustPayload}
                duplicateCandidates={duplicateCandidates}
                onSelectExisting={handleSelectExistingCustomer}
                onOverwriteExisting={handleOverwriteExistingCustomer}
                onForceCreateNew={handleForceCreateNewCustomer}
            />
        </>
    );
}
