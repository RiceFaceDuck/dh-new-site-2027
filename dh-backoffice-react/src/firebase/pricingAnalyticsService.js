import { analytics } from './config';
import { logEvent } from 'firebase/analytics';

/**
 * 📊 GA4 Retail Pricing Telemetry Service
 * Emits non-blocking business intelligence events for Retail Pricing Engine.
 */

export const trackPricingView = (config) => {
  if (!analytics) return;
  try {
    logEvent(analytics, 'view_pricing_rules', {
      rules_count: Array.isArray(config?.rules) ? config.rules.length : 0,
      rounding_type: config?.rounding?.type || 'none',
      primary_target: config?.rounding?.primaryTarget || ''
    });
  } catch (err) {
    console.debug('[GA4 Telemetry] view_pricing_rules suppressed:', err?.message);
  }
};

export const trackPricingSave = (config) => {
  if (!analytics) return;
  try {
    logEvent(analytics, 'update_pricing_config', {
      rules_count: Array.isArray(config?.rules) ? config.rules.length : 0,
      rounding_type: config?.rounding?.type || 'none',
      primary_target: config?.rounding?.primaryTarget || '',
      has_fallback: Boolean(config?.rounding?.enableFallback),
      version: Number(config?.version) || 1
    });
  } catch (err) {
    console.debug('[GA4 Telemetry] update_pricing_config suppressed:', err?.message);
  }
};

export const trackSimulationRun = (simResult, simMode = 'sku', sku = '') => {
  if (!analytics || !simResult) return;
  try {
    logEvent(analytics, 'simulate_retail_price', {
      sim_mode: simMode,
      sku: sku || '',
      cost: Number(simResult.cost) || 0,
      calculated_price: Number(simResult.calculatedPrice) || 0,
      margin: Number(simResult.margin) || 0,
      margin_percent: parseFloat((Number(simResult.marginPercent) || 0).toFixed(1)),
      applied_rule_id: simResult.appliedRule?.id || 'none'
    });

    if (simResult.appliedRoundingType?.includes('ป้องกันขาดทุน')) {
      logEvent(analytics, 'pricing_floor_alert', {
        sku: sku || '',
        cost: Number(simResult.cost) || 0,
        forced_price: Number(simResult.calculatedPrice) || 0
      });
    }
  } catch (err) {
    console.debug('[GA4 Telemetry] simulate_retail_price suppressed:', err?.message);
  }
};
