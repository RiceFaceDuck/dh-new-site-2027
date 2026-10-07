import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { 
  Loader2, ShieldCheck, UserCheck, RefreshCw, BadgeCheck, Mail, Calendar, 
  Wallet, Coins, MapPin, Phone
} from 'lucide-react';

// 🚀 นำเข้า Services ที่ได้รับการอัปเกรดแล้ว
import { userService } from '../../../firebase/userService';
import { useUserCredit, formatCredit } from '../../../firebase/creditService';
import { useWalletBalance } from '../../../firebase/walletService';
import { userDocumentSubscriptionManager, userProfileCache } from '../../../firebase/user/userDocumentSubscriptionManager';

// นำเข้า Forms ย่อย
import PersonalInfoForm from '../forms/PersonalInfoForm';
import SocialLinksForm from '../forms/SocialLinksForm';
import SupportSettings from '../forms/SupportSettings';

// 🛡️ Helper แปลงชื่อ Role ให้ถูกต้องทุกระดับสิทธิ์
const getRoleDisplayName = (data, authUser) => {
  const rawRole = (data?.role || data?.userType || authUser?.role || '').toString().toLowerCase().trim();
  
  if (rawRole === 'admin' || rawRole === 'แอดมิน') return 'ผู้ดูแลระบบ (Admin)';
  if (rawRole === 'owner' || rawRole === 'เจ้าของ') return 'เจ้าของระบบ (Owner)';
  if (rawRole === 'manager' || rawRole === 'ผู้จัดการ' || rawRole.includes('vp')) return 'ผู้จัดการ (Manager)';
  if (rawRole === 'ช่าง' || rawRole === 'technician') return 'ช่างเทคนิค (Technician)';
  if (rawRole === 'packer' || rawRole === 'พนักงานแพ็ค') return 'เจ้าหน้าที่แพ็ค (Packer)';
  if (rawRole === 'บัญชี' || rawRole === 'accountant') return 'เจ้าหน้าที่บัญชี (Accountant)';
  if (rawRole === 'staff' || rawRole === 'พนักงานทั่วไป' || data?.isStaff || authUser?.isStaff) return 'เจ้าหน้าที่ (Staff)';
  if (rawRole === 'partner' || rawRole === 'vip') return 'พาร์ทเนอร์ (Partner VIP)';
  if (rawRole === 'wholesale' || rawRole === 'ร้านช่าง') return 'ร้านช่าง / ราคาส่ง (Wholesale)';
  if (rawRole === 'enterprise') return 'คู่ค้าองค์กร (Enterprise)';
  
  return 'ผู้ใช้ทั่วไป (Member)';
};

export default function TabOverview({ user: propUser } = {}) {
  const auth = getAuth();
  const user = propUser || auth.currentUser;
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(() => {
    if (user?.uid) {
      return userProfileCache.getProfile(user.uid) || (propUser?.address ? propUser : null);
    }
    return null;
  });
  const [loading, setLoading] = useState(() => !profileData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ⚡ ดึงข้อมูลยอดเงินแบบ Real-time จาก Custom Hooks (ไม่เปลือง Reads)
  const { balance: creditBalance, tier } = useUserCredit(user?.uid);
  const { walletBalance, pendingWithdrawal } = useWalletBalance(user?.uid);

  // ⚡ ซิงค์ข้อมูล Profile แบบ Real-time ผ่าน Subscription Manager (Zero Read Quota Leak)
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = userDocumentSubscriptionManager.subscribe(user.uid, (data) => {
      if (data) {
        setProfileData(data);
      } else if (propUser) {
        setProfileData(propUser);
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?.uid, propUser]);

  const handleRefresh = async () => {
    if (!user?.uid) return;
    setIsRefreshing(true);
    try {
      const data = await userService.getUserProfile(user.uid, true);
      if (data) setProfileData(data);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setIsRefreshing(false);
    }
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
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200 shadow-xs">
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
        <div 
          onClick={() => navigate('/profile?tab=wallet')}
          className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-slate-700/50 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          title="คลิกเพื่อดูประวัติและทำรายการ"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/30 transition-colors"></div>
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
              <div className="bg-white/10 backdrop-blur-xs border border-white/10 px-3 py-1.5 rounded-lg text-right">
                <p className="text-[9px] text-amber-300 uppercase font-bold tracking-wider mb-0.5">กำลังรอถอน</p>
                <p className="text-xs font-mono font-bold text-amber-400">฿ {formatCredit(pendingWithdrawal)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Credit Points Card */}
        <div 
          onClick={() => navigate('/profile?tab=credit')}
          className="bg-linear-to-br from-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-indigo-900/50 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          title="คลิกเพื่อดูประวัติและทำรายการ"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>
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
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-xs ${tier?.bg} ${tier?.border} ${tier?.color}`}>
              <span className="text-sm">{tier?.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-wider">{tier?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          Section 2: User Summary Info
      ========================================== */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200/90 overflow-hidden relative">
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all disabled:opacity-50"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <div className="p-6 border-b border-slate-200/80 bg-slate-50/90">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            ข้อมูลผู้ใช้งาน (Account Summary)
          </h3>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shrink-0 text-indigo-600 shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">อีเมลบัญชี</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{user?.email || '-'}</span>
                {user?.emailVerified ? (
                  <BadgeCheck className="w-4 h-4 text-emerald-500" title="ยืนยันอีเมลแล้ว" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="รอการยืนยันอีเมล"></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shrink-0 text-indigo-600 shadow-xs">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">เบอร์โทรศัพท์</p>
              <span className="text-sm font-semibold text-slate-800">{profileData?.phoneNumber || 'ยังไม่ได้ระบุ'}</span>
            </div>
          </div>

          <div className="flex items-start gap-3.5 md:col-span-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shrink-0 text-indigo-600 shadow-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ที่อยู่จัดส่งเริ่มต้น</p>
              <span className="text-sm font-semibold text-slate-800">{getFormattedAddress()}</span>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shrink-0 text-indigo-600 shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">สมัครสมาชิกเมื่อ</p>
              <span className="text-sm font-semibold text-slate-800">
                {user?.metadata?.creationTime 
                  ? new Date(user.metadata.creationTime).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) 
                  : '-'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shrink-0 text-indigo-600 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ระดับสิทธิ์ (Role)</p>
              <span className="text-sm font-semibold text-slate-800">
                {getRoleDisplayName(profileData, user)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          Section 3: Forms 
      ========================================== */}
      <PersonalInfoForm user={user} initialData={profileData} />
      <SocialLinksForm user={user} initialData={profileData} />
      {(profileData?.role === 'partner' || user?.role === 'partner') && (
        <SupportSettings user={user} initialData={profileData} />
      )}

    </div>
  );
}