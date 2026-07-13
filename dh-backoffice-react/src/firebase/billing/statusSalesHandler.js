import { doc, serverTimestamp, increment } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const handleSalesStatsUpdate = (transaction, db, totalSaleAmount, orderData, isCancelling) => {
    if (totalSaleAmount <= 0) return;

    const targetDate = isCancelling && orderData.createdAt 
        ? orderData.createdAt.toDate() 
        : new Date();

    const yyyyMM = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    const yyyyMMdd = `${yyyyMM}-${String(targetDate.getDate()).padStart(2, '0')}`;
    
    const modifier = isCancelling ? -1 : 1;

    transaction.set(doc(db, getCollectionPath('sales_stats'), yyyyMM), { 
        totalSales: increment(totalSaleAmount * modifier), 
        orderCount: increment(1 * modifier), 
        updatedAt: serverTimestamp() 
    }, { merge: true });
    
    transaction.set(doc(db, getCollectionPath('sales_stats'), yyyyMMdd), { 
        date: yyyyMMdd, 
        totalSales: increment(totalSaleAmount * modifier), 
        orderCount: increment(1 * modifier), 
        updatedAt: serverTimestamp() 
    }, { merge: true });
};
