import { Heart, ShoppingCart, LayoutGrid, List, AlertCircle, Search, Tag, Copy, Check, X } from 'lucide-react';
import { useFavoriteManagement } from './hooks/useFavoriteManagement';
import FavoriteItemCard from './components/FavoriteItemCard';

const TabFavorites = () => {
  const {
    favorites,
    filteredFavorites,
    toggleFavorite,
    updateFavoriteDetails,
    moveFavoriteUp,
    moveFavoriteDown,
    viewMode,
    setViewMode,
    selectedIds,
    handleSelect,
    handleSelectAll,
    selectedTotal,
    handleAddSelectedToCart,
    notInCartCount,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    allTags,
    tagCounts,
    loadingLive,
    liveProducts,
    handleCopyQuotation,
    copiedQuotation,
    navigate
  } = useFavoriteManagement();

  return (
  <div className="animate-in fade-in duration-500 pb-8">
    {/* Page Header */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Heart size={22} className="text-emerald-600 fill-emerald-100" /> สินค้าที่ถูกใจ
        </h2>
        <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-xs border border-slate-300 shadow-2xs">
          {favorites.length} รายการ
        </span>
      </div>
      <div className="flex items-center gap-2">
        {favorites.length > 0 && (
          <div className="flex items-center bg-slate-100 rounded-xs p-0.5 border border-slate-300 shadow-2xs">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xs transition-all ${viewMode === 'grid' ? 'bg-white shadow-xs text-emerald-700 font-bold border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              title="Grid View (ตาราง)"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xs transition-all ${viewMode === 'list' ? 'bg-white shadow-xs text-emerald-700 font-bold border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              title="List View (รายการพร้อมโน้ตและแท็ก)"
            >
              <List size={16} />
            </button>
          </div>
        )}
      </div>
    </div>

    {favorites.length > 0 && (
      <div className="mb-4 flex flex-col gap-2.5">
        {/* Info Alert */}
        <div className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-50/90 p-2 rounded-xs border border-amber-300/80 shadow-2xs w-full">
          <AlertCircle size={14} className="shrink-0 text-amber-600" />
          <span className="font-medium">ห้องทำงานช่าง: สามารถจดบันทึกงาน ใส่แท็ก คัดลอกสรุปราคา และจัดลำดับอะไหล่ขึ้น-ลงได้ทันที</span>
        </div>

        {/* Workstation Filter & Search Hub */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-100/90 p-2 rounded-xs border border-slate-300 shadow-2xs">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="ค้นหาอะไหล่ตามชื่อ, SKU, หมายเหตุ หรือแท็ก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xs border border-slate-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-hidden shadow-2xs transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Copy Quotation / Parts Summary Button */}
          <button
            onClick={handleCopyQuotation}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-bold border shadow-xs transition-all shrink-0 ${copiedQuotation ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'}`}
            title="คัดลอกรายการสรุปราคาสำหรับส่งให้ลูกค้าทาง LINE"
          >
            {copiedQuotation ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedQuotation ? 'คัดลอกรายการแล้ว!' : 'คัดลอกรายการสรุปราคา'}</span>
          </button>
        </div>

        {/* Tag Filter Chips Bar */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Tag size={11} /> แท็ก:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded-xs font-semibold text-[11px] border transition-all shrink-0 shadow-2xs ${selectedTag === null ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
            >
              ทั้งหมด ({favorites.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-xs font-semibold text-[11px] border transition-all shrink-0 shadow-2xs flex items-center gap-1 ${selectedTag === tag ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'}`}
              >
                <span>#{tag}</span>
                <span className="text-[9px] opacity-75 font-bold">({tagCounts?.[tag] ?? 0})</span>
              </button>
            ))}
          </div>
        )}

        {/* Toolbar & Estimator Compact */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-100/90 p-2.5 rounded-xs border border-slate-300 shadow-xs">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none px-2.5 py-1 rounded-xs hover:bg-slate-200/70 border border-transparent hover:border-slate-300 transition-colors w-full sm:w-auto">
            <input 
              type="checkbox" 
              checked={selectedIds.length > 0 && selectedIds.length === filteredFavorites.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-emerald-600 rounded-xs border-slate-300 focus:ring-emerald-500 cursor-pointer shadow-2xs"
            />
            เลือกทั้งหมดในมุมมอง ({filteredFavorites.length})
          </label>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xs border border-slate-300 shadow-xs shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ยอดประเมิน:</span>
                <span className="text-sm font-black text-indigo-700">฿{selectedTotal.toLocaleString()}</span>
              </div>
              <button 
                onClick={handleAddSelectedToCart}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white rounded-xs shadow-xs border transition-colors shrink-0 ${notInCartCount > 0 ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700'}`}
              >
                <ShoppingCart size={13} /> 
                {notInCartCount > 0 ? `เพิ่มลงตะกร้า (${notInCartCount})` : 'ชำระเงิน / ไปที่ตะกร้า'}
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    {favorites.length === 0 ? (
      <div className="text-center py-12 bg-slate-50 rounded-xs border border-dashed border-slate-300 shadow-2xs">
        <Heart size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-slate-700 font-bold mb-2">ยังไม่มีสินค้าที่ถูกใจ</h3>
        <p className="text-slate-500 text-sm mb-4">ลองค้นหาสินค้าและกดหัวใจเพื่อบันทึกเก็บไว้ดูภายหลัง</p>
        <button onClick={() => navigate('/categories')} className="px-6 py-2 bg-emerald-600 text-white rounded-xs font-bold shadow-xs hover:bg-emerald-700 border border-emerald-700 transition-colors">
          เลือกชมสินค้า
        </button>
      </div>
    ) : filteredFavorites.length === 0 ? (
      <div className="text-center py-10 bg-slate-50 rounded-xs border border-dashed border-slate-300 shadow-2xs">
        <Search size={36} className="mx-auto text-slate-400 mb-2" />
        <h3 className="text-slate-700 font-bold mb-1">ไม่พบสินค้าที่ตรงกับการค้นหาหรือแท็กที่เลือก</h3>
        <p className="text-slate-500 text-xs mb-3">ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองแท็ก</p>
        <button 
          onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
          className="px-3.5 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-xs border border-slate-300 hover:bg-slate-50 shadow-xs"
        >
          ล้างตัวกรองทั้งหมด
        </button>
      </div>
    ) : (
      <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" : "flex flex-col gap-3"}>
        {filteredFavorites.map((product, idx) => (
          <FavoriteItemCard 
            key={product.id} 
            product={product} 
            liveProduct={liveProducts[product.id]}
            loadingLive={loadingLive}
            viewMode={viewMode}
            updateFavoriteDetails={updateFavoriteDetails}
            toggleFavorite={toggleFavorite}
            isSelected={selectedIds.includes(product.id)}
            onSelect={handleSelect}
            moveFavoriteUp={moveFavoriteUp}
            moveFavoriteDown={moveFavoriteDown}
            isFirst={idx === 0}
            isLast={idx === filteredFavorites.length - 1}
          />
        ))}
      </div>
    )}
  </div>
  );
};

export default TabFavorites;