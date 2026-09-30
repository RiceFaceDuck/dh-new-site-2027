import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Building2, User, Copy, Check, TrendingUp, Sparkles } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';

import ContactInfo from './ContactInfo';
import ShippingInfo from './ShippingInfo';
import TaxInfo from './TaxInfo';
import HistoryInfo from './HistoryInfo';
import MarketingInfo from './MarketingInfo';
import CustomerSyncModal from './CustomerSyncModal';
import CustomerRefundModal from '../../../../components/customers/CustomerRefundModal';
import WalletDisplay from '../displays/WalletDisplay';
import PointDisplay from '../displays/PointDisplay';
import { getCollectionPath, formatDate, formatCurrency } from 'dh-shared';

import { getUserTier } from '../../../../firebase/credit/creditFormatService';

export default function DetailPanel({
  customer,
  history,
  onClose,
  onEdit,
  onDelete
}) {

  // State สำหรับเก็บข้อมูลภาษีความปลอดภัยสูง
  const [secureTaxInfo, setSecureTaxInfo] = useState(null);
  const [isLoadingTax, setIsLoadingTax] = useState(false);
  
  // State สำหรับแอนิเมชันปุ่ม Copy
  const [copiedField, setCopiedField] = useState(null);

  // State สำหรับ Modal โอนย้ายบัญชี
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  // State สำหรับ Modal โอนเงินคืน/จ่ายเงินสด
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // State สำหรับจัดการ Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // รีเซ็ตแท็บเมื่อเปลี่ยนลูกค้า
  useEffect(() => {
    setActiveTab('overview');
  }, [customer?.id]);

  // 🕵️‍♂️ ดึงข้อมูลภาษีลับ เมื่อเปิดดูรายละเอียดลูกค้า
  useEffect(() => {
    const fetchSecureTaxData = async () => {
      if (!customer?.id) return;
      setIsLoadingTax(true);
      try {
        const taxRef = doc(db, getCollectionPath('users'), customer.id, 'private', 'taxInfo');
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

  if (!customer) return null;



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
      {/* 1. ส่วนหัวธีมมืด Dark Slate (Header & Actions) */}
      <div className="p-3.5 sm:p-4 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white tracking-tight truncate" title={displayName}>
            {displayName}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={() => onEdit(customer)} 
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors border border-slate-700/60 active:scale-95" 
              title="แก้ไขข้อมูล"
            >
              <Edit2 size={13} />
            </button>
            <button 
              onClick={onDelete} 
              className="p-1 text-slate-300 hover:text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors border border-slate-700/60 active:scale-95" 
              title="ลบลูกค้า"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* แถวแสดง Badges */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs text-slate-300">
          {/* Badge ID */}
          <div className="inline-flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700 text-[11px] shrink-0">
            <span className="text-slate-400">ID:</span>
            <span className="font-mono text-slate-100 font-semibold">{displayAccountId}</span>
            <button 
              onClick={() => handleCopy(displayAccountId, 'accountId')}
              className="hover:text-white transition-colors ml-0.5 text-slate-400"
              title="คัดลอกรหัสบัญชี"
            >
              {copiedField === 'accountId' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            </button>
          </div>

          {/* Badge บุคคล / นิติบุคคล */}
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border shrink-0 ${
            customer.customerType === 'individual' 
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}>
            {customer.customerType === 'individual' ? 'บุคคลธรรมดา' : 'นิติบุคคล / ร้านค้า'}
          </span>

          {/* Badge Tier / Rank */}
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0">
            ⭐ {(() => {
              const points = Number(customer.totalAccumulatedPoints || customer.creditPoints || customer.stats?.totalAccumulatedPoints || 0);
              const tier = getUserTier(points);
              return tier.name || customer.rank || customer.role || 'Member';
            })()}
          </span>

          {/* ปุ่มโอนย้ายข้อมูล */}
          <button 
            onClick={() => setIsSyncModalOpen(true)}
            className="px-2.5 py-0.5 text-[11px] font-medium text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 rounded-md transition-all duration-200 flex items-center gap-1 whitespace-nowrap shadow-sm active:scale-95 shrink-0"
            title="โอนย้ายข้อมูลบัญชีลูกค้า"
          >
            <Sparkles size={12} className="text-indigo-400" />
            <span>โอนย้ายข้อมูล</span>
          </button>

          {/* Badge TAX */}
          {Boolean(customer.hasTaxInfo || customer.taxInvoiceNeeded || customer.taxId) && (
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0 flex items-center gap-0.5">
              TAX
            </span>
          )}
        </div>

        {/* แถวล่าง 2 กล่อง: DH ค้างยอด และ คะแนนสะสม */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3">
          <div className="bg-slate-800/60 rounded-lg p-2.5 flex flex-col justify-between border border-slate-700/50">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wide">DH ค้างยอด</span>
            <div className="flex items-center justify-between mt-1 gap-2">
              <WalletDisplay customerId={customer.id} customer={customer} live={true} showSymbol={true} className="text-lg font-bold font-mono text-rose-400" />
              <button 
                onClick={() => setIsRefundModalOpen(true)}
                className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold border border-rose-500/30 transition-all shrink-0 active:scale-95"
                title="ขอคืนเงิน"
              >
                คืนเงิน
              </button>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-2.5 flex flex-col justify-between border border-slate-700/50">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wide">คะแนนสะสม</span>
            <div className="flex items-baseline gap-1 mt-1">
              <PointDisplay customerId={customer.id} customer={customer} live={true} className="text-lg font-bold font-mono text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">แต้ม</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1.5 Tabs Menu */}
      <div className="flex items-center px-5 pt-3 border-b border-slate-200 bg-slate-50/80 gap-6">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
        >
          📌 ทั่วไป
        </button>
        <button 
          onClick={() => setActiveTab('marketing')}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'marketing' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
        >
          📢 โฆษณา & ร้านค้า
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
        >
          📦 ประวัติสั่งซื้อ
        </button>
      </div>

      {/* 2. เนื้อหาหลัก (Scrollable Content) */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50">
        <div className="p-5 space-y-6">
          
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ContactInfo 
                customer={customer} 
                handleCopy={handleCopy}
                copiedField={copiedField}
              />
              
              <ShippingInfo 
                customer={customer}
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
            </div>
          )}

          {activeTab === 'marketing' && (
            <MarketingInfo customer={customer} />
          )}

          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <HistoryInfo 
                history={history}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
              />
            </div>
          )}

        </div>
      </div>

      {/* 3. ส่วนท้าย (Actions) */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex gap-3 shrink-0">
        <button 
          onClick={onDelete} 
          className="px-4 py-2.5 bg-white text-rose-600 hover:bg-rose-50 border border-rose-100 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors flex-1 justify-center shadow-xs"
        >
          <Trash2 size={16} /> ลบลูกค้า
        </button>
        <button 
          onClick={() => onEdit(customer)} 
          className="px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors flex-1 justify-center shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Edit2 size={16} /> แก้ไขข้อมูล
        </button>
      </div>

      <CustomerSyncModal 
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        customer={customer}
        onSyncComplete={() => {
          setIsSyncModalOpen(false);
          onClose(); // Close DetailPanel to force a refresh of the list
        }}
      />

      <CustomerRefundModal 
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        customer={customer}
        onSuccess={() => {
          setIsRefundModalOpen(false);
          onClose(); // ปิดแล้วรีเฟรชหน้าจอ
        }}
      />
    </div>
  );
}