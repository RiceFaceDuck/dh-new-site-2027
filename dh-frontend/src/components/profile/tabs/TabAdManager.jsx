import React from 'react';
import { Megaphone, Loader2, Store, Activity, Sparkles } from 'lucide-react';
import AdStatsOverview from './ad-manager/AdStatsOverview';
import AdListTable from './ad-manager/AdListTable';
import AdFormModal from './ad-manager/AdFormModal';
import StoreProfileForm from './store-profile/StoreProfileForm';
import { useAdManager } from './hooks/useAdManager';

/**
 * 📦 TabAdManager (Pure Presentation Component)
 * Delegating all state management, real-time listeners, and data transactions
 * to the custom hook `useAdManager` in adherence to Clean Architecture and SRP.
 */
const TabAdManager = ({ user }) => {
  const {
    loading,
    activeSubTab,
    setActiveSubTab,
    storeData,
    setStoreData,
    ads,
    businessCardAd,
    isFormOpen,
    setIsFormOpen,
    submittingAd,
    isEditMode,
    setIsEditMode,
    formData,
    setFormData,
    uploadingImage,
    creditLimit,
    setCreditLimit,
    isUnlimited,
    setIsUnlimited,
    userCredit,
    appId,
    COST_PER_IMPRESSION,
    fetchMyAds,
    handleLinkChange,
    handleImageUpload,
    handleEditAd,
    handleCloseForm,
    handleSubmitAd,
    handleDeleteAd,
    handleToggleAdStatus,
    handleResubmitAd
  } = useAdManager(user);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 size={32} className="animate-spin mb-3 text-indigo-500 drop-shadow-md" />
        <p className="text-sm font-tech tracking-widest uppercase">INITIALIZING AD MANAGER...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
            <Megaphone className="text-indigo-400 drop-shadow-xs" size={26} /> ศูนย์จัดการโฆษณาและร้านค้า
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <Sparkles size={13} className="text-amber-400" />ศูนย์รวมการโปรโมทร้านค้าและสินค้าแบบครบวงจร
          </p>
        </div>
        <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-700/80 shadow-inner gap-1.5">
          <button
            onClick={() => setActiveSubTab('store')}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg flex items-center gap-2 transition-all duration-200 cursor-pointer ${
              activeSubTab === 'store'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black hover:bg-amber-300 active:scale-95'
                : 'text-slate-300 bg-slate-800/80 border border-slate-700/60 hover:text-white hover:bg-slate-700 hover:border-slate-600 active:scale-95'
            }`}
          >
            <Store size={15} /> ข้อมูลร้านซ่อม
          </button>
          <button
            onClick={() => setActiveSubTab('ads')}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg flex items-center gap-2 transition-all duration-200 cursor-pointer ${
              activeSubTab === 'ads'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black hover:bg-amber-300 active:scale-95'
                : 'text-slate-300 bg-slate-800/80 border border-slate-700/60 hover:text-white hover:bg-slate-700 hover:border-slate-600 active:scale-95'
            }`}
          >
            <Activity size={15} /> โฆษณาสินค้า/แบนเนอร์ ({ads.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'store' && (
        <StoreProfileForm 
          storeData={storeData} 
          setStoreData={setStoreData} 
          user={user} 
          appId={appId} 
          businessCardAd={businessCardAd} 
          fetchMyAds={fetchMyAds} 
        />
      )}

      {activeSubTab === 'ads' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {!isFormOpen && (
            <AdStatsOverview 
              userCredit={userCredit} 
              onOpenForm={() => { 
                setIsEditMode(false); 
                setIsFormOpen(true); 
              }} 
            />
          )}
          
          {isFormOpen && (
            <AdFormModal 
              formData={formData} 
              setFormData={setFormData} 
              storeData={storeData} 
              handleSubmitAd={handleSubmitAd}
              onCloseForm={handleCloseForm} 
              handleLinkChange={handleLinkChange} 
              handleImageUpload={handleImageUpload}
              uploadingImage={uploadingImage} 
              submittingAd={submittingAd} 
              creditLimit={creditLimit} 
              setCreditLimit={setCreditLimit} 
              isUnlimited={isUnlimited} 
              setIsUnlimited={setIsUnlimited} 
              remainingCredit={isUnlimited ? 9999 : (userCredit - creditLimit)} 
              targetImpressions={isUnlimited ? '∞' : Math.floor(creditLimit / COST_PER_IMPRESSION)}
              isEditMode={isEditMode}
            />
          )}

          {!isFormOpen && (
            <AdListTable 
              ads={ads} 
              onEditAd={handleEditAd} 
              onDeleteAd={handleDeleteAd} 
              onToggleStatus={handleToggleAdStatus} 
              onResubmitAd={handleResubmitAd}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default TabAdManager;