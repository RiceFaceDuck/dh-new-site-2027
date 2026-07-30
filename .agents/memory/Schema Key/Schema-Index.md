# Firebase Schema & Keys

Welcome to the DH Notebook Database Schema guide. The system is divided into 3 Tiers based on **Importance** to minimize modification risks and to make it easier for AI to utilize TypeScript Interfaces.

## Schema Tagging System
Each schema table is labeled with a behavioral tag to dictate execution rules:
* `[ATOMIC-REQUIRED]`: Modifying this collection MUST be done inside `runTransaction` or `writeBatch`.
* `[READ-HEAVY]`: This collection is read frequently. MUST use aggressive caching (React Query / IndexedDB) or pagination.
* `[APPEND-ONLY]`: Data here is for logging. DO NOT update or delete existing documents.

## Tier Classification
Please refer to the files based on the data level you need to work with:

### 🔴 [Tier 1: Critical Schemas (Highest Risk)](./Schema-Tier1-Critical.md)
**Data Group:** Finance, Transactions, and Security
* `orders` `[ATOMIC-REQUIRED]` (All bills, revenues, discounts)
* `credit_transactions` `[ATOMIC-REQUIRED]` `[APPEND-ONLY]` (Wallet, credit usage history)
* `counters` `[ATOMIC-REQUIRED]` (Receipt sequence numbers)
* `users` `[ATOMIC-REQUIRED]` (User profiles, permission assignments)

### 🟡 [Tier 2: Operational Schemas (Important for Operations)](./Schema-Tier2-Operational.md)
**Data Group:** Backoffice management, Inventory, and Approvals
* `products` `[ATOMIC-REQUIRED]` (Product data, stock)
* `todos` (Manager Request/Approval system)
* `partners` (Technicians, services, store coordinates)
* `history_logs` / `system_logs` `[APPEND-ONLY]` (Audit Trail system)

### 🟢 [Tier 3: Configuration & UI Schemas (Settings & Display)](./Schema-Tier3-Config.md)
**Data Group:** Marketing, Storefront UI, and Settings
* `promotions` & `freebies` `[READ-HEAVY]` (Discounts, free items)
* `homepage_categories` `[READ-HEAVY]` (Homepage categories)
* `settings/*` `[READ-HEAVY]` (UI settings, Footer, Cookies, etc.)

---

> [!TIP]
> Each file includes **TypeScript Interfaces** attached below the Schema tables. If you are a Developer or AI writing React code, you can copy these Types directly to prevent Typo errors.
