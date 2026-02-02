import argparse
from playwright.sync_api import sync_playwright

def run(port):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport (iPhone 12 Pro)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()
        
        target_url = f'http://localhost:{port}'
        print(f"Navigating to {target_url}")
        page.goto(target_url)
        
        # Wait for load - relaxed to domcontentloaded to avoid timeouts
        page.wait_for_load_state('domcontentloaded')
        
        # Wait for React to render
        print("Waiting for content to render...")
        page.wait_for_timeout(3000)
        
        # Check title
        title = page.title()
        print(f"Page Title: {title}")
        
        # Take screenshot
        page.screenshot(path='sanity_check_mobile.png')
        print("Screenshot saved to sanity_check_mobile.png")
        
        # Check if BottomNav is visible (it should be on mobile)
        if page.is_visible("text=Liste") or page.is_visible("text=Semaine"):
             print("BottomNav is visible: SUCCESS")
        else:
             print("BottomNav is NOT visible: FAILURE")
             
        browser.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', default='3002')
    args = parser.parse_args()
    run(args.port)
