import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const COLLECTION_NAME = 'system_stats';
const DOC_ID = 'web_traffic';

export const webTrafficService = {
  /**
   * ดึงข้อมูลสถิติการเข้าชมหน้าเว็บแบบครั้งเดียว (One-time get)
   */
  getTrafficStats: async () => {
    try {
      const docRef = doc(db, getCollectionPath(COLLECTION_NAME), DOC_ID);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      console.error('🔥 Error fetching web traffic stats:', error);
      return null;
    }
  },

  /**
   * สมัครรับการเปลี่ยนแปลงข้อมูลสถิติแบบ Realtime (Listen to changes)
   */
  subscribeTrafficStats: (onUpdate, onError) => {
    try {
      const docRef = doc(db, getCollectionPath(COLLECTION_NAME), DOC_ID);
      return onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            onUpdate(snap.data());
          } else {
            onUpdate(null);
          }
        },
        (error) => {
          console.error('🔥 Error subscribing to web traffic stats:', error);
          if (onError) onError(error);
        }
      );
    } catch (error) {
      console.error('🔥 Error creating web traffic stats subscription:', error);
      if (onError) onError(error);
      return () => {};
    }
  }
};
