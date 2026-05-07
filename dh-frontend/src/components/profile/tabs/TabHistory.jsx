import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase/config';
import { collection, query, where, onSnapshot, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import * as driveService from '../../../firebase/driveService';

const TabHistory = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Modal & Expand States
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // สถานะการคัดลอกข้อความ
  const [copyStatus, setCopyStatus] = useState({});

  useEffect(() => {
    let unsubscribeSnapshot;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );

        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          ordersData.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
          });

          setOrders(ordersData);
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching orders:", error);
          setIsLoading(false);
        });
      } else {
        setOrders([]);
        setIsLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const getStatusDisplay = (status) => {
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMsg('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setErrorMsg('');
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUploadSlip = async () => {
    if (!file) {
      setErrorMsg('กรุณาเลือกรูปภาพสลิปโอนเงิน');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    try {
      let finalSlipUrl = '';

      try {
        const uploadFn = driveService.uploadFile || driveService.uploadSlip || driveService.default;
        if (typeof uploadFn === 'function') {
          finalSlipUrl = await uploadFn(file);
        }
      } catch (driveErr) {
        console.warn("Drive Upload Failed, using fallback...", driveErr);
      }

      if (!finalSlipUrl || typeof finalSlipUrl !== 'string' || finalSlipUrl.length < 5) {
        finalSlipUrl = await compressImage(file);
      }

      const batch = writeBatch(db);
      const user = auth.currentUser;

      const orderRef = doc(db, 'orders', selectedOrder.id);
      batch.update(orderRef, {
        paymentSlipUrl: finalSlipUrl,
        status: 'pending_payment_verification',
        updatedAt: serverTimestamp()
      });

      const todoRef = doc(collection(db, 'todos'));
      batch.set(todoRef, {
        type: "verify_slip",
        status: "pending",
        title: `ตรวจสอบการชำระเงิน: ออเดอร์ #${selectedOrder.id.slice(-6).toUpperCase()}`,
        orderId: selectedOrder.id,
        userId: user.uid,
        customerName: selectedOrder.shippingAddress?.fullName || "ลูกค้าทั่วไป",
        amount: selectedOrder.totals?.netTotal || 0,
        slipUrl: finalSlipUrl,
        requestedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      const historyRef = doc(collection(db, `users/${user.uid}/historyLogs`));
      batch.set(historyRef, {
        orderId: selectedOrder.id,
        action: "UPLOAD_SLIP",
        title: "ส่งหลักฐานการโอนเงินแล้ว",
        description: `ระบบส่งสลิปของออเดอร์ #${selectedOrder.id.slice(-6).toUpperCase()} ไปให้เจ้าหน้าที่ตรวจสอบแล้ว`,
        amount: selectedOrder.totals?.netTotal || 0,
        createdAt: serverTimestamp()
      });

      await batch.commit();

      setUploadSuccess(true);
      setTimeout(() => {
        closeModal();
      }, 2500);

    } catch (error) {
      console.error("Upload Error:", error);
      setErrorMsg("เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setFile(null);
    setPreviewUrl('');
    setErrorMsg('');
    setUploadSuccess(false);
  };

  const toggleOrderDetails = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };
  
  // 📋 ฟังก์ชันคัดลอกเลขพัสดุ (รองรับ iFrame)
  const handleCopyTracking = (e, orderId, trackingNum) => {
    e.stopPropagation();
    const el = document.createElement('textarea');
    el.value = trackingNum;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    
    setCopyStatus({ [orderId]: true });
    setTimeout(() => setCopyStatus({}), 2000);
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
        
        {/* Filters */}
        <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto hide-scrollbar">
          {['all', 'pending', 'processing', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${filter === f ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {f === 'all' ? 'ทั้งหมด' : f === 'pending' ? 'รอชำระเงิน' : f === 'processing' ? 'กำลังดำเนินการ' : 'สำเร็จแล้ว'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          <p className="mt-4 text-gray-500 font-medium">ไม่มีประวัติคำสั่งซื้อในหมวดหมู่นี้</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Order Cards */}
          {filteredOrders.map(order => {
            const statusObj = getStatusDisplay(order.status);
            const itemsList = order.items?.map(i => i.name).join(', ') || 'ไม่มีรายการสินค้า';
            const isExpanded = expandedOrderId === order.id;
            
            return (
              <div key={order.id} className={`bg-white border transition-all duration-300 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md ${isExpanded ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-gray-200'}`}>
                
                {/* Order Header Summary */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-3 mb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">ออเดอร์ #{order.id?.slice(-8).toUpperCase()}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">สั่งซื้อเมื่อ: {order.createdAt?.toDate().toLocaleString() || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1">
                     <span className={`px-3 py-1.5 text-xs font-bold rounded-full border w-max ${statusObj.color}`}>
                       {statusObj.text}
                     </span>
                     {/* แจ้งเตือนบิลในหน้าย่อ ถ้ามีใบกำกับภาษีออกแล้ว */}
                     {order.taxInvoiceUrl && !isExpanded && (
                       <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100 w-max">
                         📄 มีใบกำกับภาษี
                       </span>
                     )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      <span className="font-semibold text-gray-900">สินค้า: </span>
                      {itemsList}
                    </p>
                    <p className="text-base text-indigo-700 font-black mt-2">
                      ยอดชำระสุทธิ: ฿{order.totals?.netTotal?.toLocaleString() || '0'}
                    </p>
                  </div>
                  
                  {/* ปุ่ม Action */}
                  <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                    <button 
                      onClick={() => toggleOrderDetails(order.id)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold border border-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isExpanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>

                    {order.status === 'pending_payment' && (
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        แจ้งชำระเงิน
                      </button>
                    )}
                  </div>
                </div>

                {/* 📋 รายละเอียดออเดอร์ (Expandable Details) */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                    
                    {/* 🚚 ระบบแสดงเลขพัสดุ (อัปเดตใหม่) */}
                    {order.trackingNumber && (
                      <div className="mb-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg text-green-600 shadow-inner">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-0.5">จัดส่งแล้ว! หมายเลขพัสดุของคุณ</p>
                            <p className="text-xl font-black text-green-900 tracking-tight">{order.trackingNumber}</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => handleCopyTracking(e, order.id, order.trackingNumber)}
                          className={`w-full sm:w-auto px-4 py-2 border text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${copyStatus[order.id] ? 'bg-green-600 text-white border-green-600' : 'bg-white border-green-300 text-green-700 hover:bg-green-100'}`}
                        >
                          {copyStatus[order.id] ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              คัดลอกสำเร็จ!
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                              คัดลอกเลขพัสดุ
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> รายการสินค้าที่สั่งซื้อ
                    </h4>
                    
                    {/* List Items */}
                    <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {order.items?.map((item, idx) => {
                        const approvedPrice = order.totals?.wholesaleDetails?.approvedPrices?.[idx];
                        const isWholesaleApplied = approvedPrice !== undefined && approvedPrice < item.price;
                        const priceToShow = isWholesaleApplied ? approvedPrice : (item.price || 0);

                        return (
                          <div key={idx} className="flex gap-3 text-sm bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                            <div className="w-14 h-14 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm">
                               {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 line-clamp-1">{item.name}</p>
                              <div className="flex justify-between mt-1.5 items-end">
                                <span className="text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded font-medium text-xs">x{item.quantity}</span>
                                
                                {isWholesaleApplied ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-xs text-gray-400 line-through">ปกติ: ฿{(item.price * item.quantity).toLocaleString()}</span>
                                    <span className="font-bold text-indigo-600">ราคาส่ง: ฿{(priceToShow * item.quantity).toLocaleString()}</span>
                                  </div>
                                ) : (
                                  <span className="font-bold text-gray-900">฿{(priceToShow * item.quantity).toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Summary Breakdown */}
                    <div className="bg-indigo-50/50 rounded-xl p-5 text-sm space-y-2 border border-indigo-100 text-gray-700 shadow-inner">
                       <div className="flex justify-between">
                         <span>ยอดรวมสินค้า</span>
                         <span className="font-semibold text-gray-900">฿{order.totals?.subtotal?.toLocaleString() || 0}</span>
                       </div>
                       
                       {order.totals?.discount > 0 && (
                         <div className="flex justify-between text-red-500">
                           <span>ส่วนลดโปรโมชั่น / คูปอง</span>
                           <span className="font-semibold">-฿{(order.totals.discount - (order.totals?.wholesaleDetails?.itemLevelDiscount || 0) - (order.totals?.wholesaleDetails?.manualExtraDiscount || 0)).toLocaleString()}</span>
                         </div>
                       )}

                       {(order.totals?.wholesaleDetails?.itemLevelDiscount > 0 || order.totals?.wholesaleDetails?.manualExtraDiscount > 0) && (
                         <div className="flex justify-between text-indigo-700 bg-indigo-100/50 px-2.5 py-1.5 rounded-lg border border-indigo-100 mt-1">
                           <span className="font-bold flex items-center gap-1.5"><span className="text-lg leading-none">✨</span> ส่วนลดราคาส่ง (อนุมัติแล้ว)</span>
                           <span className="font-black">-฿{((order.totals?.wholesaleDetails?.itemLevelDiscount || 0) + (order.totals?.wholesaleDetails?.manualExtraDiscount || 0)).toLocaleString()}</span>
                         </div>
                       )}

                       <div className="flex justify-between mt-1">
                         <span>ค่าจัดส่ง</span>
                         <span>{order.totals?.shipping === 0 ? <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">ส่งฟรี</span> : `฿${order.totals?.shipping?.toLocaleString() || 0}`}</span>
                       </div>
                       
                       <div className="flex justify-between items-end font-black text-indigo-950 text-base pt-3 border-t-2 border-indigo-100 border-dashed mt-3">
                         <span>ยอดชำระสุทธิ</span>
                         <span className="text-2xl text-indigo-700">฿{order.totals?.netTotal?.toLocaleString() || 0}</span>
                       </div>
                    </div>

                    {/* 📄 ระบบโหลดใบกำกับภาษี (อัปเดตใหม่) */}
                    {order.taxInvoiceUrl && (
                      <div className="mt-4 flex justify-end">
                        <a 
                          href={order.taxInvoiceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-bold rounded-xl border border-teal-200 transition-colors shadow-sm active:scale-95"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          ดาวน์โหลดใบกำกับภาษี (PDF)
                        </a>
                      </div>
                    )}

                    {/* ที่อยู่จัดส่ง */}
                    {order.shippingAddress && (
                      <div className="mt-5 text-sm text-gray-600 flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                           <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{order.shippingAddress.fullName}</p>
                          <p className="mt-1">{order.shippingAddress.address} {order.shippingAddress.subdistrict} {order.shippingAddress.district} {order.shippingAddress.province} {order.shippingAddress.zipcode}</p>
                          <p className="mt-1 font-medium text-gray-700">โทร: {order.shippingAddress.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 🖼️ Modal: อัปโหลดสลิป */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={isUploading ? null : closeModal}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95">
            
            {!uploadSuccess ? (
              <>
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    แจ้งหลักฐานการชำระเงิน
                  </h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-5 mb-6 text-center shadow-inner">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">ยอดที่ต้องชำระ</p>
                  <p className="text-4xl font-black text-indigo-700 mt-1">฿{selectedOrder.totals?.netTotal?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-2">ออเดอร์ #{selectedOrder.id?.slice(-8).toUpperCase()}</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-900 mb-3">อัปโหลดสลิปโอนเงิน (สลิปธนาคาร)</label>
                  
                  <label className={`mt-1 flex justify-center px-6 py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${previewUrl ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50/50'}`}>
                    <div className="space-y-2 text-center w-full">
                      {previewUrl ? (
                        <div className="relative mx-auto h-40 w-28 rounded-xl overflow-hidden shadow-md border border-gray-200">
                          <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm font-bold bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">เปลี่ยนรูป</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white w-16 h-16 mx-auto rounded-full shadow-sm flex items-center justify-center border border-gray-100">
                          <svg className="h-8 w-8 text-indigo-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                      <div className="flex justify-center text-sm text-gray-600 mt-3">
                        <span className="relative font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                          <span>{previewUrl ? 'กดที่นี่เพื่อเปลี่ยนไฟล์สลิป' : 'คลิกเพื่อเลือกไฟล์สลิป'}</span>
                          <input type="file" className="sr-only" accept="image/jpeg, image/png, image/jpg" onChange={handleFileChange} />
                        </span>
                      </div>
                      {!previewUrl && <p className="text-xs text-gray-500 font-medium">รองรับ PNG, JPG ไม่เกิน 5MB</p>}
                    </div>
                  </label>
                  {errorMsg && (
                    <div className="mt-3 bg-red-50 border border-red-100 p-2 rounded-lg text-xs text-red-600 font-semibold text-center flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                      {errorMsg}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUploadSlip}
                  disabled={isUploading || !file}
                  className={`w-full py-4 px-4 rounded-xl text-white font-bold text-base transition-all flex items-center justify-center gap-2
                    ${isUploading || !file ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-[0.98]'}`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      กำลังส่งหลักฐานเข้าระบบ...
                    </>
                  ) : (
                    <>
                      ยืนยันการโอนเงิน
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </>
                  )}
                </button>
              </>
            ) : (
              // Success State
              <div className="text-center py-10 animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-5 shadow-inner">
                  <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">ส่งสลิปสำเร็จ!</h3>
                <p className="text-sm text-gray-600 mb-6 font-medium leading-relaxed">ระบบได้รับหลักฐานของคุณแล้ว<br/>และได้ส่งเรื่องไปให้แอดมินตรวจสอบยอดเงินสักครู่ครับ</p>
                <div className="bg-blue-50 text-blue-700 text-sm py-2.5 px-4 rounded-xl border border-blue-100 inline-flex items-center gap-2 font-bold shadow-sm">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  สถานะเปลี่ยนเป็น: รอตรวจสอบสลิป
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default TabHistory;