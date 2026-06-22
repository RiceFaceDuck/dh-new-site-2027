import { doc, getDoc } from 'firebase/firestore';
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
    try {
      const docRef = doc(db, "products", sku);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const rawData = docSnap.data();
      return this.normalizeProductData({ id: docSnap.id, ...rawData });
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
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
