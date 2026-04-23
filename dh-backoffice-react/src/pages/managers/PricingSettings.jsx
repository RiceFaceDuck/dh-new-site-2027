import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Save, ArrowLeft, Plus, Trash2, AlertTriangle, RefreshCw, History, CheckCircle2, Settings } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { pricingService } from '../../firebase/pricingService';

export default function PricingSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State ปัจจุบัน และ State ดั้งเดิม (เอาไว้เช็ค Dirty State)
  const [config, setConfig] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // State สำหรับ Simulation
  const [simCost, setSimCost] = useState('');
  const [simCategory, setSimCategory] = useState('Panel');
  const [simResult, setSimResult] = useState(null);

  // State สำหรับ History Logs เฉพาะหน้านี้
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    fetchConfig();
    fetchPricingLogs();
  }, []);

  // Effect ตรวจจับการเปลี่ยนแปลง (Compare configs) เพื่อควบคุมปุ่มบันทึก
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
    setOriginalConfig(JSON.parse(JSON.stringify(data))); // Deep copy
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

  if (loading || !config) return <div className="flex justify-center items-center h-full bg-[var(--dh-bg-base)]"><RefreshCw className="animate-spin text-[var(--dh-accent)]" size={40} /></div>;

  const uniqueCategories = [...new Set(config.rules.map(r => r.category))];

  return (
    <div className="flex flex-col h-full bg-[var(--dh-bg-base)] p-3 lg:p-4 overflow-hidden font-sans relative transition-colors duration-300 gap-3 lg:gap-4">
      
      {/* 🏷️ Header Panel (Sticky Top) */}
      <div className="flex items-center justify-between px-5 py-4 bg-[var(--dh-bg-surface)] rounded-2xl shadow-sm border border-[var(--dh-border)] shrink-0 z-20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/managers')} className="p-2 hover:bg-[var(--dh-bg-base)] rounded-lg text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] transition-colors active:scale-95">
            <ArrowLeft size={22} strokeWidth={2.5}/>
          </button>
          <div>
            <h1 className="text-xl font-black text-[var(--dh-text-main)] flex items-center gap-2 leading-none">
              <Calculator className="text-[var(--dh-accent)]" size={24} strokeWidth={2.5} /> โครงสร้างราคาปลีก
            </h1>
            <p className="text-[11px] font-bold text-[var(--dh-text-muted)] mt-1.5 uppercase tracking-wider">Retail Pricing Engine Configuration</p>
          </div>
        </div>
        
        {/* Smart Save Button (Pulse Animation เมื่อมีการแก้ไข) */}
        <button 
          onClick={handleSave} 
          disabled={saving || !isDirty}
          className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-300 flex items-center gap-2 shadow-sm active:scale-95
            ${isDirty && !saving 
              ? 'bg-[var(--dh-accent)] hover:bg-[var(--dh-accent-hover)] text-white shadow-[0_0_15px_var(--dh-accent-light)] animate-pulse border border-transparent' 
              : 'bg-[var(--dh-bg-base)] text-[var(--dh-text-muted)] border border-[var(--dh-border)] cursor-not-allowed opacity-60'}
          `}
        >
          {saving ? <RefreshCw className="animate-spin" size={16} strokeWidth={2.5} /> : (isDirty ? <Save size={16} strokeWidth={2.5} /> : <CheckCircle2 size={16} strokeWidth={2.5} />)}
          {saving ? 'กำลังบันทึก...' : isDirty ? 'บันทึกการตั้งค่า' : 'เป็นปัจจุบัน'}
        </button>
      </div>

      {/* 🎨 Main Content Grid (Full-screen Edge-to-Edge) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col xl:flex-row gap-3 lg:gap-4">
        
        {/* ⬅️ ซ้าย: ตั้งค่ากฎ (Rules) และ Log ประวัติ */}
        <div className="flex-1 flex flex-col gap-3 lg:gap-4 min-w-0">
          
          {/* Pricing Rules Table */}
          <div className="flex-1 flex flex-col bg-[var(--dh-bg-surface)] rounded-2xl shadow-sm border border-[var(--dh-border)] overflow-hidden transition-colors duration-300 min-h-[400px]">
            <div className="p-4 border-b border-[var(--dh-border)] bg-[var(--dh-bg-base)] flex justify-between items-center shrink-0">
              <h2 className="font-black text-sm text-[var(--dh-text-main)] uppercase tracking-widest flex items-center gap-2">
                <Settings size={16} className="text-[var(--dh-text-muted)]"/> เงื่อนไขราคา (Pricing Rules)
              </h2>
              <button onClick={addRule} className="text-xs bg-[var(--dh-bg-surface)] hover:bg-[var(--dh-text-main)] hover:text-[var(--dh-bg-surface)] border border-[var(--dh-border)] text-[var(--dh-text-main)] px-3 py-1.5 rounded-lg font-black flex items-center gap-1.5 transition-colors shadow-sm active:scale-95">
                <Plus size={14} strokeWidth={3}/> เพิ่มเงื่อนไข
              </button>
            </div>
            
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
              <table className="w-full text-left text-sm min-w-[700px] border-collapse">
                <thead className="bg-[var(--dh-bg-surface)] text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest sticky top-0 z-10 border-b-2 border-[var(--dh-border)] shadow-sm">
                  <tr>
                    <th className="px-4 py-3 w-40">หมวดหมู่</th>
                    <th className="px-3 py-3 text-center w-24">สัญลักษณ์</th>
                    <th className="px-3 py-3 w-32">ราคาทุน</th>
                    <th className="px-3 py-3 text-center w-24">การกระทำ</th>
                    <th className="px-3 py-3 w-28">จำนวน</th>
                    <th className="px-3 py-3 text-center w-24">สถานะ</th>
                    <th className="px-4 py-3 text-right w-16">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--dh-border)]">
                  {config.rules.map((rule, index) => (
                    // ✨ เพิ่ม Interaction ให้แถว Hover แล้วมีแถบซ้ายนำสายตา
                    <tr key={rule.id} className="hover:bg-[var(--dh-bg-base)] transition-colors group relative">
                      <td className="px-4 py-2.5 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--dh-accent)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <input type="text" value={rule.category} onChange={(e) => handleRuleChange(index, 'category', e.target.value)} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md px-2.5 py-1.5 text-xs font-bold text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] focus:ring-1 focus:ring-[var(--dh-accent-light)] transition-all" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <select value={rule.operator} onChange={(e) => handleRuleChange(index, 'operator', e.target.value)} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md px-2.5 py-1.5 text-xs font-bold text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] cursor-pointer text-center">
                          <option value="<">{'< (น้อยกว่า)'}</option><option value="<=">{'<= (ไม่เกิน)'}</option><option value=">">{'> (มากกว่า)'}</option><option value=">=">{'>= (ตั้งแต่)'}</option><option value="all">ทั้งหมด</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="number" value={rule.threshold} onChange={(e) => handleRuleChange(index, 'threshold', Number(e.target.value))} disabled={rule.operator === 'all'} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md px-2.5 py-1.5 text-xs font-bold text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <select value={rule.action} onChange={(e) => handleRuleChange(index, 'action', e.target.value)} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md px-2.5 py-1.5 text-xs font-black text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] cursor-pointer text-center text-blue-600 dark:text-blue-400">
                          <option value="*">* (คูณ)</option><option value="/">/ (หาร)</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="number" step="0.01" value={rule.value} onChange={(e) => handleRuleChange(index, 'value', Number(e.target.value))} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md px-2.5 py-1.5 text-xs font-bold text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] focus:ring-1 focus:ring-[var(--dh-accent-light)] transition-all" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button onClick={() => handleRuleChange(index, 'isActive', !rule.isActive)} className={`text-[10px] px-3 py-1.5 rounded-md font-black uppercase tracking-wider transition-colors border ${rule.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-[var(--dh-bg-surface)] text-[var(--dh-text-muted)] border-[var(--dh-border)] opacity-60 hover:opacity-100'}`}>
                          {rule.isActive ? 'ON' : 'OFF'}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => removeRule(index)} className="p-1.5 text-[var(--dh-text-muted)] hover:text-rose-500 bg-[var(--dh-bg-base)] hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <Trash2 size={16} strokeWidth={2.5}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold border-t border-[var(--dh-border)] flex items-start gap-2 shrink-0">
              <AlertTriangle size={14} className="shrink-0 mt-0.5 opacity-80"/>
              <p>ระบบจะทำงานแบบ Top-Down ตามลำดับหมวดหมู่ (หากหมวดหมู่เดียวกันมีเงื่อนไขแคบกว่า แนะนำให้ลาก/พิมพ์ไว้ด้านบน)</p>
            </div>
          </div>
          
          {/* History Log Panel */}
          <div className="bg-[var(--dh-bg-surface)] rounded-2xl shadow-sm border border-[var(--dh-border)] overflow-hidden shrink-0 h-[280px] flex flex-col">
            <div className="p-4 border-b border-[var(--dh-border)] bg-[var(--dh-bg-base)] flex items-center justify-between shrink-0">
              <h2 className="font-black text-[var(--dh-text-main)] text-xs uppercase tracking-widest flex items-center gap-2">
                <History size={14} className="text-[var(--dh-text-muted)]" /> ประวัติการแก้โครงสร้างราคา
              </h2>
              <button onClick={fetchPricingLogs} className="text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] p-1 rounded-md hover:bg-[var(--dh-bg-surface)] transition-colors"><RefreshCw size={14} className={loadingLogs ? "animate-spin text-[var(--dh-accent)]" : ""}/></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-[var(--dh-bg-surface)]">
              {loadingLogs ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--dh-text-muted)]"><RefreshCw className="animate-spin mb-2" size={20} /><p className="text-[10px] font-bold">กำลังโหลดประวัติ...</p></div>
              ) : logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[var(--dh-text-muted)] text-[11px] font-bold">ยังไม่มีประวัติการเปลี่ยนแปลง</div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[7px] before:w-[2px] before:bg-[var(--dh-border)] before:opacity-50">
                  {logs.map(log => (
                    <div key={log.id} className="relative flex items-start gap-4 group/log">
                      <div className="absolute left-0 w-4 h-4 rounded-full bg-[var(--dh-bg-surface)] border-[3px] border-[var(--dh-border)] mt-1 z-10 flex items-center justify-center transition-colors group-hover/log:border-[var(--dh-accent)]">
                      </div>
                      <div className="pl-6 w-full">
                        <div className="bg-[var(--dh-bg-base)] p-3 rounded-xl border border-[var(--dh-border)] shadow-sm transition-colors group-hover/log:border-[var(--dh-accent)]/30">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[11px] font-black text-[var(--dh-text-main)]">{log.details}</span>
                            <span className="text-[9px] font-bold text-[var(--dh-text-muted)] shrink-0 pl-2">
                              {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('th-TH', {dateStyle:'short', timeStyle:'short'}) : '-'}
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-[var(--dh-text-muted)]">
                            ดำเนินการโดย: <span className="text-blue-600 dark:text-blue-400">{log.actorName || log.performedBy || 'System'}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ➡️ ขวา: การปัดเศษ (Smart Rounding) และ จำลองราคา (Simulation) */}
        <div className="w-full xl:w-[35%] flex flex-col gap-3 lg:gap-4 shrink-0 min-w-[320px]">
          
          {/* Card: Smart Rounding Policy */}
          <div className="bg-[var(--dh-bg-surface)] p-5 rounded-2xl shadow-sm border border-[var(--dh-border)] shrink-0 transition-colors">
            <h2 className="font-black text-sm text-[var(--dh-text-main)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calculator size={14} className="text-[var(--dh-text-muted)]"/> ปัดเศษอัตโนมัติ (Psychological Pricing)
            </h2>
            <div className="space-y-3">
              
              {/* ✨ Tactile Radio Card (Custom) */}
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-300 ${config.rounding?.type === 'custom' ? 'border-blue-500 bg-blue-500/5 shadow-sm transform scale-[1.01]' : 'border-[var(--dh-border)] bg-[var(--dh-bg-base)] hover:border-blue-500/30'}`}>
                <input type="radio" name="roundType" value="custom" checked={config.rounding?.type === 'custom'} onChange={() => handleRoundingChange('type', 'custom')} className="mt-1 w-4 h-4 text-blue-600 border-[var(--dh-border)] bg-[var(--dh-bg-surface)] cursor-pointer" />
                <div className="w-full">
                  <p className={`font-black text-xs transition-colors ${config.rounding?.type === 'custom' ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--dh-text-main)]'}`}>เปิดใช้งานปัดเศษ (Custom)</p>
                  
                  {config.rounding?.type === 'custom' && (
                    <div className="mt-3 space-y-3 animate-in fade-in duration-300">
                      <div>
                        <label className="text-[10px] font-bold text-[var(--dh-text-muted)] block mb-1">ให้ราคาลงท้ายด้วย (เงื่อนไข 1)</label>
                        <input 
                          type="text" 
                          placeholder="เช่น 90 หรือ 99" 
                          value={config.rounding?.primaryTarget || ''} 
                          onChange={(e) => handleRoundingChange('primaryTarget', e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full border border-[var(--dh-border)] bg-[var(--dh-bg-surface)] rounded-lg px-3 py-2 text-xs font-bold text-[var(--dh-text-main)] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-inner" 
                        />
                      </div>
                      
                      <div className="pt-3 border-t border-blue-500/10">
                        <label className="flex items-center gap-2 cursor-pointer mb-2.5">
                          <input type="checkbox" checked={config.rounding?.enableFallback || false} onChange={(e) => handleRoundingChange('enableFallback', e.target.checked)} className="w-3.5 h-3.5 rounded text-blue-600 border-[var(--dh-border)] bg-[var(--dh-bg-surface)] cursor-pointer" />
                          <span className="text-[10px] font-black text-[var(--dh-text-main)]">เปิดใช้เงื่อนไขสำรอง (Fallback)</span>
                        </label>
                        
                        {config.rounding?.enableFallback && (
                          <div className="pl-6 animate-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold text-[var(--dh-text-muted)] block mb-1">ถ้าเงื่อนไขแรกใช้ไม่ได้ ให้ลงท้ายด้วย</label>
                            <input 
                              type="text" 
                              placeholder="เช่น 9" 
                              value={config.rounding?.fallbackTarget || ''} 
                              onChange={(e) => handleRoundingChange('fallbackTarget', e.target.value.replace(/[^0-9]/g, ''))}
                              className="w-full border border-[var(--dh-border)] bg-[var(--dh-bg-surface)] rounded-lg px-3 py-2 text-xs font-bold text-[var(--dh-text-main)] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-inner" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* ✨ Tactile Radio Card (None) */}
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-300 ${config.rounding?.type === 'none' ? 'border-[var(--dh-text-muted)] bg-[var(--dh-bg-surface)] shadow-sm transform scale-[1.01]' : 'border-[var(--dh-border)] bg-[var(--dh-bg-base)] hover:border-[var(--dh-text-muted)]'}`}>
                <input type="radio" name="roundType" value="none" checked={config.rounding?.type === 'none'} onChange={() => handleRoundingChange('type', 'none')} className="mt-1 w-4 h-4 text-slate-600 border-[var(--dh-border)] bg-[var(--dh-bg-surface)] cursor-pointer" />
                <div>
                  <p className={`font-black text-xs transition-colors ${config.rounding?.type === 'none' ? 'text-[var(--dh-text-main)]' : 'text-[var(--dh-text-muted)]'}`}>ไม่ปัดเศษ (ตามจริง)</p>
                  <p className="text-[10px] font-bold text-[var(--dh-text-muted)] mt-0.5">ระบบจะใช้ทศนิยมปัดขึ้นตามผลลัพธ์ดิบ</p>
                </div>
              </label>

            </div>
          </div>

          {/* Card: Simulation Tool (Adaptive Artistic Box) */}
          <div className="bg-[var(--dh-bg-surface)] p-5 rounded-2xl shadow-sm border-2 border-indigo-500/20 flex-1 flex flex-col relative overflow-hidden transition-colors">
            <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none"><Calculator size={150} /></div>
            <h2 className="font-black text-sm text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
               จำลองคำนวณราคา (Simulation)
            </h2>
            
            <div className="space-y-4 relative z-10 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest block mb-1">ราคาทุน (Cost)</label>
                  <input type="number" value={simCost} onChange={(e) => setSimCost(e.target.value)} placeholder="เช่น 1500" className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-xl px-3 py-2.5 text-sm font-black text-[var(--dh-text-main)] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest block mb-1">หมวดหมู่</label>
                  <select value={simCategory} onChange={(e) => setSimCategory(e.target.value)} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--dh-text-main)] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner cursor-pointer">
                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="Other">อื่นๆ (ไม่มีกฎ)</option>
                  </select>
                </div>
              </div>

              <button onClick={runSimulation} className="w-full bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 dark:text-indigo-400 hover:text-white border border-indigo-500/30 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95">
                ทดสอบคำนวณราคา
              </button>

              {simResult ? (
                <div className="mt-auto pt-4 border-t border-indigo-500/10 flex flex-col animate-in zoom-in-95 duration-300">
                  {/* ✨ Simulation Glow Effect */}
                  <div className="text-center bg-[var(--dh-bg-base)] rounded-xl p-4 border border-[var(--dh-border)] shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                    
                    <p className="text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest">ราคาขายปลีกสุทธิ (Retail Price)</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums tracking-tighter drop-shadow-sm">฿{simResult.calculatedPrice.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-[var(--dh-text-muted)] mt-1.5 opacity-80">ราคาดิบก่อนปัดเศษ: ฿{simResult.rawPrice.toFixed(2)}</p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs px-2">
                      <span className="font-bold text-[var(--dh-text-muted)]">กำไรสุทธิ:</span>
                      <span className="font-black text-[var(--dh-text-main)] tabular-nums">฿{simResult.margin.toLocaleString()} <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1">({simResult.marginPercent.toFixed(1)}%)</span></span>
                    </div>
                    <div className="flex justify-between items-center text-xs px-2">
                      <span className="font-bold text-[var(--dh-text-muted)]">กฎที่ทำงาน:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px] bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {simResult.appliedRule 
                          ? `${simResult.appliedRule.operator} ${simResult.appliedRule.threshold} | ${simResult.appliedRule.action} ${simResult.appliedRule.value}` 
                          : 'ไม่มี (ขายราคาทุน)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs bg-[var(--dh-bg-base)] p-2.5 rounded-lg border border-[var(--dh-border)] mt-2">
                      <span className="font-bold text-[var(--dh-text-muted)]">สถานะปัดเศษ:</span>
                      <span className="font-black text-amber-600 dark:text-amber-400 text-[10px] uppercase tracking-wider">{simResult.appliedRoundingType}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-auto pt-4 flex-1 flex flex-col items-center justify-center opacity-40 text-[var(--dh-text-muted)] transition-opacity">
                   <Calculator size={40} className="mb-2" strokeWidth={1.5}/>
                   <span className="text-xs font-bold">รอจำลองข้อมูล</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}