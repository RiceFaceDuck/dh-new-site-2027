import React from 'react';
import HeroSection from './components/HeroSection';
import QuickActions from './components/QuickActions';
import FeaturedSpares from './components/FeaturedSpares';
import SquadHighlight from './components/SquadHighlight';
import { useHomeProducts } from './hooks/useHomeProducts';

// นำเข้า Component ป้ายแบนเนอร์โฆษณา (BILLBOARD) แบบเดิม
import BannerAdWidget from '../../components/ads/BannerAdWidget';
import ScrollReveal from '../../components/common/ScrollReveal';

const Home = () => {
  // 🚀 ดึงข้อมูลผ่าน Hook ที่แยกออกมา (SRP) พร้อมสถานะความเร็วเน็ต
  const { products, loading, error, isActive, isSlowConnection } = useHomeProducts(12);

  return (
    <div className="w-full flex flex-col animate-fade-in pb-16">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 space-y-8 md:space-y-12">
        
        {/* ========================================================
            Section 1: Hero Banner Ad (จำลอง)
            ======================================================= */}
        <HeroSection />

        {/* ========================================================
            Section 2: Quick Actions (UI/UX ลูกเล่นใหม่ เน้น Mobile)
            ======================================================= */}
        <ScrollReveal direction="up" delay={100}>
          <QuickActions />
        </ScrollReveal>

        {/* ========================================================
            Section 3: Squad Highlight (ร้านช่าง ใกล้คุณ)
            ======================================================= */}
        <ScrollReveal direction="up" delay={200}>
          <SquadHighlight />
        </ScrollReveal>

        {/* ========================================================
            Section 4: Featured Spares (อะไหล่แนะนำ)
            ======================================================= */}
        {isActive && (
          <ScrollReveal direction="up" delay={300}>
            <FeaturedSpares 
              products={products} 
              loading={loading} 
              error={error} 
              isSlowConnection={isSlowConnection} 
            />
          </ScrollReveal>
        )}

      </div>
    </div>
  );
};

export default Home;
