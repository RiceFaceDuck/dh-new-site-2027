import React, { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, Wallet, CreditCard, UploadCloud, Truck, Loader2 } from 'lucide-react';

export default function ApproveModal({
  isOpen,
  onClose,
  onConfirm,
  selectedRequest,
  customerProfile,
  initialTrackingNo = ''
}) {
  const [trackingNo, setTrackingNo] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [isDirectPaid, setIsDirectPaid] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const payload = selectedRequest?.payload || {};
  const qty = Number(payload.qty || 1);
  const originalPrice = Number(payload.originalPricePerUnit || 0);
  const rawDiff = (Number(payload.swapPricePerUnit || 0) - originalPrice) * qty;
  const priceDifference = payload.priceDifference !== undefined && payload.priceDifference !== null
    ? Number(payload.priceDifference)
    : rawDiff;

  const hasDifference = priceDifference > 0;
  const walletBalance = Number(customerProfile?.walletBalance || 0);
  const hasValidCustomer = !!(payload.customerUid && payload.customerUid !== 'Walk-in' && !payload.customerUid.includes('WALK-IN'));

  const walletAmount = useWallet ? Math.min(walletBalance, priceDifference) : 0;
  const remainingDifference = Math.max(0, priceDifference - walletAmount);

  useEffect(() => {
    if (isOpen) {
      setTrackingNo(initialTrackingNo || payload.trackingNo || '');
      setUseWallet(false);
      setIsDirectPaid(false);
      setSlipFile(null);
      setSlipPreviewUrl(null);
      setIsSubmitting(false);
      setStatusMessage('');
    }
  }, [isOpen, initialTrackingNo, payload.trackingNo]);

  useEffect(() => {
    if (slipFile) {
      const url = URL.createObjectURL(slipFile);
      setSlipPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setSlipPreviewUrl(null);
  }, [slipFile]);

  if (!isOpen) return null;

  const isFormValid = !hasDifference || (walletAmount + (isDirectPaid ? remainingDifference : 0) >= priceDifference);

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const paymentData = hasDifference ? {
        totalDifference: priceDifference,
        useWallet: useWallet && walletAmount > 0,
        walletAmount: walletAmount,
        isDirectPaid: isDirectPaid && remainingDifference > 0,
        directAmount: isDirectPaid ? remainingDifference : 0,
        hasSlip: !!slipFile,
        confirmedAt: new Date().toISOString()
      } : null;

      await onConfirm({
        trackingNo: trackingNo.trim(),
        paymentData,
        slipFile
      }, (msg) => setStatusMessage(msg));

      onClose();
    } catch (err) {
      console.error('Error confirming approval:', err);
      alert('เกิดข้อผิดพลาดในการอนุมัติคำร้อง: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const refId = payload.exchangeId || payload.claimId || payload.returnId || selectedRequest?.id || '-';

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-dh-surface w-full max-w-lg rounded-2xl shadow-dh-elevated overflow-hidden border border-dh-border flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-dh-border bg-dh-base/40">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${hasDifference ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-dh-main">อนุมัติคำร้อง</h3>
              <p className="text-[11px] text-dh-muted font-medium">Ref: {refId}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-dh-muted hover:text-dh-main p-1.5 rounded-lg hover:bg-dh-base transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4">
          
          {/* Difference Payment Warning (for swap SKU with price increase) */}
          {hasDifference && (
            <div className="bg-linear-to-br from-amber-50 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/20 border-2 border-amber-300 dark:border-amber-700/60 rounded-xl p-4.5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-lg shadow-xs shrink-0 animate-bounce">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-sm">
                      มีค่าใช้จ่ายส่วนต่าง
                    </span>
                    <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                      +฿{priceDifference.toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-[15px] font-black text-amber-950 dark:text-amber-200 mt-1">
                    ลูกค้าจ่ายค่าส่วนต่างหรือยัง?
                  </h4>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                    การเปลี่ยนสินค้ารายการนี้มีส่วนต่างราคา <b>฿{priceDifference.toLocaleString()}</b> โปรดยืนยันการรับชำระเงินก่อนอนุมัติ
                  </p>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="mt-4 pt-3.5 border-t border-amber-200 dark:border-amber-800/50 flex flex-col gap-2.5">
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                  ระบุวิธีชำระเงินส่วนต่าง (สามารถเลือกทั้งสองข้อได้ถ้าใช้ผสม):
                </span>

                {/* Option 1: Customer Wallet */}
                {hasValidCustomer ? (
                  <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${useWallet ? 'bg-white dark:bg-black/30 border-blue-400 shadow-xs ring-1 ring-blue-400' : 'bg-white/60 dark:bg-black/10 border-amber-200/80 hover:bg-white'} ${walletBalance <= 0 ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={useWallet}
                      disabled={walletBalance <= 0 || isSubmitting}
                      onChange={(e) => setUseWallet(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 accent-blue-600"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-dh-main">
                        <span className="flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-blue-500" />
                          ใช้เงินใน Wallet ของลูกค้า
                        </span>
                        <span className={`font-mono font-black ${walletBalance > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          (มีอยู่ ฿{walletBalance.toLocaleString()})
                        </span>
                      </div>
                      {useWallet && (
                        <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-1 font-semibold">
                          ✓ หักจาก Wallet: <b>฿{walletAmount.toLocaleString()}</b>
                          {walletBalance < priceDifference && (
                            <span className="text-amber-700 dark:text-amber-400 ml-1">
                              (ยังขาดอีก ฿{(priceDifference - walletAmount).toLocaleString()})
                            </span>
                          )}
                        </p>
                      )}
                      {walletBalance <= 0 && (
                        <p className="text-[10px] text-rose-500 mt-0.5">ยอดเงินในกระเป๋าไม่เพียงพอ (฿0)</p>
                      )}
                    </div>
                  </label>
                ) : null}

                {/* Option 2: Direct Payment (Cash / Transfer) */}
                <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isDirectPaid ? 'bg-white dark:bg-black/30 border-emerald-500 shadow-xs ring-1 ring-emerald-500' : 'bg-white/60 dark:bg-black/10 border-amber-200/80 hover:bg-white'}`}>
                  <input
                    type="checkbox"
                    checked={isDirectPaid}
                    disabled={isSubmitting}
                    onChange={(e) => setIsDirectPaid(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-dh-main">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                        ยืนยันว่าลูกค้าชำระเงินแล้ว (เงินสด / โอนตรง)
                      </span>
                      <span className="font-mono font-black text-emerald-600">
                        ฿{remainingDifference.toLocaleString()}
                      </span>
                    </div>
                    {isDirectPaid && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 font-semibold">
                        ✓ ยืนยันได้รับเงินแล้ว ฿{remainingDifference.toLocaleString()} (ระบบจะไม่หักเงิน Wallet ลูกค้าซ้ำ)
                      </p>
                    )}
                  </div>
                </label>

                {/* File Upload for Slip */}
                {isDirectPaid && (
                  <div className="mt-1 p-3 bg-white dark:bg-black/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-bold text-dh-main flex items-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                        แนบสลิปโอนเงิน <span className="text-dh-muted font-normal">(ไม่บังคับ)</span>
                      </label>
                      {slipFile && (
                        <button
                          type="button"
                          onClick={() => setSlipFile(null)}
                          className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
                        >
                          ลบไฟล์
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isSubmitting}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSlipFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-xs text-dh-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-dh-border rounded-lg p-1 bg-dh-base/50"
                      />
                    </div>
                    {slipPreviewUrl && (
                      <div className="mt-2.5 flex items-center gap-2 p-2 bg-dh-base rounded-lg border border-dh-border">
                        <img src={slipPreviewUrl} alt="Slip preview" className="w-12 h-12 object-cover rounded-md border border-dh-border" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-dh-main truncate">{slipFile?.name}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">พร้อมบันทึกสลิปเมื่อกดยืนยัน</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inbound Tracking Input Section */}
          <div className="bg-dh-base/50 p-4 rounded-xl border border-dh-border flex flex-col gap-2">
            <label className="text-xs font-black text-dh-main flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-dh-accent" />
              กรอกเลขพัสดุ ที่ลูกค้าส่งมา <span className="text-[10px] font-normal text-dh-muted">(เว้นว่างได้ถ้าลูกค้านำมาส่งที่หน้าร้าน)</span>
            </label>
            <p className="text-[11px] text-dh-muted leading-relaxed">
              ระบุเลขพัสดุ หรือพิมพ์ "รับที่ร้าน" / "ส่งมาเอง" เพื่อเปลี่ยนสถานะคำร้องเป็น <b>"รอรับของ"</b>
            </p>
            <input
              type="text"
              value={trackingNo}
              disabled={isSubmitting}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="กรอกเลขพัสดุรับเข้า (เว้นว่างได้)..."
              className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-dh-surface border border-dh-border rounded-xl focus:border-dh-accent outline-hidden transition-all shadow-inner"
            />
          </div>

          {/* Validation Warning */}
          {hasDifference && !isFormValid && (
            <div className="text-center py-2 px-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold animate-pulse">
              ⚠️ กรุณาเลือกวิธียืนยันการชำระเงินให้ครบยอด ฿{priceDifference.toLocaleString()} ก่อนอนุมัติ
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-dh-accent py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {statusMessage}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dh-border bg-dh-base/40 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-dh-muted hover:text-dh-main bg-dh-surface hover:bg-dh-base border border-dh-border rounded-xl transition-all shadow-xs cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className={`px-6 py-2 text-xs font-bold text-white rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${hasDifference ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึกข้อมูล...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> ยืนยันอนุมัติคำร้อง
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
