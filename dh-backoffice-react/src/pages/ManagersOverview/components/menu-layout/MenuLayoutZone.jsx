import React from 'react';
import { Save, Edit2, Trash2, X } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableMenuItem } from '../SortableMenuItem';
import { AVAILABLE_MENUS } from '../MenuLayoutManager';

export default function MenuLayoutZone({
  zone,
  editingZoneId,
  setEditingZoneId,
  zoneNameInput,
  setZoneNameInput,
  saveZoneName,
  handleRemoveZone,
  handleRemoveMenu,
  handleAddMissingMenu,
  getMissingMenus
}) {
  return (
    <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col">
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
            <option key={mId} value={mId}>{AVAILABLE_MENUS[mId]?.title}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
