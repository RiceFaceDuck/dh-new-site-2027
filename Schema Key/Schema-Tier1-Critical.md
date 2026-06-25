# Tier 1: Critical Schemas (ระบบการเงิน, ธุรกรรม, และความปลอดภัย)

ไฟล์นี้รวบรวม Database Schema ที่เกี่ยวข้องกับโครงสร้างหลักของธุรกิจ เช่น ธุรกรรมการเงิน สิทธิ์การใช้งาน และลำดับบิล ซึ่งมีความสำคัญสูงสุด (Critical) หากมีข้อผิดพลาดจะส่งผลกระทบต่อรายได้และการเข้าใช้งานระบบ

## Table of Contents
- [1. Collection: `orders`](#1-collection-orders)
- [2. Collection: `credit_transactions`](#2-collection-credit_transactions)
- [3. Collection: `counters`](#3-collection-counters)
- [4. Collection: `users`](#4-collection-users)
  - [Subcollection: `hardware_scans`](#subcollection-hardware_scans)

---

## 1. Collection: `orders`
**Firestore Path:** `/orders/{orderId}`
**Role:** The `orders` collection stores all billing and POS transaction data.

### Schema Fields
| Field Name        | Type      | Description                                                                 | Example Value                       | Foreign Key / Ref |
|-------------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `orderId`         | String    | Human-readable ID generated for the bill. Starts with DH- or TEMP-          | `"DH-261215-1234"`, `"TEMP-261215"` | |
| `orderStatus`     | String    | Status of the order lifecycle.                                              | `"Paid"`, `"Pending"`, `"Cancelled"`| |
| `paymentStatus`   | String    | Status of the payment.                                                      | `"Paid"`, `"Unpaid"`                | |
| `netTotal`        | Number    | The final payable amount after all discounts and fees.                      | `15000`                             | |
| `subTotal`        | Number    | Total price of items before discount.                                       | `16000`                             | |
| `overallDiscount` | Number    | Manual discount applied to the entire bill.                                 | `500`                               | |
| `promoDiscount`   | Number    | Discount amount generated from a promotion.                                 | `500`                               | |
| `shippingFee`     | Number    | Shipping or logistics cost.                                                 | `60`                                | |
| `walletUsed`      | Number    | Amount deducted from the customer's DH Wallet. Mapped to creditPoints.      | `0`                                 | |
| `billNote`        | String    | Text note attached to the bill.                                             | `"จัดส่งด่วน"`                         | |
| `createdAt`       | Timestamp | When the order was created.                                                 | `December 15, 2026 at 10:30:00 AM UTC+7` | |
| `customer`        | Map       | Denormalized customer information to prevent N+1 queries.                   | `{ uid: "123", accountName: "John"}`| Ref: `users.uid` |
| `items`           | Array     | List of purchased items including freebies (isFreebie flag).                | `[{sku: "1", qty: 1, isFreebie: false}]` | Ref: `products.sku` |
| `appliedFreebies` | Array     | List of specific freebies granted to this order.                            | `[{id: "F1", qty: 1}]`              | Ref: `freebies.id` |
| `appliedPromotion`| Map       | Details of the promotion applied.                                           | `{id: "P1", title: "Discount"}`     | Ref: `promotions.id` |

### TypeScript Interface
```typescript
import { Timestamp } from "firebase/firestore";

export interface OrderItem {
  sku: string;
  qty: number;
  isFreebie: boolean;
  nameAtPurchase?: string;
  priceAtPurchase?: number;
}

export interface AppliedFreebie {
  id: string;
  qty: number;
}

export interface AppliedPromotion {
  id: string;
  title: string;
}

export interface OrderCustomer {
  uid: string;
  displayName: string;
}

export interface Order {
  id?: string; // Document ID (usually same as orderId)
  orderId: string;
  orderStatus: "Paid" | "Pending" | "Cancelled";
  paymentStatus: "Paid" | "Unpaid";
  netTotal: number;
  subTotal: number;
  overallDiscount: number;
  promoDiscount: number;
  shippingFee: number;
  walletUsed: number;
  billNote: string;
  createdAt: Timestamp;
  customer: OrderCustomer;
  items: OrderItem[];
  appliedFreebies: AppliedFreebie[];
  appliedPromotion: AppliedPromotion;
}
```

### Architectural Note
The logic for interacting with the `orders` collection has been separated into:
- **`billingService.js`**: A facade pattern entrypoint that unifies the Query, Update, and Transaction services so components only need a single import.
- **`billingQueryService.js`**: Handles read-only operations (`subscribeRecentOrders`, `searchOrders`) to keep UI snappy. **NOTE**: Mapped `id` should be placed at the end of the spread operator (`...doc.data(), id: doc.id`) to avoid being overwritten by a potentially null ID saved in raw data. *Optimization:* Dashboards should use the `dateRange` parameter in `subscribeRecentOrders` to strictly fetch only today's data, drastically reducing read costs.
- **`billingTransactionService.js`**: Handles complex atomic transactions (creating new orders with complex side effects).
- **`billingStatusTransaction.js`**: Facade for status updates. Delegates specific atomic updates to sub-handlers:
  - **`statusStockHandler.js`**: Handles stock deduction, restoration, and tracking.
  - **`statusWalletHandler.js`**: Handles credit/wallet deductions and refunds.
  - **`statusSalesHandler.js`**: Handles sales stats calculation.
- **`billingDeleteService.js`**: Handles deleting draft/temporary orders and restoring credits.
- **`billingPrintService.js`**: Handles simple print count increments.

---

## 2. Collection: `credit_transactions`
**Firestore Path:** `/credit_transactions/{transactionId}`
**Role:** The `credit_transactions` collection stores all movements of a user's wallet/credit balance (`creditPoints`). It acts as a financial ledger to prevent data race conditions and provide a clear audit trail.

### Schema Fields
| Field Name      | Type      | Description                                                                 | Example Value                       | Foreign Key / Ref |
|-----------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `transactionId` | String    | Unique identifier for the transaction.                                      | `"TX-1718012345678"`                | |
| `uid`           | String    | User ID associated with the wallet transaction.                             | `"uid_xyz123"`                      | Ref: `users.uid` |
| `type`          | String    | Type of transaction.                                                        | `"deposit"`, `"spend"`, `"refund"`  | |
| `amount`        | Number    | Amount involved in the transaction.                                         | `15000`                             | |
| `balanceAfter`  | Number    | The wallet balance immediately after this transaction.                      | `30000`                             | |
| `referenceId`   | String    | ID of the related order, claim, or return.                                  | `"DH-261215-1234"`                  | Ref: `orders.orderId` |
| `recordedBy`    | String    | ID of the admin/system that recorded the transaction.                       | `"admin_uid"`                       | Ref: `users.uid` |
| `timestamp`     | Timestamp | When the transaction occurred.                                              | `December 15, 2026 at 10:30:00 AM UTC+7` | |

### TypeScript Interface
```typescript
import { Timestamp } from "firebase/firestore";

export interface CreditTransaction {
  id?: string;
  transactionId: string;
  uid: string;
  type: "deposit" | "spend" | "refund";
  amount: number;
  balanceAfter: number;
  referenceId: string;
  recordedBy: string;
  timestamp: Timestamp;
}
```

### Architectural Note
The logic for managing credits and the `credit_transactions` collection is modularized:
- **`creditService.js`**: Facade module exporting all credit functionalities.
- **`creditActionService.js`**: Handles atomic transactions for earning, spending, partner deductions, and Ad payments. **NOTE**: The canonical source of truth for a user's balance is `userDoc.creditPoints`. The legacy `wallet` subcollection, `point_transactions` collection, and `stats.rewardPoints` are ALL deprecated. Earning points from orders now directly increases `creditPoints`.
- **`creditHistoryService.js`**: Handles fetching wallet balance and paginated credit history.
- **`creditRealtimeService.js`**: Manages real-time listeners for user's wallet balance and pending credits.
- **`creditFormatService.js`**: Gamification and data formatting utilities.

---

## 3. Collection: `counters`
**Firestore Path:** `/counters/{counterId}` (e.g. `receipt_sequence`)
**Role:** The `counters` collection stores atomic counters used for generating sequential data such as receipt numbers.

### Schema Fields: Document `receipt_sequence`
| Field Name | Type   | Description                                                           | Example Value | Foreign Key / Ref |
|------------|--------|-----------------------------------------------------------------------|---------------|-------------------|
| `[YYYY]`   | Number | A dynamic field where the key is the current year (e.g. "2026"). Tracks the highest sequence generated for that year. | `125` | |
| `updatedAt`| Timestamp | When the counter was last modified.                                   | `December 15, 2026 at 10:30:00 AM UTC+7` | |

### TypeScript Interface
```typescript
import { Timestamp } from "firebase/firestore";

export interface CounterDocument {
  id?: string;
  updatedAt: Timestamp;
  [year: string]: number | Timestamp | string | undefined; // Dynamic year keys (e.g., "2026": 125)
}
```

---

## 4. Collection: `users`
**Firestore Path:** `/users/{uid}`
**Role:** The `users` collection stores user profiles, access controls, and staff registration details for both customers and staff members.

### Schema Fields
| Field Name       | Type    | Description                                                                 | Example Value                       | Foreign Key / Ref |
|------------------|---------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `uid`            | String  | Firebase Authentication UID.                                                | `"uid_xyz123"`                      | |
| `accountId`      | String  | Short 8-character ID used for reliable server-side searching.               | `"8RP6WHIM"`                        | |
| `customerCode`   | String  | Legacy/fallback code, usually kept in sync with `accountId`.                | `"8RP6WHIM"`                        | |
| `email`          | String  | User's email address. **Used as the Primary Key for Data Sync Validation**. | `"staff@dhnotebook.com"`            | |
| `firstName`      | String  | User's first name.                                                          | `"สมชาย"`                           | |
| `lastName`       | String  | User's last name.                                                           | `"รักดี"`                           | |
| `nickname`       | String  | User's nickname.                                                            | `"บอย"`                             | |
| `age`            | Number  | User's age.                                                                 | `25`                                | |
| `displayName`    | String  | Full display name (firstName + lastName) or generated from email.           | `"สมชาย รักดี"`                     | |
| `role`           | String  | The current role/permission level of the user.                              | `"admin"`, `"staff"`, `"pending_approval"` | |
| `requestedRole`  | String  | The role the user requested when registering.                               | `"manager"`, `"packer"`             | |
| `isStaff`        | Boolean | Flag indicating if the user is a staff member.                              | `true`, `false`                     | |
| `isActive`       | Boolean | Flag indicating if the user's account is active and approved.               | `true`, `false`                     | |
| `gender`         | String  | User's gender.                                                              | `"male"`, `"female"`, `"unspecified"`| |
| `startDate`      | String  | Date the user started working.                                              | `"2026-06-11"`                      | |
| `creditPoints`   | Number  | Canonical source of truth for a user's wallet balance.                      | `150`                               | |
| `metadata`       | Map     | Additional info like creation date and update dates.                        | `{ createdAt: Timestamp }`          | |

### TypeScript Interface
```typescript
import { Timestamp } from "firebase/firestore";

export interface UserMetadata {
  createdAt: Timestamp;
  registeredVia?: string;
}

export interface User {
  id?: string; // Same as uid
  uid: string;
  accountId: string;
  customerCode: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  age: number;
  displayName: string;
  role: "admin" | "manager" | "staff" | "pending_approval" | "customer";
  requestedRole?: string;
  isStaff: boolean;
  isActive: boolean;
  gender: "male" | "female" | "unspecified";
  startDate: string;
  creditPoints?: number;
  metadata: UserMetadata;
}
```

### Architectural Note: Security & Quota (Custom Claims)
- To prevent heavy Firestore Read quotas during security rule evaluations (`get()`), user roles (`staff`, `manager`, `admin`) are synced to **Firebase Auth Custom Claims**.
- `firestore.rules` evaluates `request.auth.token.role` first. If the claim is missing (during migration), it falls back to a document read for `role`.

---

### Subcollection: `hardware_scans`
**Firestore Path:** `/users/{uid}/hardware_scans/{scanId}`
**Role:** Stores the results of hardware scans submitted by the DH Hardware Scanner.

| Field Name       | Type      | Description                                                                 | Example Value                       | Foreign Key / Ref |
|------------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `monitor`        | String    | PNPDeviceID or InstanceName of the monitor.                                 | `"DISPLAY\DEL41F1\..."`             | |
| `battery`        | String    | Name of the battery.                                                        | `"Primary"`                         | |
| `board`          | String    | Motherboard Product and SerialNumber.                                       | `"83C0 123456789"`                  | |
| `disk`           | String    | SSD/HDD Model.                                                              | `"Samsung SSD 970 EVO"`             | |
| `ram`            | String    | RAM Part Number.                                                            | `"M471A1K43CB1-CTD"`                | |
| `createdAt`      | Timestamp | When the scan was saved.                                                    | `December 15, 2026 at 10:30:00 AM`  | |

```typescript
import { Timestamp } from "firebase/firestore";

export interface HardwareScan {
  id?: string;
  monitor: string;
  battery: string;
  board: string;
  disk: string;
  ram: string;
  createdAt: Timestamp;
}
```
