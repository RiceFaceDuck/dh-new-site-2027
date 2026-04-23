import React, { useState, useEffect } from 'react';
import { History, PackageSearch, Truck, ShieldAlert, CreditCard, Loader2, Eye, Calendar, X, Upload, CheckCircle2 } from 'lucide-react';
// 🚀 [อัปเกรด]: เพิ่ม addDoc สำหรับยิงข้อมูลไปที่ To-do และ History_logs
import { collection, query, where, getDocs, limit, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getAuth } from 'firebase/auth';
import { driveService } from '../../../firebase/driveService';

const TabHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({ pending: 0, processing: 0, shipped: 0, claims: 0 });

  // 📝 State สำหรับ Modal ดูรายละเอียดและการชำระเงิน
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🚀 Smart Fetch: ดึงข้อมูลประวัติคำสั่งซื้อ
  useEffect(() => {
    const fetchOrders = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      try {
        setLoading(true);
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          limit(20)
        );
        
        const snapshot = await getDocs(q);
        let fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fallback
        if (fetchedOrders.length === 0) {
           const fallbackQ = query(collection(db, 'orders'), where('customer.uid', '==', user.uid), limit(20));
           const fallbackSnap = await getDocs(fallbackQ);
           fetchedOrders = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        fetchedOrders.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });

        setOrders(fetchedOrders);

        // 🧠 อัปเกรด: อ่าน orderStatus (ที่หลังบ้านอัปเดต) ก่อน status (ที่หน้าบ้านสร้าง)
        const stats = { pending: 0, processing: 0, shipped: 0, claims: 0 };
        fetchedOrders.forEach(order => {
          const status = (order.orderStatus || order.status || '').toLowerCase();
          
          // 🚀 [อัปเกรด]: เพิ่มการนับสถานะ draft และ waiting_verification
          if (['pending', 'waiting_payment', 'draft', 'waiting_verification', 'pending_wholesale'].includes(status)) stats.pending++;
          else if (['paid', 'processing'].includes(status)) stats.processing++;
          else if (status === 'shipped') stats.shipped++;

          if (order.refundsAndClaims && order.refundsAndClaims.length > 0) {
            stats.claims++;
          }
        });
        
        setOrderStats(stats);

      } catch (error) {
        console.error("🔥 Error fetching order history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' น.';
  };

  const getStatusBadge = (rawStatus) => {
    const s = (rawStatus || '').toLowerCase();
    if (s === 'completed') return <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">สำเร็จแล้ว</span>;
    if (s === 'paid' || s === 'processing') return <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">กำลังจัดเตรียม</span>;
    if (s === 'shipped') return <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/20">จัดส่งแล้ว</span>;
    if (s === 'cancelled') return <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">ยกเลิกแล้ว</span>;
    
    // 🚀 [อัปเกรด]: เพิ่มป้ายสถานะสำหรับ Draft (รอพนักงานตรวจ) และ โอนแล้วรอตรวจ
    if (s === 'draft' || s === 'pending_wholesale') return <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">รอพนักงานตรวจสอบ</span>;
    if (s === 'waiting_verification') return <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">รอตรวจสอบยอดโอน</span>;
    
    return <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">รอชำระเงิน</span>;
  };

  // 🧠 อัปเกรด: ฟังก์ชันประมวลผลยอดชำระสุทธิ (ดึงยอดล่าสุดที่ผู้จัดการแก้จากหลังบ้านมาโชว์)
  const getFinalPayable = (order) => {
    if (!order) return 0;
    const currentStatus = (order.orderStatus || order.status || '').toLowerCase();
    
    // 🚀 [อัปเกรด]: ไม่ให้คิดเงินถ้าเป็น Draft
    if (currentStatus === 'pending_wholesale' || currentStatus === 'draft') return 0; 
    
    // หากหลังบ้านเคาะราคา B2B มาแล้ว ให้ยึด netTotal หรือ finalTotal เป็นหลัก
    // หักลบกับส่วนลดกระเป๋าเงิน (ถ้ามีการใช้)
    const baseTotal = order.finalTotal !== undefined ? order.finalTotal : (order.netTotal || 0);
    return Math.max(0, baseTotal - (order.walletApplied || 0));
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setSlipFile(null);
    setSlipPreview('');
    setIsSubmitting(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)");
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  const handlePaymentSubmit = async () => {
    if (!slipFile) return alert("กรุณาแนบสลิปการโอนเงิน");
    setIsSubmitting(true);

    try {
      // 🚀 [อัปเกรด]: แก้ไขชื่อฟังก์ชันให้ตรงกับที่มีอยู่ใน driveService.js (uploadSlipImage)
      const slipUrl = await driveService.uploadSlipImage(slipFile);
      const payableAmount = getFinalPayable(selectedOrder);

      const orderRef = doc(db, 'orders', selectedOrder.id);
      
      // เปลี่ยนสถานะเป็น waiting_verification (รอพนักงานตรวจ)
      await updateDoc(orderRef, {
        'paymentInfo.method': 'bank_transfer',
        'paymentInfo.slipUrl': slipUrl,
        'paymentInfo.amount': payableAmount,
        'paymentInfo.submittedAt': serverTimestamp(),
        orderStatus: 'waiting_verification',
        status: 'waiting_verification',
        updatedAt: serverTimestamp()
      });

      // 🌟 ทริกเกอร์สร้าง To-do ให้พนักงานรับรู้ว่ามีการส่งสลิปย้อนหลัง
      await addDoc(collection(db, 'todos'), {
        title: `ตรวจสอบยอดโอน (ย้อนหลัง) - ${selectedOrder.customerInfo?.name || 'ลูกค้า'}`, 
        description: `ออเดอร์: ${selectedOrder.orderId}\nลูกค้าแนบสลิปเข้ามาใหม่ โปรดตรวจสอบและยืนยันการตัดสต๊อก\nยอดโอน: ฿${payableAmount.toLocaleString()}`,
        type: 'PAYMENT_VERIFICATION', 
        priority: 'High', 
        status: 'pending', 
        payload: { 
          orderId: selectedOrder.id, 
          customerUid: selectedOrder.userId, 
          amount: payableAmount, 
          slipUrl: slipUrl,
          itemsSnapshot: selectedOrder.items || []
        },
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
      });

      // 🌟 บันทึก History Log
      await addDoc(collection(db, 'history_logs'), {
         module: 'Order',
         action: 'Payment',
         targetId: selectedOrder.id,
         details: `อัปโหลดสลิปชำระเงินย้อนหลัง ยอด ฿${payableAmount.toLocaleString()}`,
         actionBy: selectedOrder.userId,
         actorName: selectedOrder.customerInfo?.name || 'Customer',
         timestamp: serverTimestamp()
      });

      const newPaymentInfo = { ...(selectedOrder.paymentInfo || {}), method: 'bank_transfer', slipUrl, amount: payableAmount };
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'waiting_verification', paymentInfo: newPaymentInfo } : o));
      setSelectedOrder({ ...selectedOrder, status: 'waiting_verification', paymentInfo: newPaymentInfo });
      
      alert("ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว แอดมินกำลังตรวจสอบเพื่อยืนยันออเดอร์");
    } catch (error) {
      console.error("Payment submission error", error);
      alert("เกิดข้อผิดพลาดในการส่งสลิป กรุณาลองใหม่: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <History size={22} className="text-emerald-600" /> ประวัติการสั่งซื้อ (Order History)
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center cursor-pointer hover:border-amber-200 hover:shadow-md transition-all group">
          <CreditCard size={24} className="mx-auto text-amber-400 mb-2 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          <p className="text-xl font-black text-amber-50 mb-1 leading-none text-amber-500">{orderStats.pending}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">รอชำระเงิน</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group">
          <PackageSearch size={24} className="mx-auto text-blue-400 mb-2 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          <p className="text-xl font-black text-blue-500 mb-1 leading-none">{orderStats.processing}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">กำลังจัดเตรียม</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all group">
          <Truck size={24} className="mx-auto text-emerald-400 mb-2 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          <p className="text-xl font-black text-emerald-500 mb-1 leading-none">{orderStats.shipped}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">กำลังจัดส่ง</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center cursor-pointer hover:border-red-200 hover:shadow-md transition-all group">
          <ShieldAlert size={24} className="mx-auto text-red-400 mb-2 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          <p className="text-xl font-black text-red-500 mb-1 leading-none">{orderStats.claims}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">ส่งคืน / เคลม</p>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
            <span className="text-xs font-bold text-gray-500">กำลังโหลดประวัติคำสั่งซื้อ...</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 whitespace-nowrap">หมายเลขคำสั่งซื้อ</th>
                <th className="p-4">วันที่สั่งซื้อ</th>
                <th className="p-4 text-right">ยอดรวม</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-center">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {!loading && orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-50 rounded-full mb-4 border border-gray-100">
                      <History size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">ไม่พบประวัติคำสั่งซื้อ</p>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">
                      ออเดอร์ที่คุณสั่งซื้อทั้งหมดจะแสดงที่นี่ พร้อมให้คุณติดตามสถานะจัดส่งและขอเคลมสินค้าได้ตลอด 24 ชม.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4">
                      <p className="text-xs font-bold text-gray-800">{order.orderId || order.id}</p>
                      {order.items && <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[150px]">{order.items.length} รายการ</p>}
                    </td>
                    <td className="p-4 text-xs text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="opacity-70" />
                        {formatDateTime(order.createdAt)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-sm font-black text-gray-800">
                        ฿{getFinalPayable(order).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(order.orderStatus || order.status)}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleViewDetails(order)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-flex" 
                        title="ดูรายละเอียดบิล"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          🎁 Modal รายละเอียดคำสั่งซื้อและการชำระเงิน
          ========================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">รายละเอียดคำสั่งซื้อ</h3>
                <p className="text-xs text-gray-500 mt-0.5">#{selectedOrder.orderId || selectedOrder.id}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-100 gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-700">สถานะปัจจุบัน:</span>
                  {getStatusBadge(selectedOrder.orderStatus || selectedOrder.status)}
                </div>
                <span className="text-xs font-medium text-gray-500">
                  ทำรายการเมื่อ: {formatDateTime(selectedOrder.createdAt)}
                </span>
              </div>

              <h4 className="text-sm font-bold text-gray-800 mb-3">รายการสินค้า</h4>
              <div className="space-y-3 mb-6">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 p-1 flex-shrink-0">
                      <img src={item.image || 'https://via.placeholder.com/100'} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">จำนวน: {item.qty} ชิ้น</p>
                    </div>
                    <div className="text-sm font-black text-gray-800 whitespace-nowrap">
                      ฿{(item.price * item.qty).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-6 border border-gray-100">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>ยอดรวมตั้งต้น</span>
                  <span className="font-bold">฿{(selectedOrder.subTotal || 0).toLocaleString()}</span>
                </div>
                
                {/* แถบแจ้งเตือนว่าบิลนี้ได้รับการปรับราคาขายส่งแล้ว */}
                {selectedOrder.wholesaleRequest && (selectedOrder.orderStatus || selectedOrder.status) !== 'pending_wholesale' && (
                  <div className="flex justify-between text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 -mx-2 rounded">
                    <span>ราคาส่ง B2B (ผู้จัดการอนุมัติแล้ว)</span>
                    <span>ปรับปรุงยอดชำระแล้ว</span>
                  </div>
                )}

                {(selectedOrder.promoDiscount > 0) && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>ส่วนลดโปรโมชัน</span>
                    <span className="font-bold">-฿{selectedOrder.promoDiscount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-xs text-gray-600">
                  <span>ค่าจัดส่ง</span>
                  <span className="font-bold">
                     {selectedOrder.shippingFee > 0 ? `฿${selectedOrder.shippingFee.toLocaleString()}` : 'ฟรี'}
                  </span>
                </div>
                
                {(selectedOrder.walletApplied > 0) && (
                  <div className="flex justify-between text-xs text-amber-600">
                    <span>ชำระด้วย Wallet</span>
                    <span className="font-bold">-฿{selectedOrder.walletApplied.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-800">ยอดชำระสุทธิ (ที่ต้องโอน)</span>
                  <span className="text-2xl font-black text-emerald-600">
                    ฿{getFinalPayable(selectedOrder).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* 💸 Payment Section */}
              {['pending', 'waiting_payment'].includes((selectedOrder.orderStatus || selectedOrder.status || '').toLowerCase()) && 
               getFinalPayable(selectedOrder) > 0 && 
               (!selectedOrder.paymentInfo || !selectedOrder.paymentInfo.slipUrl) && (
                <div className="bg-white border-2 border-emerald-100 rounded-xl p-5 shadow-sm animate-in slide-in-from-bottom-2">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CreditCard size={18} className="text-emerald-500" /> ดำเนินการชำระเงิน
                  </h4>
                  
                  <div className="bg-emerald-50 rounded-xl p-3 text-center mb-4 border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800 mb-1">ธนาคารกสิกรไทย (KBank)</p>
                    <p className="text-lg font-black text-emerald-600 tracking-wider">123-4-56789-0</p>
                    <p className="text-[10px] text-emerald-700">บริษัท ดีเอช โน๊ตบุ๊ค จำกัด</p>
                  </div>

                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    แนบหลักฐานการโอนเงิน ยอด <span className="text-red-500 text-sm mx-1">
                      ฿{getFinalPayable(selectedOrder).toLocaleString()}
                    </span> บาท *
                  </label>

                  {slipPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group mb-4">
                      <img src={slipPreview} alt="Slip Preview" className="w-full max-h-48 object-contain" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-transform">
                          เปลี่ยนรูปภาพ <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-emerald-200 rounded-xl bg-emerald-50/30 hover:bg-emerald-50 cursor-pointer transition-all hover:border-emerald-400 group mb-4">
                      <Upload size={18} className="text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-emerald-700">อัปโหลดสลิปโอนเงิน</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  )}

                  <button 
                    onClick={handlePaymentSubmit}
                    disabled={isSubmitting || !slipFile}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={16} className="animate-spin" /> กำลังอัปโหลด...</>
                    ) : (
                      <><CheckCircle2 size={16} /> ยืนยันการชำระเงิน</>
                    )}
                  </button>
                </div>
              )}
              
              {/* สลิปถูกส่งแล้ว */}
              {selectedOrder.paymentInfo && selectedOrder.paymentInfo.slipUrl && ['waiting_verification'].includes((selectedOrder.orderStatus || selectedOrder.status || '').toLowerCase()) && (
                 <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 text-center mt-4 animate-in slide-in-from-bottom-2">
                   <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-emerald-100">
                     <CheckCircle2 size={24} className="text-emerald-500" />
                   </div>
                   <p className="text-sm font-bold text-emerald-800">ส่งหลักฐานการชำระเงินสำเร็จ</p>
                   <p className="text-xs text-emerald-600 mt-1 max-w-xs mx-auto leading-relaxed">
                     แอดมินกำลังตรวจสอบความถูกต้อง และจะทำการอัปเดตสถานะจัดส่งให้ทราบในภายหลังครับ
                   </p>
                 </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TabHistory;