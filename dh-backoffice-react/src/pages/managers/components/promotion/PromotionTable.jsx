import React from 'react';
import { Percent, Banknote, Edit2, Trash2, Megaphone } from 'lucide-react';

export default function PromotionTable({ promotions, loading, handleToggleActive, handleOpenModal, handleDelete }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 whitespace-nowrap">
                        <tr>
                            <th className="px-6 py-4 font-bold">แคมเปญ / วันที่</th>
                            <th className="px-6 py-4 font-bold text-center">ประเภทส่วนลด</th>
                            <th className="px-6 py-4 font-bold text-center">เงื่อนไข / ลูกค้า</th>
                            <th className="px-6 py-4 font-bold text-center">โควต้า</th>
                            <th className="px-6 py-4 font-bold text-center">สถานะ</th>
                            <th className="px-6 py-4 font-bold text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-400 font-bold">กำลังโหลดข้อมูล...</td></tr>
                        ) : promotions.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-12 text-center text-gray-400">
                                    <div className="flex flex-col items-center">
                                        <Megaphone size={48} className="opacity-20 mb-3" />
                                        <p className="text-lg font-bold text-gray-500">ยังไม่มีโปรโมชันในระบบ</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            promotions.map(promo => {
                                const isExpired = promo.endDate && new Date(promo.endDate) < new Date();
                                const isQuotaFull = promo.quotaLimit && (promo.quotaUsed || 0) >= promo.quotaLimit;
                                const isInactive = !promo.isActive || isExpired || isQuotaFull;

                                return (
                                    <tr key={promo.id} className={`hover:bg-fuchsia-50/30 transition-colors group ${isInactive ? 'opacity-70 grayscale-[20%]' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                                                {promo.title}
                                            </div>
                                            {(promo.startDate || promo.endDate) && (
                                                <div className="text-[10px] text-gray-500 mt-1">
                                                    {promo.startDate ? new Date(promo.startDate).toLocaleDateString('th-TH') : 'เริ่มทันที'} 
                                                    {' - '} 
                                                    {promo.endDate ? new Date(promo.endDate).toLocaleDateString('th-TH') : 'ไม่มีกำหนด'}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${promo.type === 'PERCENTAGE' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                    {promo.type === 'PERCENTAGE' ? <Percent size={14}/> : <Banknote size={14}/>}
                                                    ลด {promo.value}{promo.type === 'PERCENTAGE' ? '%' : ' ฿'}
                                                </span>
                                                {promo.type === 'PERCENTAGE' && promo.maxDiscount > 0 && (
                                                    <span className="text-[10px] text-gray-500">สูงสุด ฿{promo.maxDiscount.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs">
                                            <div className="font-bold text-gray-600 mb-1">
                                                {promo.minSpend > 0 ? `ซื้อครบ ${(promo.minSpend).toLocaleString()} ฿` : 'แจกทุกบิล'}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                                {promo.customerType === 'RETAIL' ? 'ปลีก' : 
                                                 promo.customerType === 'WHOLESALE' ? 'ส่ง' : 
                                                 promo.customerType === 'VIP' ? 'VIP' : 'ทุกคน'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">
                                            {promo.quotaLimit ? (
                                                <div className={`text-xs font-bold ${isQuotaFull ? 'text-red-500' : 'text-emerald-600'}`}>
                                                    {promo.quotaUsed || 0} / {promo.quotaLimit}
                                                    {isQuotaFull && <div className="text-[10px] mt-0.5">(เต็มแล้ว)</div>}
                                                </div>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <button onClick={() => handleToggleActive(promo)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 ${promo.isActive ? 'bg-fuchsia-600' : 'bg-gray-200'}`}>
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promo.isActive ? 'translate-x-6' : 'translate-x-1'}`}/>
                                                </button>
                                                {isExpired && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 rounded">หมดอายุ</span>}
                                                {!isExpired && promo.isActive && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded">ทำงาน</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(promo)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                                <button onClick={() => handleDelete(promo.id, promo.title)} className="p-2 text-gray-400 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
