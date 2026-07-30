import { useState } from 'react';
import * as XLSX from 'xlsx';
import { inventoryService } from '../../../firebase/inventoryService';

export const EXPECTED_HEADERS = [
  'SKU', 'Name', 'Category', 'Brand', 'Unit', 'Price', 'RetailPrice', 
  'StockQuantity', 'AddStock', 'BufferStock', 'WarehouseLocation',
  'CompatibleModels', 'CompatiblePartNumbers', 'SubstituteSkus', 
  'LandingPageUrl', 'ShortDescription', 'Description', 
  'PackageW', 'PackageL', 'PackageH', 'Tags'
];

export function useExcelImport(onSuccess) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [conflictStrategy, setConflictStrategy] = useState('overwrite'); // 'overwrite', 'skip'
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [productsToImport, setProductsToImport] = useState([]);

  // Check if any row has an ERROR status
  const hasError = parsedData.some(row => row._status === 'ERROR');

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      EXPECTED_HEADERS,
      [
        'EXM-001', 'Example Screen 15.6', 'Screen', 'Generic', 'ชิ้น', 1000, 1500,
        10, '', 2, 'A1',
        'ModelA, ModelB', 'Part123, Part456', 'ALT-001',
        'https://store.com/exm-001', 'Short desc', 'Full long desc',
        '30', '40', '5', 'tag1, tag2'
      ]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'DH_Inventory_Import_Template.xlsx');
  };

  const mapDataToSchema = (rawRow, isNew, existing = null) => {
    const num = (val) => {
      if (val === undefined || val === '') return undefined;
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    };
    const arr = (val) => {
      if (val === undefined || val === '') return undefined;
      return String(val).split(',').map(s => s.trim()).filter(s => s);
    };
    const str = (val) => {
      if (val === undefined || val === '') return undefined;
      return String(val).trim();
    };

    const mapped = {};
    mapped.sku = String(rawRow['SKU'] || '').trim().toUpperCase();
    
    const setIfDef = (key, val, defaultIfNew) => {
      if (val !== undefined) mapped[key] = val;
      else if (isNew && defaultIfNew !== undefined) mapped[key] = defaultIfNew;
    };

    setIfDef('name', str(rawRow['Name']), '');
    setIfDef('category', str(rawRow['Category']), 'Other');
    setIfDef('brand', str(rawRow['Brand']), '');
    setIfDef('unit', str(rawRow['Unit']), 'ชิ้น');
    setIfDef('Price', num(rawRow['Price']), 0);
    setIfDef('retailPrice', num(rawRow['RetailPrice']), 0);
    
    // --- Stock Logic ---
    const hasSQ = rawRow['StockQuantity'] !== undefined && rawRow['StockQuantity'] !== '';
    const hasAS = rawRow['AddStock'] !== undefined && rawRow['AddStock'] !== '';
    
    if (hasSQ && hasAS) {
      mapped._hasStockConflict = true;
    } else if (hasAS) {
      const added = num(rawRow['AddStock']) || 0;
      mapped.stockQuantity = isNew ? added : ((existing?.stockQuantity || 0) + added);
      mapped._addStockAmount = added;
    } else {
      setIfDef('stockQuantity', num(rawRow['StockQuantity']), 0);
    }
    // -------------------

    if (rawRow['BufferStock'] !== undefined && rawRow['BufferStock'] !== '') {
      mapped.bufferStock = num(rawRow['BufferStock']);
    } else if (isNew) {
      mapped.bufferStock = null;
    }

    setIfDef('warehouseLocation', str(rawRow['WarehouseLocation']), '');
    
    const compatModels = arr(rawRow['CompatibleModels']);
    if (compatModels !== undefined) mapped.compatibleModels = compatModels;
    else if (isNew) mapped.compatibleModels = [];

    const compatParts = arr(rawRow['CompatiblePartNumbers']);
    if (compatParts !== undefined) mapped.compatiblePartNumbers = compatParts;
    else if (isNew) mapped.compatiblePartNumbers = [];

    const subs = arr(rawRow['SubstituteSkus']);
    if (subs !== undefined) mapped.substituteSkus = subs ? subs.map(s => s.toUpperCase()) : [];
    else if (isNew) mapped.substituteSkus = [];

    setIfDef('landingPageUrl', str(rawRow['LandingPageUrl']), '');
    setIfDef('shortDescription', str(rawRow['ShortDescription']), '');
    setIfDef('fullDescription', str(rawRow['Description']), ''); 

    const pw = str(rawRow['PackageW']);
    const pl = str(rawRow['PackageL']);
    const ph = str(rawRow['PackageH']);
    if (pw !== undefined || pl !== undefined || ph !== undefined) {
      mapped.packageSize = { w: pw || '', l: pl || '', h: ph || '' };
    } else if (isNew) {
      mapped.packageSize = { w: '', l: '', h: '' };
    }

    const tagsArr = arr(rawRow['Tags']);
    if (tagsArr !== undefined) mapped.tags = tagsArr;
    else if (isNew) mapped.tags = [];

    if (isNew) {
      mapped.images = [];
      mapped.isActive = true;
      mapped.externalLinks = { shopee: '', lazada: '', tiktok: '', facebook: '' };
      mapped.internalComments = [];
      mapped.randomSeed = Math.random();
    }

    return mapped;
  };

  const handleFileUpload = (uploadedFile) => {
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        
        if (data.length > 0) {
          setHeaders(Object.keys(data[0]));
          
          const skus = data.map(r => String(r['SKU'] || '').trim().toUpperCase()).filter(Boolean);
          const existingMap = await inventoryService.fetchExistingProducts(skus);
          const mappedItems = [];

          const analyzedData = data.map((rawRow) => {
            const sku = String(rawRow['SKU'] || '').trim().toUpperCase();
            if (!sku) return null;

            const isNew = !existingMap.has(sku);
            const existing = existingMap.get(sku);
            const item = mapDataToSchema(rawRow, isNew, existing);
            
            if (item._hasStockConflict) {
              return { ...rawRow, _status: 'ERROR', _errorReason: 'ระบุแค่ StockQuantity หรือ AddStock เท่านั้น ห้ามใส่สองช่องพร้อมกัน' };
            }

            mappedItems.push(item);

            if (isNew) {
              return { ...rawRow, _status: 'NEW', _changes: [] };
            }
            
            const changes = [];
            
            if (item.name !== undefined && item.name !== existing.name) 
              changes.push({ field: 'Name', old: existing.name, new: item.name });
            if (item.Price !== undefined && item.Price !== existing.Price) 
              changes.push({ field: 'Price', old: existing.Price, new: item.Price });
            
            if (item.stockQuantity !== undefined && item.stockQuantity !== existing.stockQuantity) {
              if (item._addStockAmount !== undefined) {
                changes.push({ field: 'Stock', old: existing.stockQuantity, new: item.stockQuantity, type: 'add', added: item._addStockAmount });
              } else {
                changes.push({ field: 'Stock', old: existing.stockQuantity, new: item.stockQuantity, type: 'overwrite' });
              }
            }
            
            if (changes.length > 0) {
              return { ...rawRow, _status: 'CHANGED', _changes: changes };
            } else {
              return { ...rawRow, _status: 'UNCHANGED', _changes: [] };
            }
          }).filter(Boolean);
          
          setParsedData(analyzedData);
          setProductsToImport(mappedItems.filter(p => p.sku && p.name));
        } else {
          alert('ไม่พบข้อมูลในไฟล์');
        }
      } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบว่าเป็นไฟล์ Excel (.xlsx)');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setImportResult(null);
    setProductsToImport([]);
    setIsProcessing(false);
  };

  const handleConfirmImport = async () => {
    if (productsToImport.length === 0 || hasError) return;
    
    setIsProcessing(true);
    try {
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
    file, headers, parsedData, conflictStrategy, isProcessing, importResult, hasError,
    setConflictStrategy, handleDownloadTemplate, handleFileUpload, handleReset, handleConfirmImport
  };
}
