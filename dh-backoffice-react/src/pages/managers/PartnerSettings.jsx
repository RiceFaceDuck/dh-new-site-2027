import React, { useState, useEffect } from 'react';
import { Store, Search, Filter, Loader2, MapPin, CheckCircle2, XCircle, ExternalLink, Mail, User } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function PartnerSettings() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [actionLoading, setActionLoading] = useState(null);

  // 📡 ดึงข้อมูล Partner ทั้งหมด
  const fetchPartners = async () => {
    setLoading(true);
    try {
      const partnersRef = collection(db, 'artifacts', appId, 'public', 'data', 'partners');
      const snapshot = await getDocs(partnersRef);
      
      const fetchedPartners = snapshot.docs.map(doc => ({
        id: doc.id, // UID ของลูกค้า
        ...doc.data()
      }));
      
      setPartners(fetchedPartners);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // 🔍 กรองข้อมูลตาม Search และ Filter
  const filteredPartners = partners.filter(p => {
    const matchesSearch = 
      (p.storeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.contactEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'all' ? true : 
      statusFilter === 'active' ? p.isActive === true : 
      p.isActive === false;
      
    return matchesSearch && matchesStatus;
  });

  // ⚙️ อัปเดตสถานะ Partner (ระงับ/เปิดใช้งาน)
  const togglePartnerStatus = async (partnerId, currentStatus) => {
    if (!window.confirm(`คุณต้องการ ${currentStatus ? 'ระงับ' : 'เปิดใช้งาน'} พาร์ทเนอร์รายนี้ใช่หรือไม่?`)) return;
    
    setActionLoading(partnerId);
    try {
      const newStatus = !currentStatus;
      const partnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'partners', partnerId);
      
      await updateDoc(partnerRef, {
        isActive: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      // อัปเดต UI ทันที
      setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, isActive: newStatus } : p));
      
    } catch (error) {
      console.error("Error updating partner status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Store className="text-[#0870B8]" />
            จัดการตัวแทนพาร์ทเนอร์ (Partner Directory)
          </h1>
          <p className="text-sm text-slate-500 mt-1">ดูรายชื่อและบริหารจัดการร้านค้าพาร์ทเนอร์ที่เปิดรับการสนับสนุน</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-center px-3 border-r border-slate-100">
             <div className="text-lg font-black text-[#0870B8]">{partners.length}</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ทั้งหมด</div>
           </div>
           <div className="text-center px-3">
             <div className="text-lg font-black text-emerald-500">{partners.filter(p => p.isActive).length}</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เปิดใช้งาน</div>
           </div>
        </div>
      </div>

      {/* ควบคุม (Tabs & Search) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col lg:flex-row justify-between items-center gap-4">
        
        {/* Search */}
        <div className="relative w-full lg:w-1/3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="ค้นหาชื่อร้าน, ชื่อคนติดต่อ, อีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0870B8]/50 text-sm font-medium"
          />
        </div>

        {/* Filter */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full lg:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 lg:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all ${
              statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`flex-1 lg:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all ${
              statusFilter === 'active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ออนไลน์
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`flex-1 lg:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all ${
              statusFilter === 'inactive' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ถูกระงับ
          </button>
        </div>
      </div>

      {/* รายการพาร์ทเนอร์ */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-[#0870B8] w-8 h-8 mb-4" />
          <span className="text-slate-500 font-bold tracking-widest uppercase font-tech">Loading Directory...</span>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <Filter className="text-slate-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">ไม่พบข้อมูลพาร์ทเนอร์</h3>
          <p className="text-slate-500 mt-1 text-sm">ไม่มีพาร์ทเนอร์ที่ตรงกับเงื่อนไขการค้นหาของคุณ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <div key={partner.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-md ${
              partner.isActive ? 'border-[#0870B8]/30' : 'border-rose-200 opacity-80'
            }`}>
              
              {/* Header */}
              <div className={`px-5 py-4 border-b flex items-center justify-between ${partner.isActive ? 'bg-[#f8fbff] border-[#E6F0F9]' : 'bg-rose-50 border-rose-100'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${partner.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${partner.isActive ? 'text-[#0870B8]' : 'text-rose-600'}`}>
                    {partner.isActive ? 'ONLINE' : 'SUSPENDED'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-tech">ID: {partner.id.substring(0, 8)}...</div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex gap-4 items-start mb-4">
                   <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 p-1">
                     <img src={partner.storeLogo || '/logo.png'} alt="logo" className="w-full h-full object-contain" onError={(e)=>{e.target.src='https://placehold.co/100x100?text=Logo'}} />
                   </div>
                   <div className="min-w-0">
                     <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{partner.storeName || 'ไม่ระบุชื่อร้าน'}</h3>
                     <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                       <User size={12}/> {partner.contactName || 'ไม่ระบุชื่อผู้ติดต่อ'}
                     </p>
                     <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                       <Mail size={12}/> {partner.contactEmail || 'ไม่มีอีเมล'}
                     </p>
                   </div>
                </div>

                {/* แผนที่และบริการ */}
                <div className="space-y-3 mt-auto">
                   {partner.mapsUrl && (
                     <button 
                       onClick={() => window.open(partner.mapsUrl, '_blank')}
                       className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 flex items-center justify-between transition-colors group-hover:border-[#0870B8]/30"
                     >
                       <span className="flex items-center gap-1.5 truncate"><MapPin size={14} className="text-[#0870B8]" /> ตรวจสอบพิกัดแผนที่</span>
                       <ExternalLink size={14} className="text-slate-400" />
                     </button>
                   )}
                   
                   {partner.services && (
                     <div className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-lg">
                       <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">รายละเอียดบริการ</p>
                       <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{partner.services}</p>
                     </div>
                   )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => togglePartnerStatus(partner.id, partner.isActive)}
                  disabled={actionLoading === partner.id}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    partner.isActive 
                    ? 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md'
                  }`}
                >
                  {actionLoading === partner.id ? <Loader2 size={14} className="animate-spin" /> : (partner.isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />)}
                  {partner.isActive ? 'ระงับพาร์ทเนอร์' : 'เปิดใช้งานอีกครั้ง'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}