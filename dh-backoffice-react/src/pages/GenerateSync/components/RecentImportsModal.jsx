import React, { useState, useEffect } from 'react';
import { X, RotateCcw, AlertCircle, RefreshCw, History, CheckCircle } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { transactionImportService } from '../../../firebase/transactionImportService';
import { useAuth } from '../../../contexts/AuthContext';

export default function RecentImportsModal({ isOpen, onClose, latestSnapshot, onUploadComplete }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [undoingId, setUndoingId] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchBatches();
    }
  }, [isOpen]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'import_batches'), orderBy('createdAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Normalize createdAt
        createdMillis: doc.data().createdAt?.toMillis() || 0
      }));
      setBatches(data);
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (batchId) => {
    if (!window.confirm("ยืนยันการย้อนกลับ? สต็อกจะถูกทับด้วยค่าก่อนการนำเข้าทันที")) return;
    
    setUndoingId(batchId);
    try {
      await transactionImportService.revertTransactionBatch(batchId, currentUser);
      
      // Update local state to reflect reverted status
      setBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: 'reverted' } : b));
      
      // Tell parent to refresh changes
      if (onUploadComplete) onUploadComplete();
      
      alert("ย้อนกลับสำเร็จ!");
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setUndoingId(null);
    }
  };

  // Helper to check if we can undo
  const canUndo = (batch) => {
    if (batch.status === 'reverted') return false;
    
    // Check if it's older than the latest snapshot
    const snapMillis = latestSnapshot?.createdAt?.toMillis ? latestSnapshot.createdAt.toMillis() : 
                       (latestSnapshot?.createdAt ? new Date(latestSnapshot.createdAt).getTime() : 0);
                       
    // If the batch was created before the snapshot was saved, we cannot undo it
    // because the baseline has shifted (บันทึกการดักจับแล้ว)
    if (snapMillis > 0 && batch.createdMillis < snapMillis) {
      return false;
    }
    
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <History size={20} className="text-indigo-500" />
            ประวัติการนำเข้าไฟล์ล่าสุด (10 รายการ)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100">
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-slate-50/30 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <RefreshCw className="animate-spin mb-4" size={32} />
              <p>กำลังโหลดประวัติ...</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History size={48} className="mx-auto mb-3 opacity-20" />
              <p>ยังไม่มีประวัติการนำเข้า</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded-xl text-sm flex gap-3 mb-4">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>
                  <strong>คำแนะนำ:</strong> สามารถกด Undo ได้เฉพาะรายการที่ <b>"ยังไม่ถูก บันทึกการดักจับ (สร้าง TX)"</b> เท่านั้น<br/>
                  (หากมีการกดสร้าง TX ไปแล้ว รายการก่อนหน้าจะไม่สามารถย้อนกลับได้)
                </p>
              </div>

              {batches.map(batch => {
                const isReverted = batch.status === 'reverted';
                const undoable = canUndo(batch);
                const isProcessing = undoingId === batch.id;
                
                return (
                  <div key={batch.id} className={`p-4 rounded-xl border ${isReverted ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-sm'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:shadow-md`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          batch.actionType === 'deduct' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {batch.actionType === 'deduct' ? 'หักสต็อก (-)' : 'เพิ่มสต็อก (+)'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(batch.createdMillis).toLocaleString('th-TH')}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        อัปเดตจำนวน {batch.totalUpdated} รายการ
                      </p>
                      <p className="text-xs text-slate-500">
                        นำเข้าโดย: {batch.actor?.name || 'Unknown'}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isReverted ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                          <CheckCircle size={14} /> คืนค่าแล้ว
                        </div>
                      ) : !undoable ? (
                        <div className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100" title="ถูกบันทึกเป็น TX ไปแล้ว ไม่สามารถย้อนกลับได้">
                          เลยกำหนด Undo
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUndo(batch.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg text-sm font-bold transition-all border border-rose-200 hover:border-rose-600 shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          {isProcessing ? <RefreshCw size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
