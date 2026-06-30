import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, LayoutGrid, List, Tag, FileText, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useFavorites } from '../../../context/FavoritesProvider';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../../firebase/productService';
import { useCart } from '../../../context/CartProvider';

const FavoriteItemCard = ({ product, viewMode, updateFavoriteDetails, toggleFavorite, isSelected, onSelect, onLiveDataLoaded }) => {
  const navigate = useNavigate();
  const { addToCart, cartItems, removeFromCart, updateQuantity } = useCart();
  const [liveData, setLiveData] = useState(null);
  const [loadingLive, setLoadingLive] = useState(true);
  
  // Note/Tags states
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState(product.note || '');
  const [tagInput, setTagInput] = useState('');
  const tags = product.tags || [];

  useEffect(() => {
    let isMounted = true;
    const fetchLive = async () => {
      try {
        const liveProduct = await productService.getProduct(product.id);
        if (isMounted) {
          setLiveData(liveProduct);
          setLoadingLive(false);
          if (onLiveDataLoaded) {
            onLiveDataLoaded(product.id, liveProduct);
          }
        }
      } catch (err) {
        if (isMounted) setLoadingLive(false);
      }
    };
    fetchLive();
    return () => { isMounted = false; };
  }, [product.id]);

  const displayData = liveData || product;
  const priceToShow = displayData.salePrice || displayData.price || 0;
  const isOutOfStock = displayData.isOutOfStock || displayData.stockQuantity <= 0;
  
  const cartItem = cartItems?.find(item => item.id === product.id);
  const cartQuantity = cartItem?.quantity || 0;

  const handleNoteChange = (e) => setNote(e.target.value);
  const saveNote = () => {
    if (note !== product.note) {
      updateFavoriteDetails(product.id, note, undefined);
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        updateFavoriteDetails(product.id, undefined, [...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    updateFavoriteDetails(product.id, undefined, tags.filter(t => t !== tagToRemove));
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(displayData, 1);
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative cursor-pointer ${viewMode === 'grid' ? 'p-3 flex flex-col h-full' : 'p-3 flex flex-col'} ${isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50/10' : ''}`} 
      onClick={() => {
        if (viewMode === 'list') setIsExpanded(!isExpanded);
        else navigate(`/product/${product.id}`);
      }}
    >
      <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={() => onSelect(product.id)}
          className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer shadow-sm"
        />
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); toggleFavorite(product); }}
        className="absolute top-2 right-2 z-10 text-red-500 bg-white p-1.5 rounded-full shadow-sm border border-gray-100 hover:scale-110 transition-transform"
      >
        <Heart size={16} className="fill-red-500" />
      </button>
      
      <div className={viewMode === 'grid' ? '' : 'flex flex-row gap-3'}>
        <div className={`${viewMode === 'grid' ? 'aspect-square mb-3' : 'w-20 h-20 sm:w-24 sm:h-24 shrink-0'} bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center mix-blend-multiply p-2 relative`}>
          <img src={displayData.imageUrl || displayData.images?.[0] || "https://via.placeholder.com/200x200?text=No+Image"} alt={displayData.name} className="w-full h-full object-contain group-hover:scale-105 transition duration-500" />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-[1px]">
              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">หมด</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <p className="text-[10px] text-gray-400 font-medium">SKU: {displayData.model || displayData.sku}</p>
              {isOutOfStock ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-600">หมดสต๊อก</span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-600">มีสินค้า</span>
              )}
            </div>
            <h3 className={`font-semibold text-gray-700 line-clamp-2 group-hover:text-emerald-600 text-xs ${viewMode === 'grid' ? 'mb-2' : ''}`}>{displayData.name}</h3>
            
            {/* Note & Tags Summary (Collapsed State) */}
            {viewMode === 'list' && !isExpanded && (tags.length > 0 || note) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded text-[9px] font-medium flex items-center gap-1">
                    <Tag size={8} /> {tag}
                  </span>
                ))}
                {tags.length > 3 && <span className="text-[9px] text-gray-400">+{tags.length - 3}</span>}
                {note && (
                  <span className="text-[10px] text-gray-500 italic flex items-center gap-1 line-clamp-1 max-w-[200px]">
                    <FileText size={10} className="shrink-0" /> {note}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className={`mt-auto ${viewMode === 'grid' ? 'pt-2 border-t border-gray-50 flex flex-col gap-2' : 'flex flex-row items-end justify-between gap-2'}`}>
            <div className="flex flex-col">
              <span className={`font-bold ${viewMode === 'grid' ? 'text-sm' : 'text-base'} ${isOutOfStock ? 'text-gray-400' : 'text-red-600'}`}>
                ฿{priceToShow.toLocaleString()}
              </span>
              {loadingLive && <span className="text-[9px] text-gray-300">กำลังอัปเดต...</span>}
            </div>
            
            <div className={`flex items-center gap-1.5 ${viewMode === 'grid' ? 'w-full grid grid-cols-2' : ''}`}>
              {viewMode === 'list' && !isOutOfStock && (
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
                  className="flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  Detail
                </button>
              )}
              
              {isOutOfStock ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(`https://line.me/R/ti/p/@dhnotebook?text=${encodeURIComponent('สอบถามสต๊อกสินค้า SKU: ' + (displayData.model || displayData.sku))}`, '_blank'); }}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-colors bg-[#00B900]/10 text-[#00B900] hover:bg-[#00B900]/20 border border-[#00B900]/20 ${viewMode === 'grid' ? 'col-span-2' : 'w-full'}`}
                  title="สอบถามแอดมิน"
                >
                  💬 สอบถามสต๊อกผ่านแอดมิน
                </button>
              ) : cartQuantity > 0 ? (
                <div className={`flex items-center justify-between bg-emerald-50 rounded-lg border border-emerald-200 overflow-hidden ${viewMode === 'grid' ? 'col-span-2' : 'w-24 sm:w-28'}`}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cartQuantity === 1) removeFromCart(product.id);
                      else updateQuantity(product.id, -1);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-black">-</span>
                  </button>
                  <span className="text-xs font-bold text-emerald-700">{cartQuantity}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      updateQuantity(product.id, 1);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-black">+</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  className={`flex items-center justify-center px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-colors bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 ${viewMode === 'grid' ? 'col-span-2' : ''}`}
                >
                  <ShoppingCart size={14} className={viewMode === 'list' ? 'mr-1' : ''} /> 
                  {viewMode === 'grid' ? 'ซื้อ' : 'ใส่ตะกร้า'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Note & Tags Section (Only in List View) */}
      {viewMode === 'list' && isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-3 bg-gray-50/80 rounded-lg flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <FileText size={12} /> หมายเหตุ (Notes)
              </label>
              <textarea 
                className="w-full text-xs p-2 rounded-md border border-gray-200 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none transition-all"
                rows="2"
                placeholder="ระบุหมายเหตุ เช่น สำหรับลูกค้าคุณเอ..."
                value={note}
                onChange={handleNoteChange}
                onBlur={saveNote}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <Tag size={12} /> แท็ก (Tags)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {tags.map((tag, idx) => (
                  <span key={idx} className="bg-white text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 shadow-sm">
                    {tag}
                    <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="text-emerald-400 hover:text-emerald-700 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <input 
                type="text"
                className="w-full text-xs p-2 rounded-md border border-gray-200 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="พิมพ์แท็กแล้วกด Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TabFavorites = () => {
  const { favorites, toggleFavorite, updateFavoriteDetails } = useFavorites();
  const { addToCart, cartItems } = useCart();
  const [viewMode, setViewMode] = useState('list'); // 'grid' | 'list'
  const [selectedIds, setSelectedIds] = useState([]);
  const [liveProducts, setLiveProducts] = useState({});
  const navigate = useNavigate();

  const handleLiveDataLoaded = (id, liveProduct) => {
    setLiveProducts(prev => ({ ...prev, [id]: liveProduct }));
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(favorites.map(f => f.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Calculate selected total price using liveProducts if available
  const selectedProducts = favorites.filter(f => selectedIds.includes(f.id)).map(f => liveProducts[f.id] || f);
  const selectedTotal = selectedProducts.reduce((sum, p) => {
    const price = Number(p?.salePrice) || Number(p?.price) || 0;
    const cartItem = cartItems.find(i => i.id === p.id);
    const qty = cartItem ? (cartItem.qty || cartItem.quantity) : 1;
    return sum + (price * qty);
  }, 0);
  
  const handleAddSelectedToCart = () => {
    let addedCount = 0;
    selectedProducts.forEach(product => {
      const isOutOfStock = product.isOutOfStock || product.stockQuantity <= 0;
      const alreadyInCart = cartItems.some(i => i.id === product.id);
      if (!isOutOfStock && !alreadyInCart) {
        addToCart(product, 1);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      // alert(`เพิ่มสินค้าใหม่ ${addedCount} รายการลงตะกร้าเรียบร้อยแล้ว`);
    } else {
      // If all are in cart, just go to cart
      navigate('/cart');
    }
  };

  const notInCartCount = selectedProducts.filter(p => !cartItems.some(i => i.id === p.id) && !(p.isOutOfStock || p.stockQuantity <= 0)).length;

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
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none px-2 py-1 rounded hover:bg-gray-50 transition-colors w-full sm:w-auto">
            <input 
              type="checkbox" 
              checked={selectedIds.length > 0 && selectedIds.length === favorites.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
            />
            เลือกทั้งหมด ({favorites.length})
          </label>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded border border-gray-200 shrink-0">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">ยอดประเมิน:</span>
                <span className="text-sm font-black text-indigo-700">฿{selectedTotal.toLocaleString()}</span>
              </div>
              <button 
                onClick={handleAddSelectedToCart}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white rounded shadow-sm transition-colors shrink-0 ${notInCartCount > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
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
        <button onClick={() => navigate('/categories')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm hover:bg-emerald-700 transition-colors">
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