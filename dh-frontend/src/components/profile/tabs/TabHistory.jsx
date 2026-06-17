import React, { useState } from 'react';
import { auth } from '../../../firebase/config';
import { cancelOrder } from '../../../firebase/checkoutService';
import { useHistoryOrders } from './history/useHistoryOrders';
import HistoryFilterBar from './history/HistoryFilterBar';
import HistoryList from './history/HistoryList';
import UploadSlipModal from './history/UploadSlipModal';
import ServiceActionModal from './history/ServiceActionModal';

const TabHistory = () => {
  const { orders, isLoading } = useHistoryOrders();
  const [filter, setFilter] = useState('all');

  // Modal & Expand States
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [serviceModal, setServiceModal] = useState(null);

  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?')) return;
    setCancellingOrderId(orderId);
    try {
      await cancelOrder(orderId, auth.currentUser.uid);
      alert('ยกเลิกคำสั่งซื้อสำเร็จ');
    } catch (error) {
      alert(error.message);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const toggleOrderDetails = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const openServiceModal = (actionType, item, order) => {
    setServiceModal({ type: actionType, item, order });
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['pending_payment', 'awaiting_wholesale_price'].includes(order.status);
    if (filter === 'processing') return ['pending_payment_verification', 'paid', 'processing'].includes(order.status);
    if (filter === 'completed') return ['shipped', 'completed'].includes(order.status);
    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 min-h-[500px]">
      {/* ส่วนหัว และตัวกรอง */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            ประวัติคำสั่งซื้อ
          </h2>
          <p className="text-sm text-gray-500 mt-1">ติดตามสถานะ และแจ้งชำระเงินคำสั่งซื้อของคุณ</p>
        </div>
        
        <HistoryFilterBar filter={filter} setFilter={setFilter} />
      </div>

      <HistoryList
        isLoading={isLoading}
        filteredOrders={filteredOrders}
        expandedOrderId={expandedOrderId}
        toggleOrderDetails={toggleOrderDetails}
        handleCancelOrder={handleCancelOrder}
        cancellingOrderId={cancellingOrderId}
        setSelectedOrder={setSelectedOrder}
        openServiceModal={openServiceModal}
      />

      <UploadSlipModal
        selectedOrder={selectedOrder}
        closeModal={() => setSelectedOrder(null)}
      />

      <ServiceActionModal
        serviceModal={serviceModal}
        setServiceModal={setServiceModal}
      />

    </div>
  );
};

export default TabHistory;