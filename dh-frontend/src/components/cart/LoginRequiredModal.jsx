import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, Gift, Truck, X, ExternalLink, Wrench } from 'lucide-react';

/**
 * LoginRequiredModal - ป็อปอัปแจ้งเตือนล็อกอินขึ้นกลางจอ
 * แสดงเมื่อผู้ใช้ยังไม่ได้เข้าสู่ระบบและพยายามดำเนินการสั่งซื้อ
 * รองรับ:
 * 1. ล็อกอินเพื่อสั่งซื้อผ่านเว็บ
 * 2. สั่งซื้อด่วนผ่าน LINE Official และ Messenger โดยไม่ต้องล็อกอิน
 * 3. ปุ่มค้นหาบริการช่าง (SERVICE PROVIDERS) นำทางไป /providers
 */
const LoginRequiredModal = ({ isOpen, onClose, onLogin }) => {
  const navigate = useNavigate();
  const loginButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => loginButtonRef.current?.focus(), 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop ม่านหลังมืดและเบลอ */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Container กลางจอ */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200 border border-slate-100 my-auto">
        
        {/* ปุ่มกากบาทปิดมุมขวาบน */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-20 cursor-pointer"
          aria-label="ปิด"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-7 flex flex-col items-center text-center">
          
          {/* Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500/10 via-brand/10 to-blue-500/20 text-brand flex items-center justify-center mb-4 border border-brand/20 shadow-inner">
            <LogIn size={28} strokeWidth={2.2} className="text-brand translate-x-0.5" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2 tracking-tight">
            คุณยังไม่ได้เข้าสู่ระบบ
          </h3>
          
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
            หากต้องการดำเนินการสั่งซื้อผ่านระบบเว็บ จำเป็นต้องเข้าสู่ระบบ<br className="hidden sm:inline" />
            เพื่อสะสมแต้มคะแนนและรับสิทธิพิเศษมากมาย
          </p>

          {/* สิทธิประโยชน์ที่ได้รับเมื่อล็อกอิน */}
          <div className="w-full bg-slate-50 rounded-2xl p-3.5 mb-4 border border-slate-100 space-y-2 text-left">
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <Gift size={15} className="text-brand-accent shrink-0" />
              <span>สะสมแต้มคะแนน DH Credit Point ทุกออเดอร์</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <Truck size={15} className="text-blue-500 shrink-0" />
              <span>ติดตามสถานะจัดส่งและเลขพัสดุ</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
              <span>ระบบชำระเงินและรับประกันสินค้า</span>
            </div>
          </div>

          {/* ปุ่มหลัก: เข้าสู่ระบบ */}
          <button 
            ref={loginButtonRef}
            onClick={onLogin}
            className="w-full py-3.5 px-6 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn size={18} />
            เข้าสู่ระบบ (สั่งซื้อผ่านเว็บ)
          </button>

          {/* เส้นคั่น: สั่งซื้อผ่านแชทโดยไม่ต้องล็อกอิน */}
          <div className="w-full flex items-center gap-3 my-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              หรือ สั่งซื้อผ่านแชต (ไม่ต้องล็อกอิน)
            </span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* แถวปุ่มคู่: LINE Official & Messenger */}
          <div className="w-full flex gap-2.5 mb-3">
            <button 
              onClick={() => window.open('https://line.me/R/ti/p/@dhnotebook', '_blank', 'noopener,noreferrer')}
              className="flex-1 py-3 px-3 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>LINE Official</span>
              <ExternalLink size={14} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => window.open('https://m.me/dhnotebook', '_blank', 'noopener,noreferrer')}
              className="flex-1 py-3 px-3 rounded-full bg-[#0084FF] hover:bg-[#0073e6] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Messenger</span>
              <ExternalLink size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* ปุ่มค้นหาบริการช่าง (SERVICE PROVIDERS) */}
          <button
            onClick={() => {
              onClose();
              navigate('/providers');
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200/80 transition-all active:scale-[0.99] cursor-pointer mb-2"
          >
            <Wrench size={15} className="text-brand" />
            <span>ค้นหาบริการช่าง (SERVICE PROVIDERS)</span>
          </button>

          {/* ปุ่มปิด: ดูรายการสินค้าในตะกร้าก่อน */}
          <button 
            onClick={onClose}
            className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-600 font-medium text-xs transition-colors cursor-pointer mt-1"
          >
            ดูรายการสินค้าในตะกร้าก่อน
          </button>

        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;
