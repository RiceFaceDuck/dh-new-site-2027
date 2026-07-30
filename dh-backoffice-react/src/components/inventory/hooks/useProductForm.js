import { useState, useEffect } from 'react';
import { auth } from '../../../firebase/config';
import { userService } from '../../../firebase/userService';
import { pricingService } from '../../../firebase/pricingService';
import { settingsService } from '../../../firebase/settingsService';
import { categoryService } from '../../../firebase/categoryService';
import { normalizeCategoryName } from '../../../firebase/warrantyService';
import toast from 'react-hot-toast';

export const INITIAL_FORM = {
  sku: '', name: '', brand: '', category: 'Screen', unit: 'ชิ้น',
  Price: 0, retailPrice: 0,
  stockQuantity: 0, bufferStock: '', warehouseLocation: '',
  images: [], hiddenImages: [],
  compatibleModels: [], compatiblePartNumbers: [], 
  sellingModel: '', 
  substituteSkus: [], 
  landingPageUrl: '', 
  shortDescription: '', description: '',
  packageSize: { w: '', l: '', h: '' },
  tags: [], comment: '', internalComments: [],
  isActive: true,
  externalLinks: { shopee: '', lazada: '', tiktok: '', facebook: '' },
  variantOptions: [], // e.g., [{ name: 'สี', values: ['แดง', 'ดำ'] }]
  variants: [] // e.g., [{ id: '1', attributes: { สี: 'แดง' }, sku: 'SKU-R', retailPrice: 100, stockQuantity: 5 }]
};

export const DEFAULT_CATEGORIES = [
  { name: 'Cooling', type: 'Cooling' },
  { name: 'FAN', type: 'FAN' },
  { name: 'Panel', type: 'Panel' },
  { name: 'Screen', type: 'Screen' },
  { name: 'Adapter', type: 'Adapter' },
  { name: 'Battery', type: 'Battery' },
  { name: 'Keyboard', type: 'Keyboard' },
  { name: 'Cable', type: 'Cable' },
  { name: 'General', type: 'General' },
  { name: 'ลำโพง', type: 'ลำโพง' },
  { name: 'หน้าจอ', type: 'หน้าจอ' }
];

export default function useProductForm(productData, isOpen, categoriesData = []) {
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
      if (!initData.hiddenImages) initData.hiddenImages = [];
      if (!initData.variantOptions) initData.variantOptions = [];
      if (!initData.variants) initData.variants = [];

      setForm(initData);
      setIsUploading(false);
      setUploadProgress(0);
      setActiveImageUrl(initData.images?.[0] || '');
      setLinkValidation({ shopee: null, lazada: null, tiktok: null, facebook: null });

      // 🚀 Aggregate ALL categories from defaults, DB, and product
      const catMap = new Map();
      
      // 1. Add Default core categories
      DEFAULT_CATEGORIES.forEach(c => {
        catMap.set(c.type.toLowerCase(), { id: c.type, name: c.name, type: c.type });
      });

      // 2. Add categoriesData (from database)
      if (categoriesData && categoriesData.length > 0) {
        categoriesData.forEach(c => {
          const val = c.type || c.name;
          if (val && typeof val === 'string' && val.trim()) {
            const cleanVal = val.trim();
            const key = cleanVal.toLowerCase();
            if (!catMap.has(key)) {
              catMap.set(key, { id: c.id || cleanVal, name: cleanVal, type: cleanVal });
            }
          }
        });
      }

      // 3. Add product's own category if missing
      if (initData.category && typeof initData.category === 'string' && initData.category.trim()) {
        const prodCat = initData.category.trim();
        const key = prodCat.toLowerCase();
        if (!catMap.has(key)) {
          catMap.set(key, { id: `prod_${prodCat}`, name: prodCat, type: prodCat });
        }
      }

      setCategories(Array.from(catMap.values()));
      
      checkUserRole();
      loadPricingConfig();
      loadPlatformRegex(); 
    }
  }, [isOpen, productData, categoriesData]);

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

  const handleAddCategory = async () => {
    const newCat = window.prompt('ระบุชื่อหมวดหมู่ใหม่ (ภาษาอังกฤษหรือไทยก็ได้):');
    if (!newCat || !newCat.trim()) return;
    
    const catName = newCat.trim();
    const existingCat = categories.find(c => 
      (c.name || '').trim().toLowerCase() === catName.toLowerCase() ||
      (c.type || '').trim().toLowerCase() === catName.toLowerCase()
    );

    if (existingCat) {
      const targetVal = existingCat.type || existingCat.name;
      handleCategoryChange(targetVal);
      toast.success(`เลือกหมวดหมู่ "${targetVal}" เรียบร้อยแล้ว`);
      return;
    }

    try {
      const loadingToast = toast.loading('กำลังบันทึกหมวดหมู่ใหม่...');
      
      const newCategoryData = { name: catName, type: catName, isActive: true };
      const savedDoc = await categoryService.createCategory(newCategoryData, null);
      
      const targetVal = savedDoc.type || savedDoc.name || catName;
      toast.success(`เพิ่มหมวดหมู่ "${targetVal}" สำเร็จ!`, { id: loadingToast });
      
      const newCatObj = { id: savedDoc.id, name: targetVal, type: targetVal };
      setCategories(prev => {
        if (prev.some(c => (c.type || c.name || '').toLowerCase() === targetVal.toLowerCase())) {
          return prev;
        }
        return [...prev, newCatObj];
      });
      handleCategoryChange(targetVal);
      
    } catch (err) {
      console.error('Error adding category:', err);
      toast.error(err?.message || 'เพิ่มหมวดหมู่ไม่สำเร็จ');
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

  return {
    form, setForm,
    isUploading, setIsUploading,
    uploadProgress, setUploadProgress,
    activeImageUrl, setActiveImageUrl,
    userRole,
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
  };
}
