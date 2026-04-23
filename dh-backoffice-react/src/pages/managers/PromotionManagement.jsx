import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Tag, Percent, Banknote, Calendar, AlertCircle, Save, X, Edit2, Trash2, Megaphone } from 'lucide-react';
import { auth } from '../../firebase/config';
import { promotionService } from '../../firebase/promotionService';

export default function PromotionManagement() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    description: '',
    type: 'PERCENTAGE', // PERCENTAGE, FIXED_AMOUNT
    value: '',
    minSpend: ''
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    const data = await promotionService.getAllPromotions();
    setPromotions(data);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ id: null, title: '', description: '', type: 'PERCENTAGE', value: '', minSpend: '' });
  };

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setFormData({
        id: promo.id,
        title: promo.title || '',
        description: promo.description || '',
        type: promo.type || 'PERCENTAGE',
        value: promo.value || '',
        minSpend: promo.minSpend || ''
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.value) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    
    setIsProcessing(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        value: Number(formData.value),
        minSpend: Number(formData.minSpend) || 0,
      };

      if (formData.id) {
        await promotionService.updatePromotion(formData.id, payload, auth.currentUser);
        alert('แก้ไขโปรโมชันสำเร็จ');
      } else {
        await promotionService.createPromotion(payload, auth.currentUser);
        alert('สร้างโปรโมชันใหม่สำเร็จ แจ้งเตือนพนักงานทุกคนแล้ว!');
      }
      setIsModalOpen(false);
      loadPromotions();
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await promotionService.updatePromotion(promo.id, { isActive: !promo.isActive }, auth.currentUser, promo.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน');
      loadPromotions();
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`ยืนยันการลบโปรโมชัน "${title}" ออกจากระบบถาวร ใช่หรือไม่?`)) return;
    try {
      await promotionService.deletePromotion(id, title, auth.currentUser);
      loadPromotions();
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <button onClick={() => navigate('/managers')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 mb-4 transition-colors">
            <ArrowLeft size={16} /> กลับไปหน้าผู้จัดการ (Managers Office)
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
            <Megaphone size={14} /> Promotion Center
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">จัดการโปรโมชั่น & ส่วนลด</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">สร้างแคมเปญกระตุ้นยอดขาย และกำหนดเงื่อนไขส่วนลดในบิลอัตโนมัติ</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-600/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
          <Plus size={20} strokeWidth={3} /> สร้างโปรโมชันใหม่
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold">แคมเปญ / รายละเอียด</th>
                <th className="px-6 py-4 font-bold text-center">ประเภทส่วนลด</th>
                <th className="px-6 py-4 font-bold text-center">เงื่อนไขขั้นต่ำ</th>
                <th className="px-6 py-4 font-bold text-center">สถานะ</th>
                <th className="px-6 py-4 font-bold text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400">กำลังโหลดข้อมูล...</td></tr>
              ) : promotions.length === 0 ? (
                <tr><td colSpan="5" className="p-12 text-center text-gray-400 flex flex-col items-center">
                  <Megaphone size={48} className="opacity-20 mb-3" />
                  <p className="text-lg font-bold text-gray-500">ยังไม่มีโปรโมชันในระบบ</p>
                </td></tr>
              ) : (
                promotions.map(promo => (
                  <tr key={promo.id} className="hover:bg-fuchsia-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                        {promo.title}
                        {promo.isActive && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">กำลังทำงาน</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">{promo.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${promo.type === 'PERCENTAGE' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {promo.type === 'PERCENTAGE' ? <Percent size={14}/> : <Banknote size={14}/>}
                        ลด {promo.value}{promo.type === 'PERCENTAGE' ? '%' : ' ฿'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 font-bold text-xs">
                      {promo.minSpend > 0 ? `ซื้อครบ ${(promo.minSpend).toLocaleString()} ฿` : 'ไม่มีขั้นต่ำ'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggleActive(promo)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 ${promo.isActive ? 'bg-fuchsia-600' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promo.isActive ? 'translate-x-6' : 'translate-x-1'}`}/>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(promo)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(promo.id, promo.title)} className="p-2 text-gray-400 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-fuchsia-50 to-pink-50">
              <h2 className="text-lg font-black text-fuchsia-900 flex items-center gap-2">
                <Megaphone className="text-fuchsia-600"/> {formData.id ? 'แก้ไขโปรโมชัน' : 'สร้างโปรโมชันใหม่'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-white hover:text-rose-500 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 bg-gray-50 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">ชื่อแคมเปญ / โปรโมชัน <span className="text-rose-500">*</span></label>
                <input type="text" required placeholder="เช่น ลดล้างสต๊อก, ช้อปดีมีคืน" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm font-bold bg-white"/>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">ประเภทส่วนลด <span className="text-rose-500">*</span></label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm font-bold bg-white cursor-pointer">
                    <option value="PERCENTAGE">ลดเป็นเปอร์เซ็นต์ (%)</option>
                    <option value="FIXED_AMOUNT">ลดเป็นเงินสด (฿)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">มูลค่าการลด <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input type="number" required min="0" step="0.01" placeholder="0" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm font-bold bg-white pr-10 text-right"/>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{formData.type === 'PERCENTAGE' ? '%' : '฿'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">ยอดซื้อขั้นต่ำ (ถ้ามี)</label>
                <div className="relative">
                  <input type="number" min="0" placeholder="0 (ไม่กำหนดขั้นต่ำ)" value={formData.minSpend} onChange={e => setFormData({...formData, minSpend: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm font-bold bg-white pr-10 text-right"/>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">฿</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">* ระบบในหน้า POS จะตรวจสอบยอดซื้อก่อนให้พนักงานกดใช้โปรโมชันนี้</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">รายละเอียดเพิ่มเติม / เงื่อนไข (แสดงให้พนักงานเห็น)</label>
                <textarea rows="2" placeholder="เช่น สงวนสิทธิ์เฉพาะลูกค้าหน้าร้าน" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none text-sm font-medium bg-white resize-none"/>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isProcessing} className="px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-600/20 flex items-center gap-2 transition-all disabled:opacity-50">
                  <Save size={18} /> {isProcessing ? 'กำลังบันทึก...' : 'บันทึกโปรโมชัน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}