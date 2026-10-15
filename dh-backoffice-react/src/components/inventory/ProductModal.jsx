import { X, Save, Trash2, Loader2 } from 'lucide-react';
import { auth } from '../../firebase/config';
import { todoService } from '../../firebase/todoService';
import toast from 'react-hot-toast';

import ProductImageUpload from './modal/ProductImageUpload';
import ProductBasicInfo from './modal/ProductBasicInfo';
import ProductLinks from './modal/ProductLinks';
import ProductPricingStock from './modal/ProductPricingStock';
import ProductVariants from './modal/ProductVariants';
import ProductTags from './modal/ProductTags';
import useProductForm from './hooks/useProductForm';

export default function ProductModal({ isOpen, onClose, onSave, productData, globalBufferStock = 2, categoriesData }) {
  const {
    form, setForm,
    isUploading, setIsUploading,
    isImageHealing,
    uploadProgress, setUploadProgress,
    activeImageUrl, setActiveImageUrl,
    categories,
    isAutoCalc, setIsAutoCalc,
    linkValidation,
    isManagerOrOwner,
    handlePriceChange,
    handleCategoryChange,
    handleAddCategory,
    addArrayItem,
    removeArrayItem,
    handleLinkChange
  } = useProductForm(productData, isOpen, categoriesData);

  const handleRequestDelete = async () => {
    if (!productData) return;
    const confirmMsg = `ยืนยันการขออนุมัติลบสินค้า ${form.sku} ใช่หรือไม่?\nข้อมูลจะไม่หายไปทันที แต่จะถูกส่งไปให้ผู้จัดการอนุมัติ`;
    if (window.confirm(confirmMsg)) {
      try {
        await todoService.requestProductDeletion(form, auth.currentUser.uid);
        toast.success('ส่งคำร้องขออนุมัติลบสำเร็จ แจ้งเตือนไปยังผู้จัดการแล้ว');
        onClose();
      } catch (error) {
        console.error('🔥 Error:', error);
        toast.error(error?.message || 'เกิดข้อผิดพลาด');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...form };
    const rawBuffer = dataToSave.bufferStock;
    if (rawBuffer === '' || rawBuffer === null || rawBuffer === undefined) {
      dataToSave.bufferStock = null; 
    } else {
      const num = Number(rawBuffer);
      dataToSave.bufferStock = !Number.isNaN(num) ? Math.max(0, Math.floor(num)) : null;
    }
    
    // 🛡️ Description Parity: Ensure fullDescription and description stay in sync
    const resolvedDesc = dataToSave.description || dataToSave.fullDescription || '';
    dataToSave.description = resolvedDesc;
    dataToSave.fullDescription = resolvedDesc;

    // 🛡️ Strip synthetic UI fields before passing to onSave
    delete dataToSave.sales30D;
    delete dataToSave.stockIn30D;
    delete dataToSave.claims30D;
    delete dataToSave.adjustment30D;
    delete dataToSave.stats;
    delete dataToSave.totalSold;
    delete dataToSave.id;

    // Create randomSeed only for new product (avoid breaking Smart Write diff on updates)
    if (!productData && !dataToSave.randomSeed) {
      dataToSave.randomSeed = Math.random();
    }

    onSave(dataToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2px] shadow-2xl shadow-slate-900/30 border border-slate-300 dark:border-slate-700 w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 dark:bg-orange-500"></div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {productData ? '✏️ แก้ไขข้อมูลสินค้า' : '📦 เพิ่มสินค้าใหม่'}
          </h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer group select-none">
              <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md border transition-colors ${form.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}>
                {form.isActive ? 'เปิดขาย' : 'ซ่อนสินค้า'}
              </span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
                <div className={`block w-11 h-6 rounded-full transition-colors border-2 ${form.isActive ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-300 dark:bg-slate-600 border-slate-400 dark:border-slate-500'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${form.isActive ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700"></div>
            <button type="button" onClick={onClose} className="p-1.5 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white rounded-lg border border-slate-300 dark:border-slate-600 transition-colors shadow-xs outline-hidden cursor-pointer" title="ปิดหน้าต่าง"><X size={20}/></button>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 custom-scrollbar flex-1 text-slate-800 dark:text-slate-100">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Section 1: รูปภาพและพื้นฐาน */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 flex flex-col gap-3">
                <ProductImageUpload
                  form={form} setForm={setForm}
                  activeImageUrl={activeImageUrl} setActiveImageUrl={setActiveImageUrl}
                  isUploading={isUploading} setIsUploading={setIsUploading}
                  uploadProgress={uploadProgress} setUploadProgress={setUploadProgress}
                />
              </div>

              <div className="lg:col-span-7 flex flex-col gap-4">
                <ProductBasicInfo
                  form={form} setForm={setForm}
                  productData={productData}
                  categories={categories}
                  isManagerOrOwner={isManagerOrOwner}
                  handleCategoryChange={handleCategoryChange}
                  handleAddCategory={handleAddCategory}
                  addArrayItem={addArrayItem}
                  removeArrayItem={removeArrayItem}
                />
              </div>
            </div>

            {/* Links Section */}
            <ProductLinks 
              form={form} 
              handleLinkChange={handleLinkChange} 
              linkValidation={linkValidation} 
            />

            {/* Pricing & Stock Section */}
            <ProductPricingStock
              form={form} setForm={setForm}
              isAutoCalc={isAutoCalc} setIsAutoCalc={setIsAutoCalc}
              handlePriceChange={handlePriceChange}
              isManagerOrOwner={isManagerOrOwner}
              globalBufferStock={globalBufferStock}
            />

            {/* Product Variants Section */}
            <ProductVariants form={form} setForm={setForm} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProductTags form={form} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dh-border bg-dh-surface flex justify-between items-center shrink-0">
          <div>
            {productData && (
              <button 
                type="button" 
                onClick={handleRequestDelete}
                className="px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 font-bold rounded-xl border-2 border-red-700 hover:border-red-800 transition-all flex items-center gap-2 text-sm shadow-sm cursor-pointer active:scale-95"
              >
                <Trash2 size={16} /> ขออนุมัติลบสินค้า
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isUploading || isImageHealing} className="px-6 py-2.5 text-slate-800 dark:text-slate-100 font-bold rounded-xl bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm shadow-sm disabled:opacity-50 cursor-pointer active:scale-95">ยกเลิก</button>
            <button type="submit" form="productForm" disabled={isUploading || isImageHealing}
              className="px-8 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white rounded-xl font-bold border-2 border-slate-900 dark:border-orange-600 hover:border-slate-800 dark:hover:border-orange-500 flex items-center gap-2 shadow-md transition-transform active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {(isUploading || isImageHealing) ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>}
              {isUploading ? 'กำลังอัปโหลด...' : (isImageHealing ? 'กำลังโหลดรูปเดิม...' : 'บันทึกข้อมูล')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}