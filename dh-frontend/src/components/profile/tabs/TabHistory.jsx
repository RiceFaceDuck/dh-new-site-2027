import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config';
import { collection, query, where, orderBy, limit, getDocs, startAfter, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { driveService } from '../../../firebase/driveService';
import { Package, Clock, UploadCloud, CheckCircle2, AlertCircle, ChevronRight, Receipt, FileImage, Loader2, X, Eye } from 'lucide-react';

export default function TabHistory({ userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  // States สำหรับ Modal อัปโหลดสลิป
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // UX Gimmick: Drag & Drop และ Preview
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // States สำหรับ Modal ดูรูปสลิป (View Slip)
  const [viewSlipModalOpen, setViewSlipModalOpen] = useState(false);
  const [viewSlipUrl, setViewSlipUrl] = useState('');

  const ORDERS_PER_PAGE = 5; // 🎯 ประหยัด Reads

  useEffect(() => {
    if (userId) {
      fetchInitialOrders();
    }
  }, [userId]);

  const fetchInitialOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(ORDERS_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setOrders(ordersData);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === ORDERS_PER_PAGE);
    } catch (err) {
      console.error("Fetch Orders Error:", err);
      if (err.message && err.message.includes('index')) {
        setError('ระบบกำลังอัปเดตสารบัญข้อมูล (Index) กรุณารอสักครู่แล้วรีเฟรชหน้าเว็บอีกครั้ง');
      } else {
        setError('ไม่สามารถดึงข้อมูลประวัติการสั่งซื้อได้');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMoreOrders = async () => {
    if (!lastVisible) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(ORDERS_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      const newOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setOrders(prev => [...prev, ...newOrders]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === ORDERS_PER_PAGE);
    } catch (err) {
      console.error("Load More Error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // --- ระบบจัดการไฟล์และ Drag & Drop ---
  const handleFile = (file) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('กรุณาอัปโหลดไฟล์รูปภาพ (JPG, PNG) เท่านั้น');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e) => handleFile(e.target.files[0]);
  
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    const fileInput = document.getElementById('slip-upload');
    if (fileInput) fileInput.value = '';
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedOrder(null);
    clearSelectedFile();
  };

  // 🚀 ฟังก์ชันอัปโหลดสลิปของจริงไปยัง Google Drive
  const handleSlipUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedOrder) return;
    
    setIsUploading(true);
    
    try {
      // 1. โยนไฟล์เข้า Google Drive
      const slipUrl = await driveService.uploadSlip(selectedFile, selectedOrder.id);

      // 2. อัปเดตข้อมูล Order หน้าบ้าน
      const orderRef = doc(db, 'orders', selectedOrder.id);
      await updateDoc(orderRef, {
        status: 'verifying_payment',
        paymentSlipUrl: slipUrl,     
        slipUploadedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 3. 🚨 สร้าง Task วิ่งเข้า To-do หลังบ้านทันที
      await addDoc(collection(db, 'tasks'), {
        type: 'PAYMENT_VERIFICATION',
        orderId: selectedOrder.id,
        status: 'todo',
        title: `ตรวจสอบยอดโอน (Order #${(selectedOrder.orderId || selectedOrder.id).substring(0,8).toUpperCase()})`,
        customerName: selectedOrder.taxInvoice?.name || 'ลูกค้าทั่วไป',
        totalAmount: selectedOrder.finalTotalAmount || selectedOrder.totalAmount || selectedOrder.initialTotalAmount || 0,
        paymentSlipUrl: slipUrl, 
        priority: 'Medium',
        createdAt: serverTimestamp()
      });

      // 4. อัปเดต UI แบบ Real-time
      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? { ...order, status: 'verifying_payment', paymentSlipUrl: slipUrl } : order
      ));
      
      closeUploadModal();
    } catch (error) {
      console.error("Upload Error:", error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด: ' + (error.message || 'โปรดลองใหม่อีกครั้ง'));
    } finally {
      setIsUploading(false);
    }
  };

  // 🎨 จัดการแสดงผล Badge สถานะ
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending_wholesale_price':
        return { text: 'รอประเมินราคาส่ง', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Clock className="w-3 h-3" /> };
      case 'pending_payment':
      case 'awaiting_payment':
        return { text: 'รอชำระเงิน', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Receipt className="w-3 h-3" /> };
      case 'verifying_payment':
        return { text: 'รอตรวจสอบสลิป', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Loader2 className="w-3 h-3 animate-spin" /> };
      case 'paid':
      case 'processing':
        return { text: 'ชำระเงินแล้ว (เตรียมจัดส่ง)', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Package className="w-3 h-3" /> };
      case 'shipped':
      case 'delivered':
        return { text: 'จัดส่งสำเร็จ', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="w-3 h-3" /> };
      case 'cancelled':
        return { text: 'ยกเลิกแล้ว', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="w-3 h-3" /> };
      default:
        return { text: status || 'ไม่ทราบสถานะ', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Clock className="w-3 h-3" /> };
    }
  };

  // -----------------------------------------
  // UI Renders
  // -----------------------------------------
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <h2 className="text-xl font-bold text-gray-800 mb-6 font-tech uppercase">Order History</h2>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl border border-slate-200"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-tech uppercase tracking-wide flex items-center gap-2">
            <Package className="w-5 h-5 text-cyber-blue" />
            Order History
          </h2>
          <p className="text-sm text-slate-500 mt-1">ประวัติการสั่งซื้อและการขอราคาส่งของคุณ</p>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {orders.length === 0 && !error ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">ยังไม่มีประวัติการสั่งซื้อ</h3>
          <p className="text-slate-500 text-sm">เมื่อคุณทำรายการสั่งซื้อ ข้อมูลจะแสดงที่นี่</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusStyle = getStatusDisplay(order.status);
            const isPendingWholesale = order.status === 'pending_wholesale_price';
            const displayPrice = order.finalTotalAmount || order.totalAmount || order.initialTotalAmount || 0;

            return (
              <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === 'paid' ? 'bg-emerald-500' : isPendingWholesale ? 'bg-orange-400' : 'bg-blue-500'}`}></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ml-2">
                  
                  {/* ข้อมูลซ้าย */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        #{order.orderId || order.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusStyle.color}`}>
                        {statusStyle.icon}
                        {statusStyle.text}
                      </span>
                      {order.orderType === 'wholesale' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-white px-2 py-0.5 rounded-md font-tech">Wholesale</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-1">
                      สั่งซื้อเมื่อ: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-4">
                      <span>จำนวน: <span className="font-bold text-slate-800">{order.items?.length || 0}</span> รายการ</span>
                      
                      {/* Gimmick: ถ้าแนบสลิปแล้ว ให้มีปุ่มกดดูได้ */}
                      {order.paymentSlipUrl && (
                        <button 
                          onClick={() => { setViewSlipUrl(order.paymentSlipUrl); setViewSlipModalOpen(true); }}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> ดูสลิปที่แนบ
                        </button>
                      )}
                    </p>
                  </div>

                  {/* ข้อมูลขวา & Action */}
                  <div className="flex flex-col md:items-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 min-w-[160px]">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-tech font-bold mb-0.5">Total Amount</p>
                      <p className={`text-xl font-black ${isPendingWholesale ? 'text-slate-400' : 'text-cyber-blue'}`}>
                        ฿{displayPrice.toLocaleString()}
                      </p>
                    </div>

                    {/* ปุ่ม Action (รอชำระเงิน) */}
                    {(order.status === 'pending_payment' || order.status === 'awaiting_payment') && (
                      <button 
                        onClick={() => { setSelectedOrder(order); setUploadModalOpen(true); }}
                        className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                      >
                        <UploadCloud className="w-4 h-4" /> แจ้งชำระเงิน (อัปโหลดสลิป)
                      </button>
                    )}

                    {isPendingWholesale && (
                      <span className="text-xs font-medium text-orange-600 animate-pulse flex items-center gap-1">
                        <Clock className="w-3 h-3" /> รอผู้จัดการยืนยัน
                      </span>
                    )}

                    {order.status !== 'pending_payment' && order.status !== 'awaiting_payment' && !isPendingWholesale && (
                      <button className="w-full md:w-auto flex items-center justify-center gap-1 text-slate-500 hover:text-blue-600 text-xs font-bold px-4 py-2 rounded-lg transition-colors bg-slate-50 hover:bg-blue-50 border border-transparent hover:border-blue-100">
                        ดูรายละเอียด <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && orders.length > 0 && (
            <div className="pt-4 text-center">
              <button 
                onClick={loadMoreOrders}
                disabled={loadingMore}
                className="bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 font-bold tracking-wide text-xs px-6 py-2.5 rounded-full shadow-sm transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'โหลดประวัติเพิ่มเติม'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 🧾 Modal อัปโหลดสลิป (ฉบับสมบูรณ์ มี Drag&Drop + Preview) */}
      {uploadModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">แจ้งชำระเงิน</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5 font-medium">Order: #{selectedOrder.orderId || selectedOrder.id.substring(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={closeUploadModal} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSlipUpload} className="p-6">
              <div className="mb-6 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100/50">
                <span className="text-slate-600 text-sm font-bold">ยอดที่ต้องชำระ</span>
                <span className="text-2xl font-black text-blue-600">฿{(selectedOrder.finalTotalAmount || selectedOrder.totalAmount || selectedOrder.initialTotalAmount || 0).toLocaleString()}</span>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">หลักฐานการโอนเงิน (สลิป)</label>
                
                {!previewUrl ? (
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group relative
                      ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
                    `}
                  >
                    <FileImage className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-300 group-hover:text-blue-500'}`} />
                    <p className={`text-sm font-bold transition-colors ${isDragging ? 'text-blue-600' : 'text-slate-600 group-hover:text-blue-600'}`}>
                      {isDragging ? 'วางไฟล์ที่นี่เลย!' : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">รองรับ JPG, PNG (ขนาดไม่เกิน 5MB)</p>
                    <input 
                      type="file" 
                      required 
                      accept="image/png, image/jpeg, image/jpg" 
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      id="slip-upload" 
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                    <img src={previewUrl} alt="Slip Preview" className="w-full h-56 object-contain p-2" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button 
                        type="button" 
                        onClick={clearSelectedFile}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                      >
                        <X className="w-4 h-4" /> เลือกรูปใหม่
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeUploadModal} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors border border-slate-200">
                  ยกเลิก
                </button>
                <button type="submit" disabled={isUploading || !selectedFile} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-md disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                  {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยันการชำระเงิน'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 🖼 Modal สำหรับดูรูปสลิปที่แนบไปแล้ว */}
      {viewSlipModalOpen && viewSlipUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in" onClick={() => setViewSlipModalOpen(false)}>
          <div className="relative max-w-2xl w-full animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <button 
               onClick={() => setViewSlipModalOpen(false)}
               className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors p-2"
             >
               <X className="w-8 h-8" />
             </button>
             <img src={viewSlipUrl} alt="Payment Slip" className="w-full h-auto max-h-[80vh] object-contain rounded-xl shadow-2xl bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}