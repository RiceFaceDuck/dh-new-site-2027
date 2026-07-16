import { useState, useEffect } from 'react';
import { Search, X, ShieldCheck, ShieldAlert, Loader2, Package, Calendar } from 'lucide-react';
import { warrantyService } from '../../firebase/warrantyService';
import { differenceInDays } from 'date-fns';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';

export default function WarrantyCheckModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null); // { order: {}, items: [] }
  const [errorMsg, setErrorMsg] = useState('');
  const [warrantyConfig, setWarrantyConfig] = useState(null);

  useEffect(() => {
    if (isOpen) {
      warrantyService.getWarrantySettings().then(setWarrantyConfig).catch(console.error);
    } else {
      setSearchTerm('');
      setResults(null);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setErrorMsg('');
    setResults(null);

    try {
      const { billingQueryService } = await import('../../firebase/billingQueryService');
      const orderData = await billingQueryService.getOrderByOrderId(searchTerm);

      if (!orderData) {
        setErrorMsg(`ไม่พบข้อมูลบิลรหัส: ${searchTerm}`);
      } else {
        setResults({ order: orderData, items: orderData.items || [] });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่');
    } finally {
      setIsSearching(false);
    }
  };

  const getWarrantyStatus = (item, orderDateStr) => {
    if (!warrantyConfig || !orderDateStr) return null;
    
    const purchaseDate = new Date(orderDateStr);
    const passedDays = differenceInDays(new Date(), purchaseDate);
    
    let claimDays = 30; // Default General
    let categoryKey = 'General';
    
    const itemCat = item.category || item.category1 || '';
    if (itemCat) {
       for (const key of Object.keys(warrantyConfig.categories || {})) {
           if (itemCat.toLowerCase().includes(key.toLowerCase())) {
               claimDays = warrantyConfig.categories[key].claimDays;
               categoryKey = key;
               break;
           }
       }
    }

    if (warrantyConfig.skus?.[item.sku]) {
        claimDays = warrantyConfig.skus[item.sku].claimDays;
    }

    const remainingDays = claimDays - passedDays;
    const isExpired = remainingDays < 0;

    return { claimDays, passedDays, remainingDays, isExpired, categoryKey };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">ตรวจสอบสถานะประกัน</h2>
              <p className="text-xs font-bold text-slate-500 mt-0.5">ค้นหาจากรหัสบิล (Order ID)</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto bg-slate-50/50">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative group">
              <input
                type="text"
                placeholder="กรอกรหัสบิล เช่น DH-2401-ABCDE"
                className="w-full h-12 pl-12 pr-4 bg-white border-2 border-slate-200 focus:border-cyan-500 rounded-lg outline-hidden text-sm font-bold text-slate-800 uppercase shadow-xs transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={20} />
              <button 
                type="submit" 
                disabled={isSearching || !searchTerm}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center"
              >
                {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'ค้นหา'}
              </button>
            </div>
            {errorMsg && <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1"><X size={14}/> {errorMsg}</p>}
          </form>

          {results && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Order ID</p>
                    <p className="text-sm font-black text-slate-800">{results.order.orderId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">วันที่สั่งซื้อ</p>
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Calendar size={12}/> 
                      {results.order.createdAt ? new Date(results.order.createdAt.toDate ? results.order.createdAt.toDate() : results.order.createdAt).toLocaleString('th-TH') : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">ลูกค้า</p>
                    <p className="text-xs font-bold text-slate-800">{getCustomerDisplayName(results.order.customer, 'Walk-in')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5"><Package size={14} className="text-slate-400"/> รายการสินค้า ({results.items.length})</h3>
                  <div className="grid gap-3">
                    {results.items.map((item, idx) => {
                      const orderDate = results.order.createdAt?.toDate ? results.order.createdAt.toDate() : results.order.createdAt;
                      const wStatus = getWarrantyStatus(item, orderDate);
                      
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.nameAtPurchase || item.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">SKU: <span className="text-slate-700">{item.sku}</span> | จำนวน: {item.qty} ชิ้น</p>
                          </div>
                          
                          {wStatus ? (
                            <div className={`flex flex-col items-end shrink-0 px-3 py-1.5 rounded-md border ${wStatus.isExpired ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                              <div className="flex items-center gap-1.5 text-xs font-black">
                                {wStatus.isExpired ? <ShieldAlert size={14}/> : <ShieldCheck size={14}/>}
                                {wStatus.isExpired ? 'หมดประกันแล้ว' : 'อยู่ในประกัน'}
                              </div>
                              <p className={`text-[9px] font-bold mt-0.5 ${wStatus.isExpired ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {wStatus.isExpired ? `หมดมาแล้ว ${Math.abs(wStatus.remainingDays)} วัน` : `เหลืออีก ${wStatus.remainingDays} วัน (รวม ${wStatus.claimDays} วัน)`}
                              </p>
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold text-slate-400">-</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex justify-end">
           <button onClick={onClose} className="px-5 py-2 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
              ปิดหน้าต่าง
           </button>
        </div>
      </div>
    </div>
  );
}
