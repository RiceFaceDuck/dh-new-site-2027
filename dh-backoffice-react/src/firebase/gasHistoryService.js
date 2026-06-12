import { auth } from './config.js';

// The Google Apps Script Web App URL deployed by the user
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwdYyuYHv2BqJqx0ksRZyB8iAWLKO2y465Tbio03CTazBMBXh-KrRqaAEAGKtyUnBa4kg/exec';

class GasHistoryService {
  constructor() {
    this.queue = [];
    this.isFlushing = false;
    this.flushInterval = null;
    this.MAX_QUEUE_SIZE = 15; // Flush immediately if queue reaches this size
    this.FLUSH_INTERVAL_MS = 5000; // Otherwise, flush every 5 seconds
    this.globalProfile = null; // Store user profile from AuthContext
    
    this._startQueueTimer();
  }

  setProfile(profile) {
    this.globalProfile = profile;
  }

  _startQueueTimer() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flushInterval = setInterval(() => {
      this._flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Adds a highly detailed log to the queue.
   * @param {Object} params - The log parameters
   * @param {string} params.level - 'INFO', 'WARN', 'ERROR'
   * @param {string} params.module - e.g., 'INVENTORY', 'BILLING', 'CLAIM'
   * @param {string} params.action - e.g., 'UPDATE_STOCK', 'CREATE_ORDER'
   * @param {Object} [params.target] - { id: '...', name: '...', type: '...' }
   * @param {Object} [params.result] - { status: 'SUCCESS'|'FAILED', ... }
   * @param {Object} [params.details] - Any extra deep details, including changes { old: X, new: Y }
   * @param {Object} [params.actorOverride] - If we want to override the current user
   */
  log({ level = 'INFO', module = 'SYSTEM', action, target = {}, result = { status: 'SUCCESS' }, details = {}, actorOverride = null }) {
    try {
      const currentUser = auth.currentUser;
      
      // Build the actor profile automatically
      const actor = actorOverride || {
        uid: currentUser?.uid || this.globalProfile?.uid || 'SYSTEM_AUTO',
        name: this.globalProfile?.firstName || this.globalProfile?.nickname || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Unknown User',
        email: currentUser?.email || this.globalProfile?.email || 'N/A',
        userAgent: navigator.userAgent,
      };

      // Build context automatically
      const context = {
        url: window.location.href,
        path: window.location.pathname,
      };

      const logEntry = {
        level,
        module,
        action,
        actor,
        context,
        target,
        result,
        details,
        client_timestamp: new Date().toISOString(),
      };

      this.queue.push(logEntry);

      if (this.queue.length >= this.MAX_QUEUE_SIZE) {
        this._flush();
      }
    } catch (err) {
      console.error("Failed to construct history log", err);
    }
  }

  async _flush() {
    if (this.queue.length === 0 || this.isFlushing) return;

    this.isFlushing = true;
    const batch = [...this.queue];
    this.queue = []; // clear queue immediately to accept new logs

    try {
      // POST without expecting a CORS preflight failure by using mode: 'no-cors' 
      // Wait, GAS returns JSON. If we use no-cors, we can't read the response.
      // GAS Web Apps deployed to execute as "Me" and access "Anyone" allow standard CORS if doPost returns ContentService.createTextOutput().setMimeType(JSON).
      
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // GAS handles text/plain best to avoid CORS preflight options issues
        },
        body: JSON.stringify(batch)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // If we care about the response:
      // const resData = await response.json();
      // console.log("Flush success", resData);

    } catch (error) {
      console.error("🔥 Failed to flush logs to GAS:", error);
      // Re-queue the failed logs at the front
      this.queue = [...batch, ...this.queue];
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Fetches logs for a specific date from GAS
   * @param {string} dateStr - 'YYYY-MM-DD'
   * @param {string} module - Optional module filter
   * @param {string} level - Optional level filter
   * @param {string} keyword - Optional search keyword
   * @param {number} limit - Max records
   * @returns {Promise<Array>} List of log objects
   */
  async getLogs({ dateStr, module = 'ALL', level = 'ALL', keyword = '', limit = 1000 }) {
    try {
      const url = new URL(GAS_WEB_APP_URL);
      if (dateStr) url.searchParams.append('date', dateStr);
      if (module && module !== 'ALL') url.searchParams.append('module', module);
      if (level && level !== 'ALL') url.searchParams.append('level', level);
      if (keyword) url.searchParams.append('keyword', keyword);
      if (limit) url.searchParams.append('limit', limit);

      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      if (result.status === 'success') {
        return result.data || [];
      } else {
        throw new Error(result.message || 'Unknown error from GAS');
      }
    } catch (error) {
      console.error("🔥 Error fetching logs from GAS:", error);
      return [];
    }
  }
}

export const gasHistoryService = new GasHistoryService();
