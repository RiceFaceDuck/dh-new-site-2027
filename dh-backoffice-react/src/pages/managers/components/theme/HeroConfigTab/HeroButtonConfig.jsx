import { MousePointerClick, Link as LinkIcon } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'สินค้าทั้งหมด', path: '/category/all' },
  { label: 'ช่างบริการ (Squad)', path: '/squad' },
  { label: 'ค้นหาอะไหล่', path: '/search' },
  { label: 'ติดต่อร้าน', path: '/contact' }
];

export default function HeroButtonConfig({
  primaryButton = { label: 'BOOK A SQUAD', link: '/squad', isActive: true, variant: 'solid' },
  secondaryButton = { label: 'SHOP SPARES', link: '/category/all', isActive: true, variant: 'solid' },
  onChange
}) {
  const handlePrimaryChange = (changes) => {
    onChange({ primaryButton: { ...primaryButton, ...changes }, secondaryButton });
  };

  const handleSecondaryChange = (changes) => {
    onChange({ primaryButton, secondaryButton: { ...secondaryButton, ...changes } });
  };

  return (
    <div className="space-y-4">
      {/* Primary Button */}
      <div
        className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all ${
          primaryButton?.isActive ? '' : 'opacity-60 grayscale-40'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <MousePointerClick size={18} className="text-amber-500" /> ปุ่มหลัก (Primary Button)
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-bold text-slate-500">
              {primaryButton?.isActive ? 'แสดง' : 'ซ่อน'}
            </span>
            <input
              type="checkbox"
              checked={primaryButton?.isActive ?? true}
              onChange={(e) => handlePrimaryChange({ isActive: e.target.checked })}
              className="w-4 h-4 rounded-sm text-amber-500 accent-amber-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-600 mb-1 block">ข้อความบนปุ่ม</label>
              <input
                type="text"
                value={primaryButton?.label || ''}
                placeholder="เช่น BOOK A SQUAD"
                onChange={(e) => handlePrimaryChange({ label: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-hidden focus:border-amber-500 focus:bg-white"
                disabled={!primaryButton?.isActive}
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="text-xs font-bold text-slate-600 mb-1 block">สไตล์ปุ่ม</label>
              <select
                value={primaryButton?.variant || 'solid'}
                onChange={(e) => handlePrimaryChange({ variant: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-hidden focus:border-amber-500 focus:bg-white cursor-pointer"
                disabled={!primaryButton?.isActive}
              >
                <option value="solid">สีเหลืองสด (Solid Gold)</option>
                <option value="outline">กรอบเส้นเหลือง (Gold Outline)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">ลิงก์ปลายทาง (URL)</label>
            <div className="flex items-center gap-2 relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <LinkIcon size={14} />
              </div>
              <input
                type="text"
                value={primaryButton?.link || ''}
                placeholder="เช่น /squad หรือ https://..."
                onChange={(e) => handlePrimaryChange({ link: e.target.value })}
                className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-amber-500 focus:bg-white"
                disabled={!primaryButton?.isActive}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-bold mr-1">เลือกด่วน:</span>
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => handlePrimaryChange({ link: link.path })}
                  disabled={!primaryButton?.isActive}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Button */}
      <div
        className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all ${
          secondaryButton?.isActive ? '' : 'opacity-60 grayscale-40'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <MousePointerClick size={18} className="text-slate-500" /> ปุ่มรอง (Secondary Button)
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-bold text-slate-500">
              {secondaryButton?.isActive ? 'แสดง' : 'ซ่อน'}
            </span>
            <input
              type="checkbox"
              checked={secondaryButton?.isActive ?? true}
              onChange={(e) => handleSecondaryChange({ isActive: e.target.checked })}
              className="w-4 h-4 rounded-sm text-slate-600 accent-slate-600 cursor-pointer"
            />
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-600 mb-1 block">ข้อความบนปุ่ม</label>
              <input
                type="text"
                value={secondaryButton?.label || ''}
                placeholder="เช่น SHOP SPARES"
                onChange={(e) => handleSecondaryChange({ label: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-hidden focus:border-slate-500 focus:bg-white"
                disabled={!secondaryButton?.isActive}
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="text-xs font-bold text-slate-600 mb-1 block">สไตล์ปุ่ม</label>
              <select
                value={secondaryButton?.variant || 'solid'}
                onChange={(e) => handleSecondaryChange({ variant: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-hidden focus:border-slate-500 focus:bg-white cursor-pointer"
                disabled={!secondaryButton?.isActive}
              >
                <option value="solid">สีขาวสว่าง (Solid White)</option>
                <option value="outline">กรอบเส้นขาว (White Outline)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">ลิงก์ปลายทาง (URL)</label>
            <div className="flex items-center gap-2 relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <LinkIcon size={14} />
              </div>
              <input
                type="text"
                value={secondaryButton?.link || ''}
                placeholder="เช่น /category/all หรือ https://..."
                onChange={(e) => handleSecondaryChange({ link: e.target.value })}
                className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-slate-500 focus:bg-white"
                disabled={!secondaryButton?.isActive}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-bold mr-1">เลือกด่วน:</span>
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => handleSecondaryChange({ link: link.path })}
                  disabled={!secondaryButton?.isActive}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
