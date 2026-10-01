import { Eye } from 'lucide-react';

export default function ThemeLivePreview({ themeConfig }) {
  const bgUrl = themeConfig?.backgroundUrl || '/user-bg.jpg';
  const blurPx = Number(themeConfig?.blurLevel) || 16;
  const opTop = (Number(themeConfig?.opacityTop) || 75) / 100;
  const opMid = (Number(themeConfig?.opacityMid) || 55) / 100;
  const opBottom = (Number(themeConfig?.opacityBottom) || 35) / 100;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <Eye size={18} className="text-fuchsia-500" /> ตัวอย่างผลลัพธ์กระจกฝ้าหน้าเว็บ (Live Frosted Glass Preview)
        </label>
        <span className="text-xs font-bold text-fuchsia-600 bg-fuchsia-50 px-2.5 py-1 rounded-full">
          Realtime Simulation
        </span>
      </div>

      <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-300 shadow-inner flex flex-col justify-between p-4">
        {/* Real Background Image with blur */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-300"
          style={{
            backgroundImage: `url(${bgUrl})`,
            filter: `blur(${blurPx}px)`,
            transform: 'scale(1.05)'
          }}
        />

        {/* Dynamic Gradient Frosted Glass Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            background: `linear-gradient(to bottom, rgba(255, 255, 255, ${opTop}) 0%, rgba(255, 255, 255, ${opMid}) 50%, rgba(255, 255, 255, ${opBottom}) 100%)`
          }}
        />

        {/* Sample Content overlay to demonstrate readability */}
        <div className="relative z-10 flex items-center justify-between bg-white/70 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/50 shadow-xs">
          <span className="text-xs font-black text-slate-800">DH Notebook Storefront</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-fuchsia-600 text-white">
            {themeConfig.themeId === 'theme-trusted-partner' ? 'Trusted Partner' : 'Tech Professional'}
          </span>
        </div>

        <div className="relative z-10 bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-white/60 shadow-xs max-w-xs">
          <p className="text-xs font-black text-slate-800">ทดสอบการอ่านข้อความ</p>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5">
            ความโปร่งใสและเบลอช่วยให้ตัวหนังสืออ่านชัดเจนบนฉากหลัง
          </p>
        </div>
      </div>
      
      <p className="text-[11px] text-slate-400 text-center">
        ตัวอย่างการไล่เฉดสีขาวกระจกฝ้าและการเบลอภาพพื้นหลังแบบเรียลไทม์ตามการปรับสไลเดอร์
      </p>
    </div>
  );
}
