"""
Scrape Strudel docs pages and extract code examples.
Saves: dataset/output/scraped_raw.jsonl
"""

import json, re, time, hashlib
from pathlib import Path
import requests
from bs4 import BeautifulSoup
from config import SCRAPE_URLS, MIN_CODE_LENGTH, MAX_CODE_LENGTH

OUT = Path("output/scraped_raw.jsonl")

# Patterns that indicate a line is NOT strudel code
SKIP_PATTERNS = [
    r'^\s*//.*$',           # comment-only lines (ok as part of block, skip lone lines)
    r'import\s+',           # import statements
    r'^\s*#',               # shell/python comments
    r'npm\s+install',
    r'^\s*\$\s+',           # shell commands
]

def looks_like_strudel(code: str) -> bool:
    code = code.strip()
    if len(code) < MIN_CODE_LENGTH or len(code) > MAX_CODE_LENGTH:
        return False
    # Must use at least one Strudel function
    strudel_indicators = [
        r'\bs\(',           # s("...")
        r'\bnote\(',        # note("...")
        r'\bn\(',           # n("...")
        r'\bstack\(',
        r'\bsound\(',
        r'\.lpf\(',
        r'\.s\(',
        r'\.note\(',
        r'euclid',
        r'\.room\(',
        r'\.delay\(',
    ]
    return any(re.search(p, code) for p in strudel_indicators)

def extract_code_blocks(html: str, url: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    blocks = []

    # Strategy 1: <pre><code> blocks
    for pre in soup.find_all("pre"):
        code_el = pre.find("code")
        text = (code_el or pre).get_text()
        if looks_like_strudel(text):
            blocks.append(text.strip())

    # Strategy 2: standalone <code> blocks longer than threshold
    for code_el in soup.find_all("code"):
        if code_el.parent and code_el.parent.name == "pre":
            continue  # already handled
        text = code_el.get_text()
        if looks_like_strudel(text):
            blocks.append(text.strip())

    # Strategy 3: look for data-code or data-content attributes (Strudel REPL widgets)
    for el in soup.find_all(attrs={"data-code": True}):
        text = str(el["data-code"])
        if looks_like_strudel(text):
            blocks.append(text.strip())

    for el in soup.find_all("strudel-editor"):
        if el.string and looks_like_strudel(el.string):
            blocks.append(el.string.strip())

    return blocks

def fingerprint(code: str) -> str:
    return hashlib.md5(re.sub(r'\s+', '', code).encode()).hexdigest()

def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    seen = set()
    results = []

    for url in SCRAPE_URLS:
        print(f"  scraping {url} ...", end=" ", flush=True)
        try:
            resp = requests.get(url, timeout=10,
                                headers={"User-Agent": "StrudelDatasetBuilder/1.0"})
            resp.raise_for_status()
        except Exception as e:
            print(f"SKIP ({e})")
            time.sleep(1)
            continue

        blocks = extract_code_blocks(resp.text, url)
        new = 0
        for code in blocks:
            fp = fingerprint(code)
            if fp in seen:
                continue
            seen.add(fp)
            results.append({"source": "scrape", "url": url, "code": code})
            new += 1

        print(f"{new} new examples")
        time.sleep(0.5)  # be polite

    with OUT.open("w") as f:
        for r in results:
            f.write(json.dumps(r) + "\n")

    print(f"\nSaved {len(results)} scraped examples → {OUT}")

if __name__ == "__main__":
    main()
