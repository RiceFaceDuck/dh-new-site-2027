/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// 🛠️ แก้ไข Path นำเข้า db ถอยกลับ 2 ระดับ (../../) ไปที่ src/firebase/config
import { db } from '../../firebase/config';
import { Megaphone, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// 🔐 ดึงสิทธิ์การเข้าถึงรหัส Sandbox App ID
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

export default function ManagerTodoSummary() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 💡 อ้างอิงไปยัง Collection manager_todos (แยกขาดจาก todos ส่วนกลาง)
    const todosRef = collection(db, 'artifacts', appId, 'public', 'data', 'manager_todos');
    
    // ดึงเฉพาะงานที่เป็นการขออนุมัติโฆษณา และสถานะรอตรวจสอบ
    const q = query(
      todosRef, 
      where('type', '==', 'USER_SKU_APPROVAL'),
      where('status', '==', 'pending')
    );

    // 🚀 ใช้ onSnapshot เพื่อให้ตัวเลขเด้งอัปเดตแบบ Real-time ทันทีที่มี User ส่งคำขอ
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
      setLoading(false);
    }, (error) => {
      console.error("❌ Error fetching manager todos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-center min-h-[140px]">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  const hasPending = pendingCount > 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 ${
      hasPending 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-md shadow-blue-100/50 hover:shadow-lg' 
        : 'bg-white border-gray-100 shadow-sm'
    }`}>
      
      {/* Background Decoration */}
      {hasPending && (
        <div className="absolute -right-6 -top-6 text-blue-500/10 rotate-12 pointer-events-none">
          <Megaphone size={120} />
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${hasPending ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              <Megaphone size={20} />
            </div>
            <h3 className="font-bold text-gray-800 tracking-tight">คำขอลงโฆษณาสินค้า</h3>
          </div>
          
          {/* Status Indicator */}
          {hasPending ? (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          ) : (
            <CheckCircle2 size={18} className="text-emerald-500" />
          )}
        </div>

        {/* Content */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black font-tech tracking-tighter ${hasPending ? 'text-blue-700' : 'text-gray-400'}`}>
              {pendingCount}
            </span>
            <span className="text-sm font-medium text-gray-500">รายการ</span>
          </div>
          <p className={`text-xs mt-1 font-medium ${hasPending ? 'text-blue-600/80' : 'text-gray-400'}`}>
            {hasPending ? 'รอการตรวจสอบและอนุมัติจากคุณ' : 'ไม่มีคำขอโฆษณาใหม่ในขณะนี้'}
          </p>
        </div>

        {/* Action Button */}
        <Link 
          to="/managers/ads" 
          className={`mt-2 flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all group ${
            hasPending 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>ไปหน้าจัดการโฆษณา</span>
          <ArrowRight size={16} className={`transition-transform ${hasPending ? 'group-hover:translate-x-1' : ''}`} />
        </Link>
        
      </div>
    </div>
  );
}