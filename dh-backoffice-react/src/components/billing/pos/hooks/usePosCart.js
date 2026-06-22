import { useState, useMemo } from 'react';

export function usePosCart(products) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [actionBoxItem, setActionBoxItem] = useState(null);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) {
            return [...products]
                .sort((a, b) => (b.stats?.sold || 0) - (a.stats?.sold || 0))
                .slice(0, 15)
                .map(p => ({ ...p, matchType: 'best-seller' }));
        }

        const q = searchQuery.trim().toLowerCase();
        const exactMatches = products.filter(p => p.sku?.toLowerCase() === q);
        
        const exactSkus = new Set(exactMatches.map(p => p.sku));
        const similarMatches = products.filter(p => {
            if (exactSkus.has(p.sku)) return false;
            return p.sku?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q);
        });

        similarMatches.sort((a, b) => (b.stats?.sold || 0) - (a.stats?.sold || 0));

        return [
            ...exactMatches.map(p => ({ ...p, matchType: 'exact' })),
            ...similarMatches.slice(0, Math.max(0, 15 - exactMatches.length)).map(p => ({ ...p, matchType: 'similar' }))
        ];
    }, [searchQuery, products]);

    return {
        searchQuery, setSearchQuery,
        showDropdown, setShowDropdown,
        actionBoxItem, setActionBoxItem,
        searchResults
    };
}
