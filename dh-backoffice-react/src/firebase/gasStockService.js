import { auth } from './config.js';
import { gasHistoryService } from './gasHistoryService.js';

// URL ใหม่จากการอัปเดต Deployment (แบบละเอียดยิบ)
const GAS_STOCK_URL = 'https://script.google.com/macros/s/AKfycbzLaT5ytHzrhF20NOSJFsEJ0oOckm2O_BfRGbxDa5KGRUKo4mPKMd0ZZoa3tOUgzdv2/exec';

class GasStockService {
  constructor() {
    this.queue = [];
    this.isFlushing = false;
    this.flushPromise = null;
    this.flushInterval = null;
    this.MAX_QUEUE_SIZE = 15;
    this.FLUSH_INTERVAL_MS = 5000;
    this.listeners = [];
    
    this._startQueueTimer();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  _notifyListeners() {
    const count = this.queue.length;
    this.listeners.forEach(cb => cb(count, this.isFlushing));
  }

  getPendingCount() {
    return this.queue.length;
  }

  async forceSync() {
    if (this.queue.length > 0 || this.isFlushing) {
      if (this.isFlushing && this.flushPromise) {
        await this.flushPromise;
      }
      if (this.queue.length > 0) {
        await this._flush();
      }
    }
  }

  // ✨ ฟังก์ชันสำหรับซิงค์ข้อมูลทั้งหมดครั้งแรก (แบ่งส่งทีละ 200 ป้องกัน CORS/Payload Too Large)
  async syncAllProducts(allProducts) {
    this.isFlushing = true;
    this._notifyListeners();

    try {
      const CHUNK_SIZE = 200;
      for (let i = 0; i < allProducts.length; i += CHUNK_SIZE) {
        const chunk = allProducts.slice(i, i + CHUNK_SIZE);
        
        const response = await fetch(GAS_STOCK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(chunk)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.status === "error") {
          throw new Error(result.message || "Unknown error from GAS");
        }
      }
      return true;
    } catch (error) {
      console.error("🔥 Failed to full sync stock to GAS:", error);
      throw error;
    } finally {
      this.isFlushing = false;
      this._notifyListeners();
    }
  }

  // ✨ ฟังก์ชันสำหรับดึงข้อมูลสินค้าทั้งหมดจาก Google Sheet (ทำ Cache-First Architecture)
  async fetchBackupInventory() {
    try {
      const urlWithCacheBuster = `${GAS_STOCK_URL}?t=${Date.now()}`;
      const response = await fetch(urlWithCacheBuster, {
        method: 'GET'
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      if (result.status === "success") {
        return result.data || [];
      } else {
        throw new Error(result.message || "Unknown error from GAS");
      }
    } catch (error) {
      console.error("🔥 Failed to fetch backup inventory from GAS:", error);
      throw error;
    }
  }

  _startQueueTimer() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flushInterval = setInterval(() => {
      this._flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * เก็บข้อมูลที่จะอัปเดตลงคิว
   */
  queueUpdate(productData) {
    try {
      this.queue.push({
        ...productData,
        _timestamp: new Date().toISOString()
      });
      this._notifyListeners();

      if (this.queue.length >= this.MAX_QUEUE_SIZE) {
        this._flush();
      }
    } catch (err) {
      console.error("Failed to queue stock update", err);
    }
  }

  async _flush() {
    if (this.queue.length === 0) return;
    if (this.isFlushing) {
      if (this.flushPromise) return this.flushPromise;
      return;
    }

    this.isFlushing = true;
    this._notifyListeners();
    // เอาข้อมูลแค่รายการล่าสุดของแต่ละ SKU (กันข้อมูลซ้ำซ้อน)
    const uniqueUpdates = {};
    for (const item of this.queue) {
      uniqueUpdates[item.sku] = item;
    }
    const batch = Object.values(uniqueUpdates);
    
    this.queue = []; // ล้างคิวเพื่อรับใหม่ทันที
    this._notifyListeners();

    this.flushPromise = (async () => {
      try {
        const response = await fetch(GAS_STOCK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(batch)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.status === "error") {
          throw new Error(result.message || "Unknown error from GAS");
        }
        
        gasHistoryService.log({
          level: 'DEBUG',
          module: 'GAS Sync',
          action: 'FlushStock',
          target: { id: 'SYSTEM', type: 'System' },
          details: {
            legacy_details: `ซิงค์สต๊อก ${batch.length} รายการไปยัง Sheet สำเร็จ`
          },
          actorOverride: { uid: 'System', name: 'System', email: 'N/A' }
        });
        
      } catch (error) {
        console.error("🔥 Failed to flush stock to GAS:", error);
        // ถ้าพัง เอากลับเข้าคิวใหม่
        this.queue = [...batch, ...this.queue];
      } finally {
        this.isFlushing = false;
        this.flushPromise = null;
        this._notifyListeners();
      }
    })();

    return this.flushPromise;
  }
}

export const gasStockService = new GasStockService();
