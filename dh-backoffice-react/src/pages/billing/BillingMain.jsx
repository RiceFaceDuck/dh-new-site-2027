import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  Receipt, DollarSign, Search, Filter, Printer, 
  Download, CheckCircle, Clock, FileText, ArrowUpRight, Loader2
} from 'lucide-react';

const BillingMain = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ดึงข้อมูลบิล (ออเดอร์ที่จ่ายเงินแล้ว)
  useEffect(() => {
    // ดึงเฉพาะสถานะหลังจากการชำระเงินผ่านแล้ว
    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['paid', 'processing', 'shipped', 'completed'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // เรียงลำดับฝั่ง Client เพื่อป้องกันปัญหา Firebase Missing Index
      fetchedOrders.sort((a, b) => {
        const timeA = a.paymentVerifiedAt?.toMillis() || a.createdAt?.toMillis() || 0;
        const timeB = b.paymentVerifiedAt?.toMillis() || b.createdAt?.toMillis() || 0;
        return timeB - timeA; // ใหม่ล่าสุดขึ้นก่อน
      });

      setOrders(fetchedOrders);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching billing orders:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // การคำนวณสถิติ
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totals?.netTotal || 0), 0);
  const totalInvoices = orders.filter(o => o.invoiceId).length;
  const taxRequests = orders.filter(o => o.taxInvoice && o.taxInvoiceStatus !== 'issued').length;

  // การกรองและการค้นหา
  const filteredOrders = orders.filter(order => {
    const searchString = `${order.invoiceId || ''} ${order.id} ${order.shippingAddress?.fullName || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'tax_pending') {
      matchesStatus = order.taxInvoice && order.taxInvoiceStatus !== 'issued';
    } else if (filterStatus === 'completed') {
      matchesStatus = order.status === 'completed' || order.status === 'shipped';
    }

    return matchesSearch && matchesStatus;
  });

  // ตัวช่วยแสดงสถานะ
  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
      case 'processing': return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> ชำระแล้ว/กำลังจัดของ</span>;
      case 'shipped': return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 flex items-center gap-1 w-max"><ArrowUpRight className="w-3 h-3" /> จัดส่งแล้ว</span>;
      case 'completed': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3" /> สำเร็จ</span>;
      default: return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 w-max">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-[calc(100vh-64px)] space-y-6">
      
      {/* 🔴 Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-teal-600" />
            ระบบจัดการบิลและบัญชี
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">ภาพรวมการเงิน, ใบกำกับภาษี และเอกสารใบสั่งซื้อ</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-bold transition-all text-sm">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* 🔴 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* รายรับรวม */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-6 rounded-2xl border border-teal-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-teal-800 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> ยอดรับชำระแล้วรวม
            </p>
            <h3 className="text-3xl sm:text-4xl font-black text-teal-950">฿{totalRevenue.toLocaleString()}</h3>
          </div>
          <DollarSign className="absolute -bottom-4 -right-4 w-32 h-32 text-teal-200/50 transform -rotate-12" />
        </div>

        {/* จำนวนบิล */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-gray-400" /> บิลที่ออกแล้ว (Invoice)
          </p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900">{totalInvoices}</h3>
            <span className="text-gray-500 font-medium mb-1">รายการ</span>
          </div>
        </div>

        {/* รอดำเนินการภาษี */}
        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-center">
          <p className="text-orange-800 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-orange-600" /> รอออกใบกำกับภาษี
          </p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl sm:text-4xl font-black text-orange-600">{taxRequests}</h3>
            <span className="text-orange-700 font-medium mb-1">รายการ</span>
          </div>
        </div>
      </div>

      {/* 🔴 Controls: Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="ค้นหาเลขบิล (INV-), ชื่อลูกค้า, รหัสออเดอร์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-500" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-auto bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block px-3 py-2.5 outline-none font-medium"
          >
            <option value="all">รายการบิลทั้งหมด</option>
            <option value="tax_pending">รอออกใบกำกับภาษีเต็มรูป</option>
            <option value="completed">ออเดอร์จัดส่งสำเร็จแล้ว</option>
          </select>
        </div>
      </div>

      {/* 🔴 Table List */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        {isLoading ? (
           <div className="flex flex-col justify-center items-center py-20">
             <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-4" />
             <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลบัญชี...</p>
           </div>
        ) : filteredOrders.length === 0 ? (
           <div className="text-center py-20">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                <Receipt className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-bold text-lg mb-1">ไม่พบรายการบิล</p>
              <p className="text-gray-500 text-sm">ยังไม่มีรายการสั่งซื้อที่ชำระเงินแล้ว หรือไม่พบข้อมูลที่ค้นหา</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">วัน/เวลา</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">เลขที่เอกสาร (INV)</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">ยอดสุทธิ</th>
                  <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {(order.paymentVerifiedAt || order.createdAt)?.toDate().toLocaleDateString('th-TH', {
                        year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-teal-700">{order.invoiceId || 'รอดำเนินการ'}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">Ref: {order.id.slice(-8).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-gray-900">{order.shippingAddress?.fullName || 'N/A'}</div>
                        {order.taxInvoice && (
                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${order.taxInvoiceStatus === 'issued' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`} title="ขอใบกำกับภาษี">
                             TAX
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-black text-gray-900">฿{order.totals?.netTotal?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(order.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 text-gray-500 hover:text-teal-600 bg-gray-50 hover:bg-teal-50 rounded-lg border border-gray-200 transition-colors" title="ดูรายละเอียดบิล">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-lg border border-gray-200 transition-colors" title="พิมพ์ใบเสร็จ">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default BillingMain;