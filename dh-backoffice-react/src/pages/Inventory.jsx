import React, { useState, useEffect } from 'react';
import { Loader2, Boxes } from 'lucide-react';
import ProductTable from '../components/inventory/ProductTable';
import ProductModal from '../components/inventory/ProductModal';
import InventoryHeader from '../components/inventory/InventoryHeader';
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

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10 sm:p-2 min-h-[calc(100vh-80px)] text-dh-main">
      
      {/* 🎨 Header Panel แบบแยก Component เรียบร้อย */}
      <InventoryHeader 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
        salesPeriod={salesPeriod} setSalesPeriod={setSalesPeriod}
        onAddProduct={handleAddProduct}
      />

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