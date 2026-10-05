import { useState, useEffect } from 'react';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

/**
 * Hook for subscribing to active claims/after-sales tickets linked to an order
 * @param {string} orderId Order ID (e.g. DH-26-0043 or order document ID)
 */
export function useOrderClaims(orderId) {
    const [activeClaims, setActiveClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            setActiveClaims([]);
            setLoading(false);
            return;
        }

        const claimsColl = collection(db, getCollectionPath('claims'));
        const q = query(
            claimsColl,
            where('payload.orderId', '==', orderId),
            limit(10)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const list = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setActiveClaims(list);
                setLoading(false);
            },
            (error) => {
                console.error('[useOrderClaims] Error subscribing to claims:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [orderId]);

    return { activeClaims, loading };
}

export default useOrderClaims;
