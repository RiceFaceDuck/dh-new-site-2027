import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const safeJsonParse = (str, fallback = null) => {
  if (!str || typeof str !== 'string') return fallback;
  try {
    return JSON.parse(str);
  } catch (err) {
    if (str.startsWith('{') || str.startsWith('[')) {
      console.warn('โ ๏ธ [safeJsonParse] Invalid JSON:', err.message);
    }
    return fallback;
  }
};

export default function QRScannerModal({ isOpen, onClose, onScanSuccess, title = 'เธเธณเธฅเธฑเธเธชเนเธเธ QR Code...' }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let mounted = true;
    let scanner = null;
    let timer = null;

    if (isOpen) {
      scanner = new Html5QrcodeScanner(
        'staff-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render(onScan, onError);
    }

    async function onScan(decodedText) {
      if (scanner) scanner.pause();
      setIsProcessing(true);
      try {
        const data = safeJsonParse(decodedText);
        if (onScanSuccess) await onScanSuccess(data);
        if (mounted) setFeedback({ success: true, message: 'เธฅเธเน€เธงเธฅเธฒเธชเธณเน€เธฃเนเธ' });
      } catch (err) {
        console.error('Scan error:', err);
        if (mounted) setFeedback({ success: false, message: err.message || 'เธเธฒเธฃเธชเนเธเธเธฅเนเธกเน€เธซเธฅเธง เธซเธฃเธทเธญ QR Code เนเธกเนเธฃเธญเธเธฃเธฑเธ' });
      } finally {
        if (mounted) setIsProcessing(false);
        timer = setTimeout(() => {
          if (mounted) {
            setFeedback(null);
            onClose();
          }
        }, 2500);
      }
    }

    function onError() {}

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
      if (scanner) scanner.clear().catch((err) => console.error(err));
    };
  }, [isOpen, onClose, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="w-full relative">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
          <X size={20} />
        </button>
      </div>

      <div id="staff-reader" className="w-full bg-black rounded-xl overflow-hidden border border-slate-200 relative"></div>

      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 top-[40px] rounded-xl">
          <Loader2 size={40} className="animate-spin text-blue-500 mb-2" />
          <p className="font-bold text-blue-600">เธเธณเธฅเธฑเธเธ•เธฃเธงเธเธชเธญเธเธเนเธญเธกเธนเธฅ...</p>
        </div>
      )}

      {feedback && !isProcessing && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-10 top-[40px] rounded-xl animate-in zoom-in text-center p-4">
          {feedback.success ? (
            <CheckCircle2 size={60} className="text-emerald-500 mb-3 animate-bounce" />
          ) : (
            <AlertCircle size={60} className="text-rose-500 mb-3 animate-pulse" />
          )}
          <h3 className={`text-lg font-black mb-1 ${feedback.success ? 'text-emerald-600' : 'text-rose-600'}`}>
            {feedback.success ? 'เธชเธณเน€เธฃเนเธ!' : 'เธเธดเธ”เธเธฅเธฒเธ”'}
          </h3>
          <p className="font-bold text-slate-600 text-sm">{feedback.message}</p>
        </div>
      )}
    </div>
  );
}
