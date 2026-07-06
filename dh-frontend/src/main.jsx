// Canvas: src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'
import App from './App'
import './index.css'

import { ErrorBoundary } from './components/ErrorBoundary'

// ตั้งค่า Caching Client สำหรับดึงข้อมูลและจำไว้ในเครื่อง
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // เก็บแคชไว้ 24 ชั่วโมง
      staleTime: 1000 * 60 * 5, // ข้อมูลจะเก่าเมื่อผ่านไป 5 นาที (ไม่ต้องดึงใหม่ถ้ารีเฟรชก่อน 5 นาที)
      refetchOnWindowFocus: false, // ป้องกันการดึงข้อมูลรัวๆ เวลาสลับหน้าจอ
      retry: 1,
    },
  },
})

const indexedDBPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => await get(key),
    setItem: async (key, value) => await set(key, value),
    removeItem: async (key) => await del(key),
  },
})

// เริ่มต้นการเรนเดอร์ React App เข้ากับ DOM หลัก
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PersistQueryClientProvider 
      client={queryClient}
      persistOptions={{ persister: indexedDBPersister }}
    >
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </PersistQueryClientProvider>
  </React.StrictMode>
)