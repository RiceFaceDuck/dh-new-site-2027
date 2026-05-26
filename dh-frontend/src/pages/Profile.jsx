import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// 📦 นำเข้า Components
import ProfileSidebar from '../components/profile/ProfileSidebar';
import TabOverview from '../components/profile/tabs/TabOverview';
import TabWallet from '../components/profile/tabs/TabWallet';
import TabAdManager from '../components/profile/tabs/TabAdManager'; // 🚀 ศูนย์รวมโฆษณาใหม่
import TabHistory from '../components/profile/tabs/TabHistory';
import TabFavorites from '../components/profile/tabs/TabFavorites';
import AuthForm from '../components/profile/AuthForm';
import { Loader2 } from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  
  // 🛡️ ป้องกัน AppID ไม่พร้อมใช้งาน
  const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

  // 1. ตรวจสอบการ Login และดึงข้อมูลผู้ใช้
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUser({ ...currentUser, ...userSnap.data() });
          } else {
            setUser(currentUser);
          }
        } catch (error) {
          console.error("🔥 Error fetching user data:", error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, appId]);

  // 2. 🧠 Smart URL Routing
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tab = queryParams.get('tab');
    if (tab) {
      // 🚀 HOTFIX: ป้องกันแอปล่มจากบุ๊กมาร์กเก่า (เปลี่ยน usersku เป็น ads)
      if (tab === 'usersku') {
        setActiveTab('ads');
        navigate('/profile?tab=ads', { replace: true }); // เขียนทับ URL เก่าทันที
      } else {
        setActiveTab(tab);
      }
    }
  }, [location, navigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('🔥 Error signing out:', error);
    }
  };

  // 🌀 Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Loading Profile...</p>
      </div>
    );
  }

  // 🔒 Not Logged In State
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 animate-in fade-in zoom-in-95 duration-500">
        <AuthForm onLogin={() => setLoading(true)} />
      </div>
    );
  }

  // 🎮 Render Content ตามเมนูที่เลือก
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TabOverview user={user} />;
      case 'wallet':
        return <TabWallet user={user} />;
      case 'ads':
        // 🚀 เรียกใช้ Unified Ad Manager แทนที่ระบบ My SKU เก่าทั้งหมด
        return <TabAdManager user={user} />;
      case 'history':
        return <TabHistory user={user} />;
      case 'favorites':
        return <TabFavorites user={user} />;
      default:
        return <TabOverview user={user} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* 📚 Sidebar Navigation */}
        <div className="w-full lg:w-1/4">
          <ProfileSidebar 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={handleTabChange} 
            handleLogout={handleLogout}
          />
        </div>
        
        {/* 📺 Main Content Area */}
        <div className="w-full lg:w-3/4">
          {renderTabContent()}
        </div>
        
      </div>
    </div>
  );
};

export default Profile;