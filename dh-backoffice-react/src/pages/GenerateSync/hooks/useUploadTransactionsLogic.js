import { useState, useRef } from 'react';
import { transactionImportService } from '../../../firebase/transactionImportService';

import { safeJsonParse } from 'dh-shared';
export function useUploadTransactionsLogic(currentUser, onUploadComplete) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, parsing, preview, uploading, success, error
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [actionType, setActionType] = useState('deduct'); // deduct or add
  const [currentMapping, setCurrentMapping] = useState({ skuKey: '', qtyKey: '', priceKey: '' });
  
  const fileInputRef = useRef(null);

  const resetState = () => {
    setFile(null);
    setParsedData(null);
    setStatus('idle');
    setMessage('');
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      setStatus('error');
      setMessage('กรุณาอัปโหลดไฟล์ Excel (.xlsx, .xls) หรือ .csv');
      return;
    }

    setFile(selectedFile);
    setStatus('parsing');
    setMessage('กำลังอ่านไฟล์...');

    try {
      const result = await transactionImportService.parseFile(selectedFile);
      
      let finalMatchedKeys = result.matchedKeys;
      try {
        const savedStr = localStorage.getItem('import_schema_mapping');
        if (savedStr) {
          const parsed = safeJsonParse(savedStr);
          if (result.headers.includes(parsed.skuKey) && result.headers.includes(parsed.qtyKey)) {
             finalMatchedKeys = parsed;
             result.items = transactionImportService.applyMapping(result.rawJson, finalMatchedKeys);
          }
        }
      } catch (err) {
        console.warn('Failed to load saved mapping', err);
      }

      setParsedData({ ...result, matchedKeys: finalMatchedKeys });
      setCurrentMapping(finalMatchedKeys);
      setStatus('preview');
      setMessage(`พบข้อมูล ${result.items.length} รายการ (อ้างอิงจากคอลัมน์: ${finalMatchedKeys.skuKey}, ${finalMatchedKeys.qtyKey})`);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage('เกิดข้อผิดพลาดในการอ่านไฟล์ โปรดตรวจสอบโครงสร้างคอลัมน์');
      setFile(null);
    }
    
    e.target.value = null;
  };

  const handleMappingChange = (key, value) => {
    const newMapping = { ...currentMapping, [key]: value };
    setCurrentMapping(newMapping);
    
    // Re-apply mapping
    const newItems = transactionImportService.applyMapping(parsedData.rawJson, newMapping);
    
    setParsedData(prev => ({
      ...prev,
      items: newItems,
      matchedKeys: newMapping
    }));
    
    localStorage.setItem('import_schema_mapping', JSON.stringify(newMapping));
    
    setMessage(`พบข้อมูล ${newItems.length} รายการ (อ้างอิงจากคอลัมน์: ${newMapping.skuKey}, ${newMapping.qtyKey})`);
  };

  const handleUpload = async () => {
    if (!parsedData || !parsedData.items) return;

    setStatus('uploading');
    setMessage('กำลังประมวลผลการปรับสต็อก...');

    try {
      const result = await transactionImportService.processTransactions(
        parsedData.items, 
        actionType,
        currentUser
      );
      
      setResult(result);
      setStatus('success');
      setMessage(result.message);
      
      if (onUploadComplete) {
        setTimeout(() => {
          onUploadComplete();
        }, 1000);
      }

      setTimeout(() => {
        resetState();
      }, 5000);

    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage(error.message || 'เกิดข้อผิดพลาดในการประมวลผลสต็อก');
    }
  };

  return {
    file, parsedData, status, message, result, actionType, currentMapping,
    setActionType, handleFileChange, handleMappingChange, handleUpload, resetState,
    fileInputRef
  };
}
