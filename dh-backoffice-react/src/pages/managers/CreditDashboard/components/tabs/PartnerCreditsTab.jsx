import React, { useState } from 'react';
import { 
  Search, Users, MoreVertical, ArrowRightLeft, 
  ShieldAlert, CheckCircle2, XCircle
} from 'lucide-react';

export default function PartnerCreditsTab() {
  const [searchTerm, setSearchTerm] = useState('');

  // ข้อมูลจำลอง (Mock Data) สำหรับรายชื่อพาร์ทเนอร์และยอดเครดิต
  const mockPartners = [
    {
      id: 'P-9921',
      name: 'สมชาย การค้า',
      phone: '081-234-5678',
      balance: 15000,
      status: 'active',
      lastActive: '10 นาทีที่แล้ว'
    },
    {
      id: 'P-1054',
      name: 'ร้านเจ๊น้อย',
      phone: '089-876-5432',
      balance: 8500,
      status: 'active',
      lastActive: '2 ชั่วโมงที่แล้ว'
    },
    {
      id: 'P-8842',
      name: 'เฮียชัย ขนส่ง',
      phone: '082-111-2222',
      balance: 22000,
      status: 'suspended',
      lastActive: '3 วันที่แล้ว'
    },
    {
      id: 'P-4431',
      name: 'บริษัท เอบีซี จำกัด',
      phone: '02-333-4444',
      balance: 550000,
      status: 'active',
      lastActive: 'เพิ่งใช้งาน'
    }
  ];

  // กรองข้อมูลพาร์ทเนอร์
  const filteredPartners = mockPartners.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      
      {/* Header & Search */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            Partner Ledger (สรุปยอดพาร์ทเนอร์)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจสอบยอดคงเหลือและสถานะบัญชีของพาร์ทเนอร์ทั้งหมด
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

      {/* Partner Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <th className="px-5 py-3 font-semibold">พาร์ทเนอร์</th>
              <th className="px-5 py-3 font-semibold text-right">ยอดเครดิตคงเหลือ</th>
              <th className="px-5 py-3 font-semibold text-center">สถานะ</th>
              <th className="px-5 py-3 font-semibold">ใช้งานล่าสุด</th>
              <th className="px-5 py-3 font-semibold text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* 👇 แก้ไขตรงนี้: ลบคำว่า filteredTransactions = ออกไป */}
            {filteredPartners.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-5 py-12 text-center text-slate-400">
                  <Search size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm">ไม่พบพาร์ทเนอร์ที่ตรงกับคำค้นหา</p>
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
                    <div className="font-black text-slate-800">
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
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-slate-500">{partner.lastActive}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                        title="ปรับเครดิต"
                      >
                        <ArrowRightLeft size={14} />
                        <span className="hidden sm:inline-block">ปรับยอด</span>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical size={16} />
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