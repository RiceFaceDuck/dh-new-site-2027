# 📊 FIRESTORE QUOTA SIMULATION & ESTIMATION

This document summarizes the system's Firestore Quota (Reads/Writes) consumption based on a 24-hour simulation to ensure the architecture remains highly cost-effective and within Firebase free/low-tier limits.

## 1. Frontend Customers (1,000 Active Users)
- **Total Reads:** ~24,900 Reads / day
- **Total Writes:** ~2,000 Writes / day
- **Key Optimizations:**
  - `Smart Cache 24H`: Drastically reduces extra reads for homepage and product views.
  - `Limit Pagination`: Caps reads to 15 per user for browsing.
  - `Batch Merge`: Consolidates cart updates into fewer writes.

## 2. Backoffice Staff (10 Active Staff - Full Shift)
- **Total Reads:** ~4,000 Reads / day (Reduced massively from 34,000)
- **Total Writes:** ~2,500 Writes / day
- **Key Optimizations:**
  - `Offline Persistence & React Query Persister`: 100% Local Caching. Central Todo and other visited pages load instantly from IndexedDB (0 Extra Reads for existing data).
  - `Delta Sync`: Only fetches new or updated data after Stale Time expires.

## 3. Core Quota Optimization Rules for AI
When developing or refactoring features, the AI MUST adhere to these quota-saving principles:
1. **Zero-Read Architecture (Where Possible):** Maximize the use of `React Query` (Stale Time) and `IndexedDB` for static or slow-changing data (e.g., Settings, Categories).
2. **Server-Side Filtering:** Never fetch entire collections. Always use `where()`, `limit()`, and `orderBy()` to restrict document reads.
3. **Atomic Writes:** Use `runTransaction` or `writeBatch` to bundle writes, preventing partial data updates and saving network overhead.
4. **Trigger-On-Enter Search:** High-volume search inputs (such as Billing Dashboard Search) MUST use Enter-key submission (`onKeyDown Enter`) or explicit submit buttons instead of auto-typing queries to eliminate wasteful intermediate read requests while staff are typing.
5. **Debounce Inputs:** Any real-time search field must use a debounce (e.g., 500ms) to prevent excessive read requests while the user is typing.