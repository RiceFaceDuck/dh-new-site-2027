import React, { useState } from 'react';
import { ChevronRight, ShoppingCart, CheckCircle2, Loader2, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { cartService } from '../firebase/cartService';

const ProductList = ({ products, loading }) => {
  const navigate = useNavigate();
  const [addingState, setAddingState] = useState({}); // Track adding state per product ID

  const handleAddToCart = async (e, product) => {
    e.stopPropagation(); // ป้องกันการ trigger onClick ของ div หลักที่พาไปหน้า Detail
    
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนหยิบสินค้าใส่ตะกร้า");
      return;
    }

    setAddingState(prev => ({ ...prev, [product.id]: 'loading' }));
    
    try {
      await cartService.addToCart(user.uid, product, 1);
      
      setAddingState(prev => ({ ...prev, [product.id]: 'success' }));
      setTimeout(() => {
        setAddingState(prev => ({ ...prev, [product.id]: null }));
      }, 2000);
    } catch (error) {
      console.error("🔥 Error add to cart:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
      setAddingState(prev => ({ ...prev, [product.id]: null }));
    }
  };

  // คอมโพเนนต์จำลองโครงร่างระหว่างรอโหลดข้อมูล (Tech Skeleton)
  const SkeletonCard = () => (
    <div className="rounded-md border border-slate-200 bg-white p-3 flex flex-col h-[280px]">
      <div className="w-full h-36 bg-slate-100 rounded-sm animate-pulse mb-3"></div>
      <div className="w-1/3 h-3 bg-slate-100 rounded-sm animate-pulse mb-2"></div>
      <div className="w-full h-4 bg-slate-100 rounded-sm animate-pulse mb-1"></div>
      <div className="w-2/3 h-4 bg-slate-100 rounded-sm animate-pulse mb-auto"></div>
      <div className="flex justify-between items-end mt-4">
        <div className="w-1/2 h-6 bg-slate-100 rounded-sm animate-pulse"></div>
        <div className="w-9 h-9 bg-slate-100 rounded-sm animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <div className="mb-12 md:mb-20">
      
      {/* Tech Heading */}
      <div className="flex justify-between items-end mb-4 px-1">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center">
          <span className="w-1.5 h-5 bg-cyber-blue rounded-sm mr-3 inline-block shadow-[0_0_8px_rgba(14,165,233,0.5)]"></span>
          สินค้าแนะนำ / มาใหม่
        </h2>
        <button className="text-sm font-semibold text-cyber-blue hover:text-sky-600 flex items-center group transition-colors">
          ดูทั้งหมด 
          <ChevronRight size={16} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {loading ? (
        // Grid สำหรับหน้า Skeleton Loading
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 px-1">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        // Grid สำหรับแสดงสินค้าจริง
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 px-1">
          {products.map((product) => {
            const hasStock = product.stock > 0;
            
            return (
              <div 
                key={product.id} 
                onClick={() => navigate(`/product/${product.id}`)}
                className="group cursor-pointer bg-white rounded-md border border-slate-200 overflow-hidden flex flex-col hover:border-cyber-emerald hover:shadow-glow-emerald transition-all duration-300 relative"
              >
                {/* 1. Image & Tech Overlay Area */}
                <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center p-4 overflow-hidden border-b border-slate-100">
                  <img 
                    src={product.imageUrl || '/logo.png'} 
                    alt={product.name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = '/logo.png' }}
                  />
                  
                  {/* Status Indicator (จุดไฟสถานะ) */}
                  <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-sm border border-slate-200/50 shadow-sm z-10">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasStock ? 'bg-cyber-emerald animate-pulse' : 'bg-red-500'}`}></span>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-600 font-tech">
                      {hasStock ? 'READY' : 'OUT OF STOCK'}
                    </span>
                  </div>

                  {/* Quick Tech-Specs (แสดงข้อมูลเมื่อ Hover บน Desktop เท่านั้น ประหยัดการคลิกเข้าไปดู) */}
                  <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex flex-col items-center justify-center p-4 text-center z-20">
                    <Cpu size={24} className="text-cyber-blue mb-2" strokeWidth={1.5} />
                    <span className="text-white text-[10px] font-tech mb-2 tracking-widest border-b border-slate-700 pb-1 w-full">QUICK SPECS</span>
                    <span className="text-slate-300 text-xs font-medium mt-1">Brand: <span className="text-white">{product.brand || 'OEM'}</span></span>
                    <span className="text-slate-300 text-xs font-medium">Stock: <span className={hasStock ? 'text-cyber-emerald' : 'text-red-400'}>{product.stock || 0} Units</span></span>
                    
                    <div className="mt-4 px-4 py-1.5 border border-cyber-emerald text-cyber-emerald text-[10px] rounded-sm font-bold uppercase tracking-wider bg-emerald-500/10">
                      View Details
                    </div>
                  </div>
                </div>
                
                {/* 2. Data Info Area */}
                <div className="p-3 md:p-4 flex flex-col flex-grow">
                  {/* SKU / Code */}
                  <div className="text-[10px] md:text-xs text-slate-400 font-tech mb-1 uppercase tracking-wider">
                    SKU: {product.sku || product.id.substring(0, 8)}
                  </div>
                  
                  {/* Product Name */}
                  <h3 className="text-xs md:text-sm font-semibold text-slate-800 line-clamp-2 mb-2 group-hover:text-cyber-emerald transition-colors leading-relaxed">
                    {product.name}
                  </h3>
                  
                  <div className="mt-auto flex items-end justify-between pt-2">
                    {/* Price */}
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] text-slate-400 font-medium leading-none mb-1">Partner Price</span>
                      <span className="text-sm md:text-lg font-bold text-cyber-blue font-tech leading-none">
                        ฿{product.price ? product.price.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    
                    {/* Add to cart Button (Tech Sharp Style) */}
                    <button 
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={!hasStock || addingState[product.id] === 'loading' || addingState[product.id] === 'success'}
                      className={`w-8 h-8 md:w-9 md:h-9 rounded-sm flex items-center justify-center transition-all duration-300 shadow-sm ${
                        addingState[product.id] === 'success'
                          ? 'bg-emerald-100 text-cyber-emerald border border-emerald-200'
                          : !hasStock 
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-cyber-emerald hover:text-white hover:border-cyber-emerald'
                      }`}
                      aria-label="Add to cart"
                    >
                      {addingState[product.id] === 'loading' ? (
                         <Loader2 size={16} className="animate-spin text-cyber-emerald" />
                      ) : addingState[product.id] === 'success' ? (
                         <CheckCircle2 size={16} strokeWidth={2.5} />
                      ) : (
                         <ShoppingCart size={16} strokeWidth={2} className={`${hasStock ? 'group-hover:scale-110' : ''} transition-transform`} />
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductList;