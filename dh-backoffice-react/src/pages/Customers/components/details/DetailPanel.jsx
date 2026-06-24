import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Building2, User, Copy, Check } from 'lucide-react';
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

  // 🌟 Standardize Account ID (เพื่อให้หน้าตารางและหน้าต่างรายละเอียดตรงกัน 100%)
  const displayAccountId = customer.accountId || customer.customerCode || customer.id.substring(0,8).toUpperCase();

  // 🌟 ฟังก์ชันหาชื่อที่ถูกต้องที่สุดของลูกค้า (ให้ตรงกับตาราง CustomerRow)
  const resolveDisplayName = (c) => {
    if (c.storeName) return c.storeName;
    if (c.displayName) return c.displayName;
    if (c.accountName) return c.accountName;
    if (c.firstName) return `${c.firstName} ${c.lastName || ''}`.trim();
    if (c.email) return c.email.split('@')[0];
    if (c.phone || c.phoneNumber) return c.phone || c.phoneNumber;
    return 'ไม่มีชื่อร้าน/ผู้ใช้';
  };

  const displayName = resolveDisplayName(customer);

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-2xl">
      {/* 1. ส่วนหัว (Header & Actions) */}
      <div className="p-5 border-b border-slate-200 flex justify-between items-start bg-slate-50/80">
        <div className="min-w-0 pr-4">
          <h2 className="text-xl font-bold text-slate-800 truncate flex items-center gap-2" title={displayName}>
            {customer.role === 'partner' ? <Building2 className="w-5 h-5 text-indigo-600 shrink-0" /> : <User className="w-5 h-5 text-slate-400 shrink-0" />}
            <span className="truncate">{displayName}</span>
          </h2>
          <div className="flex items-center flex-wrap gap-2 mt-1.5">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              customer.role === 'partner' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {customer.role === 'partner' ? 'Partner' : 'Member'}
            </span>
            <button 
              onClick={() => handleCopy(displayAccountId, 'accountId')}
              title="คัดลอก Account ID"
              className={`flex items-center gap-1 text-[11px] font-mono tracking-wider px-1.5 py-0.5 rounded border transition-colors shrink-0 ${
                copiedField === 'accountId' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200'
              }`}
            >
              ID: {displayAccountId}
              {copiedField === 'accountId' ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="opacity-70" />}
            </button>
            
            {/* 🛡️ Data Sync Validation (Email as Key) */}
            {customer.email ? (
               <div title={`ผูกข้อมูลสำเร็จกับ: ${customer.email}`} className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-teal-50 text-teal-600 border border-teal-200 shrink-0 cursor-help">
                 <Check size={12} strokeWidth={3} />
                 <span>SYNCED (EMAIL)</span>
               </div>
            ) : (
               <div title="ไม่พบ Email หลักในการอ้างอิงข้อมูล" className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-rose-50 text-rose-600 border border-rose-200 shrink-0 cursor-help">
                 <X size={12} strokeWidth={3} />
                 <span>NO EMAIL SYNC</span>
               </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {/* Guide Documentation Button */}
          <div className="group relative">
            <button className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center border border-transparent hover:border-indigo-100">
              <span className="font-serif italic font-bold text-sm px-1">i</span>
            </button>
            {/* Tooltip Content (In-App Docs) */}
            <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-slate-900 text-white text-xs rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none group-hover:pointer-events-auto border border-slate-700">
              <h4 className="font-bold text-sm text-indigo-300 mb-2 border-b border-slate-700 pb-1">📚 ระบบจัดการ Account ID</h4>
              <p className="mb-2"><span className="text-emerald-400 font-semibold">ตำรา:</span> ระบบยึด Email เป็น Key หลัก หากลูกค้ามี Email ระบบจะแสดงป้าย <span className="text-teal-300">SYNCED</span> เพื่อยืนยันว่าข้อมูลตรงกันและปลอดภัย</p>
              <p className="mb-2"><span className="text-emerald-400 font-semibold">How-to:</span> คุณสามารถแก้ไข Account ID ได้โดยกดปุ่ม "แก้ไขข้อมูล" ด้านล่าง ระบบจะเช็คความซ้ำซ้อนให้อัตโนมัติ</p>
              <p className="mb-2"><span className="text-emerald-400 font-semibold">Tips:</span> ใช้ปุ่ม Generate ในหน้าแก้ไขเพื่อสุ่ม Account ID 8 หลักมาตรฐาน</p>
              <p><span className="text-emerald-400 font-semibold">Expected:</span> หากเปลี่ยนรหัสสำเร็จ History Log จะบันทึกการกระทำของคุณไว้ตรวจสอบย้อนหลังได้ 100%</p>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
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