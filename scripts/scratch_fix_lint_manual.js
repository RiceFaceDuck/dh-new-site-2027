const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'dh-frontend', 'src');

function fixFile(relPath, replacer) {
  const fullPath = path.join(root, relPath);
  if (fs.existsSync(fullPath)) {
    const original = fs.readFileSync(fullPath, 'utf8');
    const updated = replacer(original);
    if (original !== updated) {
      fs.writeFileSync(fullPath, updated, 'utf8');
      console.log('Fixed', relPath);
    }
  }
}

// 1. HardwareScanner.jsx
fixFile('pages/HardwareScanner/HardwareScanner.jsx', (content) => {
  return content
    .replace(/error,\n/g, '\n') // remove unused error
    .replace(/const { error } =/g, 'const {} =')
    .replace(/"เสีย"/g, '&quot;เสีย&quot;')
    .replace(/"ดี"/g, '&quot;ดี&quot;')
    .replace(/"ไม่มีประกัน"/g, '&quot;ไม่มีประกัน&quot;')
    .replace(/"หมดอายุ"/g, '&quot;หมดอายุ&quot;');
});

// 2. ProvidersPage.jsx
fixFile('pages/Providers/ProvidersPage.jsx', (content) => {
  return content
    .replace(/"พาร์ทเนอร์"/g, '&quot;พาร์ทเนอร์&quot;')
    .replace(/"ขายส่ง"/g, '&quot;ขายส่ง&quot;');
});

// 3. SearchPage.jsx
fixFile('pages/SearchPage.jsx', (content) => {
  return content
    .replace(/import { safeJsonParse }/g, '// import { safeJsonParse }')
    .replace(/"เสีย"/g, '&quot;เสีย&quot;')
    .replace(/"ดี"/g, '&quot;ดี&quot;')
    .replace(/"ไม่มีประกัน"/g, '&quot;ไม่มีประกัน&quot;')
    .replace(/"หมดอายุ"/g, '&quot;หมดอายุ&quot;')
    .replace(/"ลื่นไหล"/g, '&quot;ลื่นไหล&quot;');
});

// 4. CookiePolicy.jsx
fixFile('pages/legal/CookiePolicy.jsx', (content) => {
  return content.replace(/"คุกกี้"/g, '&quot;คุกกี้&quot;');
});

// 5. TermsOfService.jsx
fixFile('pages/legal/TermsOfService.jsx', (content) => {
  return content.replace(/"บริการ"/g, '&quot;บริการ&quot;');
});

// 6. StoreProfileInfo.jsx - duplicate props
fixFile('pages/StoreProfile/components/StoreProfileInfo.jsx', (content) => {
  // It has <img src={img} ... loading="lazy" loading="lazy"> from previous script.
  return content.replace(/loading="lazy"\s*loading="lazy"/g, 'loading="lazy"');
});

// 7. Remove unused `appId` in AdProductDetail, StoreProfilePage, PartnerAds, PartnerReviews
const filesWithAppId = [
  'pages/AdProductDetail/AdProductDetail.jsx',
  'pages/StoreProfile/StoreProfilePage.jsx',
  'pages/StoreProfile/components/PartnerAds.jsx',
  'pages/StoreProfile/components/PartnerReviews.jsx'
];
filesWithAppId.forEach(file => {
  fixFile(file, (content) => content.replace(/const { appId } =/g, 'const { } =').replace(/const { id, appId } =/g, 'const { id } ='));
});

// 8. Remove `location` in ProductDetail
fixFile('pages/ProductDetail.jsx', (content) => {
  return content.replace(/const location = useLocation\(\);/g, '');
});

// 9. Remove `permissionRequested` in useProvidersList.js
fixFile('pages/Providers/hooks/useProvidersList.js', (content) => {
  return content.replace(/const \[permissionRequested, setPermissionRequested\] = useState\(false\);/g, '')
                .replace(/setPermissionRequested\(true\);/g, '');
});

// 10. Remove `rows` in Pitch.jsx
fixFile('pages/Squad/components/Pitch.jsx', (content) => {
  return content.replace(/rows={4}/g, '').replace(/const { rows } =/g, 'const { } =');
});

console.log("Auto-fixes complete.");
