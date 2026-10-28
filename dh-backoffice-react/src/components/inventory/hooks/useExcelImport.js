import { useState } from 'react';
import * as XLSX from 'xlsx';
import { inventoryService } from '../../../firebase/inventoryService';
import toast from 'react-hot-toast';
import { detectRowChanges } from '../import/excelDiffService';

export const EXPECTED_HEADERS = [
  'SKU', 'Name', 'Category', 'Brand', 'Unit', 'Price (ราคาส่ง)', 'RetailPrice', 
  'นับสต๊อค', 'AddStock', 'BufferStock', 'WarehouseLocation',
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
  const [analysisProgress, setAnalysisProgress] = useState(null); // { current, total, totalRows, percent, stage: 'reading' | 'scanning' | 'analyzing' }
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

    // 🛡️ Selective Column-Level Patching:
    // ช่องว่าง = ไม่แตะต้องข้อมูลเดิมในระบบ | มีค่า = เขียนทับเฉพาะคอลัมน์นั้น
    setIfDef('name', str(rawRow['Name']), str(rawRow['SKU']) || '');
    setIfDef('category', str(rawRow['Category']), 'Other');
    setIfDef('brand', str(rawRow['Brand']), '');
    setIfDef('unit', str(rawRow['Unit']), 'ชิ้น');
    
    // 🏷️ Smart Price Recognition: รองรับ 'Price (ราคาส่ง)', 'Price', 'ราคาส่ง'
    const rawPrice = rawRow['Price (ราคาส่ง)'] ?? rawRow['Price(ราคาส่ง)'] ?? rawRow['Price'] ?? rawRow['price'] ?? rawRow['ราคาส่ง'];
    setIfDef('Price', num(rawPrice), 0);
    setIfDef('retailPrice', num(rawRow['RetailPrice']), 0);
    
    // --- Stock Logic ---
    // 📦 Smart Stock Recognition: รองรับ 'นับสต๊อค', 'นับสต๊อก', 'StockQuantity', 'Stock'
    const rawSQ = rawRow['นับสต๊อค'] ?? rawRow['นับสต๊อก'] ?? rawRow['StockQuantity'] ?? rawRow['stockQuantity'] ?? rawRow['Stock'] ?? rawRow['stock'];
    const rawAS = rawRow['AddStock'] ?? rawRow['addStock'] ?? rawRow['เพิ่มสต๊อก'] ?? rawRow['เพิ่มสต๊อค'];

    const hasSQ = rawSQ !== undefined && rawSQ !== '';
    const hasAS = rawAS !== undefined && rawAS !== '';
    
    if (hasSQ && hasAS) {
      mapped._hasStockConflict = true;
    } else if (hasAS) {
      const added = num(rawAS) || 0;
      mapped.stockQuantity = isNew ? added : ((existing?.stockQuantity || 0) + added);
      mapped._addStockAmount = added;
    } else if (hasSQ) {
      const countedStock = num(rawSQ) ?? 0;
      mapped.stockQuantity = countedStock;
      if (!isNew && existing) {
        const oldStock = Number(existing.stockQuantity || 0);
        mapped._adjustmentDiff = countedStock - oldStock;
      }
    } else if (isNew) {
      mapped.stockQuantity = 0;
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
      // 🔒 นโยบายความปลอดภัย: สินค้าใหม่จาก Excel ต้อง "ถูกซ่อน" (isActive: false) ไว้เสมอ
      // จนกว่าจะมีพนักงานไปตรวจสอบข้อมูลและเปิดด้วยมือตนเอง
      mapped.isActive = false;
      mapped.externalLinks = { shopee: '', lazada: '', tiktok: '', facebook: '' };
      mapped.internalComments = [];
      mapped.randomSeed = Math.random();
    } else if (existing) {
      // 🛡️ Preserve existing media & metadata to prevent clobbering with empty defaults
      if (Array.isArray(existing.images) && existing.images.length > 0) {
        mapped.images = existing.images;
      }
      if (existing.image) mapped.image = existing.image;
      if (existing.imageUrl) mapped.imageUrl = existing.imageUrl;
      if (existing.externalLinks && mapped.externalLinks === undefined) {
        mapped.externalLinks = existing.externalLinks;
      }
      // 🔒 สินค้าเดิม: คงสถานะ isActive เดิมไว้ 100% (ถ้าเคยซ่อนอยู่ ก็ต้องซ่อนต่อไปเด็ดขาด)
      mapped.isActive = existing.isActive !== undefined ? existing.isActive : true;
      if (existing.internalComments && mapped.internalComments === undefined) {
        mapped.internalComments = existing.internalComments;
      }
    }

    // 🚀 Ensure category_lower is always generated for frontend category matching
    const finalCategory = mapped.category || existing?.category || (isNew ? 'Other' : '');
    if (finalCategory) {
      mapped.category_lower = finalCategory.trim().toLowerCase();
    }

    return mapped;
  };

  const handleFileUpload = (uploadedFile) => {
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    setAnalysisProgress({ current: 0, total: 0, totalRows: 0, percent: 0, stage: 'reading' });

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
          
          // 🚀 ขั้นที่ 1: ตรวจนับแถวทั้งหมด และกรองเฉพาะแถวที่มี SKU เบื้องต้น
          const totalRows = data.length;
          const rowsWithSku = data.filter(r => String(r['SKU'] || '').trim() !== '');
          const totalValidSkus = rowsWithSku.length;

          setAnalysisProgress({
            current: 0,
            total: totalValidSkus,
            totalRows: totalRows,
            percent: 0,
            stage: 'scanning'
          });

          // ให้ UI ได้ขยับแสดงสถานะรอบแรก
          await new Promise(r => setTimeout(r, 60));

          const skus = rowsWithSku.map(r => String(r['SKU'] || '').trim().toUpperCase());
          const fetchedExistingMap = await inventoryService.fetchExistingProducts(skus);
          setExistingMap(fetchedExistingMap);
          
          // 🔍 ตรวจจับ SKU ซ้ำในไฟล์ Excel (Duplicate In-File Detection)
          const skuFrequency = new Map();
          rowsWithSku.forEach(r => {
            const s = String(r['SKU'] || '').trim().toUpperCase();
            if (s) skuFrequency.set(s, (skuFrequency.get(s) || 0) + 1);
          });

          const mappedItems = [];
          const analyzedData = [];

          // 🚀 ขั้นที่ 2: ซอยวิเคราะห์ทีละก้อน (Chunked Processing) พร้อมอัปเดตตัวเลขสด (XXXX / XXXX)
          const CHUNK_SIZE = 100;
          for (let i = 0; i < rowsWithSku.length; i += CHUNK_SIZE) {
            const chunk = rowsWithSku.slice(i, i + CHUNK_SIZE);
            
            for (const rawRow of chunk) {
              const sku = String(rawRow['SKU'] || '').trim().toUpperCase();
              if (!sku) continue;

              const isNew = !fetchedExistingMap.has(sku);
              const existing = fetchedExistingMap.get(sku);
              const item = mapDataToSchema(rawRow, isNew, existing);
              
              const isDuplicateInFile = (skuFrequency.get(sku) || 0) > 1;

              // แสดงชื่อสินค้าเดิมในพรีวิวเมื่อ Excel ไม่มีคอลัมน์ชื่อ เพื่อความชัดเจนของแอดมิน
              const previewRow = {
                ...rawRow,
                Name: rawRow['Name'] || existing?.name || (isNew ? sku : ''),
                _isDuplicateInFile: isDuplicateInFile,
                _duplicateWarning: isDuplicateInFile ? `พบ SKU ${sku} ซ้ำอยู่ในไฟล์ กรุณาตรวจสอบ` : null
              };

              if (item._hasStockConflict) {
                analyzedData.push({ ...previewRow, _status: 'ERROR', _errorReason: 'ระบุแค่ นับสต๊อค หรือ AddStock เท่านั้น ห้ามใส่สองช่องพร้อมกัน' });
                continue;
              }

              if (isNew) {
                item._status = 'NEW';
                mappedItems.push(item);
                analyzedData.push({ ...previewRow, _status: 'NEW', _changes: [] });
                continue;
              }
              
              const changes = detectRowChanges(item, existing);
              
              if (changes.length > 0) {
                item._status = 'CHANGED';
                mappedItems.push(item);
                analyzedData.push({ ...previewRow, _status: 'CHANGED', _changes: changes });
              } else {
                item._status = 'UNCHANGED';
                mappedItems.push(item);
                analyzedData.push({ ...previewRow, _status: 'UNCHANGED', _changes: [] });
              }
            }

            const currentCount = Math.min(i + CHUNK_SIZE, totalValidSkus);
            setAnalysisProgress({
              current: currentCount,
              total: totalValidSkus,
              totalRows: totalRows,
              percent: Math.round((currentCount / totalValidSkus) * 100),
              stage: 'analyzing'
            });

            // คืนคิวให้เบราว์เซอร์ขยับจอ ทำให้ป๊อปอัปวิ่งตัวเลข (XXXX/XXXX) ได้สดๆ
            await new Promise(r => setTimeout(r, 0));
          }
          
          // 🚀 จัดเรียงลำดับการแสดงผล: ผิดพลาด (ERROR) -> ข้อมูลใหม่ (NEW) -> ข้อมูลเปลี่ยนแปลง (CHANGED) -> ข้อมูลคงเดิม (UNCHANGED)
          const STATUS_PRIORITY = { ERROR: 0, NEW: 1, CHANGED: 2, UNCHANGED: 3 };
          analyzedData.sort((a, b) => {
            const pA = STATUS_PRIORITY[a._status] ?? 99;
            const pB = STATUS_PRIORITY[b._status] ?? 99;
            return pA - pB;
          });

          setParsedData(analyzedData);
          // 🛡️ Selective Column Patching: กรองเฉพาะแถวที่มี SKU (ไม่ตัดทิ้งเมื่อไม่มี Name)
          setProductsToImport(mappedItems.filter(p => p && p.sku));
        } else {
          toast.error('ไม่พบข้อมูลในไฟล์ Excel');
        }
      } catch (err) {
        console.error(err);
        toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบว่าเป็นไฟล์ Excel (.xlsx)');
      } finally {
        setIsProcessing(false);
        setAnalysisProgress(null);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const [existingMap, setExistingMap] = useState(null);
  const [importProgress, setImportProgress] = useState(null); // { current, total, percent }

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setImportResult(null);
    setProductsToImport([]);
    setExistingMap(null);
    setImportProgress(null);
    setAnalysisProgress(null);
    setIsProcessing(false);
  };

  const handleConfirmImport = async () => {
    if (productsToImport.length === 0 || hasError) {
      if (productsToImport.length === 0) {
        toast.error('ไม่พบรายการสินค้าที่สามารถนำเข้าได้');
      } else if (hasError) {
        toast.error('มีข้อมูลที่ไม่ถูกต้องในไฟล์ กรุณาแก้ไขก่อนนำเข้า');
      }
      return;
    }
    
    setIsProcessing(true);
    setImportProgress({ current: 0, total: 1, percent: 0 });
    try {
      const result = await inventoryService.processBulkImport(
        productsToImport, 
        conflictStrategy, 
        existingMap,
        (p) => setImportProgress(p)
      );
      setImportResult(result);
      toast.success(`นำเข้าสินค้าสำเร็จ ${result.successCount || 0} รายการ`);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดขณะนำเข้าข้อมูล: ' + (error?.message || ''));
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  };

  return {
    file, headers, parsedData, conflictStrategy, isProcessing, analysisProgress, importProgress, importResult, hasError,
    setConflictStrategy, handleDownloadTemplate, handleFileUpload, handleReset, handleConfirmImport
  };
}
