import React from 'react';
import { 
  Store, CreditCard, Package, History, 
  LogOut, Settings, Megaphone, Heart, ShoppingCart, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MenuButton = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3.5 md:p-4 text-sm font-bold transition-all border-l-4 ${active ? 'bg-emerald-50/40 text-emerald-700 border-emerald-500' : 'bg-transparent text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-300'}`}
  >
    <div className="flex items-center gap-3">{icon} {label}</div>
    {active && <ChevronRight size={16} className="text-emerald-500" />}
  </button>
);

const ProfileSidebar = ({ user, activeTab, setActiveTab, handleLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Profile Card Summary */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-5 text-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 opacity-90 transition-transform duration-500 group-hover:scale-105"></div>
        
        <div className="relative z-10 flex flex-col items-center mt-6">
          <div className="relative">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover mb-3" />
            ) : (
              <div className="w-24 h-24 bg-white border-4 border-gray-50 text-emerald-600 rounded-full flex items-center justify-center font-black text-4xl shadow-md mb-3">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'DH'}
              </div>
            )}
            <button className="absolute bottom-3 right-0 bg-gray-800 text-white p-1.5 rounded-full border-2 border-white hover:bg-emerald-600 transition-colors shadow-sm">
              <Settings size={14} />
            </button>
          </div>

          <h3 className="text-base font-bold text-gray-800 mb-1">{user?.displayName || 'ผู้ใช้งานทั่วไป'}</h3>
          <p className="text-[11px] font-medium text-gray-500 mb-4 bg-gray-50 px-2 py-0.5 rounded-full">{user?.email}</p>
          
          <div className="w-full text-left bg-gray-50 p-3 rounded-xl border border-gray-100 mb-2">
            <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1.5">
              <span>ยอดสะสมเดือนนี้</span>
              <span className="text-emerald-600">฿12,500 / ฿50K</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '25%' }}></div>
            </div>
            <p className="text-[9px] text-gray-400 mt-1.5 text-center">อีก ฿37,500 เพื่อรับ Badges ถัดไป</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden sticky top-24">
        <MenuButton 
          icon={<Store size={18} strokeWidth={2.5} />} 
          label="ข้อมูลร้านค้า" 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')} 
        />
        <MenuButton 
          icon={<CreditCard size={18} strokeWidth={2.5} />} 
          label="การเงิน & เครดิต" 
          active={activeTab === 'wallet'} 
          onClick={() => setActiveTab('wallet')} 
        />
        <MenuButton 
          icon={<Package size={18} strokeWidth={2.5} />} 
          label="สินค้าของฉัน (User SKU)" 
          active={activeTab === 'sku'} 
          onClick={() => setActiveTab('sku')} 
        />
        {/* ✨ เมนูใหม่: จัดการโฆษณา & การสนับสนุน */}
        <MenuButton 
          icon={<Megaphone size={18} strokeWidth={2.5} />} 
          label="พื้นที่โฆษณา & สนับสนุน" 
          active={activeTab === 'ads'} 
          onClick={() => setActiveTab('ads')} 
        />
        <MenuButton 
          icon={<History size={18} strokeWidth={2.5} />} 
          label="ประวัติออเดอร์" 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
        />
        <MenuButton 
          icon={<Heart size={18} strokeWidth={2.5} />} 
          label="สินค้าที่ถูกใจ" 
          active={activeTab === 'favorites'} 
          onClick={() => setActiveTab('favorites')} 
        />
        {/* ✨ กู้คืน: ตะกร้าสินค้า (ลิงก์ไปยังหน้าตะกร้าโดยตรง) */}
        <button 
          onClick={() => navigate('/cart')}
          className="w-full flex items-center justify-between p-3.5 md:p-4 text-sm font-bold transition-all border-l-4 bg-transparent text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-300"
        >
          <div className="flex items-center gap-3"><ShoppingCart size={18} strokeWidth={2.5} /> ตะกร้าสินค้า</div>
        </button>

        <div className="border-t border-gray-100 my-1"></div>
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 p-4 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
        >
          <LogOut size={18} strokeWidth={2.5} /> ออกจากระบบ
        </button>
      </div>
    </div>
  );
};

export default ProfileSidebar;