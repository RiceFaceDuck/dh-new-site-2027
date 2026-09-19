import sqlite3
import re
import urllib.parse

con = sqlite3.connect(r"C:\Users\bents\.gemini\antigravity\conversations\6f49daf2-85d1-46f1-83a7-fec12db65a12.db")
cur = con.cursor()

targets = [
    'firebase.json', 'firestore.rules', 'ga4AdSyncCron.js', 'AdCard.jsx',
    'useAdManager.js', 'customerSyncService.js', 'useClaimData.js',
    'storageService.js', 'slipStorageService.js', 'storage.rules',
    'verifySlipOcr.js', 'walletFunctions.js', 'purgeOldSlips.js',
    'ssr memory cloud_functions.md', 'AGENTS.md', 'ssr memory security_audit.md', 'App.jsx'
]

cur.execute("SELECT idx, step_payload FROM steps WHERE idx < 851")
steps = cur.fetchall()

header_re = re.compile(r"File Path:\s*`file:///([^`]+)`")

for t in targets:
    found = []
    for idx, payload in steps:
        text = payload.decode('utf-8', errors='ignore')
        if 'Showing lines 1 to' in text:
            m = header_re.search(text)
            if m:
                path = urllib.parse.unquote(m.group(1)).replace('\\', '/')
                if path.endswith('/' + t) or path.endswith(t):
                    lc_m = re.search(r"Showing lines 1 to (\d+)", text)
                    lc = lc_m.group(1) if lc_m else '?'
                    found.append((idx, lc, path))
    print(f"{t}: {len(found)} views -> {[(f[0], f[1]) for f in found]}")
con.close()
