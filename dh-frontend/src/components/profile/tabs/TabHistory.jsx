/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { History, PackageSearch, Truck, ShieldAlert, CreditCard, Loader2, Eye, Calendar, X, Upload, CheckCircle2, ChevronRight, Star } from 'lucide-react';
// 🛑 นำเข้า Library ของเดิมของคุณทั้งหมด
import { collection, query, where, getDocs, limit, doc, updateDoc, serverTimestamp, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getAuth } from 'firebase/auth';
import { driveService } from '../../../firebase/driveService';

// ฟังก์ชันแปลงวันที่
const formatThaiDate = (timestamp) => {
  if (!timestamp) return 'ไม่ระบุวันที่';
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    date = new Date(timestamp);
  }
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
};

const TabHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({ pending: 0, processing: 0, shipped: 0, claims: 0 });

  // 📝 State สำหรับ Modal ของเดิม
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
        const q = query(
          collection(db, "artifacts", typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id', "users", user.uid, "orders"),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        
        let fetchedOrders = [];
        let stats = { pending: 0, processing: 0, shipped: 0, claims: 0 };

        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          fetchedOrders.push(data);
          
          const status = (data.orderStatus || data.status || '').toLowerCase();
          if (status === 'pending' || status === 'waiting_payment') stats.pending++;
          else if (status === 'processing' || status === 'paid' || status === 'waiting_verification') stats.processing++;
          else if (status === 'shipped' || status === 'completed') stats.shipped++;
        });

        setOrders(fetchedOrders);
        setOrderStats(stats);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // 🛑 ฟังก์ชันอัปโหลดสลิปและอัปเดตระบบหลังบ้าน (รักษาของเดิมไว้ 100% ไม่มีการเปลี่ยน Logic)
  const handleUploadSlip = async () => {
    if (!slipFile || !selectedOrder) return;
    
    const auth = getAuth();
    const user = auth.currentUser;
    setIsSubmitting(true);

    try {
      // 1. อัปโหลดผ่าน driveService
      const slipUrl = await driveService.uploadSlip(slipFile, selectedOrder.id);
      
      // 2. อัปเดต Orders Collection
      const orderRef = doc(db, "artifacts", typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id', "users", user.uid, "orders", selectedOrder.id);
      const updateData = {
        'paymentInfo.slipUrl': slipUrl,
        'paymentInfo.uploadedAt': serverTimestamp(),
        orderStatus: 'waiting_verification',
        status: 'waiting_verification'
      };
      await updateDoc(orderRef, updateData);

      // 3. 🚀 ยิงแจ้งเตือนเข้าระบบ History Logs ของแอดมิน
      await addDoc(collection(db, "artifacts", typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id', "public", "data", "History_logs"), {
        type: 'PAYMENT_SUBMITTED',
        orderId: selectedOrder.id,
        userId: user.uid,
        userName: user.displayName || 'ลูกค้าทั่วไป',
        amount: selectedOrder.totalInfo?.grandTotal || 0,
        slipUrl: slipUrl,
        message: `ลูกค้าส่งหลักฐานการโอนเงิน ออเดอร์ ${selectedOrder.id}`,
        timestamp: serverTimestamp(),
        status: 'unread'
      });

      // 4. สร้าง To-do ให้แอดมิน (ถ้าระบบเดิมมี)
      await addDoc(collection(db, "artifacts", typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id', "public", "data", "todos"), {
        title: `ตรวจสอบสลิปโอนเงิน ${selectedOrder.id}`,
        taskType: 'payment_verification',
        orderId: selectedOrder.id,
        status: 'pending',
        priority: 'high',
        createdAt: serverTimestamp(),
        dueDate: new Date(Date.now() + 86400000).toISOString() // ให้เวลา 24 ชม.
      });

      alert("ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว แอดมินจะทำการตรวจสอบโดยเร็วที่สุด");
      
      // รีเฟรชข้อมูลใน Modal ให้ขึ้นสถานะสีเขียว
      setSelectedOrder({
        ...selectedOrder,
        orderStatus: 'waiting_verification',
        paymentInfo: { ...selectedOrder.paymentInfo, slipUrl: slipUrl }
      });

      // อัปเดต UI หน้าลิสต์
      setOrders(orders.map(o => o.id === selectedOrder.id ? {
        ...o, orderStatus: 'waiting_verification', paymentInfo: { ...o.paymentInfo, slipUrl: slipUrl }
      } : o));

    } catch (error) {
      console.error("Upload error:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = (statusStr) => {
    const s = (statusStr || '').toLowerCase();
    if (s === 'pending' || s === 'waiting_payment') return { text: 'รอชำระเงิน', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    if (s === 'waiting_verification') return { text: 'รอตรวจสอบสลิป', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (s === 'processing' || s === 'paid') return { text: 'กำลังเตรียมจัดส่ง', color: 'bg-[#E6F0F9] text-[#0870B8] border-[#0870B8]/20' };
    if (s === 'shipped') return { text: 'จัดส่งแล้ว', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (s === 'completed') return { text: 'สำเร็จ', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (s === 'cancelled') return { text: 'ยกเลิก', color: 'bg-red-100 text-red-700 border-red-200' };
    return { text: statusStr || 'ไม่ทราบสถานะ', color: 'bg-gray-100 text-gray-700 border-gray-200' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
         <Loader2 size={32} className="animate-spin mb-3 text-[#0870B8]" />
         <p className="text-sm font-tech">LOADING ORDERS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ==========================================
          🌟 สรุปสถิติ (Stats Overview)
          ========================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-2"><CreditCard size={18} /></div>
          <span className="text-xl font-black text-slate-800">{orderStats.pending}</span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">รอชำระเงิน</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-[#E6F0F9] text-[#0870B8] flex items-center justify-center mb-2"><PackageSearch size={18} /></div>
          <span className="text-xl font-black text-slate-800">{orderStats.processing}</span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">กำลังเตรียมจัดส่ง</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2"><Truck size={18} /></div>
          <span className="text-xl font-black text-slate-800">{orderStats.shipped}</span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">จัดส่งแล้ว</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center opacity-70">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-2"><ShieldAlert size={18} /></div>
          <span className="text-xl font-black text-slate-800">{orderStats.claims}</span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">การเคลม/ประกัน</span>
        </div>
      </div>

      {/* ==========================================
          🌟 รายการคำสั่งซื้อ (Order History List) - อัปเกรด UI
          ========================================== */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <History size={48} strokeWidth={1} className="text-slate-300 mb-4" />
          <h3 className="text-base font-bold text-slate-800">ยังไม่มีประวัติคำสั่งซื้อ</h3>
          <p className="text-sm text-slate-500 mt-1">รายการสั่งซื้อของคุณจะแสดงที่นี่</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusStyle = getStatusDisplay(order.orderStatus || order.status);
            const total = order.totalInfo?.grandTotal || order.total || 0;
            
            // 🎯 คำนวณแต้มสะสมคร่าวๆ เพื่อโชว์ Gamification (สมมติว่ายอดซื้อทุกๆ 100 บาท ได้ 1 แต้ม)
            const expectedPoints = Math.floor(total / 100);

            return (
              <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                
                {/* 🚀 ลูกเล่น Gamification Badge */}
                {expectedPoints > 0 && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                    <Star size={10} className="fill-white" /> ได้รับ +{expectedPoints} Pts
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* ซ้าย: ข้อมูลหลัก */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${statusStyle.color}`}>
                        {statusStyle.text}
                      </span>
                      <span className="text-xs font-tech text-slate-400 flex items-center gap-1">
                        <Calendar size={12} /> {formatThaiDate(order.createdAt)}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base cursor-pointer hover:text-[#0870B8] transition-colors" onClick={() => setSelectedOrder(order)}>
                      คำสั่งซื้อ #{order.id.substring(0, 8).toUpperCase()}...
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {order.items?.length || 0} รายการ • จัดส่งโดย DH Express
                    </p>
                  </div>

                  {/* ขวา: ราคาและปุ่ม */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-3 mt-2 md:mt-0 border-t md:border-0 border-slate-100 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-0.5">ยอดรวมสุทธิ</span>
                      <span className="text-lg font-black text-[#0870B8]">฿{total.toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 group-hover:border-[#0870B8]/30"
                    >
                      <Eye size={14} /> ดูรายละเอียด
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==========================================
          🌟 Modal จัดการคำสั่งซื้อ & อัปโหลดสลิป (ดีไซน์ใหม่)
          ========================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
          
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <PackageSearch size={18} className="text-[#0870B8]" />
                  รายละเอียดคำสั่งซื้อ
                </h3>
                <p className="text-xs text-slate-500 font-tech mt-0.5 uppercase tracking-wider">#{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white hover:bg-slate-200 text-slate-500 rounded-full transition-colors shadow-sm border border-slate-200">
                <X size={18} />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              
              {/* รายการสินค้า */}
              <div className="space-y-4 mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">รายการสินค้า</h4>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="w-16 h-16 bg-white rounded-lg p-2 border border-slate-200 flex-shrink-0">
                      <img src={item.imageUrl || '/logo.png'} alt="product" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-slate-800 truncate">{item.name}</h5>
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-xs text-slate-500">จำนวน: {item.quantity}</span>
                        <span className="text-sm font-bold text-slate-700">฿{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 🛑 ระบบแจ้งโอนเงิน (ดึงมาจากโค้ดเก่า 100%) */}
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">การชำระเงิน</h4>
              
              {['pending', 'waiting_payment'].includes((selectedOrder.orderStatus || selectedOrder.status || '').toLowerCase()) && (
                <div className="bg-[#f8fbff] border border-[#E6F0F9] rounded-2xl p-5 mb-4 shadow-inner">
                  <div className="flex items-center gap-2 text-[#0870B8] mb-3">
                    <CreditCard size={18} />
                    <span className="font-bold text-sm">แจ้งชำระเงิน (โอนผ่านธนาคาร)</span>
                  </div>
                  
                  <div className="space-y-4">
                    {/* อัปโหลดรูปสลิป */}
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setSlipFile(file);
                            setSlipPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden" 
                        id="slip-upload"
                      />
                      <label htmlFor="slip-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#0870B8]/30 rounded-xl cursor-pointer bg-white hover:bg-[#E6F0F9]/50 transition-colors group">
                        {slipPreview ? (
                          <div className="relative w-full h-full p-2">
                            <img src={slipPreview} alt="Slip Preview" className="w-full h-full object-contain rounded-lg" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-bold">
                              เปลี่ยนรูปภาพ
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-[#0870B8]/50 group-hover:text-[#0870B8] group-hover:-translate-y-1 transition-all" />
                            <p className="mb-1 text-sm text-slate-600"><span className="font-bold">คลิกอัปโหลด</span> หรือลากสลิปมาวาง</p>
                            <p className="text-xs text-slate-400">PNG, JPG (ไม่เกิน 5MB)</p>
                          </div>
                        )}
                      </label>
                    </div>

                    <button 
                      onClick={handleUploadSlip}
                      disabled={!slipFile || isSubmitting}
                      className="w-full py-3 bg-[#0870B8] hover:bg-[#0A85DA] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {isSubmitting ? (
                        <><Loader2 size={16} className="animate-spin" /> กำลังตรวจสอบและส่งข้อมูล...</>
                      ) : (
                        <><CheckCircle2 size={16} /> ยืนยันการส่งสลิปชำระเงิน</>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {/* UI เมื่อส่งสลิปสำเร็จ */}
              {selectedOrder.paymentInfo && selectedOrder.paymentInfo.slipUrl && ['waiting_verification'].includes((selectedOrder.orderStatus || selectedOrder.status || '').toLowerCase()) && (
                 <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center mt-4 animate-in zoom-in-95 duration-300">
                   <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-emerald-100">
                     <CheckCircle2 size={28} className="text-emerald-500" />
                   </div>
                   <p className="text-base font-bold text-emerald-800">ส่งหลักฐานการชำระเงินสำเร็จ</p>
                   <p className="text-xs text-emerald-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
                     ข้อมูลถูกส่งเข้าระบบเรียบร้อยแล้ว แอดมินกำลังตรวจสอบความถูกต้อง และจะทำการอัปเดตสถานะจัดส่งให้ทราบในภายหลังครับ
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