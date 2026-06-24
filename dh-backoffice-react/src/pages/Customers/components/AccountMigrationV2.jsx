import React, { useState } from 'react';
import { db } from '../../../firebase/config';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Loader2, Wand2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AccountMigrationV2() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const getCollectionPath = (colName) => {
    if (typeof window !== 'undefined' && window.__app_id && window.location.hostname.includes('canvas')) {
      return `artifacts/${window.__app_id}/public/data/${colName}`;
    }
    return colName;
  };

  const generateStandardId = () => {
    // Generate 8 random uppercase alphanumeric characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleMigration = async () => {
    setLoading(true);
    setStatus('running');
    setMessage('กำลังตรวจสอบรหัสลูกค้าทั้งหมด...');

    try {
      const usersRef = collection(db, getCollectionPath('users'));
      const snapshot = await getDocs(usersRef);
      const docs = snapshot.docs;
      
      setTotal(docs.length);
      setMessage(`พบข้อมูลทั้งหมด ${docs.length} รายการ กำลังจัดระเบียบรหัส...`);

      let batch = writeBatch(db);
      let count = 0;
      let totalProcessed = 0;
      let modifiedCount = 0;

      for (let i = 0; i < docs.length; i++) {
        const d = docs[i];
        const data = d.data();
        
        let currentAccountId = data.accountId || d.id.substring(0,8).toUpperCase();
        
        // เช็คว่ารหัสปัจจุบันได้มาตรฐานหรือไม่ (8 ตัวอักษร และไม่มีขีด ไม่มีสัญลักษณ์พิเศษ)
        const isStandard = currentAccountId.length === 8 && /^[A-Z0-9]+$/.test(currentAccountId);

        if (isStandard) {
          totalProcessed++;
          setProgress(totalProcessed);
          continue; 
        }

        // ถ้ารหัสไม่ได้มาตรฐาน (เช่น CUST-7473, 173, DH-UID-P)
        const newAccountId = generateStandardId();
        
        // เก็บรักษาประวัติรหัสเก่าไว้เผื่อพนักงานค้นหา
        const updates = {
          accountId: newAccountId,
          legacyCode: currentAccountId // สำรองรหัสยุคเก่าเก็บไว้ 
        };

        // ถ้าไม่มี customerCode ก็ให้เซ็ตเป็นรหัสเก่าด้วย
        if (!data.customerCode) {
          updates.customerCode = currentAccountId;
        }

        batch.update(doc(db, getCollectionPath('users'), d.id), updates);

        count++;
        totalProcessed++;
        modifiedCount++;
        setProgress(totalProcessed);

        if (count === 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }

      // บังคับให้โหลดข้อมูลใหม่โดยการลบแคชของ Client นี้
      localStorage.removeItem('dh_customers_data_cache_v6');
      localStorage.removeItem('dh_customers_last_sync_v6');

      setStatus('success');
      setMessage(`อัปเกรดรหัสเป็นมาตรฐานใหม่ 8 หลัก สำเร็จจำนวน ${modifiedCount} บัญชี!`);
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
          <h4 className="text-emerald-800 font-bold text-sm">การจัดระเบียบสำเร็จ (Standardization Success)</h4>
          <p className="text-emerald-600 text-xs mt-1">{message}</p>
          <p className="text-emerald-700 text-[10px] mt-2 font-bold">กรุณา Refresh หน้าเว็บ 1 ครั้ง เพื่อดูการเปลี่ยนแปลง</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-lg p-4 mb-4 mt-2 mx-2">
      <div className="flex items-start gap-3">
        <Wand2 className="text-fuchsia-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-fuchsia-900 font-bold text-sm">เครื่องมือจัดระเบียบรหัสลูกค้า (Standardize IDs)</h4>
          <p className="text-fuchsia-700 text-xs mt-1 mb-3">
            ระบบจะค้นหาลูกค้าที่ใช้รหัสรูปแบบเก่า (เช่น มีขีด, สั้นเกินไป) แล้วสุ่มรหัส 8 หลักมาตรฐานใหม่ให้ทั้งหมด (รหัสเก่าจะถูกสำรองไว้ให้ค้นหาเจอเหมือนเดิม)
          </p>
          
          {status === 'error' && (
            <div className="bg-red-50 text-red-600 p-2 rounded text-xs mb-3 flex items-center gap-1 border border-red-100">
              <AlertTriangle size={14} /> {message}
            </div>
          )}

          {status === 'running' ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-fuchsia-800 font-medium">
                <span>กำลังทำงาน: {message}</span>
                <span>{progress} / {total}</span>
              </div>
              <div className="w-full bg-fuchsia-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-fuchsia-500 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleMigration}
              disabled={loading}
              className="px-4 py-2 bg-fuchsia-600 text-white rounded shadow-sm text-xs font-bold flex items-center gap-2 hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              เริ่มอัปเกรดรหัสมาตรฐาน (Run Standardization)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
