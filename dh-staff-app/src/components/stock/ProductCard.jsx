import React from 'react';

const ProductCard = ({ product, onClick }) => {
  // พิจารณาสถานะสต็อก
  let stockStatus = 'in-stock'; // in-stock, low-stock, out-of-stock
  let stockColor = 'bg-green-100 text-green-700';
  let stockText = 'มีสินค้า';
  
  if (product.stockQuantity <= 0) {
    stockStatus = 'out-of-stock';
    stockColor = 'bg-red-100 text-red-700';
    stockText = 'หมดชั่วคราว';
  } else if (product.stockQuantity < 5) {
    stockStatus = 'low-stock';
    stockColor = 'bg-orange-100 text-orange-700';
    stockText = 'ใกล้หมด';
  }

  // รูปภาพ (ถ้ามี)
  const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : null;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex gap-4 active:scale-[0.98] transition-transform cursor-pointer hover:bg-gray-50"
    >
      {/* รูปภาพ */}
      <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 flex items-center justify-center border border-gray-100 overflow-hidden relative">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        )}
      </div>

      {/* ข้อมูล */}
      <div className="flex-1 min-w-0 py-1">
        <p className="text-xs text-indigo-500 font-bold mb-1 uppercase tracking-wide">{product.sku}</p>
        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight mb-2">{product.name}</h3>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            <span className="text-sm font-black text-gray-700">{product.stockQuantity || 0}</span>
            <span className="text-xs text-gray-500">ชิ้น</span>
          </div>
          
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${stockColor}`}>
            {stockText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
