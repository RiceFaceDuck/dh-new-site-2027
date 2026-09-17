/**
 * Staff utility functions for DH Notebook monorepo.
 * Resolves staff nicknames, role display labels, and permissions.
 */

export function getStaffNickname(order, staffMap = {}) {
  if (!order) return 'N/A';
  if (order.staffNickname) return order.staffNickname;
  
  const staffId = order.staffId || order.createdBy || order.salespersonId;
  if (staffId && staffMap[staffId]) {
    const s = staffMap[staffId];
    return s.nickname || s.displayName || s.name || s.email?.split('@')[0] || staffId;
  }
  
  return order.createdByName || order.createdBy || 'N/A';
}

export function isStaffRole(role) {
  const staffRoles = ['staff', 'manager', 'admin', 'owner', 'ช่าง', 'พนักงานแพ็ค', 'พนักงานทั่วไป', 'บัญชี'];
  return staffRoles.includes(role);
}

export function isManagerOrAdminRole(role) {
  const elevatedRoles = ['manager', 'admin', 'owner', 'ผู้จัดการ', 'แอดมิน', 'เจ้าของ'];
  return elevatedRoles.includes(role);
}
