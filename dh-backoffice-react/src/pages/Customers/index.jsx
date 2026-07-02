import React, { useState } from 'react';
import { useCustomers } from './hooks/useCustomers';
import GuideModal from '../../components/common/GuideModal';

import CustomerHeader from './components/layout/CustomerHeader';
import CustomerTable from './components/layout/CustomerTable';
import DetailPanel from './components/details/DetailPanel';
import CustomerModal from './components/forms/CustomerModal';

export default function Customers() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  // เรียกใช้สมองกลหลัก (Facade Hook)
  const { state, actions, utils } = useCustomers();

  // กรองข้อมูลด้วยวันที่ก่อนส่งให้ตาราง
  const displayCustomers = utils.filterDataByDate(state.filteredCustomers, state.dateFilter);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-full animate-in fade-in duration-500 bg-dh-base gap-1 p-1 md:gap-1.5 md:p-1.5 text-dh-main overflow-hidden">
      
      {/* 1. ส่วนหัวของหน้า (เครื่องมือค้นหา และปุ่มเพิ่มลูกค้า) */}
      <CustomerHeader 
        searchTerm={state.searchTerm}
        onSearchChange={actions.setSearchTerm}
        dateFilter={state.dateFilter}
        onDateFilterChange={actions.setDateFilter}
        quickFilter={state.quickFilter}                  // 💎 ตัวกรองอัจฉริยะ (Wallet, Points, Partner)
        onQuickFilterChange={actions.setQuickFilter}     // 💎 รับค่าการเปลี่ยนตัวกรอง
        onRefresh={actions.fetchCustomers}
        isRefreshing={state.isRefreshing}
        onAddCustomer={() => actions.setIsAddModalOpen(true)}
        onGuideOpen={() => setIsGuideOpen(true)}
        onRunMigration={actions.handleRunMigration}
      />

      {/* 2. ส่วนเนื้อหาหลัก (Layout แบบ Split View) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ฝั่งซ้าย: ตารางรายชื่อลูกค้า */}
        <div className={`transition-all duration-300 ${state.selectedCustomer ? 'w-full md:w-1/2 lg:w-2/3 hidden md:flex flex-col' : 'w-full flex flex-col'} bg-white border border-dh-border`}>
          <CustomerTable 
            filteredCustomers={displayCustomers}
            visibleCount={state.visibleCount}
            onScroll={actions.handleScroll}
            loading={state.loading}
            selectedCustomer={state.selectedCustomer}
            onSelectCustomer={actions.handleSelectCustomer}
          />
        </div>

        {/* ฝั่งขวา: แผงรายละเอียดลูกค้า (จะโผล่มาเมื่อกดเลือกจากตาราง) */}
        {state.selectedCustomer && (
          <div className="w-full md:w-1/2 lg:w-1/3 bg-white shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 transition-all duration-300 border border-dh-border flex flex-col ml-1 md:ml-1.5">
            <DetailPanel 
              customer={state.selectedCustomer}
              history={state.customerHistory}
              onClose={() => actions.handleSelectCustomer(null)}
              onEdit={actions.startEditCustomer}
              onDelete={actions.handleDeleteCustomer}
            />
          </div>
        )}
      </div>

      {/* 3. ส่วน Modal Popup (ซ่อนอยู่ตลอดเวลาจนกว่าจะกดเพิ่ม/แก้ไข) */}
      <CustomerModal 
        isOpen={state.isAddModalOpen || state.isEditMode}
        onClose={() => {
          actions.setIsAddModalOpen(false);
          actions.setIsEditMode(false);
        }}
        isEditMode={state.isEditMode}
        formData={state.isEditMode ? state.editFormData : state.newCustomer}
        setFormData={state.isEditMode ? actions.setEditFormData : actions.setNewCustomer}
        onSubmit={state.isEditMode ? actions.saveCustomerEdit : actions.handleCreateCustomer}
        isSubmitting={state.isSubmitting || state.isSavingEdit}
      />

      <GuideModal 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="คู่มือการใช้งาน: ระบบฐานข้อมูลลูกค้า"
        config={{
          description: "หน้านี้ใช้สำหรับจัดการข้อมูลลูกค้า ค้นหาประวัติการซื้อ และดูข้อมูลติดต่อของลูกค้าทั้งหมดในระบบ",
          howTo: [
            "1. <b>ค้นหาลูกค้าด้วย Account ID:</b> (ใหม่!) พิมพ์รหัส Account ID 8 หลัก (เช่น 8RP6WHIM) เพื่อค้นหาอย่างแม่นยำ 100% ป้องกันการเปิดบิลผิดคน",
            "2. <b>ค้นหาทั่วไป:</b> พิมพ์ชื่อ เบอร์โทร หรืออีเมล ลงในช่องค้นหาด้านซ้ายบน",
            "3. <b>ตัวกรองอัจฉริยะ (Smart Filters):</b> ใช้ Dropdown ขวามือเพื่อกรองเฉพาะ 'คนที่มีเงินค้าง', 'คนที่มีแต้ม', หรือ 'พาร์ทเนอร์'",
            "4. <b>ดูประวัติ:</b> คลิกที่รายชื่อลูกค้าในตาราง ข้อมูลประวัติการซื้อ (History) จะแสดงที่แผงด้านขวา"
          ],
          tips: [
            "แนะนำให้ขอ Account ID จากหน้าแอปของลูกค้า มาใช้ค้นหา จะช่วยลดข้อผิดพลาดได้ดีที่สุด",
            "คุณสามารถคัดลอกเบอร์โทรหรือรหัสลูกค้าได้อย่างรวดเร็ว โดยคลิกที่ไอคอน Copy ในหน้ารายละเอียดลูกค้า",
            "แต้มสะสม (Points) จะอัปเดตอัตโนมัติเมื่อลูกค้าซื้อสินค้าหรือถูกยกเลิกบิล"
          ],
          expectedResults: "เมื่อแก้ไขข้อมูลลูกค้า ข้อมูลจะอัปเดตแบบเรียลไทม์ และระบบจะเก็บบันทึกประวัติการแก้ไข (History Log) ไว้ตรวจสอบเสมอ"
        }}
      />
    </div>
  );
}