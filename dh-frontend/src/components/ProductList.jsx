import React, { useState } from 'react';
import { ChevronRight, ShoppingCart, CheckCircle2, Loader2 } from 'lucide-react';
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

  return (
    <div className="mb-10 md:mb-16">
      <div className="flex items-end justify-between mb-6 px-1">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight drop-shadow-sm flex items-center">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3 inline-block"></span>
          สินค้าแนะนำ
        </h2>
        <button className="text-xs md:text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center transition-colors bg-emerald-50/80 hover:bg-emerald-100 px-3 py-1.5 rounded-lg">
          ดูทั้งหมด <ChevronRight size={16} className="ml-0.5" />
        </button>
      </div>

      {loading ? (
        // Skeleton Loading
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm animate-pulse">
              <div className="w-full aspect-square bg-slate-50 rounded-[16px] mb-4"></div>
              <div className="h-4 bg-slate-100 rounded w-full mb-3"></div>
              <div className="h-4 bg-slate-100 rounded w-2/3 mb-5"></div>
              <div className="h-5 bg-slate-100 rounded w-1/2 mt-auto"></div>
            </div>
          ))}
        </div>
      ) : (
        // Product Grid
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {products.map((product) => {
            const imageUrl = product.images?.[0] || product.image || 'https://via.placeholder.com/400x400?text=DH';

            // Stock Status Logic (Using stockQuantity instead of stock)
            const stock = product.stockQuantity || 0;
            const buffer = product.bufferStock || 0;

            let stockStatus = 'หมด';
            let stockColor = 'text-red-600 bg-red-50 border-red-100';

            if (stock > buffer) {
              stockStatus = 'มีสินค้า';
              stockColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
            } else if (stock > 0 && stock <= buffer) {
              stockStatus = 'เหลือน้อย';
              stockColor = 'text-amber-600 bg-amber-50 border-amber-100';
            }

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
                className="group bg-white rounded-[20px] p-4 md:p-5 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col relative h-full cursor-pointer overflow-hidden"
              >
                {/* Badge & Stock Status */}
                <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
                  {product.isPartnerOnly ? (
                    <span className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wider">
                      PARTNER
                    </span>
                  ) : <span></span>}

                  <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded border shadow-sm ${stockColor}`}>
                    {stockStatus}
                  </span>
                </div>

                {/* Product Image */}
                <div className="aspect-square mb-4 bg-white flex items-center justify-center relative mix-blend-multiply pt-4">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition duration-500 drop-shadow-sm"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=Image+Error' }}
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1 flex flex-col">
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mb-1.5 font-medium tracking-wide uppercase">{product.sku || 'SKU: N/A'}</p>
                  <h3 className="text-sm md:text-base font-semibold text-slate-700 line-clamp-2 leading-relaxed mb-4 flex-1 group-hover:text-emerald-600 transition-colors">
                    {product.name}
                  </h3>

                  <div className="mt-auto flex items-end justify-between relative">
                    <div className="flex flex-col">
                      {product.regularPrice && (
                        <span className="text-[11px] sm:text-xs text-slate-400 line-through mb-0.5">
                          ฿{product.regularPrice.toLocaleString()}
                        </span>
                      )}
                      <span className="text-lg md:text-xl font-black text-slate-900 leading-none">
                        ฿{product.retailPrice?.toLocaleString() || '0'}
                      </span>
                    </div>

                    {/* ปุ่ม Add to cart */}
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={addingState[product.id] === 'loading' || addingState[product.id] === 'success'}
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                        addingState[product.id] === 'success'
                          ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                          : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-md'
                      }`}
                      aria-label="Add to cart"
                    >
                      {addingState[product.id] === 'loading' ? (
                         <Loader2 size={18} className="animate-spin text-emerald-600" />
                      ) : addingState[product.id] === 'success' ? (
                         <CheckCircle2 size={18} strokeWidth={2.5} />
                      ) : (
                         <ShoppingCart size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
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