import React, { useState, useEffect, useCallback } from 'react';
import { Plus, LayoutList, Loader2, FolderOpen } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import CategoryCard from './CategoryCard';
import CategoryFormModal from './CategoryFormModal';
import { categoryService } from '../../../firebase/categoryService';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // การดึงข้อมูลหมวดหมู่
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ตั้งค่า Sensor สำหรับ Drag & Drop
  // กำหนด distance: 5 เพื่อให้ยังสามารถคลิกปุ่มต่างๆ (แก้ไข/ลบ/สวิตช์) บนการ์ดได้โดยไม่ติด Drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Logic เมื่อลากวางเสร็จสิ้น
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        // ขยับลำดับใน State ทันทีเพื่อให้ UI ลื่นไหล (Optimistic UI Update)
        const newItems = arrayMove(items, oldIndex, newIndex);

        // จัดเตรียมข้อมูลเพื่อส่งไปบันทึกที่ Backend
        const reorderedData = newItems.map((item, index) => ({
          id: item.id,
          newOrder: index + 1,
        }));

        // สั่งอัปเดตเบื้องหลัง (Background update)
        categoryService.updateCategoryOrder(reorderedData).catch((err) => {
          console.error('Failed to update order in database:', err);
          fetchCategories(); // หากล้มเหลวให้ดึงข้อมูลใหม่เพื่อรีเซ็ตลำดับ
        });

        return newItems;
      });
    }
  };

  // เปิด Modal เพื่อสร้างหมวดหมู่ใหม่
  const openCreateModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  // เปิด Modal เพื่อแก้ไขหมวดหมู่
  const openEditModal = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  // สลับสถานะเปิด-ปิดหมวดหมู่
  const handleToggleStatus = async (id, currentStatus) => {
    // ปรับ State ทันทีเพื่อให้ UI ตอบสนองไว (Optimistic UI Update)
    const isCurrentlyActive = currentStatus === 'active' || currentStatus === true;
    
    setCategories((prev) => 
      prev.map((cat) => 
        cat.id === id 
          ? { ...cat, isActive: !isCurrentlyActive, status: !isCurrentlyActive ? 'active' : 'inactive' } 
          : cat
      )
    );

    try {
      await categoryService.toggleCategoryStatus(id, currentStatus);
    } catch (error) {
      console.error('Failed to toggle status:', error);
      fetchCategories(); // หากเปลี่ยนในฐานข้อมูลไม่สำเร็จ ให้ดึงข้อมูลใหม่มารีเซ็ต UI
    }
  };

  // ลบหมวดหมู่
  const handleDelete = async (id, iconUrl) => {
    if (window.confirm('คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      try {
        await categoryService.deleteCategory(id, iconUrl);
        fetchCategories(); // ดึงข้อมูลอัปเดตหลังลบ
      } catch (error) {
        console.error('Failed to delete category:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      
      {/* 🚀 Header Section */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
            <LayoutList size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">จัดการแผงหมวดหมู่หน้าแรก</h2>
            <p className="text-sm text-slate-500">เพิ่ม ลบ หรือลากเพื่อจัดเรียงลำดับการแสดงผลหมวดหมู่</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} />
          เพิ่มหมวดหมู่ใหม่
        </button>
      </div>

      {/* 🚀 Body Section (List & Drag and Drop) */}
      <div className="p-6 flex-1 bg-slate-50/30">
        {isLoading ? (
          // Loading State
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <span className="text-sm font-medium">กำลังโหลดข้อมูล...</span>
          </div>
        ) : categories.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <FolderOpen size={48} className="text-slate-300 mb-3" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-slate-700 mb-1">ยังไม่มีหมวดหมู่</h3>
            <p className="text-sm text-slate-500 mb-4">เริ่มต้นด้วยการเพิ่มหมวดหมู่ใหม่เพื่อแสดงผลในหน้าเว็บไซต์</p>
            <button
              onClick={openCreateModal}
              className="text-blue-600 font-medium text-sm hover:underline"
            >
              + เพิ่มหมวดหมู่แรกของคุณ
            </button>
          </div>
        ) : (
          // Data List with Drag and Drop
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map((cat) => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* 🚀 Modal Section */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingCategory}
        onSuccess={fetchCategories}
      />
    </div>
  );
};

export default CategoryManager;