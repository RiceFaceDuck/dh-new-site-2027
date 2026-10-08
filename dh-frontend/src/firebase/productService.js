import { doc, getDoc, collection, query, where, getDocs, onSnapshot, limit, orderBy, documentId, startAfter } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { CATEGORY_ALIASES } from './categoryService';
import { 
  resolveEffectiveBuffer, 
  calculateAvailableStock, 
  isProductOutOfStock, 
  isProductLowStock 
} from 'dh-shared';

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

/**
 * @typedef {Object} NormalizedProduct
 * @property {string} id - Product SKU / Document ID
 * @property {string} name - Product display name
 * @property {string} brand - Product brand/manufacturer
 * @property {string} model - Compatible Laptop Model
 * @property {string} category - Product category/type
 * @property {number} price - Retail price shown to customer
 * @property {number} [salePrice] - Special discounted price (if applicable)
 * @property {number} stockQuantity - Current physical stock
 * @property {number} bufferStock - Min buffer stock setting
 * @property {boolean} isOutOfStock - True if stockQuantity <= 0
 * @property {boolean} isLowStock - True if stockQuantity <= bufferStock
 * @property {string} [shortDescription] - Brief summary
 * @property {string} [fullDescription] - Detailed HTML/text description
 * @property {string} [imageUrl] - Cover image URL
 * @property {string} [youtubeUrl] - YouTube link
 * @property {string|null} videoId - Parsed YouTube ID
 * @property {string|null} shopeeUrl - Shopee marketplace link
 * @property {string|null} lazadaUrl - Lazada marketplace link
 * @property {number} reviewCount - Total customer reviews
 * @property {number} averageRating - Rating out of 5
 * @property {Array} variantOptions - Product variants
 * @property {Object} _raw - Raw Firestore Document Data
 */

let cachedGlobalBuffer = null;

export const productService = {
  /**
   * Fetch global buffer stock setting
   * @returns {Promise<number>}
   */
  async getGlobalBuffer() {
    if (cachedGlobalBuffer !== null) return cachedGlobalBuffer;
    try {
      const docRef = doc(db, getCollectionPath('settings'), 'inventory');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().defaultBufferStock !== undefined) {
        cachedGlobalBuffer = Number(docSnap.data().defaultBufferStock);
      } else {
        cachedGlobalBuffer = 2; // fallback
      }
    } catch (error) {
      console.error("Error fetching global buffer:", error);
      cachedGlobalBuffer = 2;
    }
    return cachedGlobalBuffer;
  },

  /**
   * Fetch a single product by SKU and normalize its fields.
   * @param {string} sku - SKU or Document ID
   * @returns {Promise<NormalizedProduct|null>}
   */
  async getProduct(sku) {
    await this.getGlobalBuffer();
    if (!sku) return null;
    try {
      const docRef = doc(db, getCollectionPath('products'), sku);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        return this.normalizeProductData({ id: docSnap.id, ...rawData });
      }

      // Fallback: search by sku field if document ID doesn't match
      const q = query(collection(db, getCollectionPath('products')), where("sku", "==", sku), limit(1));
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
    
    await this.getGlobalBuffer();

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
        const q = query(collection(db, getCollectionPath('products')), where(documentId(), "in", chunk), limit(300));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((docSnap) => {
          results.push(this.normalizeProductData({ id: docSnap.id, ...docSnap.data() }));
        });
        
        // Find missing ones that might be using 'sku' field instead of documentId
        const fetchedIds = querySnapshot.docs.map(d => d.id);
        const missingIds = chunk.filter(id => !fetchedIds.includes(id));
        
        if (missingIds.length > 0) {
          const fallbackQ = query(collection(db, getCollectionPath('products')), where("sku", "in", missingIds), limit(300));
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
    const docRef = doc(db, getCollectionPath('products'), sku);
    
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
        const q = query(collection(db, getCollectionPath('products')), where("sku", "==", sku), limit(1));
        fallbackUnsub = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            callback(this.normalizeProductData({ id: firstDoc.id, ...firstDoc.data() }));
          } else {
            callback(null);
          }
        });
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
    // retailPrice is the customer selling price. NEVER fallback to wholesalePrice/cost.
    const retailPrice = getVal(raw, ['retailPrice']);
    const discountPrice = getVal(raw, ['salePrice', 'discountPrice', 'specialPrice']);

    // If retailPrice is missing or <= 0, price is 0 and product is marked unpurchasable.
    const price = typeof retailPrice === 'number' && retailPrice > 0 ? retailPrice : 0;
    
    // salePrice is only shown if there's an actual discount price lower than the regular price.
    let salePrice = discountPrice && discountPrice < price ? discountPrice : undefined;

    // Stock
    const stockQuantity = getVal(raw, ['stockQuantity', 'stock', 'quantity', 'qty']) || 0;
    
    // Resolve bufferStock using centralized engine
    const rawBuffer = getVal(raw, ['bufferStock', 'buffer', 'minstock']);
    const bufferStock = resolveEffectiveBuffer(rawBuffer, cachedGlobalBuffer);
    const availableStock = calculateAvailableStock(stockQuantity, bufferStock);
    
    // Out of stock if stock is depleted/buffered OR if no valid retail price is configured
    const isOutOfStock = price <= 0 || isProductOutOfStock(stockQuantity, bufferStock);
    const isLowStock = isProductLowStock(stockQuantity, bufferStock);

    // Descriptions
    const shortDescription = getVal(raw, ['shortDescription', 'shortDesc']);
    const fullDescription = getVal(raw, ['fullDescription', 'longDescription', 'description', 'desc', 'details', 'detail']);

    // Tech Specs
    const compatibleModels = getVal(raw, ['compatibleModels']);
    const compatiblePartNumbers = getVal(raw, ['compatiblePartNumbers', 'compatibleParts']);
    const specs = getVal(raw, ['specifications', 'specs', 'features']) || {};

    // Media
    let rawImg = getVal(raw, ['imageurl', 'image', 'picture', 'photo', 'img', 'images', 'cover']);
    const images = Array.isArray(rawImg) ? rawImg : (rawImg ? [rawImg] : []);
    const imageUrl = images.length > 0 ? images[0] : null;
    const hiddenImagesKey = Object.keys(raw || {}).find(k => k.toLowerCase() === 'hiddenimages');
    const hiddenImages = hiddenImagesKey ? (raw[hiddenImagesKey] || []) : [];
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
      availableStock,
      isOutOfStock,
      isLowStock,
      shortDescription,
      fullDescription,
      compatibleModels,
      compatiblePartNumbers,
      specs,
      imageUrl,
      images,
      hiddenImages,
      youtubeUrl,
      videoId,
      shopeeUrl,
      lazadaUrl,
      reviewCount,
      averageRating,
      variantOptions,
      variants
    };
  },

  async getProductsByCategory(category, lastVisible, limitCount = 40) {
    try {
      await this.getGlobalBuffer();
      const cleanCategory = (category || '').trim();
      const lowerCaseType = cleanCategory.toLowerCase();
      
      // 🛡️ Zero-Quota Guard: 'all' is an alias for the categories hub (/categories), not a single product category
      if (!lowerCaseType || lowerCaseType === 'all' || lowerCaseType === 'undefined' || lowerCaseType === 'null') {
        return { docs: [], lastDoc: null };
      }

      // 🛡️ Alias Resolution: แปลง fan -> cooling, ลำโพง -> built in audio อัตโนมัติ
      const targetCategory = CATEGORY_ALIASES[lowerCaseType] || lowerCaseType;

      // 🛡️ TIER 1: Low-Quota Shield from catalogs/cat_* (1 Read for up to 50 items)
      if (!lastVisible && targetCategory) {
        try {
          const catRef = doc(db, getCollectionPath('catalogs'), `cat_${targetCategory}`);
          const catSnap = await getDoc(catRef);
          if (catSnap.exists()) {
            const catData = catSnap.data();
            if (catData && Array.isArray(catData.items) && catData.items.length > 0) {
              const docs = catData.items.map(p => this.normalizeProductData({ id: p.sku, ...p }));
              const lastSku = docs[docs.length - 1]?.id || null;
              const totalItems = Number(catData.totalItems || docs.length);
              const hasMore = totalItems > docs.length;
              return { 
                docs, 
                lastDoc: lastSku, 
                fromChunk: true,
                totalItems,
                hasMore
              };
            }
          }
        } catch (chunkErr) {
          console.warn("Category chunk read failed, falling back to direct query:", chunkErr);
        }
      }

      // 🛡️ TIER 2: Direct products query fallback with zero-extra-read string cursor
      const productsRef = collection(db, getCollectionPath('products'));
      
      let q;
      if (!lastVisible) {
        q = query(
          productsRef, 
          where("category_lower", "==", targetCategory), 
          orderBy(documentId(), "asc"), 
          limit(limitCount)
        );
      } else {
        q = query(
          productsRef, 
          where("category_lower", "==", targetCategory), 
          orderBy(documentId(), "asc"), 
          startAfter(lastVisible), 
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);
      let docs = snapshot.docs.map(doc => this.normalizeProductData({ id: doc.id, ...doc.data() }));
      const lastDoc = docs.length > 0 ? docs[docs.length - 1].id : null;
      
      // 🛡️ Resilient Fallback: If no products found via category_lower on first page, fallback to match exact cleanCategory
      if (docs.length === 0 && !lastVisible && cleanCategory && cleanCategory.toLowerCase() !== targetCategory) {
        const fallbackQ = query(
          productsRef, 
          where("category", "==", cleanCategory), 
          orderBy(documentId(), "asc"), 
          limit(limitCount)
        );
        const fallbackSnap = await getDocs(fallbackQ);
        if (!fallbackSnap.empty) {
          docs = fallbackSnap.docs.map(doc => this.normalizeProductData({ id: doc.id, ...doc.data() }));
        }
      }

      return { docs, lastDoc, fromChunk: false };
    } catch (error) {
      console.error("Error fetching products by category:", error);
      throw error;
    }
  },

  extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = String(url).match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
};
