import { useState, useEffect, useCallback } from 'react';
import { auth } from '../../../../../firebase/config';
import { shippingService } from '../../../../../firebase/shippingService';

export function useShippingManagement() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [form, setForm] = useState({
    ruleType: 'shipping',
    company: 'Kerry Express',
    customCompany: '',
    productType: 'All',
    matchType: 'category',
    sku: '',
    minQty: 1,
    maxQty: 9999,
    shippingFee: 50,
    isActive: true,
    conditions: [] // สำหรับเก็บเงื่อนไขย่อยกรณี Combo Rule
  });

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await shippingService.getShippingRules();
      setRules(data);
    } catch (e) {
    console.error("🔥 Error:", e);

      alert("โหลดข้อมูลเงื่อนไขจัดส่งผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // --- ฟังก์ชันสำหรับจัดการเงื่อนไขย่อย (Sub-conditions) ใน Combo Rules ---
  const handleAddCondition = () => {
    setForm(prev => ({
      ...prev,
      conditions: [
        ...(prev.conditions || []),
        { type: 'category', value: 'All', minQty: 1, maxQty: 9999 }
      ]
    }));
  };

  const handleRemoveCondition = (index) => {
    setForm(prev => ({
      ...prev,
      conditions: (prev.conditions || []).filter((_, i) => i !== index)
    }));
  };

  const handleConditionChange = (index, field, value) => {
    setForm(prev => {
      const newConds = [...(prev.conditions || [])];
      newConds[index] = { ...newConds[index], [field]: value };
      return { ...prev, conditions: newConds };
    });
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    
    const min = Number(form.minQty);
    const max = Number(form.maxQty);
    if (form.matchType !== 'combo' && min > max) {
      return alert("จำนวนต่ำสุดต้องไม่มากกว่าจำนวนสูงสุด");
    }

    // --- Validation เช็คความถูกต้องข้อมูล ---
    if (form.ruleType === 'shipping') {
      if (form.company === 'อื่นๆ' && !form.customCompany?.trim()) {
        return alert("กรุณาระบุชื่อบริษัทขนส่งอื่น");
      }
      if (form.matchType === 'sku' && !form.sku?.trim()) {
        return alert("กรุณาระบุรหัส SKU ที่จะบังคับใช้");
      }
      if (form.matchType === 'combo') {
        const conds = form.conditions || [];
        if (conds.length === 0) {
          return alert("กรุณาเพิ่มเงื่อนไขย่อยอย่างน้อย 1 รายการ");
        }
        for (let i = 0; i < conds.length; i++) {
          const cond = conds[i];
          if (cond.type === 'sku' && !cond.value?.trim()) {
            return alert(`เงื่อนไขย่อยที่ ${i + 1}: กรุณากรอกรหัส SKU`);
          }
          if (Number(cond.minQty) > Number(cond.maxQty)) {
            return alert(`เงื่อนไขย่อยที่ ${i + 1}: จำนวนต่ำสุดต้องไม่มากกว่าจำนวนสูงสุด`);
          }
        }
      }
    } else if (form.ruleType === 'insurance') {
      if (form.matchType === 'sku' && !form.sku?.trim()) {
        return alert("กรุณาระบุรหัส SKU ที่จะบังคับใช้");
      }
    }

    setIsProcessing(true);
    const uid = auth.currentUser?.uid;

    // --- เตรียมข้อมูลสำหรับบันทึก ---
    const submissionData = {
      ruleType: form.ruleType,
      company: form.ruleType === 'insurance' ? 'ประกันภัยจัดส่ง' : (form.company === 'อื่นๆ' ? form.customCompany.trim() : form.company),
      productType: form.ruleType === 'shipping' && form.matchType === 'category' ? form.productType : 'All',
      matchType: form.matchType,
      sku: form.matchType === 'sku' ? form.sku.trim().toUpperCase() : '',
      minQty: form.matchType === 'combo' ? 0 : min,
      maxQty: form.matchType === 'combo' ? 0 : max,
      shippingFee: Number(form.shippingFee),
      isActive: form.isActive,
      conditions: form.matchType === 'combo' ? (form.conditions || []).map(c => ({
        type: c.type,
        value: c.type === 'sku' ? c.value.trim().toUpperCase() : c.value,
        minQty: Number(c.minQty),
        maxQty: Number(c.maxQty)
      })) : []
    };

    try {
      const res = await shippingService.addShippingRule(submissionData, uid);
      if (res.success) {
        alert('บันทึกเงื่อนไขสำเร็จ');
        fetchRules();
        setForm(prev => ({
          ...prev,
          sku: '',
          customCompany: '',
          minQty: 1,
          maxQty: 9999,
          shippingFee: 50,
          conditions: []
        }));
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
    console.error("🔥 Error:", error);

      alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleActive = async (rule) => {
    const uid = auth.currentUser?.uid;
    try {
      const isInsurance = rule.ruleType === 'insurance';
      const desc = isInsurance 
        ? `ประกันภัย (${rule.matchType === 'sku' ? `SKU ${rule.sku}` : 'ทุกสินค้า'})`
        : `ขนส่ง ${rule.company} (${rule.matchType === 'sku' ? `SKU ${rule.sku}` : (rule.matchType === 'combo' ? 'เงื่อนไขผสม' : rule.productType)})`;
      await shippingService.toggleShippingRuleActive(rule.id, rule.isActive, desc, uid);
      fetchRules();
    } catch (error) {
    console.error("🔥 Error:", error);

      alert("อัปเดตสถานะล้มเหลว");
    }
  };

  const deleteRule = async (rule) => {
    if(!window.confirm("ยืนยันการลบเงื่อนไขนี้อย่างถาวร?")) return;
    const uid = auth.currentUser?.uid;
    try {
      const isInsurance = rule.ruleType === 'insurance';
      const desc = isInsurance 
        ? `ประกันภัย (${rule.matchType === 'sku' ? `SKU ${rule.sku}` : 'ทุกสินค้า'} ${rule.minQty}-${rule.maxQty} ชิ้น)`
        : `ขนส่ง ${rule.company} (${rule.matchType === 'sku' ? `SKU ${rule.sku}` : (rule.matchType === 'combo' ? 'เงื่อนไขผสม' : rule.productType)} ${rule.minQty}-${rule.maxQty} ชิ้น)`;
      await shippingService.deleteShippingRule(rule.id, desc, uid);
      fetchRules();
    } catch(e) {
    console.error("🔥 Error:", e);

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
    deleteRule,
    handleAddCondition,
    handleRemoveCondition,
    handleConditionChange
  };
}
