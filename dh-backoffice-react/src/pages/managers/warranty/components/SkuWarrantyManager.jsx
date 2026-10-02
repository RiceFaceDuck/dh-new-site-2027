import { useState } from 'react';
import { Tag, Plus, Trash2, Search, Info } from 'lucide-react';

export default function SkuWarrantyManager({ 
    skus = {}, 
    addSkuOverride, 
    updateSkuOverride, 
    requestDeleteSku 
}) {
    const [newSku, setNewSku] = useState('');
    const [newClaimDays, setNewClaimDays] = useState(365);
    const [newReturnDays, setNewReturnDays] = useState(14);
    const [searchSku, setSearchSku] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        const trimmedSku = newSku.trim().toUpperCase();
        if (!trimmedSku) return;
        addSkuOverride(trimmedSku, newClaimDays, newReturnDays);
        setNewSku('');
        setNewClaimDays(365);
        setNewReturnDays(14);
    };

    const skuEntries = Object.entries(skus || {}).filter(([sku]) => 
        !searchSku || sku.toLowerCase().includes(searchSku.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header / Intro */}
            <div className="bg-blue-50 border border-blue-200/80 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-blue-900 shadow-xs">
                <div className="flex gap-3 items-start">
                    <Tag size={26} className="shrink-0 text-blue-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold leading-relaxed">
                            ตั้งค่าระยะเวลารับประกันพิเศษเฉพาะรหัส SKU ({Object.keys(skus || {}).length} รายการ)
                        </p>
                        <p className="text-xs text-blue-700/90 mt-0.5">
                            สินค้าที่มีรหัส SKU ในรายการนี้จะใช้ระยะเวลารับประกันเฉพาะตัวแทนกติกาหมวดหมู่พื้นฐาน (Priority สูงสุด)
                        </p>
                    </div>
                </div>
            </div>

            {/* Add SKU Form */}
            <form onSubmit={handleAdd} className="bg-white p-5 rounded-2xl border-2 border-blue-300 shadow-xs flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                        รหัส SKU สินค้า
                    </label>
                    <input 
                        type="text"
                        placeholder="เช่น NB-DELL-G15, LP-MAC-M2"
                        value={newSku}
                        onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-hidden focus:border-blue-500 focus:bg-white uppercase"
                        required
                    />
                </div>
                <div className="w-32">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                        เคลมซ่อม (วัน)
                    </label>
                    <input 
                        type="number"
                        min="0"
                        value={newClaimDays}
                        onChange={(e) => setNewClaimDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 text-center outline-hidden focus:border-blue-500 focus:bg-white"
                    />
                </div>
                <div className="w-32">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                        คืนเงิน (วัน)
                    </label>
                    <input 
                        type="number"
                        min="0"
                        value={newReturnDays}
                        onChange={(e) => setNewReturnDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 text-center outline-hidden focus:border-blue-500 focus:bg-white"
                    />
                </div>
                <button 
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 h-[42px]"
                >
                    <Plus size={16} /> เพิ่ม SKU พิเศษ
                </button>
            </form>

            {/* Search SKU Bar */}
            {Object.keys(skus || {}).length > 0 && (
                <div className="relative">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="ค้นหารหัส SKU พิเศษ..."
                        value={searchSku}
                        onChange={(e) => setSearchSku(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden focus:border-blue-500 shadow-2xs"
                    />
                </div>
            )}

            {/* SKU Table / Grid */}
            {skuEntries.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <Info size={32} className="text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">
                        {Object.keys(skus || {}).length === 0 
                            ? 'ยังไม่มีการตั้งค่าประกันพิเศษระดับ SKU' 
                            : 'ไม่พบรหัส SKU ที่ตรงกับคำค้นหา'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-md">
                        หากสินค้ารุ่นใดมีประกันยาวนานหรือพิเศษกว่าหมวดหมู่ทั่วไป (เช่น สินค้ารับประกัน 1 ปี) สามารถเพิ่มรหัส SKU ได้จากแบบฟอร์มด้านบน
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                    <th className="p-3.5 pl-6">รหัส SKU</th>
                                    <th className="p-3.5 text-center w-36">เคลมซ่อม (วัน)</th>
                                    <th className="p-3.5 text-center w-36">คืนเงิน (วัน)</th>
                                    <th className="p-3.5 text-right pr-6 w-24">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {skuEntries.map(([sku, data]) => (
                                    <tr key={sku} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="p-3.5 pl-6 font-black text-slate-800">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <span className="font-mono text-xs">{sku}</span>
                                            </div>
                                        </td>
                                        <td className="p-3.5 text-center">
                                            <input 
                                                type="number"
                                                min="0"
                                                value={data.claimDays ?? 365}
                                                onChange={(e) => updateSkuOverride(sku, 'claimDays', e.target.value)}
                                                className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-center text-slate-700 outline-hidden focus:border-blue-500 focus:bg-white"
                                            />
                                        </td>
                                        <td className="p-3.5 text-center">
                                            <input 
                                                type="number"
                                                min="0"
                                                value={data.returnDays ?? 14}
                                                onChange={(e) => updateSkuOverride(sku, 'returnDays', e.target.value)}
                                                className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-center text-slate-700 outline-hidden focus:border-blue-500 focus:bg-white"
                                            />
                                        </td>
                                        <td className="p-3.5 text-right pr-6">
                                            <button 
                                                type="button"
                                                onClick={() => requestDeleteSku(sku)}
                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                                title="ลบการตั้งค่า SKU นี้"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
