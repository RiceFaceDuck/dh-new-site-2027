import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import LazyImage from './common/LazyImage';

const ProductCard = ({ product, hasStock, addingState, onAddToCart }) => {
  const navigate = useNavigate();
  const { id, name, price, imageUrl, sku } = product;

  return (
    <div 
      onClick={() => navigate(`/product/${id}`, { state: { product } })} 
      className="group cursor-pointer bg-white p-2.5 md:p-3 rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col hover:border-brand/40 shadow-xs hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 relative animate-in fade-in"
    >
      <div className="relative aspect-square w-full bg-slate-50/80 rounded-xl flex items-center justify-center overflow-hidden mb-2.5 border border-slate-100">
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
      
      <div className="flex flex-col grow px-0.5">
        <h3 className="text-sm md:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-brand transition-colors leading-relaxed">
          {name}
        </h3>
        <div className="text-[10px] md:text-xs text-slate-500 line-clamp-1 mb-2">
          SKU: {sku}
        </div>
        <div className="mt-auto flex flex-col pt-1">
          <span className="text-base md:text-lg font-black text-slate-900 leading-none mb-3">
            ฿{price ? price.toLocaleString() : '0'}
          </span>
          <button 
            onClick={(e) => onAddToCart(e, product)}
            disabled={!hasStock || addingState === 'success'}
            className={`w-full py-2 rounded-xl flex items-center justify-center transition-all duration-300 shadow-xs z-20 text-xs font-bold uppercase tracking-wider ${
              addingState === 'success'
                ? 'bg-emerald-500 text-white scale-95 shadow-sm'
                : !hasStock 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-400 text-slate-950 hover:bg-amber-500 hover:shadow-md active:scale-95'
            }`}
            aria-label="Add to cart"
          >
            {addingState === 'success' ? (
                <span className="flex items-center gap-1.5"><CheckCircle2 size={16} strokeWidth={2.5} /> ADDED</span>
            ) : (
                "ADD TO CART"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);
