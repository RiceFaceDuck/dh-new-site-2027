import React from 'react';
import HistoryItemCard from './HistoryItemCard';

const HistoryList = ({
  isLoading,
  filteredOrders,
  expandedOrderId,
  toggleOrderDetails,
  handleCancelOrder,
  cancellingOrderId,
  setSelectedOrder,
  openServiceModal
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
        <p className="mt-4 text-gray-500 font-medium">ไม่มีประวัติคำสั่งซื้อในหมวดหมู่นี้</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredOrders.map(order => (
        <HistoryItemCard
          key={order.id}
          order={order}
          isExpanded={expandedOrderId === order.id}
          toggleOrderDetails={toggleOrderDetails}
          handleCancelOrder={handleCancelOrder}
          cancellingOrderId={cancellingOrderId}
          setSelectedOrder={setSelectedOrder}
          openServiceModal={openServiceModal}
        />
      ))}
    </div>
  );
};

export default HistoryList;
