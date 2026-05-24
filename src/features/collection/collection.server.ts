import type { Page } from "playwright";

const BASE_URL = "https://boardgamegeek.com";

export async function createBggSession(username: string, password: string) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

  const consent = page.locator("button.fc-cta-consent");
  if (await consent.isVisible({ timeout: 3000 }).catch(() => false)) {
    await consent.click();
  }

  await page.locator("#inputUsername").fill(username);
  await page.locator("#inputPassword").fill(password);
  await page.locator(".btn-primary").click();

  await page
    .waitForFunction(
      () => document.title === "BoardGameGeek | Gaming Unplugged Since 2000",
      { timeout: 15000 },
    )
    .catch(() => {
      throw new Error("Login failed — check username and password");
    });

  return { browser, page };
}

export async function getExistingCollectionIds(
  page: Page,
  username: string,
): Promise<number[]> {
  const ids: number[] = [];
  await page.goto(`${BASE_URL}/collection/user/${username}`, {
    waitUntil: "load",
  });
  await page.waitForTimeout(5000);

  let pageCount = 1;
  try {
    const el = page.locator(".geekpages a:last-child").first();
    const pageCountText = await el.textContent({ timeout: 5000 });
    pageCount = +(pageCountText ?? "1");
  } catch {
    // single page or empty collection
  }

  for (let i = 1; i <= pageCount; i++) {
    if (i !== 1) {
      await page.locator("[name='pageset']").first().fill(String(i));
      await page.locator(".geekinput[type='submit']").first().click();
      await page.waitForTimeout(3000);
    }

    const links = page.locator('[id^="results_objectname"] a.primary');
    const count = await links.count();
    for (let j = 0; j < count; j++) {
      const href = await links.nth(j).getAttribute("href");
      if (href) {
        const match = href.match(/\/boardgame(?:expansion)?\/(\d+)/);
        if (match) ids.push(+match[1]);
      }
    }
  }

  return Array.from(new Set(ids));
}

export async function addGameToCollection(
  page: Page,
  bggId: number,
): Promise<string> {
  await page.goto(`${BASE_URL}/boardgame/${bggId}`, { waitUntil: "load" });

  const addBtnSelector = "button[ng-disabled='colltoolbarctrl.loading']";
  await page
    .locator(addBtnSelector)
    .first()
    .waitFor({ state: "attached", timeout: 10000 });
  await page.waitForTimeout(2000);

  await page.evaluate((sel) => {
    const btns = document.querySelectorAll<HTMLButtonElement>(sel);
    for (const btn of btns) {
      if (btn.offsetParent !== null) {
        btn.click();
        return;
      }
    }
  }, addBtnSelector);

  const ownCheckbox = page.locator("[ng-model='item.status.own']");
  await ownCheckbox.waitFor({ state: "visible", timeout: 5000 });
  await ownCheckbox.click();

  await page.locator("[ng-disabled='editctrl.saving']").click();
  await page.waitForTimeout(1000);

  const pageTitle = await page.title();
  return pageTitle.replace(/(.*?) \|.*/, "$1");
}
