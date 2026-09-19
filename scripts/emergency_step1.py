import sqlite3
import os
import re
import json
import urllib.request
import urllib.parse
from html.parser import HTMLParser

BASE_DIR = r"C:\_DH Notebook\_Emergency_Backup"
CONV_DB = r"C:\Users\bents\.gemini\antigravity\conversations\6f49daf2-85d1-46f1-83a7-fec12db65a12.db"
BRAIN_DIR = r"C:\Users\bents\.gemini\antigravity\brain\6f49daf2-85d1-46f1-83a7-fec12db65a12"

# 1. Create directory structure
subdirs = [
    os.path.join(BASE_DIR, "01_Chat_Extracted_Code"),
    os.path.join(BASE_DIR, "02_Investigation_Notes"),
    os.path.join(BASE_DIR, "03_Implementation_Plans"),
    os.path.join(BASE_DIR, "04_Firebase_Deployed_Websites", "dh-notebook-69f3b"),
    os.path.join(BASE_DIR, "04_Firebase_Deployed_Websites", "dh-notebook-frontend"),
    os.path.join(BASE_DIR, "04_Firebase_Deployed_Websites", "dhnotebook-work"),
]
for d in subdirs:
    os.makedirs(d, exist_ok=True)
print("Emergency backup directories created successfully.")

# 2. Extract Investigation Notes
inv1_src = os.path.join(BRAIN_DIR, "Investigation Notes.md")
inv2_src = os.path.join(BRAIN_DIR, "Investigation Notes 2.md")
if os.path.exists(inv1_src):
    with open(inv1_src, "r", encoding="utf-8") as f:
        content = f.read()
    with open(os.path.join(BASE_DIR, "02_Investigation_Notes", "Investigation_Notes_1.md"), "w", encoding="utf-8") as f:
        f.write(content)
    print("Extracted Investigation Notes 1.")

if os.path.exists(inv2_src):
    with open(inv2_src, "r", encoding="utf-8") as f:
        content = f.read()
    with open(os.path.join(BASE_DIR, "02_Investigation_Notes", "Investigation_Notes_2.md"), "w", encoding="utf-8") as f:
        f.write(content)
    print("Extracted Investigation Notes 2.")

# 3. Extract Implementation Plans
plan1_src = os.path.join(BRAIN_DIR, "implementation_plan.md")
plan2_src = os.path.join(BRAIN_DIR, "Implementation Plan 2.md")
plan_wl_src = os.path.join(BRAIN_DIR, "implementation_plan_watchlist.md")

if os.path.exists(plan1_src):
    with open(plan1_src, "r", encoding="utf-8") as f:
        content = f.read()
    with open(os.path.join(BASE_DIR, "03_Implementation_Plans", "Implementation_Plan_1.md"), "w", encoding="utf-8") as f:
        f.write(content)
    print("Extracted Implementation Plan 1.")

if os.path.exists(plan2_src):
    with open(plan2_src, "r", encoding="utf-8") as f:
        content = f.read()
    with open(os.path.join(BASE_DIR, "03_Implementation_Plans", "Implementation_Plan_2.md"), "w", encoding="utf-8") as f:
        f.write(content)
    print("Extracted Implementation Plan 2.")

if os.path.exists(plan_wl_src):
    with open(plan_wl_src, "r", encoding="utf-8") as f:
        content = f.read()
    with open(os.path.join(BASE_DIR, "03_Implementation_Plans", "implementation_plan_watchlist.md"), "w", encoding="utf-8") as f:
        f.write(content)
    print("Extracted Watchlist Implementation Plan.")

print("Notes & Plans extraction completed.")
