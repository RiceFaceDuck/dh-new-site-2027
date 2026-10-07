import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

/**
 * 🏬 PartnerHubCard (อัปเกรดจาก SupportSettings เดิม)
 * เชื่อมโยงพาร์ทเนอร์เข้าสู่ศูนย์จัดการร้านค้าจริง (Ads & Marketing / Store Profile)
 * ซึ่งเป็น Single Source of Truth (SSOT) ร่วมกับ ActivePartners และระบบเรดาร์
 */
export default function SupportSettings({ user, initialData }) {
  const navigate = useNavigate();

  return (
    <div className="bg-linear-to-br from-slate-900 to-indigo-950 rounded-2xl shadow-lg border border-slate-700/60 p-6 text-white relative overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">ศูนย์บริการพาร์ทเนอร์และเรดาร์ร้านค้า</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> PARTNER HUB
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                เปิดรับงานสนับสนุน ปักหมุดเรดาร์ และจัดการนามบัตรโฆษณาในระบบ DH Notebook
              </p>
            </div>
          </div>
        </div>

        {/* Feature List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-white/5 border border-white/10 rounded-xl p-3">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>แสดงร้านค้าบนเรดาร์ค้นหาใกล้เคียง (Providers Radar)</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-white/5 border border-white/10 rounded-xl p-3">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>รับงานตรวจเช็คและบริการหลังการขายจากลูกค้าโดยตรง</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/profile?tab=ads')}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span>จัดการร้านค้าและการสนับสนุน</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}