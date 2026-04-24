import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { authService } from '../firebase/authService';

// 🚀 นำเข้า Components หลัก
import AuthForm from '../components/profile/AuthForm';
import ProfileSidebar from '../components/profile/ProfileSidebar';

// 🚀 นำเข้าเนื้อหาแต่ละ Tabs
import TabOverview from '../components/profile/tabs/TabOverview';
import TabWallet from '../components/profile/tabs/TabWallet';
import TabUserSku from '../components/profile/tabs/TabUserSku';
import TabAdManager from '../components/profile/tabs/TabAdManager';
import TabHistory from '../components/profile/tabs/TabHistory';
import TabFavorites from '../components/profile/tabs/TabFavorites';

import { Terminal, ShieldAlert, LogOut } from 'lucide-react';

const Profile = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authUser, setAuthUser] = useState(null); 
  const [userProfile, setUserProfile] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const auth = getAuth();

  // 1. ตรวจสอบสถานะการล็อกอินทุกครั้งที่เข้าหน้าเว็บ
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        try {
          // ดึงข้อมูล Profile แบบเต็มจาก Firestore
          const profileData = await authService.getUserProfile(user.uid);
          setUserProfile(profileData);
        } catch (error) {
          console.error("🔥 Error fetching profile:", error);
        }
      } else {
        setAuthUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // 2. ฟังก์ชันออกจากระบบ
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout Error", error);
    }
  };

  // --- UI Renders ---

  // หน้าจอตอนกำลังตรวจสอบสถานะ (Tech Loader)
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] w-full">
         <div className="w-16 h-16 border-2 border-slate-200 border-t-cyber-emerald rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
         <p className="text-xs font-tech tracking-widest text-slate-500 uppercase animate-pulse">Initializing Partner Protocol...</p>
      </div>
    );
  }

  // หน้าจอเมื่อไม่ได้ล็อคอิน (แสดงฟอร์ม Auth)
  if (!authUser) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8 md:py-12 animate-fade-in-up">
        <AuthForm isLogin={isLogin} setIsLogin={setIsLogin} />
      </div>
    );
  }

  // หน้าจอเมื่อล็อคอินแล้วแต่ดึง Profile ไม่สำเร็จ (Data Missing)
  if (!userProfile) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-center px-4 animate-fade-in-up">
        <ShieldAlert size={48} className="text-red-500 mb-4 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
        <h2 className="text-xl font-bold text-slate-800 mb-2 font-tech uppercase tracking-wider">Profile Data Corrupted</h2>
        <p className="text-slate-500 mb-6 text-sm">ระบบไม่สามารถดึงข้อมูลโปรไฟล์พาร์ทเนอร์ของคุณได้ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ</p>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 bg-slate-800 hover:bg-red-600 text-white px-6 py-2.5 rounded-sm font-bold font-tech tracking-wider uppercase text-xs transition-all shadow-sm group"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform"/>
          Force Logout
        </button>
      </div>
    );
  }

  // หน้าศูนย์ควบคุมหลัก (Control Center Layout)
  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 py-4 md:py-8 min-h-[80vh] animate-fade-in-up">
      
      {/* Header ของหน้า Profile */}
      <div className="mb-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
           <Terminal size={24} className="text-cyber-blue" />
           <div>
             <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-tech uppercase tracking-wide leading-none">Partner Control Center</h1>
             <p className="text-[10px] md:text-xs text-slate-500 font-tech uppercase tracking-widest mt-1">ID: {authUser.uid.substring(0, 12)}...</p>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* 🗂 Sidebar ด้านซ้าย (เมนูควบคุม) */}
        <div className="lg:col-span-1">
          <ProfileSidebar 
            user={userProfile} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            handleLogout={handleLogout} 
          />
        </div>

        {/* 🖥 เนื้อหาหลัก ด้านขวา (Dashboard Area) */}
        <div className="lg:col-span-3">
           <div className="bg-white rounded-sm shadow-tech-card border border-slate-200 p-4 md:p-6 min-h-[600px] relative overflow-hidden group">
             
             {/* เส้นขอบตกแต่งด้านบน (Top accent line) */}
             <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyber-emerald via-cyber-blue to-transparent opacity-80"></div>
             
             {/* Tech Grid Background (จางมาก เพื่อให้สะอาดตา) */}
             <div className="absolute inset-0 bg-tech-grid opacity-10 pointer-events-none"></div>

             <div className="relative z-10">
               {activeTab === 'overview' && <TabOverview userProfile={userProfile} />}
               {activeTab === 'wallet' && <TabWallet stats={userProfile.stats} />}
               {activeTab === 'usersku' && <TabUserSku userId={userProfile.uid} />}
               {activeTab === 'ads' && <TabAdManager />}
               {activeTab === 'history' && <TabHistory userId={userProfile.uid} />}
               {activeTab === 'favorites' && <TabFavorites />}
             </div>
             
           </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;