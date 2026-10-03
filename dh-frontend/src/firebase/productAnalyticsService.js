import { analytics } from './config';
import { logEvent } from 'firebase/analytics';

/**
 * 📊 GA4 Product Telemetry Service
 * Emits standard E-commerce product events without blocking UI execution.
 */

export const trackProductView = (product, selectedVariantInfo) => {
  if (!analytics || !product) return;
  try {
    const activeInfo = selectedVariantInfo || product;
    const price = activeInfo.salePrice || activeInfo.price || 0;
    const variantName = activeInfo.variantAttributes 
      ? Object.values(activeInfo.variantAttributes).join(' / ') 
      : undefined;

    logEvent(analytics, 'view_item', {
      currency: 'THB',
      value: price,
      items: [{
        item_id: activeInfo.id || product.id,
        item_name: product.name,
        item_brand: product.brand || 'DH Standard',
        item_category: product.category || 'General',
        price: price,
        item_variant: variantName
      }]
    });
  } catch (err) {
    console.debug('[GA4 Telemetry] view_item suppressed:', err?.message);
  }
};

export const trackAddToCart = (product, selectedVariantInfo, quantity = 1) => {
  if (!analytics || !product) return;
  try {
    const activeInfo = selectedVariantInfo || product;
    const price = activeInfo.salePrice || activeInfo.price || 0;
    const variantName = activeInfo.variantAttributes 
      ? Object.values(activeInfo.variantAttributes).join(' / ') 
      : undefined;

    logEvent(analytics, 'add_to_cart', {
      currency: 'THB',
      value: price * quantity,
      items: [{
        item_id: activeInfo.id || product.id,
        item_name: product.name,
        item_brand: product.brand || 'DH Standard',
        item_category: product.category || 'General',
        price: price,
        quantity: quantity,
        item_variant: variantName
      }]
    });
  } catch (err) {
    console.debug('[GA4 Telemetry] add_to_cart suppressed:', err?.message);
  }
};

export const trackMarketplaceClick = (platform, product) => {
  if (!analytics || !product) return;
  try {
    logEvent(analytics, 'select_content', {
      content_type: 'marketplace_outbound',
      item_id: product.id,
      platform: platform,
      destination_url: platform === 'shopee' ? product.shopeeUrl : (platform === 'lazada' ? product.lazadaUrl : 'line')
    });
  } catch (err) {
    console.debug('[GA4 Telemetry] select_content suppressed:', err?.message);
  }
};
