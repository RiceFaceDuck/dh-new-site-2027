import { analytics } from './config';
import { logEvent } from 'firebase/analytics';

/**
 * 📊 GA4 Footer Telemetry Service
 * Emits standard non-blocking interaction events for footer links, trust badges, and social hubs.
 * Completely immune to ad-blockers and missing analytics initialization.
 */
export const trackFooterClick = (category, label, destination = '') => {
  if (!analytics) return;
  try {
    logEvent(analytics, 'footer_click', {
      footer_category: category,
      footer_label: label,
      footer_destination: destination,
      event_timestamp: Date.now()
    });
  } catch (err) {
    // Non-blocking telemetry failure suppressed to prevent UX disruption
    console.debug('[GA4 Telemetry] footer_click suppressed:', err?.message);
  }
};
