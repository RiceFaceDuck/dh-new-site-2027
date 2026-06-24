import * as XLSX from 'xlsx';

class BigSellerExportService {

  getFormattedDate() {
    const d = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  downloadXlsxFile(wbout, fileName) {
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }
  }

  getChangedStockItems(changes) {
    const allChanged = [...(changes?.increased || []), ...(changes?.decreased || [])];
    const uniqueSkus = new Map();
    allChanged.forEach(item => {
      if (item.sku) uniqueSkus.set(item.sku, item);
    });
    return Array.from(uniqueSkus.values());
  }

  getTemplateBuffer(key) {
    const base64 = localStorage.getItem(key);
    if (!base64) throw new Error("ยังไม่ได้ตั้งค่า Template กรุณาไปที่เมนูตั้งค่า (⚙️) มุมขวาบน");
    
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * อ่าน Template SKU Merchant จาก LocalStorage และหยอดข้อมูลลงไปแบบ Dynamic
   */
  async processSkuMerchantTemplate(changes) {
    const changedItems = this.getChangedStockItems(changes);
    if (!changedItems || changedItems.length === 0) {
      throw new Error("ไม่มีข้อมูลสินค้าที่มีการเปลี่ยนแปลง");
    }

    try {
      const buffer = this.getTemplateBuffer('bigseller_template_sku');
      const data = new Uint8Array(buffer);
      const wb = XLSX.read(data, { type: 'array', cellFormula: false, cellHTML: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      
      if (!ws['!ref']) throw new Error("แผ่นงานว่างเปล่า");
      const range = XLSX.utils.decode_range(ws['!ref']);
      
      // ค้นหาคอลัมน์ SKU แบบ Dynamic
      let skuColIdx = 0; // Default ไปที่ A
      for(let C = range.s.c; C <= range.e.c; ++C) {
         const cell = ws[XLSX.utils.encode_cell({c: C, r: range.s.r})];
         if(cell && cell.v && String(cell.v).toLowerCase().includes('sku')) {
             skuColIdx = C; break;
         }
      }

      let currentRow = range.e.r + 1; // เริ่มต่อท้าย
      
      changedItems.forEach(item => {
        const cellAddress = XLSX.utils.encode_cell({c: skuColIdx, r: currentRow});
        ws[cellAddress] = { t: 's', v: item.sku };
        currentRow++;
      });

      // ขยายขนาด Range เพื่อคลุมแถวที่เพิ่งเพิ่มเข้าไป
      range.e.r = currentRow - 1;
      ws['!ref'] = XLSX.utils.encode_range(range);
      
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileName = `SKU_Merchant_Filled_${this.getFormattedDate()}.xlsx`;
      
      this.downloadXlsxFile(wbout, fileName);
      return { success: true, itemCount: changedItems.length, fileName };

    } catch (err) {
      throw new Error("การประมวลผลไฟล์ล้มเหลว: " + err.message);
    }
  }

  /**
   * อ่าน Template Inventory Count จาก LocalStorage และหยอดข้อมูลลงไปแบบ Dynamic
   */
  async processInventoryCountTemplate(changes) {
    const changedItems = this.getChangedStockItems(changes);
    if (!changedItems || changedItems.length === 0) {
      throw new Error("ไม่มีข้อมูลสินค้าที่มีการเปลี่ยนแปลง");
    }

    try {
      const buffer = this.getTemplateBuffer('bigseller_template_inventory');
      const data = new Uint8Array(buffer);
      const wb = XLSX.read(data, { type: 'array', cellFormula: false, cellHTML: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      
      if (!ws['!ref']) throw new Error("แผ่นงานว่างเปล่า");
      const range = XLSX.utils.decode_range(ws['!ref']);
      
      // Map คอลัมน์แบบ Dynamic
      const colMap = { sku: 0, warehouse: 2, currentStock: 4, countStock: 5 }; // Defaults
      const headerRow = range.s.r;
      
      for(let C = range.s.c; C <= range.e.c; ++C) {
         const cell = ws[XLSX.utils.encode_cell({c: C, r: headerRow})];
         if(cell && cell.v) {
             const text = String(cell.v).replace(/\s/g, '').toLowerCase();
             if(text.includes('sku')) colMap.sku = C;
             else if(text.includes('คลังสินค้า') || text.includes('warehouse')) colMap.warehouse = C;
             else if(text.includes('สต็อกที่มีอยู่') || text.includes('currentstock')) colMap.currentStock = C;
             else if(text.includes('จำนวนการนับ') || text.includes('count')) colMap.countStock = C;
         }
      }

      let currentRow = range.e.r + 1;
      
      changedItems.forEach(item => {
        const stock = Number(item.newStock) || 0;
        
        // SKU
        ws[XLSX.utils.encode_cell({c: colMap.sku, r: currentRow})] = { t: 's', v: item.sku };
        // Warehouse (default "warehouse1" or "总仓库" based on user's setup, usually warehouse1 per image)
        ws[XLSX.utils.encode_cell({c: colMap.warehouse, r: currentRow})] = { t: 's', v: "warehouse1" };
        // Current Stock
        ws[XLSX.utils.encode_cell({c: colMap.currentStock, r: currentRow})] = { t: 'n', v: stock };
        // Count Stock
        ws[XLSX.utils.encode_cell({c: colMap.countStock, r: currentRow})] = { t: 'n', v: stock };
        
        currentRow++;
      });

      // ขยาย Range ให้ครอบคลุมการแก้ไข
      range.e.r = currentRow - 1;
      // ขยาย Range ของคอมลัมน์ให้ครอบคลุมกรณีที่ template มีคอมลัมน์สั้นกว่าที่เราเขียน
      const maxCol = Math.max(colMap.sku, colMap.warehouse, colMap.currentStock, colMap.countStock);
      if (range.e.c < maxCol) range.e.c = maxCol;

      ws['!ref'] = XLSX.utils.encode_range(range);
      
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileName = `InventoryCount_Filled_${this.getFormattedDate()}.xlsx`;
      
      this.downloadXlsxFile(wbout, fileName);
      return { success: true, itemCount: changedItems.length, fileName };

    } catch (err) {
      throw new Error("การประมวลผลไฟล์ล้มเหลว: " + err.message);
    }
  }
}

export const bigSellerExportService = new BigSellerExportService();
