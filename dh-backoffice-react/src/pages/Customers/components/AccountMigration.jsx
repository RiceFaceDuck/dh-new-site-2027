import React, { useState } from 'react';
import { db } from '../../../firebase/config';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Loader2, Database, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AccountMigration() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, running, success, error
  const [message, setMessage] = useState('');

  const getCollectionPath = (colName) => {
    if (typeof window !== 'undefined' && window.__app_id && window.location.hostname.includes('canvas')) {
      return `artifacts/${window.__app_id}/public/data/${colName}`;
    }
    return colName;
  };

  const handleMigration = async () => {

    setLoading(true);
    setStatus('running');
    setMessage('กำลังอ่านข้อมูลลูกค้าทั้งหมดจากระบบ...');

    try {
      const usersRef = collection(db, getCollectionPath('users'));
      const snapshot = await getDocs(usersRef);
      const docs = snapshot.docs;
      
      setTotal(docs.length);
      setMessage(`พบข้อมูลทั้งหมด ${docs.length} รายการ กำลังเขียนข้อมูลชุดใหม่...`);

      let batch = writeBatch(db);
      let count = 0;
      let totalProcessed = 0;

      for (let i = 0; i < docs.length; i++) {
        const d = docs[i];
        const data = d.data();
        
        // ข้ามคนที่ถูกลบไปแล้วหรือคนที่เป็นแอดมินหลัก (หากต้องการ)
        // หรือถ้ามี accountId อยู่แล้ว ข้ามไปเพื่อประหยัดโควต้า
        if (data.accountId) {
          totalProcessed++;
          setProgress(totalProcessed);
          continue; 
        }

        const newAccountId = d.id.substring(0, 8).toUpperCase();
        
        batch.update(doc(db, getCollectionPath('users'), d.id), {
          accountId: newAccountId
        });

        count++;
        totalProcessed++;
        setProgress(totalProcessed);

        // Firestore batch limits to 500 writes
        if (count === 400) {
          await batch.commit();
          batch = writeBatch(db); // Reset batch
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }

      setStatus('success');
      setMessage('เพิ่ม Account ID ให้ลูกค้าครบทุกคนเรียบร้อยแล้ว!');
    } catch (error) {
      console.error('Migration Error:', error);
      setStatus('error');
      setMessage('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 flex items-start gap-3">
        <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-emerald-800 font-bold text-sm">การโอนย้ายข้อมูลสำเร็จ (Data Migration Success)</h4>
          <p className="text-emerald-600 text-xs mt-1">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Database className="text-indigo-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-indigo-900 font-bold text-sm">เครื่องมือจัดการโครงสร้างข้อมูล (Data Migration)</h4>
          <p className="text-indigo-700 text-xs mt-1 mb-3">
            ระบบตรวจพบว่าฐานข้อมูลยังไม่ได้สลักฟิลด์ Account ID แบบใหม่ คุณจำเป็นต้องรันเครื่องมือนี้ 1 ครั้งเพื่อเพิ่มประสิทธิภาพการค้นหา
          </p>
          
          {status === 'error' && (
            <div className="bg-red-50 text-red-600 p-2 rounded text-xs mb-3 flex items-center gap-1 border border-red-100">
              <AlertTriangle size={14} /> {message}
            </div>
          )}

          {status === 'running' ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-indigo-800 font-medium">
                <span>กำลังทำงาน: {message}</span>
                <span>{progress} / {total}</span>
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleMigration}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded shadow-sm text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              เริ่มอัปเดตข้อมูล (Run Migration)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
