
import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Box, Loader2 } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const PackingTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // 🔍 ดึงเฉพาะออเดอร์ที่สถานะเป็น 'paid' เพื่อป้องกันการแพ็คของที่ยังไม่จ่ายเงิน
    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['paid', 'PAID']),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.orderId || doc.id,
          docId: doc.id,
          customer: data.customerName || data.customer?.name || 'ลูกค้าทั่วไป',
          items: data.items ? data.items.length : 0,
          status: 'Normal', // TODO: เพิ่ม logic check ความด่วน
          createdAt: data.createdAt?.toDate()
        };
      });
      setTasks(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching paid orders: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredTasks = tasks.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase()) || 
    t.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold text-gray-800 mb-4">รายการรอแพ็คสินค้า</h1>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="ค้นหาเลขบิล / ชื่อลูกค้า"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 bg-white rounded-xl border border-gray-100 shadow-sm px-11 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
          ไม่มีรายการรอแพ็ค
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
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
      )}
    </div>
  );
};

export default PackingTasks;
