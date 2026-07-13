import { Truck, MapPin } from 'lucide-react';

export default function ShippingInfoSection({ formData, handleChange }) {
    const address = formData.address || {};
    
    // ตรวจสอบว่ามีข้อมูลแบบเก่าหรือไม่ (String)
    const isLegacyAddress = typeof formData.address === 'string';

    return (
        <div className="space-y-6">
            {/* 1. ที่อยู่จัดส่ง */}
            <div>
                <h3 className="text-sm font-bold text-dh-accent mb-3 flex items-center gap-2 border-b border-dh-border pb-2">
                    <MapPin size={16} /> ที่อยู่แบบละเอียด
                </h3>
                
                {isLegacyAddress ? (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-dh-muted">ที่อยู่แบบเต็ม (Legacy)</label>
                            <button 
                                type="button" 
                                onClick={() => handleChange('address', {})} 
                                className="text-[10px] text-dh-accent hover:underline font-bold"
                            >
                                อัปเกรดเป็นแบบแยกเขต/จังหวัด
                            </button>
                        </div>
                        <textarea 
                            rows={3}
                            placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์" 
                            className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main resize-none"
                            value={formData.address || ''} 
                            onChange={e => handleChange('address', e.target.value)}
                        />
                        <p className="text-[10px] text-amber-500 mt-1">
                            * ข้อมูลนี้ถูกบันทึกด้วยระบบเก่า หากต้องการใช้ระบบแยกเขต/จังหวัด กรุณากดปุ่ม "อัปเกรด"
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-semibold text-dh-muted">บ้านเลขที่ / ถนน / อาคาร</label>
                            <input 
                                type="text" 
                                placeholder="เลขที่ห้อง, ชั้น, ชื่อตึก, ซอย, ถนน" 
                                className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                                value={address.addressLine || ''} 
                                onChange={e => handleChange('address.addressLine', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-dh-muted">แขวง / ตำบล</label>
                            <input 
                                type="text" 
                                placeholder="ระบุแขวง หรือ ตำบล" 
                                className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                                value={address.subDistrict || ''} 
                                onChange={e => handleChange('address.subDistrict', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-dh-muted">เขต / อำเภอ</label>
                            <input 
                                type="text" 
                                placeholder="ระบุเขต หรือ อำเภอ" 
                                className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                                value={address.district || ''} 
                                onChange={e => handleChange('address.district', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-dh-muted">จังหวัด</label>
                            <input 
                                type="text" 
                                placeholder="ระบุจังหวัด" 
                                className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                                value={address.province || ''} 
                                onChange={e => handleChange('address.province', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-dh-muted">รหัสไปรษณีย์</label>
                            <input 
                                type="text" 
                                placeholder="ระบุรหัสไปรษณีย์" 
                                className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                                value={address.zipCode || ''} 
                                onChange={e => handleChange('address.zipCode', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-semibold text-dh-muted">ลิงก์ Google Maps (ถ้ามี)</label>
                            <input 
                                type="text" 
                                placeholder="https://maps.app.goo.gl/..." 
                                className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                                value={address.googleMapsUrl || ''} 
                                onChange={e => handleChange('address.googleMapsUrl', e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 2. การจัดส่ง */}
            <div>
                <h3 className="text-sm font-bold text-dh-accent mb-3 flex items-center gap-2 border-b border-dh-border pb-2">
                    <Truck size={16} /> การจัดส่ง
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dh-muted">ขนส่งที่ใช้ประจำ</label>
                        <input 
                            type="text" 
                            placeholder="เช่น Flash, Kerry, J&T, ไปรษณีย์ไทย" 
                            className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                            value={formData.logisticProvider || ''} 
                            onChange={e => handleChange('logisticProvider', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-dh-muted">หมายเหตุการจัดส่ง (ถ้ามี)</label>
                        <textarea 
                            rows={2}
                            placeholder="เช่น ฝากไว้ที่ป้อมยาม, ห้ามโยนของ" 
                            className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-hidden text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main resize-none"
                            value={formData.logisticNote || ''} 
                            onChange={e => handleChange('logisticNote', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
