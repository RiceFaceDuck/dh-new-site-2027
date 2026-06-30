import { useState, useEffect, useRef } from 'react';
import { db } from '../../../firebase/config';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';

export const useWholesalePrices = (activeTodos) => {
  const [wholesaleInputs, setWholesaleInputs] = useState({});
  const [fetchedPrices, setFetchedPrices] = useState({});
  const fetchedRef = useRef({}); // 🚀 [Optimization] ใช้ useRef เพื่อเก็บ State โดยไม่ทริกเกอร์ re-render loop

  useEffect(() => {
    const fetchPricesForWholesale = async () => {
      const wholesaleTasks = activeTodos.filter(t => ['WHOLESALE_APPROVAL', 'wholesale_request'].includes(t.type) && t.items);
      if (wholesaleTasks.length === 0) return;
      
      let hasChanges = false;
      const productIdsToFetch = new Set();
      const taskProductMap = {};

      wholesaleTasks.forEach(task => {
        if (!fetchedRef.current[task.id]) {
          fetchedRef.current[task.id] = {};
        }
        const productIds = task.items.map(item => item.productId).filter(Boolean);
        productIds.forEach(pId => {
           if (fetchedRef.current[task.id][pId] === undefined) {
               productIdsToFetch.add(pId);
               if (!taskProductMap[pId]) taskProductMap[pId] = [];
               taskProductMap[pId].push(task.id);
           }
        });
      });

      const uniqueIds = Array.from(productIdsToFetch);
      
      if (uniqueIds.length > 0) {
          for(let i=0; i < uniqueIds.length; i+=10) {
              const batchIds = uniqueIds.slice(i, i+10);
              try {
                  const q = query(collection(db, 'products'), where(documentId(), 'in', batchIds));
                  const snapshot = await getDocs(q);
                  const foundPrices = {};
                  snapshot.forEach(doc => { foundPrices[doc.id] = doc.data().wholesalePrice || null; });

                  batchIds.forEach(pId => {
                     const taskIds = taskProductMap[pId] || [];
                     const price = foundPrices[pId] !== undefined ? foundPrices[pId] : null; 
                     taskIds.forEach(tId => {
                         fetchedRef.current[tId][pId] = price;
                         hasChanges = true;
                     });
                  });
              } catch (err) {
                  console.error("Error fetching wholesale prices batch", err);
              }
          }
      }

      if (hasChanges) {
          setFetchedPrices({ ...fetchedRef.current });
      }
    };

    if (activeTodos && activeTodos.length > 0) {
        fetchPricesForWholesale();
    }
  }, [activeTodos]); // 🚀 เอา fetchedPrices ออกจาก Dependency ป้องกัน Infinite Loop

  return {
    fetchedPrices,
    wholesaleInputs,
    setWholesaleInputs
  };
};
