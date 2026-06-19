import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { AVAILABLE_MENUS } from './MenuLayoutManager';

export const SortableMenuItem = ({ id, menuId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id, data: { type: 'Menu', menuId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const menuDef = AVAILABLE_MENUS[menuId] || { title: "ไม่ทราบชื่อเมนู (" + menuId + ")" };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-white border ${isDragging ? 'border-blue-500 shadow-md z-50 relative' : 'border-slate-200'} rounded-lg mb-2`}
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600 active:cursor-grabbing outline-none">
          <GripVertical size={16} />
        </button>
        <div className={`w-2 h-2 rounded-full bg-${menuDef.colorTheme || 'slate'}-500`}></div>
        <span className="text-sm font-bold text-slate-700">{menuDef.title}</span>
        {menuDef.isComingSoon && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">รอพัฒนา</span>}
      </div>
    </div>
  );
};
