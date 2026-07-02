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
  vip: { title: "ลูกค้า VIP", subtitle: "จัดการระดับและสิทธิพิเศษ", iconName: "Crown", colorTheme: "amber" },
  staff: { title: "จัดการพนักงาน", subtitle: "กำหนดสิทธิ์และอนุมัติบัญชี", iconName: "Users", colorTheme: "orange" },
  scanner: { title: "เปิดจุดลงเวลา (QR)", subtitle: "ให้พนักงานสแกน", iconName: "Scan", colorTheme: "emerald" },
  rbac: { title: "จัดการสิทธิ์ (RBAC)", subtitle: "ตั้งค่าสิทธิ์แยกตามตำแหน่ง", iconName: "ShieldCheck", colorTheme: "red" },
  buffer: { title: "บัฟเฟอร์คลังสินค้า", subtitle: "ตั้งค่าสต๊อคสำรองกันของขาด", iconName: "Box", colorTheme: "rose" },
  category: { title: "จัดการหมวดหมู่หน้าแรก", subtitle: "จัดเรียงโซนสินค้าบนหน้าเว็บ", iconName: "LayoutTemplate", colorTheme: "emerald" },
  regex: { title: "กฎความถูกต้องลิงก์", subtitle: "กำหนดเงื่อนไขการรับข้อมูล", iconName: "LinkIcon", colorTheme: "sky" },
  warranty: { title: "กติกาการรับประกัน", subtitle: "ข้อกำหนดและระยะเวลาประกัน", iconName: "ShieldCheck", colorTheme: "amber" },
  ads_config: { title: "ตั้งค่าพื้นที่โฆษณา", subtitle: "ตำแหน่งป้ายแบนเนอร์", iconName: "Megaphone", colorTheme: "indigo" },
  theme: { title: "ธีมและพื้นหลัง", subtitle: "รูปแบบสีและภาพแบ็คกราวนด์", iconName: "ImageIcon", colorTheme: "fuchsia" },
  knowledge: { title: "ระบบความรู้เพิ่มเติม", subtitle: "คลังบทความและคู่มือ", iconName: "BookOpen", colorTheme: "blue" },
  footer: { title: "ตั้งค่าพื้นที่ส่วนล่าง", subtitle: "แก้ไขข้อมูลติดต่อส่วนท้ายเว็บ", iconName: "LayoutPanelTop", colorTheme: "indigo" },
  pricing: { title: "นโยบายราคาปลีก", subtitle: "กำหนดสูตรคำนวณราคาขาย", iconName: "Calculator", colorTheme: "emerald" },
  history: { title: "ประวัติระบบ", subtitle: "ตรวจสอบบันทึกการทำงาน", iconName: "History", colorTheme: "purple" },
  email: { title: "อีเมลบริษัท", subtitle: "ตั้งค่าเมลเซิร์ฟเวอร์", iconName: "Mail", colorTheme: "blue" },
  drive: { title: "จัดการ Google Drive", subtitle: "พื้นที่จัดเก็บรูปภาพและไฟล์", iconName: "CloudUpload", colorTheme: "cyan" },
  ads: { title: "Ads Manager", subtitle: "ดูสถิติและจัดการโฆษณา", iconName: "Megaphone", colorTheme: "rose" },
  credit: { title: "Credit Point", subtitle: "ระบบแต้มและเครดิตเงินคืน", iconName: "CreditCard", colorTheme: "indigo" },
  inventory_adjustment: { title: "จัดการสต๊อคกรณีพิเศษ", subtitle: "ปรับปรุงยอดสินค้าคงคลัง", iconName: "ShieldAlert", colorTheme: "orange" },
  banner: { title: "แบนเนอร์โฆษณา", subtitle: "ระบบจัดการป้ายโปรโมชัน", iconName: "Megaphone", colorTheme: "rose", isComingSoon: true },
  seo: { title: "SEO & ค้นหา", subtitle: "ปรับแต่งเพื่อติดหน้าแรก Google", iconName: "Search", colorTheme: "blue", isComingSoon: true },
  apikey: { title: "API Keys", subtitle: "จัดการคีย์สำหรับเชื่อมต่อ", iconName: "Code", colorTheme: "cyan", isComingSoon: true },
  privacy: { title: "Privacy & Cookies", subtitle: "นโยบายข้อมูลส่วนบุคคล", iconName: "ShieldCheck", colorTheme: "emerald" },
  error404: { title: "หน้า 404 Error", subtitle: "ตั้งค่าหน้าเมื่อไม่พบข้อมูล", iconName: "AlertTriangle", colorTheme: "amber", isComingSoon: true },
  redirect: { title: "Redirect URLs", subtitle: "เปลี่ยนเส้นทางลิงก์เสีย", iconName: "ArrowRightLeft", colorTheme: "indigo" },
  script: { title: "Custom Scripts", subtitle: "วางโค้ด Tracking ภายนอก", iconName: "Code2", colorTheme: "slate", isComingSoon: true },
  security: { title: "Security & Block", subtitle: "ตั้งค่าการบล็อกและแบน", iconName: "ShieldBan", colorTheme: "red", isComingSoon: true },
  maintenance: { title: "ปิดปรับปรุง", subtitle: "เปิดโหมดซ่อมบำรุงเว็บไซต์", iconName: "HardHat", colorTheme: "orange", isComingSoon: true },
  promotions: { title: "โปรโมชั่น", subtitle: "ตั้งค่าส่วนลดและช่วงเวลา", iconName: "Tags", colorTheme: "fuchsia" },
  freebie: { title: "ของแถม", subtitle: "จัดการรายการสินค้าสมนาคุณ", iconName: "Gift", colorTheme: "pink" },
  refund: { title: "จัดการรับเรื่องคืนเงิน", subtitle: "พิจารณาคำขอคืนเงินลูกค้า", iconName: "Wallet", colorTheme: "emerald" },
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
