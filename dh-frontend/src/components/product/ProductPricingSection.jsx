import { useState } from 'react';
import { Cpu, Package, Truck, ShoppingCart, Heart, CheckCircle2, Minus, Plus, Zap, Copy, Check } from 'lucide-react';
import VariantSelector from './VariantSelector';
import { useFavorites } from '../../context/FavoritesProvider';
import { trackMarketplaceClick } from '../../firebase/productAnalyticsService';

export default function ProductPricingSection({
  product,
  brand,
  model,
  name,
  shortDescription,
  price,
  salePrice,
  isOutOfStock,
  isLowStock,
  availableStock,
  creditConfig,
  quantity = 1,
  increaseQuantity,
  decreaseQuantity,
  isAdding,
  addSuccess,
  handleAddToCart,
  handleBuyNow,
  calculateEarnedPoints,
  shopeeUrl,
  lazadaUrl,
  tiktokUrl,
  facebookUrl,
  lineAddFriendUrl,
  variantOptions,
  variants,
  selectedVariant,
  setSelectedVariant,
  showVariantError,
  children
}) {
  const handleVariantSelect = (optName, val) => {
    setSelectedVariant(prev => ({
      ...prev,
      [optName]: val
    }));
  };
  
  // เช็คว่าต้องเลือกตัวเลือกไหม
  const needsSelection = variantOptions && variantOptions.length > 0;
  const isSelectionComplete = selectedVariant && Object.keys(selectedVariant).length === variantOptions?.length;

  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = product ? isFavorite(product.id) : false;

  const [copiedSku, setCopiedSku] = useState(false);

  const handleCopySku = () => {
    const skuToCopy = model || product?.sku || product?.id || '';
    if (skuToCopy && navigator.clipboard) {
      navigator.clipboard.writeText(skuToCopy);
      setCopiedSku(true);
      setTimeout(() => setCopiedSku(false), 2000);
    }
  };

  const handleShare = (platform) => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const title = name || model || 'DH Notebook สินค้าคุณภาพ';
    const image = product?.images?.[0] || product?.imageUrl || '';
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}&media=${encodeURIComponent(image)}`;
        break;
      case 'line':
        shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
        break;
      default:
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=500,scrollbars=yes,resizable=yes');
    }
  };

  return (
    <div className="p-6 md:p-10 flex flex-col">
      <div className="mb-2 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm font-tech text-slate-500 font-bold flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-md shrink-0">
          <Cpu size={14} className="text-slate-400" /> DH-SKU: {model}
          <button 
            type="button"
            onClick={handleCopySku}
            className="ml-1.5 text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded cursor-pointer"
            title="คัดลอก SKU"
            aria-label="คัดลอก SKU"
          >
            {copiedSku ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </span>

        {/* Top Right Action Group: Share Bar + Heart Button */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-auto">
          {/* 🔗 Social Share Bar */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 select-none mr-0.5">Share</span>
            
            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleShare('facebook')}
              className="w-7 h-7 inline-flex items-center justify-center rounded-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
              title="แชร์ไปยัง Facebook"
              aria-label="Share on Facebook"
            >
              <img src="/images/share_fb.png" alt="Facebook" className="w-full h-full object-contain rounded-sm" />
            </button>

            {/* X */}
            <button
              type="button"
              onClick={() => handleShare('x')}
              className="w-7 h-7 inline-flex items-center justify-center rounded-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
              title="แชร์ไปยัง X (Twitter)"
              aria-label="Share on X"
            >
              <img src="/images/share_x.png" alt="X" className="w-full h-full object-contain rounded-sm" />
            </button>

            {/* Pinterest */}
            <button
              type="button"
              onClick={() => handleShare('pinterest')}
              className="w-7 h-7 inline-flex items-center justify-center rounded-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
              title="แชร์ไปยัง Pinterest"
              aria-label="Share on Pinterest"
            >
              <img src="/images/share_pinterest.png" alt="Pinterest" className="w-full h-full object-contain rounded-sm" />
            </button>

            {/* LINE */}
            <button
              type="button"
              onClick={() => handleShare('line')}
              className="w-7 h-7 inline-flex items-center justify-center rounded-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
              title="แชร์ไปยัง LINE"
              aria-label="Share on LINE"
            >
              <img src="/images/share_line.png" alt="LINE" className="w-full h-full object-contain rounded-sm" />
            </button>
          </div>

          {/* Divider before Heart */}
          <div className="h-5 w-[1px] bg-slate-200"></div>

          {/* Favorite Button (ย้ายมาไว้มุมขวาบน) */}
          <button 
            type="button"
            onClick={() => product && toggleFavorite(product)}
            className={`w-9 h-9 md:w-10 md:h-10 border rounded-md flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer ${
              isFav 
                ? 'bg-red-50 border-red-300 text-red-500' 
                : 'bg-white border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
            }`}
            aria-label={isFav ? "ลบออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
          >
            <Heart size={18} className={isFav ? "fill-current text-red-500" : ""} />
          </button>
        </div>
      </div>

      <h1 className="text-xl md:text-2xl font-semibold text-slate-700 leading-tight mb-3">
        {name}
      </h1>

      {/* Short Description Section */}
      {shortDescription && (
        <p className="text-lg font-medium text-slate-600 mb-5 border-l-[3px] border-cyber-blue pl-4 py-0.5">
          {shortDescription}
        </p>
      )}

      {/* Pricing */}
      <div className="mb-6 flex items-end gap-3">
        {salePrice ? (
          <>
            <span className="text-3xl md:text-4xl font-bold text-cyber-emerald">฿{Number(salePrice || 0).toLocaleString()}</span>
            <span className="text-lg text-slate-400 line-through mb-1">฿{Number(price || 0).toLocaleString()}</span>
          </>
        ) : (
          <span className="text-3xl md:text-4xl font-bold text-slate-800">฿{Number(price || 0).toLocaleString()}</span>
        )}
      </div>
      

      {/* Variant Selectors (SRP Component) */}
      <VariantSelector 
        variantOptions={variantOptions}
        variants={variants}
        selectedVariant={selectedVariant}
        onVariantSelect={handleVariantSelect}
        showError={showVariantError}
      />

      {/* Status & Shipping */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-50 p-3 rounded-md border border-slate-200 shadow-xs flex items-center gap-3">
          <Package className={isOutOfStock ? "text-red-400" : isLowStock ? "text-amber-500" : "text-cyber-emerald"} size={20} />
          <div>
            <div className="text-xs text-slate-500">Status</div>
            <div className={`font-bold text-sm ${isOutOfStock ? "text-red-500" : isLowStock ? "text-amber-600" : "text-slate-800"}`}>
              {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK (ใกล้หมด)' : 'IN STOCK'}
            </div>
          </div>
        </div>
        <div className="bg-slate-50 p-3 rounded-md border border-slate-200 shadow-xs flex items-center gap-3">
          <Truck className="text-cyber-blue" size={20} />
          <div>
            <div className="text-xs text-slate-500">Shipping</div>
            <div className="font-bold text-sm text-slate-800">Ready to Ship</div>
          </div>
        </div>
      </div>

      {/* 💬 LINE Add Friend & Quick Marketplace Badges */}
      <div className="mb-5 flex items-center justify-start gap-7">
        {/* LINE Add Friend */}
        <a 
          href={lineAddFriendUrl || "https://line.me/ti/p/"} 
          target="_blank" 
          rel="noopener noreferrer" 
          onClick={() => trackMarketplaceClick('line', product)}
          className="relative inline-block group hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 rounded-lg shrink-0"
        >
          {/* Subtle pulse glow effect behind the button */}
          <div className="absolute inset-0 bg-[#00B900] opacity-20 group-hover:opacity-40 blur-md rounded-full transition-opacity duration-300 animate-pulse"></div>
          
          <img 
            src="https://scdn.line-apps.com/n/line_add_friends/btn/en.png" 
            alt="LINE Add Friends" 
            className="h-[44px] object-contain drop-shadow-md relative z-10" 
            loading="lazy" 
          />
        </a>

        {/* Quick Marketplace Badges (Circle Icons) */}
        <div className="flex items-center gap-5">
          {/* Shopee Quick Badge (Circle) */}
          {(shopeeUrl || product?.externalLinks?.shopee || product?.shopeeUrl) ? (
            <a
              href={shopeeUrl || product?.externalLinks?.shopee || product?.shopeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackMarketplaceClick('shopee', product)}
              className="relative inline-flex items-center justify-center rounded-full hover:scale-[1.08] active:scale-[0.95] transition-all duration-200 shrink-0 shadow-[0_3px_8px_rgba(0,0,0,0.16)] hover:shadow-[0_5px_14px_rgba(0,0,0,0.22)]"
              title="สั่งซื้อผ่าน Shopee"
            >
              <img 
                src="/images/shopee_circle.png" 
                alt="Shopee" 
                className="w-10 h-10 object-contain rounded-full" 
              />
            </a>
          ) : (
            <div 
              className="relative inline-flex items-center justify-center rounded-full grayscale opacity-35 cursor-not-allowed select-none shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.08)]"
              title="ยังไม่มีลิงก์จำหน่ายบน Shopee"
              aria-disabled="true"
            >
              <img 
                src="/images/shopee_circle.png" 
                alt="Shopee" 
                className="w-10 h-10 object-contain pointer-events-none rounded-full" 
              />
            </div>
          )}

          {/* Lazada Quick Badge (Circle) */}
          {(lazadaUrl || product?.externalLinks?.lazada || product?.lazadaUrl) ? (
            <a
              href={lazadaUrl || product?.externalLinks?.lazada || product?.lazadaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackMarketplaceClick('lazada', product)}
              className="relative inline-flex items-center justify-center rounded-full hover:scale-[1.08] active:scale-[0.95] transition-all duration-200 shrink-0 shadow-[0_3px_8px_rgba(0,0,0,0.16)] hover:shadow-[0_5px_14px_rgba(0,0,0,0.22)]"
              title="สั่งซื้อผ่าน Lazada"
            >
              <img 
                src="/images/lazada_quick_badge.png" 
                alt="Lazada" 
                className="w-10 h-10 object-contain rounded-full" 
              />
            </a>
          ) : (
            <div 
              className="relative inline-flex items-center justify-center rounded-full grayscale opacity-35 cursor-not-allowed select-none shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.08)]"
              title="ยังไม่มีลิงก์จำหน่ายบน Lazada"
              aria-disabled="true"
            >
              <img 
                src="/images/lazada_quick_badge.png" 
                alt="Lazada" 
                className="w-10 h-10 object-contain pointer-events-none rounded-full" 
              />
            </div>
          )}
        </div>

        {/* 👈🏼 ข้อความแนะนำสั่งซื้อ (บรรทัดตรง ตัวหนังสือเอียง italic เด่นชัด) */}
        <div className="flex items-center gap-1.5 select-none">
          <span className="text-xl md:text-2xl filter drop-shadow-xs">👈🏼</span>
          <span className="text-sm md:text-base font-black italic tracking-tight text-[#f04e69]">
            กดสั่งตรงนี้ได้เลยค่ะ!
          </span>
        </div>
      </div>

      {/* Insert children here (Knowledge & Full Description) */}
      <div className="mb-4">
        {children}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 h-10 md:h-11 shrink-0 shadow-xs px-1">
            <button 
              type="button"
              onClick={decreaseQuantity}
              disabled={isOutOfStock || quantity <= 1}
              className="w-8 md:w-9 h-8 md:h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="ลดจำนวน"
            >
              <Minus size={15} />
            </button>
            <span className="w-8 md:w-9 text-center font-bold text-slate-800 text-sm md:text-base select-none">
              {quantity}
            </span>
            <button 
              type="button"
              onClick={increaseQuantity}
              disabled={isOutOfStock || (availableStock > 0 && quantity >= availableStock)}
              className="w-8 md:w-9 h-8 md:h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="เพิ่มจำนวน"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Add to Cart Button (แบบทึบขอบเทา ตามภาพตัวอย่างบน) */}
          <button 
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding || addSuccess}
            className={`flex-1 h-10 md:h-11 rounded-full font-bold text-sm md:text-base tracking-wide flex items-center justify-center gap-2 transition-all duration-300 border-[3.5px] cursor-pointer active:scale-[0.98] ${
              isOutOfStock 
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : addSuccess
                  ? 'bg-emerald-50 text-cyber-emerald border-cyber-emerald'
                  : 'bg-[#f04e69] text-white border-slate-200 hover:border-slate-300 hover:bg-[#e03b57] shadow-sm hover:shadow-md'
            }`}
          >
            {isAdding ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> กำลังประมวลผล</>
            ) : addSuccess ? (
              <><CheckCircle2 size={18} strokeWidth={2.5} /> เพิ่มลงตะกร้าแล้ว</>
            ) : isOutOfStock ? (
              <>สินค้าหมด</>
            ) : (needsSelection && !isSelectionComplete) ? (
              <>โปรดเลือกตัวเลือกสินค้า</>
            ) : (
              <><ShoppingCart size={18} /> ใส่ตะกร้า</>
            )}
          </button>

          {/* Buy Now Button (แบบกรอบชมพูขอบหนา ตามภาพตัวอย่างล่าง) */}
          {!isOutOfStock && (
            <button
              onClick={handleBuyNow}
              disabled={isAdding}
              className="flex-1 h-10 md:h-11 rounded-full font-bold text-sm md:text-base tracking-wide flex items-center justify-center gap-2 border-[3.5px] border-[#f04e69] bg-slate-100 text-[#f04e69] hover:bg-[#f04e69] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98]"
            >
              <Zap size={18} className="fill-current" />
              ซื้อเลย
            </button>
          )}
        </div>
      </div>

      {/* 🛍️ Marketplace Buttons (Official Brand Badges with Telemetry) */}
      <div className="mt-8 md:mt-10 flex flex-col gap-3">
        <div className="text-sm md:text-base font-semibold text-slate-700">
          สั่งซื้อ <span className="text-brand font-bold">{model || product?.sku || product?.id}</span> จากแพลตฟอร์มอื่นๆ
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* 1. Shopee */}
          {(shopeeUrl || product?.externalLinks?.shopee || product?.shopeeUrl) ? (
            <a 
              href={shopeeUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => trackMarketplaceClick('shopee', product)}
              className="flex items-center justify-center rounded-md transition-all duration-300 hover:opacity-90 hover:scale-[1.03] active:scale-[0.98] w-full"
              title="สั่งซื้อผ่าน Shopee"
            >
              <img 
                src="/images/shopee_btn.png" 
                alt="Shopee" 
                className="w-full h-auto max-h-10 sm:max-h-9 object-contain cursor-pointer transition-all duration-300"
              />
            </a>
          ) : (
            <div 
              className="flex items-center justify-center rounded-md grayscale opacity-35 cursor-not-allowed select-none transition-all duration-300 w-full"
              title="ยังไม่มีลิงก์จำหน่ายบน Shopee"
              aria-disabled="true"
            >
              <img 
                src="/images/shopee_btn.png" 
                alt="Shopee" 
                className="w-full h-auto max-h-10 sm:max-h-9 object-contain pointer-events-none"
              />
            </div>
          )}

          {/* 2. Lazada */}
          {(lazadaUrl || product?.externalLinks?.lazada || product?.lazadaUrl) ? (
            <a 
              href={lazadaUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => trackMarketplaceClick('lazada', product)}
              className="flex items-center justify-center rounded-md transition-all duration-300 hover:opacity-90 hover:scale-[1.03] active:scale-[0.98] w-full"
              title="สั่งซื้อผ่าน Lazada"
            >
              <img 
                src="/images/lazada_btn.png" 
                alt="Lazada" 
                className="w-full h-auto max-h-10 sm:max-h-9 object-contain cursor-pointer transition-all duration-300"
              />
            </a>
          ) : (
            <div 
              className="flex items-center justify-center rounded-md grayscale opacity-35 cursor-not-allowed select-none transition-all duration-300 w-full"
              title="ยังไม่มีลิงก์จำหน่ายบน Lazada"
              aria-disabled="true"
            >
              <img 
                src="/images/lazada_btn.png" 
                alt="Lazada" 
                className="w-full h-auto max-h-10 sm:max-h-9 object-contain pointer-events-none"
              />
            </div>
          )}

          {/* 3. TikTok */}
          {(tiktokUrl || product?.externalLinks?.tiktok || product?.tiktokUrl) ? (
            <a 
              href={tiktokUrl || product?.externalLinks?.tiktok || product?.tiktokUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => trackMarketplaceClick('tiktok', product)}
              className="flex items-center justify-center rounded-md transition-all duration-300 hover:opacity-90 hover:scale-[1.03] active:scale-[0.98] w-full"
              title="สั่งซื้อผ่าน TikTok Shop"
            >
              <img 
                src="/images/tiktok_btn.png" 
                alt="TikTok" 
                className="w-full h-auto max-h-10 sm:max-h-9 object-contain cursor-pointer transition-all duration-300"
              />
            </a>
          ) : (
            <div 
              className="flex items-center justify-center rounded-md grayscale opacity-35 cursor-not-allowed select-none transition-all duration-300 w-full"
              title="ยังไม่มีลิงก์จำหน่ายบน TikTok Shop"
              aria-disabled="true"
            >
              <img 
                src="/images/tiktok_btn.png" 
                alt="TikTok" 
                className="w-full h-auto max-h-10 sm:max-h-9 object-contain pointer-events-none"
              />
            </div>
          )}

          {/* 4. Facebook */}
          {(facebookUrl || product?.externalLinks?.facebook || product?.facebookUrl) ? (
            <a 
              href={facebookUrl || product?.externalLinks?.facebook || product?.facebookUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => trackMarketplaceClick('facebook', product)}
              className="flex items-center justify-center rounded-md transition-all duration-300 hover:opacity-90 hover:scale-[1.03] active:scale-[0.98] w-full"
              title="สั่งซื้อผ่าน Facebook Shop"
            >
              <img 
                src="/images/facebook_btn.png" 
                alt="Facebook" 
                className="w-full h-auto max-h-10 sm:max-h-9 object-contain cursor-pointer transition-all duration-300"
              />
            </a>
          ) : (
            <div 
              className="flex items-center justify-center rounded-md grayscale opacity-35 cursor-not-allowed select-none transition-all duration-300 w-full"
              title="ยังไม่มีลิงก์จำหน่ายบน Facebook"
              aria-disabled="true"
            >
              <img 
                src="/images/facebook_btn.png" 
                alt="Facebook" 
                className="w-full h-auto max-h-10 sm:max-h-9 object-contain pointer-events-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
