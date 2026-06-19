import React from 'react';
import { ShieldCheckIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from './AdIcons';
import { HelpCircle } from 'lucide-react';

export default function AdsHeader({ activeTab, setActiveTab, pendingCount, setIsGuideOpen }) {
  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center mb-8">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100">
           <ShieldCheckIcon size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">การจัดการพื้นที่โฆษณา (Sponsored Ads)</h2>
        <div className="flex items-center justify-center gap-3">
          <p className="text-sm text-slate-500">ศูนย์ตรวจสอบ อนุมัติ และจัดการโฆษณาสินค้าที่ Partner ส่งเข้ามา เพื่อความปลอดภัยของระบบ</p>
          <button onClick={() => setIsGuideOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 shadow-sm dh-active-press">
            <HelpCircle size={14} /> คู่มือการใช้งาน
          </button>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          <button 
            onClick={() => setActiveTab('PENDING')}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'PENDING' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ClockIcon size={16}/> รอตรวจสอบ {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button 
            onClick={() => setActiveTab('APPROVED')}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CheckCircleIcon size={16}/> กำลังแสดงผล
          </button>
          <button 
            onClick={() => setActiveTab('REJECTED')}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <XCircleIcon size={16}/> ถูกปฏิเสธ
          </button>
        </div>
      </div>
    </>
  );
}
