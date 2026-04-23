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
          
          if (profileData) {
            setUserProfile(profileData);
          } else {
            // 🛠️ FIX: กรณีเคยล็อกอินไว้แล้วแต่หาใน Database ไม่เจอ ให้ใช้ข้อมูลจาก Google แก้ขัดไปก่อนเว็บจะได้ไม่พัง
            console.warn("ไม่พบข้อมูลใน Firestore (ใช้ข้อมูลจาก Google Auth แทน)");
            setUserProfile({
              uid: user.uid,
              displayName: user.displayName || 'ผู้ใช้งาน',
              email: user.email,
              photoURL: user.photoURL,
              stats: { creditBalance: 0, rewardPoints: 0 }
            });
          }
        } catch (error) {
          console.error("🔥 Error Fetching Profile:", error);
          setUserProfile({ uid: user.uid, displayName: 'เกิดข้อผิดพลาด', stats: {} });
        }
      } else {
        setAuthUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  // 2. จัดการเมื่อผู้ใช้กด "ล็อกอินด้วย Google"
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await authService.loginWithGoogle();
      setUserProfile(result.profile); 
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการล็อกอิน กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { 
      await authService.logout();
      setActiveTab('overview'); 
    } catch (error) { 
      console.error(error); 
    }
  };

  const handleEmailAuth = (e) => {
    e.preventDefault();
    alert("ระบบ Email กำลังพัฒนา กรุณาใช้ Google Login ครับ");
  };

  // 3. UI: สถานะกำลังโหลด
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        <p className="text-sm text-gray-500 font-medium">กำลังเตรียมข้อมูล...</p>
      </div>
    );
  }

  // 4. UI: สถานะยังไม่เข้าสู่ระบบ 
  if (!authUser) {
    return (
      <AuthForm 
        isLogin={isLogin} 
        setIsLogin={setIsLogin} 
        handleGoogleLogin={handleGoogleLogin} 
        handleEmailAuth={handleEmailAuth} 
      />
    );
  }

  // 5. UI: ดักจับ Error ขั้นสุดท้าย (กันหน้าขาวโพลน)
  if (!userProfile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <p className="text-gray-500 font-medium">ไม่พบข้อมูลโปรไฟล์ กรุณาล็อกอินใหม่อีกครั้ง</p>
        <button onClick={handleLogout} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold">
          ออกจากระบบ
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 min-h-[80vh] animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        
        {/* Sidebar ด้านซ้าย */}
        <div className="lg:col-span-1">
          <ProfileSidebar 
            user={userProfile} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            handleLogout={handleLogout} 
          />
        </div>

        {/* เนื้อหาหลัก ด้านขวา */}
        <div className="lg:col-span-3">
           <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-5 md:p-8 min-h-[600px] relative overflow-hidden">
             {activeTab === 'overview' && <TabOverview userProfile={userProfile} />}
             {activeTab === 'wallet' && <TabWallet stats={userProfile.stats} />}
             {activeTab === 'sku' && <TabUserSku userProfile={userProfile} />}
             {activeTab === 'ads' && <TabAdManager userProfile={userProfile} />}
             {activeTab === 'history' && <TabHistory />}
             {activeTab === 'favorites' && <TabFavorites />}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;