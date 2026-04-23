import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertTriangle, Plus, Info, Shield, UploadCloud, Loader2, Star, Trash2, Link as LinkIcon, CheckCircle2, XCircle } from 'lucide-react';
import { auth } from '../../firebase/config';
import { userService } from '../../firebase/userService';
import { pricingService } from '../../firebase/pricingService';
import { driveService } from '../../firebase/driveService'; 
import { todoService } from '../../firebase/todoService';
import { settingsService } from '../../firebase/settingsService';

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
const DEFAULT_UNITS = ['ชิ้น', 'คู่ (L+R)', 'เมตร', 'แผ่น', 'ชุด', 'อื่นๆ'];

export default function ProductModal({ isOpen, onClose, onSave, productData, globalBufferStock = 2 }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [tagInput, setTagInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [partInput, setPartInput] = useState('');
  const [substituteInput, setSubstituteInput] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

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
      setTagInput(''); setModelInput(''); setPartInput(''); setSubstituteInput('');
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

  const isManagerOrOwner = ['Manager', 'Owner', 'ผู้จัดการ', 'เจ้าของ'].includes(userRole);

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

  const getRenderableImageUrl = (url) => {
    if (!url) return '';
    const match = url.match(/[-\w]{25,}/);
    if (url.includes('drive.google.com') && match) {
      return `https://lh3.googleusercontent.com/d/${match[0]}`;
    }
    return url;
  };

  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setIsUploading(true);
    let uploadedUrls = [];
    
    try {
      for (let i = 0; i < imageFiles.length; i++) {
        setUploadProgress(Math.round(((i) / imageFiles.length) * 100));
        const directLink = await driveService.uploadImage(imageFiles[i]);
        uploadedUrls.push(directLink);
      }
      
      setForm(prev => ({ 
        ...prev, 
        images: [...prev.images, ...uploadedUrls]
      }));

      if (!activeImageUrl && uploadedUrls.length > 0) {
        setActiveImageUrl(uploadedUrls[0]);
      }
      
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอัปโหลดภาพ: " + error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (indexToRemove, urlToRemove) => {
    setForm(prev => {
      const newImages = prev.images.filter((_, idx) => idx !== indexToRemove);
      if (activeImageUrl === urlToRemove) {
        setActiveImageUrl(newImages.length > 0 ? newImages[0] : '');
      }
      return { ...prev, images: newImages };
    });
  };

  const setCoverImage = (indexToCover) => {
    if (indexToCover === 0) return;
    setForm(prev => {
      const newImages = [...prev.images];
      const selected = newImages.splice(indexToCover, 1)[0];
      newImages.unshift(selected); 
      setActiveImageUrl(selected);
      return { ...prev, images: newImages };
    });
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

  const renderLinkInput = (platform, label, placeholder, colorClass) => {
    const isValid = linkValidation[platform];
    return (
      <div className="md:col-span-1">
        <label className="text-[10px] font-bold text-dh-muted uppercase flex items-center gap-1.5 mb-1.5">
          <LinkIcon size={12} className={colorClass} /> {label}
        </label>
        <div className="relative">
          <input 
            type="url" 
            value={form.externalLinks?.[platform] || ''} 
            onChange={e => handleLinkChange(platform, e.target.value)}
            placeholder={placeholder}
            className={`w-full p-2.5 pr-8 border rounded-xl outline-none text-sm transition-all font-medium placeholder:text-dh-muted/50 ${
              isValid === true ? 'border-green-500/50 focus:border-green-500 bg-green-500/5 text-green-700 dark:text-green-400' : 
              isValid === false ? 'border-red-500/50 focus:border-red-500 bg-red-500/5 text-red-600 dark:text-red-400' : 
              'border-dh-border focus:border-dh-accent bg-dh-base focus:bg-dh-surface text-dh-main'
            }`} 
          />
          {isValid === true && <CheckCircle2 size={16} className="absolute right-2.5 top-3 text-green-500" />}
          {isValid === false && <XCircle size={16} className="absolute right-2.5 top-3 text-red-500" />}
        </div>
      </div>
    );
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
              
              {/* ซ้าย: Gallery */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div 
                  className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden relative group transition-all cursor-pointer shadow-inner
                    ${isDragOver ? 'border-dh-accent bg-dh-accent-light/20' : 'border-dh-border bg-dh-base hover:bg-dh-surface'}
                  `}
                  onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                  onClick={() => !isUploading && fileInputRef.current.click()}
                >
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={e => handleFiles(e.target.files)} />
                  
                  {isUploading ? (
                    <div className="flex flex-col items-center text-dh-accent">
                      <Loader2 size={36} className="animate-spin mb-2" />
                      <span className="font-bold text-xs">กำลังเชื่อมต่อ Drive...</span>
                      <span className="text-[10px] font-mono mt-1">{uploadProgress}%</span>
                    </div>
                  ) : activeImageUrl ? (
                    <div className="w-full h-full relative bg-dh-surface">
                      <img src={getRenderableImageUrl(activeImageUrl)} alt="Active" className="w-full h-full object-contain" 
                           onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=Image+Error'; }} />
                      
                      {activeImageUrl === form.images[0] && (
                        <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm flex items-center gap-1 border border-yellow-500">
                          <Star size={12}/> ภาพปก
                        </div>
                      )}
                      <div className="absolute inset-0 bg-dh-main/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white font-bold text-sm flex items-center gap-2 bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                          <UploadCloud size={18}/> ลากภาพวางเพิ่ม
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-14 h-14 bg-dh-surface shadow-sm border border-dh-border rounded-full flex items-center justify-center mx-auto mb-3 text-dh-accent">
                        <UploadCloud size={24} />
                      </div>
                      <p className="font-bold text-sm">ลากไฟล์ภาพวางที่นี่</p>
                      <p className="text-[10px] text-dh-muted mt-1 uppercase tracking-wide">หรือคลิกเพื่อเลือกไฟล์</p>
                    </div>
                  )}
                </div>
                
                {form.images.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {form.images.map((imgUrl, idx) => (
                      <div key={idx} 
                           onClick={() => setActiveImageUrl(imgUrl)}
                           className={`aspect-square rounded-lg border-2 overflow-hidden relative group cursor-pointer transition-all bg-dh-base
                           ${activeImageUrl === imgUrl ? 'border-dh-accent shadow-sm scale-[1.02]' : 'border-dh-border hover:border-dh-accent/50'}`}>
                        
                        <img src={getRenderableImageUrl(imgUrl)} alt={`Thumb ${idx}`} className="w-full h-full object-cover" 
                             onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Err'; }} />
                        
                        {idx === 0 && <div className="absolute top-0 left-0 bg-yellow-400 text-white p-0.5 rounded-br-lg"><Star size={10}/></div>}
                        <div className="absolute inset-0 bg-dh-main/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 backdrop-blur-[1px]">
                          {idx !== 0 && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); setCoverImage(idx); }} className="p-1.5 bg-dh-surface text-yellow-500 rounded-full hover:bg-yellow-50 hover:text-yellow-600 shadow-sm transition-colors" title="ตั้งเป็นภาพปก"><Star size={12}/></button>
                          )}
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(idx, imgUrl); }} className="p-1.5 bg-dh-surface text-red-500 rounded-full hover:bg-red-50 hover:text-red-600 shadow-sm transition-colors" title="ลบภาพ"><Trash2 size={12}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ขวา: ข้อมูลหลัก */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                
                {/* แถวแรก ข้อมูลหลักๆ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-dh-surface p-4 rounded-2xl border border-dh-border shadow-sm">
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">SKU (รหัสสินค้า) *</label>
                    <input type="text" disabled={!!productData} required value={form.sku} 
                      onChange={e => setForm({...form, sku: e.target.value.toUpperCase()})}
                      className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none font-bold text-dh-main placeholder:text-dh-muted/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed uppercase" 
                      placeholder="เช่น SCR-001" />
                  </div>
                  
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">หมวดหมู่ *</label>
                    <div className="flex gap-2">
                      <select value={form.category} onChange={e => handleCategoryChange(e.target.value)}
                        className="w-full p-2.5 border border-dh-border rounded-xl outline-none focus:border-dh-accent bg-dh-base focus:bg-dh-surface text-sm font-bold text-dh-main transition-all cursor-pointer">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      {isManagerOrOwner && (
                        <button type="button" onClick={handleAddCategory} className="bg-dh-base border border-dh-border text-dh-muted px-3 rounded-xl hover:bg-dh-surface hover:text-dh-accent transition-colors shadow-sm" title="เพิ่มหมวดหมู่ใหม่">
                          <Plus size={16}/>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">แบรนด์</label>
                    <input type="text" value={form.brand} placeholder="เช่น ASUS, Acer"
                      onChange={e => setForm({...form, brand: e.target.value})}
                      className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none text-sm font-bold text-dh-main placeholder:text-dh-muted/50 transition-all" />
                  </div>
                  
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">ชื่อสินค้า (รุ่น/ชนิด) *</label>
                    <input type="text" required value={form.name} placeholder="ระบุชื่อสินค้าแบบชัดเจน..."
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none text-sm font-bold text-dh-main placeholder:text-dh-muted/50 transition-all" />
                  </div>
                </div>

                {/* ข้อมูลเชื่อมโยง */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dh-surface p-4 rounded-2xl border border-dh-border shadow-sm">
                  <div>
                    <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Model (ที่กำลังขายอยู่)</label>
                    <input type="text" value={form.sellingModel} placeholder="เช่น NV156FHM-N48"
                      onChange={e => setForm({...form, sellingModel: e.target.value})}
                      className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none text-sm font-bold text-dh-main placeholder:text-dh-muted/50 transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Landing Page URL (เว็บ)</label>
                    <input type="url" value={form.landingPageUrl} placeholder="https://www.dhnotebook.com/..."
                      onChange={e => setForm({...form, landingPageUrl: e.target.value})}
                      className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none text-sm font-bold text-dh-main placeholder:text-dh-muted/50 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-dh-surface p-4 rounded-2xl border border-dh-border shadow-sm">
                  <div>
                    <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Compatible Models</label>
                    <div className="flex flex-wrap gap-1.5 p-2 border border-dh-border rounded-xl min-h-[44px] bg-dh-base focus-within:bg-dh-surface focus-within:border-dh-accent transition-colors shadow-inner">
                      {form.compatibleModels.map(t => (
                        <span key={t} className="bg-dh-surface border border-dh-border text-dh-main text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                          {t} <X size={10} className="cursor-pointer text-dh-muted hover:text-red-500 transition-colors" onClick={() => removeArrayItem('compatibleModels', t)}/>
                        </span>
                      ))}
                      <input type="text" placeholder="พิมพ์รุ่นแล้วกด Enter..." value={modelInput}
                        onChange={e => setModelInput(e.target.value)} onKeyDown={(e) => addArrayItem(e, 'compatibleModels', modelInput, setModelInput)}
                        className="flex-1 outline-none text-xs bg-transparent min-w-[100px] text-dh-main placeholder:text-dh-muted/50" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Compatible Part Number</label>
                    <div className="flex flex-wrap gap-1.5 p-2 border border-dh-border rounded-xl min-h-[44px] bg-dh-base focus-within:bg-dh-surface focus-within:border-dh-accent transition-colors shadow-inner">
                      {form.compatiblePartNumbers.map(t => (
                        <span key={t} className="bg-dh-surface border border-dh-border text-dh-main text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                          {t} <X size={10} className="cursor-pointer text-dh-muted hover:text-red-500 transition-colors" onClick={() => removeArrayItem('compatiblePartNumbers', t)}/>
                        </span>
                      ))}
                      <input type="text" placeholder="พิมพ์ Part No. แล้ว Enter..." value={partInput}
                        onChange={e => setPartInput(e.target.value)} onKeyDown={(e) => addArrayItem(e, 'compatiblePartNumbers', partInput, setPartInput)}
                        className="flex-1 outline-none text-xs bg-transparent min-w-[100px] text-dh-main placeholder:text-dh-muted/50" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1 flex items-center gap-1"><AlertTriangle size={12}/> สินค้าขายแทนกัน (SKU)</label>
                    <div className="flex flex-wrap gap-1.5 p-2 border border-orange-500/30 bg-orange-500/5 rounded-xl min-h-[44px] focus-within:border-orange-500 transition-colors shadow-inner">
                      {form.substituteSkus.map(t => (
                        <span key={t} className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                          {t} <X size={10} className="cursor-pointer hover:text-orange-200 transition-colors" onClick={() => removeArrayItem('substituteSkus', t)}/>
                        </span>
                      ))}
                      <input type="text" placeholder="พิมพ์ SKU แล้ว Enter..." value={substituteInput}
                        onChange={e => setSubstituteInput(e.target.value)} onKeyDown={(e) => addArrayItem(e, 'substituteSkus', substituteInput, setSubstituteInput)}
                        className="flex-1 outline-none text-xs bg-transparent min-w-[100px] uppercase font-bold text-orange-600 dark:text-orange-400 placeholder:text-orange-500/50" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-dh-surface p-4 rounded-2xl border border-dh-border shadow-sm">
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Short Description (จุดเด่น)</label>
                    <input type="text" value={form.shortDescription} placeholder="คุณสมบัติเด่น 1-2 บรรทัด..."
                      onChange={e => setForm({...form, shortDescription: e.target.value})}
                      className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none text-sm font-bold text-dh-main placeholder:text-dh-muted/50 transition-all" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">ขนาดแพ็คเกจ (ซม.)</label>
                    <div className="flex gap-1.5">
                      <input type="number" placeholder="ก" value={form.packageSize?.w || ''} onChange={e => setForm({...form, packageSize:{...form.packageSize, w: e.target.value}})} className="w-1/3 p-2.5 border border-dh-border bg-dh-base focus:bg-dh-surface focus:border-dh-accent rounded-xl text-xs font-bold text-dh-main outline-none text-center transition-all" />
                      <input type="number" placeholder="ย" value={form.packageSize?.l || ''} onChange={e => setForm({...form, packageSize:{...form.packageSize, l: e.target.value}})} className="w-1/3 p-2.5 border border-dh-border bg-dh-base focus:bg-dh-surface focus:border-dh-accent rounded-xl text-xs font-bold text-dh-main outline-none text-center transition-all" />
                      <input type="number" placeholder="ส" value={form.packageSize?.h || ''} onChange={e => setForm({...form, packageSize:{...form.packageSize, h: e.target.value}})} className="w-1/3 p-2.5 border border-dh-border bg-dh-base focus:bg-dh-surface focus:border-dh-accent rounded-xl text-xs font-bold text-dh-main outline-none text-center transition-all" />
                    </div>
                  </div>
                  <div className="md:col-span-4 mt-2">
                    <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Full Description (รายละเอียดเชิงลึก)</label>
                    <textarea value={form.description} placeholder="ลงรายละเอียดสินค้าเพิ่มเติม..."
                      onChange={e => setForm({...form, description: e.target.value})}
                      className="w-full p-3 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface focus:border-dh-accent outline-none resize-none h-[88px] text-sm font-medium text-dh-main placeholder:text-dh-muted/50 transition-all custom-scrollbar" />
                  </div>
                </div>
              </div>
            </div>

            {/* Links Section */}
            <div className="bg-dh-surface p-5 rounded-2xl border border-dh-border shadow-sm">
              <h3 className="text-sm font-black text-dh-main mb-4 flex items-center gap-2">
                🌐 ลิงก์สินค้าภายนอก (Marketplace)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {renderLinkInput('shopee', 'Shopee', 'https://shopee.co.th/...', 'text-[#ee4d2d]')}
                {renderLinkInput('lazada', 'Lazada', 'https://lazada.co.th/...', 'text-[#0f136d] dark:text-[#2b31a8]')}
                {renderLinkInput('tiktok', 'TikTok', 'https://shop.tiktok.com/...', 'text-black dark:text-white')}
                {renderLinkInput('facebook', 'Facebook', 'https://facebook.com/...', 'text-[#0866ff]')}
              </div>
            </div>

            {/* Pricing & Stock Section */}
            <div className="bg-dh-surface p-5 rounded-2xl border border-dh-border shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-dh-main flex items-center gap-2">💰 ราคาและสต๊อก (Pricing & Stock)</h3>
                <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-dh-muted uppercase tracking-wider bg-dh-base px-2 py-1 rounded-lg border border-dh-border shadow-sm hover:bg-dh-surface transition-colors">
                  <input type="checkbox" checked={isAutoCalc} onChange={e => setIsAutoCalc(e.target.checked)} className="rounded text-dh-accent focus:ring-dh-accent bg-dh-surface border-dh-border" />
                  คำนวณราคาปลีกอัตโนมัติ
                </label>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex justify-between bg-blue-500/10 px-3 py-1.5 rounded-t-xl border border-blue-500/20 border-b-0">
                    <span>ราคาส่ง ฐาน (Price) *</span><span className="opacity-70">เฉพาะแอดมิน</span>
                  </label>
                  <div className="flex items-center border border-blue-500/20 rounded-b-xl bg-dh-base focus-within:bg-dh-surface px-3 py-2.5 focus-within:ring-1 focus-within:ring-blue-400 transition-all shadow-inner">
                    <span className="text-blue-500 font-bold mr-2 text-lg">฿</span>
                    <input type="number" required min="0" value={form.Price} 
                      onChange={e => handlePriceChange(e.target.value, 'Price')}
                      className="w-full outline-none font-black text-xl text-dh-main bg-transparent" />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider flex justify-between bg-green-500/10 px-3 py-1.5 rounded-t-xl border border-green-500/20 border-b-0">
                    <span>ราคาปลีก (Retail) *</span><span className="opacity-70">แสดงหน้าเว็บ</span>
                  </label>
                  <div className="flex items-center border border-green-500/20 rounded-b-xl bg-dh-base focus-within:bg-dh-surface px-3 py-2.5 focus-within:ring-1 focus-within:ring-green-400 transition-all shadow-inner">
                    <span className="text-green-500 font-bold mr-2 text-lg">฿</span>
                    <input type="number" required min="0" value={form.retailPrice} 
                      onChange={e => { setIsAutoCalc(false); handlePriceChange(e.target.value, 'retailPrice'); }}
                      className="w-full outline-none font-black text-xl text-dh-main bg-transparent" />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider px-1 block mb-1">สต๊อกจริง *</label>
                  <input type="number" required min="0" value={form.stockQuantity} 
                    onChange={e => setForm({...form, stockQuantity: Number(e.target.value)})}
                    className="w-full p-2.5 h-[52px] border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface outline-none focus:ring-1 focus:ring-dh-accent font-black text-xl text-center text-dh-main shadow-inner transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-dh-border">
                <div className="md:col-span-1">
                  <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">หน่วยนับ</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                    className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface outline-none focus:border-dh-accent text-sm font-bold text-dh-main transition-all cursor-pointer">
                    {DEFAULT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1 block">Location</label>
                  <input type="text" value={form.warehouseLocation} placeholder="เช่น ล็อก A"
                    onChange={e => setForm({...form, warehouseLocation: e.target.value})}
                    className="w-full p-2.5 border border-dh-border rounded-xl bg-dh-base focus:bg-dh-surface outline-none focus:border-dh-accent text-sm font-bold text-dh-main placeholder:text-dh-muted/50 transition-all" />
                </div>

                <div className="md:col-span-2 flex items-end">
                  {isManagerOrOwner ? (
                    <div className="w-full">
                      <label className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertTriangle size={12}/> บัฟเฟอร์พิเศษ (Override)
                      </label>
                      <input type="number" min="0" value={form.bufferStock === null ? '' : form.bufferStock} 
                        onChange={e => setForm({...form, bufferStock: e.target.value})}
                        placeholder={`ปล่อยว่าง = ใช้ค่าพื้นฐาน (${globalBufferStock})`}
                        className="w-full p-2.5 border border-orange-500/30 bg-orange-500/5 rounded-xl outline-none focus:border-orange-500 text-sm font-bold text-orange-600 dark:text-orange-400 placeholder:text-orange-500/50 transition-all shadow-inner" />
                    </div>
                  ) : (
                    <div className="w-full bg-dh-base text-dh-muted text-[10px] uppercase tracking-wider font-bold p-3 rounded-xl flex items-center justify-center gap-2 border border-dh-border shadow-inner h-[42px]">
                      <Shield size={14}/> บัฟเฟอร์สต๊อกถูกจัดการโดยส่วนกลาง
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-dh-surface p-4 rounded-2xl border border-dh-border shadow-sm">
                <label className="text-[10px] font-bold text-dh-muted uppercase tracking-wider mb-1.5 flex items-center gap-1"><Info size={14}/> Tags ค้นหา</label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-dh-border rounded-xl min-h-[44px] bg-dh-base focus-within:bg-dh-surface focus-within:border-dh-accent transition-all shadow-inner">
                  {form.tags.map(t => (
                    <span key={t} className="bg-dh-accent text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      {t} <X size={10} className="cursor-pointer hover:text-white/70 transition-colors" onClick={() => removeArrayItem('tags', t)}/>
                    </span>
                  ))}
                  <input type="text" placeholder="พิมพ์คำค้นหาแล้วกด Enter..." value={tagInput}
                    onChange={e => setTagInput(e.target.value)} onKeyDown={(e) => addArrayItem(e, 'tags', tagInput, setTagInput)}
                    className="flex-1 outline-none text-sm bg-transparent min-w-[150px] font-bold text-dh-main placeholder:text-dh-muted/50" />
                </div>
              </div>
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