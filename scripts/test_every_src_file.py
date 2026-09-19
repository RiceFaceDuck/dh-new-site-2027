import os
import urllib.request
import urllib.error

base_dir = r"C:\_DH Notebook\Management System\dh-backoffice-react\src"
errors = []
checked = 0

for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith((".jsx", ".js", ".css")):
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, r"C:\_DH Notebook\Management System\dh-backoffice-react").replace("\\", "/")
            url = f"http://localhost:3168/{rel_path}"
            checked += 1
            try:
                with urllib.request.urlopen(url) as r:
                    pass
            except urllib.error.HTTPError as e:
                errors.append((rel_path, e.code, e.read().decode("utf-8", errors="ignore")))
            except Exception as e:
                errors.append((rel_path, "ERR", str(e)))

print(f"Scanned {checked} files in src/. Total 500 errors: {len(errors)}")
for rel, code, body in errors:
    print(f"\n[500 ERROR] {rel}:")
    for line in body.split("\n")[:10]:
        print("  ", line)
