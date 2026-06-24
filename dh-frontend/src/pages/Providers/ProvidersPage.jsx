import React, { useState } from 'react';
import { HelpCircle, X, Users } from 'lucide-react';
import { useProvidersList } from './hooks/useProvidersList';
import ProvidersFilterBar from './components/ProvidersFilterBar';
import ProvidersList from './components/ProvidersList';

const ProvidersPage = () => {
  const {
    loading,
    visiblePartners,
    hasMore,
    loadMore,
    searchTerm,
    setSearchTerm,
    userLocation,
    locationError,
    requestLocation,
    totalCount
  } = useProvidersList();

  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-brand/10 rounded-2xl">
              <Users className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                SERVICE PROVIDERS
              </h1>
              <p className="text-slate-500 mt-1">รวมช่างและผู้ให้บริการ ค้นหาและดูระยะทางได้ทันที</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowGuide(true)}
            className="flex items-center text-sm font-medium text-brand hover:text-brand-accent transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm border border-brand/20"
          >
            <HelpCircle className="w-4 h-4 mr-1.5" />
            วิธีใช้งานหน้านี้
          </button>
        </div>

        {/* Filter Bar (Search & GPS) */}
        <ProvidersFilterBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          requestLocation={requestLocation}
          userLocation={userLocation}
          locationError={locationError}
        />

        {/* List & Pagination */}
        <ProvidersList 
          loading={loading}
          visiblePartners={visiblePartners}
          hasMore={hasMore}
          loadMore={loadMore}
          totalCount={totalCount}
        />

        {/* In-App Guide Modal */}
        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => setShowGuide(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-6 pb-0">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                  <HelpCircle className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">วิธีใช้งานหน้ารวมช่าง</h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  หน้านี้ช่วยให้คุณค้นหาช่างและร้านซ่อมที่เหมาะสมที่สุดได้อย่างรวดเร็ว
                </p>
              </div>
              
              <div className="bg-slate-50 p-6 space-y-4">
                <div className="flex items-start">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 mr-3 shrink-0">
                    <span className="text-lg">📍</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm">หาร้านใกล้บ้าน</h4>
                    <p className="text-xs text-slate-500 mt-0.5">กดปุ่ม "เรียงตามร้านใกล้ฉัน" และอนุญาตพิกัด GPS ระบบจะนำร้านที่ใกล้ที่สุดขึ้นมาให้คุณเลือก</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 mr-3 shrink-0">
                    <span className="text-lg">🔍</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm">ค้นหาตามบริการ</h4>
                    <p className="text-xs text-slate-500 mt-0.5">พิมพ์คำค้นหาเช่น "เปลี่ยนจอ", "ซ่อมบอร์ด" ในช่องค้นหา เพื่อดูเฉพาะร้านที่รับทำ</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-white border-t border-slate-100">
                <button 
                  onClick={() => setShowGuide(false)}
                  className="w-full py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-colors"
                >
                  เข้าใจแล้ว
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProvidersPage;
