import React from 'react';
import { 
  Store, CreditCard, Package, History, 
  LogOut, Settings, Megaphone, Heart, ShoppingCart, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MenuButton = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3.5 md:p-4 text-xs font-bold uppercase tracking-widest transition-all border-l-2 ${
      active 
        ? 'bg-emerald-500/10 text-cyber-emerald border-cyber-emerald shadow-[inset_4px_0_0_rgba(16,185,129,0.2)]' 
        : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-transparent hover:border-slate-300'
    }`}
  >
    <div className={`flex items-center gap-3 ${active ? 'text-cyber-emerald' : 'text-slate-400'}`}>
      {icon} 
      <span className="font-tech mt-0.5">{label}</span>
    </div>
    {active && <ChevronRight size={16} className="text-cyber-emerald" />}
  </button>
);

const ProfileSidebar = ({ user, activeTab, setActiveTab, handleLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 md:space-y-6">
      
      {/* 1. Partner ID Badge (Profile Card Summary) */}
      <div className="bg-slate-900 rounded-sm shadow-tech-card border border-slate-800 p-5 text-center relative overflow-hidden group">
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-tech-grid-dark opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyber-emerald via-cyber-blue to-transparent"></div>
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-cyber-emerald/10 blur-[40px] rounded-full"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Avatar Icon */}
          <div className="w-16 h-16 rounded-sm bg-slate-800 border border-slate-700 p-1 mb-3 flex items-center justify-center relative shadow-glow-emerald">
             <Store size={32} className="text-cyber-emerald" />
          </div>
          
          <h2 className="text-base md:text-lg font-bold text-white tracking-wide">
            {user?.storeName || 'DH Partner'}
          </h2>
          <p className="text-[10px] text-slate-400 font-tech mt-1 mb-5 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded-sm border border-slate-700">
            ID: {user?.uid?.substring(0,8) || 'SYS-ADMIN'}
          </p>

          {/* Partner Stats Grid */}
          <div className="grid grid-cols-3 gap-2 w-full border-t border-slate-800 pt-4">
            <div>
              <p className="text-[9px] text-slate-500 font-tech uppercase tracking-widest mb-1">Tier</p>
              <p className="text-[11px] font-bold text-cyber-blue font-tech uppercase">
                {user?.stats?.level || 'STANDARD'}
              </p>
            </div>
            <div className="border-x border-slate-800 px-1">
              <p className="text-[9px] text-slate-500 font-tech uppercase tracking-widest mb-1">Points</p>
              <p className="text-[11px] font-bold text-amber-500 font-tech">
                {user?.stats?.points?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-tech uppercase tracking-widest mb-1">Orders</p>
              <p className="text-[11px] font-bold text-white font-tech">
                {user?.stats?.totalOrders?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control Menu Navigation */}
      <div className="bg-white rounded-sm shadow-tech-card border border-slate-200 overflow-hidden flex flex-col">
        <MenuButton 
          icon={<Store size={18} strokeWidth={2} />} 
          label="Overview" 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')} 
        />
        <MenuButton 
          icon={<CreditCard size={18} strokeWidth={2} />} 
          label="Wallet & Credit" 
          active={activeTab === 'wallet'} 
          onClick={() => setActiveTab('wallet')} 
        />
        <MenuButton 
          icon={<Package size={18} strokeWidth={2} />} 
          label="My SKU" 
          active={activeTab === 'usersku'} 
          onClick={() => setActiveTab('usersku')} 
        />
        <MenuButton 
          icon={<Megaphone size={18} strokeWidth={2} />} 
          label="Ad Manager" 
          active={activeTab === 'ads'} 
          onClick={() => setActiveTab('ads')} 
        />
        <MenuButton 
          icon={<History size={18} strokeWidth={2} />} 
          label="Order History" 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
        />
        <MenuButton 
          icon={<Heart size={18} strokeWidth={2} />} 
          label="Favorites" 
          active={activeTab === 'favorites'} 
          onClick={() => setActiveTab('favorites')} 
        />
        
        {/* ✨ ตะกร้าสินค้า (ลิงก์ไปยังหน้าตะกร้าโดยตรง) */}
        <button 
          onClick={() => navigate('/cart')}
          className="w-full flex items-center justify-between p-3.5 md:p-4 text-xs font-bold font-tech uppercase tracking-widest transition-all border-l-2 bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-transparent hover:border-slate-300"
        >
          <div className="flex items-center gap-3 text-slate-400">
            <ShoppingCart size={18} strokeWidth={2} /> 
            <span className="text-slate-500 mt-0.5">Active Cart</span>
          </div>
        </button>

        {/* Divider & Action Buttons */}
        <div className="border-t border-slate-100 my-1 mx-4"></div>
        
        <button 
          className="w-full flex items-center p-3.5 md:p-4 text-xs font-bold font-tech uppercase tracking-widest transition-all bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        >
          <div className="flex items-center gap-3">
            <Settings size={18} strokeWidth={2} /> 
            <span className="mt-0.5">System Settings</span>
          </div>
        </button>

        <button 
          onClick={handleLogout} 
          className="w-full flex items-center p-3.5 md:p-4 text-xs font-bold font-tech uppercase tracking-widest transition-all bg-transparent text-slate-400 hover:bg-red-50 hover:text-red-600 group border-t border-slate-100"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} strokeWidth={2} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="mt-0.5">Terminate Session</span>
          </div>
        </button>
      </div>

    </div>
  );
};

export default ProfileSidebar;