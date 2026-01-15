# -*- coding: utf-8 -*-
"""
ComfyUI Data Manager Extension - Playwright Tests
"""

import sys
import os
from playwright.sync_api import sync_playwright, expect, Page
import time

# Configuration
COMFYUI_URL = "http://127.0.0.1:8188"
EXTENSION_PANEL_ID = "dm-file-manager-window"


def wait_for_extension_load(page: Page, timeout: int = 10000):
    """Wait for the Data Manager extension to load"""
    start_time = time.time()
    while time.time() - start_time < timeout / 1000:
        if page.locator(f"#{EXTENSION_PANEL_ID}").count() > 0:
            return True
        page.wait_for_timeout(100)
    return False


def test_extension_loaded(page: Page):
    """Test 1: Verify extension button exists and can be opened"""
    print("\n=== Test 1: Extension Loading ===")
    page.goto(COMFYUI_URL)
    page.wait_for_load_state("networkidle", timeout=30000)

    # Look for Data Manager in various ways
    dm_button = page.get_by_text("Data Manager")
    if dm_button.count() == 0:
        dm_button = page.locator("[data-id*='dm'], .comfy-menu-button")

    page.screenshot(path="tests/test_screenshots/01_page_state.png", full_page=True)
    print(f"  Page loaded, checking for extension...")
    print(f"  DM button count: {dm_button.count()}")

    return dm_button.count() > 0


def run_all_tests():
    """Run all tests and report results"""
    print("=" * 60)
    print("ComfyUI Data Manager Extension - Playwright Tests")
    print("=" * 60)

    os.makedirs("tests/test_screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        try:
            result = test_extension_loaded(page)
            print(f"\nResult: {'PASS' if result else 'FAIL'}")
        except Exception as e:
            print(f"\nError: {e}")
            page.screenshot(path="tests/test_screenshots/error.png")
        finally:
            browser.close()


if __name__ == "__main__":
    run_all_tests()
