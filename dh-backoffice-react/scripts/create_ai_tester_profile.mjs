import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

// Google Apps Script Webhooks
const DRIVE_AD_URL = "https://script.google.com/macros/s/AKfycbxz279aWlFHgMtvT_barDasX9-_VVNtZaMWzhesuiTBK0Vdd35xy2FGay3YSsZ30-hy7Q/exec";
const DRIVE_PRODUCT_URL = "https://script.google.com/macros/s/AKfycbzD3KW7juo-XNtw_kmPTPi2Pp4OtNVCAIQMGHdBVeUL1QPBQXgUhv3E_wRISEkOzML7/exec";

// Upload image helper
async function uploadImageToDrive(filePath, adType = 'GENERAL', targetUrl = DRIVE_AD_URL, fallbackUrl = '') {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File ${filePath} not found. Using fallback URL: ${fallbackUrl}`);
    return fallbackUrl;
  }
  
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
  
  const payload = {
    base64: base64Data,
    contentType: contentType,
    fileName: `AD_${adType.toUpperCase()}_${Date.now()}_${fileName.replace(/\s+/g, '_')}`
  };
  
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 [Attempt ${attempt}/${maxRetries}] Uploading ${fileName} to Drive as ${adType}...`);
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000)
      });
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }
      
      if (result.status === 'success') {
        const fileId = result.fileId || (result.link ? result.link.match(/id=([a-zA-Z0-9_-]+)/)?.[1] : null);
        const driveUrl = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` : (result.url || result.link);
        console.log(`✅ Uploaded successfully! URL: ${driveUrl}`);
        return driveUrl;
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxRetries) {
        console.log('Waiting 3 seconds before next retry...');
        await new Promise(res => setTimeout(res, 3000));
      }
    }
  }
  
  console.log(`❌ All upload attempts failed for ${fileName}. Falling back to default URL: ${fallbackUrl}`);
  return fallbackUrl;
}

async function run() {
  console.log('🚀 Starting AI Tester Customer Setup...');
  
  // 1. Locate generated images
  const artifactsDir = 'C:\\Users\\bents\\.gemini\\antigravity\\brain\\6367ea1d-0e50-485d-be7a-67c57326d0e7';
  const files = fs.readdirSync(artifactsDir);
  
  const avatarFile = files.find(f => f.startsWith('ai_tester_avatar') && f.endsWith('.png'));
  const storeFile = files.find(f => f.startsWith('ai_repair_shop') && f.endsWith('.png'));
  const productFile = files.find(f => f.startsWith('ai_product_link') && f.endsWith('.png'));
  
  if (!avatarFile || !storeFile || !productFile) {
    throw new Error('Could not find all required generated images in artifacts directory.');
  }
  
  const avatarPath = path.join(artifactsDir, avatarFile);
  const storePath = path.join(artifactsDir, storeFile);
  const productPath = path.join(artifactsDir, productFile);
  
  // 2. Setup Firebase Admin Credentials using CLI refresh token
  const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('firebase-tools.json not found');
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const refreshToken = config.tokens?.refresh_token;
  if (!refreshToken) {
    throw new Error('No refresh token found in firebase-tools.json');
  }
  
  const tempAdcPath = path.resolve('scripts/temp_adc.json');
  const adcContent = {
    type: 'authorized_user',
    client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    refresh_token: refreshToken
  };
  fs.writeFileSync(tempAdcPath, JSON.stringify(adcContent, null, 2));
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tempAdcPath;
  
  console.log('Initializing Firebase Admin SDK with CLI ADC...');
  initializeApp({
    projectId: 'dh-notebook-69f3b'
  });
  
  const db = getFirestore();
  const auth = getAuth();
  const appId = 'default-app-id';
  
  try {
    // 3. Upload images
    console.log('--- Uploading Images to Google Drive Webhooks ---');
    const avatarUrl = await uploadImageToDrive(
      avatarPath, 
      'AVATAR', 
      DRIVE_AD_URL, 
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60'
    );
    
    await new Promise(res => setTimeout(res, 2000));
    
    const storeImageUrl = await uploadImageToDrive(
      storePath, 
      'STORE', 
      DRIVE_AD_URL, 
      'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&auto=format&fit=crop&q=60'
    );
    
    await new Promise(res => setTimeout(res, 2000));
    
    const productImageUrl = await uploadImageToDrive(
      productPath, 
      'SKU', 
      DRIVE_PRODUCT_URL, 
      'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&auto=format&fit=crop&q=60'
    );
    console.log('-------------------------------------------------\n');
    
    // 4. Create or Retrieve Firebase Auth user
    const email = 'ai.tester@dhnotebook.com';
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`👤 Found existing user account with email ${email} (UID: ${userRecord.uid})`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: email,
          emailVerified: true,
          password: 'Password123!',
          displayName: 'ลูกค้า AI (ผู้ช่วยทดสอบระบบ)',
          photoURL: avatarUrl
        });
        console.log(`👤 Created new user account with email ${email} (UID: ${userRecord.uid})`);
      } else {
        throw error;
      }
    }
    
    const uid = userRecord.uid;
    const accountId = uid.substring(0, 8).toUpperCase();
    
    // 5. Create customer profile doc
    console.log(`📄 Creating customer profile in /users/${uid}...`);
    const userRef = db.collection('users').doc(uid);
    const profileData = {
      uid: uid,
      accountId: accountId,
      customerCode: accountId, // Added for Credit Dashboard search compatibility
      name: 'ลูกค้า AI (ผู้ช่วยทดสอบระบบ)',
      nickname: 'ช่างบอท AI',
      email: email,
      phone: '089-999-9999',
      photoURL: avatarUrl,
      role: 'customer',
      walletBalance: 0,
      creditPoints: 0,
      ecosystem: {
        mapUrl: ''
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(), // Added for delta fetching compatibility
      lastLogin: FieldValue.serverTimestamp()
    };
    await userRef.set(profileData, { merge: true });
    
    // 6. Create store profile docs
    console.log(`🏬 Setting up Store Profile...`);
    const storeData = {
      storeImage: storeImageUrl,
      storeName: 'AI Technical Service (ร้านซ่อมปัญญาประดิษฐ์)',
      description: 'ศูนย์ซ่อมเมนบอร์ดโน๊ตบุ๊คและอุปกรณ์ไอทีชั้นนำระดับพรีเมียม วิเคราะห์อาการด้วยขุมพลังปัญญาประดิษฐ์ รวดเร็ว ปลอดภัย ประกันงานซ่อมนาน 6 เดือน',
      services: 'ซ่อมเมนบอร์ดโน๊ตบุ๊ค, กู้ข้อมูล, ซ่อมคอมพิวเตอร์, ตรวจเช็คระบบด้วย AI',
      openHours: 'ทุกวัน 09:00 - 20:00 น.',
      phone: '089-999-9999',
      messengerUrl: 'https://m.me/ai.technical.service',
      lineUrl: 'https://line.me/ti/p/@aitech',
      youtubeUrl: 'https://youtube.com/c/aitechservice',
      tiktokUrl: 'https://tiktok.com/@aitechservice',
      shopeeUrl: 'https://shopee.co.th/ai-diagnostic-kit',
      lazadaUrl: '',
      websiteUrl: 'https://ai-technical-service.com',
      address: '123 อาคารนวัตกรรม ชั้น 1 แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร',
      landmarks: 'ใกล้สถานีรถไฟฟ้าสายสีแดง สถานีหลักสี่',
      googleMapLink: 'https://maps.google.com/?q=13.8826,100.5822',
      latitude: 13.8826,
      longitude: 100.5822,
      isSupportActive: true,
      pdpaConsent: true,
      galleryImages: [storeImageUrl, productImageUrl],
      updatedAt: FieldValue.serverTimestamp()
    };
    
    const rootStoreRef = db.collection('users').doc(uid).collection('storeProfile').doc('main');
    const artifactStoreRef = db.collection('artifacts').doc(appId).collection('users').doc(uid).collection('storeProfile').doc('main');
    await rootStoreRef.set(storeData);
    await artifactStoreRef.set(storeData);
    
    // 7. Create business card ad and todo
    console.log(`📇 Submitting Business Card ad request...`);
    const adCardId = `AD-CARD-${uid}`;
    const adCardRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('partner_ads').doc(adCardId);
    
    const adCardPayload = {
      id: adCardId,
      type: 'BUSINESS_CARD',
      ownerId: uid,
      title: storeData.storeName,
      description: storeData.description,
      imageUrl: storeData.storeImage,
      targetUrl: storeData.websiteUrl,
      messengerUrl: storeData.messengerUrl,
      lineUrl: storeData.lineUrl,
      phone: storeData.phone,
      partnerName: storeData.storeName,
      services: storeData.services,
      richDescription: storeData.description,
      galleryImages: storeData.galleryImages,
      youtubeUrl: storeData.youtubeUrl,
      tiktokUrl: storeData.tiktokUrl,
      shopeeUrl: storeData.shopeeUrl,
      websiteUrl: storeData.websiteUrl,
      address: storeData.address,
      landmarks: storeData.landmarks,
      openHours: storeData.openHours,
      googleMapLink: storeData.googleMapLink,
      latitude: Number(storeData.latitude),
      longitude: Number(storeData.longitude),
      status: 'PENDING',
      isActive: false,
      creditLimit: -1,
      stats: { views: 0, clicks: 0 },
      updatedAt: FieldValue.serverTimestamp()
    };
    await adCardRef.set(adCardPayload);
    
    const todoCardId = `TODO-${adCardId}`;
    const todoCardRef = db.collection('todos').doc(todoCardId);
    const todoCardPayload = {
      taskId: todoCardId,
      type: 'AD_APPROVAL',
      taskType: 'AD_APPROVAL',
      status: 'pending',
      priority: 'High',
      title: `ตรวจสอบนามบัตร: ${storeData.storeName}`,
      description: `พาร์ทเนอร์อัปเดตข้อมูลและขอเปิดใช้นามบัตรโฆษณา`,
      targetSkuId: adCardId,
      partnerId: uid,
      customerName: storeData.storeName,
      adDetails: adCardPayload,
      requestedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: uid
    };
    await todoCardRef.set(todoCardPayload);
    console.log(`✅ Business card ad & todo submitted!`);
    
    // 8. Create product link ad and todo
    console.log(`🛒 Submitting Product Link ad request...`);
    const adProductId = `AD-PRODUCT-${uid}`;
    const adProductRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('partner_ads').doc(adProductId);
    const adProductSkuRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('user_sku_ads').doc(adProductId);
    
    const adProductPayload = {
      id: adProductId,
      type: 'PRODUCT_LINK',
      ownerId: uid,
      title: 'เครื่องวิเคราะห์เมนบอร์ดอัจฉริยะ (AI Motherboard Diagnostic Kit)',
      description: 'อุปกรณ์ตรวจเช็คและวิเคราะห์อาการเสียของเมนบอร์ดโน๊ตบุ๊คแบบอัตโนมัติ แม่นยำสูง รวดเร็วใน 5 วินาที',
      imageUrl: productImageUrl,
      targetUrl: storeData.shopeeUrl,
      platform: 'shopee',
      price: 5900,
      richDescription: 'สุดยอดเครื่องมือสำหรับช่างซ่อมบอร์ด! เสียบและวิเคราะห์อาการเสียผ่านซอฟต์แวร์ AI แสดงผลลัพธ์ผ่านหน้าจอคอมพิวเตอร์ทันที พร้อมระบุรหัสเสียและชี้จุดบกพร่องบนบอร์ด ช่วยประหยัดเวลาช่างซ่อมลงกว่า 80%',
      partnerName: storeData.storeName,
      costPerImpression: 1,
      status: 'pending',
      creditLimit: 500,
      stats: { views: 0, clicks: 0 },
      createdAt: FieldValue.serverTimestamp()
    };
    await adProductRef.set(adProductPayload);
    await adProductSkuRef.set(adProductPayload);
    
    const todoProductId = `TODO-${adProductId}`;
    const todoProductRef = db.collection('todos').doc(todoProductId);
    const todoProductPayload = {
      taskId: todoProductId,
      type: 'USER_SKU_APPROVAL',
      taskType: 'USER_SKU_APPROVAL',
      status: 'pending',
      priority: 'High',
      title: `ตรวจสอบสินค้าโปรโมท: ${adProductPayload.title}`,
      description: `พาร์ทเนอร์ ${storeData.storeName} ฝากโปรโมท (งบ: 500 Pts)`,
      targetSkuId: adProductId,
      partnerId: uid,
      customerName: storeData.storeName,
      skuDetails: adProductPayload,
      adDetails: adProductPayload,
      adPayload: adProductPayload,
      requestedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: uid
    };
    await todoProductRef.set(todoProductPayload);
    console.log(`✅ Product link ad & todo submitted!`);
    
    // 9. Create billboard ad and todo
    console.log(`📢 Submitting Billboard ad request...`);
    const adBillboardId = `AD-BILLBOARD-${uid}`;
    const adBillboardRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('partner_ads').doc(adBillboardId);
    const adBillboardSubRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('billboard_ads').doc(adBillboardId);
    
    const adBillboardPayload = {
      id: adBillboardId,
      type: 'BILLBOARD',
      ownerId: uid,
      title: 'ฉลองเปิดร้านใหม่ AI Technical Service ซ่อมด่วนลด 20%',
      description: 'ซ่อมเมนบอร์ดโน๊ตบุ๊ค คอมพิวเตอร์ ทุกอาการเสียด้วยระบบ AI โดยช่างผู้เชี่ยวชาญ พร้อมส่วนลดพิเศษ 20% เฉพาะสัปดาห์นี้เท่านั้น!',
      imageUrl: storeImageUrl,
      targetUrl: `${storeData.websiteUrl}/promo`,
      platform: 'other',
      billboardRatio: '16:9',
      partnerName: storeData.storeName,
      costPerImpression: 1,
      status: 'pending',
      creditLimit: 1000,
      stats: { views: 0, clicks: 0 },
      createdAt: FieldValue.serverTimestamp()
    };
    await adBillboardRef.set(adBillboardPayload);
    await adBillboardSubRef.set(adBillboardPayload);
    
    const todoBillboardId = `TODO-${adBillboardId}`;
    const todoBillboardRef = db.collection('todos').doc(todoBillboardId);
    const todoBillboardPayload = {
      taskId: todoBillboardId,
      type: 'BILLBOARD_APPROVAL',
      taskType: 'BILLBOARD_APPROVAL',
      status: 'pending',
      priority: 'High',
      title: `ตรวจสอบแผ่นป้ายโฆษณา: ${adBillboardPayload.title}`,
      description: `พาร์ทเนอร์ ${storeData.storeName} ฝากโปรโมท (งบ: 1000 Pts)`,
      targetSkuId: adBillboardId,
      partnerId: uid,
      customerName: storeData.storeName,
      skuDetails: adBillboardPayload,
      adDetails: adBillboardPayload,
      adPayload: adBillboardPayload,
      requestedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: uid
    };
    await todoBillboardRef.set(todoBillboardPayload);
    console.log(`✅ Billboard ad & todo submitted!`);
    
    console.log('\n======================================================');
    console.log('🎉 AI Tester Customer Setup Completed Successfully!');
    console.log(`Customer UID: ${uid}`);
    console.log(`Customer Account ID: ${accountId}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('======================================================');
    
  } finally {
    // Cleanup temporary ADC file
    if (fs.existsSync(tempAdcPath)) {
      fs.unlinkSync(tempAdcPath);
      console.log('🧹 Cleaned up temporary credentials file.');
    }
  }
}

run().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
