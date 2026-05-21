import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import { 
  Search, Users, MoreVertical, ArrowRightLeft, 
  CheckCircle2, XCircle, Loader2
} from 'lucide-react';

export default function PartnerCreditsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูลลูกค้า/พาร์ทเนอร์แบบ Realtime
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      const data = [];
      snap.forEach(doc => {
        const d = doc.data();
        const bal = Number(d.credit || d.creditBalance || 0);
        // โชว์คนที่เป็นพาร์ทเนอร์ หรือมีเครดิตค้างอยู่
        if (d.role === 'partner' || bal > 0) {
          data.push({
            id: doc.id,
            name: d.firstName ? `${d.firstName} ${d.lastName || ''}` : 'ไม่ระบุชื่อ',
            phone: d.phone || '-',
            balance: bal,
            status: d.status || 'active',
            lastActive: 'อยู่ในระบบ'
          });
        }
      });
      setPartners(data);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  return (
    // นำ h-full ออกเพื่อให้ไหลตามหน้าจออิสระ
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            Partner Ledger (สรุปยอดพาร์ทเนอร์)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            ฐานข้อมูล Realtime เชื่อมต่อกับ Firebase โดยตรง
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="ค้นหา ชื่อ, ID, เบอร์โทร..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* บล็อคความสูงของตารางไว้ที่ max-h-[60vh] และใส่ overflow-y-auto เพื่อให้ตารางเลื่อนได้ในตัว */}
      <div className="w-full overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <th className="px-5 py-3 font-semibold">พาร์ทเนอร์</th>
              <th className="px-5 py-3 font-semibold text-right">ยอดเครดิตคงเหลือ</th>
              <th className="px-5 py-3 font-semibold text-center">สถานะ</th>
              <th className="px-5 py-3 font-semibold text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="px-5 py-12 text-center text-slate-400">
                  <Loader2 size={32} className="mx-auto text-blue-400 mb-3 animate-spin" />
                  <p className="text-sm">กำลังซิงค์ข้อมูลบัญชี...</p>
                </td>
              </tr>
            ) : filteredPartners.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-5 py-12 text-center text-slate-400">
                  <Search size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm">ไม่พบพาร์ทเนอร์ในระบบ</p>
                </td>
              </tr>
            ) : (
              filteredPartners.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
                        {partner.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{partner.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{partner.id} • {partner.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="font-black text-slate-800 text-base">
                      ฿{partner.balance.toLocaleString('th-TH')}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                      ${partner.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}
                    >
                      {partner.status === 'active' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {partner.status === 'active' ? 'Active' : 'Suspended'}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold">
                        <ArrowRightLeft size={14} />
                        <span className="hidden sm:inline-block">ปรับยอด</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}