import React from 'react';

const ProductDetailModal = ({ product, onClose }) => {
  if (!product) return null;

  // พิจารณาสถานะสต็อก
  let stockStatus = 'in-stock';
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

  const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full h-auto max-h-[90vh] sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        {/* Header (Close Button) */}
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Image Section */}
        <div className="w-full h-64 bg-gray-50 rounded-t-3xl sm:rounded-t-3xl flex items-center justify-center relative border-b border-gray-100 overflow-hidden shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-contain p-4" />
          ) : (
             <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          )}
          
          <div className="absolute bottom-4 left-4">
             <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${stockColor}`}>
               {stockText}
             </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 overflow-y-auto">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-indigo-500 font-black mb-1 uppercase tracking-wide">{product.sku}</p>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500 font-bold uppercase mb-1">หมวดหมู่</span>
              <span className="font-bold text-gray-900 capitalize text-center">{product.category || '-'}</span>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center">
              <span className="text-xs text-indigo-500 font-bold uppercase mb-1">จำนวนคงเหลือ</span>
              <span className="text-2xl font-black text-indigo-700">{product.stockQuantity || 0}</span>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between items-center py-3 border-b border-gray-100">
               <span className="text-sm font-bold text-gray-500">ราคาขาย (Retail)</span>
               <span className="font-black text-gray-900">฿{product.retailPrice ? product.retailPrice.toLocaleString() : '-'}</span>
             </div>
             {product.price && (
               <div className="flex justify-between items-center py-3 border-b border-gray-100">
                 <span className="text-sm font-bold text-gray-500">ราคาส่ง (Wholesale)</span>
                 <span className="font-black text-gray-900">฿{product.price.toLocaleString()}</span>
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetailModal;
