#!/usr/bin/env python3
"""Inline all JS assets into a single index.html for WKWebView (no ES modules)."""
import os, re

dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")
html_path = os.path.join(dist, "index.html")

with open(html_path, "r") as f:
    html = f.read()

# Find all JS files referenced
js_files = re.findall(r'(?:src|href)="\./(assets/[^"]+\.js)"', html)

# Read and concatenate all JS
all_js = ""
for jf in js_files:
    fp = os.path.join(dist, jf)
    if os.path.exists(fp):
        with open(fp, "r") as f:
            all_js += f.read() + "\n"

# Remove script tags and modulepreload tags
html = re.sub(r'<script[^>]*src="\.\/assets\/[^"]*"[^>]*><\/script>\s*', '', html)
html = re.sub(r'<link[^>]*modulepreload[^>]*>\s*', '', html)

# Insert inline script (NOT type="module" — plain script for WKWebView file:// compat)
inline_script = f'<script>\n{all_js}</script>'
html = html.replace('</body>', f'{inline_script}\n</body>')

with open(html_path, "w") as f:
    f.write(html)

print(f"Inlined {len(js_files)} JS files into {html_path}")
print(f"Total JS size: {len(all_js)} chars")
