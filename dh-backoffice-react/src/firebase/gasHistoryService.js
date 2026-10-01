import { auth, db } from './config.js';
import { addDoc, collection, getDocs, query, where, limit, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared';

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
    this._registerUnloadEvents();
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

  _registerUnloadEvents() {
    // Unload events are no longer needed for data preservation since we use the Firestore Outbox Pattern.
    // Data is safely stored in 'gas_outbox' immediately upon calling log().
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

      // Outbox Pattern: Save to Firestore immediately instead of memory queue
      
      // Helper to deeply remove undefined fields which cause Firestore errors
      const removeUndefined = (obj) => {
        if (Array.isArray(obj)) return obj.map(removeUndefined);
        if (obj && typeof obj === 'object') {
          if (typeof obj.toDate === 'function') return obj; // Preserve Firestore Timestamp
          if (obj instanceof Date) return obj; // Preserve Date
          return Object.fromEntries(
            Object.entries(obj)
              .filter(([_, v]) => v !== undefined)
              .map(([k, v]) => [k, removeUndefined(v)])
          );
        }
        return obj;
      };

      const cleanedLogEntry = removeUndefined(logEntry);

      addDoc(collection(db, getCollectionPath('gas_outbox')), {
        payload: cleanedLogEntry,
        status: 'pending',
        creatorUid: actor.uid || 'anonymous',
        createdAt: serverTimestamp()
      }).catch(err => console.error("Failed to enqueue gas history to outbox:", err));
    } catch (err) {
      console.error("Failed to construct history log", err);
    }
  }

  async _flush() {
    if (this.isFlushing) return;
    this.isFlushing = true;

    try {
      const outboxRef = collection(db, getCollectionPath('gas_outbox'));
      const q = query(
        outboxRef,
        where('status', '==', 'pending'),
        limit(this.MAX_QUEUE_SIZE || 15)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        this.isFlushing = false;
        return;
      }

      const batch = [];
      const docRefs = [];
      snapshot.forEach(docSnap => {
        batch.push(docSnap.data().payload);
        docRefs.push(docSnap.ref);
      });

      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify(batch)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // ✅ SUCCESS: Delete processed logs from outbox to free up quota
      const batchDelete = writeBatch(db);
      docRefs.forEach(ref => batchDelete.delete(ref));
      await batchDelete.commit();

    } catch (error) {
      console.error("🔥 Failed to flush outbox logs to GAS:", error);
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
