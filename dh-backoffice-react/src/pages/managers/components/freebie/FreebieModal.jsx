import React from 'react';
import { Gift, X, Save } from 'lucide-react';

export default function FreebieModal({ 
    isOpen, 
    onClose, 
    formData, 
    setFormData, 
    categories = [],
    handleSave, 
    isProcessing 
}) {
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = React.useState(false);
    
    // Extract unique types from categories
    const uniqueTypes = React.useMemo(() => {
        const types = categories.map(c => c.type).filter(Boolean);
        return [...new Set(types)];
    }, [categories]);

    const handleTypeToggle = (type) => {
        let currentTypes = formData.applicableTypes ? formData.applicableTypes.split(',').map(t => t.trim()).filter(Boolean) : [];
        if (currentTypes.includes(type)) {
            currentTypes = currentTypes.filter(t => t !== type);
        } else {
            currentTypes.push(type);
        }
        setFormData({ ...formData, applicableTypes: currentTypes.join(', ') });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-linear-to-r from-pink-50 to-rose-50 shrink-0">
                    <h2 className="text-lg font-black text-pink-900 flex items-center gap-2">
                        <Gift className="text-pink-600"/> {formData.id ? 'แก้ไขกฎของแถม' : 'สร้างกฎของแถมใหม่'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-white hover:text-rose-500 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 bg-gray-50 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    {/* ข้อมูลพื้นฐาน */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 shadow-xs">
                        <h3 className="text-sm font-black text-gray-800 border-b pb-2 mb-3">📦 ข้อมูลของแถม</h3>
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">ชื่อแคมเปญ <span className="text-rose-500">*</span></label>
                            <input type="text" required placeholder="เช่น ซื้อครบ 500 แถมแก้วน้ำ" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-hidden text-sm font-bold bg-white"/>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">SKU สินค้าที่แถม <span className="text-rose-500">*</span></label>
                                <input type="text" required placeholder="เช่น FREE-GIFT-01" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value.toUpperCase()})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-hidden text-sm font-bold bg-white uppercase"/>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">ให้กี่ชิ้น? <span className="text-rose-500">*</span></label>
                                    <input type="number" required min="1" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-pink-500 outline-hidden text-sm font-bold bg-white text-center"/>
                                    <span className="text-[10px] text-gray-500 mt-0.5 block text-center">{formData.distributionMode === 'per_item' ? '(ต่อ 1 ชิ้นสินค้า)' : '(รวมต่อ 1 บิล)'}</span>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">สูงสุดต่อบิล</label>
                                    <input type="number" min="1" value={formData.maxPerBill} onChange={e => setFormData({...formData, maxPerBill: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-pink-500 outline-hidden text-sm font-bold bg-white text-center"/>
                                    <span className="text-[10px] text-gray-500 mt-0.5 block text-center">(ลิมิตสูงสุด/บิล)</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase mb-1.5 block">รูปแบบการคำนวณของแถม <span className="text-rose-500">*</span></label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${formData.distributionMode === 'per_item' ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-pink-50/70 border-pink-300 text-pink-900'}`}>
                                    <input 
                                        type="radio" 
                                        name="distributionMode" 
                                        value="per_bill" 
                                        checked={formData.distributionMode !== 'per_item'} 
                                        onChange={e => setFormData({ ...formData, distributionMode: e.target.value })} 
                                        className="mt-0.5 accent-pink-600"
                                    />
                                    <div>
                                        <div className="text-xs font-bold">📦 แจกคงที่ต่อบิล (Per Bill)</div>
                                        <div className="text-[10px] opacity-75 mt-0.5">แจกจำนวนตามที่ระบุ 1 ชุดต่อบิล เมื่อตรงเงื่อนไข (ไม่คูณเพิ่มตามจำนวนที่ซื้อ)</div>
                                    </div>
                                </label>
                                <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${formData.distributionMode === 'per_item' ? 'bg-pink-50/70 border-pink-300 text-pink-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                                    <input 
                                        type="radio" 
                                        name="distributionMode" 
                                        value="per_item" 
                                        checked={formData.distributionMode === 'per_item'} 
                                        onChange={e => setFormData({ ...formData, distributionMode: e.target.value })} 
                                        className="mt-0.5 accent-pink-600"
                                    />
                                    <div>
                                        <div className="text-xs font-bold">🔢 แจกตามจำนวนสินค้า (Per Item)</div>
                                        <div className="text-[10px] opacity-75 mt-0.5">คูณจำนวนของแถมเพิ่มตามชิ้นสินค้าที่ซื้อ (เช่น ซื้อ 1 แถม 1, ซื้อ 5 แถม 5)</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">จำกัดเฉพาะสินค้า (SKU)</label>
                                <input type="text" placeholder="เช่น CASE-01, RAM-02 (ปล่อยว่าง = ไม่จำกัด)" value={formData.applicableSkus} onChange={e => setFormData({...formData, applicableSkus: e.target.value.toUpperCase()})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-hidden text-sm font-bold bg-white uppercase"/>
                            </div>
                            <div className="relative">
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">จำกัดเฉพาะหมวดหมู่ (TYPE)</label>
                                <div 
                                    className="w-full p-2.5 rounded-lg border border-gray-300 bg-white cursor-pointer flex justify-between items-center min-h-[42px]"
                                    onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                >
                                    <div className="text-sm font-bold text-gray-700 truncate pr-2">
                                        {formData.applicableTypes || <span className="text-gray-400 font-normal">ทั้งหมด (ไม่จำกัด)</span>}
                                    </div>
                                    <div className={`transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`}>▼</div>
                                </div>
                                
                                {isTypeDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsTypeDropdownOpen(false)}></div>
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto py-1 custom-scrollbar">
                                            {uniqueTypes.length === 0 ? (
                                                <div className="p-3 text-sm text-gray-500 text-center">ไม่พบหมวดหมู่</div>
                                            ) : (
                                                uniqueTypes.map(type => {
                                                    const isSelected = formData.applicableTypes?.split(',').map(t => t.trim()).includes(type);
                                                    return (
                                                        <div 
                                                            key={type} 
                                                            className="px-3 py-2 hover:bg-pink-50 cursor-pointer flex items-center gap-2"
                                                            onClick={() => handleTypeToggle(type)}
                                                        >
                                                            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${isSelected ? 'bg-pink-600 border-pink-600' : 'border-gray-300'}`}>
                                                                {isSelected && <span className="text-white text-xs">✓</span>}
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-700">{type}</span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* เงื่อนไขและข้อจำกัด */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4 shadow-xs">
                        <h3 className="text-sm font-black text-gray-800 border-b pb-2 mb-3">⚙️ เงื่อนไขการรับสิทธิ์</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">ยอดซื้อขั้นต่ำ (บาท)</label>
                                <div className="relative">
                                    <input type="number" min="0" placeholder="0 = แจกทุกบิล" value={formData.minSpend} onChange={e => setFormData({...formData, minSpend: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-pink-500 outline-hidden text-sm font-bold bg-white pr-10 text-right"/>
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">฿</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">จำนวนชิ้นขั้นต่ำ (ชิ้น)</label>
                                <div className="relative">
                                    <input type="number" min="0" placeholder="0 = ไม่มีขั้นต่ำ" value={formData.minQty} onChange={e => setFormData({...formData, minQty: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-pink-500 outline-hidden text-sm font-bold bg-white pr-10 text-right"/>
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">ชิ้น</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">กลุ่มลูกค้าเป้าหมาย</label>
                                <select value={formData.customerType} onChange={e => setFormData({...formData, customerType: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-pink-500 outline-hidden text-sm font-bold bg-white cursor-pointer">
                                    <option value="ALL">ลูกค้าทั้งหมด (All)</option>
                                    <option value="RETAIL">ลูกค้าปลีก/ทั่วไป (Retail)</option>
                                    <option value="WHOLESALE">ลูกค้าส่ง/ตัวแทน (Wholesale)</option>
                                    <option value="VIP">เฉพาะลูกค้า VIP เท่านั้น</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">วันที่เริ่ม (ปล่อยว่าง = เริ่มทันที)</label>
                                <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-pink-500 outline-hidden text-sm font-bold bg-white"/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">วันที่สิ้นสุด (ปล่อยว่าง = ไม่มีกำหนด)</label>
                                <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-pink-500 outline-hidden text-sm font-bold bg-white"/>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">จำกัดจำนวนสิทธิ์ทั้งหมด (ปล่อยว่าง = ไม่จำกัด)</label>
                            <div className="flex gap-4 items-center">
                                <input type="number" min="1" placeholder="เช่น 100 สิทธิ์" value={formData.quotaLimit} onChange={e => setFormData({...formData, quotaLimit: e.target.value})} className="w-1/2 p-2.5 rounded-lg border border-gray-300 focus:border-pink-500 outline-hidden text-sm font-bold bg-white"/>
                                {formData.id && formData.quotaLimit && (
                                    <span className="text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-lg border border-pink-200">
                                        ใช้ไปแล้ว {formData.quotaUsed || 0} / {formData.quotaLimit} สิทธิ์
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 shrink-0">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
                        <button type="submit" disabled={isProcessing} className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 flex items-center gap-2 transition-all disabled:opacity-50">
                            <Save size={18} /> {isProcessing ? 'กำลังบันทึก...' : 'บันทึกกฎของแถม'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
