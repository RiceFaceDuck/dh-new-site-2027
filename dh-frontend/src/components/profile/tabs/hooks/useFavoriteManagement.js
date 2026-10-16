import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../../../context/FavoritesProvider';
import { useCart } from '../../../../context/CartProvider';
import { productService } from '../../../../firebase/productService';

export const useFavoriteManagement = () => {
    const { favorites, toggleFavorite, updateFavoriteDetails, reorderFavorites } = useFavorites();
    const { addToCart, cartItems } = useCart();
    const [viewMode, setViewMode] = useState('list'); // 'grid' | 'list'
    const [selectedIds, setSelectedIds] = useState([]);
    const [liveProducts, setLiveProducts] = useState({});
    const [loadingLive, setLoadingLive] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState(null); // null = all tags
    const [copiedQuotation, setCopiedQuotation] = useState(false);
    const navigate = useNavigate();

    // 🚀 BATCH FETCH: รวบการอ่านข้อมูลสินค้าเป็นคำสั่งเดียว (Single Read Batch) ลดโควต้าลงเหลือ 1 Query
    useEffect(() => {
        let isMounted = true;
        const fetchAllLive = async () => {
            const ids = favorites.map(f => f.id).filter(Boolean);
            if (ids.length === 0) {
                setLoadingLive(false);
                return;
            }
            setLoadingLive(true);
            try {
                const products = await productService.getProductsByIds(ids);
                if (isMounted) {
                    const map = {};
                    products.forEach(p => {
                        if (p?.id) map[p.id] = p;
                    });
                    setLiveProducts(map);
                    setLoadingLive(false);
                }
            } catch (err) {
                console.error("Batch load fav products error:", err);
                if (isMounted) setLoadingLive(false);
            }
        };
        fetchAllLive();
        return () => { isMounted = false; };
    }, [favorites]);

    // 1. ระบบดึงแท็กทั้งหมดพร้อมนับจำนวน
    const tagCounts = useMemo(() => {
        const counts = {};
        favorites.forEach(f => {
            if (Array.isArray(f.tags)) {
                f.tags.forEach(t => {
                    const tag = String(t).trim();
                    if (tag) {
                        counts[tag] = (counts[tag] || 0) + 1;
                    }
                });
            }
        });
        return counts;
    }, [favorites]);

    const allTags = useMemo(() => Object.keys(tagCounts).sort(), [tagCounts]);

    // 2. ระบบกรองสินค้าตาม Search Query & Selected Tag
    const filteredFavorites = useMemo(() => {
        return favorites.filter(product => {
            const live = liveProducts[product.id] || product;
            
            // กรองตามแท็กที่เลือก
            if (selectedTag) {
                if (!Array.isArray(product.tags) || !product.tags.includes(selectedTag)) {
                    return false;
                }
            }

            // กรองตามคำค้นหา (ชื่อ, SKU, Model, หมายเหตุ, แท็ก)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const name = (live.name || product.name || '').toLowerCase();
                const sku = (live.sku || product.sku || live.model || product.model || '').toLowerCase();
                const note = (product.note || '').toLowerCase();
                const tagsStr = (product.tags || []).join(' ').toLowerCase();

                return name.includes(query) || sku.includes(query) || note.includes(query) || tagsStr.includes(query);
            }

            return true;
        });
    }, [favorites, liveProducts, selectedTag, searchQuery]);

    // 3. ระบบเลื่อนขึ้น-เลื่อนลง (Reorder Favorites)
    const moveFavoriteUp = useCallback((id) => {
        const index = favorites.findIndex(f => f.id === id);
        if (index > 0 && reorderFavorites) {
            const newFavs = [...favorites];
            const temp = newFavs[index];
            newFavs[index] = newFavs[index - 1];
            newFavs[index - 1] = temp;
            reorderFavorites(newFavs);
        }
    }, [favorites, reorderFavorites]);

    const moveFavoriteDown = useCallback((id) => {
        const index = favorites.findIndex(f => f.id === id);
        if (index >= 0 && index < favorites.length - 1 && reorderFavorites) {
            const newFavs = [...favorites];
            const temp = newFavs[index];
            newFavs[index] = newFavs[index + 1];
            newFavs[index + 1] = temp;
            reorderFavorites(newFavs);
        }
    }, [favorites, reorderFavorites]);

    const handleSelect = useCallback((id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    }, []);

    const handleSelectAll = useCallback((e) => {
        if (e.target.checked) {
            // เลือกทั้งหมดในรายการที่กำลังฟิลเตอร์แสดงอยู่
            setSelectedIds(filteredFavorites.map(f => f.id));
        } else {
            setSelectedIds([]);
        }
    }, [filteredFavorites]);

    const selectedProducts = useMemo(() => {
        return favorites.filter(f => selectedIds.includes(f.id)).map(f => liveProducts[f.id] || f);
    }, [favorites, selectedIds, liveProducts]);
    
    const selectedTotal = useMemo(() => {
        return selectedProducts.reduce((sum, p) => {
            const price = Number(p?.salePrice) || Number(p?.price) || 0;
            const cartItem = cartItems.find(i => i.id === p.id);
            const qty = cartItem ? (cartItem.qty || cartItem.quantity) : 1;
            return sum + (price * qty);
        }, 0);
    }, [selectedProducts, cartItems]);
    
    const handleAddSelectedToCart = useCallback(() => {
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
    }, [selectedProducts, cartItems, addToCart, navigate]);

    // 4. ฟังก์ชันคัดลอกรายการสรุปราคา (สำหรับส่งให้ลูกค้าทาง LINE / จดงาน)
    const handleCopyQuotation = useCallback(() => {
        const itemsToExport = selectedProducts.length > 0 ? selectedProducts : filteredFavorites.map(f => liveProducts[f.id] || f);
        if (itemsToExport.length === 0) return;

        let total = 0;
        const lines = itemsToExport.map((p, idx) => {
            const price = Number(p?.salePrice) || Number(p?.price) || 0;
            const sku = p.model || p.sku || p.id;
            const name = p.name || 'สินค้า';
            const noteText = p.note ? ` (หมายเหตุ: ${p.note})` : '';
            total += price;
            return `${idx + 1}. [${sku}] ${name} - ฿${price.toLocaleString()}${noteText}`;
        });

        const quotationText = [
            `📋 สรุปรายการอะไหล่ประเมินราคา (${itemsToExport.length} รายการ)`,
            `----------------------------------------`,
            ...lines,
            `----------------------------------------`,
            `💰 ยอดรวมทั้งสิ้น: ฿${total.toLocaleString()} บาท`,
            `🕒 วันที่สร้าง: ${new Date().toLocaleDateString('th-TH')}`
        ].join('\n');

        if (navigator.clipboard) {
            navigator.clipboard.writeText(quotationText);
            setCopiedQuotation(true);
            setTimeout(() => setCopiedQuotation(false), 2500);
        }
    }, [selectedProducts, filteredFavorites, liveProducts]);

    const notInCartCount = selectedProducts.filter(p => !cartItems.some(i => i.id === p.id) && !(p.isOutOfStock || p.stockQuantity <= 0)).length;

    return {
        favorites,
        filteredFavorites,
        toggleFavorite,
        updateFavoriteDetails,
        moveFavoriteUp,
        moveFavoriteDown,
        viewMode,
        setViewMode,
        selectedIds,
        handleSelect,
        handleSelectAll,
        selectedTotal,
        handleAddSelectedToCart,
        notInCartCount,
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        allTags,
        tagCounts,
        loadingLive,
        liveProducts,
        handleCopyQuotation,
        copiedQuotation,
        navigate
    };
};

