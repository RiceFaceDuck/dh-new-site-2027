import { useEffect, useRef } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { billingStatusTransaction } from '../firebase/billingStatusTransaction';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const PENDING_TIMEOUT_HOURS = 24;

export const useAutoCleanup = () => {
  const hasRun = useRef(false);

  useEffect(() => {
    const runCleanup = async () => {
      try {
        const lastRun = localStorage.getItem('lastAutoCleanup');
        const now = Date.now();
        
        if (lastRun && now - parseInt(lastRun) < CLEANUP_INTERVAL_MS) {
          return; // Skip if run recently
        }
        
        console.log('🧹 [AutoCleanup] Starting background cleanup for expired Pending orders...');
        
        // Calculate timestamp for 24 hours ago
        const timeoutDate = new Date(now - (PENDING_TIMEOUT_HOURS * 60 * 60 * 1000));
        const timeoutTimestamp = Timestamp.fromDate(timeoutDate);
        
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('orderStatus', '==', 'pending'),
          where('createdAt', '<', timeoutTimestamp)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          console.log('🧹 [AutoCleanup] No expired pending orders found.');
        } else {
          console.log(`🧹 [AutoCleanup] Found ${querySnapshot.size} expired orders. Processing cancellations...`);
          
          const cancelPromises = querySnapshot.docs.map(async (docSnap) => {
            const orderId = docSnap.id;
            try {
              await billingStatusTransaction.updateOrderStatus(
                orderId, 
                'cancelled', 
                'pending', 
                'system-auto-cleanup'
              );
              console.log(`✅ [AutoCleanup] Successfully cancelled order ${orderId}`);
            } catch (err) {
              console.error(`❌ [AutoCleanup] Failed to cancel order ${orderId}`, err);
            }
          });
          
          await Promise.all(cancelPromises);
        }
        
        localStorage.setItem('lastAutoCleanup', now.toString());
      } catch (error) {
        console.error('🔥 [AutoCleanup] Error during cleanup execution:', error);
      }
    };

    if (!hasRun.current) {
      hasRun.current = true;
      runCleanup();
    }
  }, []);
};
