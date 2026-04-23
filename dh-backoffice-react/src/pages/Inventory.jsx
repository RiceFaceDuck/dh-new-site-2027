import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, FileSpreadsheet, Loader2, CalendarClock, Boxes } from 'lucide-react';
import ProductTable from '../components/inventory/ProductTable';
import ProductModal from '../components/inventory/ProductModal';
import { inventoryService } from '../firebase/inventoryService';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  const [salesPeriod, setSalesPeriod] = useState('30'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // ✨ ระบบจัดการหน้า Pagination
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_LIMIT = 20;

  // ✨ State เก็บค่า Global Buffer 
  const [globalBufferStock, setGlobalBufferStock] = useState(2);

  useEffect(() => {
    fetchInitialProducts();
  }, []);

  const fetchInitialProducts = async () => {
    setLoading(true);
    // ✨ ดึงข้อมูล Settings (Buffer) และ Products ขนานกันเพื่อความรวดเร็ว
    const [settingsResult, productsResult] = await Promise.all([
      inventoryService.getInventorySettings(),
      inventoryService.getPaginatedProducts(PAGE_LIMIT)
    ]);
    
    setGlobalBufferStock(settingsResult.defaultBufferStock !== undefined ? settingsResult.defaultBufferStock : 2);
    setProducts(productsResult.products);
    setLastVisibleDoc(productsResult.lastDoc);
    setHasMore(productsResult.products.length === PAGE_LIMIT);
    
    setLoading(false);
  };

  const loadMore = async () => {
    if (!lastVisibleDoc || loadingMore) return;
    setLoadingMore(true);
    
    const { products: newProducts, lastDoc } = await inventoryService.getPaginatedProducts(PAGE_LIMIT, lastVisibleDoc);
    
    setProducts([...products, ...newProducts]);
    setLastVisibleDoc(lastDoc);
    setHasMore(newProducts.length === PAGE_LIMIT);
    
    setLoadingMore(false);
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await inventoryService.updateProduct(productData.sku, productData);
        setProducts(products.map(p => p.sku === productData.sku ? productData : p));
      } else {
        await inventoryService.addProduct(productData);
        setProducts([productData, ...products]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  // ค้นหาและฟิลเตอร์แบบ Client-side
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10 sm:p-2 min-h-[calc(100vh-80px)] text-dh-main">
      
      {/* 🎨 Header Panel - ยุบรวม Title, Search, Filter และปุ่มกดไว้ในกล่องเดียวให้กระชับขีดสุด */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-dh-surface p-5 rounded-2xl shadow-dh-card border border-dh-border relative overflow-hidden">
        
        {/* Title Area */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-dh-accent-light rounded-xl flex items-center justify-center text-dh-accent border border-dh-accent/20 shrink-0">
            <Boxes size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none text-dh-main">Inventory</h1>
            <p className="text-dh-muted text-xs mt-1 font-medium">ระบบจัดการคลังสินค้า สต๊อก และราคาขาย</p>
          </div>
        </div>
        
        {/* Tools Area (Search, Filters, Buttons) */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          
          {/* Filter Category พร้อม Emoji นำสายตา */}
          <div className="flex items-center bg-dh-base border border-dh-border rounded-xl px-3 py-1.5 h-[40px] focus-within:border-dh-accent transition-colors">
            <Filter size={14} className="text-dh-muted mr-2 shrink-0" />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs bg-transparent outline-none text-dh-main font-bold cursor-pointer w-full appearance-none pr-2"
            >
              <option value="All">ทุกหมวดหมู่</option>
              <option value="Screen">💻 Screen (จอ)</option>
              <option value="Battery">🔋 Battery</option>
              <option value="Keyboard">⌨️ Keyboard</option>
              <option value="Adapter">🔌 Adapter</option>
              <option value="Hinge">⛓️ Hinge (บานพับ)</option>
            </select>
          </div>

          {/* Sales Period Filter */}
          <div className="flex items-center bg-dh-base border border-dh-border rounded-xl px-3 py-1.5 h-[40px] focus-within:border-dh-accent transition-colors hidden sm:flex">
            <CalendarClock size={14} className="text-dh-muted mr-2 shrink-0" />
            <select 
              value={salesPeriod}
              onChange={(e) => setSalesPeriod(e.target.value)}
              className="text-xs bg-transparent outline-none text-dh-main font-bold cursor-pointer w-full appearance-none pr-2"
            >
              <option value="7">สถิติ: 7 วัน</option>
              <option value="30">สถิติ: 30 วัน</option>
              <option value="90">สถิติ: 90 วัน</option>
              <option value="365">สถิติ: 1 ปี</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative group flex-1 md:flex-none">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dh-muted group-focus-within:text-dh-accent transition-colors">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="ค้นหา SKU, ชื่อรุ่น, Tags..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 h-[40px] bg-dh-base border border-dh-border rounded-xl w-full md:w-56 outline-none focus:ring-1 focus:ring-dh-accent focus:border-dh-accent transition-all font-medium text-xs text-dh-main placeholder:text-dh-muted"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 shrink-0">
            <button className="flex items-center justify-center gap-2 bg-dh-base text-dh-main border border-dh-border h-[40px] px-3 rounded-xl hover:bg-dh-border transition-all font-bold text-xs shadow-sm">
              <FileSpreadsheet size={14} />
              <span className="hidden xl:inline">Export</span>
            </button>
            <button 
              onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
              className="flex items-center justify-center gap-2 bg-dh-accent text-white h-[40px] px-4 rounded-xl hover:bg-dh-accent-hover transition-all font-bold shadow-sm active:scale-95 text-xs"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">เพิ่มสินค้าใหม่</span>
            </button>
          </div>

        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-[50vh]">
          <Loader2 className="w-10 h-10 animate-spin text-dh-accent mb-4" />
          <p className="text-dh-muted font-medium text-sm">กำลังโหลดคลังสินค้า...</p>
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Component ตารางสินค้า (จะเปลี่ยนสีตาม Theme ย่อยถ้ามีการอัปเกรด ProductTable) */}
          <div className="bg-dh-surface rounded-2xl shadow-dh-card border border-dh-border overflow-hidden">
            <ProductTable 
              products={filteredProducts} 
              salesPeriod={salesPeriod} 
              globalBufferStock={globalBufferStock}
              onEdit={(p) => { setEditingProduct(p); setIsModalOpen(true); }} 
            />
          </div>
          
          {/* ปุ่ม Load More เข้ากับ Theme */}
          {hasMore && !searchTerm && filterCategory === 'All' && (
            <div className="flex justify-center p-2">
              <button 
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full max-w-sm py-2 bg-dh-surface border border-dh-border text-dh-accent font-bold rounded-xl hover:bg-dh-accent-light hover:border-dh-accent/30 transition-all text-xs flex justify-center items-center gap-2 shadow-sm active:scale-95"
              >
                {loadingMore ? <Loader2 className="animate-spin w-4 h-4" /> : <Boxes size={14} />}
                {loadingMore ? 'กำลังโหลดข้อมูล...' : 'โหลดข้อมูลสินค้าเพิ่มเติม'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveProduct} 
        productData={editingProduct} 
        globalBufferStock={globalBufferStock}
      />
    </div>
  );
}