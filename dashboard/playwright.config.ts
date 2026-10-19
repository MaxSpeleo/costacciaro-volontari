import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.COSTACCIARO_TEST_URL || "http://127.0.0.1:4173";
export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: true,
  retries: 0,
  timeout: 30_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure", video: "retain-on-failure" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.COSTACCIARO_TEST_URL ? undefined : {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/organizzatori",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
