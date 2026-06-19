import React from 'react';
import { Megaphone, X, Save } from 'lucide-react';

export default function PromotionModal({ 
    isOpen, 
    onClose, 
    formData, 
    setFormData, 
    handleSave, 
    isProcessing 
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-fuchsia-50 to-pink-50 shrink-0">
                    <h2 className="text-lg font-black text-fuchsia-900 flex items-center gap-2">
                        <Megaphone className="text-fuchsia-600"/> {formData.id ? 'แก้ไขโปรโมชัน' : 'สร้างโปรโมชันใหม่'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-white hover:text-rose-500 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 bg-gray-50 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    {/* ข้อมูลพื้นฐานโปรโมชัน */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 shadow-sm">
                        <h3 className="text-sm font-black text-gray-800 border-b pb-2 mb-3">🏷️ ข้อมูลโปรโมชัน</h3>
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">ชื่อแคมเปญ / โปรโมชัน <span className="text-rose-500">*</span></label>
                            <input type="text" required placeholder="เช่น ลดล้างสต๊อก, ช้อปดีมีคืน" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm font-bold bg-white"/>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">ประเภทส่วนลด <span className="text-rose-500">*</span></label>
                                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm font-bold bg-white cursor-pointer">
                                    <option value="PERCENTAGE">ลดเป็นเปอร์เซ็นต์ (%)</option>
                                    <option value="FIXED_AMOUNT">ลดเป็นเงินสด (฿)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">มูลค่าการลด <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <input type="number" required min="0" step="0.01" placeholder="0" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-fuchsia-500 outline-none text-sm font-bold bg-white pr-8 text-right"/>
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{formData.type === 'PERCENTAGE' ? '%' : '฿'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className={`text-xs font-bold text-gray-600 uppercase mb-1 block ${formData.type !== 'PERCENTAGE' ? 'opacity-50' : ''}`}>ลดสูงสุดไม่เกิน</label>
                                    <div className="relative">
                                        <input type="number" min="0" placeholder={formData.type === 'PERCENTAGE' ? "0 = ไม่จำกัด" : "-"} value={formData.maxDiscount} onChange={e => setFormData({...formData, maxDiscount: e.target.value})} disabled={formData.type !== 'PERCENTAGE'} className={`w-full p-2.5 rounded-lg border border-gray-300 focus:border-fuchsia-500 outline-none text-sm font-bold bg-white pr-8 text-right ${formData.type !== 'PERCENTAGE' ? 'bg-gray-100 cursor-not-allowed' : ''}`}/>
                                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold ${formData.type !== 'PERCENTAGE' ? 'opacity-50' : ''}`}>฿</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">จำกัดเฉพาะสินค้า (SKU)</label>
                            <input type="text" placeholder="เช่น CASE-01, RAM-02 (ปล่อยว่าง = ใช้ได้กับสินค้าทั้งร้าน)" value={formData.applicableSkus} onChange={e => setFormData({...formData, applicableSkus: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm font-medium bg-white"/>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">รายละเอียดเพิ่มเติม (แสดงให้พนักงานเห็น)</label>
                            <textarea rows="2" placeholder="เช่น สงวนสิทธิ์เฉพาะลูกค้าหน้าร้าน" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm font-medium bg-white resize-none"/>
                        </div>
                    </div>

                    {/* เงื่อนไขและข้อจำกัด */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 shadow-sm">
                        <h3 className="text-sm font-black text-gray-800 border-b pb-2 mb-3">⚙️ เงื่อนไขการใช้สิทธิ์อัตโนมัติ</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">ยอดซื้อขั้นต่ำ (บาท)</label>
                                <div className="relative">
                                    <input type="number" min="0" placeholder="0 = ไม่มีขั้นต่ำ" value={formData.minSpend} onChange={e => setFormData({...formData, minSpend: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-fuchsia-500 outline-none text-sm font-bold bg-white pr-10 text-right"/>
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">฿</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">จำนวนชิ้นขั้นต่ำ (ชิ้น)</label>
                                <div className="relative">
                                    <input type="number" min="0" placeholder="0 = ไม่มีขั้นต่ำ" value={formData.minQty} onChange={e => setFormData({...formData, minQty: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-fuchsia-500 outline-none text-sm font-bold bg-white pr-10 text-right"/>
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">ชิ้น</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">กลุ่มลูกค้าเป้าหมาย</label>
                                <select value={formData.customerType} onChange={e => setFormData({...formData, customerType: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-fuchsia-500 outline-none text-sm font-bold bg-white cursor-pointer">
                                    <option value="ALL">ลูกค้าทั้งหมด (All)</option>
                                    <option value="RETAIL">ลูกค้าปลีก/ทั่วไป (Retail)</option>
                                    <option value="WHOLESALE">ลูกค้าส่ง/ตัวแทน (Wholesale)</option>
                                    <option value="VIP">เฉพาะลูกค้า VIP เท่านั้น</option>
                                </select>
                            </div>
                            <div />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">วันที่เริ่ม (ปล่อยว่าง = เริ่มทันที)</label>
                                <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-fuchsia-500 outline-none text-sm font-bold bg-white"/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">วันที่สิ้นสุด (ปล่อยว่าง = ไม่มีกำหนด)</label>
                                <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-fuchsia-500 outline-none text-sm font-bold bg-white"/>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">จำกัดจำนวนสิทธิ์ทั้งหมด (ปล่อยว่าง = ไม่จำกัด)</label>
                            <div className="flex gap-4 items-center">
                                <input type="number" min="1" placeholder="เช่น 100 สิทธิ์" value={formData.quotaLimit} onChange={e => setFormData({...formData, quotaLimit: e.target.value})} className="w-1/2 p-2.5 rounded-lg border border-gray-300 focus:border-fuchsia-500 outline-none text-sm font-bold bg-white"/>
                                {formData.id && formData.quotaLimit && (
                                    <span className="text-xs font-bold text-fuchsia-600 bg-fuchsia-50 px-3 py-1.5 rounded-lg border border-fuchsia-200">
                                        ใช้ไปแล้ว {formData.quotaUsed || 0} / {formData.quotaLimit} สิทธิ์
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 shrink-0">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
                        <button type="submit" disabled={isProcessing} className="px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-600/20 flex items-center gap-2 transition-all disabled:opacity-50">
                            <Save size={18} /> {isProcessing ? 'กำลังบันทึก...' : 'บันทึกโปรโมชัน'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
