import { useState } from 'react';
import * as XLSX from 'xlsx';
import { inventoryService } from '../../../firebase/inventoryService';

export const EXPECTED_HEADERS = [
  'SKU', 'Name', 'Category', 'Brand', 'Unit', 'Price', 'RetailPrice', 
  'StockQuantity', 'BufferStock', 'WarehouseLocation', 'ImageUrl', 
  'CompatibleModels', 'CompatiblePartNumbers', 'SubstituteSkus', 
  'LandingPageUrl', 'ShortDescription', 'Description', 
  'PackageW', 'PackageL', 'PackageH', 'Tags'
];

export function useExcelImport(onSuccess) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [conflictStrategy, setConflictStrategy] = useState('todo'); // 'overwrite', 'skip', 'todo'
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      EXPECTED_HEADERS,
      [
        'EXM-001', 'Example Screen 15.6', 'Screen', 'Generic', 'ชิ้น', 1000, 1500,
        10, 2, 'A1', 'https://example.com/img.jpg',
        'ModelA, ModelB', 'Part123, Part456', 'ALT-001',
        'https://store.com/exm-001', 'Short desc', 'Full long desc',
        '30', '40', '5', 'tag1, tag2'
      ]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'DH_Inventory_Import_Template.xlsx');
  };

  const handleFileUpload = (uploadedFile) => {
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        
        if (data.length > 0) {
          setHeaders(Object.keys(data[0]));
          setParsedData(data);
        } else {
          alert('ไม่พบข้อมูลในไฟล์');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบว่าเป็นไฟล์ Excel (.xlsx)');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setImportResult(null);
    setIsProcessing(false);
  };

  const mapDataToSchema = (rawRow) => {
    const num = (val, defaultVal = 0) => {
      const n = Number(val);
      return isNaN(n) ? defaultVal : n;
    };
    const arr = (val) => {
      if (!val) return [];
      return String(val).split(',').map(s => s.trim()).filter(s => s);
    };

    return {
      sku: String(rawRow['SKU'] || '').trim().toUpperCase(),
      name: String(rawRow['Name'] || '').trim(),
      category: String(rawRow['Category'] || 'Other').trim(),
      brand: String(rawRow['Brand'] || '').trim(),
      unit: String(rawRow['Unit'] || 'ชิ้น').trim(),
      Price: num(rawRow['Price']),
      retailPrice: num(rawRow['RetailPrice']),
      stockQuantity: num(rawRow['StockQuantity']),
      bufferStock: rawRow['BufferStock'] === '' ? null : num(rawRow['BufferStock']),
      warehouseLocation: String(rawRow['WarehouseLocation'] || '').trim(),
      images: rawRow['ImageUrl'] ? [String(rawRow['ImageUrl']).trim()] : [],
      compatibleModels: arr(rawRow['CompatibleModels']),
      compatiblePartNumbers: arr(rawRow['CompatiblePartNumbers']),
      substituteSkus: arr(rawRow['SubstituteSkus']).map(s => s.toUpperCase()),
      landingPageUrl: String(rawRow['LandingPageUrl'] || '').trim(),
      shortDescription: String(rawRow['ShortDescription'] || '').trim(),
      description: String(rawRow['Description'] || '').trim(),
      packageSize: {
        w: String(rawRow['PackageW'] || ''),
        l: String(rawRow['PackageL'] || ''),
        h: String(rawRow['PackageH'] || '')
      },
      tags: arr(rawRow['Tags']),
      isActive: true,
      externalLinks: { shopee: '', lazada: '', tiktok: '', facebook: '' },
      comment: '',
      internalComments: []
    };
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;
    
    if (!headers.includes('SKU') || !headers.includes('Name')) {
      alert('ไฟล์จำเป็นต้องมีคอลัมน์ SKU และ Name เป็นอย่างน้อย แนะนำให้โหลด Template ไปใช้งาน');
      return;
    }

    setIsProcessing(true);
    try {
      const productsToImport = parsedData
        .map(mapDataToSchema)
        .filter(p => p.sku && p.name);

      const result = await inventoryService.processBulkImport(productsToImport, conflictStrategy);
      setImportResult(result);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดขณะนำเข้าข้อมูล: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    file, headers, parsedData, conflictStrategy, isProcessing, importResult,
    setConflictStrategy, handleDownloadTemplate, handleFileUpload, handleReset, handleConfirmImport
  };
}
