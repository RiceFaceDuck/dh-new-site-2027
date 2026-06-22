import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Info, Lightbulb, PlayCircle } from 'lucide-react';

/**
 * GuidePanel
 * Component สำหรับอธิบายวิธีการใช้งานหน้าต่างๆ ตามกฎ (In-App Documentation)
 * รองรับการย่อ/ขยาย เพื่อไม่ให้เกะกะสายตาของผู้ที่มีความชำนาญแล้ว
 * 
 * @param {string} title - ชื่อของคำแนะนำ
 * @param {string} description - ตำรา/คำอธิบายภาพรวม (What is this?)
 * @param {Array<string>} howTo - วิธีการใช้งานเป็นขั้นเป็นตอน (How-to)
 * @param {Array<string>} tips - เทคนิคการใช้งาน (Tips & Tricks)
 * @param {string} expectedResult - ตัวอย่างผลลัพธ์ หรือข้อควรระวัง
 */
export default function GuidePanel({ title, description, howTo = [], tips = [], expectedResult }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`mb-6 rounded-2xl border transition-all duration-300 shadow-sm ${isOpen ? 'border-indigo-200 bg-white' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer'}`}>
      
      {/* Header (Clickable) */}
      <div 
        className="px-5 py-4 flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-500 shadow-sm'}`}>
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isOpen ? 'text-indigo-900' : 'text-slate-700'}`}>
              คู่มือการใช้งาน: {title}
            </h3>
            {!isOpen && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{description}</p>
            )}
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Body (Expandable) */}
      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
          
          {/* Description */}
          <div className="flex items-start gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600 leading-relaxed"><span className="font-bold text-slate-700">ภาพรวม:</span> {description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* How-To */}
            {howTo.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <PlayCircle size={14} className="text-emerald-500"/> วิธีการใช้งาน (Step-by-step)
                </h4>
                <ol className="space-y-2">
                  {howTo.map((step, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-slate-600">
                      <span className="font-bold text-slate-300 w-4 text-right">{idx + 1}.</span>
                      <span className="flex-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div>
              {/* Tips */}
              {tips.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Lightbulb size={14} className="text-amber-500"/> เทคนิค & ข้อแนะนำ (Tips)
                  </h4>
                  <ul className="space-y-2">
                    {tips.map((tip, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-slate-600">
                        <span className="text-amber-500">•</span>
                        <span className="flex-1">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expected Result */}
              {expectedResult && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                  <p className="text-xs font-bold text-orange-800 mb-1">ผลลัพธ์ / ข้อควรระวัง:</p>
                  <p className="text-[13px] text-orange-700 leading-relaxed">{expectedResult}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
