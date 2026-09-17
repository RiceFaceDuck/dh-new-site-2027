import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { historyService } from '../../../firebase/historyService';
import {
  Shield, Award, ArrowUp, ArrowDown, Trash2, Plus, ArrowLeft, BookOpen,
  Save, Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';

const DEFAULT_CONFIG = {
  roles: [
    { id: 'member', name: 'Member / General', level: 1, description: 'เธฅเธนเธเธเนเธฒเธ—เธฑเนเธงเนเธ / เธชเธกเธฒเธเธดเธเน€เธฃเธดเนเธกเธ•เนเธ', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200', defaultPriceTier: 'retail' },
    { id: 'wholesale', name: 'Wholesale / Mechanic', level: 2, description: 'เธเนเธฒเธเธเนเธญเธก / เธฃเธฒเธเธฒเธชเนเธเธ—เธฑเนเธงเนเธ', badgeColor: 'bg-orange-50 text-orange-700 border-orange-200', defaultPriceTier: 'wholesale' },
    { id: 'partner', name: 'VIP / Retail Partner', level: 3, description: 'เธฃเนเธฒเธเธเนเธฒเธเธฑเธเธเธกเธดเธ•เธฃ / VIP', badgeColor: 'bg-slate-800 text-white border-slate-800', defaultPriceTier: 'partner' },
    { id: 'enterprise', name: 'Enterprise Partner', level: 4, description: 'เธเธนเนเธเนเธฒเนเธซเธเนเธฃเธฐเธ”เธฑเธเธญเธเธเนเธเธฃ / เธชเธฑเธเธเธฒเธฃเธฒเธขเธเธต', badgeColor: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', defaultPriceTier: 'enterprise' }
  ],
  tiers: [
    { id: 'member', name: 'Member', icon: '๐', minPoints: 0, multiplier: 1, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'silver', name: 'Silver', icon: '๐ฅ', minPoints: 1000, multiplier: 1.05, color: 'bg-slate-50 text-slate-600 border-slate-200' },
    { id: 'gold', name: 'Gold', icon: '๐ฅ', minPoints: 5000, multiplier: 1.1, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { id: 'platinum', name: 'Platinum', icon: '๐‘‘', minPoints: 10000, multiplier: 1.2, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { id: 'diamond', name: 'Diamond', icon: '๐’', minPoints: 100000, multiplier: 1.5, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' }
  ],
  hierarchyPolicy: {
    allowManualRoleOverride: true,
    autoTierCalculation: true,
    inheritTierDiscount: true
  }
};

function useRoleTierSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const ref = doc(db, 'settings', 'role_tier_config');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSettings({ ...DEFAULT_CONFIG, ...snap.data() });
      } else {
        setSettings(DEFAULT_CONFIG);
      }
    } catch (err) {
      console.error('Error fetching Role/Tier settings:', err);
      toast.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เนเธซเธฅเธ”เธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ Role/Tier เนเธ”เน');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings) => {
    try {
      const ref = doc(db, 'settings', 'role_tier_config');
      await setDoc(ref, { ...newSettings, updatedAt: serverTimestamp() }, { merge: true });
      setSettings(newSettings);
      historyService.addLog({
        module: 'SECURITY',
        action: 'UPDATE_ROLE_TIER_CONFIG',
        target: { id: 'role_tier_config' },
        details: { legacy_details: 'เธญเธฑเธเน€เธ”เธ•เนเธเธฃเธเธชเธฃเนเธฒเธเธเธฒเธฃเธเธฑเธ”เธฅเธณเธ”เธฑเธเธเธฑเนเธ Role/Tier' }
      });
      toast.success('เธเธฑเธเธ—เธถเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ Role/Tier เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง');
      return true;
    } catch (err) {
      console.error('Error saving Role/Tier settings:', err);
      toast.error('เธเธฑเธเธ—เธถเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒเนเธกเนเธชเธณเน€เธฃเนเธ');
      return false;
    }
  };

  return { settings, loading, saveSettings };
}

export default function RoleTierSettingsPage() {
  const { settings, loading, saveSettings } = useRoleTierSettings();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex-1 bg-dh-bg p-4 sm:p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-dh-main flex items-center gap-2">
              <Shield className="text-indigo-600" size={24} />
              เธฃเธฐเธเธเธเธฑเธ”เธฅเธณเธ”เธฑเธเธเธฑเนเธเนเธฅเธฐเธชเธดเธ—เธเธดเนเธฅเธนเธเธเนเธฒ (Role & Tier Management)
            </h1>
            <p className="text-xs text-dh-muted mt-1">
              เธเธฑเธ”เธเธฒเธฃเธฅเธณเธ”เธฑเธเธชเธดเธ—เธเธดเนเธเธฒเธฃเธกเธญเธเน€เธซเนเธเธชเธดเธเธเนเธฒ (Role Hierarchy) เนเธฅเธฐเธฃเธฐเธ”เธฑเธเนเธ•เนเธกเธชเธฐเธชเธก Gamification (Tier Multiplier)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/managers')}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-xs active:scale-95"
            >
              <ArrowLeft size={14} /> เธขเนเธญเธเธเธฅเธฑเธ
            </button>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <BookOpen size={14} /> เธเธนเนเธกเธทเธญเธเธฒเธฃเนเธเนเธเธฒเธ (Guide)
            </button>
          </div>
        </div>

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
    </div>
  );
}

function RoleTierForm({ initialSettings, onSave }) {
  const [formData, setFormData] = useState(initialSettings || DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);

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
      description: 'เธเธณเธญเธเธดเธเธฒเธขเธชเธดเธ—เธเธดเนเนเธซเธกเน',
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
      icon: 'โญ',
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
      {/* Roles Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="text-indigo-600" size={18} />
              เธฅเธณเธ”เธฑเธเธเธฑเนเธเธชเธดเธ—เธเธดเนเนเธฅเธฐเธเธฃเธฐเน€เธ เธ—เธฅเธนเธเธเนเธฒ (Customer Roles & Hierarchy)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เธเธฑเธ”เน€เธฃเธตเธขเธเธฃเธฐเธ”เธฑเธเธชเธดเธ—เธเธดเนเธเธฒเธเธฅเนเธฒเธเธเธถเนเธเธเธ (Level 1 = เธ•เนเธณเธชเธธเธ”, Level เธชเธนเธเธชเธธเธ” = เธชเธดเธ—เธเธดเนเธเธดเน€เธจเธฉเธกเธฒเธเธ—เธตเนเธชเธธเธ”)
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddRole}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-all shadow-xs"
          >
            <Plus size={14} /> เน€เธเธดเนเธก Role
          </button>
        </div>

        <div className="space-y-3">
          {formData.roles.map((role, idx) => (
            <div
              key={role.id || idx}
              className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-3 shadow-xs"
            >
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveRole(idx, -1)}
                    className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded-sm hover:bg-slate-200"
                    title="เธเธขเธฑเธเธเธถเนเธ"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === formData.roles.length - 1}
                    onClick={() => handleMoveRole(idx, 1)}
                    className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded-sm hover:bg-slate-200"
                    title="เธเธขเธฑเธเธฅเธ"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
                <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono font-black text-xs rounded-lg shadow-xs">
                  L{role.level || idx + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    เธเธทเนเธญ Role / เธ•เธณเนเธซเธเนเธ
                  </label>
                  <input
                    type="text"
                    value={role.name || ''}
                    onChange={(e) => handleRoleChange(idx, 'name', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="เน€เธเนเธ Member, Partner"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    เธเธณเธญเธเธดเธเธฒเธขเธชเธดเธ—เธเธดเน
                  </label>
                  <input
                    type="text"
                    value={role.description || ''}
                    onChange={(e) => handleRoleChange(idx, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="เธเธณเธญเธเธดเธเธฒเธขเธชเธฑเนเธเน"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    เธฃเธฐเธ”เธฑเธเธฃเธฒเธเธฒเธชเธดเธเธเนเธฒเน€เธฃเธดเนเธกเธ•เนเธ
                  </label>
                  <select
                    value={role.defaultPriceTier || 'retail'}
                    onChange={(e) => handleRoleChange(idx, 'defaultPriceTier', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="retail">เธฃเธฒเธเธฒเธเธฅเธตเธ (Retail)</option>
                    <option value="wholesale">เธฃเธฒเธเธฒเธชเนเธ (Wholesale)</option>
                    <option value="partner">เธฃเธฒเธเธฒเธเธฒเธฃเนเธ—เน€เธเธญเธฃเน (Partner)</option>
                    <option value="enterprise">เธฃเธฒเธเธฒเธญเธเธเนเธเธฃ (Enterprise)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveRole(idx)}
                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0"
                title="เธฅเธ Role"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tiers Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="text-amber-500" size={18} />
              เธฃเธฐเธ”เธฑเธเนเธ•เนเธกเธชเธฐเธชเธก Gamification (Tiers & Multipliers)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เธเธณเธซเธเธ”เน€เธเธ“เธ‘เนเนเธ•เนเธกเธชเธฐเธชเธกเธฃเธงเธก (Accumulated Points) เนเธฅเธฐเธ•เธฑเธงเธเธนเธ“เนเธเธเนเธ•เนเธกเน€เธเธดเนเธก
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddTier}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-bold rounded-lg transition-all shadow-xs"
          >
            <Plus size={14} /> เน€เธเธดเนเธก Tier
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
                  />
                  <input
                    type="text"
                    value={tier.name || ''}
                    onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                    className="font-bold text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveTier(idx)}
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="เธฅเธ Tier"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    เนเธ•เนเธกเธชเธฐเธชเธกเธเธฑเนเธเธ•เนเธณ
                  </label>
                  <input
                    type="number"
                    value={tier.minPoints ?? 0}
                    onChange={(e) => handleTierChange(idx, 'minPoints', Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-2.5 py-1 font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    Multiplier (เธ•เธฑเธงเธเธนเธ“เนเธ•เนเธก)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={tier.multiplier ?? 1}
                    onChange={(e) => handleTierChange(idx, 'multiplier', Number(e.target.value) || 1)}
                    className="w-full px-2.5 py-1 font-mono font-bold text-indigo-600 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'เธเธณเธฅเธฑเธเธเธฑเธเธ—เธถเธ...' : 'เธเธฑเธเธ—เธถเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒ Role/Tier'}
        </button>
      </div>
    </form>
  );
}
