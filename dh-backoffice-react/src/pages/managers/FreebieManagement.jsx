import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Gift, Save, X, Edit2, Trash2 } from 'lucide-react';
import { auth } from '../../firebase/config';
import { freebieService } from '../../firebase/freebieService';

export default function FreebieManagement() {
  const navigate = useNavigate();
  const [freebies, setFreebies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    id: null, title: '', itemName: '', qty: 1, minSpend: ''
  });

  useEffect(() => { loadFreebies(); }, []);

  const loadFreebies = async () => {
    setLoading(true);
    const data = await freebieService.getAllFreebies();
    setFreebies(data);
    setLoading(false);
  };

  const resetForm = () => setFormData({ id: null, title: '', itemName: '', qty: 1, minSpend: '' });

  const handleOpenModal = (item = null) => {
    if (item) setFormData({ id: item.id, title: item.title, itemName: item.itemName, qty: item.qty, minSpend: item.minSpend });
    else resetForm();
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.itemName || !formData.qty) return alert("กรุณากรอกข้อมูลให้ครบ");
    setIsProcessing(true);
    try {
      const payload = {
        title: formData.title,
        itemName: formData.itemName,
        qty: Number(formData.qty),
        minSpend: Number(formData.minSpend) || 0,
      };
      if (formData.id) await freebieService.updateFreebie(formData.id, payload, auth.currentUser);
      else await freebieService.createFreebie(payload, auth.currentUser);
      setIsModalOpen(false);
      loadFreebies();
    } catch (error) { alert("Error: " + error.message); } finally { setIsProcessing(false); }
  };

  const handleToggleActive = async (item) => {
    await freebieService.updateFreebie(item.id, { isActive: !item.isActive }, auth.currentUser, item.isActive ? 'ปิด' : 'เปิด');
    loadFreebies();
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`ยืนยันการลบกฎของแถม "${title}"?`)) return;
    await freebieService.deleteFreebie(id, title, auth.currentUser);
    loadFreebies();
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <button onClick={() => navigate('/managers')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 mb-4 transition-colors">
            <ArrowLeft size={16} /> กลับศูนย์ควบคุม
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
            <Gift size={14} /> Freebie Rules
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">ตั้งค่ากฎของแถม</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">กำหนดเงื่อนไขยอดซื้อขั้นต่ำ เพื่อแจกสินค้าฟรีในบิลอัตโนมัติ</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 flex items-center gap-2">
          <Plus size={20} strokeWidth={3} /> สร้างกฎของแถมใหม่
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4 font-bold">ชื่อแคมเปญ</th>
              <th className="px-6 py-4 font-bold">ของที่จะแถม</th>
              <th className="px-6 py-4 font-bold text-center">ยอดซื้อขั้นต่ำ</th>
              <th className="px-6 py-4 font-bold text-center">สถานะ</th>
              <th className="px-6 py-4 font-bold text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan="5" className="p-8 text-center text-gray-400">โหลดข้อมูล...</td></tr> : 
              freebies.map(item => (
                <tr key={item.id} className="hover:bg-pink-50/30 group">
                  <td className="px-6 py-4 font-bold text-gray-900">{item.title}</td>
                  <td className="px-6 py-4"><span className="text-pink-600 font-bold bg-pink-50 px-2 py-1 rounded">{item.itemName} (x{item.qty})</span></td>
                  <td className="px-6 py-4 text-center font-bold text-gray-600">{item.minSpend > 0 ? `${item.minSpend.toLocaleString()} ฿` : 'แจกทุกบิล'}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleToggleActive(item)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.isActive ? 'bg-pink-600' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(item.id, item.title)} className="p-2 text-gray-400 hover:text-rose-600"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b bg-pink-50 flex justify-between items-center">
              <h2 className="text-lg font-black text-pink-900 flex items-center gap-2"><Gift/> {formData.id ? 'แก้ไข' : 'สร้าง'}กฎของแถม</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-rose-500 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 bg-gray-50 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">ชื่อแคมเปญ <span className="text-rose-500">*</span></label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 focus:border-pink-500 outline-none text-sm font-bold"/>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">ชื่อสินค้าที่แถม <span className="text-rose-500">*</span></label>
                  <input type="text" required value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 focus:border-pink-500 outline-none text-sm font-bold"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">จำนวน <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 focus:border-pink-500 outline-none text-sm font-bold text-center"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">ยอดซื้อขั้นต่ำ (บาท)</label>
                <input type="number" min="0" value={formData.minSpend} onChange={e => setFormData({...formData, minSpend: e.target.value})} placeholder="0 = แจกทุกบิล" className="w-full p-3 rounded-xl border border-gray-300 focus:border-pink-500 outline-none text-sm font-bold"/>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-gray-100 font-bold rounded-xl">ยกเลิก</button>
                <button type="submit" disabled={isProcessing} className="px-6 py-2.5 bg-pink-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"><Save size={18}/> บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}