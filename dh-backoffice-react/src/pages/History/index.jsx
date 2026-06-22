import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import GuideModal from '../../components/common/GuideModal';
import { useHistoryLogs } from './hooks/useHistoryLogs';
import HistoryHeader from './components/HistoryHeader';
import HistoryTable from './components/HistoryTable';
import { exportToCSV } from './utils/historyFormatters';

export default function History() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const {
    filteredLogs,
    loading,
    loadingMore,
    searchTerm,
    setSearchTerm,
    moduleFilter,
    setModuleFilter,
    actionFilter,
    setActionFilter,
    dateFilter,
    setDateFilter,
    hasMore,
    loadMore
  } = useHistoryLogs();

  if (loading && filteredLogs.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] font-mono bg-[#002b36] m-2 rounded border border-[#003642]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2aa198] mb-4" />
        <p className="text-[#839496] tracking-widest text-sm">System.init()...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col font-mono bg-[#002b36] p-4 sm:p-6 overflow-hidden z-10">
      
      <HistoryHeader 
        dateFilter={dateFilter} setDateFilter={setDateFilter}
        moduleFilter={moduleFilter} setModuleFilter={setModuleFilter}
        actionFilter={actionFilter} setActionFilter={setActionFilter}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        onExport={() => exportToCSV(filteredLogs)}
        onGuideOpen={() => setIsGuideOpen(true)}
      />

      <div className="flex-1 min-h-0 mt-4">
        <HistoryTable 
          filteredLogs={filteredLogs}
          hasMore={hasMore}
          loadMore={loadMore}
          loadingMore={loadingMore}
          searchTerm={searchTerm}
          moduleFilter={moduleFilter}
          actionFilter={actionFilter}
        />
      </div>

      <GuideModal 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="คู่มือการใช้งาน: ระบบบันทึกประวัติ (History/System Logs)"
        config={{
          description: "หน้านี้ใช้สำหรับตรวจสอบประวัติการใช้งานระบบทั้งหมด ไม่ว่าจะเป็นการเพิ่ม แก้ไข หรือลบข้อมูล โดยระบบจะบันทึกทุกการเคลื่อนไหวไว้เพื่อความโปร่งใสและตรวจสอบย้อนหลังได้",
          howTo: [
            "1. <b>การกรองข้อมูล:</b> ใช้คำสั่ง `--date`, `--module` และ `--level` เพื่อเลือกดูข้อมูลเฉพาะเรื่องที่สนใจ",
            "2. <b>ค้นหาด้วยข้อความ:</b> พิมพ์คำสำคัญลงในช่อง `| grep` เพื่อค้นหาคำที่อยู่ในรายละเอียด Log",
            "3. <b>การส่งออกข้อมูล:</b> กดปุ่ม `> export.csv` เพื่อดาวน์โหลดข้อมูลที่กรองไว้ไปเปิดใน Excel",
            "4. <b>การเลื่อนดูข้อมูล:</b> หากมีข้อมูลจำนวนมาก ระบบจะโหลดเพิ่มเติมอัตโนมัติเมื่อเลื่อนลงด้านล่าง"
          ],
          tips: [
            "รหัสพนักงาน/ผู้ใช้งาน จะแสดงเป็น ID ซึ่งคุณสามารถนำไปค้นหาในหน้า 'จัดการพนักงาน' เพื่อดูว่าเป็นใคร",
            "ปุ่ม '> help' ที่กำลังใช้งานอยู่ เป็นระบบ Terminal UI แบบคลาสสิก เพื่อให้ความรู้สึกแบบนักพัฒนา!"
          ],
          expectedResults: "เมื่อมีการแก้ไขข้อมูลใดๆ ในระบบหลังบ้าน Log จะปรากฏในหน้านี้ทันที"
        }}
      />
    </div>
  );
}
