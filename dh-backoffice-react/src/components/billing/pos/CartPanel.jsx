import React from 'react';
import SearchArea from './cart/SearchArea';
import CartTable from './cart/CartTable';

export default function CartPanel({ 
    searchRef, searchQuery, setSearchQuery, showDropdown, setShowDropdown, 
    handleSearchKeyDown, clearCart, activeTab, searchResults, addItemToCart, 
    actionBoxItem, setActionBoxItem, updateItemAction, removeItem, eligibleFreebies,
    isProcessing 
}) {
    return (
        <div className="flex flex-col h-full relative z-10 font-sans">
            <SearchArea 
                searchRef={searchRef} 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                showDropdown={showDropdown} 
                setShowDropdown={setShowDropdown} 
                handleSearchKeyDown={handleSearchKeyDown} 
                clearCart={clearCart} 
                activeTab={activeTab} 
                searchResults={searchResults} 
                addItemToCart={addItemToCart} 
                isProcessing={isProcessing} 
            />
            
            <CartTable 
                activeTab={activeTab}
                actionBoxItem={actionBoxItem}
                setActionBoxItem={setActionBoxItem}
                updateItemAction={updateItemAction}
                removeItem={removeItem}
                eligibleFreebies={eligibleFreebies}
                isProcessing={isProcessing}
            />
        </div>
    );
}