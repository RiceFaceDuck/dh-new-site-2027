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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Megaphone className="text-indigo-600 drop-shadow-xs" size={28} /> ศูนย์จัดการโฆษณาและร้านค้า
          </h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />ศูนย์รวมการโปรโมทร้านค้าและสินค้าแบบครบวงจร
          </p>
        </div>
        <div className="flex bg-slate-200/70 p-1.5 rounded-xl shadow-inner border border-slate-300/80">
          <button
            onClick={() => setActiveSubTab('store')}
            className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${
              activeSubTab === 'store'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store size={16} /> ข้อมูลร้านซ่อม
          </button>
          <button
            onClick={() => setActiveSubTab('ads')}
            className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${
              activeSubTab === 'ads'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/90'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity size={16} /> โฆษณาสินค้า/แบนเนอร์ ({ads.length})
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