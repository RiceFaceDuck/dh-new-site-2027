import React from 'react';
import { useCustomers } from './hooks/useCustomers';

// นำเข้า UI Components ที่เราเพิ่งสร้างทั้งหมด
import CustomerHeader from './components/layout/CustomerHeader';
import CustomerTable from './components/layout/CustomerTable';
import DetailPanel from './components/details/DetailPanel';
import CustomerModal from './components/forms/CustomerModal';

export default function Customers() {
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
    </div>
  );
}