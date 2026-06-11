import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, Loader2 } from 'lucide-react';
import { todoService } from '../../firebase/todoService';

export default function TodoArchive() {
  const navigate = useNavigate();
  const [archivedTodos, setArchivedTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchive = async () => {
      try {
        const data = await todoService.getCompletedTodos(100);
        setArchivedTodos(data);
      } catch (err) {
        console.error("Error fetching archive:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArchive();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toMillis) return '-';
    const date = new Date(timestamp.toMillis());
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/todo')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Archive className="w-7 h-7 text-slate-500" />
              พื้นที่จัดเก็บงาน (Archive)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ประวัติงานที่ดำเนินการเสร็จสิ้น, ไม่อนุมัติ หรือยกเลิกแล้ว (แสดง 100 รายการล่าสุด)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500">กำลังโหลดข้อมูลพื้นที่จัดเก็บ...</p>
          </div>
        ) : archivedTodos.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            ไม่พบข้อมูลงานที่จัดเก็บ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500">
                <tr>
                  <th className="py-4 px-6 font-semibold">ชื่องาน</th>
                  <th className="py-4 px-6 font-semibold">ประเภท</th>
                  <th className="py-4 px-6 font-semibold text-center">สถานะ</th>
                  <th className="py-4 px-6 font-semibold">ผู้ดำเนินการ</th>
                  <th className="py-4 px-6 font-semibold">เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {archivedTodos.map(todo => {
                  const isCompleted = todo.status === 'completed' || todo.status === 'COMPLETED' || todo.status === 'done';
                  return (
                  <tr key={todo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 max-w-xs truncate text-slate-800 dark:text-slate-200 font-medium">
                      {todo.title || 'ไม่ระบุชื่องาน'}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {todo.type || '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
                        ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {isCompleted ? 'เสร็จสิ้น' : 'ยกเลิก/ปฏิเสธ'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {todo.actionBy || todo.handledByName || todo.handledBy || 'System'}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {formatDate(todo.completedAt || todo.updatedAt)}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
