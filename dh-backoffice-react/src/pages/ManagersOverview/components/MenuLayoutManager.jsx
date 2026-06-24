import React from 'react';
import { 
  X, Save, Plus, GripVertical, Loader2
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';

import { useMenuDragAndDrop } from './hooks/useMenuDragAndDrop';
import MenuLayoutGuide from './menu-layout/MenuLayoutGuide';
import MenuLayoutZone from './menu-layout/MenuLayoutZone';

// --- เมนูทั้งหมดที่มีในระบบ ---
export const AVAILABLE_MENUS = {
  vip: { title: "ลูกค้า VIP", iconName: "Crown", colorTheme: "amber" },
  staff: { title: "จัดการพนักงาน", iconName: "Users", colorTheme: "orange" },
  buffer: { title: "บัฟเฟอร์คลังสินค้า", iconName: "Box", colorTheme: "rose" },
  category: { title: "จัดการหมวดหมู่หน้าแรก", iconName: "LayoutTemplate", colorTheme: "emerald" },
  regex: { title: "กฎความถูกต้องลิงก์", iconName: "LinkIcon", colorTheme: "sky" },
  warranty: { title: "กติกาการรับประกัน", iconName: "ShieldCheck", colorTheme: "amber" },
  ads_config: { title: "ตั้งค่าพื้นที่โฆษณา", iconName: "Megaphone", colorTheme: "indigo" },
  theme: { title: "ธีมและพื้นหลัง", iconName: "ImageIcon", colorTheme: "fuchsia" },
  knowledge: { title: "ระบบความรู้เพิ่มเติม", iconName: "BookOpen", colorTheme: "blue" },
  footer: { title: "ตั้งค่าพื้นที่ส่วนล่าง", iconName: "LayoutPanelTop", colorTheme: "indigo" },
  pricing: { title: "นโยบายราคาปลีก", iconName: "Calculator", colorTheme: "emerald" },
  history: { title: "ประวัติระบบ", iconName: "History", colorTheme: "purple" },
  email: { title: "อีเมลบริษัท", iconName: "Mail", colorTheme: "blue" },
  drive: { title: "จัดการ Google Drive", iconName: "CloudUpload", colorTheme: "cyan" },
  ads: { title: "Ads Manager", iconName: "Megaphone", colorTheme: "rose" },
  credit: { title: "Credit Point", iconName: "CreditCard", colorTheme: "indigo" },
  inventory_adjustment: { title: "จัดการสต๊อคกรณีพิเศษ", iconName: "ShieldAlert", colorTheme: "orange" },
  banner: { title: "แบนเนอร์โฆษณา", iconName: "Megaphone", colorTheme: "rose", isComingSoon: true },
  seo: { title: "SEO & ค้นหา", iconName: "Search", colorTheme: "blue", isComingSoon: true },
  apikey: { title: "API Keys", iconName: "Code", colorTheme: "cyan", isComingSoon: true },
  privacy: { title: "Privacy & Cookies", iconName: "ShieldCheck", colorTheme: "emerald" },
  error404: { title: "หน้า 404 Error", iconName: "AlertTriangle", colorTheme: "amber", isComingSoon: true },
  redirect: { title: "Redirect URLs", iconName: "ArrowRightLeft", colorTheme: "indigo", isComingSoon: true },
  script: { title: "Custom Scripts", iconName: "Code2", colorTheme: "slate", isComingSoon: true },
  security: { title: "Security & Block", iconName: "ShieldBan", colorTheme: "red", isComingSoon: true },
  maintenance: { title: "ปิดปรับปรุง", iconName: "HardHat", colorTheme: "orange", isComingSoon: true },
  promotions: { title: "โปรโมชั่น", iconName: "Tags", colorTheme: "fuchsia" },
  freebie: { title: "ของแถม", iconName: "Gift", colorTheme: "pink" },
};

// --- Component หลักของ Layout Manager ---
export default function MenuLayoutManager({ isOpen, onClose, onSaved }) {
  const {
    zones,
    isLoading,
    isSaving,
    activeId,
    editingZoneId, setEditingZoneId,
    zoneNameInput, setZoneNameInput,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleSave,
    handleAddZone,
    handleRemoveZone,
    saveZoneName,
    getMissingMenus,
    handleAddMissingMenu,
    handleRemoveMenu
  } = useMenuDragAndDrop(isOpen, onSaved, onClose, AVAILABLE_MENUS);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-50 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              ตั้งค่าการจัดเรียงแผงเมนู (Layout Manager)
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-1">สามารถลากวาง (Drag & Drop) เพื่อย้ายตำแหน่ง หรือซ่อนเมนูที่ไม่ต้องการได้</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={isSaving} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
          
          <MenuLayoutGuide />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Loader2 size={32} className="animate-spin mb-4" />
              <span className="font-bold">กำลังโหลดโครงสร้าง...</span>
            </div>
          ) : (
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {zones.map((zone) => (
                  <MenuLayoutZone 
                    key={zone.id}
                    zone={zone}
                    editingZoneId={editingZoneId}
                    setEditingZoneId={setEditingZoneId}
                    zoneNameInput={zoneNameInput}
                    setZoneNameInput={setZoneNameInput}
                    saveZoneName={saveZoneName}
                    handleRemoveZone={handleRemoveZone}
                    handleRemoveMenu={handleRemoveMenu}
                    handleAddMissingMenu={handleAddMissingMenu}
                    getMissingMenus={getMissingMenus}
                  />
                ))}

                {/* Add New Zone Button */}
                <button 
                  onClick={handleAddZone}
                  className="flex flex-col items-center justify-center gap-2 bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-xl p-6 text-slate-500 hover:text-blue-600 transition-colors h-[200px]"
                >
                  <Plus size={32} />
                  <span className="font-bold text-sm">สร้างโซนใหม่ (Zone)</span>
                </button>

              </div>

              {/* Drag Overlay for smooth animation */}
              <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }) }}>
                {activeId ? (
                  <div className="bg-white border-2 border-blue-500 shadow-xl rounded-lg p-3 opacity-90 scale-105">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                       <GripVertical size={16} className="text-slate-400" /> กำลังลากเมนู...
                    </span>
                  </div>
                ) : null}
              </DragOverlay>

            </DndContext>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-end shrink-0 gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all shadow-sm disabled:opacity-50 active:scale-95"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />}
            บันทึกเลย์เอาต์
          </button>
        </div>

      </div>
    </div>
  );
}
