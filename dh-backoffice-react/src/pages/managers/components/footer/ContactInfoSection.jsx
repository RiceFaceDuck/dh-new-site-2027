import React from 'react';
import { Building2, Clock } from 'lucide-react';

export default function ContactInfoSection({ footerConfig, handleCompanyChange, handleBusinessHoursChange }) {
    const company = footerConfig?.company || {};
    const businessHours = footerConfig?.businessHours || {};

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 shrink-0">
                    <Building2 size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-800 tracking-wide">ข้อมูลแบรนด์และการติดต่อ (Brand & Contact Info)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">ข้อมูลบริษัทและช่องทางการติดต่อที่จะแสดงในส่วน Footer หน้าร้าน</p>
                </div>
            </div>

            <div className="space-y-4 pt-1">
                <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Logo URL</label>
                    <input 
                        type="text" 
                        value={company.logoUrl || ''} 
                        onChange={(e) => handleCompanyChange('logoUrl', e.target.value)} 
                        placeholder="/logo.png หรือ URL รูปภาพโลโก้"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 font-medium text-xs sm:text-sm outline-hidden focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all" 
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">คำบรรยายร้าน (Description)</label>
                    <textarea 
                        value={company.description || ''} 
                        onChange={(e) => handleCompanyChange('description', e.target.value)} 
                        rows={3} 
                        placeholder="ผู้นำเข้าและจัดจำหน่ายอะไหล่โน๊ตบุ๊คครบวงจร..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 font-medium text-xs sm:text-sm outline-hidden focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all resize-y" 
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">ที่อยู่สำนักงานใหญ่ (Address)</label>
                    <input 
                        type="text" 
                        value={company.address || ''} 
                        onChange={(e) => handleCompanyChange('address', e.target.value)} 
                        placeholder="ศูนย์การค้าเซียร์รังสิต ชั้น 3 ห้อง xxx ถ.พหลโยธิน จ.ปทุมธานี 12130"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 font-medium text-xs sm:text-sm outline-hidden focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all" 
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Line ID</label>
                        <input 
                            type="text" 
                            value={company.lineId || ''} 
                            onChange={(e) => handleCompanyChange('lineId', e.target.value)} 
                            placeholder="@dhnotebook"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 font-medium text-xs sm:text-sm outline-hidden focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all font-mono" 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">เบอร์โทรศัพท์ (Phone)</label>
                        <input 
                            type="text" 
                            value={company.phone || ''} 
                            onChange={(e) => handleCompanyChange('phone', e.target.value)} 
                            placeholder="02-xxx-xxxx"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 font-medium text-xs sm:text-sm outline-hidden focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all font-mono" 
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">ลิงก์แอดไลน์ (Line Add Friend URL)</label>
                    <input 
                        type="text" 
                        value={company.lineAddFriendUrl || ''} 
                        onChange={(e) => handleCompanyChange('lineAddFriendUrl', e.target.value)} 
                        placeholder="https://lin.ee/... หรือ https://line.me/ti/p/~@dhnotebook"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 font-medium text-xs sm:text-sm outline-hidden focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all" 
                    />
                </div>

                {/* Business Hours */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 text-slate-700">
                        <Clock size={16} className="text-amber-500 shrink-0" />
                        <span className="text-xs font-bold tracking-wide">เวลาทำการ (Business Hours)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">เวลาเปิดทำการ (Open)</label>
                            <input 
                                type="text" 
                                value={businessHours.openHours || ''} 
                                onChange={(e) => handleBusinessHoursChange && handleBusinessHoursChange('openHours', e.target.value)} 
                                placeholder="10:00"
                                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 font-medium text-xs sm:text-sm outline-hidden focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all font-mono" 
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">เวลาปิดทำการ (Close)</label>
                            <input 
                                type="text" 
                                value={businessHours.closeHours || ''} 
                                onChange={(e) => handleBusinessHoursChange && handleBusinessHoursChange('closeHours', e.target.value)} 
                                placeholder="19:30"
                                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 font-medium text-xs sm:text-sm outline-hidden focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all font-mono" 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">วันและรอบการเปิดให้บริการ (Days)</label>
                        <input 
                            type="text" 
                            value={businessHours.days || ''} 
                            onChange={(e) => handleBusinessHoursChange && handleBusinessHoursChange('days', e.target.value)} 
                            placeholder="เปิดบริการทุกวัน (จันทร์ - อาทิตย์)"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 font-medium text-xs sm:text-sm outline-hidden focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
