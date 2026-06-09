import React from 'react';
import { 
  Users, Database, FileEdit, PlusCircle, Trash2,
  Boxes, Receipt, Undo2, ShieldAlert, Tags
} from 'lucide-react';

export const formatTimeInfo = (timestamp) => {
  if (!timestamp) return { absolute: '-', relative: '' };
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  const absolute = date.toLocaleString('th-TH', { 
    year: '2-digit', month: 'short', day: 'numeric', 
    hour: '2-digit', minute:'2-digit' 
  });

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  let relative = '';
  
  if (diffInSeconds < 60) relative = 'เมื่อสักครู่';
  else if (diffInSeconds < 3600) relative = `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
  else if (diffInSeconds < 86400) relative = `${Math.floor(diffInSeconds / 3600)} ชม.ที่แล้ว`;
  else relative = `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;

  return { absolute, relative };
};

export const getModuleConfig = (module) => {
  const mod = module?.toLowerCase() || '';
  if (mod.includes('customer')) return { icon: <Users size={12} strokeWidth={2.5} />, color: 'text-[#3B82F6] bg-[#EFF6FF] border-[#BFDBFE] dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800', label: 'CUSTOMER' };
  if (mod.includes('staff') || mod.includes('user')) return { icon: <ShieldAlert size={12} strokeWidth={2.5} />, color: 'text-[#8B5CF6] bg-[#F5F3FF] border-[#DDD6FE] dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800', label: 'STAFF' };
  if (mod.includes('inventory') || mod.includes('product')) return { icon: <Boxes size={12} strokeWidth={2.5} />, color: 'text-[#F97316] bg-[#FFF7ED] border-[#FED7AA] dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800', label: 'INVENTORY' };
  if (mod.includes('order') || mod.includes('billing')) return { icon: <Receipt size={12} strokeWidth={2.5} />, color: 'text-[#10B981] bg-[#ECFDF5] border-[#A7F3D0] dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800', label: 'BILLING' };
  if (mod.includes('claim')) return { icon: <Undo2 size={12} strokeWidth={2.5} />, color: 'text-[#EF4444] bg-[#FEF2F2] border-[#FECACA] dark:text-red-400 dark:bg-red-900/20 dark:border-red-800', label: 'CLAIMS' };
  return { icon: <Database size={12} strokeWidth={2.5} />, color: 'text-gray-500 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700', label: module?.toUpperCase() || 'SYSTEM' };
};

export const getActionConfig = (action) => {
  const act = action?.toUpperCase() || '';
  switch(act) {
    case 'CREATE': return { icon: <PlusCircle size={14} strokeWidth={2.5} />, color: 'text-[#10B981] dark:text-[#34D399]' };
    case 'UPDATE': return { icon: <FileEdit size={14} strokeWidth={2.5} />, color: 'text-[#3B82F6] dark:text-[#60A5FA]' };
    case 'DELETE': return { icon: <Trash2 size={14} strokeWidth={2.5} />, color: 'text-[#EF4444] dark:text-[#F87171]' };
    case 'UPDATE ROLE': return { icon: <ShieldAlert size={14} strokeWidth={2.5} />, color: 'text-[#8B5CF6] dark:text-[#A78BFA]' };
    default: return { icon: <Tags size={14} strokeWidth={2.5} />, color: 'text-gray-500 dark:text-gray-400' };
  }
};

export const exportToCSV = (logs) => {
  if (!logs || logs.length === 0) return;

  const headers = ['Timestamp', 'Module', 'Action', 'Details', 'TargetID', 'Actor Name', 'Actor Email'];
  
  const csvRows = [
    headers.join(','), // Header row
    ...logs.map(log => {
      const dateStr = log.timestamp && log.timestamp.toDate 
        ? log.timestamp.toDate().toISOString() 
        : new Date(log.timestamp).toISOString();
      
      const escapeCsv = (str) => `"${(str || '').replace(/"/g, '""')}"`;
      
      return [
        escapeCsv(dateStr),
        escapeCsv(log.module),
        escapeCsv(log.action),
        escapeCsv(log.details),
        escapeCsv(log.targetId),
        escapeCsv(log.actorName || log.performedBy || 'Unknown'),
        escapeCsv(log.actorEmail || '')
      ].join(',');
    })
  ];

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `system_history_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
