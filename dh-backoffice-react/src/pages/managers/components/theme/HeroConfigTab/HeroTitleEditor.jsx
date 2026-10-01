import { Tag, Type, AlignLeft, AlignCenter, Plus, ArrowUp, ArrowDown, Bold, Italic, Underline, Strikethrough, Monitor, Smartphone, Trash2 } from 'lucide-react';
import { compileHeroTitle } from '../../../../../firebase/heroConfigService';

export default function HeroTitleEditor({
  titleSegments = [],
  badge = { text: '', isActive: false, color: '#facc15' },
  subtitle = { text: '', isActive: false },
  textAlignment = 'left',
  onChange
}) {
  const notifyChange = (updated) => {
    const nextSegments = updated.titleSegments !== undefined ? updated.titleSegments : titleSegments;
    onChange({
      title: compileHeroTitle(nextSegments),
      titleSegments: nextSegments,
      badge: updated.badge !== undefined ? updated.badge : badge,
      subtitle: updated.subtitle !== undefined ? updated.subtitle : subtitle,
      textAlignment: updated.textAlignment !== undefined ? updated.textAlignment : textAlignment
    });
  };

  const handleAdd = () => {
    const next = [
      ...titleSegments,
      {
        text: '',
        color: '',
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrikethrough: false,
        breakDesktop: false,
        breakAll: false
      }
    ];
    notifyChange({ titleSegments: next });
  };

  const handleRemove = (index) => {
    const next = titleSegments.filter((_, i) => i !== index);
    notifyChange({ titleSegments: next });
  };

  const handleMove = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === titleSegments.length - 1)) return;
    const next = [...titleSegments];
    const temp = next[index];
    next[index] = next[index + direction];
    next[index + direction] = temp;
    notifyChange({ titleSegments: next });
  };

  const handleUpdateSegment = (index, field, value) => {
    const next = [...titleSegments];
    next[index] = { ...next[index], [field]: value };
    if (field === 'breakAll' && value === true) {
      next[index].breakDesktop = false;
    }
    if (field === 'breakDesktop' && value === true) {
      next[index].breakAll = false;
    }
    notifyChange({ titleSegments: next });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow space-y-6">
      {/* Badge Config */}
      <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            <Tag size={14} className="text-amber-500" /> ป้ายกำกับด้านบน (Badge / Tag)
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-semibold text-slate-500">
              {badge?.isActive ? 'เปิดใช้งาน' : 'ปิด'}
            </span>
            <input
              type="checkbox"
              checked={badge?.isActive || false}
              onChange={(e) => notifyChange({ badge: { ...(badge || {}), isActive: e.target.checked } })}
              className="w-4 h-4 rounded-sm text-amber-500 accent-amber-500 cursor-pointer"
            />
          </label>
        </div>
        {badge?.isActive && (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={badge?.text || ''}
              onChange={(e) => notifyChange({ badge: { ...(badge || {}), text: e.target.value } })}
              placeholder="เช่น B2B WHOLESALE & SPARES หรือ PROMOTION"
              className="flex-1 p-2.5 text-xs bg-white border border-amber-200 rounded-lg outline-hidden focus:border-amber-500"
            />
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 border border-amber-200 rounded-lg">
              <span className="text-[11px] font-bold text-slate-500">สีป้าย:</span>
              <input
                type="color"
                value={badge?.color || '#facc15'}
                onChange={(e) => notifyChange({ badge: { ...(badge || {}), color: e.target.value } })}
                className="w-6 h-6 border-0 rounded-full cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Text Builder */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <Type size={18} className="text-yellow-500" /> สร้างข้อความหลัก (Text Builder)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => notifyChange({ textAlignment: 'left' })}
                title="จัดชิดซ้าย"
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  textAlignment === 'left' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <AlignLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => notifyChange({ textAlignment: 'center' })}
                title="จัดกึ่งกลาง"
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  textAlignment === 'center' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <AlignCenter size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus size={14} /> เพิ่มท่อนข้อความ
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-2">
          {titleSegments.map((seg, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl relative group"
            >
              {/* Order Controls */}
              <div className="flex sm:flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === titleSegments.length - 1}
                  className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              {/* Text Input */}
              <input
                type="text"
                value={seg.text || ''}
                onChange={(e) => handleUpdateSegment(idx, 'text', e.target.value)}
                placeholder="พิมพ์ข้อความที่นี่..."
                className="flex-1 w-full p-2.5 text-sm bg-white border border-slate-300 rounded-lg outline-hidden focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
              />

              {/* Formatting Controls */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Color */}
                <div className="relative flex items-center group/color">
                  <label
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer hover:bg-slate-100 ${
                      seg.color || seg.isHighlight
                        ? 'bg-white border-slate-300 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-slate-300 shadow-inner"
                      style={{ backgroundColor: seg.color || (seg.isHighlight ? '#facc15' : '#ffffff') }}
                    />
                    <span className="text-slate-600 truncate max-w-[60px]">
                      {seg.color || (seg.isHighlight ? '#facc15' : 'สีปกติ')}
                    </span>
                    <input
                      type="color"
                      value={seg.color || (seg.isHighlight ? '#facc15' : '#ffffff')}
                      onChange={(e) => {
                        const next = [...titleSegments];
                        next[idx] = { ...next[idx], color: e.target.value, isHighlight: false };
                        notifyChange({ titleSegments: next });
                      }}
                      className="absolute opacity-0 w-0 h-0"
                    />
                  </label>
                  {(seg.color || seg.isHighlight) && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...titleSegments];
                        next[idx] = { ...next[idx], color: '', isHighlight: false };
                        notifyChange({ titleSegments: next });
                      }}
                      title="คืนค่าสีเป็นสีขาวปกติ"
                      className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover/color:opacity-100 transition-opacity cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Text Styles */}
                <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleUpdateSegment(idx, 'isBold', !seg.isBold)}
                    title="ตัวหนา"
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      seg.isBold ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateSegment(idx, 'isItalic', !seg.isItalic)}
                    title="ตัวเอียง"
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      seg.isItalic ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateSegment(idx, 'isUnderline', !seg.isUnderline)}
                    title="ขีดเส้นใต้"
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      seg.isUnderline ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Underline size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateSegment(idx, 'isStrikethrough', !seg.isStrikethrough)}
                    title="ขีดทับ"
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      seg.isStrikethrough ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Strikethrough size={14} />
                  </button>
                </div>

                {/* Break Controls */}
                <div className="flex bg-slate-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateSegment(idx, 'breakDesktop', !seg.breakDesktop)}
                    title="ขึ้นบรรทัดใหม่เฉพาะจอคอม (Desktop)"
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      seg.breakDesktop ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Monitor size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateSegment(idx, 'breakAll', !seg.breakAll)}
                    title="ขึ้นบรรทัดใหม่ทุกจอ (Mobile & Desktop)"
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      seg.breakAll ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Smartphone size={14} />
                  </button>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto sm:ml-0 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {titleSegments.length === 0 && (
            <div className="text-center p-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
              ยังไม่มีข้อความ กดปุ่ม "เพิ่มท่อนข้อความ" ด้านบน
            </div>
          )}
        </div>
      </div>

      {/* Subtitle Config */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Type size={14} className="text-blue-500" /> คำโปรยย่อย (Subtitle)
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-semibold text-slate-500">
              {subtitle?.isActive ? 'เปิดใช้งาน' : 'ปิด'}
            </span>
            <input
              type="checkbox"
              checked={subtitle?.isActive || false}
              onChange={(e) => notifyChange({ subtitle: { ...(subtitle || {}), isActive: e.target.checked } })}
              className="w-4 h-4 rounded-sm text-blue-600 accent-blue-600 cursor-pointer"
            />
          </label>
        </div>
        {subtitle?.isActive && (
          <input
            type="text"
            value={subtitle?.text || ''}
            onChange={(e) => notifyChange({ subtitle: { ...(subtitle || {}), text: e.target.value } })}
            placeholder="เช่น ศูนย์รวมอะไหล่โน๊ตบุ๊คแท้ราคาส่ง บริการส่งด่วนทั่วไทย รับประกันคุณภาพทุกชิ้น"
            className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-500"
          />
        )}
      </div>
    </div>
  );
}
