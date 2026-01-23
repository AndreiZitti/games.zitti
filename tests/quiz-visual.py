#!/usr/bin/env python3
"""Visual testing for Quiz game redesign using Playwright."""

import asyncio
from playwright.async_api import async_playwright
import os

SCREENSHOTS_DIR = "tests/screenshots/quiz"
BASE_URL = "http://localhost:3000"

async def setup():
    """Ensure screenshots directory exists."""
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

async def test_quiz_home(page):
    """Test quiz home screen."""
    await page.goto(f"{BASE_URL}/games/quiz")
    await page.wait_for_selector(".quiz-home")
    await page.screenshot(path=f"{SCREENSHOTS_DIR}/01-home.png", full_page=True)
    print("✓ Home screen captured")

async def test_quiz_lobby_desktop(page):
    """Test lobby on desktop."""
    await page.set_viewport_size({"width": 1280, "height": 800})
    await page.goto(f"{BASE_URL}/games/quiz")

    # Click Create Room
    await page.click("text=Create Room")
    await page.fill('input[placeholder*="name" i]', "TestPlayer")
    await page.click("text=Create")

    await page.wait_for_selector(".quiz-lobby")
    await page.screenshot(path=f"{SCREENSHOTS_DIR}/02-lobby-desktop.png", full_page=True)
    print("✓ Lobby (desktop) captured")

async def test_quiz_lobby_mobile(page):
    """Test lobby on mobile."""
    await page.set_viewport_size({"width": 375, "height": 667})
    await page.goto(f"{BASE_URL}/games/quiz")

    await page.click("text=Create Room")
    await page.fill('input[placeholder*="name" i]', "MobilePlayer")
    await page.click("text=Create")

    await page.wait_for_selector(".quiz-lobby")
    await page.screenshot(path=f"{SCREENSHOTS_DIR}/03-lobby-mobile.png", full_page=True)
    print("✓ Lobby (mobile) captured")

async def main():
    """Run all visual tests."""
    await setup()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # Desktop tests
        context = await browser.new_context()
        page = await context.new_page()

        try:
            await test_quiz_home(page)
            await test_quiz_lobby_desktop(page)
        except Exception as e:
            print(f"✗ Desktop test failed: {e}")
            await page.screenshot(path=f"{SCREENSHOTS_DIR}/error-desktop.png")

        await context.close()

        # Mobile tests
        context = await browser.new_context(
            viewport={"width": 375, "height": 667},
            device_scale_factor=2,
        )
        page = await context.new_page()

        try:
            await test_quiz_lobby_mobile(page)
        except Exception as e:
            print(f"✗ Mobile test failed: {e}")
            await page.screenshot(path=f"{SCREENSHOTS_DIR}/error-mobile.png")

        await context.close()
        await browser.close()

    print(f"\nScreenshots saved to {SCREENSHOTS_DIR}/")

if __name__ == "__main__":
    asyncio.run(main())
