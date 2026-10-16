import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Tag, FileText, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../../context/CartProvider';

const FavoriteItemCard = ({ 
  product, 
  liveProduct,
  loadingLive = false,
  viewMode, 
  updateFavoriteDetails, 
  toggleFavorite, 
  isSelected, 
  onSelect, 
  moveFavoriteUp,
  moveFavoriteDown,
  isFirst,
  isLast
}) => {
  const navigate = useNavigate();
  const { addToCart, cartItems, removeFromCart, updateQuantity } = useCart();
  
  // Note/Tags states
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState(product.note || '');
  const [tagInput, setTagInput] = useState('');
  const tags = product.tags || [];

  const displayData = liveProduct || product;
  const isDiscontinued = !loadingLive && !liveProduct && Boolean(product.id);
  const priceToShow = displayData.salePrice || displayData.price || 0;
  const isOutOfStock = isDiscontinued || displayData.isOutOfStock || displayData.stockQuantity <= 0;
  
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
      className={`bg-white rounded-xs border border-slate-300 shadow-sm hover:shadow-md transition-all hover:border-slate-400 group relative cursor-pointer ${viewMode === 'grid' ? 'p-3.5 flex flex-col h-full' : 'p-3.5 flex flex-col'} ${isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''}`} 
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
          className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 rounded-xs border-slate-300 focus:ring-emerald-500 cursor-pointer shadow-2xs"
        />
      </div>

      {/* Workstation Top Action Bar: Reorder, Note, Remove */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {moveFavoriteUp && (
          <button 
            onClick={(e) => { e.stopPropagation(); moveFavoriteUp(product.id); }}
            disabled={isFirst}
            className={`p-1 rounded-xs shadow-2xs border border-slate-300 transition-all ${isFirst ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-emerald-700 hover:border-slate-400'}`}
            title="เลื่อนขึ้น"
          >
            <ChevronUp size={14} />
          </button>
        )}
        {moveFavoriteDown && (
          <button 
            onClick={(e) => { e.stopPropagation(); moveFavoriteDown(product.id); }}
            disabled={isLast}
            className={`p-1 rounded-xs shadow-2xs border border-slate-300 transition-all ${isLast ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-emerald-700 hover:border-slate-400'}`}
            title="เลื่อนลง"
          >
            <ChevronDown size={14} />
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className={`p-1 rounded-xs shadow-2xs border transition-all ${isExpanded ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : (product.note || tags.length > 0) ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-white text-slate-500 border-slate-300 hover:text-slate-800 hover:border-slate-400'}`}
          title={isExpanded ? "ย่อหน้าต่างจดงาน" : (product.note ? `หมายเหตุ: ${product.note}` : "จดโน้ต / ใส่แท็ก")}
        >
          <FileText size={14} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product); }}
          className="text-red-500 bg-white/95 p-1 rounded-xs shadow-2xs border border-slate-300 hover:border-red-300 hover:bg-red-50 hover:scale-105 transition-all"
          title="นำออกจากรายการที่ถูกใจ"
        >
          <Heart size={14} className="fill-red-500" />
        </button>
      </div>
      
      <div className={viewMode === 'grid' ? '' : 'flex flex-row gap-3'}>
        <div className={`${viewMode === 'grid' ? 'aspect-square mb-3 mt-4' : 'w-20 h-20 sm:w-24 sm:h-24 shrink-0'} bg-slate-50 rounded-xs border border-slate-200 overflow-hidden flex items-center justify-center p-2 relative shadow-2xs`}>
          <img src={displayData.imageUrl || displayData.images?.[0] || "https://via.placeholder.com/200x200?text=No+Image"} alt={displayData.name} className="w-full h-full object-contain group-hover:scale-105 transition duration-500" loading="lazy" />
          {isDiscontinued ? (
            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[1px]">
              <span className="bg-slate-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs border border-white/40 shadow-xs uppercase tracking-wider">ยกเลิกจำหน่าย</span>
            </div>
          ) : isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[1px]">
              <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs border border-white/40 shadow-xs uppercase tracking-wider">หมด</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center flex-wrap gap-1.5 mb-1">
              <span className="text-[10px] text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded-xs border border-slate-200">SKU: {displayData.model || displayData.sku}</span>
              {isDiscontinued ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-slate-200 text-slate-700 border border-slate-300">ยกเลิกจำหน่าย</span>
              ) : isOutOfStock ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-red-50 text-red-700 border border-red-300">หมดสต๊อก</span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-300">มีสินค้า</span>
              )}
            </div>
            <h3 className={`font-semibold text-slate-800 line-clamp-2 group-hover:text-emerald-700 text-xs ${viewMode === 'grid' ? 'mb-2' : ''}`}>{displayData.name}</h3>
            
            {/* Note & Tags Summary (Collapsed State) */}
            {!isExpanded && (tags.length > 0 || note) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-xs text-[9px] font-medium flex items-center gap-1 shadow-2xs">
                    <Tag size={8} /> {tag}
                  </span>
                ))}
                {tags.length > 3 && <span className="text-[9px] text-slate-500 font-semibold">+{tags.length - 3}</span>}
                {note && (
                  <span className="text-[10px] text-slate-600 italic flex items-center gap-1 line-clamp-1 max-w-[200px] bg-slate-100 px-1.5 py-0.5 rounded-xs border border-slate-200">
                    <FileText size={10} className="shrink-0 text-slate-500" /> {note}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className={`mt-auto ${viewMode === 'grid' ? 'pt-2 border-t border-slate-200 flex flex-col gap-2' : 'flex flex-row items-end justify-between gap-2'}`}>
            <div className="flex flex-col">
              <span className={`font-black ${viewMode === 'grid' ? 'text-sm' : 'text-base'} ${isOutOfStock ? 'text-slate-400' : 'text-red-600'}`}>
                ฿{priceToShow.toLocaleString()}
              </span>
              {loadingLive && <span className="text-[9px] text-slate-400">กำลังอัปเดต...</span>}
            </div>
            
            <div className={`flex items-center gap-1.5 ${viewMode === 'grid' ? 'w-full grid grid-cols-2' : ''}`}>
              {!isOutOfStock && (
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
                  className={`flex items-center justify-center px-2.5 py-1.5 rounded-xs text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-indigo-600 hover:border-slate-400 shadow-xs transition-colors ${viewMode === 'grid' ? '' : ''}`}
                >
                  Detail
                </button>
              )}
              
              {isOutOfStock ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(`https://line.me/R/ti/p/@dhnotebook?text=${encodeURIComponent('สอบถามสต๊อกสินค้า SKU: ' + (displayData.model || displayData.sku))}`, '_blank'); }}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xs text-[10px] sm:text-xs font-bold transition-colors bg-[#00B900]/10 text-[#008a00] hover:bg-[#00B900]/20 border border-[#00B900]/40 shadow-xs ${viewMode === 'grid' ? 'col-span-2' : 'w-full'}`}
                  title="สอบถามแอดมิน"
                >
                  💬 สอบถามสต๊อกผ่านแอดมิน
                </button>
              ) : cartQuantity > 0 ? (
                <div className={`flex items-center justify-between bg-emerald-50 rounded-xs border border-emerald-300 shadow-xs overflow-hidden ${viewMode === 'grid' ? '' : 'w-24 sm:w-28'}`}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cartQuantity === 1) removeFromCart(product.id);
                      else updateQuantity(product.id, -1);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-black">-</span>
                  </button>
                  <span className="text-xs font-bold text-emerald-800">{cartQuantity}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      updateQuantity(product.id, 1);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-black">+</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  className={`flex items-center justify-center px-2.5 py-1.5 rounded-xs text-[10px] sm:text-xs font-bold transition-colors bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300 hover:border-emerald-600 shadow-xs ${viewMode === 'grid' ? '' : ''}`}
                >
                  <ShoppingCart size={13} className="mr-1" /> 
                  {viewMode === 'grid' ? 'ซื้อ' : 'ใส่ตะกร้า'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Note & Tags Section (Works in both Grid & List Views) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-300/80 animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-3 bg-slate-100/90 rounded-xs border border-slate-300/80 shadow-2xs flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1 tracking-wider">
                <FileText size={12} /> หมายเหตุ (Notes)
              </label>
              <textarea 
                className="w-full text-xs p-2 rounded-xs border border-slate-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-hidden resize-none shadow-2xs transition-all"
                rows="2"
                placeholder="ระบุหมายเหตุ เช่น สำหรับลูกค้าคุณเอ..."
                value={note}
                onChange={handleNoteChange}
                onBlur={saveNote}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1 tracking-wider">
                <Tag size={12} /> แท็ก (Tags)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {tags.map((tag, idx) => (
                  <span key={idx} className="bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-xs text-[10px] font-medium flex items-center gap-1 shadow-2xs">
                    {tag}
                    <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="text-emerald-500 hover:text-emerald-800 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <input 
                type="text"
                className="w-full text-xs p-2 rounded-xs border border-slate-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-hidden shadow-2xs transition-all"
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

