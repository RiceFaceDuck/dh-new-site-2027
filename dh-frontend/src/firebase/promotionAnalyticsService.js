import { analytics } from './config';
import { logEvent } from 'firebase/analytics';

/**
 * 📊 GA4 Promotion Telemetry Service
 * Emits standard E-commerce promotion events without blocking UI execution.
 */

export const trackPromotionView = (promotions) => {
  if (!analytics || !promotions) return;
  try {
    const list = Array.isArray(promotions) ? promotions : [promotions];
    if (list.length === 0) return;

    const items = list.map(p => ({
      promotion_id: p.id || '',
      promotion_name: p.title || p.name || '',
      creative_name: p.type || 'PERCENTAGE',
      creative_slot: 'cart_banner'
    }));

    logEvent(analytics, 'view_promotion', {
      promotions: items
    });
  } catch (err) {
    console.debug('[GA4 Telemetry] view_promotion suppressed:', err?.message);
  }
};

export const trackPromotionSelect = (promo) => {
  if (!analytics || !promo) return;
  try {
    logEvent(analytics, 'select_promotion', {
      promotion_id: promo.id || '',
      promotion_name: promo.title || promo.name || '',
      creative_name: promo.type || 'PERCENTAGE',
      creative_slot: 'checkout_selector'
    });
  } catch (err) {
    console.debug('[GA4 Telemetry] select_promotion suppressed:', err?.message);
  }
};
