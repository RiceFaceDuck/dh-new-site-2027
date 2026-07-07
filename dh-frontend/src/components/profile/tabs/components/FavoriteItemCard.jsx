import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Tag, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../../../firebase/productService';
import { useCart } from '../../../../context/CartProvider';

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
      className={`bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-all group relative cursor-pointer ${viewMode === 'grid' ? 'p-3 flex flex-col h-full' : 'p-3 flex flex-col'} ${isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50/10' : ''}`} 
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
          className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500 cursor-pointer shadow-xs"
        />
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); toggleFavorite(product); }}
        className="absolute top-2 right-2 z-10 text-red-500 bg-white p-1.5 rounded-full shadow-xs border border-gray-100 hover:scale-110 transition-transform"
      >
        <Heart size={16} className="fill-red-500" />
      </button>
      
      <div className={viewMode === 'grid' ? '' : 'flex flex-row gap-3'}>
        <div className={`${viewMode === 'grid' ? 'aspect-square mb-3' : 'w-20 h-20 sm:w-24 sm:h-24 shrink-0'} bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center mix-blend-multiply p-2 relative`}>
          <img src={displayData.imageUrl || displayData.images?.[0] || "https://via.placeholder.com/200x200?text=No+Image"} alt={displayData.name} className="w-full h-full object-contain group-hover:scale-105 transition duration-500"  loading="lazy" />
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
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-red-100 text-red-600">หมดสต๊อก</span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-emerald-100 text-emerald-600">มีสินค้า</span>
              )}
            </div>
            <h3 className={`font-semibold text-gray-700 line-clamp-2 group-hover:text-emerald-600 text-xs ${viewMode === 'grid' ? 'mb-2' : ''}`}>{displayData.name}</h3>
            
            {/* Note & Tags Summary (Collapsed State) */}
            {viewMode === 'list' && !isExpanded && (tags.length > 0 || note) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-sm text-[9px] font-medium flex items-center gap-1">
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
                className="w-full text-xs p-2 rounded-md border border-gray-200 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden resize-none transition-all"
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
                  <span key={idx} className="bg-white text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 shadow-xs">
                    {tag}
                    <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="text-emerald-400 hover:text-emerald-700 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <input 
                type="text"
                className="w-full text-xs p-2 rounded-md border border-gray-200 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all"
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

export default React.memo(FavoriteItemCard);
