# Tier 2: Operational Schemas (ระบบจัดการหลังบ้าน, คลังสินค้า, และการอนุมัติ)

ไฟล์นี้รวบรวม Database Schema ที่เกี่ยวข้องกับระบบปฏิบัติการรายวัน เช่น คลังสินค้า รายชื่อช่าง และระบบอนุมัติงาน หากมีความผิดพลาดอาจทำให้การทำงานสะดุด (เช่น สต็อกเพี้ยน) แต่จะไม่กระทบยอดบิลเก่าที่ชำระไปแล้ว

## Table of Contents
- [1. Collection: `products`](#1-collection-products)
- [2. Collection: `todos`](#2-collection-todos)
- [3. Collection: `partners`](#3-collection-partners)
- [4. Storage: `history_logs` (GAS)](#4-storage-history_logs-gas)
- [5. Collection: `system_logs`](#5-collection-system_logs)

---

## 1. Collection: `products`
**Firestore Path:** `/products/{sku}`
**Role:** The `products` collection stores all inventory items. It includes stock quantity, pricing, basic product data, and claim tracking information.

### Schema Fields
| Field Name       | Type    | Description                                                                 | Example Value                       | Foreign Key / Ref |
|------------------|---------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `sku`            | String  | The unique SKU identifier for the product.                                  | `"SCR-001"`                         | |
| `name`           | String  | The product name or description.                                            | `"ASUS 15.6 LED Screen"`            | |
| `stockQuantity`  | Number  | The current available stock quantity.                                       | `15`                                | |
| `defectQuantity` | Number  | Stock quantity for broken items pending return to supplier.                 | `2`                                 | |
| `claimHistory`   | Array   | List of successful claims (for warranty/defects).                           | `[{ date: "2026-06-11", ... }]`     | Ref: `todos.id` (Claim Tasks)|
| `images`         | Array   | List of image URLs.                                                         | `["url1", "url2"]`                  | |
| `Price`          | Number  | The base or wholesale price.                                                | `1000`                              | |
| `retailPrice`    | Number  | The retail price shown on the website.                                      | `1500`                              | |
| `category`       | String  | The product category.                                                       | `"Screen"`                          | |
| `shortDescription`| String | A short highlighting description displayed under the name.                  | `"หน้าจอแท้ สีสด"`                     | |
| `compatibleModels`| Array/String | Devices or models that this part can be used with.                      | `["Acer Swift 3", "Asus VivoBook"]` | |
| `compatiblePartNumbers`| Array/String| Part numbers that this product is compatible with or replaces.        | `["PT123", "PT124"]`                | |
| `fullDescription` | String | A detailed description of the product.                                      | `"<p>รายละเอียดแบบเต็มๆ</p>"`       | |
| `youtubeUrl`     | String  | A link to a YouTube video review or tutorial.                               | `"https://youtu.be/..."`            | |
| `shopeeUrl`      | String  | Link to the product listing on Shopee marketplace.                          | `"https://shopee.co.th/..."`        | |
| `lazadaUrl`      | String  | Link to the product listing on Lazada marketplace.                          | `"https://lazada.co.th/..."`        | |
| `packageSize`    | Map     | Dimensions of the package (width, length, height).                          | `{ w: "30", l: "40", h: "5" }`      | |
| `bufferStock`    | Number  | Reserved stock quantity not available for general sale.                     | `2`                                 | |
| `tags`           | Array   | Search tags or labels for the product.                                      | `["tag1", "tag2"]`                  | |
| `externalLinks`  | Map     | External marketplace links.                                                 | `{ shopee: "...", lazada: "..." }`  | |
| `substituteSkus` | Array   | SKUs of products that can be sold as substitutes if this item is out of stock. | `["SCR-002", "SCR-003"]`            | Ref: `products.sku` |
| `internalComments`| Array  | Internal notes/comments left by the team. (NOT an audit log).               | `[{ text: "Note", uid: "1" }]`      | |
| `comment`        | String  | Legacy comment field.                                                       | `"Old note"`                        | |
| `randomSeed`     | Number  | A random decimal between 0 and 1 used for true random querying.             | `0.123456789`                       | |
| `isActive`       | Boolean | Flag indicating if the product is active or soft-deleted.                   | `true`, `false`                     | |

### TypeScript Interface
```typescript
export interface ClaimHistoryEntry {
  date: string;
  claimId: string;
  qty: number;
  reason?: string;
}

export interface Product {
  id?: string; // Same as sku
  sku: string;
  name: string;
  stockQuantity: number;
  defectQuantity: number;
  claimHistory: ClaimHistoryEntry[];
  images: string[];
  Price: number;
  retailPrice: number;
  category: string;
  shortDescription?: string;
  compatibleModels?: string[] | string;
  compatiblePartNumbers?: string[] | string;
  fullDescription?: string;
  youtubeUrl?: string;
  shopeeUrl?: string;
  lazadaUrl?: string;
  packageSize?: { w: string; l: string; h: string };
  bufferStock?: number;
  tags?: string[];
  externalLinks?: { shopee?: string; lazada?: string; tiktok?: string; facebook?: string };
  substituteSkus?: string[];
  internalComments?: { text: string; timestamp: string; uid: string }[];
  comment?: string;
  randomSeed: number;
  isActive?: boolean;
}
```

---

## 2. Collection: `todos`
**Firestore Path:** `/todos/{todoId}`
**Role:** Acts as a central hub for manager approvals, task management, and system requests. It tracks the lifecycle of asynchronous requests.
**Note (CRITICAL):** All approval requests must be routed to this root `todos` collection ONLY. Do NOT write duplicate tasks to `manager_todos`.

### Schema Fields
| Field Name     | Type      | Description                                                                 | Example Value                       | Foreign Key / Ref |
|----------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `type`         | String    | Type of the request/task.                                                   | `"CLAIM_APPROVAL"`, `"PRODUCT_DELETE_APPROVAL"` | |
| `title`        | String    | Title of the task/request.                                                  | `"ขออนุมัติเคลม: Mouse"`            | |
| `description`  | String    | Detailed description of the task.                                           | `"บิลอ้างอิง: DH-xxx\nอาการ: พัง"`  | |
| `priority`     | String    | Priority level.                                                             | `"High"`, `"Critical"`, `"Normal"`  | |
| `status`       | String    | Current status of the task.                                                 | `"pending_manager"`, `"approved"`, `"completed"`| |
| `referenceType`| String    | Type of related entity.                                                     | `"Order"`                           | |
| `referenceId`  | String    | ID of the related entity.                                                   | `"DH-261215-1234"`                  | Ref: `orders.orderId` |
| `payload`      | Map       | Specific data and snapshot of related entities at creation time.    | `{ claimId: "CLM-123", orderSnapshot: {...} }`    | |
| `createdByUid` | String    | UID of the user who created the task.                                       | `"uid_xyz123"`                      | Ref: `users.uid` |
| `handledBy`    | String    | UID of the user (manager) who handled/approved the task.                    | `"uid_mgr123"`                      | Ref: `users.uid` |
| `createdAt`    | Timestamp | When the task was created.                                                  | `December 15, 2026 at 10:30:00 AM UTC+7` | |
| `updatedAt`    | Timestamp | When the task was last updated.                                             | `December 15, 2026 at 10:30:00 AM UTC+7` | |

### TypeScript Interface
```typescript
import { Timestamp } from "firebase/firestore";

export type TodoType = 
  | "CLAIM_APPROVAL" 
  | "PRODUCT_DELETE_APPROVAL" 
  | "BILL_CANCEL_APPROVAL" 
  | "RETURN_APPROVAL" 
  | "PRODUCT_IMPORT_APPROVAL" 
  | "PRODUCT_KNOWLEDGE_APPROVAL"
  | "AD_APPROVAL";

export type TodoStatus = "pending_manager" | "approved" | "waiting_item" | "processing" | "completed" | "rejected" | "cancelled";

export interface Todo {
  id?: string;
  type: TodoType;
  title: string;
  description: string;
  priority: "High" | "Critical" | "Normal" | "Low";
  status: TodoStatus;
  referenceType?: "Order" | "Product" | "User" | "Partner";
  referenceId?: string;
  payload?: any; // Dynamic based on type
  createdByUid: string;
  handledBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Architectural Note
- **`managerTodoService.js`**: Handles real-time subscription to Manager-specific tasks.
- **`managerActionService.js`**: Handles the actual business logic of Manager approvals and rejections.

---

## 3. Collection: `partners`
**Firestore Path:** `/partners/{partnerId}`
**Role:** Stores information about affiliated repair shops and partners. Used to display nearby services to customers based on distance and credit points.

### Schema Fields
| Field Name   | Type      | Description                                                                 | Example Value                       | Foreign Key / Ref |
|--------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `storeName`  | String    | The name of the partner's store.                                            | `"ช่างแอร์ตำนาน"`                       | |
| `phone`      | String    | Contact phone number for the store.                                         | `"0812345678"`                      | |
| `services`   | String    | Comma-separated list of services provided.                                  | `"เปลี่ยนจอ, อัปเกรด RAM, ล้างเครื่อง"`       | |
| `isActive`   | Boolean   | Whether the partner is active and accepting customers.                      | `true`                              | |
| `lat`        | Number    | Latitude of the store's location.                                           | `13.7563`                           | |
| `lng`        | Number    | Longitude of the store's location.                                          | `100.5018`                          | |
| `points`     | Number    | Credit points used to rank the partner when searching.                      | `150`                               | Ref: `users.creditPoints` (derived)|
| `mapsUrl`    | String    | Google Maps URL for the store.                                              | `"https://goo.gl/maps/..."`         | |

### TypeScript Interface
```typescript
export interface Partner {
  id?: string;
  ownerId: string;
  storeName: string;
  phone: string;
  services: string;
  isActive: boolean;
  lat: number;
  lng: number;
  points: number;
  mapsUrl?: string;
}
```

### Architectural Note: `ActivePartners` & Map Radar
- The Storefront radar map fetches from the **`ActivePartners`** collection, not the main `partners` collection.
- When a profile is updated via `storeProfileSubmitService.js`, the partner is **removed** from `ActivePartners`.
- Upon approval of the `AD_APPROVAL` todo via `adManagementService.js`, the service copies the data back to `ActivePartners`.
- Client uses `partnerLocationService.js` (caching + weighted algorithm) to minimize reads.

---

## 4. Storage: `history_logs` (GAS)
**Storage Path:** Google Drive via GAS (`DH_Notebook_History/history_YYYY-MM-DD.jsonl`)
**Role:** Tracks user operations. Migrated out of Firestore to save read/write quota costs.

### Schema Fields (Maximum Detail JSON)
| Field Name    | Type      | Description                                                                 | Example Value                       | Foreign Key / Ref |
|---------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `level`       | String    | Log severity level.                                                         | `"INFO"`, `"WARN"`, `"ERROR"`       | |
| `module`      | String    | The main system component where the action happened.                        | `"Inventory"`                       | |
| `action`      | String    | The specific operation performed.                                           | `"Create"`, `"Update"`, `"Delete"`  | |
| `actor`       | Object    | Deep object containing uid, name, email, and userAgent.                     | `{ "uid": "123", "name": "สมชาย" }` | Ref: `users.uid` |
| `context`     | Object    | Deep object containing URL and routing path where the action occurred.      | `{ "path": "/inventory" }`          | |
| `target`      | Object    | Deep object identifying the affected entity (id, name, type).               | `{ "id": "SKU-999" }`               | Ref: `products.sku` |
| `details`     | Object    | Maximum detail payload containing legacy_details, changes (diffs), etc.     | `{ "changes": { "price": {...} } }` | |
| `client_timestamp`| String| The ISO string timestamp generated by the client browser.                   | `"2026-06-12T10:30:00.000Z"`        | |
| `server_timestamp`| String| The ISO string timestamp when GAS processed the log.                        | `"2026-06-12T10:30:05.000Z"`        | |

### TypeScript Interface
```typescript
export interface HistoryLogActor {
  uid: string;
  name?: string;
  email?: string;
  userAgent?: string;
}

export interface HistoryLogTarget {
  id: string;
  name?: string;
  type?: string;
}

export interface HistoryLog {
  level: "INFO" | "WARN" | "ERROR";
  module: string;
  action: string;
  actor: HistoryLogActor;
  context?: { path: string; [key: string]: any };
  target?: HistoryLogTarget;
  details?: { changes?: any; legacy_details?: string; [key: string]: any };
  client_timestamp: string;
  server_timestamp?: string; // added by GAS
}
```

---

## 5. Collection: `system_logs`
**Firestore Path:** `/system_logs/{logId}`
**Role:** Tracks critical system-level automated actions and approvals (e.g., Payment Verifications, Wholesale Approvals) performed by managers or system routines.

### Schema Fields
| Field Name   | Type      | Description                                                                 | Example Value                       | Foreign Key / Ref |
|--------------|-----------|-----------------------------------------------------------------------------|-------------------------------------|-------------------|
| `actionType` | String    | The type of system action performed.                                        | `"PAYMENT_VERIFIED"`                | |
| `taskId`     | String    | ID of the associated To-do task.                                            | `"T-12345"`                         | Ref: `todos.id` |
| `orderId`    | String    | ID of the associated Order (if applicable).                                 | `"DH-261215-1234"`                  | Ref: `orders.orderId` |
| `details`    | String    | Description of what occurred.                                               | `"ยืนยันยอดเงินสำเร็จ"`               | |
| `createdBy`  | String    | The UID of the manager or `"System"` if automated.                          | `"uid_mgr123"`                      | Ref: `users.uid` |
| `createdAt`  | Timestamp | When the action occurred.                                                   | `December 15, 2026 at 10:30:00 AM`  | |

### TypeScript Interface
```typescript
import { Timestamp } from "firebase/firestore";

export interface SystemLog {
  id?: string;
  actionType: string;
  taskId?: string;
  orderId?: string;
  details: string;
  createdBy: string;
  createdAt: Timestamp;
}
```
