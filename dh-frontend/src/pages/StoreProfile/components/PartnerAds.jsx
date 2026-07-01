import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import ProductAdCard from '../../../components/ads/ProductAdCard';

import { getUserPartnerAds } from '../../../firebase/marketingService';

// 🔐 App ID logic matching the rest of the app
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

const PartnerAds = ({ partnerId }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerId) return;

    const fetchPartnerAds = async () => {
      try {
        setLoading(true);
        
        // Use the same function that the dashboard uses to fetch all related ads across collections
        const allAds = await getUserPartnerAds(partnerId);
        
        const activeAds = allAds.filter((adData) => {
          // Check for active status
          const isActive = ['active', 'ACTIVE', 'APPROVED'].includes(adData.status) || adData.isActive === true;
          // Exclude business cards
          const isNotBusinessCard = adData.type !== 'BUSINESS_CARD';
          
          return isActive && isNotBusinessCard;
        });

        setAds(activeAds);
      } catch (error) {
        console.error('Error fetching partner ads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerAds();
  }, [partnerId]);

  if (loading) {
    return (
      <div className="mt-8 flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (ads.length === 0) {
    return null; // Don't show anything if there are no ads
  }

  return (
    <div className="mt-12 bg-gradient-to-b from-white to-slate-50/50 rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
          สินค้าและบริการแนะนำจากทางร้าน
        </h3>
        <p className="text-slate-500 mt-2">เลือกชมสินค้าหรือบริการพิเศษที่ทางร้านคัดสรรมาให้คุณ</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {ads.map((ad) => (
          <ProductAdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </div>
  );
};

export default PartnerAds;
