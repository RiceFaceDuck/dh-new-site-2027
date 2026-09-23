import { inventorySyncMetaService } from '../inventory/inventorySyncMetaService.js';
import { isTestProduct, parsePrice } from './bigSellerQueryService.js';

class BigSellerFullCatalogExportService {
  constructor() {
    this.inFlightPreparePromise = null;
  }

  generateReferenceId(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `EXP-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  async prepareFullCatalogDataset({ onProgress } = {}) {
    if (this.inFlightPreparePromise) return this.inFlightPreparePromise;

    this.inFlightPreparePromise = (async () => {
      try {
        const notify = typeof onProgress === 'function' ? onProgress : () => {};
        notify({ percent: 10, eventName: 'กำลังอ่านแคตตาล็อกสินค้า...', chunkRatio: '1/4' });

        // 1. Fetch full catalog from Local-First 3-Tier cache (IndexedDB 0 reads!)
        const catalogData = await inventorySyncMetaService.getOrFetchCatalog();
        const rawProducts = catalogData?.products || [];

        if (!rawProducts || rawProducts.length === 0) {
          throw new Error('ไม่พบข้อมูลสินค้าที่พร้อมใช้งานในคลัง');
        }

        notify({ percent: 45, eventName: 'กำลังจัดโครงสร้างคลังสินค้าและ Buffer...', chunkRatio: '2/4' });

        const warehouseName = (typeof localStorage !== 'undefined' && localStorage.getItem('bigseller_warehouse_name')) || '总仓库';
        const bufferStock = (typeof localStorage !== 'undefined' && parseInt(localStorage.getItem('bigseller_export_buffer') || '0', 10)) || 0;

        const dataset = rawProducts
          .filter(item => {
            const sku = String(item.sku || item.id || '').trim().toUpperCase();
            return sku !== '' && !isTestProduct(sku, item.name);
          })
          .map(item => {
            const sku = String(item.sku || item.id || '').trim().toUpperCase();
            const stock = Number(item.stockQuantity ?? item.qty ?? 0);
            const rp = parsePrice(item.retailPrice ?? item.Price ?? item.price ?? item.wholesalePrice);
            const wp = parsePrice(item.wholesalePrice ?? item.price ?? item.Price);
            const price = wp > 0 ? wp : (rp > 0 ? rp : 0);
            const retail = rp > 0 ? rp : price;
            return {
              sku,
              name: item.name || '',
              stockQuantity: stock,
              currentStock: stock,
              countStock: Math.max(0, stock - bufferStock),
              retailPrice: retail,
              wholesalePrice: price,
              Price: price,
              price,
              warehouse: warehouseName,
              bufferStock
            };
          });

        notify({ percent: 80, eventName: 'กำลังสร้างเลขอ้างอิงและบันทึกสถานะ...', chunkRatio: '3/4' });

        const now = new Date();
        const referenceId = this.generateReferenceId(now);
        const fullExportData = {
          isAllSkuMode: true,
          transactionId: referenceId,
          referenceId,
          itemCount: dataset.length,
          currentInventory: dataset,
          preparedAt: now,
          changes: {
            increased: dataset,
            decreased: [],
            priceChanged: [],
            otherChanged: []
          }
        };

        notify({
          percent: 100,
          eventName: 'เตรียมข้อมูลส่งออกสำเร็จ',
          chunkRatio: '4/4',
          completedChunks: 4,
          totalChunks: 4,
          completed: true,
          referenceId,
          itemCount: dataset.length
        });

        return {
          success: true,
          referenceId,
          itemCount: dataset.length,
          changes: fullExportData.changes,
          dataset,
          fullExportData
        };
      } finally {
        this.inFlightPreparePromise = null;
      }
    })();

    return this.inFlightPreparePromise;
  }
}

export const bigSellerFullCatalogExportService = new BigSellerFullCatalogExportService();
