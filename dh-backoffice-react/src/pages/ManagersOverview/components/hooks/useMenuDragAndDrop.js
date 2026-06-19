import { useState, useEffect } from 'react';
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { menuConfigService } from '../../../../firebase/menuConfigService';

export function useMenuDragAndDrop(isOpen, onSaved, onClose, availableMenus) {
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

  const findContainer = (id) => {
    if (zones.find(z => z.id === id)) return id; 
    const zone = zones.find(z => z.items.some(item => item.id === id));
    return zone ? zone.id : null;
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
    return Object.keys(availableMenus).filter(mId => !usedMenuIds.includes(mId));
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

  return {
    zones, setZones,
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
  };
}
