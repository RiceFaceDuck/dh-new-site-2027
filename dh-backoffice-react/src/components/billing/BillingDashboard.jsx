import React, { useState, useEffect } from 'react';
import { billingService } from '../../firebase/billingService';
import { claimService } from '../../firebase/claimService'; 
import { driveService } from '../../firebase/driveService'; 
import { auth } from '../../firebase/config'; 
import { 
    Search, Plus, Receipt, CheckCircle2, Clock, Eye, X, QrCode, 
    Printer, Wrench, ArrowLeftRight, Loader2, Calendar, Truck, 
    Store, MapPin, Phone, FileEdit, UploadCloud, Ban 
} from 'lucide-react'; 

// ✨ นำเข้า ReceiptTemplate เข้ามาเพื่อรับหน้าที่ปริ้นท์เพียงผู้เดียว
import ReceiptTemplate from './pos/ReceiptTemplate';

export default function BillingDashboard({ onSwitchView, onResumeDraft }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); 
    const [searchQuery, setSearchQuery] = useState('');
    
    const [limitAmount, setLimitAmount] = useState(25); 
    
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [expandedItemIdx, setExpandedItemIdx] = useState(null);
    
    // ✨ State สำหรับเปิดหน้าจอพิมพ์บิลกลาง
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    
    // ✨ State สำหรับระบบยกเลิกบิล (Void)
    const [isVoiding, setIsVoiding] = useState(false);

    const [serviceModal, setServiceModal] = useState(null); 
    const [isSubmittingService, setIsSubmittingService] = useState(false);
    const [isUploading, setIsUploading] = useState(false); 
    const [serviceForm, setServiceForm] = useState({
        transactionId: '', 
        timestamp: '', 
        customerInfo: '', 
        productInfo: '', 
        actionType: '', 
        warrantyDate: '', 
        reasonCode: '', 
        details: '', 
        inspectorName: '', 
        currentStatus: '', 
        tracking: '', 
        images: [], 
        qty: 1
    });

    useEffect(() => {
        const unsubscribe = billingService.subscribeRecentOrders(limitAmount, (data) => {
            setOrders(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [limitAmount]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                document.getElementById('search-bill-input')?.focus();
            }
            if (e.ctrlKey && e.key === 'p' && selectedOrder) {
                e.preventDefault();
                setShowPrintPreview(true); 
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedOrder]);

    const filteredOrders = orders.filter(o => {
        const matchesFilter = filter === 'All' || 
            (filter === 'Paid' && (o.paymentStatus === 'Paid' || o.orderStatus === 'Paid')) || 
            (filter === 'Draft' && (o.paymentStatus === 'Unpaid' || o.orderStatus === 'Pending' || o.orderStatus === 'waiting_payment' || o.orderStatus === 'waiting_verification'));
        
        const matchesSearch = o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (o.customer?.accountName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (o.customer?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase());
                              
        return matchesFilter && matchesSearch;
    });

    const handleCloseModal = () => {
        setSelectedOrder(null);
        setExpandedItemIdx(null); 
    };

    const handleVoidOrder = async () => {
        if (!selectedOrder) return;
        if (selectedOrder.orderStatus === 'Cancelled') {
            alert('บิลนี้ถูกยกเลิกไปแล้ว ไม่สามารถยกเลิกซ้ำได้');
            return;
        }
        
        const isPaid = selectedOrder.paymentStatus === 'Paid' || selectedOrder.orderStatus === 'Paid';
        const confirmMsg = isPaid 
            ? `⚠️ ยืนยันการยกเลิกบิล ${selectedOrder.orderId} ใช่หรือไม่?\n\nระบบจะดำเนินการอัตโนมัติ:\n1. คืนสต็อกสินค้าทั้งหมด\n2. คืนยอดเงินสุทธิเข้า Wallet\n3. หักแต้ม Credit Points คืนจากลูกค้า\n4. ปรับลดยอดขายประจำวัน\n\n* การกระทำนี้ไม่สามารถย้อนกลับได้`
            : `⚠️ ยืนยันการยกเลิกบิลร่าง ${selectedOrder.orderId} ใช่หรือไม่?\n(ระบบจะล้างยอดบิล และคืนเงิน Wallet หากมีการหักไว้ล่วงหน้า)`;
            
        if (!window.confirm(confirmMsg)) return;

        setIsVoiding(true);
        try {
            await billingService.updateOrderStatus(selectedOrder.id, 'Cancelled', selectedOrder.orderStatus, auth.currentUser?.uid || 'System');
            alert(`✅ ยกเลิกบิล ${selectedOrder.orderId} สำเร็จ!\nระบบจัดการคืนสต็อกและปรับปรุงยอดเงินเรียบร้อยแล้ว`);
            handleCloseModal(); 
        } catch (error) {
            alert(`❌ เกิดข้อผิดพลาดในการยกเลิกบิล: ${error.message}`);
        } finally {
            setIsVoiding(false);
        }
    };

    const openServiceModal = (actionType, item) => {
        const orderDate = selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate() : new Date();
        const dateStr = orderDate.toISOString().split('T')[0];
        const defaultAction = actionType === 'claim' ? 'เคลมสินค้า' : 'คืนสินค้า (เสีย) คืนเงิน ค้างยอด';
        
        setServiceModal({ type: actionType, item: item });
        setServiceForm({
            transactionId: `DH-${Math.random().toString(16).substr(2, 8)}`,
            timestamp: new Date().toLocaleString('th-TH'),
            customerInfo: `${selectedOrder.customer?.accountName || 'ลูกค้าทั่วไป'} / ${selectedOrder.customer?.phone || '-'}`,
            productInfo: `${item.name} (SKU: ${item.sku})`,
            actionType: defaultAction,
            warrantyDate: dateStr,
            reasonCode: '', 
            details: '', 
            inspectorName: auth.currentUser?.displayName || auth.currentUser?.email || '', 
            currentStatus: 'รอตรวจสอบสินค้า/รอคืนสินค้า', 
            tracking: '', 
            images: [], 
            qty: 1
        });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setIsUploading(true);
        try {
            const uploadedUrls = await Promise.all(files.map(file => driveService.uploadImage(file)));
            setServiceForm(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
        } catch (error) { 
            alert('อัพโหลดภาพล้มเหลว: ' + error.message); 
        } finally { 
            setIsUploading(false); 
        }
    };

    const handleRemoveImage = (indexToRemove) => {
        setServiceForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== indexToRemove) }));
    };

    const handleSubmitService = async (e) => {
        e.preventDefault();
        if (serviceForm.qty < 1 || serviceForm.qty > serviceModal.item.qty) return alert('ระบุจำนวนไม่ถูกต้อง');
        if (!serviceForm.reasonCode) return alert('กรุณาระบุ สาเหตุ / อาการ');

        setIsSubmittingService(true);
        try {
            const billData = { 
                id: selectedOrder.id, 
                orderId: selectedOrder.orderId, 
                customer: selectedOrder.customer, 
                createdAt: selectedOrder.createdAt 
            };
            const userName = auth.currentUser?.displayName || auth.currentUser?.email;

            if (serviceModal.type === 'claim') {
                await claimService.requestClaim(billData, serviceModal.item, serviceForm, auth.currentUser?.uid, userName);
                alert('✅ ส่งเรื่องแจ้งเคลมสินค้าเรียบร้อย รอผู้จัดการยืนยัน!');
            } else {
                await claimService.requestReturn(billData, serviceModal.item, serviceForm, auth.currentUser?.uid, userName);
                alert('✅ ส่งเรื่องแจ้งคืนสินค้าเรียบร้อย รอผู้จัดการยืนยัน!');
            }
            setServiceModal(null); 
            setExpandedItemIdx(null);
        } catch (err) { 
            alert('❌ เกิดข้อผิดพลาด: ' + err.message); 
        } finally { 
            setIsSubmittingService(false); 
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--dh-bg-base)] p-4 lg:p-6 relative overflow-hidden font-sans transition-colors duration-300">
            <div className="flex flex-col h-full bg-[var(--dh-bg-surface)] rounded-2xl shadow-[0_8px_30px_var(--dh-shadow-color)] border border-[var(--dh-border)] overflow-hidden transition-all duration-300">
                
                {/* 🏷️ Header Area */}
                <div className="p-5 pb-0 relative z-10">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--dh-accent-light)] text-[var(--dh-accent)] rounded-xl shadow-inner">
                                <Receipt size={26} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-[var(--dh-text-main)] tracking-tight leading-none">รายการบิล (Orders)</h1>
                                <p className="text-[13px] text-[var(--dh-text-muted)] mt-1.5 font-bold uppercase tracking-wider">จัดการและตรวจสอบบิลการขาย</p>
                            </div>
                        </div>
                        <button onClick={onSwitchView} className="px-6 py-3 bg-[var(--dh-accent)] hover:bg-[var(--dh-accent-hover)] text-white font-black rounded-xl flex items-center gap-2 transition-all duration-300 hover:shadow-[0_4px_15px_var(--dh-accent-light)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-sm">
                            <Plus size={20} strokeWidth={3} /> สร้างบิลใหม่
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-[var(--dh-border)] pb-5">
                        <div className="flex bg-[var(--dh-bg-base)] rounded-xl p-1 border border-[var(--dh-border)] w-full sm:w-auto shadow-inner">
                            {['All', 'Paid', 'Draft'].map(f => (
                                <button 
                                    key={f} 
                                    onClick={() => setFilter(f)} 
                                    className={`flex-1 sm:flex-none px-6 py-2 text-[13px] font-black rounded-lg transition-all duration-300 ${filter === f ? 'bg-[var(--dh-text-main)] text-[var(--dh-bg-surface)] shadow-md transform scale-100' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] hover:bg-[var(--dh-bg-surface)]/50 transform scale-95 hover:scale-100'}`}
                                >
                                    {f === 'All' ? 'ทั้งหมด' : f === 'Paid' ? 'ชำระแล้ว' : 'บิลร่าง'}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full sm:w-[380px] group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--dh-text-muted)] group-focus-within:text-[var(--dh-accent)] transition-colors duration-300" size={18} strokeWidth={2.5}/>
                            <input 
                                id="search-bill-input" 
                                type="text" 
                                placeholder="พิมพ์ค้นหาเลขบิล, ชื่อลูกค้า..." 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                className="w-full pl-10 pr-10 py-2.5 bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-xl text-sm outline-none focus:border-[var(--dh-accent)] focus:ring-2 focus:ring-[var(--dh-accent-light)] transition-all duration-300 text-[var(--dh-text-main)] placeholder-[var(--dh-text-muted)] font-bold shadow-inner" 
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <span className="hidden sm:inline-flex items-center justify-center px-2 py-1 border border-[var(--dh-border)] rounded-md text-[10px] font-black text-[var(--dh-text-muted)] bg-[var(--dh-bg-surface)] shadow-sm">/</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 📊 Data Table */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0 bg-[var(--dh-bg-surface)]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--dh-bg-surface)] sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
                            <tr className="border-b-2 border-[var(--dh-border)] shadow-sm">
                                <th className="py-4 px-6 text-[11px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest w-[25%]">เลขที่บิล / วันที่</th>
                                <th className="py-4 px-4 text-[11px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest text-center w-[12%]">สถานะ</th>
                                <th className="py-4 px-4 text-[11px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest w-[30%]">ชื่อร้าน / ลูกค้า</th>
                                <th className="py-4 px-4 text-[11px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest w-[18%]">การจัดส่ง</th>
                                <th className="py-4 px-6 text-[11px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest text-right w-[15%]">ยอดสุทธิ (NET)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && orders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center text-[var(--dh-text-muted)] font-bold">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <Loader2 className="animate-spin text-[var(--dh-accent)]" size={40}/>
                                            <span className="animate-pulse tracking-wide">กำลังเตรียมข้อมูล...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr key="not-found">
                                    <td colSpan="5" className="p-16 text-center text-[var(--dh-text-muted)]">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-16 h-16 bg-[var(--dh-bg-base)] rounded-full flex items-center justify-center shadow-inner">
                                                <Search className="opacity-40" size={32}/>
                                            </div>
                                            <div className="text-center">
                                                <span className="font-black text-lg block">ไม่พบข้อมูลบิล</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {filteredOrders.map(order => {
                                        const isPaid = order.paymentStatus === 'Paid' || order.orderStatus === 'Paid';
                                        const fulfillment = order.fulfillmentType || 'StorePickup'; 
                                        const shippingName = order.shippingMethod || order.courier || 'จัดส่งเอกชน';

                                        return (
                                        <tr 
                                            key={order.id} 
                                            onClick={() => setSelectedOrder(order)} 
                                            className="group cursor-pointer border-b border-[var(--dh-border)] last:border-0 hover:bg-[var(--dh-bg-base)] transition-all duration-300 relative z-0 hover:z-10 hover:shadow-[0_0_20px_var(--dh-shadow-color)]"
                                        >
                                            <td className="py-4 px-6 align-middle relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--dh-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="flex items-center gap-2.5 mb-1.5">
                                                    <div className="flex items-center gap-2 text-[14px] font-black text-[var(--dh-text-main)] group-hover:text-[var(--dh-accent)] transition-colors">
                                                        <Receipt size={16} className="text-[var(--dh-text-muted)] group-hover:text-[var(--dh-accent)] transition-colors" strokeWidth={2.5}/>
                                                        <span className={order.orderStatus === 'Cancelled' ? 'line-through opacity-70' : ''}>
                                                            {order.orderId}
                                                        </span>
                                                    </div>
                                                    <Eye size={16} className="text-[var(--dh-accent)] opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0"/>
                                                </div>
                                                <div className="text-[11px] text-[var(--dh-text-muted)] font-bold flex items-center gap-1.5 ml-6">
                                                    <Calendar size={12} className="opacity-60"/>
                                                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center align-middle">
                                                {order.orderStatus === 'Cancelled' ? (
                                                    <span className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-600 text-[11px] font-black border border-rose-500/20 shadow-sm">
                                                        <Ban size={14} strokeWidth={2.5} /> ยกเลิกแล้ว
                                                    </span>
                                                ) : isPaid ? (
                                                    <span className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-black border border-emerald-500/20 shadow-sm">
                                                        <CheckCircle2 size={14} strokeWidth={2.5} /> ชำระเงินเรียบร้อย
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-orange-600 text-[11px] font-black border border-orange-500/20 shadow-sm">
                                                        <Clock size={14} strokeWidth={2.5} /> รอดำเนินการ
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 align-middle">
                                                <div className="font-black text-[var(--dh-text-main)] text-[14px] truncate max-w-[280px] group-hover:text-[var(--dh-accent)] transition-colors">
                                                    {order.customer?.accountName || order.customer?.firstName || 'ลูกค้าทั่วไป'}
                                                </div>
                                                {order.customer?.phone && (
                                                    <div className="text-[12px] text-[var(--dh-text-muted)] mt-1.5 flex items-center gap-1.5 font-mono font-bold">
                                                        <Phone size={12} className="opacity-70"/>
                                                        {order.customer.phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 align-middle">
                                                <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--dh-text-main)]">
                                                    {fulfillment === 'Delivery' ? (
                                                        <>
                                                            <div className="p-1.5 bg-blue-500/10 rounded-md">
                                                                <Truck size={14} className="text-blue-500"/>
                                                            </div> 
                                                            ส่งพัสดุ 
                                                            <span className="text-[10px] text-[var(--dh-text-muted)]">({shippingName})</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="p-1.5 bg-purple-500/10 rounded-md">
                                                                <Store size={14} className="text-purple-500"/>
                                                            </div> 
                                                            รับหน้าร้าน
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right align-middle">
                                                <span className={`font-black text-[16px] transition-colors ${order.orderStatus === 'Cancelled' ? 'text-[var(--dh-text-muted)] line-through' : 'text-[var(--dh-text-main)] group-hover:text-[var(--dh-accent)]'}`}>
                                                    ฿{order.netTotal?.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) || 0}
                                                </span>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                    {orders.length >= limitAmount && (
                                        <tr key="load-more">
                                            <td colSpan="5" className="py-5 text-center bg-[var(--dh-bg-base)]/50 border-t border-[var(--dh-border)]">
                                                <button 
                                                    onClick={() => setLimitAmount(prev => prev + 25)} 
                                                    className="px-5 py-2.5 bg-[var(--dh-bg-surface)] border border-[var(--dh-border)] hover:border-[var(--dh-accent)] text-[var(--dh-text-main)] hover:text-[var(--dh-accent)] rounded-xl text-xs font-black shadow-sm transition-all inline-flex items-center gap-2 active:scale-95"
                                                >
                                                    <Search size={14} strokeWidth={3}/> โหลดบิลเก่าเพิ่มเติม... (กำลังแสดง {limitAmount} รายการล่าสุด)
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal ดูรายละเอียดออเดอร์ */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[var(--dh-bg-surface)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative text-[var(--dh-text-main)] border border-[var(--dh-border)] animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-5 border-b border-[var(--dh-border)] flex justify-between items-center bg-[var(--dh-bg-base)] shrink-0 relative z-10 flex-wrap gap-3">
                            <h3 className="font-black text-xl flex items-center gap-2">
                                <Receipt size={22} className="text-[var(--dh-accent)]"/> 
                                รายละเอียดบิล
                                {selectedOrder.orderStatus === 'Cancelled' && (
                                    <span className="ml-2 text-xs font-black bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-1 rounded-md">
                                        VOIDED
                                    </span>
                                )}
                            </h3>
                            <div className="flex gap-2">
                                {selectedOrder.orderStatus !== 'Cancelled' && (
                                    <button 
                                        onClick={handleVoidOrder} 
                                        disabled={isVoiding} 
                                        className="flex items-center gap-1.5 text-rose-500 hover:text-white font-black px-4 py-2.5 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-600 rounded-xl transition-all text-sm shadow-sm active:scale-95 disabled:opacity-50"
                                    >
                                        {isVoiding ? <Loader2 size={16} className="animate-spin"/> : <Ban size={16} strokeWidth={2.5}/>} 
                                        <span className="hidden sm:inline">ยกเลิกบิล</span>
                                    </button>
                                )}
                                {selectedOrder.orderStatus !== 'Cancelled' && (
                                    <button 
                                        onClick={() => { handleCloseModal(); if (onResumeDraft) onResumeDraft(selectedOrder); }} 
                                        className="flex items-center gap-1.5 text-white font-black px-4 py-2.5 bg-[var(--dh-accent)] hover:bg-[var(--dh-accent-hover)] rounded-xl shadow-md transition-all active:scale-95 text-sm"
                                    >
                                        <FileEdit size={16} strokeWidth={2.5}/> 
                                        <span className="hidden sm:inline">แก้ไขบิล</span>
                                    </button>
                                )}
                                <button 
                                    onClick={() => setShowPrintPreview(true)} 
                                    className="flex items-center gap-1.5 text-[var(--dh-text-main)] hover:text-blue-600 font-black px-4 py-2.5 bg-transparent hover:bg-blue-500/10 border border-[var(--dh-border)] hover:border-blue-500/30 rounded-xl transition-all text-sm group"
                                >
                                    <Printer size={16} className="text-[var(--dh-text-muted)] group-hover:text-blue-500"/> 
                                    <span className="hidden sm:inline">พิมพ์บิล</span>
                                </button>
                                <button 
                                    onClick={handleCloseModal} 
                                    className="text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] p-2.5 hover:bg-[var(--dh-bg-surface)] border border-transparent hover:border-[var(--dh-border)] rounded-xl transition-all"
                                >
                                    <X size={22} strokeWidth={2.5}/>
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[var(--dh-bg-base)] custom-scrollbar">
                            <div className="bg-[var(--dh-bg-surface)] max-w-2xl mx-auto rounded-xl p-6 md:p-10 border border-[var(--dh-border)] shadow-sm relative">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--dh-border)]">
                                    <div className="flex items-center gap-4">
                                        <img src="/dh-logo.png" alt="DH" className="h-12 object-contain" onError={(e) => e.target.style.display='none'} />
                                        <div>
                                            <h1 className="text-lg font-black text-[var(--dh-text-main)] leading-tight">บริษัท ดีเอช โน๊ตบุ๊ค จำกัด</h1>
                                            <p className="text-[11px] text-[var(--dh-text-muted)] font-bold mt-0.5">dhnotebook.com | Line: @dhnotebook | โทร. 087-5153122</p>
                                        </div>
                                    </div>
                                    <div className="border-2 border-[var(--dh-text-main)] rounded-lg px-4 py-1.5">
                                        <h2 className="text-xs font-black tracking-widest text-[var(--dh-text-main)] uppercase">รายการออเดอร์</h2>
                                    </div>
                                </div>
                                
                                {selectedOrder.orderStatus === 'Cancelled' ? (
                                    <div className="text-center text-rose-600 font-black text-sm mb-6 border-2 border-rose-500/30 bg-rose-500/10 py-2 rounded-xl tracking-wide">
                                        *** บิลนี้ถูกยกเลิกไปแล้ว (VOIDED) ***
                                    </div>
                                ) : selectedOrder.paymentStatus !== 'Paid' && selectedOrder.orderStatus !== 'Paid' && (
                                    <div className="text-center text-orange-600 font-black text-sm mb-6 border-2 border-orange-500/30 bg-orange-500/10 py-2 rounded-xl tracking-wide">
                                        *** บิลฉบับร่าง (DRAFT) - ยังไม่ได้ชำระเงิน ***
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 text-sm">
                                    <div className="bg-[var(--dh-bg-base)] p-5 rounded-xl border border-[var(--dh-border)]">
                                        <p className="text-[10px] text-[var(--dh-text-muted)] font-black mb-1.5 uppercase tracking-widest">ชื่อร้าน / ลูกค้า</p>
                                        <p className="text-lg font-black text-[var(--dh-text-main)] leading-snug">
                                            {selectedOrder.customer?.accountName || selectedOrder.customer?.firstName || 'ลูกค้าทั่วไป'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Phone size={14} className="text-[var(--dh-text-muted)]"/>
                                            <p className="text-sm font-bold text-[var(--dh-text-main)] opacity-80 font-mono">
                                                {(!selectedOrder.customer?.hidePhone && selectedOrder.customer?.phone) ? selectedOrder.customer.phone : '-'}
                                            </p>
                                        </div>
                                        {(selectedOrder.receiptFormat === 'full' && selectedOrder.customer?.address) && (
                                            <p className="text-[11px] font-bold text-[var(--dh-text-muted)] mt-3 flex items-start gap-1.5">
                                                <MapPin size={14} className="shrink-0 mt-0.5"/> 
                                                <span className="leading-relaxed">{selectedOrder.customer.address}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className={`p-4 rounded-xl border-2 flex flex-col justify-center items-center text-center h-full ${(selectedOrder.fulfillmentType || 'StorePickup') === 'Delivery' ? 'border-blue-500/30 bg-blue-500/10' : 'border-purple-500/30 bg-purple-500/10'}`}>
                                            <span className="text-[10px] font-black uppercase tracking-widest mb-2 text-[var(--dh-text-muted)]">ช่องทางการจัดส่ง</span>
                                            <div className="text-xl font-black uppercase tracking-tight flex items-center justify-center gap-2">
                                                {(selectedOrder.fulfillmentType || 'StorePickup') === 'Delivery' ? <Truck size={24} className="text-blue-500"/> : <Store size={24} className="text-purple-500"/>}
                                                <span className={(selectedOrder.fulfillmentType || 'StorePickup') === 'Delivery' ? 'text-blue-600' : 'text-purple-600'}>
                                                    {(selectedOrder.fulfillmentType || 'StorePickup') === 'Delivery' ? `จัดส่งพัสดุ (${selectedOrder.shippingMethod || selectedOrder.courier || '-'})` : 'รับหน้าร้าน'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center px-3 bg-[var(--dh-bg-base)] rounded-lg p-2.5 border border-[var(--dh-border)]">
                                            <div className="text-[11px] text-[var(--dh-text-main)] font-bold">
                                                <span className="text-[var(--dh-text-muted)] uppercase tracking-widest mr-1">Date:</span> 
                                                {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleDateString('th-TH') : 'N/A'}
                                            </div>
                                            <div className="text-[11px] text-[var(--dh-text-main)] font-bold">
                                                <span className="text-[var(--dh-text-muted)] uppercase tracking-widest mr-1">Ref:</span> 
                                                {selectedOrder.orderId}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <table className="w-full text-sm mb-8 border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-[var(--dh-text-main)] text-[var(--dh-text-main)] bg-transparent">
                                            <th className="py-3 text-center w-10 font-black">#</th>
                                            <th className="py-3 text-left pl-2 font-black">รายการสินค้า</th>
                                            <th className="py-3 text-center w-16 font-black">จน.</th>
                                            <th className="py-3 text-right w-24 font-black">หน่วยละ</th>
                                            <th className="py-3 text-right w-28 pr-2 font-black">รวมเงิน</th>
                                        </tr>
                                    </thead>
                                    <tbody className="border-b-2 border-[var(--dh-text-main)]">
                                        {selectedOrder.items?.map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                <tr 
                                                    onClick={() => { if (selectedOrder.paymentStatus === 'Paid' || selectedOrder.orderStatus === 'Paid') setExpandedItemIdx(expandedItemIdx === idx ? null : idx); }} 
                                                    className={`border-b border-[var(--dh-border)] last:border-0 align-top transition-colors group ${selectedOrder.paymentStatus === 'Paid' || selectedOrder.orderStatus === 'Paid' ? 'cursor-pointer hover:bg-[var(--dh-bg-base)]' : ''} ${expandedItemIdx === idx ? 'bg-[var(--dh-bg-base)]' : ''}`}
                                                >
                                                    <td className="py-4 text-center text-[var(--dh-text-muted)] font-bold">{idx + 1}</td>
                                                    <td className="py-4 pl-2">
                                                        <div className={`font-black text-[var(--dh-text-main)] transition-colors ${selectedOrder.paymentStatus === 'Paid' || selectedOrder.orderStatus === 'Paid' ? 'group-hover:text-[var(--dh-accent)]' : ''}`}>
                                                            {item.name}
                                                        </div>
                                                        <div className="text-[11px] text-[var(--dh-text-muted)] font-bold font-mono mt-0.5">
                                                            {item.sku}
                                                        </div>
                                                        {item.note && (
                                                            <div className="text-[11px] font-bold text-[var(--dh-accent)] mt-1.5 bg-[var(--dh-accent-light)] inline-block px-2 py-0.5 rounded border border-[var(--dh-accent)]/20">
                                                                Note: {item.note}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-4 text-center font-black text-[var(--dh-text-main)]">{item.qty}</td>
                                                    <td className="py-4 text-right font-bold opacity-80">
                                                        {(Number(item.price) - Number(item.discount || 0)).toLocaleString()}
                                                    </td>
                                                    <td className="py-4 text-right font-black text-[var(--dh-text-main)] pr-2">
                                                        {((Number(item.price) - Number(item.discount || 0)) * item.qty).toLocaleString()}
                                                    </td>
                                                </tr>
                                                
                                                {/* เมนูการเคลม และ คืนสินค้า เมื่อขยายแถว */}
                                                {expandedItemIdx === idx && (selectedOrder.paymentStatus === 'Paid' || selectedOrder.orderStatus === 'Paid') && selectedOrder.orderStatus !== 'Cancelled' && (
                                                    <tr className="bg-[var(--dh-bg-base)] border-b border-[var(--dh-border)]">
                                                        <td colSpan="5" className="p-4 lg:pl-16">
                                                            <div className="flex flex-wrap gap-3 items-center bg-[var(--dh-bg-surface)] p-3.5 rounded-2xl border border-[var(--dh-border)] shadow-sm animate-in slide-in-from-top-2">
                                                                <span className="text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest bg-[var(--dh-bg-base)] px-2.5 py-1 rounded-md">
                                                                    บริการหลังการขาย
                                                                </span>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); openServiceModal('claim', item); }} 
                                                                    className="px-5 py-2.5 bg-[var(--dh-bg-base)] text-orange-600 hover:bg-orange-500 hover:text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all border border-orange-500/30 shadow-sm"
                                                                >
                                                                    <Wrench size={16}/> แจ้งเคลมสินค้า
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); openServiceModal('return', item); }} 
                                                                    className="px-5 py-2.5 bg-[var(--dh-bg-base)] text-purple-600 hover:bg-purple-600 hover:text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all border border-purple-500/30 shadow-sm"
                                                                >
                                                                    <ArrowLeftRight size={16}/> แจ้งคืนสินค้า/เงิน
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>

                                {/* สรุปยอดเงิน */}
                                <div className="flex flex-col sm:flex-row justify-between items-start text-sm mt-6 gap-6">
                                    <div className="w-[120px] shrink-0 flex flex-col items-center justify-center border border-[var(--dh-border)] rounded-2xl p-3 bg-[var(--dh-bg-base)]">
                                        <QrCode size={64} strokeWidth={1.5} className="text-[var(--dh-text-main)] mb-2" />
                                        <span className="text-[9px] text-[var(--dh-text-muted)] font-black text-center leading-tight tracking-widest">
                                            SCAN TO VERIFY<br/>
                                            <span className="opacity-70 font-mono mt-1 block">REF:{selectedOrder.orderId.slice(-5)}</span>
                                        </span>
                                    </div>
                                    <div className="flex-1 w-full bg-[var(--dh-bg-base)] p-5 rounded-2xl border border-[var(--dh-border)] space-y-2 text-[var(--dh-text-main)]">
                                        <div className="flex justify-between font-bold opacity-80">
                                            <span>รวมเป็นเงิน:</span> 
                                            <span>{(selectedOrder.subTotal || 0).toLocaleString()}</span>
                                        </div>
                                        {selectedOrder.overallDiscount > 0 && (
                                            <div className="flex justify-between text-rose-500 font-black">
                                                <span>ส่วนลด {selectedOrder.appliedPromotion && <span className="text-[10px] font-bold">({selectedOrder.appliedPromotion.title})</span>}:</span> 
                                                <span>-{(selectedOrder.overallDiscount || 0).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {selectedOrder.shippingFee > 0 && (
                                            <div className="flex justify-between font-bold opacity-80">
                                                <span>ค่าจัดส่ง:</span> 
                                                <span>{(selectedOrder.shippingFee || 0).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {selectedOrder.vatAmount > 0 && (
                                            <div className="flex justify-between text-emerald-500 font-black">
                                                <span>ภาษี (VAT 7%):</span> 
                                                <span>{(selectedOrder.vatAmount || 0).toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-black text-2xl pt-4 border-t-2 border-[var(--dh-text-main)] mt-4">
                                            <span>ยอดสุทธิ (NET):</span> 
                                            <span className={selectedOrder.orderStatus === 'Cancelled' ? 'line-through text-[var(--dh-text-muted)]' : ''}>
                                                {(selectedOrder.netTotal || 0).toLocaleString()} บาท
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-[var(--dh-bg-base)] text-[var(--dh-text-main)] p-3 rounded-xl text-center mt-6 font-black text-sm tracking-wide shadow-inner">
                                    ({selectedOrder.thaiBahtText || 'ศูนย์บาทถ้วน'})
                                </div>
                                
                                {selectedOrder.billNote && (
                                    <div className="mt-6 text-sm bg-orange-500/10 p-4 rounded-xl border border-orange-500/20 text-[var(--dh-text-main)]">
                                        <span className="font-black text-orange-600 underline decoration-orange-500/40 underline-offset-4 mr-2">หมายเหตุเพิ่มเติม:</span> 
                                        <span className="font-bold">{selectedOrder.billNote}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* พิมพ์ใบเสร็จ */}
            {showPrintPreview && selectedOrder && <ReceiptTemplate orderData={selectedOrder} onClose={() => setShowPrintPreview(false)} />}

            {/* Modal แจ้งซ่อม/เคลม/คืน */}
            {serviceModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[var(--dh-bg-surface)] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh] border border-[var(--dh-border)] text-[var(--dh-text-main)] animate-in zoom-in-95 duration-300">
                        <div className="p-5 border-b border-[var(--dh-border)] flex justify-between items-center bg-[var(--dh-bg-base)] shrink-0">
                            <h3 className="font-black text-lg flex items-center gap-2">
                                <div className="p-2 bg-[var(--dh-bg-surface)] rounded-lg shadow-sm border border-[var(--dh-border)]">
                                    <Wrench size={18} className="text-[var(--dh-accent)]"/>
                                </div>
                                DATA เคลม Form
                            </h3>
                            <button onClick={() => setServiceModal(null)} className="p-2 text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] hover:bg-[var(--dh-bg-surface)] rounded-xl transition-colors">
                                <X size={20} strokeWidth={2.5}/>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[11px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest mb-1.5 block">เลขธุรกรรม</label>
                                    <input type="text" value={serviceForm.transactionId} readOnly className="w-full p-3 rounded-xl border border-[var(--dh-border)] bg-[var(--dh-bg-base)] opacity-70 text-sm outline-none font-mono font-bold shadow-inner" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest mb-1.5 block">ประทับเวลา</label>
                                    <input type="text" value={serviceForm.timestamp} readOnly className="w-full p-3 rounded-xl border border-[var(--dh-border)] bg-[var(--dh-bg-base)] opacity-70 text-sm outline-none font-bold shadow-inner" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest mb-1.5 block">ชื่อร้าน / เบอร์โทร</label>
                                <input type="text" value={serviceForm.customerInfo} readOnly className="w-full p-3 rounded-xl border border-[var(--dh-border)] bg-[var(--dh-bg-base)] opacity-70 text-sm outline-none font-bold shadow-inner" />
                            </div>
                            <div className="flex gap-5">
                                <div className="flex-1">
                                    <label className="text-[11px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest mb-1.5 block">ชื่อสินค้า / SKU</label>
                                    <input type="text" value={serviceForm.productInfo} readOnly className="w-full p-3 rounded-xl border border-[var(--dh-border)] bg-[var(--dh-bg-base)] opacity-70 text-sm outline-none font-bold shadow-inner" />
                                </div>
                                <div className="w-32 shrink-0">
                                    <label className="text-[11px] font-black uppercase tracking-widest mb-1.5 block">จำนวน <span className="text-rose-500">*</span></label>
                                    <input type="number" min="1" max={serviceModal.item.qty} value={serviceForm.qty} onChange={e => setServiceForm({...serviceForm, qty: Number(e.target.value)})} className="w-full p-3 rounded-xl border border-[var(--dh-border)] focus:border-[var(--dh-accent)] focus:ring-4 focus:ring-[var(--dh-accent-light)] outline-none text-sm text-center font-black bg-transparent transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest mb-1.5 block">การกระทำ</label>
                                <select value={serviceForm.actionType} onChange={e => setServiceForm({...serviceForm, actionType: e.target.value})} className="w-full p-3 rounded-xl border border-[var(--dh-border)] focus:border-[var(--dh-accent)] focus:ring-4 focus:ring-[var(--dh-accent-light)] outline-none text-sm font-bold bg-[var(--dh-bg-base)] cursor-pointer transition-all">
                                    <option value="เคลมสินค้า">เคลมสินค้า</option>
                                    <option value="คืนสินค้า (เสีย) คืนเงิน ค้างยอด">คืนสินค้า (เสีย) คืนเงิน ค้างยอด</option>
                                    <option value="ยังไม่ได้ขาย (เสียที่บริษัท)">ยังไม่ได้ขาย (เสียที่บริษัท)</option>
                                    <option value="เปลี่ยนสินค้า (เสีย)">เปลี่ยนสินค้า (เสีย)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest mb-1.5 block">วอยประกัน / วันที่ซื้อ <span className="text-rose-500">*</span></label>
                                <input type="date" value={serviceForm.warrantyDate} onChange={e => setServiceForm({...serviceForm, warrantyDate: e.target.value})} className="w-full p-3 rounded-xl border border-[var(--dh-border)] focus:border-[var(--dh-accent)] focus:ring-4 focus:ring-[var(--dh-accent-light)] outline-none text-sm font-bold bg-transparent cursor-pointer transition-all" required />
                            </div>
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest mb-1.5 block">สาเหตุ / อาการ <span className="text-rose-500">*</span></label>
                                <select value={serviceForm.reasonCode} onChange={e => setServiceForm({...serviceForm, reasonCode: e.target.value})} className="w-full p-3 rounded-xl border border-[var(--dh-border)] focus:border-[var(--dh-accent)] focus:ring-4 focus:ring-[var(--dh-accent-light)] outline-none text-sm font-bold bg-[var(--dh-bg-base)] cursor-pointer transition-all" required>
                                    <option value="" disabled>เลือกสาเหตุ...</option>
                                    <option value="(E) สินค้า ไม่ตรงปก / ผิดสเป็ค / การผลิตผิดพลาด">(E) สินค้า ไม่ตรงปก / ผิดสเป็ค / การผลิตผิดพลาด</option>
                                    <option value="(S1) Screen : จอกระพริบ /ภาพสั่น">(S1) Screen : จอกระพริบ /ภาพสั่น</option>
                                    <option value="(S2) Screen : เปิดไม่ติด / ไม่มีสัญญาณภาพ / ไม่มีแสงอะไรเลย">(S2) Screen : เปิดไม่ติด / ไม่มีสัญญาณภาพ / ไม่มีแสงอะไรเลย</option>
                                    <option value="สาเหตุอื่นๆ">สาเหตุอื่นๆ (โปรดระบุในรายละเอียด)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest mb-1.5 block">รายละเอียดเพิ่มเติม</label>
                                <input type="text" value={serviceForm.details} onChange={e => setServiceForm({...serviceForm, details: e.target.value})} className="w-full p-3 rounded-xl border border-[var(--dh-border)] focus:border-[var(--dh-accent)] focus:ring-4 focus:ring-[var(--dh-accent-light)] outline-none text-sm font-bold bg-transparent transition-all" placeholder="ระบุเพิ่มเติม..." />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[11px] font-black uppercase tracking-widest mb-1.5 block">ชื่อเจ้าหน้าที่</label>
                                    <input type="text" value={serviceForm.inspectorName} onChange={e => setServiceForm({...serviceForm, inspectorName: e.target.value})} className="w-full p-3 rounded-xl border border-[var(--dh-border)] focus:border-[var(--dh-accent)] focus:ring-4 focus:ring-[var(--dh-accent-light)] outline-none text-sm font-bold bg-transparent transition-all" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black uppercase tracking-widest mb-1.5 block">Tracking พัสดุ (ถ้ามี)</label>
                                    <input type="text" placeholder="ระบุเลขพัสดุ" value={serviceForm.tracking} onChange={e => setServiceForm({...serviceForm, tracking: e.target.value})} className="w-full p-3 rounded-xl border border-[var(--dh-border)] focus:border-[var(--dh-accent)] focus:ring-4 focus:ring-[var(--dh-accent-light)] outline-none text-sm font-bold bg-transparent transition-all" />
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-[var(--dh-border)]">
                                <label className="text-[11px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <UploadCloud size={14}/> อัพโหลดรูปภาพหลักฐาน
                                </label>
                                <div className="flex items-center gap-3 bg-[var(--dh-bg-base)] p-2 rounded-xl border border-dashed border-[var(--dh-border)] hover:bg-[var(--dh-bg-surface)] transition-colors cursor-pointer relative">
                                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full opacity-0 absolute inset-0 cursor-pointer z-10" />
                                    <div className="flex items-center justify-center w-full py-3 gap-2 text-sm font-bold text-[var(--dh-text-muted)]">
                                        {isUploading ? <><Loader2 className="w-5 h-5 animate-spin text-[var(--dh-accent)]"/> กำลังอัพโหลด...</> : "คลิกหรือลากไฟล์ภาพมาวางที่นี่"}
                                    </div>
                                </div>
                                {serviceForm.images.length > 0 && (
                                    <div className="flex gap-3 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                                        {serviceForm.images.map((img, i) => (
                                            <div key={i} className="relative w-20 h-20 shrink-0 group">
                                                <img src={img} className="w-full h-full object-cover rounded-xl border border-[var(--dh-border)] shadow-md" />
                                                <button type="button" onClick={() => handleRemoveImage(i)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110 transition-all">
                                                    <X size={12} strokeWidth={3}/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-5 border-t border-[var(--dh-border)] flex justify-end gap-3 bg-[var(--dh-bg-base)] shrink-0">
                            <button onClick={() => setServiceModal(null)} className="px-5 py-2.5 text-[var(--dh-text-muted)] font-bold rounded-xl hover:bg-[var(--dh-bg-surface)] border border-transparent hover:border-[var(--dh-border)] text-sm transition-all">
                                ยกเลิก
                            </button>
                            <button onClick={handleSubmitService} disabled={isSubmittingService || isUploading} className="px-6 py-2.5 bg-[var(--dh-text-main)] hover:bg-[var(--dh-accent)] text-[var(--dh-bg-surface)] hover:text-white font-black rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all text-sm disabled:opacity-50 flex items-center gap-2">
                                {isSubmittingService ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} บันทึกข้อมูล
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}