import React from 'react';

export default function BasicInfoSection({
  name,
  setName,
  type,
  setType,
  availableTypes,
  isSubmitting
}) {
  return (
    <>
      {/* Category Name */}
      <div className="flex flex-col gap-2">
        <label htmlFor="categoryName" className="text-sm font-medium text-slate-700">
          ชื่อหมวดหมู่ที่แสดง <span className="text-red-500">*</span>
        </label>
        <input
          id="categoryName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น อุปกรณ์ภายใน, สินค้าแนะนำ"
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-slate-50"
        />
      </div>

      {/* Category Type */}
      <div className="flex flex-col gap-2">
        <label htmlFor="categoryType" className="text-sm font-medium text-slate-700">
          ประเภทสินค้า / คำค้นหา (Type) <span className="text-red-500">*</span>
        </label>
        <select
          id="categoryType"
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-50 disabled:bg-slate-50"
        >
          <option value="">-- กรุณาเลือกประเภทสินค้า --</option>
          {availableTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          ดึงข้อมูลจากสินค้าในคลัง เพื่อให้เชื่อมโยงได้ตรงกัน 100%
        </p>
      </div>
    </>
  );
}
