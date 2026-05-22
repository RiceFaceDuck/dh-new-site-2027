import React, { useState, useEffect } from 'react';
import { 
  X, Edit2, Trash2, MapPin, Phone, Building2, 
  Mail, User, ShoppingBag, ShieldAlert, Loader2, 
  TrendingUp, Copy, CheckCircle2, FileText, Hash 
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';

export default function DetailPanel({
  customer,
  history,
  onClose,
  onEdit,
  onDelete
}) {
  if (!customer) return null;

  // State สำหรับเก็บข้อมูลภาษีความปลอดภัยสูง
  const [secureTaxInfo, setSecureTaxInfo] = useState(null);
  const [isLoadingTax, setIsLoadingTax] = useState(false);
  
  // State สำหรับแอนิเมชันปุ่ม Copy
  const [copiedField, setCopiedField] = useState(null);

  // 🕵️‍♂️ ดึงข้อมูลภาษีลับ เมื่อเปิดดูรายละเอียดลูกค้า
  useEffect(() => {
    const fetchSecureTaxData = async () => {
      if (!customer?.id) return;
      setIsLoadingTax(true);
      try {
        const taxRef = doc(db, 'users', customer.id, 'private', 'taxInfo');
        const snap = await getDoc(taxRef);
        if (snap.exists()) {
          setSecureTaxInfo(snap.data());
        } else {
          setSecureTaxInfo(null);
        }
      } catch (error) {
        console.error("Error fetching secure tax info:", error);
      } finally {
        setIsLoadingTax(false);
      }
    };

    fetchSecureTaxData();
  }, [customer?.id]);

  // Utility functions สำหรับฟอร์แมตข้อมูล
  const formatCurrency = (num) => Number(num || 0).toLocaleString('th-TH');
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = typeof timestamp === 'number' ? new Date(timestamp) : (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));
    return date.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' });
  };

  // 🏡 Smart Address Decoder (แปลง Object เป็น String)
  const getFormattedAddress = () => {
    const addr = customer.address || customer.defaultDeliveryNote;
    if (!addr) return 'ไม่ได้ระบุข้อมูลที่อยู่';
    if (typeof addr === 'string') return addr;
    
    const parts = [addr.addressLine, addr.subDistrict, addr.district, addr.province, addr.zipCode].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'ไม่ได้ระบุข้อมูลที่อยู่';
  };

  // 📋 ฟังก์ชันคัดลอกข้อความ
  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-2xl">
      {/* 1. ส่วนหัว (Header & Actions) */}
      <div className="p-5 border-b border-slate-200 flex justify-between items-start bg-slate-50/80">
        <div className="min-w-0 pr-4">
          <h2 className="text-xl font-bold text-slate-800 truncate flex items-center gap-2">
            {customer.role === 'partner' ? <Building2 className="w-5 h-5 text-indigo-600" /> : <User className="w-5 h-5 text-slate-400" />}
            {customer.accountName || customer.displayName || 'ไม่มีชื่อร้าน/ผู้ใช้'}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              customer.role === 'partner' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {customer.role === 'partner' ? 'Partner' : 'Member'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono tracking-wider bg-white border border-slate-200 px-1.5 py-0.5 rounded">
              ID: {customer.id.substring(0,8)}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors shrink-0">
          <X size={20} />
        </button>
      </div>

      {/* 2. เนื้อหาหลัก (Scrollable Content) */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-6">
          
          {/* ข้อมูลการติดต่อ (Contact Info) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> ข้อมูลติดต่อ
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 font-semibold mb-1 flex items-center gap-1.5"><Phone size={12}/> เบอร์โทรศัพท์</p>
                <p className="text-sm font-bold text-slate-800">{customer.phoneNumber || customer.phone || '-'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 font-semibold mb-1 flex items-center gap-1.5"><Mail size={12}/> อีเมล</p>
                <p className="text-sm font-bold text-slate-800 truncate" title={customer.email}>{customer.email || '-'}</p>
              </div>
            </div>
          </div>

          {/* ข้อมูลจัดส่ง (Shipping Address) - รองรับ 1-Click Copy */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ข้อมูลจัดส่งสินค้า
            </h3>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 relative group">
              <p className="text-[10px] text-emerald-600 font-bold mb-1.5 flex items-center gap-1.5">
                <MapPin size={12}/> ที่อยู่เริ่มต้น
              </p>
              <p className="text-sm text-slate-700 leading-relaxed pr-8">{getFormattedAddress()}</p>
              
              <button 
                onClick={() => handleCopy(getFormattedAddress(), 'address')}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-emerald-600 bg-white shadow-sm border border-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="คัดลอกที่อยู่"
              >
                {copiedField === 'address' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* 🛡️ ข้อมูลผู้เสียภาษี (Private Tax Info) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> ข้อมูลภาษี (Tax Info)
            </h3>
            
            {isLoadingTax ? (
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
                <span className="text-xs font-medium">กำลังดึงข้อมูลความปลอดภัย...</span>
              </div>
            ) : secureTaxInfo ? (
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3 relative group">
                <div>
                  <p className="text-[10px] text-indigo-600 font-bold mb-1 flex items-center gap-1.5">
                    {secureTaxInfo.type === 'company' ? <Building2 size={12}/> : <User size={12}/>} 
                    {secureTaxInfo.type === 'company' ? 'นิติบุคคล' : 'บุคคลธรรมดา'}
                  </p>
                  <p className="text-sm font-bold text-slate-800 pr-8">{secureTaxInfo.name}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold mb-0.5">เลขประจำตัวผู้เสียภาษี</p>
                    <p className="text-sm font-mono font-bold text-slate-700 tracking-widest">{secureTaxInfo.taxId}</p>
                  </div>
                  {secureTaxInfo.type === 'company' && (
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-semibold mb-0.5">สาขา</p>
                      <p className="text-xs font-bold text-slate-700 bg-white border border-indigo-100 px-2 py-0.5 rounded">
                        {secureTaxInfo.isHeadOffice ? 'สำนักงานใหญ่' : `สาขา ${secureTaxInfo.branchCode}`}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-indigo-100/50">
                  <p className="text-[10px] text-slate-500 font-semibold mb-0.5">ที่อยู่ออกใบกำกับภาษี</p>
                  <p className="text-xs text-slate-600 leading-relaxed pr-8">{secureTaxInfo.address}</p>
                </div>

                <button 
                  onClick={() => handleCopy(`${secureTaxInfo.name} | เลขผู้เสียภาษี: ${secureTaxInfo.taxId} | ${secureTaxInfo.isHeadOffice ? 'สำนักงานใหญ่' : `สาขา ${secureTaxInfo.branchCode}`} | ที่อยู่: ${secureTaxInfo.address}`, 'tax')}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-indigo-600 bg-white shadow-sm border border-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="คัดลอกข้อมูลภาษีทั้งหมด"
                >
                  {copiedField === 'tax' ? <CheckCircle2 size={16} className="text-indigo-500" /> : <Copy size={16} />}
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 border-dashed flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-6 h-6 mb-2 opacity-50" />
                <span className="text-xs font-medium">ลูกค้ายังไม่ได้ระบุข้อมูลภาษี</span>
              </div>
            )}
          </div>

          {/* สถิติการใช้งาน (Overview Stats) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
             <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                <p className="text-[10px] text-amber-600 font-bold mb-1 flex items-center gap-1.5">
                  <TrendingUp size={12}/> เครดิตพอยต์ (Point)
                </p>
                <p className="text-lg font-black font-mono text-amber-600">
                  {formatCurrency(customer.creditPoint || customer.creditPoints || customer.stats?.creditBalance || 0)}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 font-bold mb-1 flex items-center gap-1.5">
                  <ShoppingBag size={12}/> ยอดสั่งซื้อรวม
                </p>
                <p className="text-lg font-black font-mono text-slate-700">
                  {formatCurrency(customer.stats?.totalOrders || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* ประวัติย้อนหลัง (History Preview) คงของเดิมไว้ตามคำสั่ง */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
             {/* รายการสั่งซื้อ (Orders) */}
             {history?.orders?.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-3">
                    <ShoppingBag size={14} /> ประวัติสั่งซื้อล่าสุด
                  </h4>
                  {history.orders.slice(0, 3).map(order => (
                    <div key={order.id} className="p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center mb-2 shadow-sm">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">#{order.id.substring(0,8).toUpperCase()}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-indigo-600 block">฿{formatCurrency(order.totals?.netTotal)}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{order.status}</span>
                      </div>
                    </div>
                  ))}
                  {history.orders.length > 3 && (
                    <button className="w-full text-center text-[11px] text-indigo-600 hover:text-indigo-800 font-bold py-2 bg-indigo-50/50 rounded-lg mt-1 transition-colors">
                      ดูประวัติทั้งหมด ({history.orders.length})
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-xs font-medium text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  ยังไม่มีประวัติการสั่งซื้อ
                </div>
              )}

              {/* รายการเคลม (Claims) */}
              {history?.claims?.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-rose-500 flex items-center gap-1.5 mb-3">
                    <ShieldAlert size={14} /> ประวัติการเคลมสินค้า
                  </h4>
                  {history.claims.slice(0, 2).map(claim => (
                    <div key={claim.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex justify-between items-center text-xs mb-2">
                      <span className="font-bold text-rose-700">เคลม #{claim.claimId || claim.id.substring(0,8)}</span>
                      <span className="font-bold bg-white text-rose-600 px-2 py-0.5 rounded shadow-sm border border-rose-100/50">
                        {claim.status || 'รอดำเนินการ'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
          </div>

        </div>
      </div>

      {/* 3. ส่วนท้าย (Actions) */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex gap-3 shrink-0">
        <button 
          onClick={onDelete} 
          className="px-4 py-2.5 bg-white text-rose-600 hover:bg-rose-50 border border-rose-100 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors flex-1 justify-center shadow-sm"
        >
          <Trash2 size={16} /> ลบลูกค้า
        </button>
        <button 
          onClick={onEdit} 
          className="px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors flex-1 justify-center shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Edit2 size={16} /> แก้ไขข้อมูล
        </button>
      </div>
    </div>
  );
}