import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

const PackingTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  // สถานะสำหรับหน้าต่างกรอกเลขพัสดุ
  const [selectedTask, setSelectedTask] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. ดึงคิวงานแพ็คสินค้าแบบ Real-time
  useEffect(() => {
    // กำหนด Query ดึงเฉพาะงานประเภท PACKING_TASK ที่ยังไม่เสร็จ
    const q = query(
      collection(db, 'todos'),
      where('type', '==', 'PACKING_TASK'),
      where('status', 'in', ['todo', 'in_progress', 'pending'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // เรียงลำดับจากเก่าไปใหม่ (ใครจ่ายเงินก่อน ควรได้แพ็คของก่อน)
      fetchedTasks.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeA - timeB; 
      });

      setTasks(fetchedTasks);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching packing tasks:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. ฟังก์ชันเริ่มงานแพ็ค (เปลี่ยนสถานะกันคนอื่นมาทำซ้ำ)
  const handleStartPacking = async (taskId) => {
    setProcessingId(taskId);
    try {
      const taskRef = doc(db, 'todos', taskId);
      const batch = writeBatch(db);
      
      batch.update(taskRef, { 
        status: 'in_progress', 
        updatedAt: serverTimestamp() 
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Start packing error:", error);
      alert('ไม่สามารถเริ่มงานได้ กรุณาลองใหม่');
    } finally {
      setProcessingId(null);
    }
  };

  // 3. ฟังก์ชันจบงานแพ็ค (บันทึกเลขพัสดุ และปิดจ๊อบ)
  const handleCompletePacking = async () => {
    if (!trackingNumber.trim()) {
      setErrorMsg('กรุณาระบุหมายเลขพัสดุ (Tracking Number)');
      return;
    }

    setProcessingId(selectedTask.id);
    setErrorMsg('');

    try {
      const batch = writeBatch(db);
      
      // 3.1 ปิดคิวงานใน To-do
      const taskRef = doc(db, 'todos', selectedTask.id);
      batch.update(taskRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        trackingNumber: trackingNumber.trim()
      });

      // 3.2 อัปเดตสถานะออเดอร์ให้ลูกค้าเห็นว่าจัดส่งแล้ว
      if (selectedTask.orderId) {
        const orderRef = doc(db, 'orders', selectedTask.orderId);
        batch.update(orderRef, {
          status: 'shipped',
          trackingNumber: trackingNumber.trim(),
          shippedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      
      // ล้างข้อมูลหน้าจอ
      setSelectedTask(null);
      setTrackingNumber('');
    } catch (error) {
      console.error("Complete packing error:", error);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      
      {/* 🔴 ส่วนหัวของ App */}
      <div className="bg-indigo-600 text-white pt-12 pb-6 px-4 rounded-b-3xl shadow-md sticky top-0 z-10">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            ระบบคลังสินค้า
          </h1>
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
            คิวงาน: {tasks.length}
          </div>
        </div>
        <p className="text-indigo-100 text-sm font-medium">รายการสินค้าที่ต้องจัดเตรียมและแพ็คลงกล่อง</p>
      </div>

      {/* 🔴 พื้นที่แสดงคิวงาน */}
      <div className="p-4 mt-2 space-y-4">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20">
             <svg className="animate-spin h-10 w-10 text-indigo-500 mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             <p className="text-gray-500 font-medium">กำลังโหลดคิวงาน...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 mt-10">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">ไม่มีคิวแพ็คสินค้า</h2>
            <p className="text-gray-500 text-sm">ยอดเยี่ยม! คุณจัดการออเดอร์ทั้งหมดเรียบร้อยแล้ว</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${task.status === 'in_progress' ? 'border-orange-300 ring-1 ring-orange-100' : 'border-gray-200'}`}>
              
              {/* Header ของแต่ละการ์ดงาน */}
              <div className={`px-4 py-3 flex justify-between items-center ${task.status === 'in_progress' ? 'bg-orange-50/50' : 'bg-gray-50'}`}>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">เลขที่บิล</span>
                  <span className="font-black text-gray-900 text-lg leading-none mt-0.5">{task.invoiceId || 'ไม่มีเลขบิล'}</span>
                </div>
                <div>
                   {task.status === 'in_progress' ? (
                     <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-1 rounded-md uppercase flex items-center gap-1 shadow-sm">
                       <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> กำลังแพ็ค
                     </span>
                   ) : (
                     <span className="bg-gray-200 text-gray-600 text-[10px] font-black px-2 py-1 rounded-md uppercase">
                       รอจัดของ
                     </span>
                   )}
                </div>
              </div>

              {/* ข้อมูลการจัดส่ง (สำคัญสำหรับคนแพ็ค) */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                   <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                   </div>
                   <div>
                     <p className="font-bold text-gray-900 text-sm">{task.customerName}</p>
                     <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                       {task.shippingAddress?.address} {task.shippingAddress?.subdistrict} {task.shippingAddress?.district} {task.shippingAddress?.province} {task.shippingAddress?.zipcode}
                     </p>
                     <p className="text-xs font-semibold text-gray-700 mt-1">โทร: {task.shippingAddress?.phone}</p>
                   </div>
                </div>
              </div>

              {/* รายการสินค้าที่ต้องหยิบ (Checklist) */}
              <div className="p-4 bg-gray-50/30">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                  รายการสินค้า ({task.items?.length || 0} รายการ)
                </h4>
                
                <div className="space-y-3">
                  {task.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                      {/* กล่องติ๊กถูก (ทำหลอกๆ ให้พนักงานกดเล่นเวลาหยิบของ) */}
                      <div className="w-6 h-6 rounded border-2 border-gray-300 flex-shrink-0 active:bg-indigo-100 active:border-indigo-400 transition-colors"></div>
                      
                      <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                        {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : null}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-1">SKU: {item.sku || 'N/A'}</p>
                      </div>
                      
                      <div className="shrink-0 bg-indigo-50 text-indigo-700 font-black text-lg w-10 h-10 flex items-center justify-center rounded-lg border border-indigo-100 shadow-inner">
                        x{item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ปุ่ม Action (ใหญ่ๆ กดง่ายๆ) */}
              <div className="p-4 border-t border-gray-100 bg-white">
                {task.status === 'in_progress' ? (
                  <button 
                    onClick={() => setSelectedTask(task)}
                    className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black text-lg rounded-xl shadow-[0_4px_0_rgb(22,163,74)] active:shadow-[0_0px_0_rgb(22,163,74)] active:translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    แพ็คเสร็จแล้ว (ระบุเลขพัสดุ)
                  </button>
                ) : (
                  <button 
                    onClick={() => handleStartPacking(task.id)}
                    disabled={processingId === task.id}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-xl shadow-[0_4px_0_rgb(234,88,12)] active:shadow-[0_0px_0_rgb(234,88,12)] active:translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    {processingId === task.id ? 'กำลังเริ่ม...' : 'หยิบงานนี้ (เริ่มแพ็ค)'}
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* 🖼️ Modal: สำหรับกรอกเลข Tracking */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-10 sm:pb-6 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900">ยืนยันการจัดส่ง</h3>
              <button onClick={() => { setSelectedTask(null); setErrorMsg(''); }} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">ส่งให้</p>
              <p className="font-bold text-gray-900 text-sm line-clamp-1">{selectedTask.customerName}</p>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{selectedTask.shippingAddress?.address}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-2">หมายเลขพัสดุ (Tracking Number)</label>
              <input 
                type="text" 
                value={trackingNumber}
                onChange={(e) => { setTrackingNumber(e.target.value); setErrorMsg(''); }}
                placeholder="เช่น TH0123456789"
                className="w-full text-lg font-bold text-center px-4 py-4 bg-white border-2 border-gray-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all uppercase"
                autoFocus
              />
              {errorMsg && <p className="text-red-500 text-xs font-bold mt-2 text-center">{errorMsg}</p>}
            </div>

            <button 
              onClick={handleCompletePacking}
              disabled={processingId === selectedTask.id}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black text-lg rounded-xl shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2"
            >
              {processingId === selectedTask.id ? (
                'กำลังบันทึกข้อมูล...'
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  บันทึก และแจ้งลูกค้า
                </>
              )}
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default PackingTasks;