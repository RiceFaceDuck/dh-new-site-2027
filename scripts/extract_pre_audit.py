import sqlite3
import os
import re

CONV_DB = r"C:\Users\bents\.gemini\antigravity\conversations\6f49daf2-85d1-46f1-83a7-fec12db65a12.db"
OUTPUT_DIR = r"C:\_DH Notebook\_Emergency_Backup\01_Chat_Extracted_Code\ORIGINAL_PRE_AUDIT"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# The EXACT step of the FIRST view before any edit in this session:
PRE_AUDIT_STEPS = {
    "firebase.json": (48, "Management System/firebase.json"),
    "firestore.rules": (49, "Management System/firestore.rules"),
    "ga4AdSyncCron.js": (50, "Management System/functions/marketing/ga4AdSyncCron.js"),
    "AdCard.jsx": (86, "Management System/dh-backoffice-react/src/pages/managers/components/AdCard.jsx"),
    "useAdManager.js": (87, "Management System/dh-frontend/src/components/profile/tabs/hooks/useAdManager.js"),
    "customerSyncService.js": (113, "Management System/dh-backoffice-react/src/firebase/customer/customerSyncService.js"),
    "useClaimData.js": (111, "Management System/dh-backoffice-react/src/pages/claims/hooks/useClaimData.js"),
    "storageService.js": (180, "Management System/dh-frontend/src/firebase/storageService.js"),
    "slipStorageService.js": (186, "Management System/dh-backoffice-react/src/firebase/slipStorageService.js"),
    "storage.rules": (174, "Management System/storage.rules"),
    "verifySlipOcr.js": (195, "Management System/functions/slips/verifySlipOcr.js"),
    "walletFunctions.js": (199, "Management System/functions/inventory/walletFunctions.js"),
    "purgeOldSlips.js": (207, "Management System/functions/slips/purgeOldSlips.js"),
    "ssr memory cloud_functions.md": (43, "Management System/functions/ssr memory cloud_functions.md"),
    "ssr memory security_audit.md": (4, "Management System/docs/memory/ssr memory security_audit.md")
}

con = sqlite3.connect(CONV_DB)
cur = con.cursor()

def extract_lines(text):
    lines = []
    for l in text.split("\n"):
        m = re.match(r"^\s*(\d+):\s?(.*)$", l)
        if m:
            lines.append(m.group(2))
    return "\n".join(lines)

for filename, (step_idx, rel_dest) in PRE_AUDIT_STEPS.items():
    cur.execute("SELECT step_payload FROM steps WHERE idx = ?", (step_idx,))
    row = cur.fetchone()
    if not row or not row[0]:
        print(f"Error reading step {step_idx}")
        continue
    text = row[0].decode("utf-8", errors="ignore")
    content = extract_lines(text)
    dest_path = os.path.join(OUTPUT_DIR, rel_dest.replace("/", os.sep))
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"PRE-AUDIT VERIFIED: {filename} from step {step_idx} ({len(content.splitlines())} lines) -> {rel_dest}")

con.close()
print("\nALL PRE-AUDIT ORIGINAL FILES EXTRACTED AND VERIFIED.")
