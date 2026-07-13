import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../firebase/config';
import PartnerAds from './components/PartnerAds';
import StoreProfileHero from './components/StoreProfileHero';
import StoreProfileInfo from './components/StoreProfileInfo';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// Ensure appId is defined
const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

const StoreProfilePage = () => {
  const { id } = useParams();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPartnerProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Try getting from ActivePartners collection
        const partnerRef = doc(db, getCollectionPath('ActivePartners'), id);
        const partnerSnap = await getDoc(partnerRef);
        
        if (partnerSnap.exists()) {
          setPartner({ id: partnerSnap.id, ...partnerSnap.data() });
        } else {
          // Fallback to old partners or user doc if needed
          console.warn("Partner not found in ActivePartners collection");
        }
      } catch (error) {
        console.error("Error fetching partner profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 animate-pulse">
        <div className="h-64 md:h-80 w-full bg-slate-200"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 relative z-10">
          <div className="bg-white/80 rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl bg-slate-200 ring-4 ring-white shadow-sm shrink-0"></div>
            <div className="flex-1 w-full text-center md:text-left flex flex-col items-center md:items-start pt-2">
              <div className="h-8 bg-slate-200 rounded-md w-2/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded-sm w-1/3 mb-4"></div>
              <div className="flex gap-2 mb-6">
                <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
              </div>
              <div className="h-10 bg-slate-200 rounded-lg w-full md:w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">ไม่พบข้อมูลร้านค้า</h2>
        <p className="text-slate-600 mb-6">ขออภัย ไม่พบโปรไฟล์ร้านค้าที่คุณกำลังค้นหา อาจถูกลบหรือปิดรับงานชั่วคราว</p>
        <Link to="/" className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark transition-colors shadow-md">
          กลับสู่หน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <StoreProfileHero partner={partner} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-8">
        <StoreProfileInfo partner={partner} currentUser={currentUser} />
        <PartnerAds partnerId={partner.id} />
      </div>
    </div>
  );
};

export default StoreProfilePage;
