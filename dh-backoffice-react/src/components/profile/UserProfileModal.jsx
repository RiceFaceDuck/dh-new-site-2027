import { useState, useEffect, useRef } from 'react';
import { User, Phone, Shield, Save, X, Loader2, CheckCircle2 } from 'lucide-react';
import { userService } from '../../firebase/userService';

export default function UserProfileModal({ isOpen, onClose, user, profile }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen && profile) {
      setForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        nickname: profile.nickname || '',
        phone: profile.phone || profile.phoneNumber || ''
      });
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updateData = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nickname: form.nickname.trim(),
        phone: form.phone.trim(),
        displayName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
      };

      await userService.updateUserProfile(user.uid, updateData);
      setSuccessMsg('เธเธฑเธเธ—เธถเธเธเนเธญเธกเธนเธฅเธชเนเธงเธเธ•เธฑเธงเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err) {
      console.error("โ [UserProfileModal] Update Error:", err);
      setErrorMsg('เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธเธฑเธเธ—เธถเธเธเนเธญเธกเธนเธฅ เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเนเธญเธตเธเธเธฃเธฑเนเธ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white/30 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black text-xl border border-white/30 shadow-md">
                {profile?.firstName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h3 className="text-lg font-black tracking-tight">เธ•เธฑเนเธเธเนเธฒเธเนเธญเธกเธนเธฅเธชเนเธงเธเธ•เธฑเธง</h3>
              <p className="text-xs text-blue-100 font-medium">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200/60 dark:border-slate-600">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-bold">
              <Shield size={16} className="text-blue-600 dark:text-blue-400" />
              <span>เธ•เธณเนเธซเธเนเธเธซเธเนเธฒเธ—เธตเน (Role)</span>
            </div>
            <span className="px-2.5 py-1 text-xs font-black rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {profile?.role || 'Staff'}
            </span>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-red-700 dark:text-red-300 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">เธเธทเนเธญเธเธฃเธดเธ *</label>
              <input 
                type="text" 
                name="firstName" 
                required 
                value={form.firstName} 
                onChange={handleChange} 
                placeholder="เน€เธเนเธ เธชเธกเธเธฒเธข" 
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">เธเธฒเธกเธชเธเธธเธฅ *</label>
              <input 
                type="text" 
                name="lastName" 
                required 
                value={form.lastName} 
                onChange={handleChange} 
                placeholder="เน€เธเนเธ เธฃเธฑเธเธ”เธต" 
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">เธเธทเนเธญเน€เธฅเนเธ *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                name="nickname" 
                required 
                value={form.nickname} 
                onChange={handleChange} 
                placeholder="เน€เธเนเธ เธเธญเธข, เธเธฑเธ—" 
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เน</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="tel" 
                name="phone" 
                value={form.phone} 
                onChange={handleChange} 
                placeholder="เน€เธเนเธ 0812345678" 
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all" 
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2.5 px-4 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              เธขเธเน€เธฅเธดเธ
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  <span>เธเธฑเธเธ—เธถเธเธเนเธญเธกเธนเธฅ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
