import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../../../context/FavoritesProvider';
import { useCart } from '../../../../context/CartProvider';

export const useFavoriteManagement = () => {
    const { favorites, toggleFavorite, updateFavoriteDetails } = useFavorites();
    const { addToCart, cartItems } = useCart();
    const [viewMode, setViewMode] = useState('list'); // 'grid' | 'list'
    const [selectedIds, setSelectedIds] = useState([]);
    const [liveProducts, setLiveProducts] = useState({});
    const navigate = useNavigate();

    const handleLiveDataLoaded = (id, liveProduct) => {
        setLiveProducts(prev => ({ ...prev, [id]: liveProduct }));
    };

    const handleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(favorites.map(f => f.id));
        } else {
            setSelectedIds([]);
        }
    };

    const selectedProducts = favorites.filter(f => selectedIds.includes(f.id)).map(f => liveProducts[f.id] || f);
    
    const selectedTotal = selectedProducts.reduce((sum, p) => {
        const price = Number(p?.salePrice) || Number(p?.price) || 0;
        const cartItem = cartItems.find(i => i.id === p.id);
        const qty = cartItem ? (cartItem.qty || cartItem.quantity) : 1;
        return sum + (price * qty);
    }, 0);
    
    const handleAddSelectedToCart = () => {
        let addedCount = 0;
        selectedProducts.forEach(product => {
            const isOutOfStock = product.isOutOfStock || product.stockQuantity <= 0;
            const alreadyInCart = cartItems.some(i => i.id === product.id);
            if (!isOutOfStock && !alreadyInCart) {
                addToCart(product, 1);
                addedCount++;
            }
        });
        if (addedCount === 0) {
            navigate('/cart');
        }
    };

    const notInCartCount = selectedProducts.filter(p => !cartItems.some(i => i.id === p.id) && !(p.isOutOfStock || p.stockQuantity <= 0)).length;

    return {
        favorites,
        toggleFavorite,
        updateFavoriteDetails,
        viewMode,
        setViewMode,
        selectedIds,
        handleSelect,
        handleSelectAll,
        handleLiveDataLoaded,
        selectedTotal,
        handleAddSelectedToCart,
        notInCartCount,
        navigate
    };
};
