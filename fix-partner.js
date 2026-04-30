const fs = require('fs');

const file = 'dh-frontend/src/firebase/partnerService.js';
let content = fs.readFileSync(file, 'utf8');

// Fix appId
content = content.replace(/typeof __app_id !== 'undefined' \? __app_id : 'default-app-id'/, 'typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id"');

content = content.replace(/  try \{\n    const partnerRef = doc\(db, 'artifacts', appId, 'public', 'data', 'partners', userId\);\n    let coords = \{\};\n    if \(partnerData\?\.mapsUrl\) \{\n      const extracted = extractCoordsFromUrl\(partnerData\.mapsUrl\);\n      if \(extracted\) coords = extracted;\n    \}\n    const payload = \{ \.\.\.partnerData, \.\.\.coords, isActive, updatedAt: new Date\(\)\.toISOString\(\) \};\n    await setDoc\(partnerRef, payload, \{ merge: true \}\);\n    cachedPartners = null; \n    lastFetchTime = 0;\n    return true;\n  \} catch \(error\) \{\n    throw error;\n  \}/, "  const partnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'partners', userId);\n  let coords = {};\n  if (partnerData?.mapsUrl) {\n    const extracted = extractCoordsFromUrl(partnerData.mapsUrl);\n    if (extracted) coords = extracted;\n  }\n  const payload = { ...partnerData, ...coords, isActive, updatedAt: new Date().toISOString() };\n  await setDoc(partnerRef, payload, { merge: true });\n  cachedPartners = null; \n  lastFetchTime = 0;\n  return true;");

fs.writeFileSync(file, content, 'utf8');
