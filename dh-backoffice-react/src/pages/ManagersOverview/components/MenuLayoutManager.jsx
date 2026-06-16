import React, { useState, useEffect } from 'react';
import { 
  X, Save, Plus, GripVertical, Trash2, Edit2, Loader2
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { menuConfigService } from '../../../firebase/menuConfigService';

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
  banner: { title: "แบนเนอร์โฆษณา", iconName: "Megaphone", colorTheme: "rose", isComingSoon: true },
  seo: { title: "SEO & ค้นหา", iconName: "Search", colorTheme: "blue", isComingSoon: true },
  apikey: { title: "API Keys", iconName: "Code", colorTheme: "cyan", isComingSoon: true },
  privacy: { title: "Privacy & Cookies", iconName: "ShieldCheck", colorTheme: "emerald", isComingSoon: true },
  error404: { title: "หน้า 404 Error", iconName: "AlertTriangle", colorTheme: "amber", isComingSoon: true },
  redirect: { title: "Redirect URLs", iconName: "ArrowRightLeft", colorTheme: "indigo", isComingSoon: true },
  script: { title: "Custom Scripts", iconName: "Code2", colorTheme: "slate", isComingSoon: true },
  security: { title: "Security & Block", iconName: "ShieldBan", colorTheme: "red", isComingSoon: true },
  maintenance: { title: "ปิดปรับปรุง", iconName: "HardHat", colorTheme: "orange", isComingSoon: true },
};

// --- Component สำหรับลากวางไอเท็มเมนู ---
const SortableMenuItem = ({ id, menuId }) => {
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

// --- Component หลักของ Layout Manager ---
export default function MenuLayoutManager({ isOpen, onClose, onSaved }) {
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);
  
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [zoneNameInput, setZoneNameInput] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    const layout = await menuConfigService.getMenuLayout();
    
    const processedZones = layout.zones.map(z => ({
      ...z,
      items: z.menuIds.map(mId => ({ id: `${z.id}-${mId}`, menuId: mId }))
    }));
    
    setZones(processedZones);
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const finalLayout = {
      zones: zones.map(z => ({
        id: z.id,
        title: z.title,
        menuIds: z.items.map(item => item.menuId)
      }))
    };
    
    const res = await menuConfigService.updateMenuLayout(finalLayout);
    setIsSaving(false);
    
    if (res.success) {
      if (onSaved) onSaved(finalLayout);
      onClose();
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึก: " + res.error);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id) || over.id; 

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setZones((prev) => {
      const activeItems = prev.find((z) => z.id === activeContainer).items;
      const overItems = prev.find((z) => z.id === overContainer).items;
      const activeIndex = activeItems.findIndex((item) => item.id === active.id);
      const overIndex = over.id in prev.map(z => z.id) 
        ? overItems.length + 1 
        : overItems.findIndex((item) => item.id === over.id);

      let newIndex = overIndex >= 0 ? overIndex : overItems.length + 1;

      return prev.map((z) => {
        if (z.id === activeContainer) {
          return { ...z, items: z.items.filter((item) => item.id !== active.id) };
        }
        if (z.id === overContainer) {
          const newItems = [...z.items];
          newItems.splice(newIndex, 0, activeItems[activeIndex]);
          newItems[newIndex] = { ...newItems[newIndex], id: `${overContainer}-${newItems[newIndex].menuId}` };
          return { ...z, items: newItems };
        }
        return z;
      });
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id) || over.id;

    if (activeContainer && overContainer && activeContainer === overContainer) {
      const containerIndex = zones.findIndex(z => z.id === activeContainer);
      const items = zones[containerIndex].items;
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);

      if (oldIndex !== newIndex) {
        setZones(prev => {
          const newZones = [...prev];
          newZones[containerIndex] = {
            ...newZones[containerIndex],
            items: arrayMove(items, oldIndex, newIndex)
          };
          return newZones;
        });
      }
    }
  };

  const findContainer = (id) => {
    if (zones.find(z => z.id === id)) return id; 
    const zone = zones.find(z => z.items.some(item => item.id === id));
    return zone ? zone.id : null;
  };

  const handleAddZone = () => {
    const newId = `zone-${Date.now()}`;
    setZones([...zones, { id: newId, title: "โซนใหม่", items: [] }]);
    setEditingZoneId(newId);
    setZoneNameInput("โซนใหม่");
  };

  const handleRemoveZone = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    if (zone && zone.items.length > 0) {
      alert("ไม่สามารถลบโซนที่มีเมนูอยู่ได้ กรุณาย้ายเมนูออกก่อน");
      return;
    }
    setZones(zones.filter(z => z.id !== zoneId));
  };

  const saveZoneName = (zoneId) => {
    setZones(zones.map(z => z.id === zoneId ? { ...z, title: zoneNameInput } : z));
    setEditingZoneId(null);
  };

  const getMissingMenus = () => {
    const usedMenuIds = zones.flatMap(z => z.items.map(i => i.menuId));
    return Object.keys(AVAILABLE_MENUS).filter(mId => !usedMenuIds.includes(mId));
  };

  const handleAddMissingMenu = (menuId, zoneId) => {
    setZones(zones.map(z => {
      if (z.id === zoneId) {
        return { ...z, items: [...z.items, { id: `${zoneId}-${menuId}`, menuId }] };
      }
      return z;
    }));
  };

  const handleRemoveMenu = (menuId, zoneId) => {
    setZones(zones.map(z => {
      if(z.id === zoneId) {
        return { ...z, items: z.items.filter(i => i.menuId !== menuId) };
      }
      return z;
    }));
  };

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
                  <div key={zone.id} className="bg-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col">
                    
                    {/* Zone Header */}
                    <div className="flex justify-between items-center mb-4">
                      {editingZoneId === zone.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <input 
                            type="text" 
                            value={zoneNameInput} 
                            onChange={(e) => setZoneNameInput(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm font-bold rounded border-2 border-blue-500 outline-none"
                            autoFocus
                          />
                          <button onClick={() => saveZoneName(zone.id)} className="p-1 bg-blue-500 text-white rounded"><Save size={14}/></button>
                        </div>
                      ) : (
                        <h3 className="font-black text-slate-700 text-sm flex items-center gap-2">
                          {zone.title}
                          <button onClick={() => { setEditingZoneId(zone.id); setZoneNameInput(zone.title); }} className="text-slate-400 hover:text-blue-500">
                            <Edit2 size={12} />
                          </button>
                        </h3>
                      )}
                      
                      {!editingZoneId && (
                        <button onClick={() => handleRemoveZone(zone.id)} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Zone Items (Droppable Area) */}
                    <SortableContext id={zone.id} items={zone.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      <div className="flex-1 min-h-[100px] bg-slate-50/50 rounded-lg p-2 border-2 border-dashed border-slate-200">
                        {zone.items.map((item) => (
                          <div key={item.id} className="relative group">
                            <SortableMenuItem id={item.id} menuId={item.menuId} />
                            {/* ปุ่มลบเมนูออกจาก Zone นี้ (จะโผล่ตอน hover) */}
                            <button 
                              onClick={() => handleRemoveMenu(item.menuId, zone.id)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-100 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                              title="ซ่อนเมนูนี้"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {zone.items.length === 0 && (
                          <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">
                            ลากเมนูมาวางที่นี่
                          </div>
                        )}
                      </div>
                    </SortableContext>
                    
                    {/* Add Missing Menu Dropdown */}
                    <div className="mt-3">
                      <select 
                        className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-lg text-slate-600 outline-none hover:border-blue-400"
                        onChange={(e) => {
                          if(e.target.value) {
                            handleAddMissingMenu(e.target.value, zone.id);
                            e.target.value = "";
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>+ ดึงเมนูที่ถูกซ่อนเข้ามาในโซนนี้</option>
                        {getMissingMenus().map(mId => (
                          <option key={mId} value={mId}>{AVAILABLE_MENUS[mId].title}</option>
                        ))}
                      </select>
                    </div>

                  </div>
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
