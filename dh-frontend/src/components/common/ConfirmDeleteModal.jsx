import { Trash2 } from 'lucide-react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
            <Trash2 size={24} strokeWidth={2} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">ยืนยันการลบสินค้า</h3>
          <p className="text-sm text-slate-500 mb-2">
            คุณต้องการลบสินค้านี้ออกจากตะกร้าใช่หรือไม่?
          </p>
          {itemName && (
            <p className="text-sm font-semibold text-slate-700 line-clamp-2">
              "{itemName}"
            </p>
          )}
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-md transition-colors"
          >
            ลบสินค้า
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
