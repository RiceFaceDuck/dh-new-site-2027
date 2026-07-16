import React from 'react';

const CheckoutSummaryItems = ({ cartItems }) => {
  return (
    <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
      {cartItems?.map((item, index) => (
        <div key={item.id || index} className="flex gap-4 items-start text-sm pb-4 border-b border-gray-50 last:border-0 last:pb-0">
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="font-medium text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
            <div className="flex justify-between items-center mt-2">
              <p className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded-sm">จำนวน: {item.quantity}</p>
              <p className="font-semibold text-gray-900">
                ฿{(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CheckoutSummaryItems;
