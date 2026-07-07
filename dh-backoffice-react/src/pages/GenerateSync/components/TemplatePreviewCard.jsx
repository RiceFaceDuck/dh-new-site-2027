import React from 'react';
import { FileText, Database } from 'lucide-react';

export default function TemplatePreviewCard({ previewData }) {
  if (!previewData) return null;

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <FileText size={16} className="text-indigo-500" /> 
          คอลัมน์ที่พบในไฟล์แม่แบบ ({previewData.headers.length} คอลัมน์)
        </h3>
        <div className="flex flex-wrap gap-2">
          {previewData.headers.map((h, i) => (
            <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-md shadow-xs">
              {h}
            </span>
          ))}
          {previewData.headers.length === 0 && (
            <span className="text-xs text-slate-400 italic">ไม่พบคอลัมน์ หรือไฟล์มีรูปแบบที่ซับซ้อนเกินไป (แต่ระบบอาจยังทำงานได้ปกติ)</span>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Database size={16} className="text-emerald-500" />
          สรุปการจับคู่กับ Schema ของระบบ
        </h3>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 font-semibold text-slate-600">คอลัมน์ใน Excel (ประมาณ)</th>
                <th className="px-4 py-2.5 font-semibold text-slate-600">ดึงข้อมูลจาก (Schema)</th>
                <th className="px-4 py-2.5 font-semibold text-slate-600">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewData.mapping.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">{m.col}</td>
                  <td className="px-4 py-3">
                    {m.isEditable ? (
                      <input 
                        type="text"
                        defaultValue={m.schema}
                        onBlur={(e) => {
                          const val = e.target.value.trim() || '总仓库';
                          localStorage.setItem('bigseller_warehouse_name', val);
                          e.target.value = val;
                        }}
                        className="font-mono text-xs text-emerald-700 bg-white px-2 py-1 rounded-sm border border-emerald-300 w-32 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                        title="คลิกเพื่อแก้ไขชื่อคลังสินค้า"
                      />
                    ) : (
                      <span className="font-mono text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-100">
                        {m.schema}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{m.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          * ระบบจะค้นหาคอลัมน์โดยอัตโนมัติจากคำค้นหา (Keyword) ไม่ว่าจะอยู่คอลัมน์ไหนก็ตาม
        </p>
      </div>
    </div>
  );
}
