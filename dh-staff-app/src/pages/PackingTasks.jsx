import React, { useState, useEffect } from 'react';
import { packingService } from '../firebase/packingService';
import PackingTaskCard from '../components/packing/PackingTaskCard';
import TrackingModal from '../components/packing/TrackingModal';

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
    const unsubscribe = packingService.subscribeToActiveTasks(
      (fetchedTasks) => {
        setTasks(fetchedTasks);
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. ฟังก์ชันเริ่มงานแพ็ค (เปลี่ยนสถานะกันคนอื่นมาทำซ้ำ)
  const handleStartPacking = async (taskId) => {
    setProcessingId(taskId);
    try {
      await packingService.startPacking(taskId);
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
      await packingService.completePacking(selectedTask.id, selectedTask.orderId, trackingNumber.trim());
      
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
            <PackingTaskCard 
              key={task.id} 
              task={task} 
              processingId={processingId} 
              onStartPacking={handleStartPacking} 
              onSelectTask={setSelectedTask} 
            />
          ))
        )}
      </div>

      {/* 🖼️ Modal: สำหรับกรอกเลข Tracking */}
      <TrackingModal 
        selectedTask={selectedTask}
        trackingNumber={trackingNumber}
        setTrackingNumber={setTrackingNumber}
        errorMsg={errorMsg}
        setErrorMsg={setErrorMsg}
        onClose={() => setSelectedTask(null)}
        onComplete={handleCompletePacking}
        processingId={processingId}
      />

    </div>
  );
};

export default PackingTasks;