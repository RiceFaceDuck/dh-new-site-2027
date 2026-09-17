/**
 * HTTP Resilience Client - network health monitoring utilities.
 */

/**
 * Checks if the application is currently online.
 * @returns {boolean}
 */
export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Adds event listeners for online/offline events.
 * @param {Function} onOnline 
 * @param {Function} onOffline 
 * @returns {Function} cleanup function
 */
export function subscribeToNetworkStatus(onOnline, onOffline) {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Pings a URL to check reachability.
 * @param {string} url 
 * @param {number} timeoutMs 
 * @returns {Promise<boolean>}
 */
export async function pingUrl(url, timeoutMs = 5000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * A resilient fetch wrapper with retry logic.
 * @param {string} url 
 * @param {object} options 
 * @param {number} retries 
 * @returns {Promise<Response>}
 */
export async function resilientFetch(url, options = {}, retries = 3) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && i < retries - 1) {
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (i < retries - 1) await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastError;
}
