import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { auth } from '../../../../../firebase/config';
import { shippingService } from '../../../../../firebase/shippingService';
import { categoryService } from '../../../../../firebase/categoryService';

export function useShippingManagement() {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  
  const initialForm = {
    ruleType: 'shipping',
    company: 'KEX (Kerry Express)',
    customCompany: '',
    productType: 'All',
    matchType: 'category',
    sku: '',
    minQty: 1,
    maxQty: 9999,
    shippingFee: 50,
    isActive: true,
    conditions: [] // สำหรับเก็บเงื่อนไขย่อยกรณี Combo Rule
  };

  const [form, setForm] = useState(initialForm);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await shippingService.getShippingRules();
      setRules(data);
    } catch (e) {
      console.error("🔥 Error:", e);
      toast.error("โหลดข้อมูลเงื่อนไขจัดส่งผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryService.getAllCategories();
      const activeList = data.filter(c => c.isActive !== false);
      setCategories(activeList);
    } catch (e) {
      console.warn("⚠️ Could not load categories for shipping:", e);
    }
  }, []);

  useEffect(() => {
    fetchRules();
    fetchCategories();
  }, [fetchRules, fetchCategories]);

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

  // --- เริ่มโหมดแก้ไขเงื่อนไข (Edit Mode) ---
  const handleEditRule = (rule) => {
    setEditingRuleId(rule.id);
    const standardCompanies = [
      'KEX (Kerry Express)',
      'Kerry Express',
      'Flash Express',
      'J&T Express',
      'SPX Express',
      'ไปรษณีย์ไทย (EMS)',
      'EMS',
      'Lalamove',
      'ผู้ขายจัดส่งเอง'
    ];

    const isCustom = rule.ruleType === 'shipping' && !standardCompanies.includes(rule.company);

    setForm({
      ruleType: rule.ruleType || 'shipping',
      company: isCustom ? 'อื่นๆ' : (rule.company === 'Kerry Express' ? 'KEX (Kerry Express)' : rule.company || 'KEX (Kerry Express)'),
      customCompany: isCustom ? rule.company : '',
      productType: rule.productType || 'All',
      matchType: rule.matchType || 'category',
      sku: rule.sku || '',
      minQty: rule.minQty ?? 1,
      maxQty: rule.maxQty ?? 9999,
      shippingFee: rule.shippingFee ?? 50,
      isActive: rule.isActive ?? true,
      conditions: Array.isArray(rule.conditions) ? rule.conditions : []
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('เข้าสู่โหมดแก้ไขเงื่อนไข', { icon: '✏️' });
  };

  // --- ยกเลิกโหมดแก้ไข ---
  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setForm(initialForm);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    
    const min = Number(form.minQty);
    const max = Number(form.maxQty);
    if (form.matchType !== 'combo' && min > max) {
      return toast.error("จำนวนต่ำสุดต้องไม่มากกว่าจำนวนสูงสุด");
    }

    // --- Validation เช็คความถูกต้องข้อมูล ---
    if (form.ruleType === 'shipping') {
      if (form.company === 'อื่นๆ' && !form.customCompany?.trim()) {
        return toast.error("กรุณาระบุชื่อบริษัทขนส่งอื่น");
      }
      if (form.matchType === 'sku' && !form.sku?.trim()) {
        return toast.error("กรุณาระบุรหัส SKU ที่จะบังคับใช้");
      }
      if (form.matchType === 'combo') {
        const conds = form.conditions || [];
        if (conds.length === 0) {
          return toast.error("กรุณาเพิ่มเงื่อนไขย่อยอย่างน้อย 1 รายการ");
        }
        for (let i = 0; i < conds.length; i++) {
          const cond = conds[i];
          if (cond.type === 'sku' && !cond.value?.trim()) {
            return toast.error(`เงื่อนไขย่อยที่ ${i + 1}: กรุณากรอกรหัส SKU`);
          }
          if (Number(cond.minQty) > Number(cond.maxQty)) {
            return toast.error(`เงื่อนไขย่อยที่ ${i + 1}: จำนวนต่ำสุดต้องไม่มากกว่าจำนวนสูงสุด`);
          }
        }
      }
    } else if (form.ruleType === 'insurance') {
      if (form.matchType === 'sku' && !form.sku?.trim()) {
        return toast.error("กรุณาระบุรหัส SKU ที่จะบังคับใช้");
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
      let res;
      if (editingRuleId) {
        res = await shippingService.updateShippingRule(editingRuleId, submissionData, uid);
        if (res.success) {
          toast.success('อัปเดตเงื่อนไขสำเร็จ');
          setEditingRuleId(null);
        }
      } else {
        res = await shippingService.addShippingRule(submissionData, uid);
        if (res.success) {
          toast.success('บันทึกเงื่อนไขสำเร็จ');
        }
      }

      if (res.success) {
        fetchRules();
        setForm(initialForm);
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
      console.error("🔥 Error:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
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
      toast.success(rule.isActive ? 'ปิดการใช้งานเงื่อนไขแล้ว' : 'เปิดใช้งานเงื่อนไขแล้ว');
      fetchRules();
    } catch (error) {
      console.error("🔥 Error:", error);
      toast.error("อัปเดตสถานะล้มเหลว");
    }
  };

  const deleteRule = async (rule) => {
    if (!window.confirm("ยืนยันการลบเงื่อนไขนี้อย่างถาวร?")) return;
    const uid = auth.currentUser?.uid;
    try {
      const isInsurance = rule.ruleType === 'insurance';
      const desc = isInsurance 
        ? `ประกันภัย (${rule.matchType === 'sku' ? `SKU ${rule.sku}` : 'ทุกสินค้า'} ${rule.minQty}-${rule.maxQty} ชิ้น)`
        : `ขนส่ง ${rule.company} (${rule.matchType === 'sku' ? `SKU ${rule.sku}` : (rule.matchType === 'combo' ? 'เงื่อนไขผสม' : rule.productType)} ${rule.minQty}-${rule.maxQty} ชิ้น)`;
      await shippingService.deleteShippingRule(rule.id, desc, uid);
      if (editingRuleId === rule.id) {
        handleCancelEdit();
      }
      toast.success("ลบเงื่อนไขเรียบร้อยแล้ว");
      fetchRules();
    } catch (e) {
      console.error("🔥 Error:", e);
      toast.error("ลบล้มเหลว");
    }
  };

  return {
    rules,
    categories,
    loading,
    form,
    setForm,
    isProcessing,
    editingRuleId,
    handleSaveRule,
    handleEditRule,
    handleCancelEdit,
    toggleActive,
    deleteRule,
    handleAddCondition,
    handleRemoveCondition,
    handleConditionChange
  };
}
