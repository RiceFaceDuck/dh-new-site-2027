/**
 * Utility for store profile view metrics calculations and Bangkok timezone handling.
 * Pure functional module with zero side-effects and zero UI/DOM dependencies.
 */

/**
 * Returns a date key formatted as 'YYYY-MM-DD' in the 'Asia/Bangkok' timezone (UTC+7).
 * Handles Date objects, Firestore Timestamps, numeric timestamps, and ISO strings.
 * 
 * @param {Date|Object|number|string} [date=new Date()]
 * @returns {string} Formatted date key, e.g. "2026-11-09"
 */
export const getBangkokDateKey = (date = new Date()) => {
  let d = date;
  if (!d) {
    d = new Date();
  } else if (typeof d?.toDate === 'function') {
    d = d.toDate();
  } else if (typeof d === 'number' || typeof d === 'string') {
    d = new Date(d);
  } else if (!(d instanceof Date)) {
    d = new Date(d);
  }

  if (isNaN(d.getTime())) {
    d = new Date();
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
};

const safeNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Resolves multi-period store view metrics with:
 * 1. Historical legacy viewCount preservation (Math.max guard)
 * 2. Client-side Lazy Rollover on Read (evaluates today = 0 at midnight with 0 DB writes)
 * 3. Local cross-tab lock reconciliation with Monotonic Max Ceiling
 * 4. Midnight delta isolation (protects today's count from yesterday's local lock)
 * 
 * Flexible signature accommodates:
 * - resolveStoreViewMetrics(partner, localLock, now)
 * - resolveStoreViewMetrics(partner, localLock)
 * - resolveStoreViewMetrics(partner, now)
 * 
 * @param {Object} partner Store partner document
 * @param {Object|Date} [localLockOrDate=null] Local storage lock object OR Date for simulation
 * @param {Date} [maybeNow=null] Explicit Date instance for deterministic testing
 * @returns {{ allTime: number, today: number, dateKey: string }}
 */
export const resolveStoreViewMetrics = (partner, localLockOrDate = null, maybeNow = null) => {
  let localLock = null;
  let now = new Date();

  // Flexible argument sniffing for deterministic testing compatibility
  if (localLockOrDate instanceof Date || (localLockOrDate && typeof localLockOrDate.getTime === 'function')) {
    now = localLockOrDate;
    localLock = (maybeNow && typeof maybeNow === 'object' && !(maybeNow instanceof Date)) ? maybeNow : null;
  } else {
    localLock = localLockOrDate;
    if (maybeNow instanceof Date || (maybeNow && typeof maybeNow.getTime === 'function')) {
      now = maybeNow;
    }
  }

  const todayKey = getBangkokDateKey(now);
  const rawViews = partner?.views;

  // 1. All-Time: Math.max historical legacy preservation
  const remoteAllTime = Math.max(
    safeNumber(rawViews?.allTime),
    safeNumber(partner?.viewCount),
    safeNumber(partner?.viewsCount)
  );

  // 2. Today: Lazy rollover on read
  const remoteToday = (rawViews?.dateKey === todayKey)
    ? safeNumber(rawViews?.today)
    : 0;

  // 3. Local Lock Reconciliation (Monotonic Max + Midnight Isolation)
  let finalAllTime = remoteAllTime;
  let finalToday = remoteToday;

  const currentTime = (now instanceof Date && !isNaN(now.getTime())) ? now.getTime() : Date.now();

  if (localLock && typeof localLock === 'object' && localLock.expiresAt > currentTime) {
    if (typeof localLock.targetViews === 'number' && Number.isFinite(localLock.targetViews)) {
      finalAllTime = Math.max(remoteAllTime, localLock.targetViews);
    }
    if (localLock.dateKey === todayKey && typeof localLock.targetToday === 'number' && Number.isFinite(localLock.targetToday)) {
      finalToday = Math.max(remoteToday, localLock.targetToday);
    }
  }

  return {
    allTime: Math.max(0, finalAllTime),
    today: Math.max(0, finalToday),
    dateKey: todayKey
  };
};
