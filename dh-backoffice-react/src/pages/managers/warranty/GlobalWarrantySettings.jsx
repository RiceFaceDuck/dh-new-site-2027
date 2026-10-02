import { useState, useMemo } from 'react';
import { ShieldCheck, Loader2, Sparkles, Plus, AlertCircle, Search, Tag, Layers } from 'lucide-react';
import GlobalSettingsHeader from '../../../components/managers/GlobalSettingsHeader';
import SaveConfirmationModal from '../../../components/managers/SaveConfirmationModal';
import WarrantyCategoryCard from './components/WarrantyCategoryCard';
import SkuWarrantyManager from './components/SkuWarrantyManager';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { useWarrantyManager } from './hooks/useWarrantyManager';

export default function GlobalWarrantySettings() {
    const {
        isLoading,
        isSaving,
        isModalOpen, setIsModalOpen,
        changesDiff,
        warrantyConfig,
        unconfiguredCount,
        updateCategory,
        addCategory,
        removeCategory,
        confirmDeleteCategory,
        addSkuOverride,
        updateSkuOverride,
        requestDeleteSku,
        confirmDeleteSku,
        deleteModal,
        setDeleteModal,
        searchTerm,
        setSearchTerm,
        activeTab,
        setActiveTab,
        filterOnlyNew,
        setFilterOnlyNew,
        handlePreSave,
        handleSave
    } = useWarrantyManager();

    const [newCatInput, setNewCatInput] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddSubmit = (e) => {
        e.preventDefault();
        if (!newCatInput.trim()) return;
        addCategory(newCatInput.trim());
        setNewCatInput('');
        setShowAddForm(false);
    };

    const totalCategoriesCount = Object.keys(warrantyConfig?.categories || {}).length;
    const totalSkusCount = Object.keys(warrantyConfig?.skus || {}).length;

    const filteredCategories = useMemo(() => {
        return Object.entries(warrantyConfig?.categories || {}).filter(([catName, data]) => {
            const matchesSearch = !searchTerm || catName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesNewFilter = !filterOnlyNew || data.isUnconfigured;
            return matchesSearch && matchesNewFilter;
        });
    }, [warrantyConfig?.categories, searchTerm, filterOnlyNew]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 size={32} className="animate-spin mb-3 text-amber-500" />
                <span className="font-bold text-sm">กำลังโหลดข้อมูลและสแกนหมวดหมู่สินค้าที่มีจริงในระบบ...</span>
            </div>
        );
    }

    return (
        <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
            <SaveConfirmationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleSave}
                changes={changesDiff}
                isSaving={isSaving}
            />

            <DeleteConfirmationModal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, type: '', targetId: '' })}
                onConfirm={deleteModal.type === 'category' ? confirmDeleteCategory : confirmDeleteSku}
                type={deleteModal.type}
                targetId={deleteModal.targetId}
            />

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative flex flex-col min-h-[60vh]">
                <GlobalSettingsHeader 
                    title="กติกาการรับประกัน" 
                    icon={ShieldCheck}
                    onSave={handlePreSave}
                    isSaving={isSaving}
                />

                {/* Sub Navigation Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 sm:px-10 pt-3 gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('categories')}
                        className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-2 border-t-2 border-x-2 ${
                            activeTab === 'categories'
                                ? 'bg-white border-slate-200 border-b-transparent text-amber-600 shadow-2xs'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                        <Layers size={15} />
                        <span>หมวดหมู่สินค้า</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                            {totalCategoriesCount}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('skus')}
                        className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-2 border-t-2 border-x-2 ${
                            activeTab === 'skus'
                                ? 'bg-white border-slate-200 border-b-transparent text-blue-600 shadow-2xs'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                        <Tag size={15} />
                        <span>ประกันพิเศษเฉพาะรหัส SKU</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                            {totalSkusCount}
                        </span>
                    </button>
                </div>

                <div className="flex-1 p-6 sm:p-10 relative bg-slate-50/50">
                    <div className="space-y-6 max-w-full mx-auto">
                        {activeTab === 'categories' ? (
                            <>
                                {/* Categories Banner */}
                                <div className="bg-amber-50 border border-amber-200/80 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-amber-900 shadow-xs">
                                    <div className="flex gap-3 items-start">
                                        <ShieldCheck size={26} className="shrink-0 text-amber-500 mt-0.5"/>
                                        <div>
                                            <p className="text-sm font-bold leading-relaxed">
                                                ตั้งค่าการรับประกันพื้นฐานแบ่งตามหมวดหมู่สินค้าที่มีจริงในระบบ ({totalCategoriesCount} หมวด)
                                            </p>
                                            <p className="text-xs text-amber-700/90 mt-0.5">
                                                (หากสินค้านั้นไม่มีการตั้งค่าประกันพิเศษระดับ SKU ระบบจะใช้ค่าจากหน้านี้เป็นหลักในการคำนวณวันหมดประกัน)
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(!showAddForm)}
                                        className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                                    >
                                        <Plus size={16} /> เพิ่มหมวดหมู่ประกัน
                                    </button>
                                </div>

                                {/* Warning Badge for Unconfigured Categories */}
                                {unconfiguredCount > 0 && (
                                    <div className="bg-orange-500 text-white p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle size={24} className="shrink-0 animate-bounce" />
                                            <div className="text-xs sm:text-sm font-bold">
                                                ตรวจพบ {unconfiguredCount} หมวดหมู่สินค้าใหม่ที่มีจริงใน DB แต่ยังไม่ได้บันทึกตั้งค่าวันรับประกัน! (สังเกตการ์ดที่มีป้าย ✨ หมวดหมู่ใหม่)
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFilterOnlyNew(!filterOnlyNew)}
                                            className="shrink-0 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors"
                                        >
                                            {filterOnlyNew ? 'ดูทั้งหมด' : 'กรองดูเฉพาะหมวดใหม่'}
                                        </button>
                                    </div>
                                )}

                                {/* Search & Filter Bar */}
                                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                                    <div className="relative w-full sm:w-80">
                                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text"
                                            placeholder="ค้นหาหมวดหมู่ เช่น PANEL, BATTERY..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-hidden focus:border-amber-500 shadow-2xs"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setFilterOnlyNew(false)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                                !filterOnlyNew 
                                                    ? 'bg-amber-100 text-amber-800' 
                                                    : 'text-slate-500 hover:bg-slate-200/60'
                                            }`}
                                        >
                                            ทั้งหมด ({totalCategoriesCount})
                                        </button>
                                        {unconfiguredCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setFilterOnlyNew(true)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                                                    filterOnlyNew 
                                                        ? 'bg-orange-500 text-white' 
                                                        : 'text-orange-600 hover:bg-orange-50'
                                                }`}
                                            >
                                                <Sparkles size={12} /> หมวดใหม่ ({unconfiguredCount})
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Add Category Form */}
                                {showAddForm && (
                                    <form onSubmit={handleAddSubmit} className="bg-white p-4 rounded-2xl border-2 border-amber-400 shadow-sm flex items-center gap-3 animate-in fade-in">
                                        <input 
                                            type="text"
                                            placeholder="กรอกชื่อหมวดหมู่ใหม่ เช่น RAM, SSD, Charger"
                                            value={newCatInput}
                                            onChange={(e) => setNewCatInput(e.target.value)}
                                            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-hidden focus:border-amber-500 focus:bg-white"
                                            autoFocus
                                        />
                                        <button 
                                            type="submit"
                                            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                                        >
                                            เพิ่มการ์ด
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setShowAddForm(false)}
                                            className="px-3 py-2.5 text-slate-500 hover:text-slate-700 text-xs font-bold"
                                        >
                                            ยกเลิก
                                        </button>
                                    </form>
                                )}

                                {/* Category Cards Grid */}
                                {filteredCategories.length === 0 ? (
                                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
                                        <p className="text-sm font-bold text-slate-600">ไม่พบหมวดหมู่ที่ตรงกับคำค้นหา</p>
                                        <p className="text-xs text-slate-400 mt-1">ลองล้างคำค้นหาหรือพิมพ์ชื่อหมวดหมู่อื่น</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                        {filteredCategories.map(([catName, data]) => (
                                            <WarrantyCategoryCard
                                                key={catName}
                                                catName={catName}
                                                data={data}
                                                updateCategory={updateCategory}
                                                removeCategory={removeCategory}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            /* SKU Overrides Tab */
                            <SkuWarrantyManager 
                                skus={warrantyConfig?.skus}
                                addSkuOverride={addSkuOverride}
                                updateSkuOverride={updateSkuOverride}
                                requestDeleteSku={requestDeleteSku}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
