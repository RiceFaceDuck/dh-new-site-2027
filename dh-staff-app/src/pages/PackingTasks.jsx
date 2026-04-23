
import React from 'react';
import { Search, ChevronRight, Box } from 'lucide-react';

const PackingTasks = () => {

const tasks = [
{ id: 'ORD-2601', customer: 'ร้านซ่อมคอม พัทยา', items: 3, status: 'Urgent' },
{ id: 'ORD-2602', customer: 'สมชาย ไอที', items: 1, status: 'Normal' },
{ id: 'ORD-2603', customer: 'บริษัท เทคโซลูชั่น', items: 5, status: 'Normal' },
];

return (
<div className="p-5">

<h1 className="text-xl font-bold text-gray-800 mb-4">รายการรอแพ็คสินค้า</h1>

<div className="relative mb-6">
<input
type="text"
placeholder="ค้นหาเลขบิล / ชื่อลูกค้า"
className="w-full h-12 bg-white rounded-xl border-none shadow-sm px-11 text-sm"
/>
<Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
</div>

<div className="space-y-4">
{tasks.map((task) => (
<div key={task.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
<div className="flex items-center gap-4">
<div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
task.status === 'Urgent' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
}`}>
<Box size={24} />
</div>

<div>
<p className="text-xs text-gray-400 font-medium">#{task.id}</p>
<h3 className="font-bold text-gray-800">{task.customer}</h3>
<p className="text-xs text-gray-500">สินค้า {task.items} รายการ</p>
</div>
</div>

<ChevronRight className="text-gray-300" size={20} />

</div>
))}
</div>

</div>
);
};

export default PackingTasks;
