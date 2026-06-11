import { useState, useEffect } from 'react';
import { db } from '../../../firebase/config';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';

export const useWholesalePrices = (activeTodos) => {
  const [wholesaleInputs, setWholesaleInputs] = useState({});
  const [fetchedPrices, setFetchedPrices] = useState({});

  useEffect(() => {
    const fetchPricesForWholesale = async () => {
      const wholesaleTasks = activeTodos.filter(t => ['WHOLESALE_APPROVAL', 'wholesale_request'].includes(t.type) && t.items);
      if (wholesaleTasks.length === 0) return;
      
      let newFetchedPrices = { ...fetchedPrices };
      let hasChanges = false;
      const productIdsToFetch = new Set();
      const taskProductMap = {};

      wholesaleTasks.forEach(task => {
        if (!newFetchedPrices[task.id]) {
          newFetchedPrices[task.id] = {};
          hasChanges = true; 
        }
        const productIds = task.items.map(item => item.productId).filter(Boolean);
        productIds.forEach(pId => {
           if (newFetchedPrices[task.id][pId] === undefined) {
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
                         newFetchedPrices[tId][pId] = price;
                         hasChanges = true;
                     });
                  });
              } catch (err) {
                  console.error("Error fetching wholesale prices batch", err);
              }
          }
      }

      if (hasChanges) setFetchedPrices(newFetchedPrices);
    };

    if (activeTodos && activeTodos.length > 0) {
        fetchPricesForWholesale();
    }
  }, [activeTodos, fetchedPrices]);

  return {
    fetchedPrices,
    wholesaleInputs,
    setWholesaleInputs
  };
};
