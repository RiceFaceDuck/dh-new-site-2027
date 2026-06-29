import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { 
  Loader2, ShieldCheck, UserCheck, RefreshCw, BadgeCheck, Mail, Calendar, 
  Wallet, Coins, MapPin, Phone, Building2, Award
} from 'lucide-react';

// 🚀 นำเข้า Services ที่ได้รับการอัปเกรดแล้ว
import { userService } from '../../../firebase/userService';
import { useUserCredit, formatCredit } from '../../../firebase/creditService';
import { useWalletBalance } from '../../../firebase/walletService';

// นำเข้า Forms ย่อย
import PersonalInfoForm from '../forms/PersonalInfoForm';
import SocialLinksForm from '../forms/SocialLinksForm';
import SupportSettings from '../forms/SupportSettings';

export default function TabOverview() {
  const auth = getAuth();
  const user = auth.currentUser;
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ⚡ ดึงข้อมูลยอดเงินแบบ Real-time จาก Custom Hooks (ไม่เปลือง Reads)
  const { balance: creditBalance, tier } = useUserCredit(user?.uid);
  const { walletBalance, pendingWithdrawal } = useWalletBalance(user?.uid);

  // ⚡ ดึงข้อมูล Profile ผ่าน Smart Cache
  const fetchProfile = useCallback(async (forceRefresh = false) => {
    if (!user?.uid) return;
    setIsRefreshing(true);
    try {
      // ใช้ getUserProfile ซึ่งมีระบบ Cache ในตัว ประหยัด Reads
      const data = await userService.getUserProfile(user.uid, forceRefresh);
      setProfileData(data || {});
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfileData({});
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile(false);
  }, [fetchProfile]);

  const handleRefresh = () => {
    fetchProfile(true); // บังคับโหลดใหม่ข้าม Cache
  };

  // 🛠 ฟังก์ชันตัวช่วยแปลงที่อยู่จาก Object (เวอร์ชันใหม่) เป็น String
  const getFormattedAddress = () => {
    const addr = profileData?.address;
    if (!addr) return 'ยังไม่ได้ระบุข้อมูลที่อยู่';
    if (typeof addr === 'string') return addr; // รองรับข้อมูลเก่า
    
    const parts = [addr.addressLine, addr.subDistrict, addr.district, addr.province, addr.zipCode].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'ยังไม่ได้ระบุข้อมูลที่อยู่';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200 shadow-sm">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">กำลังซิงค์ข้อมูลโปรไฟล์...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ==========================================
          Section 1: Financial Dashboard (Deep Luxury)
      ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wallet Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-slate-700/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <Wallet className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">DH Wallet</h3>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl font-black font-mono">฿ {formatCredit(walletBalance)}</span>
              </div>
            </div>
            {pendingWithdrawal > 0 && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-lg text-right">
                <p className="text-[9px] text-amber-300 uppercase font-bold tracking-wider mb-0.5">กำลังรอถอน</p>
                <p className="text-xs font-mono font-bold text-amber-400">฿ {formatCredit(pendingWithdrawal)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Credit Points Card */}
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-indigo-900/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-300">
                <Coins className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Credit Points</h3>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl font-black font-mono text-indigo-50">{formatCredit(creditBalance)} <span className="text-sm font-medium text-indigo-400">Pts</span></span>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm ${tier?.bg} ${tier?.border} ${tier?.color}`}>
              <span className="text-sm">{tier?.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-wider">{tier?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          Section 2: User Summary Info
      ========================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden relative">
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all disabled:opacity-50"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            ข้อมูลผู้ใช้งาน (Account Summary)
          </h3>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">อีเมลบัญชี</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800">{user?.email || '-'}</span>
                {user?.emailVerified ? (
                  <BadgeCheck className="w-4 h-4 text-emerald-500" title="ยืนยันอีเมลแล้ว" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="รอการยืนยันอีเมล"></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">เบอร์โทรศัพท์</p>
              <span className="text-sm font-medium text-slate-800">{profileData?.phoneNumber || 'ยังไม่ได้ระบุ'}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 md:col-span-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ที่อยู่จัดส่งเริ่มต้น</p>
              <span className="text-sm font-medium text-slate-800">{getFormattedAddress()}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">สมัครสมาชิกเมื่อ</p>
              <span className="text-sm font-medium text-slate-800">
                {user?.metadata?.creationTime 
                  ? new Date(user.metadata.creationTime).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) 
                  : '-'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ระดับสิทธิ์ (Role)</p>
              <span className="text-sm font-medium text-slate-800">
                {profileData?.role === 'partner' ? 'พาร์ทเนอร์ (Partner)' : 'ผู้ใช้ทั่วไป (Member)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          Section 3: Forms 
      ========================================== */}
      <PersonalInfoForm user={user} initialData={profileData} onRefresh={handleRefresh} />
      <SocialLinksForm user={user} initialData={profileData} onRefresh={handleRefresh} />
      {profileData?.role === 'partner' && (
        <SupportSettings user={user} initialData={profileData} onRefresh={handleRefresh} />
      )}

      {/* ==========================================
          Section 4: Danger Zone (PDPA - Right to be Forgotten)
      ========================================== */}
      <div className="bg-rose-50 rounded-2xl shadow-sm border border-rose-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-rose-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
              ⚠️ การจัดการบัญชี (Danger Zone)
            </h3>
            <p className="text-sm text-rose-600 mt-1">ลบข้อมูลส่วนบุคคลและประวัติทั้งหมดออกจากระบบอย่างถาวร</p>
          </div>
          <button 
            onClick={async () => {
              if (window.confirm('คำเตือน: คุณต้องการลบบัญชีและข้อมูลทั้งหมดออกจากระบบอย่างถาวรใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถยกเลิกหรือกู้คืนข้อมูลได้!')) {
                try {
                  await userService.deleteAccount(user, walletBalance);
                  window.location.href = '/'; // Redirect to home
                } catch (error) {
                  alert(error.message);
                }
              }
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm transition-all text-sm"
          >
            ลบบัญชีถาวร
          </button>
        </div>
      </div>

    </div>
  );
}