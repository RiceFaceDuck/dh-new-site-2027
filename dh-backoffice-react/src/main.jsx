import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

import { db } from './firebase/config'
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore'

window.runCategoryMigration = async () => {
  console.log('Starting category migration...');
  const productsRef = collection(db, 'products');
  const snap = await getDocs(productsRef);
  const docs = snap.docs;
  console.log(`Found ${docs.length} products to process.`);
  
  let batch = writeBatch(db);
  let batchCount = 0;
  let totalUpdated = 0;
  
  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    const data = d.data();
    if (data.category) {
      const expectedLower = data.category.trim().toLowerCase();
      if (data.category_lower !== expectedLower) {
        batch.update(d.ref, { category_lower: expectedLower });
        batchCount++;
        totalUpdated++;
      }
    }
    
    if (batchCount === 400 || i === docs.length - 1) {
      if (batchCount > 0) {
        await batch.commit();
        console.log(`Committed batch of ${batchCount} updates.`);
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
  }
  
  console.log(`Migration completed! Total updated: ${totalUpdated}`);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
)