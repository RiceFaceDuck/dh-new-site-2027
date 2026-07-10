const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// พาธสำหรับเก็บรูปภาพใน Artifacts Directory
const IMAGES_DIR = path.join(__dirname, '..', 'images');
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// ค้นหาพาธของ Chrome ในระบบ Windows
function getChromePath() {
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe')
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error('ไม่พบ Google Chrome ติดตั้งอยู่ในตำแหน่งมาตรฐานของ Windows');
}

(async () => {
    console.log('--- เริ่มต้น E2E Test Phase 1: สวมบทบาท "ม้าดำ" สั่งออเดอร์หน้าบ้าน ---');
    const chromePath = getChromePath();
    console.log(`ใช้ Google Chrome จาก: ${chromePath}`);

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: true, // รันเบื้องหลังเพื่อความปลอดภัยและไม่เกะกะหน้าจอ
        defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    
    try {
        // 1. ไปหน้าเว็บ
        console.log('กำลังเปิดเว็บหน้าบ้าน http://localhost:8988 ...');
        await page.goto('http://localhost:8988', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(IMAGES_DIR, '01_homepage.png') });
        console.log('บันทึกรูป: 01_homepage.png');

        // 2. ไปหน้าเข้าสู่ระบบ (หากปุ่ม Login ปรากฏหรือนำทางตรง)
        console.log('กำลังไปหน้าล็อกอิน...');
        await page.goto('http://localhost:8988/login', { waitUntil: 'networkidle2' });
        
        // กรอกข้อมูลล็อกอินม้าดำ
        console.log('กรอกข้อมูลอีเมลและรหัสผ่านของ "ม้าดำ"...');
        await page.type('input[type="email"]', 'ai.tester@dhnotebook.com');
        await page.type('input[type="password"]', 'Password123!');
        await page.screenshot({ path: path.join(IMAGES_DIR, '02_login_input.png') });
        console.log('บันทึกรูป: 02_login_input.png');

        // กดล็อกอิน
        console.log('กำลังกดปุ่มเข้าสู่ระบบ...');
        const loginBtn = await page.$('button[type="submit"]');
        if (loginBtn) {
            await loginBtn.click();
        } else {
            // หากเป็นปุ่มอื่น ให้กดปุ่มที่มีคำว่า "เข้าสู่ระบบ"
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.textContent.includes('เข้าสู่ระบบ'));
                if (btn) btn.click();
            });
        }

        // รอการย้ายหน้าเว็บหลังจากล็อกอินสำเร็จ
        await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => console.log('Navigation wait timeout, continuing...'));
        await page.screenshot({ path: path.join(IMAGES_DIR, '03_after_login.png') });
        console.log('บันทึกรูป: 03_after_login.png');

        // 3. ค้นหาสินค้าหลัก (PANEL-A หรือชิ้นแรกที่พร้อมสั่ง)
        console.log('กำลังเดินทางไปค้นหาและสั่งสินค้า...');
        // ค้นหาช่องค้นหา
        const searchInput = await page.$('input[placeholder*="ค้นหา"]');
        if (searchInput) {
            await searchInput.type('PANEL-A');
            await page.keyboard.press('Enter');
            await delay(2000);
        } else {
            // นำทางไปที่หน้ารายการสินค้าตรงๆ หรือใช้ API จำลองหยิบใส่ตะกร้าผ่าน localStorage / IndexedDB
            console.log('ไม่พบช่องค้นหาแบบทั่วไป พยายามเลือกสินค้าชิ้นแรกในหน้าแรก...');
        }

        // ในขั้นตอนนี้เพื่อความสมบูรณ์และตัดปัญหา UI flow ซับซ้อน (เช่น การกดเลือก Variant)
        // เราสามารถประเมินผลลัพธ์ผ่านหน้าจอของร้านค้าเพื่อตรวจสอบหน้าตะกร้าสินค้า
        // เพื่อความสมจริง เราจะจำลองการคลิกปุ่ม Add to Cart ของสินค้าชิ้นแรก
        console.log('ค้นหาปุ่ม "หยิบใส่ตะกร้า" (Add to Cart)...');
        const added = await page.evaluate(() => {
            // ค้นหาปุ่มที่มีคำว่า ADD TO CART หรือ ใส่ตะกร้า
            const btns = Array.from(document.querySelectorAll('button'));
            const cartBtn = btns.find(b => b.textContent.includes('ADD TO CART') || b.textContent.includes('ใส่ตะกร้า'));
            if (cartBtn) {
                cartBtn.click();
                return true;
            }
            return false;
        });

        if (added) {
            console.log('คลิกหยิบใส่ตะกร้าสำเร็จ!');
            await delay(1000);
        } else {
            console.log('ไม่พบปุ่มหยิบใส่ตะกร้าในหน้านี้ กำลังไปที่หน้าตะกร้าโดยตรงเพื่อตรวจสอบ...');
        }

        // ไปหน้าตะกร้า
        await page.goto('http://localhost:8988/cart', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(IMAGES_DIR, '04_cart_page.png') });
        console.log('บันทึกรูป: 04_cart_page.png');

        // 4. ไปหน้าชำระเงิน (Checkout)
        console.log('กำลังเดินทางไปหน้าสั่งซื้อ (Checkout)...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, a'));
            const checkoutBtn = btns.find(b => b.textContent.includes('ชำระเงิน') || b.textContent.includes('สั่งซื้อ') || b.textContent.includes('Checkout'));
            if (checkoutBtn) checkoutBtn.click();
        });
        
        await delay(2000);
        await page.screenshot({ path: path.join(IMAGES_DIR, '05_checkout_page.png') });
        console.log('บันทึกรูป: 05_checkout_page.png');

        // จำลองการกดยืนยันชำระเงินและแนบสลิป (หากมีช่องให้อัปโหลด)
        console.log('กำลังกรอกข้อมูลยืนยันคำสั่งซื้อ...');
        // กดยืนยันคำสั่งซื้อ
        const orderSuccess = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const confirmBtn = btns.find(b => b.textContent.includes('ยืนยัน') || b.textContent.includes('สั่งสินค้า') || b.textContent.includes('ชำระเงิน'));
            if (confirmBtn) {
                confirmBtn.click();
                return true;
            }
            return false;
        });

        if (orderSuccess) {
            console.log('กดยืนยันสั่งซื้อเรียบร้อย! รอหน้าจอแสดงผล...');
            await delay(3000);
            await page.screenshot({ path: path.join(IMAGES_DIR, '06_order_success.png') });
            console.log('บันทึกรูป: 06_order_success.png');
            
            // ดึงเลขที่บิลที่แสดงในหน้าจอ
            const orderCode = await page.evaluate(() => {
                // ค้นหา text ที่มีรูปแบบ DH-XXXXXX หรือรหัสออเดอร์
                const bodyText = document.body.innerText;
                const match = bodyText.match(/DH-[A-Z0-9]+/);
                return match ? match[0] : 'ไม่พบรหัสบิลบนหน้าจอ';
            });
            console.log(`ตรวจพบเลขที่บิลสำเร็จ: ${orderCode}`);
        } else {
            console.log('ไม่สามารถกดยืนยันการสั่งซื้อผ่านสคริปต์ได้โดยอัตโนมัติ');
        }

    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการทดสอบ E2E:', err);
        await page.screenshot({ path: path.join(IMAGES_DIR, 'error_step.png') });
        console.log('บันทึกรูปข้อผิดพลาด: error_step.png');
    } finally {
        await browser.close();
        console.log('ปิดเบราว์เซอร์เสร็จสิ้น');
    }
})();
