import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingCart } from 'lucide-react';
import LazyImage from './common/LazyImage';

const ProductCard = ({ product, hasStock, addingState, onAddToCart }) => {
  const navigate = useNavigate();
  const { id, name, price, imageUrl, sku } = product;

  return (
    <div 
      onClick={() => navigate(`/product/${id}`, { state: { product } })} 
      className="group cursor-pointer p-1 md:p-1.5 flex flex-col hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 relative animate-in fade-in"
    >
      <div className="relative aspect-square w-full rounded-sm flex items-center justify-center overflow-hidden mb-2.5">
        <div className="absolute inset-0 bg-linear-to-br from-brand-light/10 to-transparent opacity-60 pointer-events-none"></div>
        <LazyImage 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-multiply relative z-10"
          onError={(e) => { e.target.src = '/logo.png' }}
        />
        
        <div className="absolute top-2 left-2 flex items-center space-x-1.5 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-200/70 shadow-2xs z-20">
          <span className={`w-1.5 h-1.5 rounded-full ${hasStock ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          <span className="text-[9px] md:text-[10px] font-bold text-slate-700 uppercase">
            {hasStock ? 'READY' : 'OUT OF STOCK'}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col grow px-0.5 text-center">
        <h3 className="text-sm md:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-brand transition-colors leading-relaxed">
          {name}
        </h3>
        <div className="text-[10px] md:text-xs text-slate-500 line-clamp-1 mb-2">
          SKU: {sku}
        </div>
        <div className="mt-auto flex flex-col items-center justify-center pt-1">
          <span className="text-sm md:text-base font-normal text-red-600 leading-none mb-2">
            {price ? price.toLocaleString() : '0'} THB
          </span>
          <button 
            onClick={(e) => onAddToCart(e, product)}
            disabled={!hasStock || addingState === 'success'}
            className={`px-3.5 py-1.5 rounded-sm flex items-center justify-center gap-1.5 transition-all duration-300 shadow-xs z-20 text-xs font-bold ${
              addingState === 'success'
                ? 'bg-emerald-500 text-white scale-95 shadow-sm'
                : !hasStock 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#ffc107] hover:bg-[#ffb300] text-red-800 border border-amber-300 shadow-xs active:scale-95'
            }`}
            aria-label="Add to cart"
          >
            {addingState === 'success' ? (
                <span className="flex items-center gap-1 text-white"><CheckCircle2 size={14} strokeWidth={2.5} /> เรียบร้อย</span>
            ) : (
                <>
                  <ShoppingCart size={14} strokeWidth={2.2} className="text-red-800 shrink-0" />
                  <span className="text-red-800 font-bold tracking-tight">สั่งซื้อ</span>
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);
