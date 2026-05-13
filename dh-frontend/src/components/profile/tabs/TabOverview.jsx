import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Loader2, ShieldCheck, UserCheck, RefreshCw, BadgeCheck, Mail, Calendar } from 'lucide-react';
import PersonalInfoForm from '../forms/PersonalInfoForm';
import SocialLinksForm from '../forms/SocialLinksForm';
import SupportSettings from '../forms/SupportSettings';

export default function TabOverview() {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // แยกฟังก์ชันดึงข้อมูลออกมา เพื่อให้กดรีเฟรชได้ และให้ Component ลูกเรียกใช้ได้
  const fetchProfile = useCallback(async (currentUser) => {
    if (!currentUser) return;
    setIsRefreshing(true);
    try {
      const db = getFirestore();
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      } else {
        setProfileData({});
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfileData({});
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchProfile(currentUser);
      } else {
        setUser(null);
        setProfileData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  // ฟังก์ชันรองรับการกดรีเฟรชแบบ Manual
  const handleRefresh = () => {
    if (user) fetchProfile(user);
  };

  if (loading) {
    // อัปเกรดเป็น Skeleton Loader ให้ดูน่าเชื่อถือและ Layout ไม่กระโดด
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-pulse">
        <div className="bg-white rounded-2xl h-[132px] w-full shadow-sm border border-gray-100"></div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl h-80 w-full shadow-sm border border-gray-100"></div>
            <div className="bg-white rounded-2xl h-64 w-full shadow-sm border border-gray-100"></div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl h-48 w-full shadow-sm border border-gray-100"></div>
            <div className="bg-white rounded-2xl h-64 w-full shadow-sm border border-gray-100"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
        <UserCheck className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">ยังไม่ได้เข้าสู่ระบบ</h3>
        <p className="text-gray-500">กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลโปรไฟล์ของคุณ</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-fade-in">
      
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50 transition-transform duration-500 group-hover:scale-110"></div>
        
        {/* Refresh Button */}
        <button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="absolute top-4 right-4 p-2.5 text-gray-400 hover:text-[#0870B8] hover:bg-blue-50 focus:outline-none rounded-full transition-all duration-300 disabled:opacity-50"
          title="รีเฟรชข้อมูลล่าสุด"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#0870B8]' : ''}`} />
        </button>

        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-600 to-[#0870B8] flex shrink-0 items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-blue-50">
            {profileData?.displayName?.charAt(0)?.toUpperCase() || user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {/* Badge แสดงสถานะยืนยันอีเมลแล้ว */}
          {user.emailVerified && (
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm" title="ยืนยันอีเมลแล้ว">
              <BadgeCheck className="w-7 h-7 text-emerald-500" />
            </div>
          )}
        </div>

        <div className="text-center sm:text-left flex-1 pt-2">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center justify-center sm:justify-start gap-2">
            สวัสดี, {profileData?.displayName || user.displayName || 'ผู้ใช้งาน DH'}
          </h2>
          <p className="text-gray-500 mt-2 max-w-xl text-sm leading-relaxed">
            จัดการข้อมูลโปรไฟล์ การตั้งค่าร้านค้า และช่องทางการติดต่อของคุณ เพื่อให้ลูกค้าและระบบติดต่อคุณได้อย่างแม่นยำ
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column - Forms (กินพื้นที่ 2 ส่วน) */}
        <div className="xl:col-span-2 space-y-6">
          {/* ส่ง onRefresh เข้าไปเพื่อให้ฟอร์มเหล่านี้สั่งรีเฟรชหน้าหลักได้เมื่อมีการเซฟข้อมูล */}
          <PersonalInfoForm user={user} initialData={profileData} onRefresh={handleRefresh} />
          <SocialLinksForm user={user} initialData={profileData} onRefresh={handleRefresh} />
        </div>

        {/* Right Column - Settings & Support (กินพื้นที่ 1 ส่วน) */}
        <div className="space-y-6">
          <SupportSettings user={user} initialData={profileData} onRefresh={handleRefresh} />
          
          {/* Account Status Box - ดึงข้อมูลจริงมาแสดง */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              ข้อมูลบัญชีเบื้องต้น
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500 flex items-center gap-1.5"><UserCheck className="w-4 h-4" /> ประเภทบัญชี</span>
                <span className="px-3 py-1 bg-blue-50 text-[#0870B8] rounded-full font-medium text-xs">
                  {profileData?.role === 'partner' ? 'พาร์ทเนอร์ (Partner)' : 'ทั่วไป (Member)'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500 flex items-center gap-1.5"><Mail className="w-4 h-4" /> อีเมล</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-700 truncate max-w-[130px] font-medium" title={user.email}>{user.email}</span>
                  {user.emailVerified ? (
                    <BadgeCheck className="w-4 h-4 text-emerald-500" title="ยืนยันอีเมลแล้ว" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="รอการยืนยันอีเมล"></span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> สมัครเมื่อ</span>
                <span className="text-gray-700 font-medium text-xs bg-gray-50 px-2 py-1 rounded-md">
                  {user.metadata?.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) 
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}