import React, { useState } from 'react';
import { User, Phone, MapPin, X, UserPlus, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../../../../../firebase/userService';

export default function QuickAddCustomerModal({ isOpen, onClose, initialText = '', onCustomerCreated }) {
  const [name, setName] = useState(initialText || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธเธทเนเธญเธฅเธนเธเธเนเธฒ');
      return;
    }

    setIsSubmitting(true);
    try {
      const customerData = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        taxId: taxId.trim(),
        role: 'member',
        createdAt: new Date()
      };

      const created = await userService.createCustomer(customerData);
      toast.success('เน€เธเธดเนเธกเธเนเธญเธกเธนเธฅเธฅเธนเธเธเนเธฒเธชเธณเน€เธฃเนเธ');
      if (onCustomerCreated) {
        onCustomerCreated(created || { ...customerData, id: `cust_${Date.now()}` });
      }
      onClose();
    } catch (err) {
      console.error('Failed to create customer:', err);
      toast.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เน€เธเธดเนเธกเธเนเธญเธกเธนเธฅเธฅเธนเธเธเนเธฒเนเธ”เน');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserPlus size={18} className="text-indigo-600" />
            เน€เธเธดเนเธกเธเนเธญเธกเธนเธฅเธฅเธนเธเธเนเธฒเธ”เนเธงเธ (Quick Add)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ / เธเธทเนเธญเธฃเนเธฒเธ *
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เธฃเธฐเธเธธเธเธทเนเธญเธฅเธนเธเธเนเธฒ..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เน
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08X-XXX-XXXX"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              เธ—เธตเนเธญเธขเธนเน / เธเนเธญเธกเธนเธฅเธ•เธดเธ”เธ•เนเธญเน€เธเธดเนเธกเน€เธ•เธดเธก
            </label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="เธเนเธฒเธเน€เธฅเธเธ—เธตเน เธ•เธณเธเธฅ เธญเธณเน€เธ เธญ เธเธฑเธเธซเธงเธฑเธ”..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-all"
            >
              เธขเธเน€เธฅเธดเธ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              เธเธฑเธเธ—เธถเธเธเนเธญเธกเธนเธฅ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
