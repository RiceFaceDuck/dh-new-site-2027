import { useState, useEffect } from 'react';
import { auth } from '../../../firebase/config';
import { userService } from '../../../firebase/userService';
import { pricingService } from '../../../firebase/pricingService';
import { settingsService } from '../../../firebase/settingsService';

export const INITIAL_FORM = {
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

export const DEFAULT_CATEGORIES = ['Screen', 'Battery', 'Keyboard', 'Adapter', 'Hinge', 'Cable', 'Cooling Fan', 'Other'];

export default function useProductForm(productData, isOpen) {
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
