#!/usr/bin/env python3
"""Screenshot a live URL (desktop + mobile) on a clean-internet runner, so fonts
and CSS load for real. Saves PNGs to _shots/ for visual verification."""
import os, pathlib
from playwright.sync_api import sync_playwright

URL = os.environ.get("SHOT_URL", "https://anepomniashiy-art.github.io/mainhall-platform/")
OUT = pathlib.Path("_shots"); OUT.mkdir(exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    # Desktop
    pg = b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
    pg.goto(URL, wait_until="networkidle", timeout=90_000)
    pg.wait_for_timeout(3000)  # let webfonts settle
    pg.screenshot(path=str(OUT / "desktop_hero.png"))
    pg.screenshot(path=str(OUT / "desktop_full.png"), full_page=True)
    # Mobile
    m = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=3)
    m.goto(URL, wait_until="networkidle", timeout=90_000)
    m.wait_for_timeout(2500)
    m.screenshot(path=str(OUT / "mobile_hero.png"))
    b.close()
print("SHOTS:", [f.name for f in OUT.iterdir()], "URL:", URL)
