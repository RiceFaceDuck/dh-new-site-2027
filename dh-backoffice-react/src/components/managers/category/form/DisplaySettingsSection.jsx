import React from 'react';

export default function DisplaySettingsSection({
  buttonShape,
  setButtonShape,
  filtersText,
  setFiltersText,
  isSubmitting
}) {
  return (
    <>
      {/* Button Shape */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">
          รูปทรงปุ่ม (หน้าร้าน)
        </label>
        <div className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="buttonShape" 
              value="circle" 
              checked={buttonShape === 'circle'} 
              onChange={(e) => setButtonShape(e.target.value)} 
              disabled={isSubmitting} 
              className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
            />
            <span className="text-sm text-slate-700">วงกลม</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="buttonShape" 
              value="rounded" 
              checked={buttonShape === 'rounded'} 
              onChange={(e) => setButtonShape(e.target.value)} 
              disabled={isSubmitting} 
              className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
            />
            <span className="text-sm text-slate-700">สี่เหลี่ยมขอบมน</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="buttonShape" 
              value="square" 
              checked={buttonShape === 'square'} 
              onChange={(e) => setButtonShape(e.target.value)} 
              disabled={isSubmitting} 
              className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
            />
            <span className="text-sm text-slate-700">สี่เหลี่ยม</span>
          </label>
        </div>
      </div>

      {/* Filters Recommendation */}
      <div className="flex flex-col gap-2">
        <label htmlFor="categoryFilters" className="text-sm font-medium text-slate-700">
          ตัวกรองแนะนำ (แนะนำให้ระบุ)
        </label>
        <input
          id="categoryFilters"
          type="text"
          value={filtersText}
          onChange={(e) => setFiltersText(e.target.value)}
          placeholder="เช่น 14.0 นิ้ว, 15.6 นิ้ว, 30 PIN, 40 PIN (คั่นด้วยลูกน้ำ)"
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-slate-50"
        />
        <p className="text-xs text-slate-500">
          ฟังก์ชันแนะนำการกรองสำหรับประเภทสินค้านี้ จะไปแสดงเป็นปุ่มด้านหลังชื่อหมวดหมู่ในหน้าร้าน
        </p>
      </div>
    </>
  );
}
