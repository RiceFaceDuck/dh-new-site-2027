import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { pricingService } from '../../../../firebase/pricingService';

export function usePricingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const [simCost, setSimCost] = useState('');
  const [simCategory, setSimCategory] = useState('Panel');
  const [simResult, setSimResult] = useState(null);

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    fetchConfig();
    fetchPricingLogs();
  }, []);

  useEffect(() => {
    if (config && originalConfig) {
      const isChanged = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setIsDirty(isChanged);
    }
  }, [config, originalConfig]);

  const fetchConfig = async () => {
    const data = await pricingService.getPricingConfig();
    data.rules.sort((a, b) => a.category.localeCompare(b.category) || a.threshold - b.threshold);
    setConfig(data);
    setOriginalConfig(JSON.parse(JSON.stringify(data)));
    setLoading(false);
  };

  const fetchPricingLogs = async () => {
    setLoadingLogs(true);
    try {
      const q = query(collection(db, 'history_logs'), orderBy('timestamp', 'desc'), limit(100));
      const logsSnap = await getDocs(q);
      const allLogs = logsSnap.docs.map(d => ({id: d.id, ...d.data()}));
      
      const pricingLogs = allLogs
        .filter(log => log.targetId === 'System_Pricing' || log.module === 'PricingConfig')
        .slice(0, 15); 
        
      setLogs(pricingLogs);
    } catch (error) {
      console.error("Error fetching logs", error);
    } finally {
      setLoadingLogs(false);
    }
  };

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
      category: 'หมวดหมู่ใหม่', 
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

  const runSimulation = () => {
    if (!simCost) return;
    const result = pricingService.calculateRetailPrice(simCost, simCategory, config);
    setSimResult(result);
  };

  return {
    loading, saving, config, isDirty,
    simCost, setSimCost, simCategory, setSimCategory, simResult,
    logs, loadingLogs, fetchPricingLogs,
    handleSave, handleRuleChange, addRule, removeRule, handleRoundingChange, runSimulation
  };
}
