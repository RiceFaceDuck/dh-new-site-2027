import { useState, useEffect } from 'react';
import { userService } from '../../../firebase/userService';

export function useProfileTaxLogic(user) {
  const [formData, setFormData] = useState({
    type: 'personal',
    name: '',
    taxId: '',
    address: '',
    isHeadOffice: true,
    branchCode: ''
  });
  
  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showTaxId, setShowTaxId] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTaxInfo = async () => {
      if (!user?.uid) return;
      setIsLoading(true);
      try {
        const taxData = await userService.getPrivateTaxInfo(user.uid);
        if (isMounted) {
          const loadedData = {
            type: taxData?.type || 'personal',
            name: taxData?.name || '',
            taxId: taxData?.taxId || '',
            address: taxData?.address || '',
            isHeadOffice: taxData?.isHeadOffice ?? true,
            branchCode: taxData?.branchCode || ''
          };
          setFormData(loadedData);
          setInitialData(loadedData);
        }
      } catch (error) {
        console.error("Error fetching tax info:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTaxInfo();
    return () => { isMounted = false; };
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'taxId' && value && !/^\d{0,13}$/.test(value)) return;
    if (name === 'branchCode' && value && !/^\d{0,5}$/.test(value)) return;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (status.message) setStatus({ type: '', message: '' });
  };

  const hasChanges = () => {
    if (!initialData) return true;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !hasChanges()) return;

    if (formData.taxId && formData.taxId.length !== 13) {
      setStatus({ type: 'error', message: 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลักถ้วน' });
      return;
    }
    if (formData.type === 'company' && !formData.isHeadOffice && formData.branchCode.length < 4) {
      setStatus({ type: 'error', message: 'กรุณาระบุรหัสสาขาให้ถูกต้อง (4-5 หลัก)' });
      return;
    }

    setIsSaving(true);
    setStatus({ type: '', message: '' });

    try {
      await userService.updatePrivateTaxInfo(user.uid, formData);
      setInitialData({ ...formData });
      setStatus({ type: 'success', message: 'บันทึกข้อมูลผู้เสียภาษีเรียบร้อยแล้ว แหล่งเก็บข้อมูลปลอดภัย 100%' });
      setShowTaxId(false);
    } catch (error) {
    console.error("🔥 Error:", error);

      setStatus({ type: 'error', message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        if (status.type === 'success') setStatus({ type: '', message: '' });
      }, 4000);
    }
  };

  const getMaskedTaxId = (taxId) => {
    if (!taxId) return '';
    if (taxId.length <= 4) return taxId;
    return '•••••••••' + taxId.slice(-4);
  };

  return {
    formData,
    isLoading,
    isSaving,
    status,
    showTaxId,
    setShowTaxId,
    handleChange,
    hasChanges,
    handleSubmit,
    getMaskedTaxId
  };
}
