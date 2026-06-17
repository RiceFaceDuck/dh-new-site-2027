export const getStatusDisplay = (status) => {
    switch (status) {
      case 'awaiting_wholesale_price':
        return { text: '⏳ รอพิจารณาราคาส่ง', color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'pending_payment':
        return { text: '💳 รอการชำระเงิน', color: 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse shadow-sm' };
      case 'pending_payment_verification':
        return { text: '⌛ รอตรวจสอบสลิป', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'processing':
      case 'paid':
        return { text: '📦 กำลังเตรียมจัดส่ง', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
      case 'shipped':
        return { text: '🚚 จัดส่งแล้ว', color: 'bg-green-100 text-green-700 border-green-200' };
      case 'completed':
        return { text: '✅ สำเร็จ', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'cancelled':
        return { text: '❌ ยกเลิก', color: 'bg-red-100 text-red-700 border-red-200' };
      default:
        return { text: status || 'ไม่ทราบสถานะ', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };
