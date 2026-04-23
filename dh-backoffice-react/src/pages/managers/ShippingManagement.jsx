import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Truck, Plus, Save, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ShippingManagement() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    company: 'Kerry',
    productType: 'All',
    minQty: 1,
    maxQty: 5,
    shippingFee: 50,
    isActive: true
  });

  const companies = ['Kerry Express', 'J&T Express', 'Flash Express', 'EMS', 'Lalamove', 'ผู้ขายจัดส่งเอง'];
  const productTypes = ['All', 'Notebook', 'Spare Parts', 'Accessories'];

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const snap = await getDocs(collection(db, 'shipping_rules'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort: Active first, then ascending by minQty
      data.sort((a, b) => (b.isActive - a.isActive) || (a.minQty - b.minQty));
      setRules(data);
    } catch (e) {
      console.error(e);
      alert("โหลดข้อมูลผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (form.minQty > form.maxQty) return alert("จำนวนต่ำสุดต้องไม่มากกว่าจำนวนสูงสุด");
    
    try {
      await addDoc(collection(db, 'shipping_rules'), {
        ...form,
        minQty: Number(form.minQty),
        maxQty: Number(form.maxQty),
        shippingFee: Number(form.shippingFee),
        updatedAt: serverTimestamp()
      });
      alert('บันทึกเงื่อนไขจัดส่งสำเร็จ');
      fetchRules();
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const toggleActive = async (ruleId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'shipping_rules', ruleId), { isActive: !currentStatus });
      fetchRules();
    } catch (error) {
      alert("อัปเดตสถานะล้มเหลว");
    }
  };

  const deleteRule = async (ruleId) => {
    if(!window.confirm("ยืนยันการลบเงื่อนไขนี้?")) return;
    try {
      await deleteDoc(doc(db, 'shipping_rules', ruleId));
      fetchRules();
    } catch(e) {
      alert("ลบล้มเหลว");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div className="bg-[var(--dh-bg-surface)] p-6 rounded-2xl shadow-sm border border-[var(--dh-border)] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[var(--dh-text-main)] flex items-center gap-2">
            <Truck className="text-emerald-500" /> จัดการเงื่อนไขค่าจัดส่ง (Shipping Rules)
          </h2>
          <p className="text-sm text-[var(--dh-text-muted)] mt-1 font-bold">
            ตั้งค่าเรทราคาจัดส่งอัตโนมัติ เพื่อให้หน้า To-do ประเมินราคาได้ทันที
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ฟอร์มเพิ่มกฎการจัดส่ง */}
        <div className="md:col-span-1 bg-[var(--dh-bg-surface)] rounded-2xl shadow-sm border border-[var(--dh-border)] overflow-hidden h-max">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 border-b border-[var(--dh-border)]">
             <h3 className="font-black text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2"><Plus size={16}/> เพิ่มเงื่อนไขใหม่</h3>
          </div>
          <form onSubmit={handleSaveRule} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--dh-text-muted)] mb-1">บริษัทขนส่ง</label>
              <select value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-lg px-3 py-2 text-sm font-bold text-[var(--dh-text-main)] outline-none focus:border-emerald-500">
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dh-text-muted)] mb-1">บังคับใช้กับประเภทสินค้า</label>
              <select value={form.productType} onChange={e => setForm({...form, productType: e.target.value})} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-lg px-3 py-2 text-sm font-bold text-[var(--dh-text-main)] outline-none focus:border-emerald-500">
                {productTypes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-[var(--dh-text-muted)] mb-1">จำนวนชิ้น (ต่ำสุด)</label>
                  <input type="number" min="1" value={form.minQty} onChange={e => setForm({...form, minQty: e.target.value})} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-lg px-3 py-2 text-sm font-bold text-[var(--dh-text-main)] outline-none focus:border-emerald-500" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-[var(--dh-text-muted)] mb-1">จำนวนชิ้น (สูงสุด)</label>
                  <input type="number" min="1" value={form.maxQty} onChange={e => setForm({...form, maxQty: e.target.value})} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-lg px-3 py-2 text-sm font-bold text-[var(--dh-text-main)] outline-none focus:border-emerald-500" />
               </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--dh-text-muted)] mb-1">ค่าจัดส่ง (บาท)</label>
              <input type="number" min="0" value={form.shippingFee} onChange={e => setForm({...form, shippingFee: e.target.value})} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-lg px-3 py-2 text-sm font-black text-emerald-600 outline-none focus:border-emerald-500" />
            </div>
            
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2">
              <Save size={16} /> บันทึกเงื่อนไข
            </button>
          </form>
        </div>

        {/* รายการกฎการจัดส่งปัจจุบัน */}
        <div className="md:col-span-2 bg-[var(--dh-bg-surface)] rounded-2xl shadow-sm border border-[var(--dh-border)] overflow-hidden">
           <div className="p-4 border-b border-[var(--dh-border)] bg-[var(--dh-bg-base)]">
              <h3 className="font-black text-[var(--dh-text-main)] text-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" /> เงื่อนไขที่ทำงานอยู่ (Active Rules)
              </h3>
           </div>
           <div className="p-0 overflow-x-auto">
             {loading ? (
               <div className="p-10 text-center text-[var(--dh-text-muted)] text-sm font-bold">กำลังโหลดข้อมูล...</div>
             ) : rules.length === 0 ? (
               <div className="p-10 text-center">
                 <AlertCircle size={32} className="mx-auto text-[var(--dh-border)] mb-2"/>
                 <p className="text-[var(--dh-text-muted)] text-sm font-bold">ยังไม่ได้ตั้งค่าการจัดส่ง</p>
               </div>
             ) : (
               <table className="w-full text-left">
                 <thead className="bg-[var(--dh-bg-base)] text-[var(--dh-text-muted)] text-[10px] uppercase font-black">
                   <tr>
                     <th className="px-4 py-3">บริษัท / ประเภท</th>
                     <th className="px-4 py-3 text-center">จำนวนชิ้น</th>
                     <th className="px-4 py-3 text-right">ค่าส่ง (฿)</th>
                     <th className="px-4 py-3 text-center">สถานะ</th>
                     <th className="px-4 py-3 text-center">ลบ</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--dh-border)] text-sm">
                   {rules.map(rule => (
                     <tr key={rule.id} className={!rule.isActive ? 'opacity-50 bg-[var(--dh-bg-base)]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}>
                       <td className="px-4 py-3">
                         <div className="font-black text-[var(--dh-text-main)]">{rule.company}</div>
                         <div className="text-[10px] text-[var(--dh-text-muted)] font-bold">{rule.productType}</div>
                       </td>
                       <td className="px-4 py-3 text-center font-bold text-[var(--dh-text-muted)]">
                         {rule.minQty} - {rule.maxQty} ชิ้น
                       </td>
                       <td className="px-4 py-3 text-right font-black text-emerald-600">
                         {rule.shippingFee}
                       </td>
                       <td className="px-4 py-3 text-center">
                         <button 
                            onClick={() => toggleActive(rule.id, rule.isActive)}
                            className={`px-2 py-1 text-[10px] font-black rounded-md ${rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
                         >
                           {rule.isActive ? 'เปิดใช้' : 'ปิด'}
                         </button>
                       </td>
                       <td className="px-4 py-3 text-center">
                         <button onClick={() => deleteRule(rule.id)} className="text-[var(--dh-text-muted)] hover:text-rose-500 p-1">
                           <Trash2 size={16}/>
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}