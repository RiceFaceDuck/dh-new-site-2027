import React, { useState } from 'react';
import { Zap, ShoppingCart, Package, Globe, AlertCircle } from 'lucide-react';
import GuideModal from '../../components/common/GuideModal';
import { useOverviewData } from '../../components/overview/hooks/useOverviewData';
import { OverviewHeader } from '../../components/overview/OverviewHeader';
import { SalesTargetCard } from '../../components/overview/SalesTargetCard';
import { StatCard } from '../../components/overview/StatCard';
import { BestSellersPanel } from '../../components/overview/BestSellersPanel';
import { SocialFeedPanel } from '../../components/overview/SocialFeedPanel';

const Overview = () => {
  const { metrics, loading, progressPercent } = useOverviewData();
  const [showGuide, setShowGuide] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'อรุณสวัสดิ์ ⛅';
    if (hour < 17) return 'สวัสดีตอนบ่าย ☀️';
    return 'สวัสดีตอนเย็น 🌙';
  };

  const getMotivation = () => {
    if (metrics.revenueToday >= 50000) return 'ยอดเยี่ยมมาก! ทะลุเป้าหมายของวันนี้แล้ว 🏆';
    if (metrics.revenueToday > 25000) return 'ยอดขายกำลังมาแรง ลุยกันต่อเลย! 🔥';
    if (metrics.revenueToday > 0) return 'เริ่มต้นได้ดี มาสร้างยอดขายให้ทะลุเป้ากัน 🚀';
    return 'พร้อมสำหรับการสร้างสถิติใหม่ของวันนี้หรือยัง? 🌟';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse flex flex-col justify-center items-center h-[70vh]">
        <div className="relative flex justify-center items-center">
          <div className="absolute w-24 h-24 border-4 border-dh-accent rounded-full animate-ping opacity-20"></div>
          <Zap size={48} className="text-dh-accent animate-bounce" />
        </div>
        <h3 className="text-xl font-black text-dh-main tracking-widest uppercase mt-4">Initializing Command Center...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-in fade-in duration-700 pb-10">
      
      {/* 🌟 Header & Actions */}
      <OverviewHeader 
        metrics={metrics} 
        getGreeting={getGreeting} 
        getMotivation={getMotivation} 
        setShowGuide={setShowGuide}
      />

      {/* 🚀 Layer 1: Financial & Operation Pulse (Top Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        
        {/* Card 1: Revenue (Premium Grand Design) */}
        <SalesTargetCard 
          metrics={metrics} 
          progressPercent={progressPercent} 
        />

        {/* Card 2: Orders */}
        <StatCard 
          title="บิลขายวันนี้"
          value={metrics.ordersToday}
          unit="รายการ"
          icon={ShoppingCart}
          colorClass="bg-blue-500"
          shadowColorClass="shadow-[0_0_8px_rgba(59,130,246,0.8)]"
          glowColor="bg-blue-500"
          bgIconColor="text-blue-500/10"
          subtitleText={`ปิดสำเร็จ ${metrics.conversionRate}%`}
          activePulse={false}
        />

        {/* Card 3: Website Views (New) */}
        <StatCard 
          title="การเข้าชมเว็บไซค์ (วันนี้)"
          value={metrics.websiteViews}
          unit="คน"
          icon={Globe}
          colorClass="bg-emerald-500"
          shadowColorClass="shadow-[0_0_8px_rgba(16,185,129,0.8)]"
          glowColor="bg-emerald-500"
          bgIconColor="text-emerald-500/10"
          subtitleText={`${metrics.pageViews} Page Views`}
          activePulse={metrics.websiteViews > 0}
        />

        {/* Card 4: Backlog / Tasks */}
        <StatCard 
          title="งานค้าง (Todos)"
          value={metrics.pendingTasks}
          unit="รายการ"
          icon={Package}
          colorClass="bg-amber-500"
          shadowColorClass="shadow-[0_0_8px_rgba(245,158,11,0.8)]"
          glowColor="bg-amber-500"
          bgIconColor="text-amber-500/10"
          subtitleText={`${metrics.criticalClaims} เคลมรอจัดการ, ${metrics.pendingShipments} รอจัดส่ง`}
          activePulse={metrics.pendingTasks > 0}
        />

      </div>

      {/* 📈 Layer 2: Insight & Activity Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        
        {/* Left: Best Sellers Radar */}
        <BestSellersPanel bestSellers={metrics.bestSellers} />

        {/* Right: Live Social Feed */}
        <SocialFeedPanel />

      </div>

      {/* Style พิเศษสำหรับการพิมพ์ (PDF Export) */}
      <style jsx="true">{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { background-color: white !important; }
          .shadow-dh-card, .shadow-dh-elevated { box-shadow: none !important; border-color: #E2E8F0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <GuideModal 
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        title="คู่มือแดชบอร์ดหลัก (Command Center)"
        manualText="หน้าจอนี้คือศูนย์บัญชาการหลักของคุณ ที่สรุปภาพรวมทั้งหมดของธุรกิจในแบบ Real-time"
        howTo={[
          "ดูยอดขายรวมและเปอร์เซ็นต์ที่ทำได้เทียบกับเป้าหมาย",
          "เช็คสถิติบิลขาย, การเข้าชมเว็บ และงานที่ค้าง (To-dos) ด้านบน",
          "ดูสินค้าขายดี และ Feed การเคลื่อนไหวของระบบแบบสดๆ ด้านล่าง"
        ]}
        tips="ปุ่ม 'Export Report' ด้านบนใช้สำหรับปรินท์รายงานหรือเซฟเป็น PDF เพื่อนำเสนอเข้าที่ประชุมได้ทันที"
        expectedResult="คุณจะมองเห็นสุขภาพของธุรกิจได้ในพริบตาเดียว และรู้ว่าต้องเข้าไปโฟกัสแก้ปัญหาจุดไหนต่อไป"
      />
    </div>
  );
};

export default Overview;