import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingCart } from 'lucide-react';
import LazyImage from './common/LazyImage';

const ProductCard = ({ product, hasStock, addingState, onAddToCart }) => {
  const navigate = useNavigate();
  const { id, name, price, imageUrl, sku, category } = product;
  const displayCategory = typeof category === 'string' ? category.trim() : '';

  return (
    <article
      onClick={() => navigate(`/product/${id}`, { state: { product } })}
      className="group cursor-pointer bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col h-full shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:border-slate-300 hover:shadow-[0_8px_18px_-6px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 relative animate-in fade-in [content-visibility:auto] [contain-intrinsic-size:auto_290px]"
    >
      {/* Image Zone */}
      <div className="relative aspect-square w-full bg-white border-b border-slate-100 flex items-center justify-center overflow-hidden p-2.5">
        {displayCategory && (
          <span className="absolute top-2 left-2 z-20 bg-[#EEF2FF] text-[#1E40AF] text-[10px] md:text-[10.5px] font-medium px-1.5 py-0.5 rounded-sm max-w-[60%] truncate pointer-events-none">
            {displayCategory}
          </span>
        )}

        {/* Static Calm UI Badge: แสดงเฉพาะกรณีสินค้าหมด (ไม่แสดงป้ายพร้อมส่ง) */}
        {!hasStock && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] px-1.5 py-0.5 rounded-sm pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
            <span className="font-heading text-[10px] md:text-[10.5px] font-semibold leading-none">
              สินค้าหมด
            </span>
          </div>
        )}

        <LazyImage
          src={imageUrl}
          alt={name}
          className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 relative z-10 ${
            !hasStock ? 'opacity-55 grayscale-[35%]' : ''
          }`}
          onError={(e) => { e.target.src = '/logo.png'; }}
        />
      </div>

      {/* Content Zone */}
      <div className="p-2.5 md:p-3 flex flex-col gap-1 flex-1 text-left">
        <div className="font-heading text-[10.5px] md:text-[11px] font-medium text-brand truncate">
          SKU: {sku}
        </div>
        <h3 className="text-xs md:text-[13px] font-medium text-slate-900 leading-snug line-clamp-2 min-h-[2.15rem] md:min-h-[2.35rem] group-hover:text-brand transition-colors">
          {name}
        </h3>

        {/* Footer: Single-Row Price + Button #6 (Gold Cart CTA) */}
        <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
          <span className="font-heading text-[13.5px] md:text-[15.5px] font-bold text-[#132642] whitespace-nowrap leading-none">
            ฿{price ? price.toLocaleString() : '0'}
          </span>

          <button
            type="button"
            onClick={(e) => onAddToCart(e, product)}
            disabled={!hasStock || addingState === 'success'}
            className={`h-[30px] md:h-8 px-2 md:px-2.5 rounded-md font-heading text-[11px] md:text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0 transition-all duration-150 z-20 ${
              addingState === 'success'
                ? 'bg-emerald-500 text-white border border-emerald-600 shadow-xs'
                : !hasStock
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                  : 'bg-linear-to-b from-[#FFD23F] to-[#FFC107] hover:from-[#FFC107] hover:to-[#FFB300] text-[#7C2D12] border border-[#F59E0B] hover:border-[#D97706] shadow-[0_1px_3px_rgba(245,158,11,0.22)] active:scale-95 cursor-pointer'
            }`}
            aria-label={hasStock ? 'สั่งซื้อ' : 'สินค้าหมด'}
            title={hasStock ? 'เพิ่มลงตะกร้า' : 'สินค้าหมด'}
          >
            {addingState === 'success' ? (
              <>
                <CheckCircle2 size={13} strokeWidth={2.2} className="shrink-0" />
                <span>เรียบร้อย</span>
              </>
            ) : !hasStock ? (
              <span>หมด</span>
            ) : (
              <>
                <ShoppingCart size={13} strokeWidth={2.2} className="shrink-0" />
                <span>สั่งซื้อ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default React.memo(ProductCard);
