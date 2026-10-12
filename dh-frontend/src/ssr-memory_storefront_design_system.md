# SSR Memory: Storefront UI/UX Retro Design System & Visual Contrast

<usage_workflow>
1. นักพัฒนาหรือผู้ออกแบบปรับแต่งสไตล์หน้าบ้าน (Storefront - Port 8988):
   - กำหนดค่าหลักผ่าน CSS Tokens ใน `src/index.css` ภายใต้บล็อก `@theme` และ `@layer base`
   - เมื่อสร้างหรือแก้ไข Component (Cards, Buttons, Inputs, Panels):
     - สำหรับ Card / Panel ทั่วไป: ใช้ `rounded-md` (0.375rem ≈ 6px) หรือ `rounded-sm` เพื่อให้ได้ทรงกระบอกสี่เหลี่ยมผืนผ้าแบบ Classic Tool / Info Card
     - สำหรับ Action Buttons: ใช้ `rounded-md` (หรือ `rounded-lg` ในกรณีปุ่มเน้นการกดพิเศษ)
     - สำหรับ Shapes / Inner Frames: ใช้กรอบขอบที่กระชับ ไม่พองลม
     - สำหรับขอบและเงา: ใช้ `border-slate-200` (หรือ `#e2e8f0`) ร่วมกับ `shadow-sm` / `shadow-md` แทนเส้นขอบลอยโปร่งแสง
2. จุดยกเว้นทรงกลมโดยสมบูรณ์ (Circular Invariant Protection):
   - ไฟสถานะออนไลน์ (Status dot pulsing) เช่น `bg-emerald-500`
   - รูปประจำตัวผู้ใช้ (User avatar)
   - วงแหวนไอคอนหมุนโหลด (Loading spinners)
   - ป้ายตัวเลขแจ้งเตือนบนตะกร้า (Cart count badge)
   - ปุ่มเลื่อน Toggle switches
   - ทั้งหมดนี้ต้องคงไว้ที่ `rounded-full` เสมอ 100% ห้ามถูก clamp หรือแปลงเป็นสี่เหลี่ยม
3. การตรวจสอบความสม่ำเสมอ:
   - รัน `node tests/verifications/verify_storefront_retro_design.mjs`
   - รัน `node tests/e2e/e2e_storefront_retro_journey.mjs`
</usage_workflow>

<domain_rules>
1. **Classic Curve / Anti-Bubble Rule**: ห้ามใช้ `rounded-2xl`, `rounded-3xl` กับการ์ดและปุ่มทั่วไป เพื่อป้องกันความรู้สึกฟองสบู่แบบ AI สำเร็จรูป (Generic AI Bubble Syndrome)
2. **Tactile Contrast Rule (Anti-Whiteout)**: ห้ามใช้ `border-gray-100` หรือ `border-slate-100` กับการ์ดสีขาวบนพื้นขาว ต้องใช้ `border-slate-200` ร่วมกับเงาคมชัดเพื่อตัดมิติ
3. **Circular Geometry Guard**: ปกป้อง `rounded-full` สำหรับจุดแสดงสถานะ, อวาตาร์ และ Badge วงกลมเท่านั้น
4. **Centralized Token Authority**: ค่ามาตรฐานความโค้งมนและเงาต้องถูกกำกับจาก `src/index.css` เป็นหลัก
5. **Absolute Deployment Ban**: ห้ามรันคำสั่ง deploy หรือ git push ขึ้นรีโมตเด็ดขาด (สถานะล็อก: Severity ⚫ / Priority 🚫 block / Complexity 🛡️block / Risk n/a)
</domain_rules>

<core_schema>
- Entry Point Styling: `dh-frontend/src/index.css` (Tailwind CSS v4)
- Core Tokens Defined:
  - `--radius-xs`: `0.125rem` (2px)
  - `--radius-sm`: `0.25rem` (4px)
  - `--radius-md`: `0.375rem` (6px)
  - `--radius-lg`: `0.5rem` (8px)
  - `--radius-xl` ถึง `--radius-4xl`: ถูก clamp ไว้ที่ `0.5rem` (8px)
  - Universal border reset: `border-slate-200` (`#e2e8f0`)
  - Body canvas: `bg-slate-50` (`#f8fafc`)
- Primary Test Suites:
  - `tests/verifications/verify_storefront_retro_design.mjs` (28/28 assertions PASS)
  - `tests/e2e/e2e_storefront_retro_journey.mjs` (19/19 journey steps PASS)
  - `tests/adversarial/challenger_m1_css_token_calibration.mjs` (28/28 PASS)
  - `tests/adversarial/challenger_m1_visual_contrast_stacking.mjs` (15/15 PASS)
</core_schema>

<third_party>
- ไม่มี Third-party ภายนอกด้าน CSS (ใช้ Tailwind CSS v4 ภายใน build pipeline ของ Vite)
</third_party>

<pitfalls_and_solutions>
1. **ปัญหาเดิม**: บรรดา Component ใช้ `rounded-2xl`, `rounded-3xl` กระจัดกระจาย ทำให้หน้าตาเหมือนฟองสบู่ AI ไร้มิติ และขอบสี `border-gray-100` จางจนกลืนไปกับพื้นขาว กลายเป็นจอขาวโพลน
   - **วิธีแก้**: ควบคุมระดับ Token ใน `index.css` ให้ `--radius-lg` ถึง `--radius-4xl` ไม่เกิน `0.5rem` และเปลี่ยนคลาสใน JSX เป็น `rounded-md` พร้อมยกระดับขอบเป็น `border-slate-200`
2. **ปัญหาเดิม**: การค้นหาแบบ regex ใน CSS bundle อาจชนกับ selector ของ override เอง ทำให้ทดสอบ cascade order ผิดพลาด
   - **วิธีแก้**: ตรวจสอบ full rule declaration (`.border-gray-100{border-color:var(--color-gray-100)}`) เพื่อให้ผลการทดสอบสะท้อน CSS Cascade ที่ถูกต้องแท้จริง
</pitfalls_and_solutions>
