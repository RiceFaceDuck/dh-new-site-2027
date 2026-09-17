import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, CheckSquare, Layers, Users, CreditCard, Settings, Command } from 'lucide-react';

const MENU_ITEMS = [
  { id: 'search', label: 'ค้นหาสินค้า (Search)', icon: <Search size={16} />, path: '/search' },
  { id: 'billing', label: 'ระบบบิล (Billing)', icon: <ShoppingCart size={16} />, path: '/billing' },
  { id: 'todo', label: 'งานที่ต้องทำ (To-do)', icon: <CheckSquare size={16} />, path: '/todo' },
  { id: 'inventory', label: 'คลังสินค้า (Inventory)', icon: <Layers size={16} />, path: '/inventory' },
  { id: 'customers', label: 'ลูกค้า (Customers)', icon: <Users size={16} />, path: '/customers' },
  { id: 'credit', label: 'เครดิต & พอยท์ (Credit Points)', icon: <CreditCard size={16} />, path: '/managers/credit' },
  { id: 'settings', label: 'ตั้งค่าระบบ (Settings)', icon: <Settings size={16} />, path: '/managers' }
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') { setIsOpen(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let timer;
    if (isOpen) { timer = setTimeout(() => inputRef.current?.focus(), 10); }
    return () => timer && clearTimeout(timer);
  }, [isOpen]);

  const filteredItems = MENU_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => { navigate(path); setIsOpen(false); };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4"
      onKeyDown={(e) => {
        if (!isOpen) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((prev) => (prev + 1) % filteredItems.length); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length); }
        else if (e.key === 'Enter') { e.preventDefault(); if (filteredItems[selectedIndex]) handleSelect(filteredItems[selectedIndex].path); }
      }}
    >
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search size={18} className="text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm font-medium"
            placeholder="ค้นหาเมนู หรือกดลูกศรเลื่อนดู..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          />
          <div className="flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-mono border border-slate-200">
            <kbd>ESC</kbd>
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-500 text-sm">ไม่พบเมนู "{query}"</div>
          ) : (
            filteredItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.path)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  selectedIndex === idx ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' : 'text-slate-700 hover:bg-slate-50 border-l-2 border-transparent'
                }`}
              >
                <span className={`mr-3 ${selectedIndex === idx ? 'text-blue-500' : 'text-slate-400'}`}>{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))
          )}
        </div>
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1"><Command size={12} /> Command Palette</span>
        </div>
      </div>
    </div>
  );
}
