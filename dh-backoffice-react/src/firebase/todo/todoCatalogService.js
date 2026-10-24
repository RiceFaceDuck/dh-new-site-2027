import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { todoQueryService } from './todoQueryService';

export const COMPLETED_TODOS_CACHE_KEY = 'dh_todos_completed_bundle_v1';
export const COMPLETED_TODOS_META_KEY = 'dh_todos_completed_meta_v1';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 ชั่วโมง
export const MAX_BUNDLE_ITEMS = 250; // บันทึกสูงสุด 250 รายการต่อ 1 Document (~100KB ประหยัดพื้นที่ ไม่เกิน 1MB แน่นอน)

// 💎 Tier 1: In-Memory Fast Cache
let inMemoryCompletedTodos = null;
let inMemoryMeta = null;

// Helper แปลง Timestamp ให้เป็น Epoch Milliseconds เพื่อบันทึกขนาดเบาที่สุด
const toEpochMs = (ts) => {
  if (!ts) return null;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  if (ts.seconds) return ts.seconds * 1000;
  const parsed = new Date(ts).getTime();
  return isNaN(parsed) ? null : parsed;
};

// Helper สร้างโครงสร้าง Timestamp จำลองที่มี .toDate() และ .toMillis() สำหรับ UI
const createTimestampShim = (epochMs) => {
  if (!epochMs) return null;
  return {
    toDate: () => new Date(epochMs),
    toMillis: () => epochMs,
    seconds: Math.floor(epochMs / 1000),
    nanoseconds: 0
  };
};

// จัดรูปฟอร์แมต Todo ให้ปลอดภัยและใช้กับ UI ได้ทันที
const formatTodoItem = (t) => {
  const createdMs = toEpochMs(t.createdAt);
  const completedMs = toEpochMs(t.completedAt) || createdMs;
  const updatedMs = toEpochMs(t.updatedAt) || completedMs;

  return {
    ...t,
    createdAt: createdMs ? createTimestampShim(createdMs) : null,
    completedAt: completedMs ? createTimestampShim(completedMs) : null,
    updatedAt: updatedMs ? createTimestampShim(updatedMs) : null,
    _createdMs: createdMs,
    _completedMs: completedMs
  };
};

// จัดรูปฟอร์แมต Todo แบบกะทัดรัดก่อนบันทึกลง Firestore Bundle หรือ LocalStorage
const serializeTodoItem = (t) => {
  return {
    id: t.id,
    title: t.title || '',
    description: t.description || '',
    type: t.type || t.taskType || 'GENERAL',
    status: t.status || 'completed',
    priority: t.priority || 'medium',
    assignedTo: t.assignedTo || null,
    customerName: t.customerName || t.customer?.name || null,
    orderId: t.orderId || null,
    createdAt: toEpochMs(t.createdAt),
    completedAt: toEpochMs(t.completedAt) || Date.now(),
    updatedAt: toEpochMs(t.updatedAt) || Date.now()
  };
};

/**
 * 📖 อ่าน Cache งานที่เสร็จแล้วจาก In-Memory หรือ LocalStorage (0 Reads)
 */
export const readCachedCompletedTodos = () => {
  if (inMemoryCompletedTodos && inMemoryCompletedTodos.length > 0) {
    return { todos: inMemoryCompletedTodos, meta: inMemoryMeta };
  }

  if (typeof window !== 'undefined') {
    try {
      const metaStr = window.localStorage.getItem(COMPLETED_TODOS_META_KEY);
      const dataStr = window.localStorage.getItem(COMPLETED_TODOS_CACHE_KEY);
      if (metaStr && dataStr) {
        const meta = JSON.parse(metaStr);
        const isExpired = Date.now() - (meta.timestamp || 0) > CACHE_TTL_MS;
        if (!isExpired) {
          const rawTodos = JSON.parse(dataStr);
          if (Array.isArray(rawTodos) && rawTodos.length > 0) {
            inMemoryCompletedTodos = rawTodos.map(formatTodoItem);
            inMemoryMeta = meta;
            return { todos: inMemoryCompletedTodos, meta };
          }
        }
      }
    } catch (e) {
      console.warn("⚠️ Warning reading local completed todo cache:", e);
    }
  }

  return { todos: null, meta: null };
};

/**
 * 💾 เขียน Cache งานที่เสร็จแล้วลง In-Memory และ LocalStorage
 */
export const writeCachedCompletedTodos = (todos, meta = {}) => {
  if (!Array.isArray(todos)) return;
  
  inMemoryCompletedTodos = todos.map(formatTodoItem);
  inMemoryMeta = {
    version: meta.version || 1,
    timestamp: meta.timestamp || Date.now(),
    count: todos.length
  };

  if (typeof window !== 'undefined') {
    try {
      const serialized = todos.map(serializeTodoItem);
      window.localStorage.setItem(COMPLETED_TODOS_META_KEY, JSON.stringify(inMemoryMeta));
      window.localStorage.setItem(COMPLETED_TODOS_CACHE_KEY, JSON.stringify(serialized));
    } catch (e) {
      console.warn("⚠️ Warning writing local completed todo cache:", e);
    }
  }
};

/**
 * 🚀 ดึงประวัติงานที่เสร็จแล้วด้วยเทคนิค Snapshot Bundling (ประหยัดสูงสุด 1 Read ได้ 250 รายการ)
 */
export const fetchCompletedTodosBundle = async ({ forceRefresh = false, fallbackLimit = 50 } = {}) => {
  // 1. ตรวจสอบ Cache ในเครื่องก่อน (หากไม่บังคับรีเฟรช และมีแคช -> เสีย 0 Reads ทันที)
  if (!forceRefresh) {
    const cached = readCachedCompletedTodos();
    if (cached.todos && cached.todos.length > 0) {
      return { todos: cached.todos, source: 'cache', reads: 0 };
    }
  }

  // 2. ดึงจาก Snapshot Bundle Document ใน Firestore (เสียเพียง 1 Read รวดเดียว!)
  try {
    const docRef = doc(db, getCollectionPath('catalogs'), 'todos_completed_bundle');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const rawList = Array.isArray(data.todos) ? data.todos : [];
      
      const formatted = rawList.map(formatTodoItem);
      writeCachedCompletedTodos(formatted, {
        version: data.version,
        timestamp: data.updatedAt || Date.now()
      });

      return { todos: formatted, source: 'bundle_doc', reads: 1 };
    }

    // 3. กรณี Bundle Document ยังไม่เคยถูกสร้าง (Cold Start ครั้งแรกสุด): ดึง fallback มาประกอบร่างเป็น Bundle
    const fallbackTodos = await todoQueryService.getCompletedTodos(fallbackLimit);
    const serialized = fallbackTodos.map(serializeTodoItem);

    // เซฟขึ้นเป็น Bundle Doc แรก (1 Write) เพื่อให้ครั้งถัดไปและทุกคนในระบบอ่านแค่ 1 Read
    try {
      await setDoc(docRef, {
        version: 1,
        updatedAt: Date.now(),
        count: serialized.length,
        todos: serialized
      });
    } catch (errSave) {
      console.warn("⚠️ Warning creating todos_completed_bundle doc:", errSave);
    }

    const formatted = serialized.map(formatTodoItem);
    writeCachedCompletedTodos(formatted, {
      version: 1,
      timestamp: Date.now()
    });

    return { todos: formatted, source: 'seeded_bundle', reads: fallbackTodos.length };
  } catch (err) {
    console.error("🔥 Error in fetchCompletedTodosBundle:", err);
    // หากมีแคชเก่าแม้จะหมดอายุก็ยังสามารถนำมาแสดงเพื่อความลื่นไหล
    const staleCache = readCachedCompletedTodos();
    if (staleCache.todos) {
      return { todos: staleCache.todos, source: 'stale_cache', reads: 0 };
    }
    return { todos: [], source: 'error', reads: 0, error: err };
  }
};

/**
 * ⚡ อัปเดตงานที่เสร็จเข้าสู่ Snapshot Bundle และ Local Cache ทันที (0 Reads!)
 * เมื่อมีการอนุมัติ/ปฏิเสธงานบนหน้าจอ จะนำรายการนี้แทรกเข้าหัวตารางทันที
 */
export const syncCompletedTodoToBundle = async (completedTask) => {
  if (!completedTask || !completedTask.id) return;

  try {
    // 1. อ่านแคชปัจจุบัน
    const current = readCachedCompletedTodos();
    const currentList = current.todos ? [...current.todos] : [];

    // 2. ลบรายการเดิมถ้ามีซ้ำ แล้วแทรกเข้าหน้าสุด
    const filtered = currentList.filter(t => t.id !== completedTask.id);
    const updatedList = [completedTask, ...filtered].slice(0, MAX_BUNDLE_ITEMS);

    // 3. บันทึกลงแคชในเครื่องทันที (0 Reads / ทันที)
    writeCachedCompletedTodos(updatedList, {
      version: 1,
      timestamp: Date.now()
    });

    // 4. บันทึกรวมเข้าก้อน Snapshot Bundle บน Firestore แบบ Asynchronous
    const docRef = doc(db, getCollectionPath('catalogs'), 'todos_completed_bundle');
    const serialized = updatedList.map(serializeTodoItem);
    
    await setDoc(docRef, {
      version: 1,
      updatedAt: Date.now(),
      count: serialized.length,
      todos: serialized
    }, { merge: true });

  } catch (err) {
    console.warn("⚠️ Warning syncing completed todo to bundle:", err);
  }
};
