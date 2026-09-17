import sqlite3
import os
import re
import sys

BASE_CONV_DIR = r"C:\Users\bents\.gemini\antigravity\conversations"
WORKSPACE_ROOT = r"c:\_DH Notebook\Management System"

EXTRACTION_TARGETS = [
    # (relative_path, [candidate_session_ids], target_filename_in_step)
    ("dh-backoffice-react/src/pages/GenerateSync/GenerateSyncDetails.jsx", ["10c265d5-51c6-443d-b7b2-9348581e3b65"], "GenerateSyncDetails.jsx"),
    ("dh-backoffice-react/src/pages/managers/RoleTierSettings/hooks/useRoleTierSettingsState.js", ["5a3af80b-e7a3-4d2d-bfdc-324af2271855"], "useRoleTierSettingsState.js"),
    ("dh-backoffice-react/src/firebase/customerRefundService.js", ["05d3a2e6-bc69-43d8-8f77-dedefb9526ef", "25b4cad5-aa49-45e3-b89c-e49f676f8bb9"], "customerRefundService.js"),
    ("dh-backoffice-react/src/firebase/inventory/inventoryStatsService.js", ["071e50b7-785e-49eb-aae3-5fe1ebcb24ad"], "inventoryStatsService.js"),
    ("dh-frontend/src/hooks/useNavbarScroll.js", ["2c22179e-344b-4968-86c8-509b9f3546d2"], "useNavbarScroll.js"),
    ("functions/package.json", ["004da24a-d60b-4108-8a55-50826a8dc556"], "package.json"),
    ("functions/index.js", ["004da24a-d60b-4108-8a55-50826a8dc556"], "index.js"),
    ("functions/inventory/nightlyChunkGuard.js", ["004da24a-d60b-4108-8a55-50826a8dc556"], "nightlyChunkGuard.js"),
    ("functions/marketing/ga4AdSyncCron.js", ["f3f6f05b-02f2-4400-b929-c4c2ec4fdff6", "075a207f-5e12-40f6-a69c-854e6580e947"], "ga4AdSyncCron.js"),
    ("functions/slips/verifySlipOcr.js", ["004da24a-d60b-4108-8a55-50826a8dc556"], "verifySlipOcr.js"),
]

def extract_file(target_rel_path, candidate_sessions, filename_hint):
    if isinstance(candidate_sessions, str):
        candidate_sessions = [candidate_sessions]

    dest_path = os.path.join(WORKSPACE_ROOT, target_rel_path)

    for session_id in candidate_sessions:
        db_path = os.path.join(BASE_CONV_DIR, f"{session_id}.db")
        if not os.path.exists(db_path):
            continue

        con = sqlite3.connect(db_path)
        cur = con.cursor()
        # Binary search inside step_payload BLOB
        cur.execute(
            "SELECT idx, step_payload FROM steps WHERE instr(step_payload, ?) > 0 ORDER BY idx DESC",
            (filename_hint.encode('utf-8'),)
        )
        rows = cur.fetchall()

        for idx, raw in rows:
            text = raw.decode("utf-8", errors="ignore")

            # 1. Check for authentic view_file payload
            if "Showing lines 1 to" in text:
                if "does NOT show the entire file contents" in text:
                    continue  # Reject partial view_file slices
                header_match = re.search(r"File Path: `file:///([^`]+" + re.escape(filename_hint) + r")`", text)
                if header_match:
                    start = text.find("Showing lines 1 to")
                    header_end = text.find("\n", start)
                    code_start = text.find("\n", header_end + 1)
                    end = text.find("The above content", code_start)
                    if end == -1:
                        end = text.find("2\x0c", code_start)
                    if end != -1:
                        code_block = text[code_start:end]
                        cleaned_lines = [re.sub(r"^\d+:\s?", "", line) for line in code_block.split("\n")]
                        clean_content = "\n".join(cleaned_lines).strip() + "\n"
                        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                        with open(dest_path, "w", encoding="utf-8") as f:
                            f.write(clean_content)
                        print(f"[+] Restored {target_rel_path} ({len(cleaned_lines)} lines) from session {session_id} step {idx}")
                        return True

            # 2. Check for authentic write_to_file payload
            if "write_to_file" in text and "CodeContent" in text:
                target_match = re.search(r'"TargetFile"\s*:\s*"[^"]*' + re.escape(filename_hint) + r'"', text)
                if target_match:
                    match = re.search(r'"CodeContent"\s*:\s*"((?:[^"\\]|\\.)*)"', text)
                    if match:
                        content = match.group(1).encode('utf-8').decode('unicode_escape')
                        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                        with open(dest_path, "w", encoding="utf-8") as f:
                            f.write(content)
                        print(f"[+] Restored {target_rel_path} via CodeContent from session {session_id} step {idx}")
                        return True

    print(f"[-] Could not find extractable payload for {target_rel_path} in candidate sessions {candidate_sessions}")
    return False

def main():
    print("=== STARTING MONOREPO TRANSCRIPT EXTRACTION ===")
    success = 0
    for rel_path, sids, hint in EXTRACTION_TARGETS:
        if extract_file(rel_path, sids, hint):
            success += 1
    print(f"\nCompleted: {success}/{len(EXTRACTION_TARGETS)} files restored successfully.")

if __name__ == "__main__":
    main()

