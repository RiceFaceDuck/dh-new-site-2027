import sqlite3
import os
import re
import json

CONV_DB = r"C:\Users\bents\.gemini\antigravity\conversations\6f49daf2-85d1-46f1-83a7-fec12db65a12.db"
OUTPUT_DIR = r"C:\_DH Notebook\_Emergency_Backup\01_Chat_Extracted_Code"

TARGET_FILES = [
    ("Management System/firebase.json", "firebase.json"),
    ("Management System/firestore.rules", "firestore.rules"),
    ("Management System/functions/marketing/ga4AdSyncCron.js", "ga4AdSyncCron.js"),
    ("Management System/dh-backoffice-react/src/pages/managers/components/AdCard.jsx", "AdCard.jsx"),
    ("Management System/dh-frontend/src/components/profile/tabs/hooks/useAdManager.js", "useAdManager.js"),
    ("Management System/dh-backoffice-react/src/firebase/customer/customerSyncService.js", "customerSyncService.js"),
    ("Management System/dh-backoffice-react/src/pages/claims/hooks/useClaimData.js", "useClaimData.js"),
    ("Management System/dh-frontend/src/firebase/storageService.js", "storageService.js"),
    ("Management System/dh-backoffice-react/src/firebase/slipStorageService.js", "slipStorageService.js"),
    ("Management System/storage.rules", "storage.rules"),
    ("Management System/functions/slips/verifySlipOcr.js", "verifySlipOcr.js"),
    ("Management System/functions/inventory/walletFunctions.js", "walletFunctions.js"),
    ("Management System/functions/slips/purgeOldSlips.js", "purgeOldSlips.js"),
    ("Management System/functions/ssr memory cloud_functions.md", "ssr memory cloud_functions.md"),
    ("AGENTS.md", "AGENTS.md"),
    ("Management System/docs/memory/ssr memory security_audit.md", "ssr memory security_audit.md"),
    ("Management System/dh-backoffice-react/src/App.jsx", "App.jsx")
]

con = sqlite3.connect(CONV_DB)
cur = con.cursor()

# Get all steps up to 851
cur.execute("SELECT idx, step_payload FROM steps WHERE idx < 851 ORDER BY idx ASC")
all_steps = cur.fetchall()

def extract_code_from_view(text):
    lines = []
    for l in text.split("\n"):
        m = re.match(r"^\s*(\d+):\s?(.*)$", l)
        if m:
            lines.append(m.group(2))
    return "\n".join(lines)

for rel_path, filename in TARGET_FILES:
    dest_path = os.path.join(OUTPUT_DIR, rel_path.replace("/", os.sep))
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    
    # 1. Find the best/latest view_file step before 851
    best_step = None
    best_lines = 0
    best_content = None

    for idx, payload in all_steps:
        text = payload.decode("utf-8", errors="ignore")
        if filename in text and "Showing lines 1 to" in text:
            # Check if this view_file was actually for this file
            if f"File Path: `file:///" in text and filename in text:
                m = re.search(r"Showing lines 1 to (\d+)", text)
                line_count = int(m.group(1)) if m else 0
                if line_count > best_lines:
                    best_lines = line_count
                    best_step = idx
                    best_content = extract_code_from_view(text)

    if best_content:
        # Save base version
        with open(dest_path + ".base", "w", encoding="utf-8") as f:
            f.write(best_content)
        print(f"Extracted BASE {filename} from step {best_step} ({best_lines} lines)")

        # 2. Now collect all replace_file_content or write_to_file calls after best_step up to 851
        current_content = best_content
        replacements_applied = 0

        for idx, payload in all_steps:
            if idx <= best_step:
                continue
            text = payload.decode("utf-8", errors="ignore")
            if "replace_file_content" in text and filename in text:
                # Extract args json
                m = re.search(r'replace_file_content\s*([0-9]*)\s*(\{.*\})', text)
                if m:
                    try:
                        args = json.loads(m.group(2))
                        target_str = args.get("TargetContent")
                        replace_str = args.get("ReplacementContent")
                        if target_str and replace_str:
                            if target_str in current_content:
                                current_content = current_content.replace(target_str, replace_str, 1)
                                replacements_applied += 1
                            else:
                                # Try CRLF normalized
                                norm_target = target_str.replace("\r\n", "\n")
                                norm_content = current_content.replace("\r\n", "\n")
                                if norm_target in norm_content:
                                    norm_content = norm_content.replace(norm_target, replace_str.replace("\r\n", "\n"), 1)
                                    current_content = norm_content
                                    replacements_applied += 1
                    except:
                        pass

        # Save fully patched/final version
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(current_content)
        print(f"  -> Saved PATCHED {filename} with {replacements_applied} replacements applied.")
    else:
        print(f"WARNING: Could not find full view for {filename}")

con.close()
print("\nExtraction of all 17 files completed!")
