import { PlusCircle, RefreshCw } from 'lucide-react';
import { HighlightText } from '../HighlightText';

const renderPills = (data, highlightData, emptyText = 'n/a') => {
  if (!data) return <span className="text-slate-400 font-medium italic text-xs">{emptyText}</span>;
  let items = [];
  if (Array.isArray(data)) {
    items = data;
  } else if (typeof data === 'string') {
    items = data.split(/,|\n/).map(s => s.trim()).filter(Boolean);
  }
  if (items.length === 0) return <span className="text-slate-400 font-medium italic text-xs">{emptyText}</span>;

  return (
    <div className="flex flex-wrap gap-1.5 py-0.5">
      {items.map((item, idx) => (
        <span 
          key={idx} 
          className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-2xs hover:border-indigo-300 transition-colors"
        >
          <HighlightText text={item} highlightData={highlightData} />
        </span>
      ))}
    </div>
  );
};

export default function ProductDetailAttributes({
  selectedProduct,
  highlightData,
  isSubmittingKnowledge,
  submitKnowledge
}) {
  return (
    <div className="flex flex-col gap-3 pt-3">
      
      {/* Short Description Banner */}
      {selectedProduct.shortDescription && (
        <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl px-3.5 py-2.5">
          <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">SHORT</div>
          <div className="font-semibold text-indigo-950 dark:text-indigo-200 text-xs leading-relaxed">
            <HighlightText text={selectedProduct.shortDescription} highlightData={highlightData} />
          </div>
        </div>
      )}

      {/* Full Description Section */}
      {selectedProduct.description && (
        <div className="px-1 py-1">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">รายละเอียด</div>
          <div className="font-medium text-slate-800 dark:text-slate-200 text-xs whitespace-pre-wrap leading-relaxed">
            <HighlightText text={selectedProduct.description} highlightData={highlightData} />
          </div>
        </div>
      )}

      {/* Brand & Category Strip */}
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs flex-wrap">
        <div>
          <span className="text-slate-400 font-bold mr-1.5">แบรนด์:</span>
          <span className="font-extrabold text-slate-800 dark:text-slate-100">{selectedProduct.brand || '-'}</span>
        </div>
        <span className="text-slate-300">|</span>
        <div>
          <span className="text-slate-400 font-bold mr-1.5">หมวดหมู่:</span>
          <span className="font-extrabold text-slate-800 dark:text-slate-100">{selectedProduct.category || '-'}</span>
        </div>
        {selectedProduct.sellingModel && (
          <>
            <span className="text-slate-300">|</span>
            <div>
              <span className="text-slate-400 font-bold mr-1.5">โมเดลที่ขาย:</span>
              <span className="font-extrabold text-red-600 dark:text-red-400"><HighlightText text={selectedProduct.sellingModel} highlightData={highlightData} /></span>
            </div>
          </>
        )}
      </div>

      {/* Compatible Models Section */}
      <div className="bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200/90 dark:border-slate-700/80 p-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Compatible Models (รุ่นที่ใช้ด้วยกันได้)
          </span>
          <button 
            type="button" 
            disabled={isSubmittingKnowledge} 
            onClick={(e) => submitKnowledge(e, 'model')} 
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
          >
            {isSubmittingKnowledge ? <RefreshCw size={11} className="animate-spin" /> : <PlusCircle size={11}/>}
            <span>+ เพิ่มรุ่น</span>
          </button>
        </div>
        {renderPills(selectedProduct.compatibleModels, highlightData, 'ไม่มีข้อมูลรุ่นรองรับ')}
      </div>

      {/* Compatible Part Numbers Section */}
      <div className="bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200/90 dark:border-slate-700/80 p-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
            PART NO. (พาร์ทอะไหล่)
          </span>
          <button 
            type="button" 
            disabled={isSubmittingKnowledge} 
            onClick={(e) => submitKnowledge(e, 'part')} 
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
          >
            {isSubmittingKnowledge ? <RefreshCw size={11} className="animate-spin" /> : <PlusCircle size={11}/>}
            <span>+ เพิ่มพาร์ท</span>
          </button>
        </div>
        {renderPills(selectedProduct.compatiblePartNumbers, highlightData, 'ไม่มีข้อมูลพาร์ท')}
      </div>

      {/* Extra Badges Footer */}
      {(selectedProduct.tags?.length > 0 || (selectedProduct.packageSize && (selectedProduct.packageSize.w || selectedProduct.packageSize.l || selectedProduct.packageSize.h)) || selectedProduct.bufferStock > 0) && (
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-200/70 dark:border-slate-700/60">
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {selectedProduct.tags?.length > 0 && selectedProduct.tags.map((t, i) => (
              <span key={i} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-bold">#{t}</span>
            ))}
            {selectedProduct.packageSize && (selectedProduct.packageSize.w || selectedProduct.packageSize.l || selectedProduct.packageSize.h) && (
              <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-bold">
                📦 ขนาด: {selectedProduct.packageSize.w}x{selectedProduct.packageSize.l}x{selectedProduct.packageSize.h}
              </span>
            )}
            {selectedProduct.bufferStock > 0 && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                ⚠️ กักสต็อก: {selectedProduct.bufferStock}
              </span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
