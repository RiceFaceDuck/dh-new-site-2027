const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'dh-frontend', 'src');

let totalFilesChecked = 0;
const uxIssues = [];

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
            auditFile(fullPath);
            totalFilesChecked++;
        }
    }
}

function auditFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(__dirname, filePath);
    const fileIssues = [];

    // 1. Check for Mutations without Toast feedback
    if (content.includes('useMutation') && (!content.includes('toast.success') && !content.includes('toast.error'))) {
        fileIssues.push('ใช้ useMutation แต่ไม่มีการแจ้งเตือน (Toast) แก่ผู้ใช้เมื่อสำเร็จ/ล้มเหลว ทำให้ผู้ใช้สับสนว่าเกิดอะไรขึ้น');
    }

    // 2. Check for Loading States on Buttons during Mutation
    if (content.includes('useMutation') && content.includes('<button') && !content.includes('disabled={')) {
        fileIssues.push('ปุ่ม (Button) ไม่ถูก disable ขณะที่กำลังโหลด (Mutation) อาจทำให้ผู้ใช้กดซ้ำได้');
    }

    // 3. Check for Large lists without virtualization (heuristic)
    if (content.includes('.map(') && !content.includes('Virtuoso') && content.split('.map(').length > 2) {
        const mapCount = (content.match(/\.map\(/g) || []).length;
        if (mapCount >= 2 && !content.includes('Virtuoso') && content.length > 2000) {
            fileIssues.push('มีการใช้ .map() หลายจุดเพื่อแสดงผลรายการ อาจทำให้หน้ากระตุกเมื่อข้อมูลเยอะ แนะนำให้ใช้ react-virtuoso');
        }
    }

    // 4. Missing framer-motion in Modals/Dialogs
    if ((content.includes('Modal') || content.includes('Dialog') || content.includes('Popup')) && !content.includes('framer-motion') && !content.includes('motion.')) {
        fileIssues.push('เป็น Component ประเภท Modal/Dialog แต่ไม่มี Animation (framer-motion) ทำให้ดูแข็งกระด้างและขาดความลื่นไหล');
    }

    // 5. Icon buttons without text or aria-label
    if (content.match(/<button[^>]*>\s*<[A-Z][A-Za-z0-9]+[^>]*\/>\s*<\/button>/)) {
        if (!content.includes('aria-label') && !content.includes('title=')) {
            fileIssues.push('มีปุ่มที่เป็นไอคอนล้วนๆ แต่ไม่มี aria-label หรือ title อธิบาย ทำให้ผู้ใช้ (และ Screen Reader) ไม่ทราบหน้าที่ของปุ่ม');
        }
    }

    // 6. Hardcoded colors instead of theme colors (Tailwind)
    if (content.match(/style=\{\{.*color:\s*['"](?:red|blue|green|#[0-9a-fA-F]+)['"].*\}\}/)) {
        fileIssues.push('มีการใช้ Inline Style สีแบบ Hardcoded ควรเปลี่ยนไปใช้สีจาก Tailwind Theme เพื่อความสม่ำเสมอของ UI');
    }

    // 7. Missing Skeleton / Loading indicator for Queries
    if (content.includes('useQuery') && !content.includes('isLoading') && !content.includes('isPending')) {
        fileIssues.push('มีการโหลดข้อมูล (useQuery) แต่ไม่ได้นำสถานะ isLoading มาแสดงผล ทำให้หน้าจออาจว่างเปล่าขณะรอข้อมูล ผู้ใช้อาจคิดว่าระบบค้าง');
    }

    // 8. Image Optimization
    if (content.includes('<img') && !content.includes('loading="lazy"')) {
        fileIssues.push('มีการใช้แท็ก <img> แต่ไม่มีแอตทริบิวต์ loading="lazy" ทำให้โหลดภาพทั้งหมดพร้อมกัน กระทบความเร็วหน้าเว็บ');
    }

    if (fileIssues.length > 0) {
        uxIssues.push({ file: relativePath, issues: fileIssues });
    }
}

walkDir(FRONTEND_DIR);

let report = `📁 **สรุปไฟล์ที่เกี่ยวข้องกับการอัปเดตครั้งนี้ (UX/UI Audit)**\n\n`;
report += `📊 **จำนวนไฟล์ที่ตรวจสอบทั้งหมด:** ${totalFilesChecked} ไฟล์\n`;
report += `🚨 **จำนวนจุดที่พบปัญหา UX/UI:** ${uxIssues.reduce((acc, curr) => acc + curr.issues.length, 0)} จุด (ใน ${uxIssues.length} ไฟล์)\n\n`;

uxIssues.forEach(item => {
    report += `**[${item.file}]**\n`;
    item.issues.forEach(issue => {
        report += `- 🔴 ${issue}\n`;
    });
    report += '\n';
});

fs.writeFileSync('ux_audit_report.md', report);
console.log('Detailed report written to ux_audit_report.md');
