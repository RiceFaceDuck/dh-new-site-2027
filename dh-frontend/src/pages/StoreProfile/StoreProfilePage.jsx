import React from 'react';
import { useParams, Link } from 'react-router-dom';
import PartnerAds from './components/PartnerAds';
import StoreProfileHero from './components/StoreProfileHero';
import StoreProfileInfo from './components/StoreProfileInfo';
import StoreRecommendedProducts from './components/StoreRecommendedProducts';
import useStoreProfilePage from './hooks/useStoreProfilePage';

/**
 * Pure Layout Component for Partner Store Profile Page (/store/:id)
 * Clean Architecture & SRP: State & data orchestration extracted to useStoreProfilePage hook.
 * UI Border Radius Invariant: 0.1 (rounded-[2px]) on cards/containers.
 */
const StoreProfilePage = () => {
  const { id } = useParams();
  const { partner, loading, currentUser } = useStoreProfilePage(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 animate-pulse">
        <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 relative z-10">
          <div className="bg-white rounded-[2px] shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 aspect-square rounded-[2px] bg-slate-200 shadow-sm shrink-0"></div>
            <div className="flex-1 w-full text-center md:text-left flex flex-col items-center md:items-start pt-2">
              <div className="h-8 bg-slate-200 rounded-[2px] w-2/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded-[2px] w-1/3 mb-4"></div>
              <div className="flex gap-2 mb-6">
                <div className="h-6 w-16 bg-slate-200 rounded-[2px]"></div>
                <div className="h-6 w-16 bg-slate-200 rounded-[2px]"></div>
              </div>
              <div className="h-10 bg-slate-200 rounded-[2px] w-full md:w-1/2"></div>
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
      <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-8">
        <StoreProfileInfo partner={partner} currentUser={currentUser} />
        <PartnerAds partnerId={partner.id} />
        <StoreRecommendedProducts />
      </div>
    </div>
  );
};

export default StoreProfilePage;
