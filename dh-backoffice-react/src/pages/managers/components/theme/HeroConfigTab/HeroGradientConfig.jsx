import { Palette, Maximize2, Columns, Eye, EyeOff, Sparkles, Droplets, MoveVertical } from 'lucide-react';

export default function HeroGradientConfig({
  overlay = { enabled: true, color: '#1f2937', opacity: 90, direction: 'to-r' },
  bannerHeight = 'standard',
  imageLayout = 'split',
  onChange
}) {
  const isOverlayEnabled = overlay?.enabled !== false;

  const presets = [
    { label: 'Dark Slate (ค่าเริ่มต้น)', color: '#1f2937', opacity: 90, direction: 'to-r' },
    { label: 'Midnight Navy', color: '#0f172a', opacity: 92, direction: 'to-r' },
    { label: 'Cyber Dark', color: '#18181b', opacity: 95, direction: 'to-r' },
    { label: 'Deep Emerald', color: '#064e3b', opacity: 90, direction: 'to-r' },
    { label: 'Royal Purple', color: '#3b0764', opacity: 92, direction: 'to-r' },
    { label: 'Pure Black', color: '#000000', opacity: 85, direction: 'to-r' }
  ];

  const handleOverlayChange = (newOverlay) => {
    onChange({ overlay: newOverlay, bannerHeight, imageLayout });
  };

  const handleBannerHeightChange = (newHeight) => {
    onChange({ overlay, bannerHeight: newHeight, imageLayout });
  };

  const handleImageLayoutChange = (newLayout) => {
    onChange({ overlay, bannerHeight, imageLayout: newLayout });
  };

  const handleApplyPreset = (preset) => {
    handleOverlayChange({
      ...overlay,
      enabled: true,
      color: preset.color,
      opacity: preset.opacity,
      direction: preset.direction
    });
  };

  return (
    <div className="bg-white border border-slate-300 rounded-[2px] p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Palette size={18} className="text-pink-600" /> การตั้งค่าโทนสีและขนาด (Appearance & Layout)
        </label>
      </div>

      {/* Image Layout */}
      <div className="p-4 bg-slate-50 border border-slate-300 rounded-[2px] space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Maximize2 size={14} className="text-blue-600" /> รูปแบบการวางภาพพื้นหลัง (Image Layout)
          </label>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-[2px] border border-blue-300">
            {imageLayout === 'full' ? 'แสดงภาพเต็มผืน 100%' : 'แยกรูปฝั่งขวา 70%'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleImageLayoutChange('full')}
            className={`flex items-center justify-center gap-2 p-3 rounded-[2px] border text-xs font-bold transition-all cursor-pointer ${
              imageLayout === 'full'
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Maximize2 size={16} /> ภาพเต็มผืน 100% (Full Background)
          </button>
          <button
            type="button"
            onClick={() => handleImageLayoutChange('split')}
            className={`flex items-center justify-center gap-2 p-3 rounded-[2px] border text-xs font-bold transition-all cursor-pointer ${
              imageLayout === 'split'
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Columns size={16} /> ภาพแยกฝั่งขวา 70% (Split Right)
          </button>
        </div>
      </div>

      {/* Gradient Overlay Toggle */}
      <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-300 rounded-[2px]">
        <div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            {isOverlayEnabled ? <Eye size={14} className="text-pink-600" /> : <EyeOff size={14} className="text-slate-500" />}
            การไล่เฉดสีบังภาพ (Gradient Overlay)
          </h4>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {isOverlayEnabled
              ? 'เปิดใช้งานเฉดสีเพื่อให้ตัวหนังสืออ่านง่ายขึ้น'
              : 'ปิดเฉดสี แสดงภาพสด 100% ชัดเจน ไม่มีเงาดำบัง'}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isOverlayEnabled}
            onChange={(e) => handleOverlayChange({ ...overlay, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
        </label>
      </div>

      {isOverlayEnabled ? (
        <div className="space-y-5 pt-1">
          {/* Balanced Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-pink-600" /> ชุดสีสมดุลสำเร็จรูป (Balanced Presets)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map((p, idx) => {
                const isSelected = overlay?.color === p.color;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`flex items-center gap-2 p-2.5 rounded-[2px] border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-pink-500 bg-pink-100/70 shadow-xs ring-1 ring-pink-500 font-bold'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300 shadow-xs shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className={`text-xs truncate ${isSelected ? 'text-pink-900 font-bold' : 'text-slate-700'}`}>
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opacity & Color Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-200">
            {/* Opacity */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Droplets size={14} className="text-blue-500" /> ความเข้มของเฉดสี
                </label>
                <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-[2px] border border-blue-300">
                  {overlay?.opacity ?? 90}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={overlay?.opacity ?? 90}
                onChange={(e) => handleOverlayChange({ ...overlay, opacity: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-[2px] appearance-none cursor-pointer accent-pink-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-bold px-1">
                <span>สว่าง (0%)</span>
                <span>มืดสนิท (100%)</span>
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-slate-400 shadow-xs"
                  style={{ backgroundColor: overlay?.color || '#1f2937' }}
                />
                สีพื้นหลังเฉดสี (Overlay Color)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={overlay?.color || '#1f2937'}
                  onChange={(e) => handleOverlayChange({ ...overlay, color: e.target.value })}
                  className="w-9 h-9 p-0.5 border border-slate-300 rounded-[2px] cursor-pointer bg-white"
                />
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-xs text-slate-500 font-mono">HEX:</span>
                  <input
                    type="text"
                    value={overlay?.color || '#1f2937'}
                    onChange={(e) => handleOverlayChange({ ...overlay, color: e.target.value })}
                    className="w-28 p-2 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-[2px] outline-hidden focus:border-pink-500 text-center font-bold"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gradient Direction */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-700 block">
              ทิศทางการไล่เฉดสี (Gradient Direction)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleOverlayChange({ ...overlay, direction: 'to-r' })}
                className={`p-2.5 text-xs font-bold rounded-[2px] border text-center transition-all cursor-pointer ${
                  (overlay?.direction || 'to-r') === 'to-r'
                    ? 'bg-pink-100/70 border-pink-500 text-pink-900 shadow-xs'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                แนวนอน (ซ้ายไปขวา)
              </button>
              <button
                type="button"
                onClick={() => handleOverlayChange({ ...overlay, direction: 'to-t' })}
                className={`p-2.5 text-xs font-bold rounded-[2px] border text-center transition-all cursor-pointer ${
                  overlay?.direction === 'to-t'
                    ? 'bg-pink-100/70 border-pink-500 text-pink-900 shadow-xs'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                แนวตั้ง (ล่างขึ้นบน)
              </button>
              <button
                type="button"
                onClick={() => handleOverlayChange({ ...overlay, direction: 'full' })}
                className={`p-2.5 text-xs font-bold rounded-[2px] border text-center transition-all cursor-pointer ${
                  overlay?.direction === 'full'
                    ? 'bg-pink-100/70 border-pink-500 text-pink-900 shadow-xs'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                มืดทึบทั้งภาพ
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-[2px] text-emerald-900 text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>ปิดเฉดสีแล้ว: รูปภาพแบนเนอร์จะแสดงสดแบบ 100% คมชัด ไม่มีเลเยอร์สีมืดบังภาพ</span>
        </div>
      )}

      {/* Banner Height */}
      <div className="space-y-2 pt-3 border-t border-slate-200">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <MoveVertical size={14} className="text-slate-500" /> ขนาดความสูงป้าย (Height)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'compact', label: 'กะทัดรัด (300px)' },
            { key: 'standard', label: 'มาตรฐาน (380px)' },
            { key: 'large', label: 'ใหญ่เด่น (460px)' }
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleBannerHeightChange(item.key)}
              className={`p-2.5 text-xs font-bold rounded-[2px] border text-center transition-all cursor-pointer ${
                (bannerHeight || 'standard') === item.key
                  ? 'bg-blue-100/70 border-blue-600 text-blue-900 shadow-xs'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-600 bg-pink-50/70 p-2.5 rounded-[2px] border border-pink-200">
        <span className="font-bold text-pink-700">Tip:</span> เลือกรูปแบบ <b>"ภาพเต็มผืน 100%"</b> หากต้องการให้ภาพสินค้าหรือกราฟิกของคุณขยายเต็มทั้งแบนเนอร์
      </p>
    </div>
  );
}
