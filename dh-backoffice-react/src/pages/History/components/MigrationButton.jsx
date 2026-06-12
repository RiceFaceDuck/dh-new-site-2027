import React, { useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config.js';
import { gasHistoryService } from '../../../firebase/gasHistoryService.js';
import { Loader2, DatabaseBackup } from 'lucide-react';

export default function MigrationButton() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState('');

  const handleMigrate = async () => {
    if (!window.confirm("คุณต้องการดึงข้อมูล History Log เก่าจาก Firebase ไปไว้ใน Google Drive ใช่หรือไม่? (ดึง 500 รายการล่าสุดเพื่อทดสอบ)")) return;
    
    setIsMigrating(true);
    setProgress('กำลังดึงข้อมูลจาก Firebase...');
    
    try {
      // 1. Fetch old logs
      const q = query(collection(db, 'history_logs'), orderBy('timestamp', 'desc'), limit(500));
      const snapshot = await getDocs(q);
      
      const oldLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        let tsIso = new Date().toISOString();
        if (data.timestamp && data.timestamp.toDate) {
          tsIso = data.timestamp.toDate().toISOString();
        } else if (typeof data.timestamp === 'number') {
          tsIso = new Date(data.timestamp).toISOString();
        }
        
        return {
          id: doc.id,
          ...data,
          historical_timestamp: tsIso // This is the secret key for the new GAS script
        };
      });

      if (oldLogs.length === 0) {
        setProgress('ไม่มีข้อมูลเก่าใน Firebase');
        setIsMigrating(false);
        return;
      }

      setProgress(`กำลังย้ายข้อมูล ${oldLogs.length} รายการ (ส่งผ่าน Background)...`);
      
      // 2. Map and send to gasHistoryService
      for (const oldLog of oldLogs) {
        gasHistoryService.log({
          level: 'INFO',
          module: oldLog.module || 'System',
          action: oldLog.action || 'Unknown',
          target: { id: oldLog.targetId || '-' },
          details: { legacy_details: oldLog.details || '' },
          actorOverride: {
            uid: oldLog.actionBy || oldLog.performedBy || 'Unknown',
            name: oldLog.actorName || 'Unknown User',
            email: oldLog.actorEmail || 'N/A'
          }
        });
        
        // Inject historical_timestamp directly into the last queued item
        const lastQueued = gasHistoryService.queue[gasHistoryService.queue.length - 1];
        if (lastQueued) {
          lastQueued.historical_timestamp = oldLog.historical_timestamp;
        }
      }
      
      // Force flush
      await gasHistoryService._flush();
      
      setProgress('ย้ายข้อมูลสำเร็จ! กรุณารอ 2-3 วินาทีแล้วลองเลือกวันที่ย้อนหลังดูครับ');
      
    } catch (error) {
      console.error("Migration failed:", error);
      setProgress(`Error: ${error.message}`);
    } finally {
      setTimeout(() => {
        setIsMigrating(false);
        setProgress('');
      }, 5000);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4 md:mt-0 ml-auto md:ml-4 border-l border-[#003642] pl-4">
      <button 
        onClick={handleMigrate}
        disabled={isMigrating}
        className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs transition-colors ${
          isMigrating 
            ? 'bg-[#002b36] border-[#586e75] text-[#586e75] cursor-not-allowed' 
            : 'bg-[#001e26] border-[#d33682] text-[#d33682] hover:bg-[#d33682] hover:text-white'
        }`}
        title="Migrate old Firebase logs to Drive"
      >
        {isMigrating ? <Loader2 size={14} className="animate-spin" /> : <DatabaseBackup size={14} />}
        {isMigrating ? 'Migrating...' : 'Migrate Legacy Logs'}
      </button>
      {progress && <span className="text-xs text-[#b58900] whitespace-nowrap">{progress}</span>}
    </div>
  );
}
