# ๐ค– E2E Bot (Black Horse) Lessons Learned

This file records lessons, encountered issues, and solutions from developing the E2E (Black Horse) testing bot to ensure the bot remains stable and runs smoothly.

## 1. Cart Issues
- **Out of Stock Buffer:** If the bot adds the same item repeatedly until stock depletes, the system hides the "Checkout" button and shows a warning.
  - **Fix:** The bot must ALWAYS "Clear Cart" when entering the cart page or before starting a new checkout, by clicking the trash icon `button:has(svg.lucide-trash-2)`.
  - **Random Item Selection:** Do not make the bot click the very first "ADD TO CART" button because that item might be out of stock but the UI hasn't updated yet. The bot should randomly pick the 3rd, 4th, or 5th item.

## 2. UI Interactions (Buttons & Layouts)
- **Cookie Banner Block:** The Cookie banner often overlaps the "Login" or other buttons, causing Playwright to timeout.
  - **Fix:** The bot must accept cookies (`acceptCookies()`) immediately and use `{ force: true }` to force clicks even if elements are obscured.
- **Checkout Forms:** Input names might not follow standard conventions (e.g., using `name="fullName"` instead of `name="name"`).
  - **Fix:** Selectors MUST use the exact `name="..."` matching the React component to prevent timeouts.

## 3. Bot Architecture
- **Single Responsibility Principle (SRP):** Writing the entire bot in one file (`bot_cross_system.js`) makes it long and hard to maintain.
  - **Fix:** Split code into `pages/`, `services/`, and `scenarios/` so each part can be modified independently (e.g., `ActionService` handles all clicking logic).

## 4. New Checkout Flow & Accordion
- **Checkout Accordion Trap:** Attempting to make the bot click "Next" repeatedly to open the Accordion sequentially often hits bugs where some tabs refuse to open or the bot clicks a hidden DOM element.
  - **Fix:** Instruct the bot to specifically click the desired tab directly. For example, `locator('text="Payment Method"').click()` is faster and more reliable.
- **Slip Upload Visibility:** The file input (`input[type="file"]`) might not appear in the DOM until the bot opens the "Payment Method" tab and selects a method (e.g., "Bank Transfer").

## 5. Empty Cart due to Sync Cancel
- **SPA Navigation Conflict:** If the frontend uses a Debounce (e.g., 500ms) to save the cart to Firestore, and the bot navigates away via Hard Reload (`page.goto('/cart')`) immediately after adding an item, the sync is aborted, resulting in an empty cart in the database.
  - **Fix:** The bot MUST "wait" (`await this.page.waitForTimeout(3000)`) to ensure the frontend finishes syncing data to Firebase before changing pages.

## 6. Creating Customers & POS Billing (The Mystery of "Please specify customer phone number")
- **Silent Firebase Permission Denied:** Admins/Staff cannot create new customers if `firestore.rules` only allows document creation by the account owner. The E2E Bot's save button fails silently because the alert is auto-dismissed.
  - **Fix:** Ensure `firestore.rules` includes `allow create: if isStaff() || ...` so staff can create manual customers.
- **Firestore Data Fetch Limit (Missing New Customers):** In the POS, if `useCustomerData.js` uses `limit(300)` without ordering (`orderBy('createdAt', 'desc')`), newly created customers won't be cached, causing the bot's search to fail.
- **Clock Skew (Local vs Server Time):** Even with the Fetch Limit fixed, if the Delta Fetch logic uses `lastSync = Date.now()`, but the local computer time runs slightly faster than the Firebase server time (`serverTimestamp()`), the query `where('updatedAt', '>', lastSync)` will miss newly created customers!
  - **Ultimate Fix:** ALWAYS add a **Buffer Time (e.g., 5 minutes)** to `lastSync` during Delta Syncs to prevent Clock Skew (`lastSync - 5 * 60 * 1000`).
- **Ambiguous Playwright Dropdown Selectors:** Telling the bot to click `div:has-text("Customer Name")` might cause it to accidentally click the **"Use Walk-in Customer"** button (because that button's text might contain the searched name if not found).
- **String vs Object in Dropdown Props:** Do not fix the wrong issue. Attempting to pass the entire customer object to `handleSelectCustomer(c)` instead of the ID (String) as expected by `usePosActions.js` will break the system further. (Always check types/expected arguments).

## 7. Dynamic Watermarking & Mock Data Standards
- **Watermark Placement Constraint:** The watermark text "AI เน€เธเนเธเธเธนเนเธชเธฃเนเธฒเธเธเนเธญเธกเธนเธฅ" should only be applied in the center of generated mock assets (e.g. transfer slips, product image assets) that are uploaded during the testing flow. It should NOT be injected as a DOM overlay on Playwright browser screenshots, to avoid obscuring the UI layout.
- **Data Suffix Uniformity:** All mock fields filled during automated testing must be cleanly suffixed with `(AI เน€เธเนเธเธเธนเนเธชเธฃเนเธฒเธเธเนเธญเธกเธนเธฅ)` to prevent confusion with real data in audit logs.

## 8. Artifact Screenshot Embedding Standard
- **Artifact Image Copy Requirement:** When presenting screenshots from E2E_Bot tests to the user, ALWAYS copy the `.jpg` files from `C:\DH Notebook\E2E_Bot\screenshots\` into the artifact directory `<appDataDir>\brain\<conversation-id>\e2e_screenshots\` first, and render them inside an artifact markdown document so the UI can render and display the images cleanly.



## ?? Interactive E2E Manual Review Workflow
เมื่อผู้ใช้ต้องการทดสอบ UI/UX แบบหน้าต่อหน้า ให้ปฏิบัติตามลำดับนี้:
1. ม้าดำเข้าทดสอบ (นำทางไปยัง URL)
2. แคปภาพหน้าจอ
3. ส่งภาพกลับ & แจ้ง URL ให้ผู้ใช้เห็นใน Antigravity
4. Antigravity ประเมินก่อน (ผลลัพธ์การแสดงผล/UI UX)
5. รอผู้ใช้ประเมินตาม (ผ่าน/บันทึกปัญหา)
6. บันทึกปัญหา
7. ยืนยันว่าม้าดำไม่ได้แก้ไขโค้ด และตัดสินใจว่าจะแก้ทันทีหรือรวบรวมไว้ก่อน


## ?? Baseline Intelligence: การยกระดับความฉลาดพื้นฐานของม้าดำ
- **การจัดการ Cookie:** ทุกครั้งที่เข้าหน้าเว็บใหม่ ม้าดำต้องตรวจสอบและกดปุ่ม 'ยอมรับทั้งหมด' (Accept All Cookies) อัตโนมัติ เพื่อไม่ให้แบนเนอร์บัง UI หลัก
- **การสำรวจภาพรวม (Auto-Scroll):** ม้าดำต้องรู้จักเลื่อนเมาส์ (Scroll Down) ตรวจสอบเนื้อหาส่วนล่างของเว็บเสมอ เพื่อให้เห็นภาพรวมก่อนแคปหน้าจอส่งมาประเมินผล

- **การวัดประสิทธิภาพ (Performance Measuring):** ม้าดำต้องดึงค่าความเร็วการโหลดหน้าเว็บจาก window.performance.timing เสมอ (เช่น โหลดโครงสร้างเว็บกี่ ms, โหลดเต็มรูปแบบกี่ ms) และแนบเป็นรายงานเวลาแคปหน้าจอ เพื่อช่วยตรวจสอบปัญหาเว็บหน่วงหรือช้า

- **ปรัชญาการเล็งเป้าหมาย (Human-like Targeting):** ห้ามใช้/พึ่งพา \data-testid\ สำหรับการทดสอบ E2E ให้ม้าดำใช้วิธีค้นหาจาก "ข้อความบนจอ" (Visible Text) เสมอ เพื่อให้การทดสอบจำลองพฤติกรรมและการมองเห็นใกล้เคียงความสามารถของมนุษย์มากที่สุด

- **ปัญหา Timeout (Hidden Elements):** ห้ามใช้ [href=...] สำหรับ Navigation ที่ซ่อนอยู่ในเมนูมือถือ หรือโดนทับด้วย UI อื่น เพราะจะทำให้ Playwright Timeout กรณีนี้ให้ใช้ page.goto() ตรงๆ แทนเพื่อความเร็วและแม่นยำ

- **แนวทางการรายงานก่อนทดสอบ:** ก่อนส่งม้าดำออกไปรันสคริปต์ ต้องพิมพ์แจ้งผู้ใช้ล่วงหน้าเสมอว่ากำลังจะไปทดสอบที่ 'หน้าไหน' และ 'URL อะไร'
