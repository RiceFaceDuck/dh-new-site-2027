
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MobileLayout from './layouts/MobileLayout';
import PackingTasks from './pages/PackingTasks';

function App() {
return (
<Router>
<Routes>
<Route path="/" element={<MobileLayout />}>
<Route index element={<PackingTasks />} />
<Route path="stock" element={<div className="p-5 text-gray-400 text-center mt-10">ระบบคลังสินค้ากำลังพัฒนา</div>} />
<Route path="history" element={<div className="p-5 text-gray-400 text-center mt-10">ประวัติการแพ็คกำลังพัฒนา</div>} />
<Route path="profile" element={<div className="p-5 text-gray-400 text-center mt-10">ตั้งค่าโปรไฟล์กำลังพัฒนา</div>} />
</Route>
</Routes>
</Router>
);
}

export default App;
