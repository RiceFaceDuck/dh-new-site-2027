import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './config';

// 🚀 ULTRA SMART FIELD MAPPER (V2): ค้นหาและแปลงข้อมูลครอบจักรวาล
const normalizeKey = (k) => String(k).replace(/[_\-\s]/g, '').toLowerCase();

const getVal = (obj, possibleKeys) => {
  if (!obj || typeof obj !== 'object') return null;
  const normalizedObj = Object.keys(obj).reduce((acc, key) => {
    acc[normalizeKey(key)] = obj[key];
    return acc;
  }, {});
  
  for (let key of possibleKeys) {
    const val = normalizedObj[normalizeKey(key)];
    if (val !== undefined && val !== null && val !== '') {
      return val;
    }
  }
  return null;
};

export const productService = {
  /**
   * Fetch a single product by SKU and normalize its fields.
   */
  async getProduct(sku) {
    if (!sku) return null;
    try {
      const docRef = doc(db, "products", sku);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        return this.normalizeProductData({ id: docSnap.id, ...rawData });
      }

      // Fallback: search by sku field if document ID doesn't match
      const q = query(collection(db, "products"), where("sku", "==", sku));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const firstDoc = querySnapshot.docs[0];
        return this.normalizeProductData({ id: firstDoc.id, ...firstDoc.data() });
      }

      return null;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  },

  /**
   * Fetch multiple products in batches using 'in' query to save reads and time.
   */
  async getProductsByIds(ids) {
    if (!ids || ids.length === 0) return [];
    
    // Remove duplicates and filter falsy values
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    const results = [];
    
    // Firestore 'in' query supports max 30 items
    const chunkSize = 30;
    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
      const chunk = uniqueIds.slice(i, i + chunkSize);
      
      try {
        // Assume document IDs are the primary way to fetch
        // We use documentId() which maps to __name__ in Firestore
        const { documentId } = await import('firebase/firestore');
        const q = query(collection(db, "products"), where(documentId(), "in", chunk));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((docSnap) => {
          results.push(this.normalizeProductData({ id: docSnap.id, ...docSnap.data() }));
        });
        
        // Find missing ones that might be using 'sku' field instead of documentId
        const fetchedIds = querySnapshot.docs.map(d => d.id);
        const missingIds = chunk.filter(id => !fetchedIds.includes(id));
        
        if (missingIds.length > 0) {
          const fallbackQ = query(collection(db, "products"), where("sku", "in", missingIds));
          const fallbackSnap = await getDocs(fallbackQ);
          fallbackSnap.forEach((docSnap) => {
            results.push(this.normalizeProductData({ id: docSnap.id, ...docSnap.data() }));
          });
        }
      } catch (error) {
        console.error("Error fetching products batch:", error);
      }
    }
    
    return results;
  },

  /**
   * Subscribe to a product for real-time updates (Real-time Caching replacement).
   * Calls the callback with the normalized product data whenever it changes.
   * Returns an unsubscribe function.
   */
  subscribeToProduct(sku, callback) {
    if (!sku) return () => {};
    
    // First try subscribing to the document directly (assuming SKU is document ID)
    const docRef = doc(db, "products", sku);
    
    // We will use onSnapshot on a query to handle both ID and SKU fields if possible,
    // but onSnapshot on docRef is much cheaper. Let's try docRef first, if it fails, fallback to query.
    // However, onSnapshot doesn't throw if doc doesn't exist, it just returns exists() = false.
    // A safer way is to just query by SKU. But querying is more expensive.
    
    let isFallback = false;
    let fallbackUnsub = null;

    const mainUnsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(this.normalizeProductData({ id: docSnap.id, ...docSnap.data() }));
      } else if (!isFallback) {
        isFallback = true;
        // Fallback to query if doc ID doesn't match
        const q = query(collection(db, "products"), where("sku", "==", sku));
        fallbackUnsub = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            callback(this.normalizeProductData({ id: firstDoc.id, ...firstDoc.data() }));
          } else {
            callback(null);
          }
        });
      } else {
         callback(null);
      }
    });

    return () => {
      mainUnsub();
      if (fallbackUnsub) fallbackUnsub();
    };
  },

  /**
   * Normalize product data to ensure consistent field names across the frontend.
   */
  normalizeProductData(raw) {
    if (!raw) return null;

    // Base info
    const id = raw.id || getVal(raw, ['sku', 'productid']);
    const name = getVal(raw, ['name', 'title', 'productname']) || 'Unnamed Product';
    const brand = getVal(raw, ['brand', 'manufacturer', 'maker']) || 'DH Standard';
    const model = getVal(raw, ['model', 'modelnumber']) || id;
    const category = getVal(raw, ['category', 'type', 'group']);
    
    // Pricing
    // retailPrice is the website selling price. wholesalePrice is cost (DO NOT SHOW TO CUSTOMERS).
    const retailPrice = getVal(raw, ['retailPrice']);
    const wholesalePrice = getVal(raw, ['price', 'baseprice', 'cost']);
    const discountPrice = getVal(raw, ['salePrice', 'discountPrice', 'specialPrice']);

    // The main price shown to the customer should be the retailPrice.
    // If retailPrice is missing, fallback to wholesalePrice (but ideally it should exist).
    const price = retailPrice || wholesalePrice || 0;
    
    // salePrice is only shown if there's an actual discount price that is lower than the regular price.
    let salePrice = discountPrice && discountPrice < price ? discountPrice : undefined;

    // Stock
    const stockQuantity = getVal(raw, ['stockQuantity', 'stock', 'quantity', 'qty']) || 0;
    const bufferStock = getVal(raw, ['bufferStock', 'buffer', 'minstock']) || 2; // Default buffer 2
    const isOutOfStock = stockQuantity <= 0;
    const isLowStock = stockQuantity > 0 && stockQuantity <= bufferStock;

    // Descriptions
    const shortDescription = getVal(raw, ['shortDescription', 'shortDesc']);
    const fullDescription = getVal(raw, ['fullDescription', 'longDescription', 'description', 'desc', 'details', 'detail']);

    // Tech Specs
    const compatibleModels = getVal(raw, ['compatibleModels']);
    const compatiblePartNumbers = getVal(raw, ['compatiblePartNumbers', 'compatibleParts']);
    const specs = getVal(raw, ['specifications', 'specs', 'features']) || {};

    // Media
    let rawImg = getVal(raw, ['imageurl', 'image', 'picture', 'photo', 'img', 'images', 'cover']);
    const imageUrl = Array.isArray(rawImg) ? rawImg[0] : rawImg;
    const youtubeUrl = getVal(raw, ['youtubeUrl', 'videoUrl', 'youtube', 'video']);
    const videoId = this.extractYouTubeId(youtubeUrl);

    // Marketplace Links
    const extLinks = raw.externalLinks || {};
    const shopeeUrl = getVal(raw, ['shopeeUrl', 'shopee', 'shopeelink']) || extLinks.shopee || null;
    const lazadaUrl = getVal(raw, ['lazadaUrl', 'lazada', 'lazadalink']) || extLinks.lazada || null;

    // Review Stats
    const reviewCount = getVal(raw, ['reviewCount']) || 0;
    const averageRating = getVal(raw, ['averageRating']) || 0;

    const variantOptions = raw.variantOptions || [];
    const variants = raw.variants || [];

    return {
      id,
      name,
      brand,
      model,
      category,
      price,
      salePrice,
      stockQuantity,
      bufferStock,
      isOutOfStock,
      isLowStock,
      shortDescription,
      fullDescription,
      compatibleModels,
      compatiblePartNumbers,
      specs,
      imageUrl,
      youtubeUrl,
      videoId,
      shopeeUrl,
      lazadaUrl,
      reviewCount,
      averageRating,
      variantOptions,
      variants,
      _raw: raw // Keep raw data just in case
    };
  },

  extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = String(url).match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
};
