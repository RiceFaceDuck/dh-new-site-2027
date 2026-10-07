import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('🚀 Running Verification Test: Profile Orders Count Metric (Zero-Leak Real Order Counting)');

// 1. Verify useUserOrderCount.js
const hookPath = path.resolve('dh-frontend/src/firebase/user/useUserOrderCount.js');
assert(fs.existsSync(hookPath), 'useUserOrderCount.js exists');
const hookSrc = fs.readFileSync(hookPath, 'utf8');

assert(hookSrc.includes('getCountFromServer'), 'Uses getCountFromServer for minimal read quota');
assert(hookSrc.includes('CACHE_TTL_MS = 5 * 60 * 1000'), 'Enforces 5-minute memory cache');
assert(hookSrc.includes('export const useUserOrderCount'), 'Exports useUserOrderCount');
console.log('✅ 1. useUserOrderCount hook verified');

// 2. Verify ProfileSidebar.jsx integrates useUserOrderCount
const sidebarPath = path.resolve('dh-frontend/src/components/profile/ProfileSidebar.jsx');
assert(fs.existsSync(sidebarPath), 'ProfileSidebar.jsx exists');
const sidebarSrc = fs.readFileSync(sidebarPath, 'utf8');

assert(sidebarSrc.includes("import { useUserOrderCount } from '../../firebase/user/useUserOrderCount';"), 'Imports useUserOrderCount');
assert(sidebarSrc.includes('const { count: totalOrders, loading: ordersLoading } = useUserOrderCount(user);'), 'Calls useUserOrderCount');
assert(sidebarSrc.includes('totalOrders.toLocaleString()'), 'Renders formatted totalOrders');
assert(!sidebarSrc.includes('{user?.stats?.totalOrders?.toLocaleString() || 0}'), 'Replaced static frozen stats count');
console.log('✅ 2. ProfileSidebar integration verified');

console.log('🎉 ALL PROFILE ORDERS COUNT VERIFICATION TESTS PASSED SUCCESSFULLY!');
