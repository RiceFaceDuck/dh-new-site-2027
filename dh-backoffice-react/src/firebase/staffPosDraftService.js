import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { safeJsonParse } from 'dh-shared';

/**
 * 🛡️ Helper: Filter out completed and cancelled tabs from draft storage
 */
export const filterValidDraftTabs = (tabs) => {
  if (!Array.isArray(tabs)) return [];
  return tabs.filter((t) => {
    const stat = (
      t.orderStatus ||
      t.status ||
      t.paymentStatus ||
      ''
    ).toLowerCase();
    const isFinished =
      stat === 'approved' ||
      stat === 'completed' ||
      stat === 'paid' ||
      stat === 'cancelled' ||
      stat === 'void';
    return (
      !isFinished &&
      (t.items?.length > 0 ||
        t.customer ||
        t.docId ||
        (t.orderId && !String(t.orderId).startsWith('DH-TEMP-')))
    );
  });
};

// Debounce timer map per staff UID to prevent quota leaks
const debounceTimers = new Map();

/**
 * ☁️ staffPosDraftService: Cloud & Local Persistence per Staff Account
 * Single-Document architecture: `users/{uid}/private/pos_drafts` (1 Read / 1 Debounced Write)
 */
export const staffPosDraftService = {
  /**
   * โหลดดราฟต์ของพนักงานจาก Firestore Cloud
   */
  async getStaffCloudDrafts(uid) {
    if (!uid || uid === 'guest') return [];
    try {
      const draftRef = doc(db, getCollectionPath('users'), uid, 'private', 'pos_drafts');
      const snap = await getDoc(draftRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.tabs)) {
          return filterValidDraftTabs(data.tabs);
        }
      }
    } catch (err) {
      console.warn('⚠️ [staffPosDraftService] Failed to load cloud drafts:', err.message);
    }
    return [];
  },

  /**
   * บันทึกดราฟต์ของพนักงานขึ้น Firestore Cloud (Debounced 2.5s เพื่อประหยัดโควต้า 100%)
   */
  saveStaffCloudDraftsDebounced(uid, tabs, delayMs = 2500) {
    if (!uid || uid === 'guest') return;

    if (debounceTimers.has(uid)) {
      clearTimeout(debounceTimers.get(uid));
    }

    const timer = setTimeout(async () => {
      debounceTimers.delete(uid);
      try {
        const validTabs = filterValidDraftTabs(tabs);
        const draftRef = doc(db, getCollectionPath('users'), uid, 'private', 'pos_drafts');
        await setDoc(
          draftRef,
          {
            tabs: validTabs,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('⚠️ [staffPosDraftService] Failed to save cloud drafts:', err.message);
      }
    }, delayMs);

    debounceTimers.set(uid, timer);
  },

  /**
   * บันทึกดราฟต์ทันที (เช่น ตอน Unmount หรือปิดหน้าต่าง)
   */
  async saveStaffCloudDraftsImmediately(uid, tabs) {
    if (!uid || uid === 'guest') return;
    if (debounceTimers.has(uid)) {
      clearTimeout(debounceTimers.get(uid));
      debounceTimers.delete(uid);
    }
    try {
      const validTabs = filterValidDraftTabs(tabs);
      const draftRef = doc(db, getCollectionPath('users'), uid, 'private', 'pos_drafts');
      await setDoc(
        draftRef,
        {
          tabs: validTabs,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('⚠️ [staffPosDraftService] Immediate save error:', err.message);
    }
  },
};
