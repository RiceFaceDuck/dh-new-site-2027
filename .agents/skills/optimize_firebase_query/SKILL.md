---
name: optimize_firebase_query
description: "Guidelines for writing optimized, cost-effective Firebase Firestore queries in DH Notebook."
---

# Instructions for Firebase Optimization

When writing or refactoring Firebase queries, you MUST adhere to the following rules to balance speed and read/write quotas:

## 1. Always Use Pagination for Lists
Never fetch an entire collection. Use `limit()` and `startAfter()` for list views.
```javascript
import { collection, query, limit, startAfter, getDocs } from "firebase/firestore";

// Bad: getDocs(collection(db, "products"))
// Good:
const q = query(collection(db, "products"), limit(20));
```

## 2. Unsubscribe from Listeners
If using `onSnapshot` for real-time data, you MUST return the unsubscribe function in the `useEffect` cleanup to prevent memory leaks and infinite read loops.
```javascript
useEffect(() => {
  const unsubscribe = onSnapshot(q, (snapshot) => { /* ... */ });
  return () => unsubscribe(); // CRITICAL
}, []);
```

## 3. Optimistic UI Updates
When a user updates data (e.g., changing stock quantity), update the local React state IMMEDIATELY before awaiting the Firebase write. This provides a snappy UX without waiting for network latency.
- Wrap the Firebase write in a try/catch.
- If the write fails, revert the local state back to the original value and show a toast error.

## 4. Batch Writes for Multiple Docs
If updating multiple documents simultaneously, always use a `writeBatch` to ensure atomicity and reduce network overhead.
