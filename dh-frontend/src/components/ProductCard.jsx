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
      className="group cursor-pointer bg-slate-100 p-2 md:p-3 rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:border-brand-light hover:shadow-premium-hover transition-all duration-300 relative animate-in fade-in"
    >
      <div className="relative aspect-square w-full bg-white rounded-lg flex items-center justify-center p-4 overflow-hidden mb-2">
        <div className="absolute inset-0 bg-linear-to-br from-brand-light/20 to-transparent opacity-50 pointer-events-none"></div>
        <LazyImage 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full group-hover:scale-105 transition-transform duration-500 mix-blend-multiply relative z-10"
          onError={(e) => { e.target.src = '/logo.png' }}
        />
        
        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md border border-slate-200/50 shadow-xs z-20">
          <span className={`w-1.5 h-1.5 rounded-full ${hasStock ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
          <span className="text-[9px] md:text-[10px] font-bold text-slate-600 uppercase">
            {hasStock ? 'READY' : 'OUT OF STOCK'}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col grow px-1">
        <h3 className="text-sm md:text-base font-bold text-slate-800 line-clamp-1 group-hover:text-brand transition-colors leading-relaxed">
          {name}
        </h3>
        <div className="text-[10px] md:text-xs text-slate-600 line-clamp-1 mb-2">
          SKU: {sku}
        </div>
        <div className="mt-auto flex flex-col pt-1">
          <span className="text-base md:text-lg font-bold text-slate-800 leading-none mb-3">
            ฿{price ? price.toLocaleString() : '0'}
          </span>
          <button 
            onClick={(e) => onAddToCart(e, product)}
            disabled={!hasStock || addingState === 'success'}
            className={`w-full py-1.5 md:py-2 rounded-md flex items-center justify-center transition-all duration-300 shadow-xs z-20 text-xs font-bold uppercase tracking-widest ${
              addingState === 'success'
                ? 'bg-green-500 text-white scale-95'
                : !hasStock 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500 hover:shadow-md active:scale-95'
            }`}
            aria-label="Add to cart"
          >
            {addingState === 'success' ? (
                <span className="flex items-center gap-1"><CheckCircle2 size={16} strokeWidth={2.5} /> ADDED</span>
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
