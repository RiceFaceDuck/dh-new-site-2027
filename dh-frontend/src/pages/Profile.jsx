import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // 🆕 นำเข้า Firestore
import { db } from '../firebase/config'; // 🆕 นำเข้า Database Config
import { logoutUser } from '../firebase/authService'; // 🆕 นำเข้าฟังก์ชัน Logout ที่ถูกต้อง

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

import { Terminal, ShieldAlert, LogOut, Activity, RefreshCw } from 'lucide-react';

const Profile = () => {
  // 1. อ่านค่า Tab จาก URL (ค่าเริ่มต้นคือ overview)
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const [isLogin, setIsLogin] = useState(true);
  const [authUser, setAuthUser] = useState(null); 
  const [userProfile, setUserProfile] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // States สำหรับ UX Gimmicks
  const [currentTime, setCurrentTime] = useState(new Date()); 
  const [isRefreshing, setIsRefreshing] = useState(false);

  const auth = getAuth();

  // 2. ตรวจสอบสถานะการล็อกอิน
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        await fetchUserProfile(user.uid);
      } else {
        setAuthUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // 3. ซิงค์ State ของ Tab กับ URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // 4. นาฬิกา Realtime สำหรับหน้า Control Center
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ฟังก์ชันดึงข้อมูล Profile (ดึงตรงจาก Firestore)
  const fetchUserProfile = async (uid) => {
    setIsRefreshing(true);
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setUserProfile(userSnap.data());
      } else {
        console.warn("ไม่พบข้อมูลโปรไฟล์ในระบบ");
        setUserProfile(null);
      }
    } catch (error) {
      console.error("🔥 Error fetching profile:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // ฟังก์ชันสลับ Tab พร้อมอัปเดต URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }); 
  };

  const handleLogout = async () => {
    try {
      await logoutUser(); // 🆕 เรียกใช้ฟังก์ชันที่นำเข้ามาอย่างถูกต้อง
    } catch (error) {
      console.error("Logout Error", error);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  // --- UI Renders ---

  // 1. หน้าจอตอนกำลังตรวจสอบสถานะ (Tech Loader)
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] w-full">
         <div className="w-16 h-16 border-2 border-slate-200 border-t-cyber-emerald rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
         <p className="text-xs font-tech tracking-widest text-slate-500 uppercase animate-pulse">Initializing Partner Protocol...</p>
      </div>
    );
  }

  // 2. หน้าจอเมื่อไม่ได้ล็อคอิน (แสดงฟอร์ม Auth)
  if (!authUser) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8 md:py-12 animate-fade-in-up">
        <AuthForm isLogin={isLogin} setIsLogin={setIsLogin} />
      </div>
    );
  }

  // 3. หน้าจอเมื่อล็อคอินแล้วแต่ดึง Profile ไม่สำเร็จ (Data Missing)
  if (!userProfile) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-center px-4 animate-fade-in-up relative">
        <div className="absolute inset-0 bg-tech-grid opacity-5 pointer-events-none"></div>
        
        <ShieldAlert size={56} className="text-red-500 mb-4 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2 font-tech uppercase tracking-wider">Profile Data Corrupted</h2>
        <p className="text-slate-500 mb-8 text-sm max-w-md">ระบบไม่สามารถดึงข้อมูลโปรไฟล์พาร์ทเนอร์ของคุณได้ อาจเกิดจากการเชื่อมต่อขัดข้อง หรือบัญชีนี้ยังไม่มีข้อมูลในระบบฐานข้อมูล</p>
        
        <div className="flex flex-wrap justify-center items-center gap-4 z-10">
          <button 
            onClick={() => fetchUserProfile(authUser.uid)} 
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-cyber-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-sm font-bold font-tech tracking-wider uppercase text-xs transition-all shadow-[0_0_10px_rgba(56,189,248,0.4)] hover:shadow-[0_0_15px_rgba(56,189,248,0.6)] disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? 'Reconnecting...' : 'Retry Connection'}
          </button>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 bg-slate-800 hover:bg-red-600 text-white px-6 py-2.5 rounded-sm font-bold font-tech tracking-wider uppercase text-xs transition-all shadow-sm group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform"/>
            Force Logout
          </button>
        </div>
      </div>
    );
  }

  // 4. หน้าศูนย์ควบคุมหลัก (Control Center Layout)
  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 py-4 md:py-8 min-h-[80vh] animate-fade-in-up">
      
      {/* 🚀 Header ของหน้า Profile */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-4 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 w-1 h-full bg-cyber-emerald"></div>
        
         <div className="flex items-center gap-4 ml-2">
           <div className="p-2 bg-slate-50 rounded-sm border border-slate-100">
             <Terminal size={28} className="text-cyber-blue" />
           </div>
           <div>
             <div className="flex items-center gap-2 mb-1">
               <span className="flex h-2 w-2 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-emerald opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-emerald"></span>
               </span>
               <span className="text-[10px] text-cyber-emerald font-tech uppercase tracking-widest font-bold">System Online</span>
             </div>
             <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-tech uppercase tracking-wide leading-none">Partner Control Center</h1>
             <p className="text-xs text-slate-500 font-tech tracking-wider mt-1">
               {getGreeting()}, <span className="text-cyber-blue font-bold">{userProfile?.name || 'PARTNER'}</span>
             </p>
           </div>
         </div>

         {/* ข้อมูล Tech Stats (เวลา/Session) */}
         <div className="flex items-center gap-4 text-right ml-2 md:ml-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
           <div className="hidden sm:block">
             <p className="text-[10px] text-slate-400 font-tech uppercase tracking-widest mb-1">Session ID</p>
             <p className="text-xs text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded-sm">{authUser.uid.substring(0, 12)}</p>
           </div>
           <div>
             <p className="text-[10px] text-slate-400 font-tech uppercase tracking-widest mb-1">Local Time</p>
             <p className="text-xs text-slate-700 font-mono flex items-center gap-1 justify-end">
                <Activity size={12} className="text-cyber-emerald"/>
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
             </p>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* 🗂 Sidebar ด้านซ้าย (เมนูควบคุม) */}
        <div className="lg:col-span-1">
          <ProfileSidebar 
            user={userProfile} 
            activeTab={activeTab} 
            setActiveTab={handleTabChange} 
            handleLogout={handleLogout} 
          />
        </div>

        {/* 🖥 เนื้อหาหลัก ด้านขวา (Dashboard Area) */}
        <div className="lg:col-span-3">
           <div className="bg-white rounded-sm shadow-tech-card border border-slate-200 p-4 md:p-6 min-h-[600px] relative overflow-hidden group">
             
             {/* เส้นขอบตกแต่งด้านบน */}
             <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyber-emerald via-cyber-blue to-transparent opacity-80"></div>
             
             {/* Tech Grid Background */}
             <div className="absolute inset-0 bg-tech-grid opacity-[0.03] pointer-events-none"></div>

             {/* Content Area */}
             <div className="relative z-10 animate-fade-in" key={activeTab}>
               {activeTab === 'overview' && <TabOverview userProfile={userProfile} />}
               {activeTab === 'wallet' && <TabWallet stats={userProfile?.stats || {}} />}
               {activeTab === 'usersku' && <TabUserSku userId={userProfile?.uid} />}
               {activeTab === 'ads' && <TabAdManager />}
               {activeTab === 'history' && <TabHistory userId={userProfile?.uid} />}
               {activeTab === 'favorites' && <TabFavorites />}
             </div>
             
           </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;