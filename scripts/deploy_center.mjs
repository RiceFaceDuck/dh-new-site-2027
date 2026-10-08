import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const msRoot = path.resolve(__dirname, '..');

// ANSI Color Codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const WHITE = '\x1b[37m';
const GRAY = '\x1b[90m';

function getGitStatus() {
  try {
    const raw = execSync('git status --porcelain', { cwd: msRoot, encoding: 'utf8' });
    const lines = raw.split('\n').filter(l => l.trim().length > 0);
    
    let fe = 0, bo = 0, sa = 0, rules = 0, fn = 0, idx = 0, other = 0;
    for (const l of lines) {
      const file = l.slice(3).trim();
      if (file.startsWith('dh-frontend/')) fe++;
      else if (file.startsWith('dh-backoffice-react/')) bo++;
      else if (file.startsWith('dh-staff-app/')) sa++;
      else if (file.includes('firestore.rules') || file.includes('storage.rules')) rules++;
      else if (file.startsWith('functions/')) fn++;
      else if (file.includes('firestore.indexes.json')) idx++;
      else other++;
    }
    return { total: lines.length, fe, bo, sa, rules, fn, idx, other };
  } catch (e) {
    return { total: 0, fe: 0, bo: 0, sa: 0, rules: 0, fn: 0, idx: 0, other: 0 };
  }
}

function getUnpushedCommits() {
  try {
    const raw = execSync('git log origin/main..HEAD --oneline', { cwd: msRoot, encoding: 'utf8' });
    const lines = raw.split('\n').filter(l => l.trim().length > 0);
    return lines.length;
  } catch (e) {
    return 0;
  }
}

function getIndexesCount() {
  try {
    const p = path.join(msRoot, 'firestore.indexes.json');
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      return (data.indexes || []).length;
    }
  } catch (e) {}
  return 0;
}

function getFunctionsCount() {
  try {
    const p = path.join(msRoot, 'functions', 'index.js');
    if (fs.existsSync(p)) {
      const txt = fs.readFileSync(p, 'utf8');
      const matches = txt.match(/exports\.\w+\s*=/g);
      return matches ? matches.length : 1;
    }
  } catch (e) {}
  return 1;
}

function printDashboard() {
  console.clear();
  const status = getGitStatus();
  const unpushed = getUnpushedCommits();
  const indexesCount = getIndexesCount();
  const funcCount = getFunctionsCount();

  console.log(`${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}${WHITE}              DH NOTEBOOK - MASTER DEPLOYMENT CENTER${RESET}`);
  console.log(`${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}  📊 สรุปสถานะความพร้อม & รายการที่รอ Deploy (Pre-flight Status):${RESET}`);
  console.log(`${GRAY}  ----------------------------------------------------------------------${RESET}`);

  // Git Status
  if (unpushed > 0) {
    console.log(`  • Git Commits รอขึ้น Cloud : ${YELLOW}🟡 [ ${unpushed} commits รอ Push ]${RESET}`);
  } else {
    console.log(`  • Git Commits รอขึ้น Cloud : ${GREEN}🟢 [ 0 commits - ซิงค์ตรงกับ GitHub 100% ]${RESET}`);
  }

  // Components
  console.log(`  • รายการแก้ไขที่รอ Deploy  :`);
  
  if (status.fe > 0) {
    console.log(`      - หน้าร้าน (Frontend)    : ${YELLOW}🟡 มีการแก้ไข ${status.fe} ไฟล์ [รอดำเนินการ Deploy]${RESET}`);
  } else {
    console.log(`      - หน้าร้าน (Frontend)    : ${GREEN}🟢 สะอาด / อัปเดตล่าสุดแล้ว${RESET}`);
  }

  if (status.bo > 0) {
    console.log(`      - หลังร้าน (Backoffice)  : ${YELLOW}🟡 มีการแก้ไข ${status.bo} ไฟล์ [รอดำเนินการ Deploy]${RESET}`);
  } else {
    console.log(`      - หลังร้าน (Backoffice)  : ${GREEN}🟢 สะอาด / อัปเดตล่าสุดแล้ว${RESET}`);
  }

  if (status.sa > 0) {
    console.log(`      - แอปพนักงาน (Staff App) : ${YELLOW}🟡 มีการแก้ไข ${status.sa} ไฟล์ [รอดำเนินการ Deploy]${RESET}`);
  } else {
    console.log(`      - แอปพนักงาน (Staff App) : ${GREEN}🟢 สะอาด / อัปเดตล่าสุดแล้ว${RESET}`);
  }

  if (status.rules > 0) {
    console.log(`  • กฎความปลอดภัย (Rules)    : ${YELLOW}🟡 มีการแก้ไข ${status.rules} ไฟล์ [รอดำเนินการ Deploy]${RESET}`);
  } else {
    console.log(`  • กฎความปลอดภัย (Rules)    : ${GREEN}🟢 กฎ Firestore & Storage ปลอดภัยคงที่${RESET}`);
  }

  if (status.idx > 0) {
    console.log(`  • ดัชนีฐานข้อมูล (Indexes)  : ${YELLOW}🟡 มีการแก้ไขดัชนีใหม่ [รอดำเนินการ Deploy]${RESET}`);
  } else {
    console.log(`  • ดัชนีฐานข้อมูล (Indexes)  : ${GREEN}🟢 พร้อมใช้งาน (${indexesCount} Composite Indexes)${RESET}`);
  }

  if (status.fn > 0) {
    console.log(`  • Cloud Functions          : ${YELLOW}🟡 มีการแก้ไขฟังก์ชัน [รอดำเนินการ Deploy]${RESET}`);
  } else {
    console.log(`  • Cloud Functions          : ${GREEN}🟢 พร้อมใช้งาน (${funcCount} Cloud Functions)${RESET}`);
  }

  console.log(`${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}${WHITE}  [★] กด [ENTER] ทันที  -->  🚀 FULL DEPLOY ครบวงจร (Commit + Push + 3 เว็บ + Rules)${RESET}`);
  console.log(`${GRAY}  (ตัด functions และ indexes ออกจาก Full Deploy เพื่อความปลอดภัยสูงสุด)${RESET}`);
  console.log(`${GRAY}----------------------------------------------------------------------${RESET}`);
  console.log(`  ${BOLD}[1]${RESET} Deploy หน้าร้านหลัก (dh-frontend)`);
  console.log(`  ${BOLD}[2]${RESET} Deploy หลังร้านแอดมิน (dh-backoffice-react)`);
  console.log(`  ${BOLD}[3]${RESET} Deploy แอปพนักงาน (dh-staff-app)`);
  console.log(`  ${BOLD}[4]${RESET} Deploy Cloud Functions (ฟังก์ชันระบบ)`);
  console.log(`  ${BOLD}[5]${RESET} Deploy กฎความปลอดภัย (Firestore & Storage Rules)`);
  console.log(`  ${BOLD}[6]${RESET} Deploy ดัชนีฐานข้อมูล (Firestore Indexes)`);
  console.log(`${GRAY}----------------------------------------------------------------------${RESET}`);
  console.log(`  ${BOLD}[7]${RESET} บันทึกการแก้ไขลงในเครื่อง (Git Commit)`);
  console.log(`  ${BOLD}[8]${RESET} ส่งโค้ดขึ้น GitHub (Git Push origin main)`);
  console.log(`  ${BOLD}[9]${RESET} สำรองฐานข้อมูล Firestore (ดาวน์โหลดข้อมูลจริงลงโฟลเดอร์ backups/ ในเครื่อง)`);
  console.log(`${GRAY}----------------------------------------------------------------------${RESET}`);
  console.log(`  ${BOLD}[0]${RESET} ยกเลิก / ออกจากโปรแกรม`);
  console.log(`${CYAN}======================================================================${RESET}`);
}

function runCmd(cmd, cwd = msRoot) {
  console.log(`\n${CYAN}>>> กำลังทำงาน: ${cmd}${RESET}`);
  const res = spawnSync(cmd, { cwd, shell: true, stdio: 'inherit' });
  return res.status === 0;
}

function ask(questionText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(questionText, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  while (true) {
    printDashboard();
    const choice = await ask(`\n${BOLD}👉 เลือกเมนู (กด [Enter] เพื่อ FULL DEPLOY หรือพิมพ์ 0-9): ${RESET}`);

    if (choice === '0') {
      console.log(`\n${GREEN}ออกจากโปรแกรมเรียบร้อยครับ!${RESET}`);
      process.exit(0);
    }

    // ====================================================================
    // FULL DEPLOY (Commit + Push + 3 เว็บไซต์ + Rules - ไม่รวม Functions / Indexes)
    // ====================================================================
    if (choice === '' || choice.toLowerCase() === 'full') {
      console.log(`\n${YELLOW}${BOLD}======================================================================${RESET}`);
      console.log(`${YELLOW}${BOLD} 🚀 ยืนยัน FULL DEPLOY (Commit + Push + เว็บไซต์ 3 ระบบ + กฎ Rules)${RESET}`);
      console.log(`${YELLOW}${BOLD}======================================================================${RESET}`);
      const confirm = await ask(`คุณต้องการ Full Deploy ใช่หรือไม่? [Y/N, ค่าเริ่มต้น Y]: `);
      if (confirm.toLowerCase() === 'n') {
        console.log(`\nยกเลิกการ Full Deploy กลับสู่เมนูหลัก...`);
        await ask(`กด Enter เพื่อดำเนินการต่อ...`);
        continue;
      }

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Step 1: Git Commit (ถ้ามีไฟล์ตกค้าง)
      const st = getGitStatus();
      if (st.total > 0) {
        console.log(`\n${CYAN}[1/6] ตรวจพบไฟล์แก้ไขตกค้าง ${st.total} ไฟล์ กำลังบันทึก (Git Commit)...${RESET}`);
        let commitMsg = await ask(`กรุณาระบุข้อความ Commit [กด Enter เพื่อใช้ "Deploy release: ${nowStr}"]: `);
        if (!commitMsg) commitMsg = `Deploy release: ${nowStr}`;
        runCmd('git add -A');
        runCmd(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
      } else {
        console.log(`\n${GREEN}[1/6] 🟢 โค้ดในเครื่องสะอาดแล้ว (ไม่มีไฟล์ค้าง ข้ามขั้นตอน Commit)${RESET}`);
      }

      // Step 2: Git Push (ถ้ามี commits รอ push)
      const unpushed = getUnpushedCommits();
      if (unpushed > 0) {
        console.log(`\n${CYAN}[2/6] ตรวจพบ ${unpushed} commits กำลังส่งขึ้น GitHub (Git Push origin main)...${RESET}`);
        if (!runCmd('git push origin main')) {
          const proceed = await ask(`\n${YELLOW}⚠️ Push ขึ้น GitHub ไม่สำเร็จ คุณต้องการ Deploy เว็บไซต์ต่อหรือไม่? [Y/N, ค่าเริ่มต้น Y]: ${RESET}`);
          if (proceed.toLowerCase() === 'n') {
            await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
            continue;
          }
        }
      } else {
        console.log(`\n${GREEN}[2/6] 🟢 ซิงค์ตรงกับ GitHub แล้ว (ไม่มี commit ค้าง ข้ามขั้นตอน Push)${RESET}`);
      }

      // Step 3: Security Rules Only (No indexes)
      console.log(`\n${CYAN}[3/6] Deploying Security Rules (Firestore & Storage)...${RESET}`);
      if (!runCmd('firebase deploy --only firestore:rules,storage')) {
        console.log(`\n${RED}❌ Deploy Rules ล้มเหลว! ยกเลิกการทำงาน${RESET}`);
        await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
        continue;
      }

      // Step 4: Staff App
      console.log(`\n${CYAN}[4/6] Building & Deploying Staff App (dh-staff-app)...${RESET}`);
      if (!runCmd('npm run build', path.join(msRoot, 'dh-staff-app')) ||
          !runCmd('firebase deploy --only hosting:dh-notebook-69f3b')) {
        console.log(`\n${RED}❌ Staff App ล้มเหลว! ยกเลิกการทำงาน${RESET}`);
        await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
        continue;
      }

      // Step 5: Backoffice
      console.log(`\n${CYAN}[5/6] Building & Deploying Backoffice (dh-backoffice-react)...${RESET}`);
      if (!runCmd('npm run build', path.join(msRoot, 'dh-backoffice-react')) ||
          !runCmd('firebase deploy --only hosting:dhnotebook-work')) {
        console.log(`\n${RED}❌ Backoffice ล้มเหลว! ยกเลิกการทำงาน${RESET}`);
        await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
        continue;
      }

      // Step 6: Frontend
      console.log(`\n${CYAN}[6/6] Building & Deploying Frontend (dh-frontend)...${RESET}`);
      if (!runCmd('npm run build', path.join(msRoot, 'dh-frontend')) ||
          !runCmd('firebase deploy --only hosting:dh-notebook-frontend')) {
        console.log(`\n${RED}❌ Frontend ล้มเหลว! ยกเลิกการทำงาน${RESET}`);
        await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
        continue;
      }

      console.log(`\n${GREEN}${BOLD}🎉 [SUCCESS] FULL DEPLOY ทุกเว็บไซต์และกฎ Rules สำเร็จสมบูรณ์ 100%!${RESET}`);
      await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
      continue;
    }

    // 1. Frontend
    if (choice === '1') {
      const confirm = await ask(`\nยืนยันการ Deploy หน้าร้าน (Frontend)? [Y/N, ค่าเริ่มต้น Y]: `);
      if (confirm.toLowerCase() !== 'n') {
        if (runCmd('npm run build', path.join(msRoot, 'dh-frontend'))) {
          runCmd('firebase deploy --only hosting:dh-notebook-frontend');
        }
      }
      await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
      continue;
    }

    // 2. Backoffice
    if (choice === '2') {
      const confirm = await ask(`\nยืนยันการ Deploy หลังร้าน (Backoffice)? [Y/N, ค่าเริ่มต้น Y]: `);
      if (confirm.toLowerCase() !== 'n') {
        if (runCmd('npm run build', path.join(msRoot, 'dh-backoffice-react'))) {
          runCmd('firebase deploy --only hosting:dhnotebook-work');
        }
      }
      await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
      continue;
    }

    // 3. Staff App
    if (choice === '3') {
      const confirm = await ask(`\nยืนยันการ Deploy แอปพนักงาน (Staff App)? [Y/N, ค่าเริ่มต้น Y]: `);
      if (confirm.toLowerCase() !== 'n') {
        if (runCmd('npm run build', path.join(msRoot, 'dh-staff-app'))) {
          runCmd('firebase deploy --only hosting:dh-notebook-69f3b');
        }
      }
      await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
      continue;
    }

    // 4. Cloud Functions (แยกเดี่ยว)
    if (choice === '4') {
      const confirm = await ask(`\nยืนยันการ Deploy Cloud Functions? [Y/N, ค่าเริ่มต้น Y]: `);
      if (confirm.toLowerCase() !== 'n') {
        runCmd('firebase deploy --only functions');
      }
      await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
      continue;
    }

    // 5. Rules
    if (choice === '5') {
      const confirm = await ask(`\nยืนยันการ Deploy กฎความปลอดภัย (Rules)? [Y/N, ค่าเริ่มต้น Y]: `);
      if (confirm.toLowerCase() !== 'n') {
        runCmd('firebase deploy --only firestore:rules,storage');
      }
      await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
      continue;
    }

    // 6. Indexes
    if (choice === '6') {
      const confirm = await ask(`\nยืนยันการ Deploy ดัชนีฐานข้อมูล (Indexes)? [Y/N, ค่าเริ่มต้น Y]: `);
      if (confirm.toLowerCase() !== 'n') {
        runCmd('firebase deploy --only firestore:indexes');
      }
      await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
      continue;
    }

    // 7. Git Commit
    if (choice === '7') {
      const st = getGitStatus();
      if (st.total === 0) {
        console.log(`\n${GREEN}🟢 โค้ดในเครื่องสะอาดเรียบร้อย ไม่มีไฟล์ที่ถูกแก้ไขหรือรอ Commit ครับ${RESET}`);
      } else {
        console.log(`\n${CYAN}[*] ตรวจพบการแก้ไข ${st.total} ไฟล์${RESET}`);
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        let commitMsg = await ask(`ระบุข้อความบันทึกงาน (Commit Message) [กด Enter เพื่อใช้ "Manual commit: ${nowStr}"]: `);
        if (!commitMsg) commitMsg = `Manual commit: ${nowStr}`;
        runCmd('git add -A');
        runCmd(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
      }
      await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
      continue;
    }

    // 8. Git Push
    if (choice === '8') {
      const unpushed = getUnpushedCommits();
      console.log(`\n[*] สถานะ: มี ${unpushed} commits รอ Push`);
      console.log(`[*] กำลังส่งโค้ดขึ้น GitHub (origin main)...`);
      runCmd('git push origin main');
      await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
      continue;
    }

    // 9. DB Backup
    if (choice === '9') {
      console.log(`\n${CYAN}======================================================================${RESET}`);
      console.log(`  💾 สำรองฐานข้อมูล Firestore (Database Backup)`);
      console.log(`  คำอธิบาย: ระบบจะดาวน์โหลดสำเนาตารางข้อมูลจริงจาก Firestore`);
      console.log(`  (users, products, orders, claims, system_logs)`);
      console.log(`  มาบันทึกเป็นไฟล์ .json เก็บไว้ในโฟลเดอร์ backups/ ของเครื่องคอมพิวเตอร์`);
      console.log(`${CYAN}======================================================================${RESET}`);
      const confirm = await ask(`ยืนยันการเริ่มดาวน์โหลดสำรองข้อมูล? [Y/N, ค่าเริ่มต้น Y]: `);
      if (confirm.toLowerCase() !== 'n') {
        runCmd('node scripts/backupDatabase.mjs');
      }
      await ask(`กด Enter เพื่อกลับสู่เมนูหลัก...`);
      continue;
    }

    console.log(`\n${RED}[X] ตัวเลือกไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง${RESET}`);
    await ask(`กด Enter เพื่อลองใหม่...`);
  }
}

main();
