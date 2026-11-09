import { describe, it, expect } from 'vitest';
import {
  getBangkokDateKey,
  resolveStoreViewMetrics
} from './storeMetricsHelper.js';

describe('dh-shared/storeMetricsHelper', () => {
  describe('getBangkokDateKey', () => {
    it('formats Date objects in Asia/Bangkok timezone (UTC+7)', () => {
      // 2026-11-09 16:59:59 UTC = 2026-11-09 23:59:59 Bangkok
      const beforeMidnight = new Date('2026-11-09T16:59:59.000Z');
      expect(getBangkokDateKey(beforeMidnight)).toBe('2026-11-09');

      // 2026-11-09 17:00:00 UTC = 2026-11-10 00:00:00 Bangkok
      const atMidnight = new Date('2026-11-09T17:00:00.000Z');
      expect(getBangkokDateKey(atMidnight)).toBe('2026-11-10');
    });

    it('handles numeric timestamps and ISO strings', () => {
      const ts = new Date('2026-05-15T03:00:00.000Z').getTime();
      expect(getBangkokDateKey(ts)).toBe('2026-05-15');
      expect(getBangkokDateKey('2026-05-15T03:00:00.000Z')).toBe('2026-05-15');
    });

    it('handles Firestore Timestamp like objects with toDate()', () => {
      const mockTimestamp = {
        toDate: () => new Date('2026-12-31T20:00:00.000Z')
      };
      // 20:00 UTC on 2026-12-31 = 03:00 UTC+7 on 2027-01-01
      expect(getBangkokDateKey(mockTimestamp)).toBe('2027-01-01');
    });

    it('falls back safely for null, undefined, or invalid inputs', () => {
      const todayKey = getBangkokDateKey(new Date());
      expect(getBangkokDateKey(null)).toBe(todayKey);
      expect(getBangkokDateKey(undefined)).toBe(todayKey);
      expect(getBangkokDateKey('invalid-date')).toBe(todayKey);
    });
  });

  describe('resolveStoreViewMetrics', () => {
    const fixedNow = new Date('2026-11-09T10:00:00.000Z'); // Bangkok date: 2026-11-09
    const todayStr = '2026-11-09';
    const yesterdayStr = '2026-11-08';

    it('returns zeroes for null, undefined, or empty partner document', () => {
      expect(resolveStoreViewMetrics(null, null, fixedNow)).toEqual({
        allTime: 0,
        today: 0,
        dateKey: todayStr
      });
      expect(resolveStoreViewMetrics({}, null, fixedNow)).toEqual({
        allTime: 0,
        today: 0,
        dateKey: todayStr
      });
    });

    it('preserves legacy viewCount and viewsCount via Math.max (protecting against nullish coalescing trap)', () => {
      // Historical store with 150 views and desynced views.allTime = 1
      const legacyPartner = {
        viewCount: 150,
        views: {
          allTime: 1,
          today: 1,
          dateKey: todayStr
        }
      };
      const result = resolveStoreViewMetrics(legacyPartner, null, fixedNow);
      expect(result.allTime).toBe(150); // Must NOT drop to 1!
      expect(result.today).toBe(1);
    });

    it('performs lazy rollover on read when views.dateKey is from yesterday', () => {
      const partner = {
        viewCount: 200,
        views: {
          allTime: 200,
          today: 45,
          dateKey: yesterdayStr
        }
      };
      const result = resolveStoreViewMetrics(partner, null, fixedNow);
      expect(result.allTime).toBe(200);
      expect(result.today).toBe(0); // Lazy rollover to 0
      expect(result.dateKey).toBe(todayStr);
    });

    it('reconciles with active localLock using Monotonic Max Ceiling', () => {
      const partner = {
        viewCount: 10,
        views: {
          allTime: 10,
          today: 3,
          dateKey: todayStr
        }
      };
      const activeLock = {
        expiresAt: fixedNow.getTime() + 1800000,
        dateKey: todayStr,
        targetViews: 11,
        targetToday: 4
      };
      const result = resolveStoreViewMetrics(partner, activeLock, fixedNow);
      expect(result.allTime).toBe(11);
      expect(result.today).toBe(4);

      // If remote already committed higher (e.g. 15), monotonic max ceiling keeps 15, not dropping or adding
      const remoteCommittedPartner = {
        viewCount: 15,
        views: {
          allTime: 15,
          today: 8,
          dateKey: todayStr
        }
      };
      const resultAfterCommit = resolveStoreViewMetrics(remoteCommittedPartner, activeLock, fixedNow);
      expect(resultAfterCommit.allTime).toBe(15);
      expect(resultAfterCommit.today).toBe(8);
    });

    it('isolates midnight delta: lock from yesterday does NOT bleed into today count', () => {
      const partner = {
        viewCount: 10,
        views: {
          allTime: 10,
          today: 0,
          dateKey: todayStr
        }
      };
      const yesterdayLock = {
        expiresAt: fixedNow.getTime() + 600000,
        dateKey: yesterdayStr, // yesterday
        targetViews: 11,
        targetToday: 5
      };
      const result = resolveStoreViewMetrics(partner, yesterdayLock, fixedNow);
      expect(result.allTime).toBe(11); // All-time respects monotonic target
      expect(result.today).toBe(0);    // Today is isolated: 0, does not bleed yesterday target
    });

    it('ignores expired localLock', () => {
      const partner = {
        viewCount: 5,
        views: {
          allTime: 5,
          today: 2,
          dateKey: todayStr
        }
      };
      const expiredLock = {
        expiresAt: fixedNow.getTime() - 1000, // expired
        dateKey: todayStr,
        targetViews: 10,
        targetToday: 7
      };
      const result = resolveStoreViewMetrics(partner, expiredLock, fixedNow);
      expect(result.allTime).toBe(5);
      expect(result.today).toBe(2);
    });
  });
});
