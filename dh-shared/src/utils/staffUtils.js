/**
 * Staff utility functions for DH Notebook monorepo.
 * Resolves staff nicknames, role display labels, and permissions.
 */

export function getStaffNickname(order, staffMap = {}) {
  if (!order) return 'N/A';
  
  const rawNickname = order.staffNickname;
  const isValidNickname = rawNickname && rawNickname !== 'POS' && rawNickname !== 'System';
  if (isValidNickname) return rawNickname;
  
  const isWebOrder = Boolean(order.isWebOrder || order.channel === 'storefront' || order.source === 'storefront');
  if (isWebOrder) {
    const handlerId = order.openedBy || order.staffUid || order.staffId;
    if (handlerId && staffMap[handlerId]) {
      const s = staffMap[handlerId];
      return s.nickname || s.displayName || s.name || s.email?.split('@')[0] || handlerId;
    }
    return null;
  }

  const staffId = order.staffId || order.createdBy || order.salespersonId;
  if (staffId && staffMap[staffId]) {
    const s = staffMap[staffId];
    return s.nickname || s.displayName || s.name || s.email?.split('@')[0] || staffId;
  }
  
  const rawCreatedByName = order.createdByName || order.createdBy;
  if (rawCreatedByName && rawCreatedByName !== 'POS' && rawCreatedByName !== 'System') {
    return rawCreatedByName;
  }
  
  return 'พนักงาน';
}

export function isStaffRole(role) {
  const staffRoles = ['staff', 'manager', 'admin', 'owner', 'ช่าง', 'พนักงานแพ็ค', 'พนักงานทั่วไป', 'บัญชี'];
  return staffRoles.includes(role);
}

export function isManagerOrAdminRole(role) {
  const elevatedRoles = ['manager', 'admin', 'owner', 'ผู้จัดการ', 'แอดมิน', 'เจ้าของ'];
  return elevatedRoles.includes(role);
}
