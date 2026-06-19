import { useState, useEffect } from 'react';
import { auth } from '../../../firebase/config';
import { freebieService } from '../../../firebase/freebieService';

export const useFreebies = () => {
  const [freebies, setFreebies] = useState([]);
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
    startDate: '',
    endDate: '',
    quotaLimit: '',
    quotaUsed: 0
  });

  useEffect(() => {
    loadFreebies();
  }, []);

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
        applicableSkus: formData.applicableSkus ? formData.applicableSkus.split(',').map(s => s.trim()).filter(Boolean) : [],
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

  const handleDelete = async (id, title) => {
    if (!window.confirm(`ยืนยันการลบกฎของแถม "${title}" อย่างถาวร?`)) return;
    await freebieService.deleteFreebie(id, title, auth.currentUser);
    loadFreebies();
  };

  return {
    freebies,
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
