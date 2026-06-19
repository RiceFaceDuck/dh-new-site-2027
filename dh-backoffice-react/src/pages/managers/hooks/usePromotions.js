import { useState, useEffect } from 'react';
import { auth } from '../../../firebase/config';
import { promotionService } from '../../../firebase/promotionService';

export function usePromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    description: '',
    type: 'PERCENTAGE', // PERCENTAGE, FIXED_AMOUNT
    value: '',
    minSpend: '',
    minQty: '',
    maxDiscount: '', // For PERCENTAGE
    customerType: 'ALL', // ALL, RETAIL, WHOLESALE, VIP
    applicableSkus: '', // Comma separated string
    startDate: '',
    endDate: '',
    quotaLimit: '',
    quotaUsed: 0
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const data = await promotionService.getAllPromotions();
      setPromotions(data);
    } catch (error) {
      console.error("Error loading promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      id: null, title: '', description: '', type: 'PERCENTAGE', value: '', 
      minSpend: '', minQty: '', maxDiscount: '', customerType: 'ALL', 
      applicableSkus: '',
      startDate: '', endDate: '', quotaLimit: '', quotaUsed: 0 
    });
  };

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setFormData({
        id: promo.id,
        title: promo.title || '',
        description: promo.description || '',
        type: promo.type || 'PERCENTAGE',
        value: promo.value || '',
        minSpend: promo.minSpend || '',
        minQty: promo.minQty || '',
        maxDiscount: promo.maxDiscount || '',
        customerType: promo.customerType || 'ALL',
        applicableSkus: promo.applicableSkus ? promo.applicableSkus.join(', ') : '',
        startDate: promo.startDate || '',
        endDate: promo.endDate || '',
        quotaLimit: promo.quotaLimit || '',
        quotaUsed: promo.quotaUsed || 0
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.value) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    
    setIsProcessing(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        value: Number(formData.value),
        minSpend: Number(formData.minSpend) || 0,
        minQty: Number(formData.minQty) || 0,
        maxDiscount: formData.type === 'PERCENTAGE' && formData.maxDiscount ? Number(formData.maxDiscount) : null,
        customerType: formData.customerType,
        applicableSkus: formData.applicableSkus ? formData.applicableSkus.split(',').map(s => s.trim()).filter(Boolean) : [],
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        quotaLimit: formData.quotaLimit ? Number(formData.quotaLimit) : null,
      };

      if (formData.id) {
        let logMsg = `แก้ไขโปรโมชัน: ${formData.title}`;
        if (formData.quotaLimit) logMsg += ` (โควต้า ${formData.quotaLimit})`;
        await promotionService.updatePromotion(formData.id, payload, auth.currentUser, logMsg);
        alert('แก้ไขโปรโมชันสำเร็จ');
      } else {
        await promotionService.createPromotion(payload, auth.currentUser);
        alert('สร้างโปรโมชันใหม่สำเร็จ แจ้งเตือนพนักงานทุกคนแล้ว!');
      }
      setIsModalOpen(false);
      loadPromotions();
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await promotionService.updatePromotion(promo.id, { isActive: !promo.isActive }, auth.currentUser, promo.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน');
      loadPromotions();
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`ยืนยันการลบโปรโมชัน "${title}" ออกจากระบบถาวร ใช่หรือไม่?`)) return;
    try {
      await promotionService.deletePromotion(id, title, auth.currentUser);
      loadPromotions();
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  return {
    promotions,
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
}
