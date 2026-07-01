import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export default function FreebieTable({ 
    freebies, 
    loading, 
    handleToggleActive, 
    handleOpenModal, 
    handleDelete 
}) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 whitespace-nowrap">
                        <tr>
                            <th className="px-6 py-4 font-bold">ชื่อแคมเปญ</th>
                            <th className="px-6 py-4 font-bold">ของแถม</th>
                            <th className="px-6 py-4 font-bold text-center">เงื่อนไข</th>
                            <th className="px-6 py-4 font-bold text-center">ลูกค้า</th>
                            <th className="px-6 py-4 font-bold text-center">โควต้า</th>
                            <th className="px-6 py-4 font-bold text-center">สถานะ</th>
                            <th className="px-6 py-4 font-bold text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-400 font-bold">โหลดข้อมูล...</td></tr>
                        ) : freebies.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-400">ยังไม่มีข้อมูลของแถม</td></tr>
                        ) : (
                            freebies.map(item => {
                                const isExpired = item.endDate && new Date(item.endDate) < new Date();
                                const isQuotaFull = item.quotaLimit && (item.quotaUsed || 0) >= item.quotaLimit;
                                const isInactive = !item.isActive || isExpired || isQuotaFull;

                                return (
                                    <tr key={item.id} className={`hover:bg-pink-50/30 group transition-colors ${isInactive ? 'opacity-70 grayscale-[20%]' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{item.title}</div>
                                            {(item.startDate || item.endDate) && (
                                                <div className="text-[10px] text-gray-500 mt-1">
                                                    {item.startDate ? new Date(item.startDate).toLocaleDateString('th-TH') : 'เริ่มทันที'} 
                                                    {' - '} 
                                                    {item.endDate ? new Date(item.endDate).toLocaleDateString('th-TH') : 'ไม่มีกำหนด'}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-pink-600 font-bold bg-pink-50 px-2.5 py-1 rounded-md border border-pink-100 whitespace-nowrap">
                                                {item.itemName} (x{item.qty})
                                            </span>
                                            {item.maxPerBill > 1 && (
                                                <div className="text-[10px] text-gray-500 mt-1 pl-1">สูงสุด {item.maxPerBill} / บิล</div>
                                            )}
                                            {(item.applicableSkus?.length > 0 || item.applicableTypes?.length > 0) && (
                                                <div className="text-[10px] text-gray-500 mt-1 pl-1 font-medium">
                                                    เฉพาะ: {item.applicableSkus?.join(', ')} {item.applicableSkus?.length > 0 && item.applicableTypes?.length > 0 ? '|' : ''} {item.applicableTypes?.join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-600 whitespace-nowrap">
                                            {item.minSpend > 0 ? `ยอดซื้อ ${item.minSpend.toLocaleString()} ฿` : 'แจกทุกบิล'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                                {item.customerType === 'RETAIL' ? 'ปลีก' : 
                                                 item.customerType === 'WHOLESALE' ? 'ส่ง' : 
                                                 item.customerType === 'VIP' ? 'VIP' : 'ทุกคน'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">
                                            {item.quotaLimit ? (
                                                <div className={`text-xs font-bold ${isQuotaFull ? 'text-red-500' : 'text-emerald-600'}`}>
                                                    {item.quotaUsed || 0} / {item.quotaLimit}
                                                    {isQuotaFull && <div className="text-[10px] mt-0.5">(เต็มแล้ว)</div>}
                                                </div>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <button onClick={() => handleToggleActive(item)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.isActive ? 'bg-pink-600' : 'bg-gray-200'}`}>
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-6' : 'translate-x-1'}`}/>
                                                </button>
                                                {isExpired && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 rounded">หมดอายุ</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-white rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-100 mr-1">
                                                <Edit2 size={16}/>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item)} 
                                                className={`p-2 transition-colors bg-white rounded-lg border border-transparent ${item.deletedAt ? 'text-rose-500 hover:bg-rose-100 hover:border-rose-200' : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100'}`}
                                                title={item.deletedAt ? "ลบถาวร" : "ลบชั่วคราว"}
                                            >
                                                <Trash2 size={16}/>
                                            </button>
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
