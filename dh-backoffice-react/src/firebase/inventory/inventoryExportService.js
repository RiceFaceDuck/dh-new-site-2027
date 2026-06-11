import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../config';
import * as XLSX from 'xlsx';

export const inventoryExportService = {
  exportToExcel: async (columns, options) => {
    try {
      const {
        categories = [],
        stockRange = { min: '', max: '' },
        specificSkus = [],
        sortOption = 'sku_asc'
      } = options;

      // 1. ดึงข้อมูลสินค้าทั้งหมด (เนื่องจากการ Filter ซับซ้อนมาก ต้องทำฝั่ง Client)
      const q = query(collection(db, 'products'));
      const snapshot = await getDocs(q);
      let products = snapshot.docs.map(doc => doc.data());

      // 2. การคัดกรองข้อมูล (Filtering)
      if (specificSkus && specificSkus.length > 0) {
        // หากมีการระบุ SKU จะข้ามเงื่อนไขอื่นทั้งหมด
        const skuSet = new Set(specificSkus.map(s => String(s).trim().toUpperCase()));
        products = products.filter(p => skuSet.has(String(p.sku).toUpperCase()));
      } else {
        // กรองตามหมวดหมู่ (ถ้ามีการเลือก)
        if (categories.length > 0) {
          products = products.filter(p => categories.includes(p.category));
        }

        // กรองตามช่วงจำนวนสต๊อก
        if (stockRange.min !== '') {
          const min = Number(stockRange.min);
          products = products.filter(p => Number(p.stockQuantity || 0) >= min);
        }
        if (stockRange.max !== '') {
          const max = Number(stockRange.max);
          products = products.filter(p => Number(p.stockQuantity || 0) <= max);
        }
      }

      // 3. การจัดเรียงข้อมูล (Sorting)
      products.sort((a, b) => {
        const getSales = (p) => p.salesHistory?.['30'] || 0;
        const getClaims = (p) => p.claimHistory?.['30'] || 0;
        const getStockIn = (p) => p.stockInHistory?.['30'] || 0;

        switch (sortOption) {
          case 'sku_asc': return (a.sku || '').localeCompare(b.sku || '');
          case 'sku_desc': return (b.sku || '').localeCompare(a.sku || '');
          case 'stock_asc': return Number(a.stockQuantity || 0) - Number(b.stockQuantity || 0);
          case 'stock_desc': return Number(b.stockQuantity || 0) - Number(a.stockQuantity || 0);
          case 'price_asc': return Number(a.Price || 0) - Number(b.Price || 0);
          case 'price_desc': return Number(b.Price || 0) - Number(a.Price || 0);
          case 'sales_desc': return getSales(b) - getSales(a);
          case 'claims_desc': return getClaims(b) - getClaims(a);
          case 'stockin_desc': return getStockIn(b) - getStockIn(a);
          default: return 0;
        }
      });

      if (products.length === 0) {
        throw new Error("ไม่พบข้อมูลสินค้าที่ตรงกับเงื่อนไขที่ระบุ");
      }

      // 4. การประกอบข้อมูล (Mapping)
      const exportData = products.map(product => {
        const row = {};
        columns.forEach(col => {
          // เพิ่มเติมสำหรับข้อมูลพิเศษ
          if (col.key === 'sales30d') {
            row[col.label] = product.salesHistory?.['30'] || 0;
          } else if (col.key === 'claims30d') {
            row[col.label] = product.claimHistory?.['30'] || 0;
          } else if (col.key === 'stockin30d') {
            row[col.label] = product.stockInHistory?.['30'] || 0;
          } else {
            row[col.label] = product[col.key] !== undefined ? product[col.key] : '';
            if (Array.isArray(row[col.label])) {
              row[col.label] = row[col.label].join(', ');
            }
          }
        });
        return row;
      });

      // 5. สร้างไฟล์ Excel
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory_Export');
      
      const fileName = `DH_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      return { success: true, count: products.length };
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    }
  }
};
