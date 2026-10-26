import React, { useState } from 'react';
import { 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  ArrowRight, 
  UserPlus, 
  X,
  Phone,
  Mail,
  Coins,
  MapPin,
  Truck
} from 'lucide-react';
import { computeSafeGapFilling } from '../../services/customerMatchingService';

/**
 * CustomerSuggestionCard Component (Presentation Layer)
 * 
 * Displays existing customer matching alert, profile gap analysis, and 
 * two professional decision pathways for cashier/staff.
 * 
 * Strict Styling Invariants:
 * - Container & Shapes: rounded-[0.1rem], solid thin borders, elevated drop shadow
 * - Action Buttons: Preserves original rounded-xl / rounded-lg
 * - Calm UI: Zero pulsing or bouncing animations
 */
export const CustomerSuggestionCard = ({
  match,
  parsedData,
  onSelectCustomer,
  onCreateNew,
  onDismiss,
  className = ''
}) => {
  const [autoFillMissing, setAutoFillMissing] = useState(true);

  if (!match || !match.candidate) return null;

  const { candidate, score, matchReasons = [], gapAnalysis = {} } = match;
  const isStorefront = gapAnalysis.isStorefront;
  const existingItems = gapAnalysis.existingItems || [];
  const missingItems = gapAnalysis.missingItems || [];
  const fillableItems = gapAnalysis.fillableItems || [];

  const handleProceedWithCandidate = () => {
    let payload = null;
    if (autoFillMissing && parsedData) {
      const fillResult = computeSafeGapFilling(candidate, parsedData);
      if (fillResult.hasUpdates) {
        payload = fillResult.payload;
      }
    }
    if (onSelectCustomer) {
      onSelectCustomer(candidate, payload);
    }
  };

  return (
    <div 
      className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[0.1rem] shadow-xl overflow-hidden transition-all text-slate-800 dark:text-slate-100 ${className}`}
    >
      {/* 1. Header Bar: Match Notice & Score Badge */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/60 rounded-[0.1rem] border border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2">
              ตรวจพบบัญชีที่ตรงกันในระบบ
              {isStorefront && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-[0.1rem] border border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-200">
                  <Globe className="w-3 h-3" /> สมาชิก Partner หน้าเว็บ
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ความน่าจะเป็น: {score}% ({matchReasons.join(', ')})
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            title="ปิดการแจ้งเตือน"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Main Content Body */}
      <div className="p-4 space-y-3.5">
        
        {/* Candidate Profile Summary Header */}
        <div className="p-3 bg-slate-50/60 dark:bg-slate-800/40 rounded-[0.1rem] border border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mr-2">
              ID: {candidate.accountId || candidate.customerCode || candidate.id}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {candidate.storeName || candidate.displayName || candidate.accountName || 'ไม่ระบุชื่อร้าน'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {candidate.tier && (
              <span className="px-2 py-0.5 rounded-[0.1rem] border border-slate-300 dark:border-slate-600 font-medium">
                {candidate.tier}
              </span>
            )}
            {(candidate.creditPoints || candidate.totalAccumulatedPoints) > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.1rem] border border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-200 font-medium">
                <Coins className="w-3 h-3 text-amber-500" />
                {(candidate.creditPoints || candidate.totalAccumulatedPoints).toLocaleString()} แต้ม
              </span>
            )}
          </div>
        </div>

        {/* 3. Profile Readiness & Gap Analysis Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          
          {/* Left Column: Existing Verified Data */}
          <div className="p-3 rounded-[0.1rem] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>มีข้อมูลในบัญชีแล้ว:</span>
            </div>
            <div className="space-y-1 pl-5 text-slate-600 dark:text-slate-300">
              {existingItems.length > 0 ? (
                existingItems.map((item, idx) => (
                  <div key={idx} className="truncate">
                    <span className="text-slate-400 dark:text-slate-500">{item.label}:</span>{' '}
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.value}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400">ข้อมูลเบื้องต้น</div>
              )}
            </div>
          </div>

          {/* Right Column: Missing Critical Gaps */}
          <div className="p-3 rounded-[0.1rem] border border-slate-300 dark:border-slate-700 bg-amber-50/30 dark:bg-amber-950/20 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>ข้อมูลสำคัญที่ยังขาดในบัญชี:</span>
            </div>
            <div className="space-y-1 pl-5">
              {missingItems.length > 0 ? (
                missingItems.map((item, idx) => (
                  <div key={idx} className="text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-[0.1rem] bg-amber-500" />
                    <span>{item.label}</span>
                  </div>
                ))
              ) : (
                <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ข้อมูลครบถ้วนสมบูรณ์แล้ว
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 4. Fillable Preview from Pasted Text (If gaps exist and fillable items detected) */}
        {fillableItems.length > 0 && (
          <div className="p-3 rounded-[0.1rem] border border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>ข้อมูลใหม่จากแชทที่พร้อมนำมาเติมเต็ม:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pl-5 text-xs text-slate-700 dark:text-slate-300">
              {fillableItems.map((item, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{item.label}:</span>{' '}
                  <span className="text-slate-900 dark:text-slate-100 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Safe Gap-Filling Checkbox */}
        {fillableItems.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autofill-missing-checkbox"
              checked={autoFillMissing}
              onChange={(e) => setAutoFillMissing(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-[0.1rem] border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label 
              htmlFor="autofill-missing-checkbox" 
              className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none"
            >
              บันทึกเบอร์โทรและที่อยู่ใหม่ลงในบัญชีนี้โดยอัตโนมัติ (แนะนำ - เติมเฉพาะช่องว่าง ไม่ทับข้อมูลเดิม)
            </label>
          </div>
        )}

        {/* 6. Action Button Bar (Strict Standard: rounded-xl preserved on buttons) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-300 dark:border-slate-700">
          <button
            type="button"
            onClick={onCreateNew}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ยืนยันสร้างรายชื่อใหม่ (คนละคนกัน)</span>
          </button>

          <button
            type="button"
            onClick={handleProceedWithCandidate}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>(แนะนำ) ดำเนินการต่อด้วยบัญชีนี้ ({candidate.accountId || candidate.id})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomerSuggestionCard;
