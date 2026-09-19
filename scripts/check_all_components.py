import os
import urllib.request
import urllib.error

base_dir = r"C:\_DH Notebook\Management System\dh-backoffice-react\src\components"
errors = []

for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith(".jsx") or f.endswith(".js"):
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, r"C:\_DH Notebook\Management System\dh-backoffice-react").replace("\\", "/")
            url = f"http://localhost:3168/{rel_path}"
            try:
                with urllib.request.urlopen(url) as r:
                    pass
            except urllib.error.HTTPError as e:
                errors.append((url, e.code, e.read().decode("utf-8", errors="ignore")))
            except Exception as e:
                errors.append((url, "ERR", str(e)))

print(f"Scanned {len(files)} components. Errors found: {len(errors)}")
for u, code, msg in errors:
    print(f"\n--- {u} [{code}] ---")
    print(msg[:300])
