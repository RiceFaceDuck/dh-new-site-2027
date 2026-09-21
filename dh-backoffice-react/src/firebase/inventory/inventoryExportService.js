import * as XLSX from 'xlsx';
import { withToastError } from '../../utils/safeAsync';
import { catalogHydrationService } from '../catalogHydrationService';
import { inventoryStatsService } from './inventoryStatsService';

export const inventoryExportService = {
  exportToExcel: async (columns, options) => {
    return withToastError((async () => {
      const {
        categories = [],
        stockRange = { min: '', max: '' },
        specificSkus = [],
        sortOption = 'sku_asc'
      } = options;

      // 1. ดึงข้อมูลสินค้าทั้งหมดจาก 3-Tier Catalog Cache (0 Firestore Reads on warm cache)
      const { products: rawCatalog } = await catalogHydrationService.hydrateCatalog();
      const baseProducts = Array.isArray(rawCatalog) ? rawCatalog : [];

      // 2. เติมข้อมูลสถิติ 5 มิติ (30 วัน) จาก snapshot cache
      const statsMap = await inventoryStatsService.fetchProductStats(baseProducts, '30');
      let products = baseProducts.map(p => {
        const upperSku = p.sku ? String(p.sku).trim().toUpperCase() : '';
        const st = statsMap[p.sku] || statsMap[upperSku] || {};
        return {
          ...p,
          stockInHistory: { ...p.stockInHistory, '30': st.stockIn ?? p.stockInHistory?.['30'] ?? 0 },
          salesHistory: { ...p.salesHistory, '30': st.sales ?? p.salesHistory?.['30'] ?? 0 },
          claimHistory: { ...p.claimHistory, '30': st.claim ?? p.claimHistory?.['30'] ?? 0 },
          adjustmentHistory: { ...p.adjustmentHistory, '30': st.adjustment ?? p.adjustmentHistory?.['30'] ?? 0 }
        };
      });

      // 3. การคัดกรองข้อมูล (Filtering)
      if (specificSkus && specificSkus.length > 0) {
        const skuSet = new Set(specificSkus.map(s => String(s).trim().toUpperCase()));
        products = products.filter(p => skuSet.has(String(p.sku || '').trim().toUpperCase()));
      } else {
        if (categories.length > 0) {
          const catSet = new Set(categories.map(c => String(c).trim().toLowerCase()));
          products = products.filter(p => catSet.has(String(p.category || '').trim().toLowerCase()));
        }

        if (stockRange.min !== '') {
          const min = Number(stockRange.min);
          products = products.filter(p => Number(p.stockQuantity || 0) >= min);
        }
        if (stockRange.max !== '') {
          const max = Number(stockRange.max);
          products = products.filter(p => Number(p.stockQuantity || 0) <= max);
        }
      }

      // 4. การจัดเรียงข้อมูล (Sorting)
      products.sort((a, b) => {
        const getSales = (p) => Number(p.salesHistory?.['30'] || 0);
        const getClaims = (p) => Number(p.claimHistory?.['30'] || 0);
        const getStockIn = (p) => Number(p.stockInHistory?.['30'] || 0);
        const getAdjustment = (p) => Number(p.adjustmentHistory?.['30'] || 0);

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
          case 'adjustments_desc': return getAdjustment(b) - getAdjustment(a);
          default: return 0;
        }
      });

      if (products.length === 0) {
        throw new Error("ไม่พบข้อมูลสินค้าที่ตรงกับเงื่อนไขที่ระบุ");
      }

      // 5. การประกอบข้อมูล (Mapping)
      const exportData = products.map(product => {
        const row = {};
        columns.forEach(col => {
          if (col.key === 'sales30d') {
            row[col.label] = product.salesHistory?.['30'] ?? 0;
          } else if (col.key === 'claims30d') {
            row[col.label] = product.claimHistory?.['30'] ?? 0;
          } else if (col.key === 'stockin30d') {
            row[col.label] = product.stockInHistory?.['30'] ?? 0;
          } else if (col.key === 'adjustments30d') {
            row[col.label] = product.adjustmentHistory?.['30'] ?? 0;
          } else {
            row[col.label] = product[col.key] !== undefined ? product[col.key] : '';
            if (Array.isArray(row[col.label])) {
              row[col.label] = row[col.label].join(', ');
            }
          }
        });
        return row;
      });

      // 6. สร้างไฟล์ Excel
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory_Export');
      
      const fileName = `DH_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      return { success: true, count: products.length };
    })(), "เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel");
  }
};
