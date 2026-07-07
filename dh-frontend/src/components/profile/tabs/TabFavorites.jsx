import React from 'react';
import { Heart, ShoppingCart, LayoutGrid, List, AlertCircle } from 'lucide-react';
import { useFavoriteManagement } from './hooks/useFavoriteManagement';
import FavoriteItemCard from './components/FavoriteItemCard';

const TabFavorites = () => {
  const {
    favorites,
    toggleFavorite,
    updateFavoriteDetails,
    viewMode,
    setViewMode,
    selectedIds,
    handleSelect,
    handleSelectAll,
    handleLiveDataLoaded,
    selectedTotal,
    handleAddSelectedToCart,
    notInCartCount,
    navigate
  } = useFavoriteManagement();

  return (
  <div className="animate-in fade-in duration-500 pb-8">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Heart size={22} className="text-emerald-600 fill-emerald-100" /> สินค้าที่ถูกใจ
      </h2>
      <div className="flex items-center gap-3">
        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full border border-gray-200 hidden sm:inline-block">
          {favorites.length} รายการ
        </span>
        {favorites.length > 0 && (
          <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-xs text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-xs text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="List View (With Notes & Tags)"
            >
              <List size={16} />
            </button>
          </div>
        )}
      </div>
    </div>

    {favorites.length > 0 && (
      <div className="mb-4 flex flex-col gap-3">
        {/* Info Alert */}
        <div className="flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 w-full">
          <AlertCircle size={14} className="shrink-0" />
          <span>ระบบตรวจสอบอัปเดตราคาและสต๊อกล่าสุดอัตโนมัติ เพื่อป้องกันข้อมูลคลาดเคลื่อน</span>
        </div>

        {/* Toolbar & Simulator Compact */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-xs">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none px-2 py-1 rounded-sm hover:bg-gray-50 transition-colors w-full sm:w-auto">
            <input 
              type="checkbox" 
              checked={selectedIds.length > 0 && selectedIds.length === favorites.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500 cursor-pointer"
            />
            เลือกทั้งหมด ({favorites.length})
          </label>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-sm border border-gray-200 shrink-0">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">ยอดประเมิน:</span>
                <span className="text-sm font-black text-indigo-700">฿{selectedTotal.toLocaleString()}</span>
              </div>
              <button 
                onClick={handleAddSelectedToCart}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white rounded-sm shadow-xs transition-colors shrink-0 ${notInCartCount > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                <ShoppingCart size={12} /> 
                {notInCartCount > 0 ? `เพิ่มลงตะกร้า (${notInCartCount})` : 'ชำระเงิน / ไปที่ตะกร้า'}
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {favorites.length === 0 ? (
      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-gray-500 font-semibold mb-2">ยังไม่มีสินค้าที่ถูกใจ</h3>
        <p className="text-gray-400 text-sm mb-4">ลองค้นหาสินค้าและกดหัวใจเพื่อบันทึกเก็บไว้ดูภายหลัง</p>
        <button onClick={() => navigate('/categories')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-xs hover:bg-emerald-700 transition-colors">
          เลือกชมสินค้า
        </button>
      </div>
    ) : (
      <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" : "flex flex-col gap-4"}>
        {favorites.map((product) => (
          <FavoriteItemCard 
            key={product.id} 
            product={product} 
            viewMode={viewMode}
            updateFavoriteDetails={updateFavoriteDetails}
            toggleFavorite={toggleFavorite}
            isSelected={selectedIds.includes(product.id)}
            onSelect={handleSelect}
            onLiveDataLoaded={handleLiveDataLoaded}
          />
        ))}
      </div>
    )}
  </div>
  );
};

export default TabFavorites;