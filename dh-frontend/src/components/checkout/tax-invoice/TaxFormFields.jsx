import React, { useState } from 'react';
import { User, Building2, FileText, AlertCircle, Eye, EyeOff, Hash, MapPin } from 'lucide-react';

export default function TaxFormFields({ taxInfo, handleChange }) {
  const [showTaxId, setShowTaxId] = useState(false);

  const getMaskedTaxId = (taxId) => {
    if (!taxId) return '';
    if (taxId.length <= 4) return taxId;
    return '•••••••••' + taxId.slice(-4);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
          {taxInfo.type === 'personal' ? <User className="w-4 h-4 text-slate-400" /> : <Building2 className="w-4 h-4 text-slate-400" />}
          {taxInfo.type === 'personal' ? 'ชื่อ - นามสกุล' : 'ชื่อจดทะเบียนบริษัท / ห้างหุ้นส่วนจำกัด'} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={taxInfo.name}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white text-slate-800"
          placeholder={taxInfo.type === 'personal' ? 'เช่น นายสมชาย ใจดี' : 'เช่น บจก. ดีเอช โน้ตบุ๊ค (ไม่ต้องใส่คำว่า บริษัท)'}
        />
      </div>

      <div className={taxInfo.type === 'personal' ? 'md:col-span-2' : 'md:col-span-1'}>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between items-end">
          <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-400" /> เลขประจำตัวผู้เสียภาษี (13 หลัก) <span className="text-red-500">*</span></span>
          {taxInfo.taxId && taxInfo.taxId.length === 13 && (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">รูปแบบถูกต้อง</span>
          )}
        </label>
        
        <div className="relative group">
          <input
            type={showTaxId ? "text" : "password"}
            name="taxId"
            value={showTaxId ? taxInfo.taxId : getMaskedTaxId(taxInfo.taxId)}
            onChange={showTaxId ? handleChange : undefined}
            onClick={() => setShowTaxId(true)}
            className={`block w-full pl-4 pr-12 py-3 border rounded-xl focus:ring-2 transition-all font-mono tracking-widest text-base ${
              !showTaxId 
                ? 'bg-slate-100 border-slate-200 cursor-pointer select-none text-slate-500' 
                : taxInfo.taxId.length === 13
                  ? 'bg-white border-emerald-300 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800'
                  : 'bg-white border-indigo-300 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800'
            }`}
            placeholder="XXXXXXXXXXXXX"
          />
          <button
            type="button"
            onClick={() => setShowTaxId(!showTaxId)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
            title={showTaxId ? "ซ่อนข้อมูล" : "แสดงและแก้ไขข้อมูล"}
          >
            {showTaxId ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {taxInfo.taxId && taxInfo.taxId.length > 0 && taxInfo.taxId.length < 13 && showTaxId && (
          <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1 font-medium animate-fade-in">
            <AlertCircle className="w-3 h-3" /> กรุณาระบุให้ครบ 13 หลัก
          </p>
        )}
      </div>

      {taxInfo.type === 'company' && (
        <div className="md:col-span-1 animate-in fade-in slide-in-from-left-2 duration-300">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">สาขาจดทะเบียน</label>
          <div className="flex flex-col gap-2 p-1">
            <label className="flex items-center gap-2 cursor-pointer mt-1 group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  name="isHeadOffice"
                  checked={taxInfo.isHeadOffice}
                  onChange={handleChange}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 transition-all cursor-pointer peer"
                />
              </div>
              <span className="text-sm text-slate-700 font-medium group-hover:text-indigo-700 transition-colors">สำนักงานใหญ่</span>
            </label>
            
            <div className={`transition-all duration-300 overflow-hidden ${!taxInfo.isHeadOffice ? 'max-h-16 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  name="branchCode"
                  value={taxInfo.branchCode}
                  onChange={handleChange}
                  placeholder="รหัสสาขา (เช่น 00001)"
                  maxLength={5}
                  className="block w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white text-sm text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-slate-400" />
          ที่อยู่สำหรับออกใบกำกับภาษี <span className="text-red-500">*</span>
        </label>
        <textarea 
          rows="2" 
          name="address"
          value={taxInfo.address}
          onChange={handleChange}
          placeholder="บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" 
          className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white text-slate-800 resize-none leading-relaxed"
        />
      </div>
    </div>
  );
}
