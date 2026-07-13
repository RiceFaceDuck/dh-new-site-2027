const fs = require('fs');
const file = 'dh-backoffice-react/src/components/inventory/ProductModal.jsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
const fixedLines = [
"import React from 'react';",
"import { X, Save, Trash2, Loader2 } from 'lucide-react';",
"import { auth } from '../../firebase/config';",
"import { todoService } from '../../firebase/todoService';",
"import { toast } from 'react-toastify';",
"",
"import ProductImageUpload from './modal/ProductImageUpload';",
"import ProductBasicInfo from './modal/ProductBasicInfo';",
"import ProductLinks from './modal/ProductLinks';",
"import ProductPricingStock from './modal/ProductPricingStock';",
"import ProductVariants from './modal/ProductVariants';",
"import ProductTags from './modal/ProductTags';",
"import useProductForm from './hooks/useProductForm';",
"",
"export default function ProductModal({ isOpen, onClose, onSave, productData, globalBufferStock = 2, categoriesData }) {",
"  const {",
"    form, setForm,",
"    isUploading, setIsUploading,",
"    uploadProgress, setUploadProgress,",
"    activeImageUrl, setActiveImageUrl,",
"    categories,",
"    isAutoCalc, setIsAutoCalc,",
"    linkValidation,",
"    isManagerOrOwner,",
"    handlePriceChange,",
"    handleCategoryChange,",
"    handleAddCategory,",
"    addArrayItem,",
"    removeArrayItem,",
"    handleLinkChange",
"  } = useProductForm(productData, isOpen, categoriesData);",
"",
"  const handleRequestDelete = async () => {",
"    if (!productData) return;",
"    const confirmMsg = `ยืนยันการขออนุมัติลบสินค้า ${form.sku} ใช่หรือไม่?\\nข้อมูลจะไม่หายไปทันที แต่จะถูกส่งไปให้ผู้จัดการอนุมัติ`;",
"    if (window.confirm(confirmMsg)) {",
"      try {",
"        await todoService.requestProductDeletion(form, auth.currentUser.uid);",
"        alert('ส่งคำร้องขออนุมัติลบสำเร็จ แจ้งเตือนไปยังผู้จัดการแล้ว');",
"        onClose();",
"      } catch (error) {",
"        console.error('🔥 Error:', error);",
"        toast.error(error?.message || 'เกิดข้อผิดพลาด');",
"      }",
"    }",
"  };"
];

const newContent = fixedLines.join('\n') + '\n' + lines.slice(60).join('\n');
fs.writeFileSync(file, newContent);
console.log('Fixed ProductModal.jsx');
