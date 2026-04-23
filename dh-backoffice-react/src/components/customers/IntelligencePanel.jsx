import React, { useState } from 'react';
import { X, Edit2, Trash2, Mail, MapPin, Truck, AlertTriangle, Briefcase, FileText, CreditCard } from 'lucide-react';

// 🌟 Component หลักแผงขวา จัดการ Tabs & Lazy Loading
export default function IntelligencePanel({ customer, onClose, currentUserRole, onUpdateCustomer, onDeleteSuccess }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Tabs Config
  const tabs = [
    { id: 'overview', label: 'ภาพรวมธุรกิจ', icon: Briefcase },
    { id: 'financial', label: 'การเงิน & เครดิต', icon: CreditCard },
    { id: 'history', label: 'ประวัติบิล/เคลม', icon: FileText },
    { id: 'kyc', label: 'เอกสาร KYC', icon: AlertTriangle }
  ];

  return (
    <div className="flex flex-col h-full bg-white relative animate-in slide-in-from-right-4 duration-300">
      
      {/* 🚀 1. Panel Header (Profile Summary) */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white shrink-0 relative">
        <div className="absolute top-4 right-4 flex gap-1">
          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไขข้อมูล">
            <Edit2 size={16} />
          </button>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 flex items-center justify-center font-black text-2xl shadow-sm border border-emerald-100 shrink-0">
            {customer.accountName?.charAt(0) || 'C'}
          </div>
          <div className="pt-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shadow-sm">
                ID: {customer.customerCode || customer.id.substring(0,8).toUpperCase()}
              </span>
              {customer.accountRank && (
                <span className="text-[10px] bg-yellow-50 border border-yellow-200 text-yellow-700 px-2 py-0.5 rounded font-bold shadow-sm">
                  🏆 {customer.accountRank}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {customer.accountName || customer.displayName}
            </h2>
            <div className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
               <span className="flex items-center gap-1"><Mail size={12}/> {customer.email || 'ไม่มี Email'}</span>
               <span className="flex items-center gap-1"><MapPin size={12}/> {customer.address ? 'มีข้อมูลที่อยู่' : 'ไม่ได้ระบุที่อยู่'}</span>
               {customer.logisticProvider && <span className="flex items-center gap-1 text-orange-600"><Truck size={12}/> {customer.logisticProvider}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 2. Navigation Tabs */}
      <div className="flex px-5 border-b border-gray-100 shrink-0 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-emerald-500' : 'text-gray-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 🚀 3. Tab Content (Lazy Rendered via State) */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-gray-50/30">
        
        {/* Placeholder สำหรับเนื้อหา Tab ที่จะพัฒนาในไฟล์แยกต่อไป */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">ยอดขายรวม (All-time)</p>
                  <p className="text-2xl font-black text-emerald-600">฿{(customer.stats?.totalSales || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">ยอด 30 วันล่าสุด</p>
                  <p className="text-xl font-bold text-gray-800">฿{(customer.stats?.last30DaysSales || 0).toLocaleString()}</p>
                </div>
             </div>
             <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                <h3 className="text-sm font-bold text-yellow-800 flex items-center gap-2 mb-2">
                  <AlertTriangle size={16}/> Internal Intelligence Notes
                </h3>
                <p className="text-sm text-yellow-700">พื้นที่สำหรับบันทึกความลับทางการค้าและพฤติกรรมลูกค้า (กำลังพัฒนา)</p>
             </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="flex items-center justify-center h-40 text-gray-400">
             (หน้าต่างการเงินและเครดิต กำลังโหลด Component แยก...)
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex items-center justify-center h-40 text-gray-400">
             (หน้าต่างประวัติบิล Lazy Loading กำลังดึงข้อมูล...)
          </div>
        )}

      </div>
    </div>
  );
}