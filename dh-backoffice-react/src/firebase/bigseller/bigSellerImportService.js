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
   * สแกนหา Header แบบไดนามิกสูงสุด 25 แถวแรก
   * เพื่อรองรับทั้งไฟล์เทมเพลต Shopee/BigSeller แบบแถวเดียวและแบบหลายแถว (Multi-row header)
   */
  detectHeaderLayout(ws, range, maxRows = 25) {
    const endRow = Math.min(range.e.r, maxRows - 1);
    let bestHeaderRow = -1;
    let maxMatches = 0;
    let detectedCols = { skuCol: -1, stockCol: -1, priceCol: -1 };

    const skuKeywords = ['เลข sku', 'รหัส sku', 'sku', 'parent sku', 'variation sku', 'model sku', 'item sku'];
    const priceKeywords = ['ราคา', 'ราคาสินค้า', 'price', 'unit price', 'selling price', 'retail price', 'ราคาขาย'];
    const stockKeywords = ['จำนวนสต็อก', 'สต็อก', 'คลัง', 'จำนวนคลัง', 'stock', 'inventory', 'quantity', 'qty'];

    // 1. Scan candidate rows
    for (let r = range.s.r; r <= endRow; ++r) {
      let matches = 0;
      let tempCols = { skuCol: -1, stockCol: -1, priceCol: -1 };

      for (let c = range.s.c; c <= range.e.c; ++c) {
        const cellAddr = XLSX.utils.encode_cell({ c, r });
        const cell = ws[cellAddr];
        if (!cell || cell.v === undefined || cell.v === null) continue;

        const val = String(cell.v).trim().toLowerCase();
        if (!val) continue;

        if (tempCols.skuCol === -1 && skuKeywords.some(kw => val.includes(kw))) {
          tempCols.skuCol = c;
          matches++;
        } else if (tempCols.priceCol === -1 && priceKeywords.some(kw => val.includes(kw))) {
          tempCols.priceCol = c;
          matches++;
        } else if (tempCols.stockCol === -1 && stockKeywords.some(kw => val.includes(kw))) {
          tempCols.stockCol = c;
          matches++;
        }
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        bestHeaderRow = r;
        detectedCols = { ...tempCols };
      }
    }

    // 2. Scan neighbor rows if multi-tier header
    if (bestHeaderRow !== -1 && (detectedCols.skuCol === -1 || detectedCols.priceCol === -1 || detectedCols.stockCol === -1)) {
      const neighborRows = [bestHeaderRow - 1, bestHeaderRow + 1].filter(r => r >= range.s.r && r <= endRow);
      for (const nr of neighborRows) {
        for (let c = range.s.c; c <= range.e.c; ++c) {
          const cellAddr = XLSX.utils.encode_cell({ c, r: nr });
          const cell = ws[cellAddr];
          if (!cell || cell.v === undefined || cell.v === null) continue;

          const val = String(cell.v).trim().toLowerCase();
          if (!val) continue;

          if (detectedCols.skuCol === -1 && skuKeywords.some(kw => val.includes(kw))) {
            detectedCols.skuCol = c;
          }
          if (detectedCols.priceCol === -1 && priceKeywords.some(kw => val.includes(kw))) {
            detectedCols.priceCol = c;
          }
          if (detectedCols.stockCol === -1 && stockKeywords.some(kw => val.includes(kw))) {
            detectedCols.stockCol = c;
          }
        }
      }
    }

    // Safe fallback to standard Shopee indices: Col F (5) = SKU, Col G (6) = Stock, Col H (7) = Price
    const finalHeaderRow = bestHeaderRow >= 0 ? bestHeaderRow : 1;
    const skuCol = detectedCols.skuCol >= 0 ? detectedCols.skuCol : 5;
    const stockCol = detectedCols.stockCol >= 0 ? detectedCols.stockCol : 6;
    const priceCol = detectedCols.priceCol >= 0 ? detectedCols.priceCol : 7;
    const dataStartRow = finalHeaderRow + 1;

    return {
      headerRow: finalHeaderRow,
      dataStartRow,
      skuCol,
      stockCol,
      priceCol
    };
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
        if (item.sku) {
          inventoryMap.set(String(item.sku).trim().toUpperCase(), item);
        }
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
          const layout = this.detectHeaderLayout(ws, range, 25);
          
          // วนลูปเพื่อเช็คทีละแถว เริ่มต้นจาก dataStartRow ที่ตรวจพบ
          for (let R = layout.dataStartRow; R <= range.e.r; ++R) {
            const skuCellAddress = XLSX.utils.encode_cell({ c: layout.skuCol, r: R });
            const skuCell = ws[skuCellAddress];
            
            if (!skuCell || skuCell.v === undefined || skuCell.v === null) continue; // ข้ามแถวที่ไม่มี SKU
            
            const skuStr = String(skuCell.v).trim().toUpperCase();
            if (!skuStr) continue;

            const inventoryItem = inventoryMap.get(skuStr);
            
            if (inventoryItem) {
              // อัปเดตสต็อก ที่คอลัมน์สต็อกที่ตรวจพบ
              const stockCellAddress = XLSX.utils.encode_cell({ c: layout.stockCol, r: R });
              if (!ws[stockCellAddress]) ws[stockCellAddress] = { t: 'n' };
              const rawStock = Number(inventoryItem.stockQuantity ?? inventoryItem.qty ?? 0);
              ws[stockCellAddress].v = isNaN(rawStock) ? 0 : Math.max(0, Math.floor(rawStock));
              ws[stockCellAddress].t = 'n'; // ตั้งชนิดเป็นตัวเลข

              // อัปเดตราคา พร้อมปัดเศษสตางค์ 2 ตำแหน่ง
              const priceCellAddress = XLSX.utils.encode_cell({ c: layout.priceCol, r: R });
              if (!ws[priceCellAddress]) ws[priceCellAddress] = { t: 'n' };
              const rawPrice = Number(inventoryItem.Price ?? inventoryItem.price ?? inventoryItem.wholesalePrice ?? 0);
              const roundedPrice = isNaN(rawPrice) ? 0 : Math.round(rawPrice * 100) / 100;
              ws[priceCellAddress].v = roundedPrice;
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
