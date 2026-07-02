
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MobileLayout from './layouts/MobileLayout';
import PackingTasks from './pages/PackingTasks';
import StockMain from './pages/StockMain';
import ProfileMain from './pages/ProfileMain';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
return (
<ErrorBoundary>
<Router>
<Routes>
<Route path="/" element={<MobileLayout />}>
<Route index element={<PackingTasks />} />
<Route path="stock" element={<StockMain />} />
<Route path="history" element={<div className="p-5 text-gray-400 text-center mt-10">ประวัติการแพ็คกำลังพัฒนา</div>} />
<Route path="profile" element={<ProfileMain />} />
</Route>
</Routes>
</Router>
</ErrorBoundary>
);
}

export default App;
