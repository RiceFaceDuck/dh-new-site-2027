# Backoffice Issue Tracker (ISSUES)

## โ ๏ธ 1. New Products Not Found in POS Search (Hybrid Cache Delay)
* **Status**: ๐”ด Pending
* **Details**: POS uses a Hybrid Cache (Zero-Read Architecture). Newly created products won't appear in partial substring searches unless the exact SKU is typed to trigger the Firebase Fallback Query.
* **Suggestion for next fix**: Add a "Refresh Cache" button on the POS screen (like Inventory has) or improve the Firebase Fallback to use `where('sku', '>=', search)`.

## โ ๏ธ 2. E2E Bot Dummy Data Accumulation
* **Status**: ๐”ด Pending
* **Details**: Order creation testing generates products with `TEST-` prefixes. Deleting them generates Todo Actions, accumulating garbage in the ledger.
* **Suggestion for next fix**: Develop a direct Firebase Admin SDK cleanup script or permanently separate a Test Database environment.

## ๐’ก 3. [Future Idea] Firestore-First History Log Architecture
* **Status**: ๐ก Deferred (Awaiting Future Consideration)
* **Details**: Proposed to solve the GAS fetch bottleneck by saving all real-time logs to Firestore `system_history_logs` first. A background daemon (e.g., `useHistorySync`) would run nightly to bulk transfer logs older than 24 hours from Firestore to GAS for cheap permanent storage, then delete them from Firestore to save quota.
* **Note**: Plan was drafted and successfully tested but reverted per user request to hold off for future consideration.

## โ ๏ธ 4. Database Quota Read Risks (Missing limits)
* **Status**: ๐”ด Pending
* **Details**: Deep audit found `getDocs` and `onSnapshot` queries missing `limit()` in `adManagementService.js`, `customerCascadeService.js`, and `partnerService.js` causing massive quota reads when data grows.
* **Suggestion for next fix**: Add `limit()` controls or implement server-side pagination.

## โ ๏ธ 5. POS UI Lag (Missing memoization)
* **Status**: ๐”ด Pending
* **Details**: The POS Cart system (`CartTable.jsx` and `CartTableRow.jsx`) lacks `React.memo` and list virtualization, causing the entire table to re-render during state updates. High risk of UI freezing on massive wholesale bills (100+ items).
* **Suggestion for next fix**: Wrap row components with `React.memo()` and implement `react-window` or `react-virtuoso`.
- [ ] [UI/UX] ทดสอบแสดงผล Mobile View ของ Homepage และประเมินขนาด Cookie Banner ว่าบังเนื้อหาหรือไม่
- [ ] [Performance] ระบบค้นหาสินค้าโหลดช้าเกินไป (ปัจจุบัน ~2.9 วินาที) ต้องการปรับจูนให้ความเร็วอยู่ในช่วง 1.0 - 1.5 วินาที
- [ ] [Performance] หน้าตะกร้าสินค้า (Cart) โหลดช้าเกินไป (~3.0 วินาที) แม้ไม่มีสินค้าในตะกร้า ควรปรับปรุงการดึงข้อมูลให้เร็วกว่านี้
