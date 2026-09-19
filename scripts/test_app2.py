import sqlite3
import re
import json

con = sqlite3.connect(r"C:\Users\bents\.gemini\antigravity\conversations\6f49daf2-85d1-46f1-83a7-fec12db65a12.db")
cur = con.cursor()
cur.execute("SELECT idx, step_payload FROM steps WHERE idx IN (839, 841)")
for idx, payload in cur.fetchall():
    text = payload.decode('utf-8', errors='ignore')
    print(f"=== STEP {idx} ===")
    m = re.search(r'replace_file_content\s*[0-9]*\s*(\{.*\})', text)
    if m:
        try:
            data = json.loads(m.group(1))
            print("Instruction:", data.get("Instruction"))
            print("Target:\n", data.get("TargetContent")[:200])
            print("Replacement:\n", data.get("ReplacementContent")[:200])
        except Exception as e:
            print("Error parsing json:", e)
con.close()
