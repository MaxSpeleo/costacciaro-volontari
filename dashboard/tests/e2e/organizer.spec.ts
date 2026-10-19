import { test, expect } from "@playwright/test";

// No production writes, no external calls, and no automatic authentication bypass.
// Any unmet prerequisite must FAIL/SKIP explicitly, never be reported as passed.
test.describe("Costacciaro WORKING — organizer smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("costacciaro-dashboard-mode", "test");
    });
    await page.goto("/organizzatori");
  });

  test("page is reachable with the expected dashboard identity", async ({ page }) => {
    await expect(page).toHaveTitle(/Dashboard organizzatori.*Costacciaro 2026/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("guided operations can be opened when organizer dashboard is accessible", async ({ page }) => {
    const menu = page.getByRole("button", { name: /Scegli operazione/i });
    // If authentication gates the dashboard this is NOT a successful UI test.
    await expect(menu, "Dashboard not accessible: organizer authentication is required").toBeVisible({ timeout: 8_000 });
    await menu.click();
    await expect(page.getByText("Azioni consigliate")).toBeVisible();
    await expect(page.getByRole("button", { name: /Assegna volontari/i }).first()).toBeVisible();
  });

  test("test mode message composer rejects empty content without calling backend", async ({ page }) => {
    const menu = page.getByRole("button", { name: /Scegli operazione/i });
    await expect(menu, "Authentication prerequisite must be satisfied, not silently bypassed").toBeVisible({ timeout: 8_000 });
    await menu.click();
    await page.getByRole("button", { name: /Invia un messaggio/i }).first().click();
    const send = page.getByRole("button", { name: /^Invia messaggio$/i });
    await expect(send).toBeVisible();
    await send.click();
    await expect(page.getByText("Inserisci titolo e messaggio.")).toBeVisible();
  });
});
