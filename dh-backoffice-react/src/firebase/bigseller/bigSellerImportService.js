import * as XLSX from 'xlsx';

class BigSellerImportService {
  
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

  /**
   * รับไฟล์ Template จาก Shopee/BigSeller มาอ่าน,
   * เติมข้อมูล สต็อก/ราคา โดยไม่แตะต้อง Item_ID และการผสานเซลล์ (Merged Cells),
   * แล้วส่งออกกลับเป็นไฟล์ .xlsx ทันที
   */
  processUpdateProductInfoTemplate(file, currentInventory) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error("ไม่ได้แนบไฟล์"));
      }
      if (!currentInventory || currentInventory.length === 0) {
        return reject(new Error("ไม่พบข้อมูลสินค้าในระบบ"));
      }

      const inventoryMap = new Map();
      currentInventory.forEach(item => {
        if (item.sku) inventoryMap.set(String(item.sku).trim(), item);
      });

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          // อ่านไฟล์โดยให้คงรูปแบบดั้งเดิมไว้มากที่สุด
          const wb = XLSX.read(data, { type: 'array', cellFormula: false, cellHTML: false });
          
          if (!wb.SheetNames || wb.SheetNames.length === 0) {
            return reject(new Error("ไฟล์ Excel ไม่มีแผ่นงาน (Sheet)"));
          }

          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          
          if (!ws['!ref']) {
            return reject(new Error("แผ่นงานว่างเปล่า"));
          }

          let updatedCount = 0;
          const range = XLSX.utils.decode_range(ws['!ref']);
          
          // วนลูปเพื่อเช็คทีละแถว เริ่มจากแถว 2 (Index 1) ข้าม Header
          for (let R = 1; R <= range.e.r; ++R) {
            // Shopee Template: SKU อยู่ที่คอลัมน์ F (Index 5)
            const skuCellAddress = XLSX.utils.encode_cell({ c: 5, r: R });
            const skuCell = ws[skuCellAddress];
            
            if (!skuCell || !skuCell.v) continue; // ข้ามแถวที่ไม่มี SKU
            
            const skuStr = String(skuCell.v).trim();
            const inventoryItem = inventoryMap.get(skuStr);
            
            if (inventoryItem) {
              // อัปเดตสต็อก ที่คอลัมน์ G (Index 6)
              const stockCellAddress = XLSX.utils.encode_cell({ c: 6, r: R });
              if (!ws[stockCellAddress]) ws[stockCellAddress] = { t: 'n' };
              ws[stockCellAddress].v = Number(inventoryItem.stockQuantity) || 0;
              ws[stockCellAddress].t = 'n'; // ตั้งชนิดเป็นตัวเลข

              // อัปเดตราคา ที่คอลัมน์ H (Index 7)
              const priceCellAddress = XLSX.utils.encode_cell({ c: 7, r: R });
              if (!ws[priceCellAddress]) ws[priceCellAddress] = { t: 'n' };
              ws[priceCellAddress].v = Number(inventoryItem.Price) || 0;
              ws[priceCellAddress].t = 'n';
              
              updatedCount++;
            }
          }

          // แปลงกลับเป็นไฟล์ โดยคง properties เดิมของ Sheet ไว้ (!merges, !cols)
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const originalName = file.name.replace(/\.[^/.]+$/, "");
          const fileName = `${originalName}_Updated_${this.getFormattedDate()}.xlsx`;
          
          this.downloadXlsxFile(wbout, fileName);
          
          resolve({
            success: true,
            updatedCount: updatedCount,
            fileName: fileName
          });

        } catch (err) {
          reject(new Error("การประมวลผลไฟล์ล้มเหลว: " + err.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
      };

      reader.readAsArrayBuffer(file);
    });
  }
}

export const bigSellerImportService = new BigSellerImportService();
