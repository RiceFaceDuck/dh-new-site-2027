
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MobileLayout from './layouts/MobileLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

const PackingTasks = lazy(() => import('./pages/PackingTasks'));
const StockMain = lazy(() => import('./pages/StockMain'));
const ProfileMain = lazy(() => import('./pages/ProfileMain'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<MobileLayout />}>
              <Route index element={<PackingTasks />} />
              <Route path="stock" element={<StockMain />} />
              <Route path="history" element={<div className="p-5 text-gray-400 text-center mt-10">ประวัติการแพ็คกำลังพัฒนา</div>} />
              <Route path="profile" element={<ProfileMain />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
