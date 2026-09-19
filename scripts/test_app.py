import sqlite3
import re
import urllib.parse

con = sqlite3.connect(r"C:\Users\bents\.gemini\antigravity\conversations\6f49daf2-85d1-46f1-83a7-fec12db65a12.db")
cur = con.cursor()
header_re = re.compile(r"File Path:\s*`file:///([^`]+)`")

cur.execute("SELECT idx, step_payload FROM steps")
for idx, payload in cur.fetchall():
    text = payload.decode('utf-8', errors='ignore')
    if 'App.jsx' in text and 'Showing lines 1 to' in text:
        m = header_re.search(text)
        if m:
            print(f"App.jsx in step {idx}: {urllib.parse.unquote(m.group(1))}")
    if 'AGENTS.md' in text and 'Showing lines 1 to' in text:
        m = header_re.search(text)
        if m:
            print(f"AGENTS.md in step {idx}: {urllib.parse.unquote(m.group(1))}")
con.close()
