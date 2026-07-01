import { useState, useEffect } from 'react';
import { auth } from '../../../firebase/config';
import { freebieService } from '../../../firebase/freebieService';
import { categoryService } from '../../../firebase/categoryService';

export const useFreebies = () => {
  const [freebies, setFreebies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    title: '',
    itemName: '',
    qty: 1,
    minSpend: '',
    minQty: '',
    maxPerBill: 1,
    customerType: 'ALL', // ALL, RETAIL, WHOLESALE, VIP
    applicableSkus: '', // Comma separated string
    applicableTypes: '', // Comma separated string
    startDate: '',
    endDate: '',
    quotaLimit: '',
    quotaUsed: 0
  });

  useEffect(() => {
    loadFreebies();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      // Only keep active categories with a valid type
      const activeTypes = data.filter(c => c.isActive !== false && c.type);
      setCategories(activeTypes);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadFreebies = async () => {
    setLoading(true);
    const data = await freebieService.getAllFreebies();
    setFreebies(data);
    setLoading(false);
  };

  const resetForm = () => setFormData({
    id: null,
    title: '',
    itemName: '',
    qty: 1,
    minSpend: '',
    minQty: '',
    maxPerBill: 1,
    customerType: 'ALL',
    applicableSkus: '',
    applicableTypes: '',
    startDate: '',
    endDate: '',
    quotaLimit: '',
    quotaUsed: 0
  });

  const handleOpenModal = (item = null) => {
    if (item) {
      setFormData({
        id: item.id,
        title: item.title || '',
        itemName: item.itemName || '',
        qty: item.qty || 1,
        minSpend: item.minSpend || '',
        minQty: item.minQty || '',
        maxPerBill: item.maxPerBill || 1,
        customerType: item.customerType || 'ALL',
        applicableSkus: item.applicableSkus ? item.applicableSkus.join(', ') : '',
        applicableTypes: item.applicableTypes ? item.applicableTypes.join(', ') : '',
        startDate: item.startDate || '',
        endDate: item.endDate || '',
        quotaLimit: item.quotaLimit || '',
        quotaUsed: item.quotaUsed || 0
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.itemName || !formData.qty) {
      return alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
    }

    setIsProcessing(true);
    try {
      const payload = {
        title: formData.title,
        itemName: formData.itemName,
        qty: Number(formData.qty),
        minSpend: Number(formData.minSpend) || 0,
        minQty: Number(formData.minQty) || 0,
        maxPerBill: Number(formData.maxPerBill) || 1,
        customerType: formData.customerType,
        applicableSkus: formData.applicableSkus ? formData.applicableSkus.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [],
        applicableTypes: formData.applicableTypes ? formData.applicableTypes.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [],
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        quotaLimit: formData.quotaLimit ? Number(formData.quotaLimit) : null,
      };

      if (formData.id) {
        let logMsg = `แก้ไขกฎของแถม: ${formData.title}`;
        if (formData.quotaLimit) logMsg += ` (โควต้า ${formData.quotaLimit})`;
        await freebieService.updateFreebie(formData.id, payload, auth.currentUser, logMsg);
      } else {
        await freebieService.createFreebie(payload, auth.currentUser);
      }
      setIsModalOpen(false);
      loadFreebies();
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleActive = async (item) => {
    const actionName = item.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน';
    const logMsg = `${actionName}กฎของแถม: ${item.title}`;
    await freebieService.updateFreebie(item.id, { isActive: !item.isActive }, auth.currentUser, logMsg);
    loadFreebies();
  };

  const handleDelete = async (item) => {
    if (item.deletedAt) {
      if (!window.confirm(`ลบถาวร: ยืนยันการลบกฎของแถม "${item.title}" ออกจากฐานข้อมูลถาวร?`)) return;
      await freebieService.hardDeleteFreebie(item.id, item.title, auth.currentUser);
    } else {
      if (!window.confirm(`ยืนยันการลบกฎของแถม "${item.title}" ชั่วคราว?\n(สามารถกดลบซ้ำอีกครั้งเพื่อลบถาวรได้)`)) return;
      await freebieService.deleteFreebie(item.id, item.title, auth.currentUser);
    }
    loadFreebies();
  };

  return {
    freebies,
    categories,
    loading,
    isModalOpen,
    setIsModalOpen,
    isProcessing,
    formData,
    setFormData,
    handleOpenModal,
    handleSave,
    handleToggleActive,
    handleDelete
  };
};
