import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export default function PremiumDialog({ 
  isOpen, 
  title, 
  message, 
  type = 'info', // 'info', 'warning', 'success', 'prompt'
  onConfirm, 
  onCancel,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  requireInput = false,
  allowEmptyInput = false,
  inputInFooter = false,
  inputLabel = '',
  inputHelpText = '',
  quickPresets = [],
  inputPlaceholder = 'กรุณาระบุเหตุผล...',
  options = null,
  defaultOption = null
}) {
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState(defaultOption);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setSelectedOption(defaultOption || (options && options.length > 0 ? options[0].id : null));
      setIsClosing(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, defaultOption, options]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onCancel();
    }, 200);
  };

  const handleConfirm = () => {
    if (requireInput && !allowEmptyInput && !inputValue.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (options && !selectedOption) {
      alert('กรุณาเลือกตัวเลือกก่อนดำเนินการ');
      return;
    }
    setIsClosing(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      let result = !requireInput || inputValue;
      if (options) {
        result = requireInput ? { input: inputValue, selectedOption } : selectedOption;
      }
      onConfirm(result);
    }, 200);
  };

  const icons = {
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    success: <CheckCircle className="w-6 h-6 text-emerald-500" />,
    info: <Info className="w-6 h-6 text-blue-500" />,
    prompt: <Info className="w-6 h-6 text-dh-accent" />
  };

  const colors = {
    warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-900/40',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900/40',
    info: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/40',
    prompt: 'bg-dh-base border-dh-border text-dh-main'
  };

  return (
    <div className={`fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`bg-dh-surface w-full max-w-md rounded-2xl shadow-dh-elevated overflow-hidden border border-dh-border transition-all duration-200 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}>
        
        {/* Header Icon & Close Button */}
        <div className="flex justify-between items-start p-5 pb-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-inner ${colors[type] || colors.info}`}>
            {icons[type] || icons.info}
          </div>
          <button onClick={handleClose} className="text-dh-muted hover:text-dh-main hover:bg-dh-base p-1.5 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 pt-4">
          <h3 className="text-lg font-black text-dh-main tracking-wide mb-1.5">{title}</h3>
          <p className="text-sm text-dh-muted whitespace-pre-line leading-relaxed mb-3">{message}</p>

          {/* Options (Radio Cards for item condition etc.) */}
          {options && (
            <div className="flex flex-col gap-2.5 my-3">
              {options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                return (
                  <label
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-dh-accent bg-dh-accent/5 shadow-xs'
                        : 'border-dh-border hover:border-dh-muted/40 bg-dh-surface'
                    }`}
                  >
                    <input
                      type="radio"
                      name="premium_dialog_opt"
                      checked={isSelected}
                      onChange={() => setSelectedOption(opt.id)}
                      className="mt-1 accent-dh-accent w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-dh-main">{opt.label}</span>
                        {opt.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badgeColor || 'bg-gray-100 text-gray-600'}`}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.description && (
                        <div className="text-xs text-dh-muted mt-1.5 leading-relaxed">
                          {opt.description}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Input Section (Non-footer) */}
          {requireInput && !inputInFooter && (
            <div className="mt-3.5 pt-3 border-t border-dh-border/70 flex flex-col gap-2">
              {inputLabel && (
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[13px] font-black text-dh-main flex items-center gap-1.5">
                    {inputLabel}
                  </label>
                  {allowEmptyInput ? (
                    <span className="text-[10px] font-bold text-dh-muted bg-dh-base px-2 py-0.5 rounded-full border border-dh-border">
                      ไม่บังคับ
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      บังคับระบุ
                    </span>
                  )}
                </div>
              )}

              {/* Quick Presets */}
              {quickPresets && quickPresets.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] font-bold text-dh-muted">เลือกด่วน:</span>
                  {quickPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputValue(preset)}
                      className="text-[11px] font-bold px-2.5 py-1 bg-dh-base hover:bg-dh-surface border border-dh-border hover:border-dh-accent text-dh-main rounded-md transition-all active:scale-95 shadow-2xs cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  className="w-full bg-dh-base border border-dh-border rounded-xl px-3.5 py-2.5 text-sm text-dh-main focus:outline-hidden focus:border-dh-accent focus:ring-1 focus:ring-dh-accent transition-all placeholder:text-dh-muted/50 font-mono shadow-inner"
                  placeholder={inputPlaceholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirm();
                    }
                  }}
                />
              </div>

              {inputHelpText && (
                <p className="text-[11px] text-dh-muted leading-tight">
                  {inputHelpText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-dh-base p-4 flex items-center gap-3 justify-between border-t border-dh-border">
          {requireInput && inputInFooter ? (
            <input
              autoFocus
              type="text"
              className="flex-1 min-w-0 bg-dh-surface border border-dh-border rounded-xl px-3 py-2 text-xs sm:text-sm text-dh-main focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-dh-muted/60 font-medium shadow-inner"
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            />
          ) : null}

          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-sm font-bold text-dh-muted hover:text-dh-main hover:bg-dh-surface transition-all active:scale-95 border border-transparent hover:border-dh-border cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-5 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95 shadow-xs hover:shadow-md cursor-pointer
                ${type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 
                  type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                  'bg-dh-accent hover:bg-dh-accent/90'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
