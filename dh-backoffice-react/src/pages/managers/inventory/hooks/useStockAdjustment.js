import { useState } from 'react';
import { inventoryAdjustmentService } from '../../../../firebase/inventory/inventoryAdjustmentService';
import { inventoryQueryService } from '../../../../firebase/inventory/inventoryQueryService';
import { z } from 'zod';
import toast from 'react-hot-toast';

const adjustmentSchema = z.object({
  newStock: z.number({ invalid_type_error: "กรุณาระบุจำนวนสต๊อคใหม่ให้ถูกต้อง" }).min(0, "จำนวนสต๊อคไม่สามารถติดลบได้"),
  reason: z.string().min(1, "กรุณาเลือกเหตุผลในการปรับปรุงสต๊อค"),
  note: z.string().optional()
}).refine(data => {
  if (data.reason === 'อื่นๆ' && (!data.note || data.note.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'กรุณาระบุหมายเหตุเมื่อเลือกเหตุผล "อื่นๆ"',
  path: ['note']
});

export function useStockAdjustment(user) {
  const [skuInput, setSkuInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [product, setProduct] = useState(null);
  const [searchError, setSearchError] = useState('');

  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!skuInput.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setProduct(null);
    setSuccessMessage('');
    setSubmitError('');

    try {
      const foundProduct = await inventoryQueryService.getProductBySku(skuInput.trim());
      if (foundProduct) {
        setProduct(foundProduct);
        setNewStock(foundProduct.stockQuantity || 0);
        toast.success(`ค้นพบสินค้า: ${foundProduct.name}`);
      } else {
        setSearchError(`ไม่พบสินค้า SKU: ${skuInput}`);
        toast.error(`ไม่พบสินค้า SKU: ${skuInput}`);
      }
    } catch (error) {
      setSearchError('เกิดข้อผิดพลาดในการค้นหา: ' + error.message);
      toast.error('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!product) return;

    setSubmitError('');

    const numericNewStock = parseInt(newStock, 10);
    
    // Zod Validation
    const validationResult = adjustmentSchema.safeParse({
      newStock: numericNewStock,
      reason: reason,
      note: note
    });

    if (!validationResult.success) {
      const errorMsg = validationResult.error.errors[0].message;
      setSubmitError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (numericNewStock === (product.stockQuantity || 0)) {
      const errorMsg = 'สต๊อคใหม่มีค่าเท่ากับสต๊อคเดิม ไม่มีการเปลี่ยนแปลง';
      setSubmitError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('กำลังบันทึกการปรับปรุงสต๊อค...');

    try {
      await inventoryAdjustmentService.adjustStock(
        product.sku,
        numericNewStock,
        reason,
        note,
        user
      );

      const successMsg = `ปรับปรุงสต๊อค SKU: ${product.sku} เป็น ${numericNewStock} สำเร็จแล้ว`;
      setSuccessMessage(successMsg);
      toast.success(successMsg, { id: toastId });
      
      setProduct(prev => ({ ...prev, stockQuantity: numericNewStock }));
      setReason('');
      setNote('');
      
    } catch (error) {
      const errMsg = error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      setSubmitError(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    skuInput, setSkuInput,
    isSearching,
    product,
    searchError,
    newStock, setNewStock,
    reason, setReason,
    note, setNote,
    isSubmitting,
    successMessage,
    submitError,
    handleSearch,
    handleSubmit
  };
}
