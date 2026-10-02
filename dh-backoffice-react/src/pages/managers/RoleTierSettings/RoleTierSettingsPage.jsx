import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Award, ArrowUp, ArrowDown, Trash2, Plus, ArrowLeft, BookOpen,
  Save, CheckCircle2, AlertCircle, X, Sparkles, Layers, HelpCircle, Star, Crown
} from 'lucide-react';
import { useRoleTierSettingsState, DEFAULT_ROLE_TIER_SETTINGS } from './hooks/useRoleTierSettingsState';

/**
 * 📖 In-App Documentation Modal for Role & Tier Management
 */
function RoleTierGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                คู่มือการใช้งานระบบลำดับชั้นและแต้มสะสม (Role & Tier Guide)
              </h3>
              <p className="text-[11px] text-slate-500">
                ทำความเข้าใจความแตกต่างและการเชื่อมโยงระหว่าง Role และ Gamification Tier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {/* Card 1: Role */}
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-2">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-xs flex items-center gap-2">
              <Shield size={15} className="text-indigo-600" />
              1. ลำดับชั้นสิทธิ์และบทบาท (Customer Roles & Hierarchy)
            </h4>
            <p>
              <strong>Role</strong> ใช้กำหนดสถานะคู่ค้าและสิทธิ์การได้รับราคาขายส่งหรือปลีกเริ่มต้นในระบบ POS และระบบสั่งซื้อ:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Level 1 (ต่ำสุด):</strong> สมาชิกเริ่มต้น / ลูกค้าทั่วไป (Retail Price)</li>
              <li><strong>Level สูงขึ้น:</strong> ร้านช่าง / พันธมิตรการค้า / องค์กร (Wholesale / Partner Price)</li>
              <li><strong>การทำงาน:</strong> เมื่อแคชเชียร์เลือกลูกค้าในหน้า POS ระบบจะดึงระดับราคาเริ่มต้นตาม Role ของลูกค้ารายนั้นอัตโนมัติ</li>
            </ul>
          </div>

          {/* Card 2: Tier */}
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl space-y-2">
            <h4 className="font-bold text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2">
              <Award size={15} className="text-amber-600" />
              2. ระดับแต้มสะสม Gamification (Tiers & Multipliers)
            </h4>
            <p>
              <strong>Tier</strong> คือระดับขั้นความภักดีของลูกค้าที่ระบบเลื่อนระดับให้อัตโนมัติจากยอดแต้มสะสมรวม (Accumulated Points):
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>ตัวคูณแต้ม (Multiplier):</strong> ลูกค้าระดับสูงจะได้รับแต้มทวีคูณเมื่อซื้อสินค้า เช่น ตัวคูณ 1.20 หมายถึงได้รับแต้มเพิ่มขึ้น 20% จากยอดซื้อ</li>
              <li><strong>การเลื่อนระดับอัตโนมัติ:</strong> คำนวณจากแต้มสะสมตลอดชีพ ไม่ลดระดับแม้จะนำแต้มไปแลกของรางวัลแล้ว</li>
            </ul>
          </div>

          {/* Card 3: Best Practices */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600" />
              3. ข้อแนะนำในการตั้งค่า
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
              <li>ระดับแต้มสะสมขั้นต่ำควรเรียงลำดับจากน้อยไปมากเสมอ (เช่น Member 0 &rarr; Silver 1,000 &rarr; Gold 5,000)</li>
              <li>ตัวคูณแต้มควรมีค่าอย่างน้อย 1.0 ขึ้นไปเสมอ เพื่อให้สิทธิประโยชน์เติบโตตามระดับชั้น</li>
              <li>ควรระมัดระวังการลบ Role ที่มีลูกค้าผูกสิทธิ์อยู่จริงในระบบ CRM</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            เข้าใจแล้ว ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 🌟 Form Component for Editing Roles and Tiers
 */
function RoleTierForm({ initialSettings, onSave }) {
  const [formData, setFormData] = useState(initialSettings || DEFAULT_ROLE_TIER_SETTINGS);
  const [saving, setSaving] = useState(false);

  // Sync form data if initialSettings update
  useEffect(() => {
    if (initialSettings) {
      setFormData(initialSettings);
    }
  }, [initialSettings]);

  const handleRoleChange = (idx, field, val) => {
    const newRoles = [...formData.roles];
    newRoles[idx] = { ...newRoles[idx], [field]: val };
    setFormData((prev) => ({ ...prev, roles: newRoles }));
  };

  const handleMoveRole = (idx, dir) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= formData.roles.length) return;
    const newRoles = [...formData.roles];
    const temp = newRoles[idx];
    newRoles[idx] = newRoles[targetIdx];
    newRoles[targetIdx] = temp;
    const reordered = newRoles.map((r, i) => ({ ...r, level: i + 1 }));
    setFormData((prev) => ({ ...prev, roles: reordered }));
  };

  const handleAddRole = () => {
    const newRole = {
      id: `role_${Date.now()}`,
      name: 'New Role',
      level: formData.roles.length + 1,
      description: 'คำอธิบายสิทธิ์และเงื่อนไขใหม่',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      defaultPriceTier: 'retail'
    };
    setFormData((prev) => ({ ...prev, roles: [...prev.roles, newRole] }));
  };

  const handleRemoveRole = (idx) => {
    if (formData.roles.length <= 1) return;
    const filtered = formData.roles.filter((_, i) => i !== idx).map((r, i) => ({ ...r, level: i + 1 }));
    setFormData((prev) => ({ ...prev, roles: filtered }));
  };

  const handleTierChange = (idx, field, val) => {
    const newTiers = [...formData.tiers];
    newTiers[idx] = { ...newTiers[idx], [field]: val };
    setFormData((prev) => ({ ...prev, tiers: newTiers }));
  };

  const handleAddTier = () => {
    const newTier = {
      id: `tier_${Date.now()}`,
      name: 'New Tier',
      icon: '⭐',
      minPoints: 20000,
      multiplier: 1.25,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    };
    setFormData((prev) => ({ ...prev, tiers: [...prev.tiers, newTier] }));
  };

  const handleRemoveTier = (idx) => {
    if (formData.tiers.length <= 1) return;
    const filtered = formData.tiers.filter((_, i) => i !== idx);
    setFormData((prev) => ({ ...prev, tiers: filtered }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 🛡️ Roles Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="text-indigo-600" size={18} />
              ลำดับชั้นสิทธิ์และประเภทลูกค้า (Customer Roles & Hierarchy)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดเรียงระดับสิทธิ์จากล่างขึ้นบน (Level 1 = ต่ำสุด, Level สูงสุด = สิทธิพิเศษมากที่สุด)
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddRole}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} /> เพิ่ม Role
          </button>
        </div>

        <div className="space-y-3">
          {formData.roles.map((role, idx) => (
            <div
              key={role.id || idx}
              className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-3 shadow-xs"
            >
              {/* Level & Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveRole(idx, -1)}
                    className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 rounded-sm hover:bg-slate-200 cursor-pointer disabled:cursor-not-allowed"
                    title="ขยับขึ้น"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === formData.roles.length - 1}
                    onClick={() => handleMoveRole(idx, 1)}
                    className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 rounded-sm hover:bg-slate-200 cursor-pointer disabled:cursor-not-allowed"
                    title="ขยับลง"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
                <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono font-black text-xs rounded-lg shadow-xs">
                  L{role.level || idx + 1}
                </span>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    ชื่อ Role / ตำแหน่ง
                  </label>
                  <input
                    type="text"
                    value={role.name || ''}
                    onChange={(e) => handleRoleChange(idx, 'name', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="เช่น Member, ร้านช่าง, พาร์ทเนอร์"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    คำอธิบายสิทธิ์
                  </label>
                  <input
                    type="text"
                    value={role.description || ''}
                    onChange={(e) => handleRoleChange(idx, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="คำอธิบายสั้นๆ"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    ระดับราคาสินค้าเริ่มต้น
                  </label>
                  <select
                    value={role.defaultPriceTier || 'retail'}
                    onChange={(e) => handleRoleChange(idx, 'defaultPriceTier', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="retail">ราคาปลีก (Retail)</option>
                    <option value="wholesale">ราคาส่ง (Wholesale)</option>
                    <option value="partner">ราคาพาร์ทเนอร์ (Partner)</option>
                    <option value="enterprise">ราคาองค์กร (Enterprise)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <button
                type="button"
                onClick={() => handleRemoveRole(idx)}
                disabled={formData.roles.length <= 1}
                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                title="ลบ Role"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 🏆 Tiers Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="text-amber-500" size={18} />
              ระดับแต้มสะสม Gamification (Tiers & Multipliers)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กำหนดเกณฑ์แต้มสะสมรวม (Accumulated Points) และตัวคูณแจกแต้มเพิ่ม
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddTier}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} /> เพิ่ม Tier
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {formData.tiers.map((tier, idx) => (
            <div
              key={tier.id || idx}
              className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 shadow-xs relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tier.icon || ''}
                    onChange={(e) => handleTierChange(idx, 'icon', e.target.value)}
                    className="w-10 px-2 py-1 text-center text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none"
                    title="ไอคอนหรืออิโมจิ"
                  />
                  <input
                    type="text"
                    value={tier.name || ''}
                    onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                    className="font-bold text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 outline-none"
                    placeholder="ชื่อ Tier"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveTier(idx)}
                  disabled={formData.tiers.length <= 1}
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  title="ลบ Tier"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    แต้มสะสมขั้นต่ำ
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tier.minPoints ?? 0}
                    onChange={(e) => handleTierChange(idx, 'minPoints', Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-2.5 py-1 font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    Multiplier (ตัวคูณแต้ม)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    value={tier.multiplier ?? 1}
                    onChange={(e) => handleTierChange(idx, 'multiplier', Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-2.5 py-1 font-mono font-bold text-indigo-600 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า Role/Tier'}
        </button>
      </div>
    </form>
  );
}

/**
 * 🛡️ Main Page Component for Role & Tier Management
 */
export default function RoleTierSettingsPage() {
  const { settings, loading, saveSettings } = useRoleTierSettingsState();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex-1 bg-dh-bg p-4 sm:p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-dh-main flex items-center gap-2">
              <Shield className="text-indigo-600" size={24} />
              ระบบจัดลำดับขั้นและสิทธิ์ลูกค้า (Role & Tier Management)
            </h1>
            <p className="text-xs text-dh-muted mt-1">
              จัดการลำดับสิทธิ์การมองเห็นสินค้า (Role Hierarchy) และระดับแต้มสะสม Gamification (Tier Multiplier)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/managers')}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={14} /> ย้อนกลับ
            </button>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <BookOpen size={14} /> คู่มือการใช้งาน (Guide)
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {loading ? (
            <div className="animate-pulse space-y-4 py-8">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3" />
              <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
            </div>
          ) : (
            <RoleTierForm initialSettings={settings} onSave={saveSettings} />
          )}
        </div>
      </div>

      {/* Guide Modal */}
      <RoleTierGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
