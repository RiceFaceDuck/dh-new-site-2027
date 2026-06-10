import React, { useState, useEffect } from 'react';
import { User, Wand2 } from 'lucide-react';
import { userService } from '../../../../firebase/userService';
import CustomerSearchInput from './customer/CustomerSearchInput';
import WalkInCustomerCard from './customer/WalkInCustomerCard';
import ActiveCustomerCard from './customer/ActiveCustomerCard';

export default function CustomerSection({
    activeTab,
    updateActiveTab,
    custSearchRef,
    customerSearchText,
    setCustomerSearchText,
    showCustDropdown,
    setShowCustDropdown,
    filteredCustomers,
    handleSelectCustomer,
    netTotal,
    isProcessing,
    labelClass
}) {
    const [localSearchText, setLocalSearchText] = useState('');
    const [showWalkInPhoneInput, setShowWalkInPhoneInput] = useState(false);
    const [isEditingCustomerPhone, setIsEditingCustomerPhone] = useState(false);
    const [tempCustomerPhone, setTempCustomerPhone] = useState('');
    const [isSavingCustomer, setIsSavingCustomer] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    useEffect(() => {
        if (activeTab.customer) {
            setLocalSearchText(activeTab.customer.accountName || activeTab.customer.displayName || activeTab.customer.firstName || '');
        } else if (activeTab.walkInName) {
            setLocalSearchText(activeTab.walkInName);
        } else {
            setLocalSearchText('');
        }
        setCustomerSearchText(''); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab.id, activeTab.customer?.uid, activeTab.walkInName]); 

    useEffect(() => { 
        setShowWalkInPhoneInput(false); 
        setIsEditingCustomerPhone(false);
        setTempCustomerPhone('');
    }, [activeTab.id, activeTab.customer?.uid]);

    const formatPhoneNumber = (val) => {
        if (!val || val === '(+' || val === '(+6' || val === '(+66' || val === '(+66)') return '';
        let digits = val.replace(/\D/g, ''); 
        if (digits.startsWith('0')) digits = '66' + digits.substring(1);
        else if (digits.length > 0 && !digits.startsWith('66')) digits = '66' + digits;

        let formatted = '';
        if (digits.startsWith('66')) {
            formatted = '(+66)'; let rest = digits.substring(2);
            if (rest.startsWith('2')) {
                if (rest.length > 0) formatted += rest.substring(0, 1);
                if (rest.length > 1) formatted += '-' + rest.substring(1, 4);
                if (rest.length > 4) formatted += '-' + rest.substring(4, 8);
            } else {
                if (rest.length > 0) formatted += rest.substring(0, 2);
                if (rest.length > 2) formatted += '-' + rest.substring(2, 5);
                if (rest.length > 5) formatted += '-' + rest.substring(5, 9);
            }
        } else formatted = digits;
        return formatted;
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        updateActiveTab({ walkInPhone: formatted });
    };

    const handleSearchInput = (e) => {
        const val = e.target.value;
        setLocalSearchText(val);
        setCustomerSearchText(val); 
        setShowCustDropdown(true);

        if (activeTab.customer) {
            updateActiveTab({ customer: null, walletUsed: 0 });
        }
    };

    const handleSaveNewCustomer = async () => {
        if (!activeTab.walkInName) return;
        setIsSavingCustomer(true);
        try {
            const newCustData = {
                accountName: activeTab.walkInName,
                displayName: activeTab.walkInName,
                firstName: activeTab.walkInName,
                phone: activeTab.walkInPhone || '',
                phoneNumber: activeTab.walkInPhone || '',
                customerType: 'ทั่วไป',
                source: 'POS Quick Add'
            };
            await userService.createManualCustomer(newCustData);
            alert('✅ บันทึกเป็นลูกค้าระบบสำเร็จ! ในบิลถัดไปสามารถค้นหาชื่อนี้ได้เลย');
        } catch (error) {
            console.error("🔥 Error saving customer:", error);
            alert(`❌ ไม่สามารถบันทึกลูกค้าได้: ${error.message}`);
        } finally {
            setIsSavingCustomer(false);
        }
    };

    const isSearchHighlight = !activeTab.customer && !activeTab.walkInName;

    return (
        <div className="p-4 border-b border-[var(--dh-border)] last:border-0 transition-colors duration-300">
            <div className="flex items-center justify-between mb-3">
                <label className={`${labelClass} text-blue-600`}>
                    <User size={14}/> ข้อมูลลูกค้า 
                </label>
                {!activeTab.customer && !activeTab.walkInName && (
                    <button onClick={() => {
                        const randomName = `Walk-in #${Math.floor(1000 + Math.random() * 9000)}`;
                        updateActiveTab({ walkInName: randomName, hidePhone: false, walkInPhone: '' });
                        setLocalSearchText(randomName);
                        setShowWalkInPhoneInput(false);
                    }} className="text-[10px] flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors font-bold uppercase bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2 py-1 rounded shadow-sm group" title="เสกชื่อลูกค้า Walk-in อัตโนมัติ">
                        <Wand2 size={10} className="group-hover:rotate-12 transition-transform"/> Auto-Fill
                    </button>
                )}
            </div>

            <CustomerSearchInput 
                localSearchText={localSearchText}
                handleSearchInput={handleSearchInput}
                showCustDropdown={showCustDropdown}
                setShowCustDropdown={setShowCustDropdown}
                isSearchFocused={isSearchFocused}
                setIsSearchFocused={setIsSearchFocused}
                isSearchHighlight={isSearchHighlight}
                isProcessing={isProcessing}
                activeTab={activeTab}
                handleSelectCustomer={handleSelectCustomer}
                setLocalSearchText={setLocalSearchText}
                setCustomerSearchText={setCustomerSearchText}
                updateActiveTab={updateActiveTab}
                setShowWalkInPhoneInput={setShowWalkInPhoneInput}
                filteredCustomers={filteredCustomers}
                custSearchRef={custSearchRef}
            />

            <WalkInCustomerCard 
                activeTab={activeTab}
                updateActiveTab={updateActiveTab}
                showWalkInPhoneInput={showWalkInPhoneInput}
                setShowWalkInPhoneInput={setShowWalkInPhoneInput}
                handlePhoneChange={handlePhoneChange}
                handleSaveNewCustomer={handleSaveNewCustomer}
                isSavingCustomer={isSavingCustomer}
            />

            <ActiveCustomerCard 
                activeTab={activeTab}
                updateActiveTab={updateActiveTab}
                isEditingCustomerPhone={isEditingCustomerPhone}
                setIsEditingCustomerPhone={setIsEditingCustomerPhone}
                tempCustomerPhone={tempCustomerPhone}
                setTempCustomerPhone={setTempCustomerPhone}
                formatPhoneNumber={formatPhoneNumber}
                isProcessing={isProcessing}
                netTotal={netTotal}
            />
        </div>
    );
}
