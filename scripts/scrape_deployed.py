import os
import re
import urllib.request
import urllib.parse
from html.parser import HTMLParser

BASE_DIR = r"C:\_DH Notebook\_Emergency_Backup\04_Firebase_Deployed_Websites"

DOMAINS = [
    ("dh-notebook-69f3b", "https://dh-notebook-69f3b.web.app"),
    ("dh-notebook-frontend", "https://dh-notebook-frontend.web.app"),
    ("dhnotebook-work", "https://dhnotebook-work.web.app")
]

class ResourceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.resources = set()

    def handle_starttag(self, tag, attrs):
        for attr, val in attrs:
            if attr in ('src', 'href') and val:
                self.resources.add(val)

def fetch_url(url):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.read()
    except Exception as e:
        print(f"  Failed to fetch {url}: {e}")
        return None

def download_site(name, base_url):
    print(f"\n--- Scraping {name} ({base_url}) ---")
    site_dir = os.path.join(BASE_DIR, name)
    os.makedirs(site_dir, exist_ok=True)

    index_data = fetch_url(base_url + "/")
    if not index_data:
        index_data = fetch_url(base_url + "/index.html")
    
    if not index_data:
        print(f"Could not reach {base_url}")
        return

    with open(os.path.join(site_dir, "index.html"), "wb") as f:
        f.write(index_data)
    print("  Saved index.html")

    html_text = index_data.decode('utf-8', errors='ignore')
    parser = ResourceParser()
    parser.feed(html_text)

    # Find additional assets via regex in index.html (like manifest, icons, script imports)
    extra_assets = set(re.findall(r'["\'](/assets/[^"\']+)["\']', html_text))
    all_urls = parser.resources.union(extra_assets)

    downloaded = set()
    queue = list(all_urls)

    while queue:
        rel = queue.pop(0)
        if rel in downloaded or rel.startswith('http://') or rel.startswith('https://') or rel.startswith('data:'):
            continue

        clean_rel = rel.lstrip('/')
        file_url = urllib.parse.urljoin(base_url + '/', clean_rel)
        dest_path = os.path.join(site_dir, clean_rel.replace('/', os.sep))

        data = fetch_url(file_url)
        downloaded.add(rel)

        if data:
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            with open(dest_path, "wb") as f:
                f.write(data)
            print(f"  Downloaded: {clean_rel} ({len(data)} bytes)")

            # If JS bundle, look for dynamically imported chunks!
            if clean_rel.endswith('.js'):
                js_text = data.decode('utf-8', errors='ignore')
                chunks = re.findall(r'["\'](assets/[a-zA-Z0-9_-]+\.js)["\']', js_text)
                for chunk in chunks:
                    if chunk not in downloaded and chunk not in queue:
                        queue.append(chunk)

    print(f"Finished scraping {name}. Total assets: {len(downloaded)}")

for name, url in DOMAINS:
    download_site(name, url)
