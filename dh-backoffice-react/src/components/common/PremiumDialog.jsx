import React, { useState, useEffect } from 'react';
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
  inputPlaceholder = 'กรุณาระบุเหตุผล...'
}) {
  const [inputValue, setInputValue] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onCancel();
    }, 200);
  };

  const handleConfirm = () => {
    if (requireInput && !inputValue.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    setIsClosing(true);
    setTimeout(() => {
      onConfirm(requireInput ? inputValue : true);
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
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`bg-dh-surface w-full max-w-md rounded-2xl shadow-dh-elevated overflow-hidden border border-dh-border transition-all duration-200 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'}`}>
        
        <div className="flex justify-between items-start p-5 pb-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-inner ${colors[type]}`}>
            {icons[type]}
          </div>
          <button onClick={handleClose} className="text-dh-muted hover:text-dh-main hover:bg-dh-base p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 pt-4">
          <h3 className="text-lg font-black text-dh-main tracking-wide mb-1.5">{title}</h3>
          <p className="text-sm text-dh-muted whitespace-pre-line leading-relaxed mb-4">{message}</p>
          
          {requireInput && (
            <textarea
              autoFocus
              className="w-full bg-dh-base border border-dh-border rounded-xl p-3 text-sm text-dh-main focus:outline-none focus:border-dh-accent focus:ring-1 focus:ring-dh-accent resize-none transition-all placeholder:text-dh-muted/50"
              rows={3}
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            />
          )}
        </div>

        <div className="bg-dh-base p-4 flex gap-3 justify-end border-t border-dh-border">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-dh-muted hover:text-dh-main hover:bg-dh-surface transition-all active:scale-95 border border-transparent hover:border-dh-border"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95 shadow-sm hover:shadow-md
              ${type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 
                type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                'bg-dh-accent hover:bg-dh-accent/90'}`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
