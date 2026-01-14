# -*- coding: utf-8 -*-
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto("http://127.0.0.1:8188")
    page.wait_for_load_state("networkidle", timeout=30000)

    # Get page content
    content = page.content()

    # Look for dm- related elements
    print("=== Looking for Data Manager elements ===")

    # Check for script tags
    scripts = page.locator("script").all()
    print(f"\nFound {len(scripts)} script tags")
    for script in scripts[:10]:
        src = script.get_attribute("src") or ""
        if "dm" in src.lower() or "data" in src.lower():
            print(f"  - {src}")

    # Check for any dm- IDs
    all_elements = page.locator("[id*='dm'], [class*='dm'], [data-id*='dm']").all()
    print(f"\nFound {len(all_elements)} elements with 'dm' in id/class/data-id")

    # Check menu buttons
    menu_buttons = page.locator(".comfy-menu-button, [data-menu]").all()
    print(f"\nFound {len(menu_buttons)} menu buttons")
    for btn in menu_buttons[:5]:
        text = btn.text_content() or ""
        data_id = btn.get_attribute("data-id") or ""
        print(f"  - text: '{text}', data-id: '{data_id}'")

    # Take screenshot
    page.screenshot(path="tests/test_screenshots/inspect.png", full_page=True)
    print("\nScreenshot saved to tests/test_screenshots/inspect.png")

    # Save HTML for inspection
    with open("tests/test_screenshots/page_content.html", "w", encoding="utf-8") as f:
        f.write(content)
    print("HTML content saved to tests/test_screenshots/page_content.html")

    browser.close()
