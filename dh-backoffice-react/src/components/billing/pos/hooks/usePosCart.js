import { useState, useEffect } from 'react';
import { inventoryService } from '../../../../firebase/inventoryService';

export function usePosCart(products) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [actionBoxItem, setActionBoxItem] = useState(null);
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        const fetchSearch = async () => {
            if (!searchQuery.trim()) {
                // Load default 15 items
                const res = await inventoryService.searchProductsForPos('');
                setSearchResults(res);
                return;
            }

            const res = await inventoryService.searchProductsForPos(searchQuery.trim());
            setSearchResults(res);
        };

        const timeoutId = setTimeout(() => {
            fetchSearch();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    return {
        searchQuery, setSearchQuery,
        showDropdown, setShowDropdown,
        actionBoxItem, setActionBoxItem,
        searchResults
    };
}
