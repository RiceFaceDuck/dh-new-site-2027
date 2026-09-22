import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { pricingService } from '../../../../firebase/pricingService';
import { inventoryService } from '../../../../firebase/inventoryService';
import { categoryService } from '../../../../firebase/categoryService';
import { historyService } from '../../../../firebase/historyService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// Helper สกัดราคาทุนจากสินค้าหลากหลายรูปแบบ
export const extractProductCost = (item) => {
  if (!item) return 0;
  const cost = item.Price ?? item.price ?? item.costPrice ?? item.cost ?? item.buyPrice ?? item.wholesalePrice ?? item.price_wholesale ?? item.supplierPrice ?? 0;
  return Number(cost) || 0;
};

// Helper สกัดและจัดกลุ่มหมวดหมู่สินค้าอัตโนมัติตาม SKU/ชื่อ/หมวดหมู่
export const extractProductCategory = (item) => {
  if (!item) return 'Other';
  const cat = (item.category || item.categoryName || item.category_lower || item.type || '').trim();
  if (cat && cat !== 'Other' && cat !== 'other') return cat;

  const sku = (item.sku || '').toUpperCase();
  const title = (item.name || item.title || '').toUpperCase();

  if (sku.startsWith('PANEL') || sku.startsWith('PNL') || sku.startsWith('SCR') || sku.startsWith('DIS') || sku.startsWith('N1') || sku.startsWith('B1') || sku.startsWith('LP') || title.includes('SCREEN') || title.includes('LED') || title.includes('PANEL') || title.includes('หน้าจอ') || title.includes('DISPLAY')) {
    return 'หน้าจอ (panel)';
  }
  if (sku.startsWith('KB') || sku.startsWith('KBD') || title.includes('KEYBOARD') || title.includes('คีย์บอร์ด')) {
    return 'Keyboard';
  }
  if (sku.startsWith('BAT') || sku.startsWith('BT') || title.includes('BATTERY') || title.includes('แบตเตอรี่')) {
    return 'Battery';
  }
  if (sku.startsWith('CA') || sku.startsWith('CBL') || title.includes('CABLE') || title.includes('สายไฟ') || title.includes('สาย')) {
    return 'Cable';
  }
  if (sku.startsWith('SPK') || sku.startsWith('SP') || title.includes('SPEAKER') || title.includes('ลำโพง')) {
    return 'ลำโพง';
  }
  if (sku.startsWith('AD') || sku.startsWith('ADT') || sku.startsWith('ADL') || title.includes('ADAPTER') || title.includes('CHARGER') || title.includes('19V') || title.includes('20V') || title.includes('อะแดปเตอร์')) {
    return 'Adapter';
  }

  return cat || 'Other';
};

export function usePricingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Simulation State (ตรงตาม Production 100%)
  const [simMode, setSimMode] = useState('sku'); // 'sku' | 'manual'
  const [skuInput, setSkuInput] = useState('');
  const [simProduct, setSimProduct] = useState(null);
  const [searchingSku, setSearchingSku] = useState(false);
  const [skuError, setSkuError] = useState(null);

  const [simCost, setSimCost] = useState('');
  const [simCategory, setSimCategory] = useState('Adapter');
  const [simResult, setSimResult] = useState(null);
  const [matchedRuleId, setMatchedRuleId] = useState(null);

  // Logs & Categories
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchConfig();
    fetchPricingLogs();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const defaultCategories = [
        { name: 'Adapter', type: 'Adapter' },
        { name: 'Cable (สายไฟ/สายแพ)', type: 'Cable' },
        { name: 'Keyboard (คีย์บอร์ด)', type: 'Keyboard' },
        { name: 'Battery (แบตเตอรี่)', type: 'Battery' },
        { name: 'Screen / หน้าจอ (panel)', type: 'Screen' },
        { name: 'Speaker (ลำโพง)', type: 'Speaker' },
        { name: 'FAN (พัดลม)', type: 'FAN' },
        { name: 'Cooling', type: 'Cooling' },
        { name: 'RAM (หน่วยความจำ)', type: 'RAM' },
        { name: 'SSD / Harddisk', type: 'SSD' },
        { name: 'Other (อื่นๆ)', type: 'Other' },
        ...(await categoryService.getAllCategories())
      ];
      const catMap = new Map();
      defaultCategories.forEach(item => {
        const typeOrName = (item.type || item.name || '').trim();
        const lowerKey = typeOrName.toLowerCase();
        if (lowerKey && !catMap.has(lowerKey)) {
          catMap.set(lowerKey, {
            id: item.id || lowerKey,
            name: item.name || typeOrName,
            type: typeOrName
          });
        }
      });
      const uniqueCats = Array.from(catMap.values());
      setCategories(uniqueCats);
      if (uniqueCats.length > 0 && uniqueCats[0].type) {
        setSimCategory(uniqueCats[0].type);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  useEffect(() => {
    if (config && originalConfig) {
      const isChanged = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setIsDirty(isChanged);
    }
  }, [config, originalConfig]);

  async function fetchConfig() {
    // ดึง Config โดยคงลำดับเดิมไว้ ไม่ Sort ตาม Threshold (เพื่อเคารพ Top-Down Priority)
    const data = await pricingService.getPricingConfig();
    setConfig(data);
    setOriginalConfig(JSON.parse(JSON.stringify(data)));
    setLoading(false);
  }

  async function fetchPricingLogs() {
    setLoadingLogs(true);
    try {
      let fetchedLogs = [];
      try {
        const res = await historyService.getRecentLogs(50, null, 'PricingConfig');
        fetchedLogs = res?.logs || [];
      } catch (e) {
        console.warn('historyService getRecentLogs fallback:', e);
      }

      if (!fetchedLogs || fetchedLogs.length === 0) {
        const q = query(collection(db, getCollectionPath('history_logs')), orderBy('timestamp', 'desc'), limit(50));
        const logsSnap = await getDocs(q);
        const allLogs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        fetchedLogs = allLogs.filter(log => log.targetId === 'System_Pricing' || log.module === 'PricingConfig');
      }

      setLogs(fetchedLogs.slice(0, 15));
    } catch (error) {
      console.error("Error fetching logs", error);
    } finally {
      setLoadingLogs(false);
    }
  }

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      await pricingService.savePricingConfig(config);
      setOriginalConfig(JSON.parse(JSON.stringify(config))); 
      setIsDirty(false);
      fetchPricingLogs(); 
      alert('บันทึกโครงสร้างราคาเรียบร้อยแล้ว');
    } catch (error) {
      console.error("🔥 Error:", error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleRuleChange = (index, field, value) => {
    const newRules = [...config.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setConfig({ ...config, rules: newRules });
  };

  const addRule = () => {
    const newRule = { 
      id: Date.now().toString(), 
      category: '', 
      operator: '<', 
      threshold: 0, 
      action: '*', 
      value: 1, 
      isActive: true 
    };
    setConfig({ ...config, rules: [newRule, ...config.rules] });
  };

  const removeRule = (index) => {
    const confirm = window.confirm('ต้องการลบเงื่อนไขนี้ใช่หรือไม่?');
    if (!confirm) return;
    const newRules = [...config.rules];
    newRules.splice(index, 1);
    setConfig({ ...config, rules: newRules });
  };

  const handleRoundingChange = (field, value) => {
    setConfig({
      ...config,
      rounding: { ...config.rounding, [field]: value }
    });
  };

  // จำลองการคำนวณราคาจาก SKU จริง (ดึงจาก POS Search)
  const simulateBySku = async (targetSku) => {
    const term = (targetSku || skuInput || '').trim();
    if (!term) return;

    setSearchingSku(true);
    setSkuError(null);
    try {
      const products = await inventoryService.searchProductsForPos(term);
      if (!products || products.length === 0) {
        setSimProduct(null);
        setSimResult(null);
        setMatchedRuleId(null);
        setSkuError(`ไม่พบสินค้า SKU "${term}" ในระบบ`);
        return;
      }
      const prod = products[0];
      const cost = extractProductCost(prod);
      const cat = extractProductCategory(prod);
      const result = pricingService.calculateRetailPrice(cost, cat, config);
      setSimProduct(prod);
      setSimResult(result);
      setMatchedRuleId(result.appliedRule?.id || null);
    } catch (err) {
      console.error('Error searching SKU for simulation:', err);
      setSkuError('เกิดข้อผิดพลาดในการค้นหาข้อมูลสินค้า');
    } finally {
      setSearchingSku(false);
    }
  };

  // สุ่ม SKU สินค้าจากคลังมาทดสอบทันที (ประหยัด Reads ผ่าน Category Pool)
  const handleRandomSku = async () => {
    setSearchingSku(true);
    setSkuError(null);
    try {
      const activeProducts = await inventoryService.getRandomActiveProducts(20);
      if (!activeProducts || activeProducts.length === 0) {
        setSkuError('ไม่พบรายการสินค้าในคลังสำหรับสุ่ม');
        return;
      }
      const randomItem = activeProducts[Math.floor(Math.random() * activeProducts.length)];
      if (randomItem && randomItem.sku) {
        setSkuInput(randomItem.sku);
        const cost = extractProductCost(randomItem);
        const cat = extractProductCategory(randomItem);
        const result = pricingService.calculateRetailPrice(cost, cat, config);
        setSimProduct(randomItem);
        setSimResult(result);
        setMatchedRuleId(result.appliedRule?.id || null);
      }
    } catch (err) {
      console.error('Error randomizing SKU:', err);
      setSkuError('เกิดข้อผิดพลาดในการสุ่ม SKU');
    } finally {
      setSearchingSku(false);
    }
  };

  // จำลองคำนวณแบบใส่ราคาทุนเอง
  const runSimulation = () => {
    if (!simCost) return;
    const result = pricingService.calculateRetailPrice(simCost, simCategory, config);
    setSimProduct(null);
    setSimResult(result);
    setMatchedRuleId(result.appliedRule?.id || null);
  };

  return {
    loading, saving, config, isDirty,
    simMode, setSimMode,
    skuInput, setSkuInput,
    simProduct, searchingSku, skuError,
    simulateBySku, handleRandomSku,
    simCost, setSimCost,
    simCategory, setSimCategory,
    simResult, matchedRuleId,
    runSimulation,
    logs, loadingLogs, fetchPricingLogs,
    handleSave, handleRuleChange, addRule, removeRule, handleRoundingChange,
    categories
  };
}
