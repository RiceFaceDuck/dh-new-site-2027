import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Loader2 } from 'lucide-react';
import { auth } from '../../firebase/config';
import { userService } from '../../firebase/userService';
import { pricingService } from '../../firebase/pricingService';
import { todoService } from '../../firebase/todoService';
import { settingsService } from '../../firebase/settingsService';

import ProductImageUpload from './modal/ProductImageUpload';
import ProductBasicInfo from './modal/ProductBasicInfo';
import ProductLinks from './modal/ProductLinks';
import ProductPricingStock from './modal/ProductPricingStock';
import ProductTags from './modal/ProductTags';

const INITIAL_FORM = {
  sku: '', name: '', brand: '', category: 'Screen', unit: 'ชิ้น',
  Price: 0, retailPrice: 0,
  stockQuantity: 0, bufferStock: '', warehouseLocation: '',
  images: [], 
  compatibleModels: [], compatiblePartNumbers: [], 
  sellingModel: '', 
  substituteSkus: [], 
  landingPageUrl: '', 
  shortDescription: '', description: '',
  packageSize: { w: '', l: '', h: '' },
  tags: [], comment: '', internalComments: [],
  isActive: true,
  externalLinks: { shopee: '', lazada: '', tiktok: '', facebook: '' } 
};

const DEFAULT_CATEGORIES = ['Screen', 'Battery', 'Keyboard', 'Adapter', 'Hinge', 'Cable', 'Cooling Fan', 'Other'];

export default function ProductModal({ isOpen, onClose, onSave, productData, globalBufferStock = 2 }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeImageUrl, setActiveImageUrl] = useState('');

  const [userRole, setUserRole] = useState('Staff');
  const [pricingConfig, setPricingConfig] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isAutoCalc, setIsAutoCalc] = useState(true);

  const [platformRegex, setPlatformRegex] = useState(null);
  const [linkValidation, setLinkValidation] = useState({ shopee: null, lazada: null, tiktok: null, facebook: null });

  useEffect(() => {
    if (isOpen) {
      const initData = productData ? { ...INITIAL_FORM, ...productData } : INITIAL_FORM;
      if (!initData.externalLinks) initData.externalLinks = { shopee: '', lazada: '', tiktok: '', facebook: '' };
      if (!initData.substituteSkus) initData.substituteSkus = [];
      if (!initData.internalComments) initData.internalComments = [];
      if (!initData.sellingModel) initData.sellingModel = '';
      if (!initData.landingPageUrl) initData.landingPageUrl = '';
      
      setForm(initData);
      setIsUploading(false);
      setUploadProgress(0);
      setActiveImageUrl(initData.images?.[0] || '');
      setLinkValidation({ shopee: null, lazada: null, tiktok: null, facebook: null });
      
      checkUserRole();
      loadPricingConfig();
      loadPlatformRegex(); 
    }
  }, [isOpen, productData]);

  const checkUserRole = async () => {
    if (auth.currentUser) {
      const profile = await userService.getUserProfile(auth.currentUser.uid);
      if (profile) setUserRole(profile.role);
    }
  };

  const loadPricingConfig = async () => {
    const config = await pricingService.getPricingConfig();
    setPricingConfig(config);
  };

  const loadPlatformRegex = async () => {
    const regexRules = await settingsService.getPlatformRegex();
    setPlatformRegex(regexRules);
  };

  const isManagerOrOwner = ['Manager', 'Owner', 'manager', 'owner', 'admin', 'Admin', 'ผู้จัดการ', 'เจ้าของ', 'แอดมิน'].includes(userRole);

  const handlePriceChange = (val, field) => {
    const numVal = Number(val);
    let newForm = { ...form, [field]: numVal };

    if (field === 'Price' && isAutoCalc && pricingConfig) {
      const calc = pricingService.calculateRetailPrice(numVal, form.category, pricingConfig);
      newForm.retailPrice = calc.calculatedPrice;
    }
    setForm(newForm);
  };

  const handleCategoryChange = (val) => {
    let newForm = { ...form, category: val };
    if (isAutoCalc && pricingConfig && form.Price > 0) {
      const calc = pricingService.calculateRetailPrice(form.Price, val, pricingConfig);
      newForm.retailPrice = calc.calculatedPrice;
    }
    setForm(newForm);
  };

  const handleAddCategory = () => {
    const newCat = window.prompt('ระบุชื่อหมวดหมู่ใหม่ (ภาษาอังกฤษ):');
    if (newCat && !categories.includes(newCat)) {
      setCategories([...categories, newCat]);
      handleCategoryChange(newCat);
    }
  };

  const addArrayItem = (e, field, input, setInput) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const val = field === 'substituteSkus' ? input.trim().toUpperCase() : input.trim();
      if (!form[field].includes(val)) {
        setForm({ ...form, [field]: [...form[field], val] });
      }
      setInput('');
    }
  };

  const removeArrayItem = (field, item) => {
    setForm({ ...form, [field]: form[field].filter(i => i !== item) });
  };

  const handleLinkChange = (platform, value) => {
    setForm(prev => ({
      ...prev,
      externalLinks: { ...prev.externalLinks, [platform]: value }
    }));

    if (!value.trim()) {
      setLinkValidation(prev => ({ ...prev, [platform]: null }));
      return;
    }

    if (platformRegex && platformRegex[platform]) {
      try {
        const regex = new RegExp(platformRegex[platform], 'i');
        setLinkValidation(prev => ({ ...prev, [platform]: regex.test(value) }));
      } catch (err) {
        console.error(`Invalid Regex for ${platform}:`, err);
        setLinkValidation(prev => ({ ...prev, [platform]: false }));
      }
    }
  };

  const handleRequestDelete = async () => {
    if (!productData) return;
    const confirmMsg = `ยืนยันการขออนุมัติลบสินค้า ${form.sku} ใช่หรือไม่?\nข้อมูลจะไม่หายไปทันที แต่จะถูกส่งไปให้ผู้จัดการอนุมัติ`;
    if (window.confirm(confirmMsg)) {
      try {
        await todoService.requestProductDeletion(form, auth.currentUser.uid);
        alert('ส่งคำร้องขออนุมัติลบสำเร็จ แจ้งเตือนไปยังผู้จัดการแล้ว');
        onClose(); 
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการส่งคำร้อง: ' + error.message);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...form };
    if (dataToSave.bufferStock === '') {
      dataToSave.bufferStock = null; 
    } else {
      dataToSave.bufferStock = Number(dataToSave.bufferStock);
    }
    onSave(dataToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-dh-surface rounded-2xl shadow-dh-elevated border border-dh-border w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dh-border bg-dh-surface shrink-0 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-dh-accent"></div>
          <h2 className="text-xl font-black text-dh-main flex items-center gap-2">
            {productData ? '✏️ แก้ไขข้อมูลสินค้า' : '📦 เพิ่มสินค้าใหม่'}
          </h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className={`text-[11px] font-black uppercase tracking-wider transition-colors ${form.isActive ? 'text-green-500 dark:text-green-400' : 'text-dh-muted'}`}>
                {form.isActive ? 'เปิดขาย' : 'ซ่อนสินค้า'}
              </span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
                <div className={`block w-10 h-6 rounded-full transition-colors border border-dh-border shadow-inner ${form.isActive ? 'bg-green-500' : 'bg-dh-base'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${form.isActive ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
            <div className="w-px h-6 bg-dh-border"></div>
            <button type="button" onClick={onClose} className="p-1.5 text-dh-muted hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors outline-none"><X size={20}/></button>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-6 overflow-y-auto bg-dh-base/50 custom-scrollbar flex-1 text-dh-main">
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
                className="px-4 py-2.5 text-red-500 bg-red-500/10 font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 text-sm shadow-sm"
              >
                <Trash2 size={16} /> ขออนุมัติลบสินค้า
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isUploading} className="px-6 py-2.5 text-dh-main font-bold rounded-xl bg-dh-base border border-dh-border hover:bg-dh-border transition-colors text-sm shadow-sm disabled:opacity-50">ยกเลิก</button>
            <button type="submit" form="productForm" disabled={isUploading}
              className="px-8 py-2.5 bg-dh-accent text-white rounded-xl font-bold hover:bg-dh-accent-hover flex items-center gap-2 shadow-sm transition-transform active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>}
              {isUploading ? 'กำลังอัปโหลด...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}