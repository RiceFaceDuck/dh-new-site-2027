import React from 'react';
import { 
  Store, CreditCard, Package, History, 
  LogOut, Settings, Megaphone, Heart, ShoppingCart, ChevronRight, Loader2,
  Wallet, Coins, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ⚡ นำเข้า Service จัดการการเงินแบบ Real-time
import { useUserCredit, formatCredit } from '../../firebase/creditService';
import { useWalletBalance } from '../../firebase/walletService';

const MenuButton = ({ icon, label, active, onClick, badge }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3.5 md:p-4 text-xs font-bold uppercase tracking-widest transition-all border-l-[3px] rounded-r-xl mb-1 ${
      active 
        ? 'bg-indigo-50/80 text-indigo-700 border-indigo-600 shadow-[inset_4px_0_0_rgba(79,70,229,0.1)]' 
        : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-transparent hover:border-slate-300'
    }`}
  >
    <div className={`flex items-center gap-3 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
      {icon} 
      <span className="mt-0.5 tracking-wide">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {badge && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      )}
      {active && <ChevronRight size={16} className="text-indigo-600" />}
    </div>
  </button>
);

const ProfileSidebar = ({ user, activeTab, setActiveTab, handleLogout }) => {
  const navigate = useNavigate();

  // ⚡ ดึงข้อมูลเครดิตพอยต์ปัจจุบัน (และ Wallet) แบบ Real-time
  const { balance, tier, loading: creditLoading } = useUserCredit(user?.uid);
  const { walletBalance, pendingWithdrawal, loading: walletLoading } = useWalletBalance(user?.uid);

  return (
    <div className="space-y-4 md:space-y-6 sticky top-24">
      
      {/* 1. Partner ID Badge (Profile Card Summary) - ดีไซน์ Deep Luxury */}
      <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-5 text-center relative overflow-hidden group">
        
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-slate-500/10 blur-[40px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Avatar Icon */}
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 p-1 mb-3 flex items-center justify-center relative shadow-inner">
             {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover rounded-xl" />
             ) : (
                <Store size={32} className="text-indigo-400" />
             )}
          </div>
          
          <h2 className="text-base md:text-lg font-bold text-white tracking-wide truncate w-full px-2">
            {user?.storeName || user?.displayName || 'DH Partner'}
          </h2>
          <p className="text-[10px] text-slate-400 font-mono mt-1 mb-5 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
            ID: {user?.uid?.substring(0,8) || 'SYS-ADMIN'}
          </p>

          {/* Partner Stats Grid (คืนค่า Tier, Points, Orders ตามฉบับดั้งเดิม) */}
          <div className="grid grid-cols-4 gap-1 w-full border-t border-slate-800/80 pt-4">
            
            {/* 💎 ระดับ Tier */}
            <div className="flex flex-col items-center justify-center">
              <p className="text-[8px] text-slate-500 uppercase tracking-widest mb-1">Tier</p>
              {creditLoading ? (
                 <Loader2 size={12} className="animate-spin text-slate-400 mx-auto mt-1" />
              ) : (
                 <p className={`text-[10px] font-bold ${tier?.color ? tier.color.replace('text-', 'text-') : 'text-indigo-400'} uppercase truncate w-full`}>
                   {tier?.name || user?.stats?.level || 'MEMBER'}
                 </p>
              )}
            </div>

            {/* 🪙 เครดิตพอยต์ */}
            <div className="border-l border-slate-800 px-1 flex flex-col items-center justify-center">
              <p className="text-[8px] text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                Points
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              </p>
              {creditLoading ? (
                 <Loader2 size={14} className="animate-spin text-indigo-400 mx-auto mt-1" />
              ) : (
                 <p className={`text-xs font-black tracking-wider ${balance > 0 ? 'text-indigo-300' : 'text-slate-400'}`}>
                   {formatCredit(balance)}
                 </p>
              )}
            </div>

            {/* 🏦 Wallet (เพิ่มเข้ามาให้ครบระบบการเงิน) */}
            <div className="border-l border-slate-800 px-1 flex flex-col items-center justify-center">
              <p className="text-[8px] text-slate-500 uppercase tracking-widest mb-1">Wallet</p>
              {walletLoading ? (
                 <Loader2 size={14} className="animate-spin text-emerald-400 mx-auto mt-1" />
              ) : (
                 <p className={`text-xs font-black tracking-wider ${walletBalance > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                   {formatCredit(walletBalance)}
                 </p>
              )}
            </div>

            {/* 📦 ออเดอร์ */}
            <div className="border-l border-slate-800 px-1 flex flex-col items-center justify-center">
              <p className="text-[8px] text-slate-500 uppercase tracking-widest mb-1">Orders</p>
              <p className="text-xs font-bold text-white">
                {user?.stats?.totalOrders?.toLocaleString() || 0}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* 2. Control Menu Navigation (คืนค่าเมนูเดิมให้ครบ 100%) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
        <MenuButton 
          icon={<Store size={18} strokeWidth={2.5} />} 
          label="Overview" 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')} 
        />
        <MenuButton 
          icon={<CreditCard size={18} strokeWidth={2.5} />} 
          label="Wallet & Credit" 
          active={activeTab === 'wallet'} 
          onClick={() => setActiveTab('wallet')} 
          badge={pendingWithdrawal > 0}
        />
        <MenuButton 
          icon={<Package size={18} strokeWidth={2.5} />} 
          label="My SKU" 
          active={activeTab === 'usersku'} 
          onClick={() => setActiveTab('usersku')} 
        />
        <MenuButton 
          icon={<Megaphone size={18} strokeWidth={2.5} />} 
          label="Ad Manager" 
          active={activeTab === 'ads'} 
          onClick={() => setActiveTab('ads')} 
        />
        <MenuButton 
          icon={<History size={18} strokeWidth={2.5} />} 
          label="Order History" 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
        />
        <MenuButton 
          icon={<Heart size={18} strokeWidth={2.5} />} 
          label="Favorites" 
          active={activeTab === 'favorites'} 
          onClick={() => setActiveTab('favorites')} 
        />
        
        {/* ✨ ตะกร้าสินค้า */}
        <button 
          onClick={() => navigate('/cart')}
          className="w-full flex items-center justify-between p-3.5 md:p-4 text-xs font-bold uppercase tracking-widest transition-all border-l-[3px] bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-transparent hover:border-slate-300"
        >
          <div className="flex items-center gap-3 text-slate-400">
            <ShoppingCart size={18} strokeWidth={2.5} /> 
            <span className="text-slate-500 mt-0.5">Active Cart</span>
          </div>
        </button>

        {/* Divider & Action Buttons */}
        <div className="border-t border-slate-100 my-1 mx-4"></div>
        
        <button 
          className="w-full flex items-center p-3.5 md:p-4 text-xs font-bold uppercase tracking-widest transition-all bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        >
          <div className="flex items-center gap-3">
            <Settings size={18} strokeWidth={2.5} /> 
            <span className="mt-0.5">System Settings</span>
          </div>
        </button>

        <button 
          onClick={handleLogout} 
          className="w-full flex items-center p-3.5 md:p-4 text-xs font-bold uppercase tracking-widest transition-all bg-transparent text-slate-400 hover:bg-rose-50 hover:text-rose-600 group border-t border-slate-100"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="mt-0.5">Terminate Session</span>
          </div>
        </button>
      </div>

    </div>
  );
};

export default ProfileSidebar;