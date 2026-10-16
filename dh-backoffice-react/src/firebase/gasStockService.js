import { gasHistoryService } from './gasHistoryService.js';

// URL ใหม่จากการอัปเดต Deployment (แบบละเอียดยิบ)
const GAS_STOCK_URL = 'https://script.google.com/macros/s/AKfycbzLaT5ytHzrhF20NOSJFsEJ0oOckm2O_BfRGbxDa5KGRUKo4mPKMd0ZZoa3tOUgzdv2/exec';

class GasStockService {
  constructor() {
    this.queue = [];
    this.optimisticCache = new Map(); // เก็บค่าชั่วคราวระหว่างรอ GAS อัปเดต
    this.isFlushing = false;
    this.flushPromise = null;
    this.flushInterval = null;
    this.MAX_QUEUE_SIZE = 15;
    this.FLUSH_INTERVAL_MS = 5000;
    this.listeners = [];
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
        const data = result.data || [];
        
        // 🚀 Optimistic Update: เอาค่าใหม่ที่อยู่ในคิวมาทับค่าจาก GAS ชั่วคราว (แก้บั๊ก 8 โชว์ 2)
        if (this.optimisticCache.size > 0) {
          const now = Date.now();
          data.forEach(item => {
            const sku = String(item.sku).trim().toUpperCase();
            const cacheEntry = this.optimisticCache.get(sku);
            if (cacheEntry) {
              if (now - cacheEntry.timestamp < 60000) { // หมดอายุใน 60 วินาที
                item.stockQuantity = cacheEntry.stockQuantity;
              } else {
                this.optimisticCache.delete(sku);
              }
            }
          });
        }
        
        return data;
      } else {
        throw new Error(result.message || "Unknown error from GAS");
      }
    } catch (error) {
      console.error("🔥 Failed to fetch backup inventory from GAS:", error);
      throw error;
    }
  }

  _startQueueTimer() {
    if (this.flushInterval) return;
    this.flushInterval = setInterval(() => {
      if (this.queue.length === 0) {
        this._stopQueueTimer();
        return;
      }
      this._flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  _stopQueueTimer() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * เก็บข้อมูลที่จะอัปเดตลงคิว
   */
  queueUpdate(productData) {
    try {
      if (productData.sku) {
        this.optimisticCache.set(String(productData.sku).trim().toUpperCase(), {
          stockQuantity: productData.stockQuantity,
          timestamp: Date.now()
        });
      }
      
      this.queue.push({
        ...productData,
        _timestamp: new Date().toISOString()
      });
      this._notifyListeners();

      if (this.queue.length >= this.MAX_QUEUE_SIZE) {
        this._flush();
      } else {
        this._startQueueTimer();
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
      const CHUNK_SIZE = 200;
      let sentCount = 0;
      const failedItems = [];

      try {
        for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
          const chunk = batch.slice(i, i + CHUNK_SIZE);
          try {
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
            sentCount += chunk.length;
          } catch (chunkErr) {
            console.error(`🔥 Failed to flush chunk ${Math.floor(i / CHUNK_SIZE) + 1} to GAS:`, chunkErr);
            failedItems.push(...batch.slice(i));
            break;
          }
        }

        if (sentCount > 0) {
          gasHistoryService.log({
            level: 'DEBUG',
            module: 'GAS Sync',
            action: 'FlushStock',
            target: { id: 'SYSTEM', type: 'System' },
            details: {
              legacy_details: `ซิงค์สต๊อก ${sentCount}/${batch.length} รายการไปยัง Sheet สำเร็จ`
            },
            actorOverride: { uid: 'System', name: 'System', email: 'N/A' }
          });
        }

        if (failedItems.length > 0) {
          // ถ้ามีก้อนที่พัง เอากลับเข้าคิวใหม่เฉพาะก้อนที่ยังส่งไม่สำเร็จ
          this.queue = [...failedItems, ...this.queue];
        }
      } catch (error) {
        console.error("🔥 Failed to flush stock to GAS:", error);
        // ถ้าพังระดับ root เอากลับเข้าคิวใหม่
        this.queue = [...batch, ...this.queue];
      } finally {
        this.isFlushing = false;
        this.flushPromise = null;
        if (this.queue.length === 0) {
          this._stopQueueTimer();
        }
        this._notifyListeners();
      }
    })();

    return this.flushPromise;
  }
}

export const gasStockService = new GasStockService();
