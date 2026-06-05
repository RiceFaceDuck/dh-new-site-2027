import React from 'react';
import { GripVertical, Image as ImageIcon, Pencil, Trash2, Tag } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CategoryCard = ({ category, onEdit, onDelete, onToggleStatus }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between bg-white rounded-lg border p-4 ${
        isDragging
          ? 'opacity-50 shadow-xl border-blue-400 relative z-50'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      } transition-colors`}
    >
      {/* 🚀 Left Section: Handle + Image + Name + Type */}
      <div className="flex items-center gap-4">
        
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className={`p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          title="ลากเพื่อสลับตำแหน่ง"
        >
          <GripVertical size={20} />
        </div>

        {/* Icon Image Box */}
        <div className="w-12 h-12 bg-slate-50 rounded-md border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
          {category.imageUrl ? (
            <img 
              src={category.imageUrl} 
              alt={category.name} 
              className="w-full h-full object-contain"
            />
          ) : (
            <ImageIcon size={24} className="text-slate-400" strokeWidth={1.5} />
          )}
        </div>

        {/* Text Area (Name & Type) */}
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-slate-800 text-sm md:text-base leading-tight">
            {category.name}
          </span>
          {/* 🚀 แสดงป้าย Badge เพื่อให้แอดมินเห็นว่าผูกกับ Type อะไรไว้ */}
          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 w-fit">
            <Tag size={10} />
            {category.type || 'ไม่มีการกำหนด Type'}
          </span>
        </div>
      </div>

      {/* 🚀 Right Section: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Status Toggle Badge */}
        <button
          onClick={() => onToggleStatus(category.id, category.isActive)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            category.isActive
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
          }`}
          title={category.isActive ? "กดเพื่อปิดใช้งาน" : "กดเพื่อเปิดใช้งาน"}
        >
          {category.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Edit Button */}
        <button
          onClick={() => onEdit(category)}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          title="แก้ไขหมวดหมู่"
        >
          <Pencil size={18} strokeWidth={2} />
        </button>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(category.id, category.imageUrl)}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
          title="ลบหมวดหมู่"
        >
          <Trash2 size={18} strokeWidth={2} />
        </button>

      </div>
    </div>
  );
};

export default CategoryCard;