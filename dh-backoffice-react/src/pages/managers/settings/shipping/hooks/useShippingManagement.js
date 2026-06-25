import { useState, useEffect, useCallback } from 'react';
import { auth } from '../../../../../firebase/config';
import { shippingService } from '../../../../../firebase/shippingService';

export function useShippingManagement() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [form, setForm] = useState({
    company: 'Kerry Express',
    productType: 'All',
    minQty: 1,
    maxQty: 5,
    shippingFee: 50,
    isActive: true
  });

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await shippingService.getShippingRules();
      setRules(data);
    } catch (e) {
      alert("โหลดข้อมูลเงื่อนไขจัดส่งผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (form.minQty > form.maxQty) return alert("จำนวนต่ำสุดต้องไม่มากกว่าจำนวนสูงสุด");
    
    setIsProcessing(true);
    const uid = auth.currentUser?.uid;
    try {
      const res = await shippingService.addShippingRule(form, uid);
      if (res.success) {
        alert('บันทึกเงื่อนไขจัดส่งสำเร็จ');
        fetchRules();
        // Reset specific form fields
        setForm(prev => ({...prev, minQty: 1, maxQty: 5, shippingFee: 50}));
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleActive = async (rule) => {
    const uid = auth.currentUser?.uid;
    try {
      const desc = `${rule.company} (${rule.productType})`;
      await shippingService.toggleShippingRuleActive(rule.id, rule.isActive, desc, uid);
      fetchRules();
    } catch (error) {
      alert("อัปเดตสถานะล้มเหลว");
    }
  };

  const deleteRule = async (rule) => {
    if(!window.confirm("ยืนยันการลบเงื่อนไขนี้อย่างถาวร?")) return;
    const uid = auth.currentUser?.uid;
    try {
      const desc = `${rule.company} (${rule.minQty}-${rule.maxQty} ชิ้น)`;
      await shippingService.deleteShippingRule(rule.id, desc, uid);
      fetchRules();
    } catch(e) {
      alert("ลบล้มเหลว");
    }
  };

  return {
    rules,
    loading,
    form,
    setForm,
    isProcessing,
    handleSaveRule,
    toggleActive,
    deleteRule
  };
}
