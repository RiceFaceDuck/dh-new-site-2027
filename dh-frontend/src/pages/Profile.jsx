import { useState, useEffect } from 'react';
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
import TabClaims from '../components/profile/tabs/TabClaims';
import TabPrivacy from '../components/profile/tabs/TabPrivacy';
import AuthForm from '../components/profile/AuthForm';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { currentUser: authUser, loading: authLoading, logout: authLogout } = useAuth();
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
          const userRef = doc(db, getCollectionPath('users'), currentUser.uid);
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
      if (authLogout) {
        await authLogout();
      } else {
        await signOut(auth);
      }
      navigate('/');
    } catch (error) {
      console.error('🔥 Error signing out:', error);
    }
  };

  const effectiveUser = user || authUser;
  const isScreenLoading = loading && authLoading && !effectiveUser;

  // 🌀 Loading State
  if (isScreenLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Skeleton */}
          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
            <div className="bg-slate-200 h-32 rounded-2xl w-full"></div>
            <div className="bg-slate-200 h-10 rounded-xl w-full"></div>
            <div className="bg-slate-200 h-10 rounded-xl w-full"></div>
            <div className="bg-slate-200 h-10 rounded-xl w-full"></div>
            <div className="bg-slate-200 h-10 rounded-xl w-full mt-8"></div>
          </div>
          {/* Main Content Skeleton */}
          <div className="flex-1 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xs">
            <div className="h-8 bg-slate-200 rounded-md w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="h-24 bg-slate-200 rounded-2xl w-full"></div>
              <div className="h-24 bg-slate-200 rounded-2xl w-full"></div>
            </div>
            <div className="h-40 bg-slate-200 rounded-2xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // 🔒 Not Logged In State
  if (!effectiveUser) {
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
        return <TabOverview user={effectiveUser} />;
      case 'wallet':
        return <TabWallet user={effectiveUser} type="wallet" />;
      case 'credit':
        return <TabWallet user={effectiveUser} type="credit" />;
      case 'ads':
        // 🚀 เรียกใช้ Unified Ad Manager แทนที่ระบบ My SKU เก่าทั้งหมด
        return <TabAdManager user={effectiveUser} />;
      case 'history':
        return <TabHistory user={effectiveUser} />;
      case 'claims':
        return <TabClaims user={effectiveUser} />;
      case 'favorites':
        return <TabFavorites user={effectiveUser} />;
      case 'privacy':
        return <TabPrivacy user={effectiveUser} />;
      default:
        return <TabOverview user={effectiveUser} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* 📚 Sidebar Navigation */}
        <div className="w-full lg:w-1/4">
          <ProfileSidebar 
            user={effectiveUser} 
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