<grimoire>
<flow_and_entry>
- Entry: `pages/managers/RefundManagement.jsx` (Route: `/managers/refund`) & `pages/managers/WalletManagement.jsx` (clean alias re-export).
- Controller: `pages/managers/wallet/hooks/useWalletManagement.js` with Cache & Overwrite (5-min TTL).
- Services: `todoService.processWalletWithdrawal` (approvals) and `creditCoreService.adjustUserWallet` (adjustments).
</flow_and_entry>

<core_schema>
- `users/{uid}`: { walletBalance: number (>=0), pendingWithdrawal: number (>=0), lastWalletTxId: string, customerCode: string, phone: string }
- `users/{uid}/wallet_transactions/{txId}`: { transactionId: string, type: string, amount: number, balanceAfter: number, status: string, note: string, refId?: string, timestamp: serverTimestamp }
- `todos/{taskId}`: { taskType: 'WALLET_WITHDRAWAL', status: 'PENDING'|'completed'|'rejected', withdrawalDetails: { amount: number, bankName: string, accountNumber: string, accountName: string } }
- `system_logs`: { actionType: 'WALLET_WITHDRAWAL_APPROVED'|'WALLET_WITHDRAWAL_REJECTED', taskId: string, createdBy: string }
</core_schema>

<business_rules>
- Absolute Deployment Ban: Zero deployment to production/hosting. All changes remain strictly on localhost:3168.
- Financial Idempotency: All wallet balance adjustments MUST pass a unique UUID `refId` to eliminate duplicate balance mutations.
- Atomic Transactions: Withdrawal approval/rejection must be wrapped in `runTransaction` with `pendingWithdrawal` decrement and balance restoration guards.
- Read-Only Safeguard: Production Firestore collections are inspected in read-only mode during local development.
- Rule Schema Strictness: Client `SPEND` in `wallet_transactions` strictly requires `balanceAfter` and deterministic doc ID matching `transactionId`.
</business_rules>

<cross_impact>
- QuickAccessTools (`case 'refund'` / `AVAILABLE_MENUS.refund`): Navigates directly to this view from `/managers`.
- Orders & POS Checkout: Uses customer `walletBalance` during payment deductions.
- Claims & Returns: Refunds from returned/defective products replenish `walletBalance`.
- Storefront Checkout (`dh-frontend`): Client wallet deduction must strictly comply with firestore.rules.
</cross_impact>

<pitfalls_and_lessons>
- ⚠️ Storefront Wallet Security Rules Bug: Client checkout previously used random doc ID and omitted `balanceAfter`, causing permission-denied; fixed by aligning doc ID with `TXW-${orderId}` and recording `balanceAfter`.
- ⚠️ Drawer Refund vs Todos Sync: `CustomerRefundModal` (`customerRefundService.js`) clears `pendingWithdrawal` on user doc but requires syncing status to `todos` to avoid stuck tasks.
- ⚠️ Watchlist Resolved (Firestore Cost & Aggregation): In `useWalletManagement.js`, replaced `limit(100)` looping with `getAggregateFromServer` (1 read for exact system-wide total & count) and `limit(20)` for initial user list, matching `TotalLiabilityDashboard` and saving 79 reads per cold load. Deduplicated `WalletManagement.jsx` via clean re-export.
- ⚠️ Ledger Consistency & Deterministic Doc ID Alignment (Phase 1):
  - In `todoWalletService.js`, enriched `APPROVE`/`REJECT` flows with deterministic Doc ID (`TXW_WD_APV_...`/`TXW_WD_REJ_...`), exact `balanceAfter` calculation, and atomic `lastWalletTxId` update on `userRef`.
  - In `creditActionService.js`, aligned Document ID and `transactionId` to unified `TXW_ADJ_${referenceId}` and added `lastWalletTxId` update on `userRef`.
  - In-App Automated Web Withdrawal is held/locked per manager policy; requests remain handled via LINE OA.
- ⚠️ Statement & Point Table Domain UI Invariant (Phase 1):
  - ปลดล็อกปัญหาความสับสนของเครื่องหมาย `+` และ `-` ใน Statement กระเป๋าเงิน โดยยกเลิกเครื่องหมายหน้าตัวเลข และแทนที่ด้วยป้ายกำกับภาษาชาวบ้าน: 🟢 `ค้างยอดเข้า wallet` (ยอดค้างเพิ่ม) และ 🟠 `เบิกจ่ายธุรกรรม` (ยอดค้างลด) พร้อมแก้บั๊กตัวพิมพ์เล็ก-ใหญ่ (`REFUND` vs `refund`)
  - ใน `PointTransactionTable.jsx` แก้ปัญหาไม่แสดงวันที่โดยเปลี่ยนจาก `pt.createdAt` เป็น `(pt.timestamp || pt.createdAt)` และเพิ่มการตรวจจับ type `'ADD'` เพื่อให้แต้มสะสมแสดงผลถูกต้อง
- ⚠️ Drawer Refund Standardization (Phase 2):
  - รวมศูนย์ปุ่ม "จ่ายคืนเป็นเงินสด" ใน `RefundManagement.jsx` ให้เรียกผ่าน `executeCustomerRefund` (`customerRefundService.js`) แทนการปรับยอดแก้ไขบัญชี ทำให้มี `admin_audits`, `system_logs`, ซิงก์ Google Sheets บัญชี (`gasHistoryService`), และเคลียร์ Todo task ค้างถอนอัตโนมัติ
  - ปรับ `WalletModals.jsx` ให้คำนวณเพดานการจ่ายคืนเงินสดรองรับทั้ง `walletBalance` และ `pendingWithdrawal` รวมกันอย่างถูกต้อง
- ⚠️ Server Query & UX Empty State Polish (Phase 3):
  - ใน `useWalletManagement.js` เพิ่ม `orderBy('walletBalance', 'desc')` ใน Query ระดับ Firestore เพื่อให้แน่ใจว่าดึง 20 อันดับที่มียอดค้างสูงสุดจริงจาก Server
  - ใน `WalletDetailPanel.jsx` เพิ่ม Empty State Card ที่สวยงามพร้อมคำแนะนำเมื่อยังไม่มีการเลือกลูกค้า ขจัดพื้นที่ว่างเปล่าฝั่งขวา
  - ใน `RefundManagement.jsx` ถอนปุ่ม "คัดลอกเบอร์โทร" ออกทั้งหมดเนื่องจากไม่มีการใช้งานจริงและสร้างความสับสน
- ⚠️ UI Corner Radius 0.1rem & Spacing Compactness (Phase 4):
  - ปรับความโค้งมนของกล่อง แผง และอินพุตทั้งหมดเป็น `rounded-[0.1rem]` ให้เข้ากับสไตล์มินิมอลตามดีไซน์ของระบบ
  - **ยกเว้นปุ่ม Action ต่างๆ (เช่น เติมเงิน, จ่ายคืนเป็นเงินสด, ยึดเงิน, ค้นหา, อนุมัติ/ปฏิเสธ) ให้คงความโค้งมนเดิม (`rounded-xl` / `rounded-lg`) ไว้ 100%**
  - กระชับระยะห่าง (gap, padding, margin) ให้ลดลงอย่างสมดุล (เช่น `gap-2`, `mt-2`, `p-2 lg:p-2.5`) ทำให้แสดงผลได้แน่นและดูสะอาดตาขึ้น
</pitfalls_and_lessons>
</grimoire>
