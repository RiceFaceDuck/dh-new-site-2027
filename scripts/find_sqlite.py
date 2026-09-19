import sqlite3
import os
import re

db_dir = r"C:\Users\bents\.gemini\antigravity\conversations"
targets = [
    "customerSyncService.js",
    "walletFunctions.js",
    "purgeOldSlips.js",
    "verifySlipOcr.js",
    "slipStorageService.js",
    "AdCard.jsx",
    "useAdManager.js",
    "storageService.js"
]

def search_files():
    if not os.path.exists(db_dir):
        print(f"Dir not found: {db_dir}")
        return
        
    for file in os.listdir(db_dir):
        if not file.endswith(".db"): continue
        db_path = os.path.join(db_dir, file)
        
        try:
            con = sqlite3.connect(db_path)
            cur = con.cursor()
            cur.execute("SELECT id, step_payload FROM steps WHERE step_payload IS NOT NULL")
            for row in cur.fetchall():
                step_id = row[0]
                payload = row[1]
                if isinstance(payload, bytes):
                    try:
                        payload = payload.decode('utf-8', errors='ignore')
                    except:
                        continue
                        
                for target in targets:
                    if target in payload and "view_file" in payload:
                        print(f"FOUND {target} in DB: {file}, step: {step_id}")
            con.close()
        except Exception as e:
            pass

search_files()
