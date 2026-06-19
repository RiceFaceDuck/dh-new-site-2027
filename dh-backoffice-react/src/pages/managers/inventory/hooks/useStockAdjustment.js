import { useState } from 'react';
import { inventoryAdjustmentService } from '../../../../firebase/inventory/inventoryAdjustmentService';
import { inventoryQueryService } from '../../../../firebase/inventory/inventoryQueryService';

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
      } else {
        setSearchError(`ไม่พบสินค้า SKU: ${skuInput}`);
      }
    } catch (error) {
      setSearchError('เกิดข้อผิดพลาดในการค้นหา: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!product) return;

    if (newStock === '') {
      setSubmitError('กรุณาระบุจำนวนสต๊อคใหม่');
      return;
    }

    const numericNewStock = parseInt(newStock, 10);
    
    if (isNaN(numericNewStock) || numericNewStock < 0) {
      setSubmitError('จำนวนสต๊อคไม่สามารถติดลบได้');
      return;
    }

    if (numericNewStock === (product.stockQuantity || 0)) {
      setSubmitError('สต๊อคใหม่มีค่าเท่ากับสต๊อคเดิม ไม่มีการเปลี่ยนแปลง');
      return;
    }

    if (!reason) {
      setSubmitError('กรุณาเลือกเหตุผลในการปรับปรุงสต๊อค');
      return;
    }

    if (reason === 'อื่นๆ' && !note.trim()) {
      setSubmitError('กรุณาระบุหมายเหตุเมื่อเลือกเหตุผล "อื่นๆ"');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await inventoryAdjustmentService.adjustStock(
        product.sku,
        numericNewStock,
        reason,
        note,
        user
      );

      setSuccessMessage(`ปรับปรุงสต๊อค SKU: ${product.sku} เป็น ${numericNewStock} สำเร็จแล้ว`);
      setProduct(prev => ({ ...prev, stockQuantity: numericNewStock }));
      setReason('');
      setNote('');
      
    } catch (error) {
      setSubmitError(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
