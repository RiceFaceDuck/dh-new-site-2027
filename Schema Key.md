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

| Field Name    | Type      | Description                                                                 | Example Value                       |
|---------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|
| `orderId`     | String    | Human-readable ID generated for the bill. Starts with DH- or TEMP-          | `"DH-261215-1234"`, `"TEMP-261215"` |
| `orderStatus` | String    | Status of the order lifecycle.                                              | `"Paid"`, `"Pending"`, `"Cancelled"`|
| `paymentStatus`| String   | Status of the payment.                                                      | `"Paid"`, `"Unpaid"`                |
| `netTotal`    | Number    | The final payable amount after all discounts and fees.                      | `15000`                             |
| `createdAt`   | Timestamp | When the order was created.                                                 | `December 15, 2026 at 10:30:00 AM UTC+7` |
| `customer`    | Map       | Denormalized customer information to prevent N+1 queries.                   | `{ uid: "123", accountName: "John"}`|

### Architectural Note
The logic for interacting with the `orders` collection has been separated into:
- **`billingService.js`**: A facade pattern entrypoint that unifies the Query, Update, and Transaction services so components only need a single import.
- **`billingQueryService.js`**: Handles read-only operations (`subscribeRecentOrders`, `searchOrders`) to keep UI snappy.
- **`billingUpdateService.js`**: Handles simpler updates (like marking as complete or cancelled) without complex side-effects.
- **`billingTransactionService.js`**: Handles complex atomic transactions (Stock updates, Wallet deductions, History logging, Sales stats) using Firestore `runTransaction`.

---

*(Additional schemas will be documented here as the system evolves)*
