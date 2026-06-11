# Firebase Schema & Keys

This document outlines the NoSQL schema structures used in the Firebase Firestore database, specifically focusing on critical operational collections like `history_logs`.

## 1. Collection: `history_logs`

The `history_logs` collection stores all audit logs for actions performed across the system. It is designed to be fully denormalized so that it can be queried and displayed quickly without needing to perform N+1 queries against the `users` table.

### Schema Fields

| Field Name    | Type      | Description                                                                 | Example Value                       |
|---------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|
| `timestamp`   | Timestamp | The exact server-side timestamp when the action occurred.                   | `December 15, 2026 at 10:30:00 AM UTC+7` |
| `module`      | String    | The main system component where the action happened.                        | `"Customer"`, `"Inventory"`, `"Staff"` |
| `action`      | String    | The specific operation performed.                                           | `"Create"`, `"Update"`, `"Delete"`  |
| `details`     | String    | A human-readable description of the action.                                 | `"สร้างสินค้าโฆษณาใหม่ (รอการอนุมัติ)"`|
| `targetId`    | String    | The reference ID of the item that was affected.                             | `"PV-82668"`, `"USR-1234"`          |
| `actorName`   | String    | The display name or nickname of the user who performed the action.          | `"บอย สมชาย"`                       |
| `actorEmail`  | String    | The email address of the user who performed the action.                     | `"dh1notebook@gmail.com"`           |
| `actionBy`    | String    | The UID of the user who performed the action (Legacy).                      | `"uid_xyz123"`                      |
| `performedBy` | String    | The UID of the user who performed the action (Legacy).                      | `"uid_xyz123"`                      |

### Required Firestore Indexes

Because the History UI now utilizes Server-Side Filtering for maximum efficiency and correctness, **Composite Indexes** are strictly required. If they are not created, Firebase will throw an error when attempting to filter the logs.

To create these, go to **Firestore Database -> Indexes -> Composite** in your Firebase Console, or click the direct link provided in the browser console error if it occurs.

1. **Module Filter Index**
   - Collection ID: `history_logs`
   - Fields: 
     - `module` (Ascending)
     - `timestamp` (Descending)
   - Query scopes: Collection

2. **Action Filter Index**
   - Collection ID: `history_logs`
   - Fields: 
     - `action` (Ascending)
     - `timestamp` (Descending)
   - Query scopes: Collection

---

## 2. Collection: `orders`

The `orders` collection stores all billing and POS transaction data. It has been optimized for fast querying by splitting responsibilities.

### Schema Fields (Key Fields)

| Field Name        | Type      | Description                                                                 | Example Value                       |
|-------------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|
| `orderId`         | String    | Human-readable ID generated for the bill. Starts with DH- or TEMP-          | `"DH-261215-1234"`, `"TEMP-261215"` |
| `orderStatus`     | String    | Status of the order lifecycle.                                              | `"Paid"`, `"Pending"`, `"Cancelled"`|
| `paymentStatus`   | String    | Status of the payment.                                                      | `"Paid"`, `"Unpaid"`                |
| `netTotal`        | Number    | The final payable amount after all discounts and fees.                      | `15000`                             |
| `subTotal`        | Number    | Total price of items before discount.                                       | `16000`                             |
| `overallDiscount` | Number    | Manual discount applied to the entire bill.                                 | `500`                               |
| `promoDiscount`   | Number    | Discount amount generated from a promotion.                                 | `500`                               |
| `shippingFee`     | Number    | Shipping or logistics cost.                                                 | `60`                                |
| `walletUsed`      | Number    | Amount deducted from the customer's DH Wallet (Legacy). Now mapped to creditPoints. | `0`                                 |
| `billNote`        | String    | Text note attached to the bill.                                             | `"จัดส่งด่วน"`                         |
| `createdAt`       | Timestamp | When the order was created.                                                 | `December 15, 2026 at 10:30:00 AM UTC+7` |
| `customer`        | Map       | Denormalized customer information to prevent N+1 queries.                   | `{ uid: "123", accountName: "John"}`|
| `items`           | Array     | List of purchased items including freebies (isFreebie flag).                | `[{sku: "1", qty: 1, isFreebie: false}]` |
| `appliedFreebies` | Array     | List of specific freebies granted to this order.                            | `[{id: "F1", qty: 1}]`              |
| `appliedPromotion`| Map       | Details of the promotion applied.                                           | `{id: "P1", title: "Discount"}`     |

### Architectural Note
The logic for interacting with the `orders` collection has been separated into:
- **`billingService.js`**: A facade pattern entrypoint that unifies the Query, Update, and Transaction services so components only need a single import.
- **`billingQueryService.js`**: Handles read-only operations (`subscribeRecentOrders`, `searchOrders`) to keep UI snappy. **NOTE**: Mapped `id` should be placed at the end of the spread operator (`...doc.data(), id: doc.id`) to avoid being overwritten by a potentially null ID saved in raw data.
- **`billingTransactionService.js`**: Handles complex atomic transactions (creating new orders with complex side effects).
- **`billingStatusTransaction.js`**: Handles atomic status updates (Stock updates, Wallet refunds/deductions, History logging) using Firestore `runTransaction`.
- **`billingDeleteService.js`**: Handles deleting draft/temporary orders and restoring credits.
- **`billingPrintService.js`**: Handles simple print count increments.

---

## 3. Collection: `counters`

The `counters` collection stores atomic counters used for generating sequential data such as receipt numbers. 

### Schema Fields: Document `receipt_sequence`

| Field Name | Type   | Description                                                           | Example Value |
|------------|--------|-----------------------------------------------------------------------|---------------|
| `[YYYY]`   | Number | A dynamic field where the key is the current year (e.g. "2026"). Tracks the highest sequence generated for that year. | `125` |
| `updatedAt`| Timestamp | When the counter was last modified.                                   | `December 15, 2026 at 10:30:00 AM UTC+7` |

---

## 4. Collection: `todos`

The `todos` collection acts as a central hub for manager approvals, task management, and system requests (such as Claims, Returns, and Service Tasks). It tracks the lifecycle of asynchronous requests.

### Schema Fields (Key Fields)

| Field Name     | Type      | Description                                                                 | Example Value                       |
|----------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|
| `type`         | String    | Type of the request/task.                                                   | `"CLAIM_APPROVAL"`, `"PRODUCT_DELETE_APPROVAL"`, `"BILL_CANCEL_APPROVAL"`, `"RETURN_APPROVAL"` |
| `title`        | String    | Title of the task/request.                                                  | `"ขออนุมัติเคลม: Mouse"`            |
| `description`  | String    | Detailed description of the task.                                           | `"บิลอ้างอิง: DH-xxx\nอาการ: พัง"`  |
| `priority`     | String    | Priority level.                                                             | `"High"`, `"Critical"`, `"Normal"`  |
| `status`       | String    | Current status of the task.                                                 | `"pending_manager"`, `"approved"`, `"rejected"` |
| `referenceType`| String    | Type of related entity.                                                     | `"Order"`                           |
| `referenceId`  | String    | ID of the related entity.                                                   | `"DH-261215-1234"`                  |
| `payload`      | Map       | Specific data required to process the request (e.g. claim details, `trackingNo`). | `{ claimId: "CLM-123", qty: 1, trackingNo: "TH123" }` |
| `createdByUid` | String    | UID of the user who created the task.                                       | `"uid_xyz123"`                      |
| `handledBy`    | String    | UID of the user (manager) who handled/approved the task.                    | `"uid_mgr123"`                      |
| `createdAt`    | Timestamp | When the task was created.                                                  | `December 15, 2026 at 10:30:00 AM UTC+7` |
| `updatedAt`    | Timestamp | When the task was last updated.                                             | `December 15, 2026 at 10:30:00 AM UTC+7` |

---

## 5. Collection: `credit_transactions`

The `credit_transactions` collection stores all movements of a user's wallet/credit balance (`creditPoints`). It acts as a financial ledger to prevent data race conditions and provide a clear audit trail.

### Schema Fields

| Field Name      | Type      | Description                                                                 | Example Value                       |
|-----------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|
| `transactionId` | String    | Unique identifier for the transaction.                                      | `"TX-1718012345678"`                |
| `uid`           | String    | User ID associated with the wallet transaction.                             | `"uid_xyz123"`                      |
| `type`          | String    | Type of transaction.                                                        | `"deposit"`, `"spend"`, `"refund"`  |
| `amount`        | Number    | Amount involved in the transaction.                                         | `15000`                             |
| `balanceAfter`  | Number    | The wallet balance immediately after this transaction.                      | `30000`                             |
| `referenceId`   | String    | ID of the related order, claim, or return.                                  | `"DH-261215-1234"`                  |
| `recordedBy`    | String    | ID of the admin/system that recorded the transaction.                       | `"admin_uid"`                       |
| `timestamp`     | Timestamp | When the transaction occurred.                                              | `December 15, 2026 at 10:30:00 AM UTC+7` |

---

## 6. Collection: `system_logs`

The `system_logs` collection tracks critical system-level automated actions and approvals (e.g., Payment Verifications, Wholesale Approvals, Wallet Withdrawals) performed by managers or system routines.

### Schema Fields

| Field Name   | Type      | Description                                                                 | Example Value                       |
|--------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|
| `actionType` | String    | The type of system action performed.                                        | `"PAYMENT_VERIFIED"`, `"WHOLESALE_APPROVED"`|
| `taskId`     | String    | ID of the associated To-do task.                                            | `"T-12345"`                         |
| `orderId`    | String    | ID of the associated Order (if applicable).                                 | `"DH-261215-1234"`                  |
| `details`    | String    | Description of what occurred.                                               | `"ยืนยันยอดเงินสำเร็จ"`               |
| `createdBy`  | String    | The UID of the manager or `"System"` if automated.                          | `"uid_mgr123"`                      |
| `createdAt`  | Timestamp | When the action occurred.                                                   | `December 15, 2026 at 10:30:00 AM UTC+7` |

---

## 7. Email System (Backend Proxy Architecture)

The Email System has been upgraded to use **Firebase Cloud Functions** as a proxy for the Gmail API. This allows all staff to read and reply to company emails without needing to log in to their Google accounts.

- **Storage**: The only data stored in Firestore is the `refresh_token` and `client_secret` in the `system_config` collection (`docId: gmail_auth`).
- **Emails**: Emails are **NOT** stored in the database. They are fetched on-the-fly via Cloud Functions and sent directly to the frontend.
- **Authentication**: Admin connects the Gmail account once in the `/managers` dashboard. Cloud Functions handles the token refresh automatically.

*(Additional schemas will be documented here as the system evolves)*
