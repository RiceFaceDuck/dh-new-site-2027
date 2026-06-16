import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Save, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function GlobalKnowledgeSettings() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({ compatibleCreditReward: 2 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRef = doc(db, 'settings', 'knowledge_config');
        const snap = await getDoc(configRef);
        if (snap.exists()) {
          setConfig({ ...config, ...snap.data() });
        }
      } catch (err) {
        console.error("Failed to load knowledge settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleRewardChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setConfig({ ...config, compatibleCreditReward: isNaN(val) ? 0 : val });
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const configRef = doc(db, 'settings', 'knowledge_config');
      await setDoc(configRef, config, { merge: true });
      setIsDirty(false);
      alert('บันทึกการตั้งค่าระบบความรู้สำเร็จ');
    } catch (err) {
      console.error("Save config failed", err);
      alert("บันทึกไม่สำเร็จ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full bg-[var(--dh-bg-base)]"><RefreshCw className="animate-spin text-[var(--dh-accent)]" size={40} /></div>;

  return (
    <div className="flex flex-col h-full bg-[var(--dh-bg-base)] p-3 lg:p-4 overflow-hidden font-sans relative transition-colors duration-300 gap-3 lg:gap-4">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between px-5 py-4 bg-[var(--dh-bg-surface)] rounded-2xl shadow-sm border border-[var(--dh-border)] shrink-0 z-20 transition-all duration-300">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/managers')} className="p-2 hover:bg-[var(--dh-bg-base)] rounded-lg text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] transition-colors active:scale-95">
            <ArrowLeft size={22} strokeWidth={2.5}/>
          </button>
          <div>
            <h1 className="text-xl font-black text-[var(--dh-text-main)] flex items-center gap-2 leading-none">
              <BookOpen className="text-blue-500" size={24} strokeWidth={2.5} /> ตั้งค่าระบบความรู้เพิ่มเติม
            </h1>
            <p className="text-[11px] font-bold text-[var(--dh-text-muted)] mt-1.5 uppercase tracking-wider">Product Knowledge Configuration</p>
          </div>
        </div>
        
        {/* Smart Save Button */}
        <button 
          onClick={handleSave} 
          disabled={saving || !isDirty}
          className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-300 flex items-center gap-2 shadow-sm active:scale-95
            ${isDirty && !saving 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] animate-pulse border border-transparent' 
              : 'bg-[var(--dh-bg-base)] text-[var(--dh-text-muted)] border border-[var(--dh-border)] cursor-not-allowed opacity-60'}
          `}
        >
          {saving ? <RefreshCw className="animate-spin" size={16} strokeWidth={2.5} /> : (isDirty ? <Save size={16} strokeWidth={2.5} /> : <CheckCircle2 size={16} strokeWidth={2.5} />)}
          {saving ? 'กำลังบันทึก...' : isDirty ? 'บันทึกการตั้งค่า' : 'เป็นปัจจุบัน'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 lg:gap-4">
        
        <div className="bg-[var(--dh-bg-surface)] p-6 rounded-2xl border border-[var(--dh-border)] shadow-sm max-w-2xl w-full">
          <div className="mb-6 pb-4 border-b border-[var(--dh-border)]">
            <h2 className="text-lg font-bold text-[var(--dh-text-main)] mb-1">รางวัลเพิ่มความรู้ (Credit Point Reward)</h2>
            <p className="text-sm text-[var(--dh-text-muted)]">กำหนดคะแนนเครดิตที่จะได้รับเมื่อลูกค้าระบุรุ่นหรือพาร์ทที่รองรับ แล้วผู้จัดการกดอนุมัติ</p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[var(--dh-text-main)] flex items-center gap-2">
                 รางวัลคะแนนสำหรับการกด (+) Compatible
              </label>
              <div className="relative w-48">
                <input 
                  type="number"
                  min="0"
                  value={config.compatibleCreditReward}
                  onChange={handleRewardChange}
                  className="w-full pl-4 pr-12 py-3 bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[var(--dh-text-main)] font-bold text-lg"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--dh-text-muted)] pointer-events-none">
                  Credit
                </div>
              </div>
              <p className="text-xs text-[var(--dh-text-muted)] italic">ค่าเริ่มต้น (Default) คือ 2 credit</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
