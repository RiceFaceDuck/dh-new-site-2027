import sqlite3
import os
import re
import urllib.parse

CONV_DB = r"C:\Users\bents\.gemini\antigravity\conversations\6f49daf2-85d1-46f1-83a7-fec12db65a12.db"
OUTPUT_DIR = r"C:\_DH Notebook\_Emergency_Backup\01_Chat_Extracted_Code"

EXACT_STEPS = {
    "firebase.json": (48, "Management System/firebase.json"),
    "firestore.rules": (211, "Management System/firestore.rules"),
    "ga4AdSyncCron.js": (332, "Management System/functions/marketing/ga4AdSyncCron.js"),
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
    "ssr memory cloud_functions.md": (250, "Management System/functions/ssr memory cloud_functions.md"),
    "ssr memory security_audit.md": (427, "Management System/docs/memory/ssr memory security_audit.md")
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

success_count = 0

for filename, (step_idx, rel_dest) in EXACT_STEPS.items():
    cur.execute("SELECT step_payload FROM steps WHERE idx = ?", (step_idx,))
    row = cur.fetchone()
    if not row or not row[0]:
        print(f"FAILED to fetch step {step_idx} for {filename}")
        continue
    
    text = row[0].decode("utf-8", errors="ignore")
    content = extract_lines(text)
    if not content:
        print(f"FAILED to extract lines for {filename} from step {step_idx}")
        continue
    
    dest_path = os.path.join(OUTPUT_DIR, rel_dest.replace("/", os.sep))
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    line_count = len(content.split("\n"))
    print(f"SUCCESS: Extracted {filename} ({line_count} lines) -> {rel_dest}")
    success_count += 1

# Copy current AGENTS.md and App.jsx as well
agents_src = r"C:\_DH Notebook\AGENTS.md"
if os.path.exists(agents_src):
    with open(agents_src, "r", encoding="utf-8") as f:
        agents_content = f.read()
    dest = os.path.join(OUTPUT_DIR, "AGENTS.md")
    with open(dest, "w", encoding="utf-8") as f:
        f.write(agents_content)
    print(f"SUCCESS: Saved AGENTS.md ({len(agents_content.splitlines())} lines)")
    success_count += 1

app_src = r"C:\_DH Notebook\Management System\dh-backoffice-react\src\App.jsx"
if os.path.exists(app_src):
    with open(app_src, "r", encoding="utf-8") as f:
        app_content = f.read()
    dest = os.path.join(OUTPUT_DIR, "Management System", "dh-backoffice-react", "src", "App.jsx")
    with open(dest, "w", encoding="utf-8") as f:
        f.write(app_content)
    print(f"SUCCESS: Saved App.jsx ({len(app_content.splitlines())} lines)")
    success_count += 1

con.close()
print(f"\n==========================================")
print(f"TOTAL FILES SUCCESSFULLY EXTRACTED: {success_count} / 17")
print(f"==========================================")
