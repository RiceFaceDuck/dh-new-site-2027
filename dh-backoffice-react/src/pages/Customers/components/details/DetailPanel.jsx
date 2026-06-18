import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Building2, User } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';

import ContactInfo from './ContactInfo';
import ShippingInfo from './ShippingInfo';
import TaxInfo from './TaxInfo';
import StatsInfo from './StatsInfo';
import HistoryInfo from './HistoryInfo';

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
          <ContactInfo customer={customer} />
          
          <ShippingInfo 
            getFormattedAddress={getFormattedAddress} 
            handleCopy={handleCopy} 
            copiedField={copiedField} 
          />

          <TaxInfo 
            isLoadingTax={isLoadingTax}
            secureTaxInfo={secureTaxInfo}
            handleCopy={handleCopy}
            copiedField={copiedField}
          />

          <StatsInfo 
            customer={customer} 
            formatCurrency={formatCurrency} 
          />

          <HistoryInfo 
            history={history}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />
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