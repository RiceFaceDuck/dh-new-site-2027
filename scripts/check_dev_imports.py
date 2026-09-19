import urllib.request
import re
import urllib.error

with urllib.request.urlopen("http://localhost:3168/src/App.jsx") as res:
    content = res.read().decode("utf-8")

imports = re.findall(r'from\s+["\']([^"\']+)["\']', content)
dynamic_imports = re.findall(r'import\(["\']([^"\']+)["\']\)', content)
all_imports = set(imports + dynamic_imports)

print(f"Checking {len(all_imports)} imports in App.jsx...")
for imp in all_imports:
    if imp.startswith(".") or imp.startswith("/src/"):
        clean_path = imp.replace("./", "")
        if not clean_path.startswith("/"):
            clean_path = "/src/" + clean_path
        url = "http://localhost:3168" + clean_path
        try:
            with urllib.request.urlopen(url) as r:
                pass
        except urllib.error.HTTPError as e:
            print(f"500 ERROR ON: {url}")
            body = e.read().decode("utf-8", errors="ignore")
            print(body[:400])
        except Exception as e:
            print(f"FAIL: {url} -> {e}")

print("Done checking App.jsx imports.")
