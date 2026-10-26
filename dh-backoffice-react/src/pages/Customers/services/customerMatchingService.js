/**
 * Customer Matching & Profile Gap Analysis Service (Pure Domain Layer)
 * 
 * Provides deterministic confidence scoring, Thai name normalization,
 * Storefront Golden Record prioritization, and safe gap-filling computation.
 * 
 * Core Invariant: Zero direct mutation, pure JS functions, 0 Firestore reads.
 */

/**
 * Normalizes phone numbers to standard 10-digit Thai format.
 * Strips whitespace, dashes, parentheticals, and converts +66 / 66 prefixes.
 * 
 * @param {string|number} phone 
 * @returns {string} Normalized 10-digit number or empty string
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('66') && p.length >= 11) {
    p = '0' + p.slice(2);
  }
  return p;
}

/**
 * Normalizes Thai store and customer names for fuzzy/clean comparison.
 * Strips formal prefixes ("ร้าน", "คุณ", "ช่าง", "บจก.", "หจก.", "บริษัท", "นาย", "นาง", "นางสาว"),
 * punctuation, and excessive spaces.
 * 
 * @param {string} text 
 * @returns {string} Clean lowercase text
 */
export function normalizeThaiText(text) {
  if (!text) return '';
  let s = String(text).trim().toLowerCase();
  
  // Strip common Thai commercial and honorific prefixes
  const prefixes = [
    /^(ร้าน|ช่าง|คุณ|บจก\.|หจก\.|บริษัท|ห้างหุ้นส่วนจำกัด|นาย|นางสาว|นาง)\s*/i,
    /^(ร้านค้า|บ\.|หจก)\s*/i
  ];
  
  for (const prefix of prefixes) {
    s = s.replace(prefix, '');
  }
  
  // Remove non-word characters except Thai and standard alphanumeric
  s = s.replace(/[^\u0E00-\u0E7Fa-z0-9]/gi, '');
  return s.trim();
}

/**
 * Calculates deterministic match confidence score (0 to 100) between parsed
 * quick-paste input and an existing customer directory candidate.
 * 
 * @param {Object} parsed - Parsed data from Quick Paste { phone, customerName, storeName, email, lineId, zipCode, province }
 * @param {Object} candidate - Existing customer object from in-memory cache
 * @returns {{ score: number, breakdown: Object, matchReasons: string[] }}
 */
export function calculateCustomerMatchScore(parsed = {}, candidate = {}) {
  let score = 0;
  const breakdown = {};
  const matchReasons = [];

  // 1. Phone Comparison (Weight: 45 pts)
  const parsedPhone = normalizePhone(parsed.phone || parsed.phoneNumber);
  const candPhone = normalizePhone(candidate.phone || candidate.phoneNumber);
  if (parsedPhone && candPhone && parsedPhone === candPhone) {
    score += 45;
    breakdown.phone = 45;
    matchReasons.push('เบอร์โทรศัพท์ตรงกัน 100%');
  }

  // 2. Email Comparison (Weight: 40 pts)
  const parsedEmail = (parsed.email || '').trim().toLowerCase();
  const candEmail = (candidate.email || '').trim().toLowerCase();
  if (parsedEmail && candEmail && parsedEmail === candEmail) {
    score += 40;
    breakdown.email = 40;
    matchReasons.push('อีเมลตรงกัน');
  }

  // 3. Name & Store Name Comparison (Weight: up to 25 pts)
  const parsedNames = [
    normalizeThaiText(parsed.storeName),
    normalizeThaiText(parsed.customerName),
    normalizeThaiText(parsed.name)
  ].filter(Boolean);

  const candNames = [
    normalizeThaiText(candidate.storeName),
    normalizeThaiText(candidate.displayName),
    normalizeThaiText(candidate.accountName),
    normalizeThaiText(candidate.contactName),
    normalizeThaiText(candidate.firstName)
  ].filter(Boolean);

  let nameScore = 0;
  let nameMatchedStr = '';

  for (const pName of parsedNames) {
    if (pName.length < 2) continue;
    for (const cName of candNames) {
      if (cName.length < 2) continue;
      if (pName === cName) {
        nameScore = Math.max(nameScore, 25);
        nameMatchedStr = 'ชื่อร้าน/ชื่อผู้ติดต่อตรงกัน 100%';
        break;
      } else if (
        (pName.length >= 4 && cName.includes(pName)) ||
        (cName.length >= 4 && pName.includes(cName))
      ) {
        nameScore = Math.max(nameScore, 15);
        if (!nameMatchedStr) nameMatchedStr = 'ชื่อร้านหรือชื่อผู้ติดต่อใกล้เคียงมาก';
      }
    }
    if (nameScore === 25) break;
  }

  if (nameScore > 0) {
    score += nameScore;
    breakdown.name = nameScore;
    matchReasons.push(nameMatchedStr);
  }

  // 4. Postal / ZipCode & Province (Weight: 10 pts)
  const parsedZip = String(parsed.zipCode || parsed.postalCode || '').trim();
  const candZip = String(candidate.zipCode || candidate.postalCode || (candidate.address && candidate.address.zipCode) || '').trim();
  if (parsedZip && candZip && parsedZip === candZip) {
    score += 10;
    breakdown.address = 10;
    matchReasons.push('รหัสไปรษณีย์ตรงกัน');
  }

  // 5. Line ID (Weight: 15 pts)
  const parsedLine = (parsed.lineId || '').trim().toLowerCase().replace(/^@/, '');
  const candLine = (candidate.lineId || '').trim().toLowerCase().replace(/^@/, '');
  if (parsedLine && candLine && parsedLine === candLine) {
    score += 15;
    breakdown.lineId = 15;
    matchReasons.push('LINE ID ตรงกัน');
  }

  // 6. Storefront Golden Record Bonus (+10 pts)
  // Storefront accounts have auth emails, partner tiers, loyalty points, or web registration flags
  const isStorefront = !candidate.isManualCustomer && (
    Boolean(candidate.email) ||
    candidate.isWebRegistered ||
    candidate.source === 'storefront' ||
    (candidate.tier && String(candidate.tier).toUpperCase() !== 'MEMBER') ||
    ((candidate.creditPoints || candidate.totalAccumulatedPoints || 0) > 0) ||
    (candidate.role && candidate.role.toLowerCase().includes('partner'))
  );

  if (isStorefront && score >= 25) {
    score += 10;
    breakdown.storefrontBonus = 10;
    matchReasons.push('สมาชิกหน้าเว็บ (โบนัสความน่าเชื่อถือ)');
  }

  const finalScore = Math.min(100, score);
  return {
    score: finalScore,
    breakdown,
    matchReasons,
    isDefiniteMatch: finalScore >= 90,
    isProbableMatch: finalScore >= 60 && finalScore < 90
  };
}

/**
 * Performs Gap Analysis comparing candidate's profile against new incoming parsed data.
 * Identifies existing complete fields vs critical missing fields.
 * 
 * @param {Object} candidate - Existing customer
 * @param {Object} parsed - Parsed data from Quick Paste
 * @returns {Object} Gap analysis summary
 */
export function analyzeProfileGaps(candidate = {}, parsed = {}) {
  const existingItems = [];
  const missingItems = [];
  const fillableItems = [];

  // Check Name / Store Name
  const candidateName = candidate.storeName || candidate.displayName || candidate.accountName;
  if (candidateName) {
    existingItems.push({ label: 'ชื่อร้าน/ชื่อผู้ติดต่อ', value: candidateName });
  }

  // Check Email
  if (candidate.email) {
    existingItems.push({ label: 'อีเมล', value: candidate.email });
  }

  // Check Role & Tier
  if (candidate.tier || candidate.role) {
    existingItems.push({ label: 'ระดับสิทธิ์ / Tier', value: `${candidate.role || 'ทั่วไป'} (${candidate.tier || 'MEMBER'})` });
  }

  // Check Points
  const points = candidate.creditPoints ?? candidate.totalAccumulatedPoints ?? 0;
  if (points > 0) {
    existingItems.push({ label: 'แต้มสะสม', value: `${points.toLocaleString()} แต้ม` });
  }

  // Helper to test if a candidate field value is truly empty (null, undefined, empty string, or non-data dash "-")
  const isFieldEmpty = (val) => {
    if (val === undefined || val === null) return true;
    const str = String(val).trim();
    return str === '' || str === '-' || str === '--' || str === 'null' || str === 'undefined';
  };

  // Check Phone Gap
  const candPhone = candidate.phone || candidate.phoneNumber;
  const hasCandPhone = !isFieldEmpty(candPhone) && normalizePhone(candPhone).length >= 9;
  const parsedPhone = parsed.phone || parsed.phoneNumber;
  if (hasCandPhone) {
    existingItems.push({ label: 'เบอร์โทรศัพท์', value: candidate.phone || candidate.phoneNumber });
  } else {
    missingItems.push({ field: 'phone', label: 'เบอร์โทรศัพท์ติดต่อ' });
    if (parsedPhone && normalizePhone(parsedPhone).length >= 9) {
      fillableItems.push({ field: 'phone', label: 'เบอร์โทรศัพท์', value: parsed.formattedPhone || parsedPhone });
    }
  }

  // Check Address Gap
  const candAddress = candidate.address || {};
  const hasCandAddress = !isFieldEmpty(candidate.addressLine) || 
    !isFieldEmpty(candAddress.addressLine) || 
    !isFieldEmpty(candidate.province) || 
    !isFieldEmpty(candAddress.province);
  const hasParsedAddress = Boolean(
    parsed.addressLine || parsed.address || parsed.province || parsed.zipCode || parsed.postalCode
  );

  if (hasCandAddress) {
    const province = candidate.province || (candidate.address && candidate.address.province) || '';
    existingItems.push({ label: 'ที่อยู่จัดส่ง', value: province ? `จ.${province}` : 'มีข้อมูลที่อยู่แล้ว' });
  } else {
    missingItems.push({ field: 'address', label: 'ที่อยู่สำหรับจัดส่งสินค้า' });
    if (hasParsedAddress) {
      const addressPreview = [
        parsed.addressLine || parsed.address,
        parsed.subDistrict ? `ต.${parsed.subDistrict}` : '',
        parsed.district ? `อ.${parsed.district}` : '',
        parsed.province ? `จ.${parsed.province}` : '',
        parsed.zipCode || parsed.postalCode || ''
      ].filter(Boolean).join(' ');
      fillableItems.push({ field: 'address', label: 'ที่อยู่จัดส่งใหม่', value: addressPreview });
    }
  }

  // Check Logistics Preference Gap
  const candCourier = candidate.preferredCourier || candidate.logisticProvider;
  const parsedCourier = parsed.preferredCourier || parsed.logisticProvider || parsed.courier;
  if (!candCourier && parsedCourier) {
    missingItems.push({ field: 'logistic', label: 'ขนส่งที่สะดวก' });
    fillableItems.push({ field: 'logistic', label: 'ขนส่งที่ระบุในแชท', value: parsedCourier });
  }

  // Check LINE ID Gap
  if (!candidate.lineId && parsed.lineId) {
    missingItems.push({ field: 'lineId', label: 'LINE ID' });
    fillableItems.push({ field: 'lineId', label: 'LINE ID', value: parsed.lineId });
  }

  const isStorefront = !candidate.isManualCustomer && (
    Boolean(candidate.email) ||
    candidate.isWebRegistered ||
    candidate.source === 'storefront' ||
    (candidate.tier && String(candidate.tier).toUpperCase() !== 'MEMBER') ||
    ((candidate.creditPoints || candidate.totalAccumulatedPoints || 0) > 0) ||
    (candidate.role && candidate.role.toLowerCase().includes('partner'))
  );

  return {
    candidateId: candidate.id || candidate.uid || candidate.accountId,
    accountId: candidate.accountId || candidate.customerCode || candidate.id,
    storeName: candidateName || 'ลูกค้าไม่ระบุชื่อ',
    isStorefront,
    existingItems,
    missingItems,
    fillableItems,
    hasGaps: missingItems.length > 0 && fillableItems.length > 0
  };
}

/**
 * Computes a sanitized update payload to safely fill gaps in a candidate customer.
 * 
 * STRICT INVARIANT: Safe Gap-Filling ONLY.
 * Never overwrites non-empty existing fields.
 * Maintains Dual-Key Parity for Firestore and local caching standards.
 * 
 * @param {Object} candidate - Existing customer object
 * @param {Object} parsed - Parsed data from Quick Paste
 * @returns {{ hasUpdates: boolean, payload: Object }}
 */
export function computeSafeGapFilling(candidate = {}, parsed = {}) {
  const payload = {};
  let hasUpdates = false;

  // Helper to test if candidate value is empty (null, undefined, empty string, or placeholder dash "-")
  const isEmpty = (val) => {
    if (val === undefined || val === null) return true;
    const str = String(val).trim();
    return str === '' || str === '-' || str === '--' || str === 'null' || str === 'undefined';
  };

  // 1. Phone Dual-Key Parity
  const currentPhone = candidate.phone || candidate.phoneNumber;
  const newPhone = parsed.phone || parsed.phoneNumber;
  if (isEmpty(currentPhone) && !isEmpty(newPhone)) {
    const cleanPhone = normalizePhone(newPhone);
    payload.phone = cleanPhone;
    payload.phoneNumber = cleanPhone;
    hasUpdates = true;
  }

  // 2. Contact Name Dual-Key Parity
  const currentContact = candidate.contactName || candidate.firstName;
  const newContact = parsed.contactName || parsed.firstName || parsed.customerName;
  if (isEmpty(currentContact) && !isEmpty(newContact)) {
    payload.contactName = String(newContact).trim();
    payload.firstName = String(newContact).trim();
    hasUpdates = true;
  }

  // 3. Logistics Provider Dual-Key Parity
  const currentCourier = candidate.preferredCourier || candidate.logisticProvider;
  const newCourier = parsed.preferredCourier || parsed.logisticProvider || parsed.courier;
  if (isEmpty(currentCourier) && !isEmpty(newCourier)) {
    payload.preferredCourier = String(newCourier).trim();
    payload.logisticProvider = String(newCourier).trim();
    hasUpdates = true;
  }

  // 4. Shipping Notes Dual-Key Parity
  const currentNotes = candidate.shippingNotes || candidate.logisticNote;
  const newNotes = parsed.shippingNotes || parsed.logisticNote;
  if (isEmpty(currentNotes) && !isEmpty(newNotes)) {
    payload.shippingNotes = String(newNotes).trim();
    payload.logisticNote = String(newNotes).trim();
    hasUpdates = true;
  }

  // 5. Line ID
  if (isEmpty(candidate.lineId) && !isEmpty(parsed.lineId)) {
    payload.lineId = String(parsed.lineId).trim();
    hasUpdates = true;
  }

  // 6. Address & ZipCode Dual-Key Parity
  const candAddress = candidate.address || {};
  const candAddressLine = candidate.addressLine || candAddress.addressLine;
  const candZip = candidate.zipCode || candidate.postalCode || candAddress.zipCode || candAddress.postalCode;

  const newAddressLine = parsed.addressLine || parsed.address;
  const newZip = parsed.zipCode || parsed.postalCode;

  if (isEmpty(candAddressLine) && !isEmpty(newAddressLine)) {
    payload.addressLine = String(newAddressLine).trim();
    hasUpdates = true;
  }

  if (isEmpty(candidate.subDistrict || candAddress.subDistrict) && !isEmpty(parsed.subDistrict)) {
    payload.subDistrict = String(parsed.subDistrict).trim();
    hasUpdates = true;
  }

  if (isEmpty(candidate.district || candAddress.district) && !isEmpty(parsed.district)) {
    payload.district = String(parsed.district).trim();
    hasUpdates = true;
  }

  if (isEmpty(candidate.province || candAddress.province) && !isEmpty(parsed.province)) {
    payload.province = String(parsed.province).trim();
    hasUpdates = true;
  }

  if (isEmpty(candZip) && !isEmpty(newZip)) {
    const cleanZip = String(newZip).trim();
    payload.zipCode = cleanZip;
    payload.postalCode = cleanZip;
    hasUpdates = true;
  }

  // If address parts were added, also synthesize structured address object
  if (payload.addressLine || payload.subDistrict || payload.district || payload.province || payload.zipCode) {
    payload.address = {
      ...(candidate.address || {}),
      addressLine: payload.addressLine || candidate.addressLine || candAddress.addressLine || '',
      subDistrict: payload.subDistrict || candidate.subDistrict || candAddress.subDistrict || '',
      district: payload.district || candidate.district || candAddress.district || '',
      province: payload.province || candidate.province || candAddress.province || '',
      zipCode: payload.zipCode || candZip || '',
      postalCode: payload.postalCode || candZip || ''
    };
  }

  if (hasUpdates) {
    payload.updatedAt = Date.now();
  }

  return { hasUpdates, payload };
}

/**
 * Evaluates candidate list against parsed quick paste input in memory.
 * Sorts by match score descending, prioritizing storefront/partner accounts on ties.
 * 
 * @param {Object} parsed - Parsed customer data from quick paste
 * @param {Array<Object>} candidates - List of customer objects from in-memory cache
 * @param {number} minScoreThreshold - Minimum confidence score to recommend (default: 60)
 * @param {number} maxResults - Maximum number of matches to return (default: 3)
 * @returns {Array<Object>} List of matched candidates with score and gap analysis
 */
export function findBestCustomerMatches(parsed = {}, candidates = [], minScoreThreshold = 60, maxResults = 3) {
  if (!parsed || !Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const results = [];

  for (const candidate of candidates) {
    if (!candidate || (!candidate.id && !candidate.uid && !candidate.accountId)) continue;

    const match = calculateCustomerMatchScore(parsed, candidate);
    if (match.score >= minScoreThreshold) {
      const gapAnalysis = analyzeProfileGaps(candidate, parsed);
      results.push({
        candidate,
        score: match.score,
        breakdown: match.breakdown,
        matchReasons: match.matchReasons,
        isDefiniteMatch: match.isDefiniteMatch,
        gapAnalysis
      });
    }
  }

  // Sort descending by score, prioritizing storefront/partner Golden Records and points
  results.sort((a, b) => {
    // 1. Give priority to Storefront / Web Partner accounts when name matches (score >= 35)
    // to encourage linking with official web accounts instead of creating/using disconnected manual entries
    if (a.gapAnalysis.isStorefront !== b.gapAnalysis.isStorefront) {
      if (a.gapAnalysis.isStorefront && a.score >= 35) return -1;
      if (b.gapAnalysis.isStorefront && b.score >= 35) return 1;
    }
    if (b.score !== a.score) return b.score - a.score;
    const ptsA = a.candidate.creditPoints || a.candidate.totalAccumulatedPoints || 0;
    const ptsB = b.candidate.creditPoints || b.candidate.totalAccumulatedPoints || 0;
    return ptsB - ptsA;
  });

  return results.slice(0, maxResults);
}
