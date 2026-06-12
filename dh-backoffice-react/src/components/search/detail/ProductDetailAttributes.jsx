import React from 'react';
import { PlusCircle, RefreshCw, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { HighlightText } from '../HighlightText';

export default function ProductDetailAttributes({
  selectedProduct,
  highlightData,
  isSubmittingKnowledge,
  submitKnowledge
}) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-y-1.5 pt-2">
      
      <div className="group/row contents">
        <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-2.5 px-2 rounded-l-md transition-colors group-hover/row:bg-dh-base/40">จุดสังเกต</div>
        <div className="font-bold text-dh-accent text-[13px] bg-dh-accent-light p-2.5 rounded-lg border border-dh-accent/20 whitespace-pre-wrap my-0.5 transition-colors group-hover/row:border-dh-accent/40 group-hover/row:shadow-sm">
          {selectedProduct.shortDescription ? <HighlightText text={selectedProduct.shortDescription} highlightData={highlightData} /> : <span className="text-dh-muted font-medium">ไม่มีข้อมูลระบุ</span>}
        </div>
      </div>

      <div className="group/row contents">
        <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-2.5 px-2 rounded-l-md transition-colors group-hover/row:bg-dh-base/40">รายละเอียด</div>
        <div className="font-bold text-dh-main text-[13px] whitespace-pre-wrap leading-relaxed py-2 px-2.5 rounded-lg transition-colors group-hover/row:bg-dh-base/40">
          {selectedProduct.description ? <HighlightText text={selectedProduct.description} highlightData={highlightData} /> : '-'}
        </div>
      </div>

      <div className="group/row contents">
        <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-1.5 px-2 rounded-l-md transition-colors group-hover/row:bg-dh-base/40">แบรนด์ / หมวดหมู่</div>
        <div className="font-black text-dh-main text-[13px] py-1 px-2.5 rounded-lg transition-colors group-hover/row:bg-dh-base/40">
          {selectedProduct.brand || '-'} <span className="text-dh-border mx-2">|</span> {selectedProduct.category || '-'}
        </div>
      </div>

      <div className="group/row contents">
        <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-1.5 px-2 rounded-l-md transition-colors group-hover/row:bg-dh-base/40">โมเดลที่ขายอยู่</div>
        <div className="font-black text-red-500 text-[13px] py-1 px-2.5 rounded-lg transition-colors group-hover/row:bg-red-50 dark:group-hover/row:bg-red-900/10">
          {selectedProduct.sellingModel ? <HighlightText text={selectedProduct.sellingModel} highlightData={highlightData} /> : <span className="text-dh-muted">n/a</span>}
        </div>
      </div>

      <div className="group/row contents">
        <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-2.5 px-2 rounded-l-md transition-colors group-hover/row:bg-dh-base/40 flex flex-col items-start gap-1">
          Compatible
          <button type="button" disabled={isSubmittingKnowledge} onClick={(e) => submitKnowledge(e, 'model')} className="text-dh-main hover:text-dh-accent disabled:opacity-50 transition-colors flex items-center gap-1 bg-dh-surface px-1.5 py-0.5 rounded border border-dh-border shadow-sm active:scale-95">
            {isSubmittingKnowledge ? <RefreshCw size={10} className="animate-spin" /> : <PlusCircle size={10}/>} <span className="text-[9px] font-bold">เพิ่มรุ่น</span>
          </button>
        </div>
        <div className="font-bold text-dh-main text-[13px] bg-dh-base p-2.5 rounded-lg border border-dh-border min-h-[40px] my-0.5 transition-all group-hover/row:shadow-sm group-hover/row:border-dh-border/80">
          {selectedProduct.compatibleModels?.length ? <HighlightText text={selectedProduct.compatibleModels} highlightData={highlightData} /> : <span className="text-dh-muted italic font-medium">n/a</span>}
        </div>
      </div>

      <div className="group/row contents">
        <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-2.5 px-2 rounded-l-md transition-colors group-hover/row:bg-dh-base/40 flex flex-col items-start gap-1">
          Part No.
          <button type="button" disabled={isSubmittingKnowledge} onClick={(e) => submitKnowledge(e, 'part')} className="text-dh-main hover:text-dh-accent disabled:opacity-50 transition-colors flex items-center gap-1 bg-dh-surface px-1.5 py-0.5 rounded border border-dh-border shadow-sm active:scale-95">
            {isSubmittingKnowledge ? <RefreshCw size={10} className="animate-spin" /> : <PlusCircle size={10}/>} <span className="text-[9px] font-bold">เพิ่มพาร์ท</span>
          </button>
        </div>
        <div className="font-bold text-dh-main text-[13px] bg-dh-base p-2.5 rounded-lg border border-dh-border min-h-[40px] uppercase my-0.5 transition-all group-hover/row:shadow-sm group-hover/row:border-dh-border/80 tracking-wide">
          {selectedProduct.compatiblePartNumbers?.length ? <HighlightText text={selectedProduct.compatiblePartNumbers} highlightData={highlightData} /> : <span className="text-dh-muted italic font-medium">n/a</span>}
        </div>
      </div>

      {(selectedProduct.tags?.length > 0 || selectedProduct.packageSize || selectedProduct.bufferStock) && (
        <div className="group/row contents">
          <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-1.5 px-2 rounded-l-md transition-colors group-hover/row:bg-dh-base/40">ข้อมูลเพิ่มเติม</div>
          <div className="flex flex-wrap gap-1.5 text-[11px] py-1 px-2.5 rounded-lg transition-colors group-hover/row:bg-dh-base/40">
            {selectedProduct.tags?.length > 0 && selectedProduct.tags.map((t, i) => (
              <span key={i} className="bg-dh-base text-dh-main px-1.5 py-0.5 rounded border border-dh-border font-extrabold shadow-sm">#{t}</span>
            ))}
            {selectedProduct.packageSize && (
              <span className="bg-dh-base text-dh-main px-1.5 py-0.5 rounded border border-dh-border font-extrabold shadow-sm">
                📦 ขนาด: {selectedProduct.packageSize.w}x{selectedProduct.packageSize.l}x{selectedProduct.packageSize.h}
              </span>
            )}
            {selectedProduct.bufferStock && (
              <span className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-800/50 font-extrabold shadow-sm">
                ⚠️ กักสต็อก: {selectedProduct.bufferStock}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="group/row contents">
        <div className="text-[11px] font-extrabold text-dh-muted uppercase tracking-wide pt-1.5 px-2 rounded-l-md transition-colors group-hover/row:bg-dh-base/40">ลิงก์อ้างอิง</div>
        <div className="flex flex-wrap gap-1.5 text-[11px] font-extrabold py-1 px-2.5 rounded-lg transition-colors group-hover/row:bg-dh-base/40">
            {selectedProduct.landingPageUrl && <a href={selectedProduct.landingPageUrl} target="_blank" className="flex items-center gap-1 px-2 py-1 bg-dh-surface text-dh-main rounded border border-dh-border hover:border-dh-accent transition-all hover:-translate-y-[1px] shadow-sm"><LinkIcon size={12}/> หน้าหลัก</a>}
            {selectedProduct.externalLinks?.shopee && <a href={selectedProduct.externalLinks.shopee} target="_blank" className="flex items-center gap-1 px-2 py-1 bg-[#ee4d2d]/10 text-[#ee4d2d] rounded border border-[#ee4d2d]/20 hover:bg-[#ee4d2d]/20 transition-all hover:-translate-y-[1px] shadow-sm"><ExternalLink size={12}/> Shopee</a>}
            {selectedProduct.externalLinks?.lazada && <a href={selectedProduct.externalLinks.lazada} target="_blank" className="flex items-center gap-1 px-2 py-1 bg-[#0f136d]/10 text-[#0f136d] dark:bg-[#2A2D8E]/30 dark:text-[#888DF2] rounded border border-[#0f136d]/20 dark:border-[#888DF2]/30 hover:bg-[#0f136d]/20 transition-all hover:-translate-y-[1px] shadow-sm"><ExternalLink size={12}/> Lazada</a>}
            {selectedProduct.externalLinks?.tiktok && <a href={selectedProduct.externalLinks.tiktok} target="_blank" className="flex items-center gap-1 px-2 py-1 bg-black/5 dark:bg-white/10 text-current rounded border border-current/10 hover:bg-black/10 transition-all hover:-translate-y-[1px] shadow-sm"><ExternalLink size={12}/> TikTok</a>}
            {(!selectedProduct.landingPageUrl && !selectedProduct.externalLinks?.shopee && !selectedProduct.externalLinks?.lazada && !selectedProduct.externalLinks?.tiktok) && <span className="text-dh-muted font-bold py-1">ไม่มีข้อมูลลิงก์</span>}
        </div>
      </div>
    </div>
  );
}
